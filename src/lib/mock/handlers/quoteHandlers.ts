import { delay } from '@/lib/api/apiClient';
import { getDB, saveDB, nextId, enrichQuote, computeQuoteRisk, computeLineRisk, computeLineTotal } from '@/lib/mock/db';
import { Quotation, QuotationLine } from '@/types';

export const mockQuoteHandlers = {
  async getAll(filters: {
    status?: string;
    tier?: string;
    risk?: string;
    search?: string;
    salesExecutiveId?: string;
    customerId?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortDir?: string;
  } = {}) {
    await delay(400);
    const db = getDB();
    let items = db.quotes.map(q => enrichQuote(q, db));

    if (filters.status && filters.status !== 'ALL') {
      items = items.filter(q => q.status === filters.status);
    }
    if (filters.tier && filters.tier !== 'ALL') {
      items = items.filter(q => q.customer?.tier === filters.tier);
    }
    if (filters.risk && filters.risk !== 'ALL') {
      items = items.filter(q => q.riskLevel === filters.risk);
    }
    if (filters.search) {
      const s = filters.search.toLowerCase();
      items = items.filter(q =>
        q.quoteNumber.toLowerCase().includes(s) ||
        q.customer?.name.toLowerCase().includes(s)
      );
    }
    if (filters.salesExecutiveId) {
      items = items.filter(q => q.salesExecutiveId === filters.salesExecutiveId);
    }
    if (filters.customerId) {
      items = items.filter(q => q.customerId === filters.customerId);
    }

    // Sorting
    if (filters.sortBy === 'amount') {
      items.sort((a, b) => filters.sortDir === 'asc' ? a.amount - b.amount : b.amount - a.amount);
    } else if (filters.sortBy === 'date') {
      items.sort((a, b) => filters.sortDir === 'asc'
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (filters.sortBy === 'tier') {
      const tw: Record<string, number> = { GOLD: 3, SILVER: 2, BRONZE: 1 };
      items.sort((a, b) => (tw[b.customer?.tier ?? 'BRONZE'] ?? 0) - (tw[a.customer?.tier ?? 'BRONZE'] ?? 0));
    }

    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 10;
    const total = items.length;
    return { data: items.slice((page - 1) * pageSize, page * pageSize), total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
  },

  async getById(id: string) {
    await delay(300);
    const db = getDB();
    const q = db.quotes.find(q => q.id === id || q.quoteNumber === id);
    if (!q) throw new Error('Quote not found');
    return enrichQuote(q, db);
  },

  async create(data: Partial<Quotation> & { lines: Partial<QuotationLine>[] }) {
    await delay(600);
    const db = getDB();
    const id = `q-${nextId('quote')}`;
    const quoteNumber = `Q-${nextId('quote')}`;

    const lines: QuotationLine[] = data.lines.map((l, i) => {
      const product = db.products.find(p => p.id === l.productId);
      const customer = db.customers.find(c => c.id === data.customerId);
      const allowed = product?.tierPrices.find(tp => tp.tier === customer?.tier)?.discountPercentage ?? 5;
      const lineTotal = computeLineTotal(l.quantity ?? 1, l.unitPrice ?? product?.basePrice ?? 0, l.discountPercentage ?? 0);
      return {
        id: `ql-${Date.now()}-${i}`,
        productId: l.productId ?? '',
        quantity: l.quantity ?? 1,
        unitPrice: l.unitPrice ?? product?.basePrice ?? 0,
        discountPercentage: l.discountPercentage ?? 0,
        allowedDiscountPercentage: allowed,
        lineTotal,
        riskLevel: computeLineRisk({ discountPercentage: l.discountPercentage ?? 0, allowedDiscountPercentage: allowed }),
        deliveryDate: l.deliveryDate,
        notes: l.notes,
      };
    });

    const amount = lines.reduce((s, l) => s + l.lineTotal, 0);
    const riskLevel = computeQuoteRisk(lines);

    const newQuote: Quotation = {
      id,
      quoteNumber,
      customerId: data.customerId ?? '',
      salesExecutiveId: data.salesExecutiveId ?? 'u-sales-exec-1',
      status: 'DRAFT',
      amount: parseFloat(amount.toFixed(2)),
      riskLevel,
      notes: data.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: data.expiresAt ?? new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      lines,
    };
    db.quotes.push(newQuote);
    saveDB();
    return enrichQuote(newQuote, db);
  },

  async update(id: string, data: Partial<Quotation> & { lines?: Partial<QuotationLine>[] }) {
    await delay(500);
    const db = getDB();
    const idx = db.quotes.findIndex(q => q.id === id);
    if (idx === -1) throw new Error('Quote not found');
    const existing = db.quotes[idx];

    let lines = existing.lines;
    if (data.lines) {
      lines = data.lines.map((l, i) => {
        const product = db.products.find(p => p.id === l.productId);
        const customer = db.customers.find(c => c.id === (data.customerId ?? existing.customerId));
        const allowed = product?.tierPrices.find(tp => tp.tier === customer?.tier)?.discountPercentage ?? 5;
        const lineTotal = computeLineTotal(l.quantity ?? 1, l.unitPrice ?? 0, l.discountPercentage ?? 0);
        return {
          id: l.id ?? `ql-${Date.now()}-${i}`,
          productId: l.productId ?? '',
          quantity: l.quantity ?? 1,
          unitPrice: l.unitPrice ?? 0,
          discountPercentage: l.discountPercentage ?? 0,
          allowedDiscountPercentage: allowed,
          lineTotal,
          riskLevel: computeLineRisk({ discountPercentage: l.discountPercentage ?? 0, allowedDiscountPercentage: allowed }),
          deliveryDate: l.deliveryDate,
          notes: l.notes,
        };
      });
    }

    const amount = lines.reduce((s, l) => s + l.lineTotal, 0);
    const riskLevel = computeQuoteRisk(lines);

    db.quotes[idx] = {
      ...existing,
      ...data,
      lines,
      amount: parseFloat(amount.toFixed(2)),
      riskLevel,
      updatedAt: new Date().toISOString(),
    };
    saveDB();
    return enrichQuote(db.quotes[idx], db);
  },

  async submit(id: string, submittedById: string, submittedByName: string) {
    await delay(600);
    const db = getDB();
    const idx = db.quotes.findIndex(q => q.id === id);
    if (idx === -1) throw new Error('Quote not found');

    db.quotes[idx] = { ...db.quotes[idx], status: 'PENDING_APPROVAL', updatedAt: new Date().toISOString() };

    // Create approval record
    const approvalId = `a-${nextId('approval')}`;
    const newApproval = {
      id: approvalId,
      quotationId: id,
      status: 'PENDING' as const,
      currentStage: 'SALES_MANAGER' as const,
      requestedById: submittedById,
      requestedByName: submittedByName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      auditTrail: [{
        id: `ae-${Date.now()}`,
        userId: submittedById,
        userName: submittedByName,
        action: 'Submitted for Approval',
        timestamp: new Date().toISOString(),
      }],
    };
    db.approvals.push(newApproval);

    // Add notification for managers
    db.notifications.push({
      id: `n-${Date.now()}`,
      userId: 'u-sales-mgr-1',
      title: 'Approval Required',
      message: `${db.quotes[idx].quoteNumber} submitted by ${submittedByName}`,
      type: 'APPROVAL',
      isRead: false,
      link: `/sales-manager/approvals/${approvalId}`,
      createdAt: new Date().toISOString(),
    });
    saveDB();
    return enrichQuote(db.quotes[idx], db);
  },

  async sendToCustomer(id: string) {
    await delay(400);
    const db = getDB();
    const idx = db.quotes.findIndex(q => q.id === id);
    if (idx === -1) throw new Error('Quote not found');
    if (db.quotes[idx].status !== 'APPROVED') throw new Error('Quote must be approved before sending to customer');
    db.quotes[idx] = { ...db.quotes[idx], status: 'NEGOTIATION', updatedAt: new Date().toISOString() };
    saveDB();
    return enrichQuote(db.quotes[idx], db);
  },

  async confirm(id: string) {
    await delay(400);
    const db = getDB();
    const idx = db.quotes.findIndex(q => q.id === id);
    if (idx === -1) throw new Error('Quote not found');
    db.quotes[idx] = { ...db.quotes[idx], status: 'CONFIRMED', updatedAt: new Date().toISOString() };

    // Create fulfillment order
    const fulfillmentId = `f-${nextId('fulfillment')}`;
    const quote = db.quotes[idx];
    const totalItems = quote.lines.reduce((s, l) => s + l.quantity, 0);
    db.fulfillmentOrders.push({
      id: fulfillmentId,
      quotationId: id,
      status: 'PENDING',
      totalItems,
      warehouseAllocations: [
        { warehouseId: 'wh-1', warehouseName: 'Main Warehouse', quantityAvailable: Math.ceil(totalItems * 0.7), quantityAllocated: Math.ceil(totalItems * 0.7), estimatedShipmentDays: 1, shippingCost: 42 },
        { warehouseId: 'wh-2', warehouseName: 'East Depot', quantityAvailable: Math.floor(totalItems * 0.4), quantityAllocated: Math.floor(totalItems * 0.3), estimatedShipmentDays: 2, shippingCost: 29 },
      ],
      backorderUnits: 0,
      expectedShipment: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    });
    saveDB();
    return enrichQuote(db.quotes[idx], db);
  },
};
