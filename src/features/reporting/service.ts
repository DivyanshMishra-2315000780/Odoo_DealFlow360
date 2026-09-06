import { requirePermission } from '@/lib/auth/rbac';
import { getDealStatusReport } from './repository';
import type { DealReportRow } from './types';

export async function getDealReport(): Promise<{ byStatus: DealReportRow[]; totalDeals: number; totalValue: string }> {
  await requirePermission('VIEW_MARGIN');
  const rows = await getDealStatusReport();
  const byStatus = rows.map((row) => ({ status: row.status, deals: row.deals, value: row.value ?? '0' }));
  return {
    byStatus,
    totalDeals: byStatus.reduce((sum, row) => sum + row.deals, 0),
    totalValue: byStatus.reduce((sum, row) => sum + Number(row.value), 0).toFixed(2),
  };
}
