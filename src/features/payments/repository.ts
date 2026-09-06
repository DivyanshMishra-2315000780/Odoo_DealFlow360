import Decimal from 'decimal.js';
import { BusinessError } from '@/lib/errors';
import { calculateDealHealth } from '@/engines/deal-health.engine';
import { desc, eq, or } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { db } from '@/db';
import { fulfillments, quotationLines, dealHealth, dealHealthEvents, invoices, payments, quotations, salesOrders } from '@/db/schema';

export async function findInvoiceContext(invoiceId: string) {
  const [record] = await db.select({ invoice: invoices, quote: quotations }).from(invoices)
    .leftJoin(quotations, eq(invoices.quotationId, quotations.id))
    .where(or(eq(invoices.id, invoiceId), eq(invoices.invoiceNumber, invoiceId))).limit(1);
  return record ?? null;
}

export async function insertPayment(invoiceId: string, amount: string, gatewayOrderId: string) {
  const [payment] = await db.insert(payments).values({
    id: uuid(), invoiceId, amount, status: 'PENDING', paymentMethod: 'RAZORPAY', gatewayOrderId,
  }).returning();
  return payment;
}

export async function findPayment(id: string) {
  const [record] = await db.select({ payment: payments, invoice: invoices, quote: quotations }).from(payments)
    .innerJoin(invoices, eq(payments.invoiceId, invoices.id))
    .leftJoin(quotations, eq(invoices.quotationId, quotations.id))
    .where(eq(payments.id, id)).limit(1);
  return record ?? null;
}

export async function listPaymentsFor(customerId?: string) {
  const query = db.select({ payment: payments, invoice: invoices }).from(payments)
    .innerJoin(invoices, eq(payments.invoiceId, invoices.id)).orderBy(desc(payments.createdAt));
  return customerId !== undefined ? query.where(eq(invoices.customerId, customerId)) : query;
}

export async function markPaymentFailed(id: string, reason: string) {
  await db.update(payments).set({ status: 'FAILED', failureReason: reason, updatedAt: new Date() }).where(eq(payments.id, id));
}

export async function completePayment(id: string, invoiceId: string, orderId: string | null, quotationId: string | null, gatewayPaymentId: string) {
  const [payment] = await db.update(payments).set({
    status: 'SUCCESS', gatewayPaymentId, gatewayReference: gatewayPaymentId,
    signatureVerified: true, failureReason: null, updatedAt: new Date(),
  }).where(eq(payments.id, id)).returning();
  const [invoice]=await db.select().from(invoices).where(eq(invoices.id,invoiceId)).limit(1);
  const settled=await db.select().from(payments).where(eq(payments.invoiceId,invoiceId));
  const paid=settled.filter(p=>p.status==='SUCCESS').reduce((total,p)=>total.plus(p.amount),new Decimal(0));
  const due=new Decimal(invoice.total).minus(paid);
  if(due.isNegative())throw new BusinessError('Payment exceeds the outstanding balance','OVERPAYMENT',409);
  await db.update(invoices).set({status:due.isZero()?'PAID':'PARTIALLY_PAID',amountDue:due.toFixed(2),updatedAt:new Date()}).where(eq(invoices.id,invoiceId));
  if(!due.isZero())return payment;
  if(orderId){const [fulfillment]=await db.select().from(fulfillments).where(eq(fulfillments.orderId,orderId)).limit(1);if(fulfillment?.status!=='DELIVERED')throw new BusinessError('Delivery is required before completing the deal','FULFILLMENT_REQUIRED',409);}
  if (orderId) {
    await db.update(salesOrders).set({ status: 'COMPLETED', completedAt: new Date(), updatedAt: new Date() })
      .where(eq(salesOrders.id, orderId));
  }
  if (quotationId) {
    await db.update(quotations).set({ status: 'COMPLETED', updatedAt: new Date() }).where(eq(quotations.id, quotationId));
    const [quote]=await db.select().from(quotations).where(eq(quotations.id,quotationId)).limit(1);
    const lines=await db.select().from(quotationLines).where(eq(quotationLines.quotationId,quotationId));
    const health=calculateDealHealth(quote,lines.some(line=>line.discountStatus==='EXCEEDED')?[{type:'DISCOUNT_ANOMALY'}]:[]);
    const healthValues={healthScore:health.healthScore,status:health.status as 'HEALTHY'|'WATCH'|'CRITICAL'};
    const [existingHealth] = await db.select().from(dealHealth).where(eq(dealHealth.quotationId, quotationId)).limit(1);
    const healthId = existingHealth?.id ?? uuid();
    if (existingHealth) {
      await db.update(dealHealth).set({ ...healthValues, updatedAt: new Date() }).where(eq(dealHealth.id, healthId));
    } else {
      await db.insert(dealHealth).values({ id: healthId, quotationId, ...healthValues });
    }
    await db.insert(dealHealthEvents).values({
      id: uuid(), dealHealthId: healthId, type: 'PAYMENT_COMPLETED', riskImpact: 0,
      reason: 'Payment verified and deal completed', resolved: true,
    });
  }
  return payment;
}
