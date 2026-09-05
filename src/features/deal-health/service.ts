import { requireAuth } from '@/lib/auth/rbac';
import { AuthorizationError, BusinessError } from '@/lib/errors';
import { findHealthByQuote, listHealthRecords } from './repository';

export async function listDealHealth() {
  const user = await requireAuth();
  const records = await listHealthRecords();
  if (user.role === 'CUSTOMER') return records.filter(({ quotation }) => quotation.customerId === user.customerId);
  if (user.role === 'SALES_EXECUTIVE') return records.filter(({ quotation }) => quotation.salesExecId === user.userId);
  return records;
}
export async function getDealHealth(quoteId: string) {
  const user = await requireAuth();
  const record = await findHealthByQuote(quoteId);
  if (!record) throw new BusinessError('Deal health record not found', 'NOT_FOUND', 404);
  if (user.role === 'CUSTOMER' && record.quotation.customerId !== user.customerId) throw new AuthorizationError();
  if (user.role === 'SALES_EXECUTIVE' && record.quotation.salesExecId !== user.userId) throw new AuthorizationError();
  return record;
}
