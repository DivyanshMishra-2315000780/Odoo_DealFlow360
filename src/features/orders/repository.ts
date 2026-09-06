import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { fulfillments, invoices, payments, quotations, salesOrders } from '@/db/schema';

export async function listOrdersFor(customerId?: string, salesExecId?: string) {
  const query = db.select({ order: salesOrders, quotation: quotations })
    .from(salesOrders).innerJoin(quotations, eq(salesOrders.quotationId, quotations.id))
    .orderBy(desc(salesOrders.createdAt));
  if (customerId !== undefined) return query.where(eq(salesOrders.customerId, customerId));
  if (salesExecId) return query.where(eq(quotations.salesExecId, salesExecId));
  return query;
}

export async function findOrder(id: string) {
  const [record] = await db.select({ order: salesOrders, quotation: quotations, fulfillment: fulfillments, invoice: invoices })
    .from(salesOrders)
    .innerJoin(quotations, eq(salesOrders.quotationId, quotations.id))
    .leftJoin(fulfillments, eq(fulfillments.orderId, salesOrders.id))
    .leftJoin(invoices, eq(invoices.orderId, salesOrders.id))
    .where(eq(salesOrders.id, id)).limit(1);
  if (!record) return null;
  const paymentHistory = record.invoice
    ? await db.select().from(payments).where(eq(payments.invoiceId, record.invoice.id)).orderBy(desc(payments.createdAt))
    : [];
  return { ...record, payments: paymentHistory };
}
