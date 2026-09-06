import { addMonths } from 'date-fns';
import { BusinessError } from '@/lib/errors';
import { desc, eq, or } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { db } from '@/db';
import { customers, fulfillments, products, invoiceLines, invoices, payments, quotationLines, quotations, salesOrders, subscriptionPlans, subscriptions } from '@/db/schema';

export async function listInvoicesFor(customerId?: string) {
  const query = db.select().from(invoices).orderBy(desc(invoices.createdAt));
  return customerId !== undefined ? query.where(eq(invoices.customerId, customerId)) : query;
}
export async function findBilling(orderId: string) {
  const [invoice] = await db.select().from(invoices)
    .where(or(eq(invoices.id, orderId), eq(invoices.orderId, orderId), eq(invoices.quotationId, orderId))).limit(1);
  if (!invoice) return null;
  const [lines, invoicePayments] = await Promise.all([
    db.select().from(invoiceLines).where(eq(invoiceLines.invoiceId, invoice.id)),
    db.select().from(payments).where(eq(payments.invoiceId, invoice.id)).orderBy(desc(payments.createdAt)),
  ]);
  const [customer]=await db.select().from(customers).where(eq(customers.id,invoice.customerId)).limit(1);
  const [fulfillment]=invoice.orderId?await db.select().from(fulfillments).where(eq(fulfillments.orderId,invoice.orderId)).limit(1):[];
  const [quote]=invoice.quotationId?await db.select({currency:quotations.currency}).from(quotations).where(eq(quotations.id,invoice.quotationId)).limit(1):[];
  return { invoice:{...invoice,currency:quote?.currency??'USD'}, lines, payments: invoicePayments, customer, fulfillment };
}

export async function createInvoiceForOrderRecord(orderId: string) {
  const [existing] = await db.select().from(invoices).where(eq(invoices.orderId, orderId)).limit(1);
  if (existing) return existing;
  const [context] = await db.select({ order: salesOrders, quote: quotations }).from(salesOrders)
    .innerJoin(quotations, eq(salesOrders.quotationId, quotations.id))
    .where(eq(salesOrders.id, orderId)).limit(1);
  if (!context) return null;
  if(context.order.status!=='DELIVERED')throw new BusinessError('Confirm delivery before issuing the invoice','FULFILLMENT_REQUIRED',409);
  const id = uuid();
  const [invoice] = await db.insert(invoices).values({
    id, invoiceNumber: `INV-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${id.slice(0, 8).toUpperCase()}`,
    customerId: context.order.customerId, quotationId: context.quote.id, orderId, status: 'ISSUED',
    dueDate: new Date(Date.now() + 15 * 86400000), subtotal: context.quote.totalAmount,
    tax: context.quote.taxAmount, total: context.quote.totalAmount, amountDue: context.quote.totalAmount,
  }).returning();
  const lines = await db.select().from(quotationLines).where(eq(quotationLines.quotationId, context.quote.id));
  if (lines.length) {
    await db.insert(invoiceLines).values(lines.map((line) => ({
      id: uuid(), invoiceId: id, description: `Product ${line.productId} × ${line.quantity}`,
      amount: line.netAmount, isRecurring: line.isRecurring,
    })));
  }
  const recurringLines = lines.filter((line) => line.isRecurring && line.subscriptionPlanId);
  if (recurringLines.length) {
    const plans = await db.select().from(subscriptionPlans);
    const planById = new Map(plans.map((plan) => [plan.id, plan]));
    const now = new Date();
    const subscriptionValues = recurringLines.flatMap((line) => {
      const plan = line.subscriptionPlanId ? planById.get(line.subscriptionPlanId) : undefined;
      if (!plan) return [];
      const nextBillingDate = addMonths(now,plan.billingCycle==='ANNUAL'?12:plan.billingCycle==='QUARTERLY'?3:1);
      return [{
        id: uuid(), orderId, quotationLineId: line.id, customerId: context.order.customerId,
        planId: plan.id, quantity: line.quantity, recurringAmt: line.netAmount,
        status: 'ACTIVE' as const, startDate: now, nextBillingDate,
      }];
    });
    if (subscriptionValues.length) await db.insert(subscriptions).values(subscriptionValues);
  }
  await db.update(salesOrders).set({ status: 'PAYMENT_PENDING', updatedAt: new Date() }).where(eq(salesOrders.id, orderId));
  return invoice;
}
