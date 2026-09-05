import { recordAudit } from '@/features/audit/service';
import { recommendAllocation, validateOverride } from '@/engines/fulfillment.engine';
import { requireAuth, requirePermission } from '@/lib/auth/rbac';
import { AuthorizationError, BusinessError } from '@/lib/errors';
import { createInvoiceForOrder } from '@/features/billing/service';
import { confirmAllocationsInput, fulfillmentStatusInput } from './types';
import { findFulfillment, listFulfillmentsFor, listInventory, listRequiredItems, listWarehouses, persistAllocations, setFulfillmentStatus } from './repository';

export async function listFulfillments() {
  const user = await requireAuth();
  if (user.role !== 'CUSTOMER') await requirePermission('MANAGE_WAREHOUSES');
  const rows=await listFulfillmentsFor(user.role==='CUSTOMER'?user.customerId??'':undefined);
  return Promise.all(rows.filter(row=>user.role!=='SALES_EXECUTIVE'||row.quotation.salesExecId===user.userId).map(row=>getFulfillment(row.fulfillment.id)));
}

function assertVisible(user: Awaited<ReturnType<typeof requireAuth>>, record: NonNullable<Awaited<ReturnType<typeof findFulfillment>>>) {
  if (user.role === 'CUSTOMER' && record.quotation.customerId !== user.customerId) throw new AuthorizationError();
  if (user.role === 'SALES_EXECUTIVE' && record.quotation.salesExecId !== user.userId) throw new AuthorizationError();
}
async function getRecord(orderId: string) {
  const record = await findFulfillment(orderId);
  if (!record) throw new BusinessError('Fulfillment not found', 'NOT_FOUND', 404);
  return record;
}
export async function getFulfillment(orderId: string) {
  const user = await requireAuth();
  const record = await getRecord(orderId);
  assertVisible(user, record);
  if(user.role==='CUSTOMER')return {...record,quotation:{id:record.quotation.id,customerId:record.quotation.customerId},};
  return record;
}
export async function recommendFulfillment(orderId: string) {
  const user = await requirePermission('MANAGE_WAREHOUSES');
  const record = await getRecord(orderId);
  assertVisible(user, record);
  const [items, warehouseRows, inventoryRows] = await Promise.all([
    listRequiredItems(record.quotation.id), listWarehouses(), listInventory(),
  ]);
  return recommendAllocation(items, warehouseRows, inventoryRows.map((item) => ({
    ...item, availableQty: item.quantityAvailable - item.quantityReserved + record.allocations.filter(a=>a.productId===item.productId&&a.warehouseId===item.warehouseId).reduce((n,a)=>n+a.allocatedQty,0),
  })));
}
export async function confirmFulfillment(orderId: string, input: unknown) {
  const user=await requirePermission('MANAGE_WAREHOUSES');
  const record = await getRecord(orderId);
  assertVisible(user,record);
  if (!['PENDING', 'PARTIAL', 'BACKORDERED'].includes(record.fulfillment.status)) {
    throw new BusinessError('Fulfillment cannot be allocated in its current state', 'INVALID_STATE', 409);
  }
  const values = confirmAllocationsInput.parse(input);
  const requiredItems = await listRequiredItems(record.quotation.id);
  const inventoryRows = (await listInventory()).map((item) => ({
    ...item, availableQty: item.quantityAvailable - item.quantityReserved + record.allocations.filter(a=>a.productId===item.productId&&a.warehouseId===item.warehouseId).reduce((n,a)=>n+a.allocatedQty,0),
  }));
  const allocations = new Map<string, (typeof values.allocations)[number]>();
  for (const allocation of values.allocations) {
    const key = `${allocation.warehouseId}:${allocation.productId}`;
    const previous = allocations.get(key);
    allocations.set(key, { ...allocation, allocatedQty: allocation.allocatedQty + (previous?.allocatedQty ?? 0) });
  }
  for (const allocation of allocations.values()) {
    const validation = validateOverride(allocation, inventoryRows);
    if (!validation.valid) throw new BusinessError(validation.reason ?? 'Invalid allocation', 'INVALID_ALLOCATION', 409);
  }
  const requiredByProduct = new Map(requiredItems.map((item) => [item.productId, item.quantity]));
  const allocatedByProduct = new Map<string, number>();
  for (const allocation of allocations.values()) {
    if (!requiredByProduct.has(allocation.productId)) throw new BusinessError('Allocation contains an unexpected product', 'INVALID_ALLOCATION', 400);
    allocatedByProduct.set(allocation.productId, (allocatedByProduct.get(allocation.productId) ?? 0) + allocation.allocatedQty);
  }
  for (const [productId, allocated] of allocatedByProduct) {
    if (allocated > (requiredByProduct.get(productId) ?? 0)) throw new BusinessError('Allocated quantity exceeds ordered quantity', 'INVALID_ALLOCATION', 400);
  }
  const result=await persistAllocations(record.fulfillment.id, record.order?.id ?? null, [...allocations.values()], requiredItems);
  await recordAudit({actorId:user.userId,actorRole:user.role,entity:'Quotation',entityId:record.quotation.id,action:'ALLOCATE_STOCK',newValue:result});
  return result;
}

export async function advanceFulfillment(orderId: string, input: unknown) {
  const user=await requirePermission('MANAGE_WAREHOUSES');
  const record = await getRecord(orderId);
  assertVisible(user,record);
  const values = fulfillmentStatusInput.parse(input);
  const valid = (values.status === 'SHIPPED' && record.fulfillment.status === 'ALLOCATED') ||
    (values.status === 'DELIVERED' && record.fulfillment.status === 'SHIPPED');
  if (!valid) throw new BusinessError(`Cannot move fulfillment from ${record.fulfillment.status} to ${values.status}`, 'INVALID_STATE', 409);
  const fulfillment = await setFulfillmentStatus(record.fulfillment.id, record.order?.id ?? null, record.quotation.id, values.status);
  const invoice = values.status === 'DELIVERED' && record.order ? await createInvoiceForOrder(record.order.id) : null;
  await recordAudit({actorId:user.userId,actorRole:user.role,entity:'Quotation',entityId:record.quotation.id,action:'FULFILLMENT_'+values.status});
  return { fulfillment, invoice };
}
