import { requireAuth } from '@/lib/auth/rbac';
import { dashboardCounts } from './repository';
import type { DashboardSummary } from './types';

export async function getDashboard(): Promise<DashboardSummary> {
  const user = await requireAuth();
  const scopeId = user.role === 'CUSTOMER' ? user.customerId ?? '' : user.userId;
  return { role: user.role, ...(await dashboardCounts(scopeId, user.role)) };
}
