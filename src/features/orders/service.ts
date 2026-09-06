import { requireAuth } from '@/lib/auth/rbac';
import { AuthorizationError, BusinessError } from '@/lib/errors';
import { findOrder, listOrdersFor } from './repository';

export async function listOrders() {
  const user = await requireAuth();
  return listOrdersFor(
    user.role === 'CUSTOMER' ? user.customerId ?? '' : undefined,
    user.role === 'SALES_EXECUTIVE' ? user.userId : undefined,
  );
}

export async function getOrder(id: string) {
  const user = await requireAuth();
  const order = await findOrder(id);
  if (!order) throw new BusinessError('Order not found', 'NOT_FOUND', 404);
  if (user.role === 'CUSTOMER' && order.order.customerId !== user.customerId) throw new AuthorizationError();
  if (user.role === 'SALES_EXECUTIVE' && order.quotation.salesExecId !== user.userId) throw new AuthorizationError();
  return order;
}
