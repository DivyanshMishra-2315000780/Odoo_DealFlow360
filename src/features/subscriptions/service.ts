import { addMonths, differenceInCalendarDays } from "date-fns";
import Decimal from "decimal.js";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { v4 as uuid } from "uuid";
import { db } from "@/db";
import {
  subscriptions,
  customers,
  invoices,
  invoiceLines,
  creditNotes,
} from "@/db/schema";
import { requireAuth, requirePermission } from "@/lib/auth/rbac";
import { AuthorizationError, BusinessError } from "@/lib/errors";
import { findSubscription, listSubscriptionsFor } from "./repository";
import { findOrder } from "@/features/orders/repository";
import { recordAudit } from "@/features/audit/service";
const months = (cycle: string) =>
  cycle === "ANNUAL" ? 12 : cycle === "QUARTERLY" ? 3 : 1;
async function visible(id: string) {
  const user = await requireAuth();
  const record = await findSubscription(id);
  if (!record)
    throw new BusinessError("Subscription not found", "NOT_FOUND", 404);
  if (
    user.role === "CUSTOMER" &&
    record.subscription.customerId !== user.customerId
  )
    throw new AuthorizationError();
  if (user.role === "SALES_EXECUTIVE") {
    const order = record.subscription.orderId
      ? await findOrder(record.subscription.orderId)
      : null;
    if (order?.quotation.salesExecId !== user.userId)
      throw new AuthorizationError();
  }
  return record;
}
export async function getSubscription(id: string) {
  const record = await visible(id);
  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, record.subscription.customerId))
    .limit(1);
  return { ...record, customer };
}
export async function listSubscriptions() {
  const user = await requireAuth();
  const rows = await listSubscriptionsFor(
    user.role === "CUSTOMER" ? (user.customerId ?? "") : undefined,
  );
  const result = [];
  for (const row of rows) {
    if (user.role === "SALES_EXECUTIVE") {
      const order = row.subscription.orderId
        ? await findOrder(row.subscription.orderId)
        : null;
      if (order?.quotation.salesExecId !== user.userId) continue;
    }
    result.push(await getSubscription(row.subscription.id));
  }
  return result;
}
export async function simulateSubscriptionChange(id: string, input: unknown) {
  const record = await visible(id);
  const values = z
    .object({ newQuantity: z.number().int().positive() })
    .strict()
    .parse(input);
  const end = record.subscription.nextBillingDate;
  const start = addMonths(end, -months(record.plan.billingCycle));
  const cycleDays = Math.max(1, differenceInCalendarDays(end, start));
  const remainingDays = Math.min(
    cycleDays,
    Math.max(0, differenceInCalendarDays(end, new Date())),
  );
  const unit = new Decimal(record.subscription.recurringAmt).div(
    record.subscription.quantity,
  );
  const next = unit.mul(values.newQuantity);
  const amount = next
    .minus(record.subscription.recurringAmt)
    .mul(remainingDays)
    .div(cycleDays)
    .toDecimalPlaces(2);
  return {
    proratedAmount: amount.toFixed(2),
    newRecurringAmount: next.toFixed(2),
    cycleDays,
    remainingDays,
  };
}
export async function changeSubscription(id: string, input: unknown) {
  const user = await requirePermission("MANAGE_SUBSCRIPTIONS");
  const record = await visible(id);
  const values = z
    .object({
      newQuantity: z.number().int().positive().optional(),
      status: z.enum(["CANCELED"]).optional(),
    })
    .strict()
    .refine((v) => v.newQuantity || v.status)
    .parse(input);
  if (record.subscription.status !== "ACTIVE")
    throw new BusinessError(
      "Only active subscriptions can be changed",
      "INVALID_STATE",
      409,
    );
  if (values.status) {
    await db
      .update(subscriptions)
      .set({
        status: "CANCELED",
        canceledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, id));
  } else if (values.newQuantity) {
    const preview = await simulateSubscriptionChange(id, {
      newQuantity: values.newQuantity,
    });
    const amount = new Decimal(preview.proratedAmount);
    if (amount.gt(0))
      await charge(
        record.subscription.customerId,
        amount.toFixed(2),
        "Subscription " + record.plan.name + " quantity adjustment",
      );
    if (amount.lt(0))
      await db
        .insert(creditNotes)
        .values({
          id: uuid(),
          customerId: record.subscription.customerId,
          amount: amount.abs().toFixed(2),
          reason: "Proration for subscription " + id,
          status: "ISSUED",
        });
    await db
      .update(subscriptions)
      .set({
        quantity: values.newQuantity,
        recurringAmt: preview.newRecurringAmount,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, id));
  }
  await recordAudit({
    actorId: user.userId,
    actorRole: user.role,
    entity: "Subscription",
    entityId: id,
    action: "UPDATE_SUBSCRIPTION",
    previousValue: record.subscription,
    newValue: values,
  });
  return getSubscription(id);
}
async function charge(customerId: string, amount: string, description: string) {
  const id = uuid();
  const [invoice] = await db
    .insert(invoices)
    .values({
      id,
      invoiceNumber: "INV-SUB-" + id.slice(0, 8).toUpperCase(),
      customerId,
      status: "ISSUED",
      dueDate: new Date(Date.now() + 15 * 86400000),
      subtotal: amount,
      tax: "0",
      total: amount,
      amountDue: amount,
    })
    .returning();
  await db
    .insert(invoiceLines)
    .values({
      id: uuid(),
      invoiceId: id,
      description,
      amount,
      isRecurring: true,
    });
  return invoice;
}
export async function billDueSubscriptions() {
  const user = await requirePermission("MANAGE_BILLING");
  const rows = await listSubscriptionsFor();
  const issued = [];
  const now = new Date();
  for (const { subscription, plan } of rows) {
    if (subscription.status !== "ACTIVE" || subscription.nextBillingDate > now)
      continue;
    let next = subscription.nextBillingDate;
    let count = 0;
    while (next <= now && count < 24) {
      const invoice = await charge(
        subscription.customerId,
        subscription.recurringAmt,
        plan.name + " renewal " + next.toISOString().slice(0, 10),
      );
      issued.push(invoice);
      next = addMonths(next, months(plan.billingCycle));
      count++;
    }
    await db
      .update(subscriptions)
      .set({ nextBillingDate: next, updatedAt: now })
      .where(eq(subscriptions.id, subscription.id));
  }
  await recordAudit({
    actorId: user.userId,
    actorRole: user.role,
    entity: "Subscription",
    entityId: "billing",
    action: "ISSUE_RECURRING_INVOICES",
    newValue: { invoiceIds: issued.map((i) => i.id) },
  });
  return issued;
}
