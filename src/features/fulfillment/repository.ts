import { BusinessError } from '@/lib/errors';
import { and, desc, eq, or, sql } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { db } from '@/db';
import {
  products, categories, customers, backorders, fulfillmentAllocations, fulfillments, inventory, quotationLines, quotations, salesOrders, warehouses,
} from '@/db/schema';

export async function listFulfillmentsFor(customerId?: string) {
  const query = db.select({ fulfillment: fulfillments, quotation: quotations, order: salesOrders }).from(fulfillments)
    .innerJoin(quotations, eq(fulfillments.quotationId, quotations.id))
    .leftJoin(salesOrders, eq(fulfillments.orderId, salesOrders.id))
    .orderBy(desc(fulfillments.createdAt));
  return customerId !== undefined ? query.where(eq(quotations.customerId, customerId)) : query;
}

export async function findFulfillment(orderId: string) {
  const [record] = await db.select({ fulfillment: fulfillments, quotation: quotations, order: salesOrders }).from(fulfillments)
    .innerJoin(quotations, eq(fulfillments.quotationId, quotations.id))
    .leftJoin(salesOrders, eq(fulfillments.orderId, salesOrders.id))
    .where(or(eq(fulfillments.id, orderId), eq(fulfillments.orderId, orderId), eq(fulfillments.quotationId, orderId))).limit(1);
  if (!record) return null;
  const [allocations, shortages] = await Promise.all([
    db.select().from(fulfillmentAllocations).where(eq(fulfillmentAllocations.fulfillmentId, record.fulfillment.id)),
    db.select().from(backorders).where(eq(backorders.fulfillmentId, record.fulfillment.id)),
  ]);
  const [customer]=await db.select().from(customers).where(eq(customers.id,record.quotation.customerId)).limit(1);
  const items=await db.select({line:quotationLines,product:products}).from(quotationLines).innerJoin(products,eq(quotationLines.productId,products.id)).where(eq(quotationLines.quotationId,record.quotation.id));
  const warehouseRows=await db.select().from(warehouses);
  return { ...record, customer, items:items.map(({line,product})=>({productId:line.productId,productName:product.name,quantity:line.quantity})),allocations:allocations.map(a=>({...a,warehouseName:warehouseRows.find(w=>w.id===a.warehouseId)?.name})), backorders: shortages };
}

export async function listRequiredItems(quotationId: string) {
  const rows=await db.select({productId:quotationLines.productId,quantity:quotationLines.quantity,recurring:quotationLines.isRecurring,category:categories.name})
    .from(quotationLines).innerJoin(products,eq(quotationLines.productId,products.id)).innerJoin(categories,eq(products.categoryId,categories.id)).where(eq(quotationLines.quotationId,quotationId));
  const totals=new Map<string,number>();
  for(const row of rows)if(!row.recurring && !/service|software/i.test(row.category))totals.set(row.productId,(totals.get(row.productId)??0)+row.quantity);
  return [...totals].map(([productId,quantity])=>({productId,quantity}));
}
export const listWarehouses = () => db.select().from(warehouses).where(eq(warehouses.active, true));
export const listInventory = () => db.select().from(inventory);

export async function persistAllocations(
  fulfillmentId: string,
  orderId: string | null,
  allocations: Array<{ productId: string; warehouseId: string; allocatedQty: number }>,
  requiredItems: Array<{ productId: string; quantity: number }>,
) {
  const previous=await db.select().from(fulfillmentAllocations).where(eq(fulfillmentAllocations.fulfillmentId,fulfillmentId));
  for(const old of previous)await db.update(inventory).set({quantityReserved:sql`${inventory.quantityReserved} - ${old.allocatedQty}`}).where(and(eq(inventory.warehouseId,old.warehouseId),eq(inventory.productId,old.productId)));
  await db.delete(fulfillmentAllocations).where(eq(fulfillmentAllocations.fulfillmentId,fulfillmentId));
  await db.delete(backorders).where(eq(backorders.fulfillmentId,fulfillmentId));
  const saved = allocations.length ? await db.insert(fulfillmentAllocations).values(allocations.map((allocation) => ({
    id: uuid(), fulfillmentId, ...allocation, isManualOverride: true,
  }))).returning() : [];
  for (const allocation of allocations) {
    const reserved = await db.update(inventory).set({
      quantityReserved: sql`${inventory.quantityReserved} + ${allocation.allocatedQty}`, updatedAt: new Date(),
    }).where(and(
      eq(inventory.warehouseId, allocation.warehouseId),
      eq(inventory.productId, allocation.productId),
      sql` ${inventory.quantityAvailable} - ${inventory.quantityReserved} >= ${allocation.allocatedQty}`,
    )).returning();
    if(!reserved.length)throw new BusinessError('Inventory changed; refresh the allocation','INSUFFICIENT_STOCK',409);
  }
  const allocatedByProduct = new Map<string, number>();
  for (const allocation of allocations) {
    allocatedByProduct.set(allocation.productId, (allocatedByProduct.get(allocation.productId) ?? 0) + allocation.allocatedQty);
  }
  const shortages = requiredItems.flatMap((item) => {
    const shortage = item.quantity - (allocatedByProduct.get(item.productId) ?? 0);
    return shortage > 0 ? [{
      id: uuid(), fulfillmentId, productId: item.productId, requiredQty: item.quantity,
      backorderedQty: shortage, status: 'OPEN',
    }] : [];
  });
  if (shortages.length) await db.insert(backorders).values(shortages);
  const status = shortages.length ? 'PARTIAL' : 'ALLOCATED';
  const [fulfillment] = await db.update(fulfillments).set({ status, updatedAt: new Date() })
    .where(eq(fulfillments.id, fulfillmentId)).returning();
  if (orderId) await db.update(salesOrders).set({ status: 'FULFILLMENT', updatedAt: new Date() }).where(eq(salesOrders.id, orderId));
  return { fulfillment, allocations: saved, backorders: shortages };
}

export async function setFulfillmentStatus(
  fulfillmentId: string,
  orderId: string | null,
  quotationId: string,
  status: 'SHIPPED' | 'DELIVERED',
) {
  const [fulfillment] = await db.update(fulfillments).set({ status, updatedAt: new Date() })
    .where(eq(fulfillments.id, fulfillmentId)).returning();
  if (status === 'SHIPPED') {
    const allocations=await db.select().from(fulfillmentAllocations).where(eq(fulfillmentAllocations.fulfillmentId,fulfillmentId));
    for(const allocation of allocations)await db.update(inventory).set({quantityAvailable:sql`${inventory.quantityAvailable} - ${allocation.allocatedQty}`,quantityReserved:sql`${inventory.quantityReserved} - ${allocation.allocatedQty}`}).where(and(eq(inventory.warehouseId,allocation.warehouseId),eq(inventory.productId,allocation.productId)));

    await db.update(fulfillmentAllocations).set({ shippedQty: sql`${fulfillmentAllocations.allocatedQty}` })
      .where(eq(fulfillmentAllocations.fulfillmentId, fulfillmentId));
  }
  if (orderId) {
    await db.update(salesOrders).set({ status, updatedAt: new Date() }).where(eq(salesOrders.id, orderId));
  }
  if (status === 'DELIVERED') {
    await db.update(quotations).set({ status: 'BILLING', updatedAt: new Date() }).where(eq(quotations.id, quotationId));
  }
  return fulfillment;
}
