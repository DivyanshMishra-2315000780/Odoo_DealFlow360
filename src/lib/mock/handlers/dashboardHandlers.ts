import { delay } from '@/lib/api/apiClient';
import { getDB } from '@/lib/mock/db';

export const mockDashboardHandlers = {
  async getKpis() {
    await delay(400);
    const db = getDB();
    
    return {
      pendingApprovals: db.approvals.filter(a => a.status === 'PENDING').length,
      openQuotations: db.quotes.filter(q => q.status === 'DRAFT' || q.status === 'NEGOTIATION').length,
      atRiskDeals: db.dealHealthEvents.filter(d => d.status === 'OPEN').length,
      revenue: db.quotes.filter(q => q.status === 'CONFIRMED' || q.status === 'SHIPPED' || q.status === 'INVOICED' || q.status === 'PARTIALLY_PAID' || q.status === 'PAID').reduce((sum, q) => sum + q.amount, 0),
      unpaidInvoices: db.invoices.filter(i => i.status === 'UNPAID' || i.status === 'OVERDUE').length,
      activeSubscriptions: db.subscriptions.filter(s => s.status === 'ACTIVE').length,
      totalCustomers: db.customers.length,
      pendingFinanceApprovals: db.approvals.filter(a => a.currentStage === 'FINANCE_OFFICER' && a.status === 'PENDING').length,
      totalInvoiced: db.invoices.reduce((sum, i) => sum + i.amount, 0),
      overdueInvoices: db.invoices.filter(i => i.status === 'OVERDUE').length,
    };
  },

  async getPriorityCustomers() {
    await delay(200);
    const db = getDB();
    const tierWeight: Record<string, number> = { GOLD: 3, SILVER: 2, BRONZE: 1 };
    
    return [...db.customers]
      .sort((a, b) => (tierWeight[b.tier] ?? 0) - (tierWeight[a.tier] ?? 0))
      .slice(0, 5);
  },

  async getCharts() {
    await delay(300);
    // Return some mock trend data
    return {
        revenueTrend: [
            { month: 'Jan', revenue: 15000 },
            { month: 'Feb', revenue: 22000 },
            { month: 'Mar', revenue: 18000 },
            { month: 'Apr', revenue: 25000 },
            { month: 'May', revenue: 30000 },
            { month: 'Jun', revenue: 48000 },
        ],
        quotesByTier: [
            { name: 'GOLD', value: 45 },
            { name: 'SILVER', value: 30 },
            { name: 'BRONZE', value: 25 },
        ]
    };
  }
};
