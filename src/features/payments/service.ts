import { createHmac, timingSafeEqual } from 'node:crypto';
import { addMonths } from 'date-fns';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { invoices, invoiceLines, subscriptionPlans, subscriptions } from '@/db/schema';
import { requireAuth, requirePermission } from '@/lib/auth/rbac';
import { AuthorizationError, BusinessError } from '@/lib/errors';
import { recordAudit } from '@/features/audit/service';
import { completePayment, findInvoiceContext, findPayment, insertPayment, listPaymentsFor, markPaymentFailed } from './repository';
import { createCheckoutInput, verifyPaymentInput } from './types';

function razorpayCredentials() {
  const keyId = (process.env.RAZORPAY_KEY_ID ?? '').replace(/^["']|["']$/g, '').trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET ?? '').replace(/^["']|["']$/g, '').trim();
  if (!keyId || !keySecret) throw new BusinessError('Razorpay is not configured', 'PAYMENT_PROVIDER_NOT_CONFIGURED', 503);
  return { keyId, keySecret };
}

async function razorpayRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const { keyId, keySecret } = razorpayCredentials();
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...init,
    headers: { Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`, 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    console.error(`Razorpay request failed [${response.status}] on ${path}:`, errorBody);
    let message = 'Payment provider request failed';
    try {
      const parsed = JSON.parse(errorBody);
      if (parsed?.error?.description) {
        message = parsed.error.description;
      }
    } catch {}
    throw new BusinessError(message, 'PAYMENT_PROVIDER_ERROR', 502);
  }
  return response.json() as Promise<T>;
}

function assertInvoiceOwner(user: Awaited<ReturnType<typeof requireAuth>>, customerId: string) {
  if (user.role === 'CUSTOMER' && customerId !== user.customerId) throw new AuthorizationError();
}

export async function listPayments() {
  const user = await requireAuth();
  if (user.role !== 'CUSTOMER') await requirePermission('MANAGE_PAYMENTS');
  return listPaymentsFor(user.role === 'CUSTOMER' ? user.customerId ?? '' : undefined);
}

export async function createCheckout(input: unknown) {
  const user = await requireAuth();
  if (user.role !== 'CUSTOMER') await requirePermission('MANAGE_PAYMENTS');
  const values = createCheckoutInput.parse(input);
  const context = await findInvoiceContext(values.invoiceId);
  if (!context) throw new BusinessError('Invoice not found', 'NOT_FOUND', 404);
  assertInvoiceOwner(user, context.invoice.customerId);
  if (!['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'].includes(context.invoice.status) || Number(context.invoice.amountDue) <= 0) {
    throw new BusinessError('Invoice is not payable', 'INVALID_STATE', 409);
  }
  const { keyId } = razorpayCredentials();
  const amount = Math.max(100, Math.round(Number(context.invoice.amountDue) * 100));
  const currency = (context.quote?.currency ?? 'USD').toUpperCase();
  const receipt = (context.invoice.invoiceNumber || context.invoice.id).slice(0, 40);

  let providerOrder: { id: string; amount: number; currency: string };
  try {
    providerOrder = await razorpayRequest<{ id: string; amount: number; currency: string }>('/orders', {
      method: 'POST', body: JSON.stringify({ amount, currency, receipt }),
    });
  } catch (error) {
    console.error('Failed to create Razorpay order with currency', currency, error);
    if (currency !== 'INR') {
      try {
        console.log(`Retrying Razorpay order with INR for invoice ${context.invoice.id}...`);
        providerOrder = await razorpayRequest<{ id: string; amount: number; currency: string }>('/orders', {
          method: 'POST', body: JSON.stringify({ amount, currency: 'INR', receipt }),
        });
      } catch {
        throw error;
      }
    } else {
      throw error;
    }
  }

  const payment = await insertPayment(context.invoice.id, context.invoice.amountDue, providerOrder.id);
  return { paymentId: payment.id, keyId, orderId: providerOrder.id, amount: providerOrder.amount, currency: providerOrder.currency };
}

export async function verifyPayment(input: unknown) {
  const user = await requireAuth();
  if (user.role !== 'CUSTOMER') await requirePermission('MANAGE_PAYMENTS');
  const values = verifyPaymentInput.parse(input);
  const context = await findPayment(values.paymentId);
  if (!context) throw new BusinessError('Payment not found', 'NOT_FOUND', 404);
  assertInvoiceOwner(user, context.invoice.customerId);
  if (context.payment.status === 'SUCCESS') return context.payment;
  if (context.payment.gatewayOrderId !== values.razorpay_order_id) {
    await markPaymentFailed(context.payment.id, 'Gateway order mismatch');
    throw new BusinessError('Payment verification failed', 'INVALID_PAYMENT_SIGNATURE', 400);
  }
  const { keySecret } = razorpayCredentials();
  const expected = createHmac('sha256', keySecret)
    .update(`${context.payment.gatewayOrderId}|${values.razorpay_payment_id}`).digest('hex');
  const actualBuffer = Buffer.from(values.razorpay_signature, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    await markPaymentFailed(context.payment.id, 'Invalid signature');
    throw new BusinessError('Payment verification failed', 'INVALID_PAYMENT_SIGNATURE', 400);
  }
  const providerPayment = await razorpayRequest<{ status: string; order_id: string; amount: number }>(`/payments/${encodeURIComponent(values.razorpay_payment_id)}`);
  
  if (providerPayment.status === 'authorized') {
    try {
      await razorpayRequest(`/payments/${encodeURIComponent(values.razorpay_payment_id)}/capture`, {
        method: 'POST',
        body: JSON.stringify({ amount: providerPayment.amount, currency: context.quote?.currency ?? 'USD' }),
      });
      providerPayment.status = 'captured';
    } catch (captureErr) {
      console.warn('Auto-capture attempt failed:', captureErr);
    }
  }

  if (providerPayment.status !== 'captured' || providerPayment.order_id !== context.payment.gatewayOrderId) {
    await markPaymentFailed(context.payment.id, 'Payment is not captured or amount mismatched');
    throw new BusinessError('Payment has not been captured', 'PAYMENT_NOT_CAPTURED', 409);
  }
  const payment = await completePayment(
    context.payment.id, context.invoice.id, context.invoice.orderId,
    context.invoice.quotationId, values.razorpay_payment_id,
  );

  // If this payment settled a subscription invoice, activate/update customer's subscription!
  if (context.invoice.invoiceNumber.startsWith('INV-SUB-')) {
    try {
      const [line] = await db.select().from(invoiceLines).where(eq(invoiceLines.invoiceId, context.invoice.id)).limit(1);
      const desc = line?.description ?? '';
      let planKey = 'sp-starter';
      if (desc.includes('PROFESSIONAL') || desc.includes('Professional')) planKey = 'sp-pro';
      else if (desc.includes('ENTERPRISE') || desc.includes('Enterprise')) planKey = 'sp-ent';

      const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, planKey)).limit(1);
      if (plan) {
        const [existing] = await db.select().from(subscriptions).where(eq(subscriptions.customerId, context.invoice.customerId)).limit(1);
        if (existing) {
          await db.update(subscriptions).set({
            planId: plan.id,
            recurringAmt: plan.price,
            status: 'ACTIVE',
            updatedAt: new Date(),
            nextBillingDate: addMonths(new Date(), 1),
          }).where(eq(subscriptions.id, existing.id));
        } else {
          await db.insert(subscriptions).values({
            id: uuid(),
            customerId: context.invoice.customerId,
            planId: plan.id,
            quantity: 1,
            recurringAmt: plan.price,
            status: 'ACTIVE',
            startDate: new Date(),
            nextBillingDate: addMonths(new Date(), 1),
          });
        }
      }
    } catch (subErr) {
      console.error('Failed to activate subscription after payment verification:', subErr);
    }
  }

  await recordAudit({
    actorId: user.userId, actorRole: user.role, entity: 'Payment', entityId: context.payment.id,
    action: 'PAYMENT_VERIFIED', newValue: { gatewayPaymentId: values.razorpay_payment_id },
  });
  return payment;
}

export async function createSubscriptionCheckout(input: unknown) {
  const user = await requireAuth();
  if (user.role !== 'CUSTOMER' || !user.customerId) {
    throw new AuthorizationError('Customer account required for subscription checkout');
  }

  const schema = z.object({
    plan: z.enum(['STARTER', 'PROFESSIONAL', 'ENTERPRISE']),
    amount: z.number().positive().optional(),
    isProrated: z.boolean().optional(),
  });
  const values = schema.parse(input);

  const planRates: Record<string, number> = {
    STARTER: 499,
    PROFESSIONAL: 1499,
    ENTERPRISE: 3999,
  };
  const baseRate = planRates[values.plan] ?? 499;
  const finalAmountDollars = values.amount && values.isProrated ? values.amount : baseRate;
  const amountCents = Math.max(100, Math.round(finalAmountDollars * 100));

  const invoiceId = uuid();
  const invoiceNum = `INV-SUB-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${invoiceId.slice(0, 6).toUpperCase()}`;

  const [invoice] = await db.insert(invoices).values({
    id: invoiceId,
    invoiceNumber: invoiceNum,
    customerId: user.customerId,
    status: 'ISSUED',
    dueDate: new Date(Date.now() + 7 * 86400000),
    subtotal: String(finalAmountDollars),
    tax: '0',
    total: String(finalAmountDollars),
    amountDue: String(finalAmountDollars),
  }).returning();

  await db.insert(invoiceLines).values({
    id: uuid(),
    invoiceId: invoice.id,
    description: `DealFlow360 ${values.plan} Subscription Plan ${values.isProrated ? '(Prorated Adjustment)' : '(Monthly)'}`,
    amount: String(finalAmountDollars),
    isRecurring: true,
  });

  const { keyId } = razorpayCredentials();
  const currency = 'USD';
  const receipt = invoiceNum.slice(0, 40);
  let providerOrder: { id: string; amount: number; currency: string };
  try {
    providerOrder = await razorpayRequest<{ id: string; amount: number; currency: string }>('/orders', {
      method: 'POST', body: JSON.stringify({ amount: amountCents, currency, receipt }),
    });
  } catch (err) {
    console.error('Razorpay USD subscription order failed, retrying with INR:', err);
    providerOrder = await razorpayRequest<{ id: string; amount: number; currency: string }>('/orders', {
      method: 'POST', body: JSON.stringify({ amount: amountCents, currency: 'INR', receipt }),
    });
  }

  const payment = await insertPayment(invoice.id, invoice.amountDue, providerOrder.id);

  return {
    paymentId: payment.id,
    keyId,
    orderId: providerOrder.id,
    amount: providerOrder.amount,
    currency: providerOrder.currency,
    invoiceId: invoice.id,
    plan: values.plan,
  };
}
