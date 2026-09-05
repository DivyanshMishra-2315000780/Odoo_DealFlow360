import { findQuote } from '@/features/quotes/repository';
import { requireAuth, requirePermission } from '@/lib/auth/rbac';
import { AuthorizationError, BusinessError } from '@/lib/errors';
import { createInvoiceForOrderRecord, findBilling, listInvoicesFor } from './repository';

export async function listInvoices() {
  const user = await requireAuth();

  const rows=await listInvoicesFor(user.role==='CUSTOMER'?user.customerId??'':undefined);
  const result=[];
  for(const row of rows){const quote=row.quotationId?await findQuote(row.quotationId):null;if(user.role==='SALES_EXECUTIVE'&&quote?.salesExecId!==user.userId)continue;result.push(await findBilling(row.id));}
  return result;

}

export async function createInvoiceForOrder(orderId: string) {
  const invoice = await createInvoiceForOrderRecord(orderId);
  if (!invoice) throw new BusinessError('Order not found', 'NOT_FOUND', 404);
  return invoice;
}
export async function getBilling(orderId: string) {
  const user = await requireAuth();

  const billing = await findBilling(orderId);
  if (!billing) throw new BusinessError('Billing record not found', 'NOT_FOUND', 404);
  if (user.role === 'CUSTOMER' && billing.invoice.customerId !== user.customerId) throw new AuthorizationError();
  if(user.role==='SALES_EXECUTIVE'){const quote=billing.invoice.quotationId?await findQuote(billing.invoice.quotationId):null;if(quote?.salesExecId!==user.userId)throw new AuthorizationError();}
  return billing;
}
