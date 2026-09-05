import { delay } from '@/lib/api/apiClient';
import { getDB, saveDB, enrichInvoice, nextId } from '@/lib/mock/db';
import { PaymentMethod } from '@/types';

export const mockInvoiceHandlers = {
  async getAll(filters: { status?: string; customerId?: string; page?: number; pageSize?: number } = {}) {
    await delay(400);
    const db = getDB();
    let items = db.invoices.map(inv => enrichInvoice(inv, db));
    
    if (filters.status && filters.status !== 'ALL') {
      items = items.filter(inv => inv.status === filters.status);
    }
    if (filters.customerId) {
        items = items.filter(inv => inv.customerId === filters.customerId);
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
    const inv = db.invoices.find(i => i.id === id || i.invoiceNumber === id);
    if (!inv) throw new Error('Invoice not found');
    return enrichInvoice(inv, db);
  },

  async recordPayment(id: string, amount: number, method: PaymentMethod, reference: string, recordedById: string) {
    await delay(700);
    const db = getDB();
    const idx = db.invoices.findIndex(i => i.id === id);
    if (idx === -1) throw new Error('Invoice not found');
    
    const invoice = db.invoices[idx];
    const newPaidAmount = invoice.paidAmount + amount;
    
    let status = invoice.status;
    if (newPaidAmount >= invoice.amount) {
        status = 'PAID';
    } else if (newPaidAmount > 0) {
        status = 'PARTIALLY_PAID';
    }

    const newPayment = {
        id: `pay-${Date.now()}`,
        invoiceId: id,
        amount,
        method,
        reference,
        paidAt: new Date().toISOString(),
        recordedById,
    };

    db.invoices[idx] = {
        ...invoice,
        paidAmount: newPaidAmount,
        status,
        payments: [...invoice.payments, newPayment]
    };

    if (status === 'PAID') {
        const qIdx = db.quotes.findIndex(q => q.id === invoice.quotationId);
        if (qIdx !== -1) {
            db.quotes[qIdx] = { ...db.quotes[qIdx], status: 'PAID', updatedAt: new Date().toISOString() };
        }
    } else if (status === 'PARTIALLY_PAID') {
        const qIdx = db.quotes.findIndex(q => q.id === invoice.quotationId);
        if (qIdx !== -1) {
            db.quotes[qIdx] = { ...db.quotes[qIdx], status: 'PARTIALLY_PAID', updatedAt: new Date().toISOString() };
        }
    }

    saveDB();
    return enrichInvoice(db.invoices[idx], db);
  }
};
