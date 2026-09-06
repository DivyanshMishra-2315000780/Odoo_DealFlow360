import { requireAuth } from '@/lib/auth/rbac';
import { AuthorizationError, BusinessError } from '@/lib/errors';
import { findHealthByQuote, listHealthRecords } from './repository';

export async function listDealHealth() {
  const user = await requireAuth();
  const records = await listHealthRecords();
  if (user.role === 'CUSTOMER') throw new AuthorizationError('Deal health is an internal commercial report');
  if (user.role === 'SALES_EXECUTIVE') return records.filter(({ quotation }) => quotation.salesExecId === user.userId);
  return records;
}
export async function getDealHealth(quoteId: string) {
  const user = await requireAuth();
  const record = await findHealthByQuote(quoteId);
  if (!record) throw new BusinessError('Deal health record not found', 'NOT_FOUND', 404);
  if (user.role === 'CUSTOMER') throw new AuthorizationError();
  if (user.role === 'SALES_EXECUTIVE' && record.quotation.salesExecId !== user.userId) throw new AuthorizationError();
  return record;
}
