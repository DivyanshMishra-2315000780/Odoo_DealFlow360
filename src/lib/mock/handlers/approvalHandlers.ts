import { delay } from '@/lib/api/apiClient';
import { getDB, saveDB, nextId, enrichApproval } from '@/lib/mock/db';
import { Approval, ApprovalStage } from '@/types';

function needsFinanceApproval(approval: Approval, db: ReturnType<typeof getDB>): boolean {
  const quote = db.quotes.find(q => q.id === approval.quotationId);
  if (!quote) return false;
  return quote.riskLevel === 'HIGH';
}

export const mockApprovalHandlers = {
  async getAll(filters: { status?: string; page?: number; pageSize?: number } = {}) {
    await delay(400);
    const db = getDB();
    let items = db.approvals.map(a => enrichApproval(a, db));
    if (filters.status && filters.status !== 'ALL') {
      items = items.filter(a => a.status === filters.status);
    }
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const total = items.length;
    const data = items.slice((page - 1) * pageSize, page * pageSize);
    return { data, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
  },

  async getById(id: string) {
    await delay(300);
    const db = getDB();
    const a = db.approvals.find(a => a.id === id);
    if (!a) throw new Error('Approval not found');
    return enrichApproval(a, db);
  },

  async approve(id: string, comment?: string, userId?: string, userName?: string) {
    await delay(600);
    const db = getDB();
    const idx = db.approvals.findIndex(a => a.id === id);
    if (idx === -1) throw new Error('Approval not found');
    const approval = db.approvals[idx];
    const requiresFinance = needsFinanceApproval(approval, db);
    const auditEntry = {
      id: `ae-${Date.now()}`,
      userId: userId ?? 'u-sales-mgr-1',
      userName: userName ?? 'Manager',
      action: 'Approved',
      comment,
      timestamp: new Date().toISOString(),
    };

    if (approval.currentStage === 'SALES_MANAGER') {
      if (requiresFinance) {
        // Advance to finance stage
        db.approvals[idx] = {
          ...approval,
          currentStage: 'FINANCE_OFFICER' as ApprovalStage,
          salesManagerApproved: true,
          auditTrail: [...approval.auditTrail, auditEntry],
          updatedAt: new Date().toISOString(),
        };
        // Keep quote in PENDING_APPROVAL
      } else {
        // No finance needed — mark approved
        db.approvals[idx] = {
          ...approval,
          status: 'APPROVED',
          currentStage: 'COMPLETED',
          salesManagerApproved: true,
          financeApproved: true,
          auditTrail: [...approval.auditTrail, auditEntry],
          updatedAt: new Date().toISOString(),
        };
        // Update quote status
        const qIdx = db.quotes.findIndex(q => q.id === approval.quotationId);
        if (qIdx !== -1) db.quotes[qIdx] = { ...db.quotes[qIdx], status: 'APPROVED', updatedAt: new Date().toISOString() };
      }
    } else if (approval.currentStage === ('FINANCE_OFFICER' as ApprovalStage)) {
      db.approvals[idx] = {
        ...approval,
        status: 'APPROVED',
        currentStage: 'COMPLETED',
        financeApproved: true,
        auditTrail: [...approval.auditTrail, auditEntry],
        updatedAt: new Date().toISOString(),
      };
      const qIdx = db.quotes.findIndex(q => q.id === approval.quotationId);
      if (qIdx !== -1) db.quotes[qIdx] = { ...db.quotes[qIdx], status: 'APPROVED', updatedAt: new Date().toISOString() };
    }
    saveDB();
    return enrichApproval(db.approvals[idx], db);
  },

  async returnForRevision(id: string, reason: string, userId?: string, userName?: string) {
    await delay(600);
    const db = getDB();
    const idx = db.approvals.findIndex(a => a.id === id);
    if (idx === -1) throw new Error('Approval not found');
    const approval = db.approvals[idx];
    const auditEntry = {
      id: `ae-${Date.now()}`,
      userId: userId ?? 'u-sales-mgr-1',
      userName: userName ?? 'Manager',
      action: 'Returned for Revision',
      comment: reason,
      timestamp: new Date().toISOString(),
    };
    db.approvals[idx] = {
      ...approval,
      status: 'RETURNED',
      returnReason: reason,
      auditTrail: [...approval.auditTrail, auditEntry],
      updatedAt: new Date().toISOString(),
    };
    const qIdx = db.quotes.findIndex(q => q.id === approval.quotationId);
    if (qIdx !== -1) db.quotes[qIdx] = { ...db.quotes[qIdx], status: 'RETURNED', updatedAt: new Date().toISOString() };
    saveDB();
    return enrichApproval(db.approvals[idx], db);
  },

  async reject(id: string, reason: string, userId?: string, userName?: string) {
    await delay(600);
    const db = getDB();
    const idx = db.approvals.findIndex(a => a.id === id);
    if (idx === -1) throw new Error('Approval not found');
    const approval = db.approvals[idx];
    const auditEntry = {
      id: `ae-${Date.now()}`,
      userId: userId ?? 'u-sales-mgr-1',
      userName: userName ?? 'Manager',
      action: 'Rejected',
      comment: reason,
      timestamp: new Date().toISOString(),
    };
    db.approvals[idx] = {
      ...approval,
      status: 'REJECTED',
      rejectReason: reason,
      auditTrail: [...approval.auditTrail, auditEntry],
      updatedAt: new Date().toISOString(),
    };
    const qIdx = db.quotes.findIndex(q => q.id === approval.quotationId);
    if (qIdx !== -1) db.quotes[qIdx] = { ...db.quotes[qIdx], status: 'REJECTED', updatedAt: new Date().toISOString() };
    saveDB();
    return enrichApproval(db.approvals[idx], db);
  },
};
