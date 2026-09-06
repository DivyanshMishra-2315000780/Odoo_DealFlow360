import { recordAudit } from '@/features/audit/service';
import { findUserById } from '@/features/auth/repository';
import { requireAuth, requirePermission } from '@/lib/auth/rbac';
import { AuthorizationError, BusinessError } from '@/lib/errors';
import { assignQuoteRequest, findQuoteRequest, insertQuoteRequest, listQuoteRequestsFor } from './repository';
import { assignQuoteRequestInput, createQuoteRequestInput } from './types';

export async function createQuoteRequest(input: unknown) {
  const user = await requireAuth();
  if (user.role !== 'CUSTOMER' || !user.customerId) throw new AuthorizationError('Customer account required');
  const values = createQuoteRequestInput.parse(input);
  const request = await insertQuoteRequest({
    customerId: user.customerId, title: values.title, description: values.description,
    budget: values.budget, targetDate: values.targetDate, metadata: values.metadata,
  }, values.items);
  await recordAudit({ actorId: user.userId, actorRole: user.role, entity: 'QuoteRequest', entityId: request.id, action: 'REQUEST_QUOTE' });
  return request;
}

export async function listQuoteRequests() {
  const user = await requireAuth();
  if (!['CUSTOMER', 'SALES_EXECUTIVE', 'SALES_MANAGER', 'ADMIN'].includes(user.role)) throw new AuthorizationError();
  return listQuoteRequestsFor(
    user.role === 'CUSTOMER' ? user.customerId : null,
    user.role === 'SALES_EXECUTIVE' ? user.userId : null,
  );
}

export async function getQuoteRequest(id: string) {
  const user = await requireAuth();
  if (!['CUSTOMER', 'SALES_EXECUTIVE', 'SALES_MANAGER', 'ADMIN'].includes(user.role)) throw new AuthorizationError();
  const request = await findQuoteRequest(id);
  if (!request) throw new BusinessError('Quote request not found', 'NOT_FOUND', 404);
  if (user.role === 'CUSTOMER' && request.customerId !== user.customerId) throw new AuthorizationError();
  if (user.role === 'SALES_EXECUTIVE' && request.assignedSalesExecId && request.assignedSalesExecId !== user.userId) throw new AuthorizationError();
  return request;
}

export async function claimQuoteRequest(id: string, input: unknown) {
  const user = await requirePermission('QUOTE_CREATE');
  const values = assignQuoteRequestInput.parse(input);
  const assignee = user.role === 'SALES_EXECUTIVE' ? user.userId : values.assignedSalesExecId;
  if (!assignee) throw new BusinessError('A sales executive is required', 'VALIDATION_ERROR', 400);
  const salesExecutive = await findUserById(assignee);
  if (!salesExecutive || !salesExecutive.active || salesExecutive.role !== 'SALES_EXECUTIVE') {
    throw new BusinessError('Assignee must be an active sales executive', 'INVALID_ASSIGNEE', 400);
  }
  const request = await assignQuoteRequest(id, assignee);
  if (!request) throw new BusinessError('Quote request is unavailable or already assigned', 'INVALID_STATE', 409);
  await recordAudit({ actorId: user.userId, actorRole: user.role, entity: 'QuoteRequest', entityId: id, action: 'ASSIGN', newValue: { assignedSalesExecId: assignee } });
  return request;
}
