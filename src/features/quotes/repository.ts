import { evaluateLineDiscount } from "@/engines/discount.engine";
import { and, desc, eq, inArray } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { db } from "@/db";
import {
  auditLogs,
  categories,
  users,
  dealHealth,
  approvalRequests,
  approvalRules,
  approvalSteps,
  customers,
  discountRules,
  fulfillments,
  inventory,
  negotiationChanges,
  negotiations,
  priceListItems,
  priceLists,
  products,
  quotationLines,
  quotations,
  quotationVersions,
  salesOrders,
  upsellRecommendations,
  upsellRules,
} from "@/db/schema";
import type { QuoteStatus } from "./types";

export async function listQuotesFor(userId: string, role: string) {
  const condition =
    role === "SALES_EXECUTIVE"
      ? eq(quotations.salesExecId, userId)
      : role === "CUSTOMER"
        ? eq(quotations.customerId, userId)
        : undefined;
  const query = db
    .select()
    .from(quotations)
    .orderBy(desc(quotations.createdAt));
  return condition ? query.where(condition) : query;
}

export async function findQuote(id: string) {
  const [quote] = await db
    .select()
    .from(quotations)
    .where(eq(quotations.id, id))
    .limit(1);
  return quote ?? null;
}

export async function findQuoteDetails(id: string) {
  const quote = await findQuote(id);
  if (!quote) return null;
  const [lines, customerRows] = await Promise.all([
    db.select().from(quotationLines).where(eq(quotationLines.quotationId, id)),
    db
      .select()
      .from(customers)
      .where(eq(customers.id, quote.customerId))
      .limit(1),
  ]);
  const [productRows, history, ownerRows, requests, health] = await Promise.all(
    [
      db
        .select({ product: products, category: categories })
        .from(products)
        .innerJoin(categories, eq(products.categoryId, categories.id)),
      db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.entityId, id))
        .orderBy(desc(auditLogs.createdAt)),
      db.select().from(users).where(eq(users.id, quote.salesExecId)).limit(1),
      db
        .select()
        .from(approvalRequests)
        .where(eq(approvalRequests.quotationId, id))
        .orderBy(desc(approvalRequests.createdAt)),
      db
        .select()
        .from(dealHealth)
        .where(eq(dealHealth.quotationId, id))
        .limit(1),
    ],
  );
  const rules = await listActiveDiscountRules();
  const latest = requests[0];
  const steps = latest
    ? await db
        .select()
        .from(approvalSteps)
        .where(eq(approvalSteps.requestId, latest.id))
    : [];
  const pending = steps
    .filter((step) => step.status === "PENDING")
    .sort((a, b) => a.sequence - b.sequence)[0];
  return {
    ...quote,
    lines: lines.map((line) => {
      const match = productRows.find((p) => p.product.id === line.productId);
      return {
        ...line,
        allowedDiscount: evaluateLineDiscount(
          { ...line, categoryId: match?.category.id },
          rules,
          customerRows[0]?.tier ?? "BRONZE",
          "SALES_EXECUTIVE",
        ).allowedDiscount.toNumber(),
        productName: match?.product.name,
        categoryName: match?.category.name,
        categoryId: match?.category.id,
      };
    }),
    customer: customerRows[0] ?? null,
    auditTrail: history,
    salesExecName: ownerRows[0]
      ? [ownerRows[0].firstName, ownerRows[0].lastName].join(" ")
      : "",
    salesManagerApproved: steps.some(
      (step) =>
        step.requiredRole === "SALES_MANAGER" && step.status === "APPROVED",
    ),
    financeApproved: steps.some(
      (step) =>
        step.requiredRole === "FINANCE_OFFICER" && step.status === "APPROVED",
    ),
    approvalRole: pending?.requiredRole,
    reapprovalRequired:
      latest?.kind === "NEGOTIATION" && latest.status === "PENDING",
    negotiation: await findOpenNegotiation(id),
    dealHealthScore:
      health[0]?.healthScore ?? Math.max(0, 100 - quote.riskScore),
  };
}

export async function findSelectedPriceList(id: string) {
  const [list] = await db
    .select()
    .from(priceLists)
    .where(and(eq(priceLists.id, id), eq(priceLists.active, true)))
    .limit(1);
  return list ?? null;
}

export async function findDefaultPriceList() {
  const [priceList] = await db
    .select()
    .from(priceLists)
    .where(eq(priceLists.active, true))
    .limit(1);
  return priceList ?? null;
}

export async function insertQuote(values: typeof quotations.$inferInsert) {
  const [quote] = await db.insert(quotations).values(values).returning();
  return quote;
}

export async function findCustomer(id: string) {
  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, id))
    .limit(1);
  return customer ?? null;
}

export async function findCustomerByUserId(userId: string) {
  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.userId, userId))
    .limit(1);
  return customer ?? null;
}

export function findPricedProducts(priceListId: string, productIds: string[]) {
  return db
    .select({ product: products, price: priceListItems })
    .from(priceListItems)
    .innerJoin(products, eq(priceListItems.productId, products.id))
    .where(
      and(
        eq(priceListItems.priceListId, priceListId),
        inArray(priceListItems.productId, productIds),
      ),
    );
}

export function listActiveDiscountRules() {
  return db.select().from(discountRules).where(eq(discountRules.active, true));
}

export async function insertQuoteLines(
  values: Array<typeof quotationLines.$inferInsert>,
) {
  return db.insert(quotationLines).values(values).returning();
}

export function listUpsellRulesFor(productIds: string[]) {
  return db
    .select()
    .from(upsellRules)
    .where(
      and(
        eq(upsellRules.active, true),
        inArray(upsellRules.triggerProductId, productIds),
      ),
    );
}

export function findProductsByIds(productIds: string[]) {
  return db.select().from(products).where(inArray(products.id, productIds));
}

export function listInventoryForProducts(productIds: string[]) {
  return db
    .select()
    .from(inventory)
    .where(inArray(inventory.productId, productIds));
}

export async function insertRecommendations(
  values: Array<typeof upsellRecommendations.$inferInsert>,
) {
  if (!values.length) return [];
  return db.insert(upsellRecommendations).values(values).returning();
}

export async function updateQuote(
  id: string,
  values: Partial<typeof quotations.$inferInsert>,
) {
  const [quote] = await db
    .update(quotations)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(quotations.id, id))
    .returning();
  return quote ?? null;
}

export async function listQuoteLines(quotationId: string) {
  return db
    .select()
    .from(quotationLines)
    .where(eq(quotationLines.quotationId, quotationId));
}

export async function listActiveApprovalRules() {
  return db.select().from(approvalRules).where(eq(approvalRules.active, true));
}

export async function createApprovalChain(
  quotationId: string,
  steps: Array<{ role: string; sequence: number; ruleId?: string }>,
  kind: "INITIAL" | "NEGOTIATION" = "INITIAL",
) {
  const requestId = uuid();
  const [request] = await db
    .insert(approvalRequests)
    .values({ id: requestId, quotationId, status: "PENDING", kind })
    .returning();
  if (steps.length) {
    await db.insert(approvalSteps).values(
      steps.map((step) => ({
        id: uuid(),
        requestId,
        ruleId: step.ruleId,
        requiredRole:
          step.role as typeof approvalSteps.$inferInsert.requiredRole,
        sequence: step.sequence,
        status: "PENDING" as const,
      })),
    );
  }
  return request;
}

export async function createNegotiation(values: {
  quotationId: string;
  customerId: string;
  submittedById: string;
  requestType: "CHANGE_REQUEST" | "COUNTER_OFFER";
  customerNotes: string;
  changes: Array<{
    quotationLineId: string;
    fieldChanged: string;
    originalValue: string;
    requestedValue: string;
  }>;
}) {
  const id = uuid();
  const [negotiation] = await db
    .insert(negotiations)
    .values({
      id,
      quotationId: values.quotationId,
      customerId: values.customerId,
      submittedById: values.submittedById,
      requestType: values.requestType,
      customerNotes: values.customerNotes,
      status: "SUBMITTED",
    })
    .returning();
  const changes = await db
    .insert(negotiationChanges)
    .values(
      values.changes.map((change) => ({
        id: uuid(),
        negotiationId: id,
        ...change,
        status: "PENDING",
      })),
    )
    .returning();
  return { ...negotiation, changes };
}

export async function listRecommendations(quotationId: string) {
  return db
    .select()
    .from(upsellRecommendations)
    .where(eq(upsellRecommendations.quotationId, quotationId))
    .orderBy(desc(upsellRecommendations.score));
}

export async function findOpenNegotiation(quotationId: string) {
  const [record] = await db
    .select()
    .from(negotiations)
    .where(
      and(
        eq(negotiations.quotationId, quotationId),
        inArray(negotiations.status, ["OPEN", "SUBMITTED", "UNDER_REVIEW"]),
      ),
    )
    .limit(1);
  if (!record) return null;
  const changes = await db
    .select()
    .from(negotiationChanges)
    .where(eq(negotiationChanges.negotiationId, record.id));
  return { ...record, changes };
}

export async function setQuoteStatus(id: string, status: QuoteStatus) {
  return updateQuote(id, { status });
}

export async function updateQuoteLine(
  id: string,
  values: Partial<typeof quotationLines.$inferInsert>,
) {
  const [line] = await db
    .update(quotationLines)
    .set(values)
    .where(eq(quotationLines.id, id))
    .returning();
  return line;
}

export async function saveQuoteVersion(
  quotationId: string,
  version: number,
  snapshot: unknown,
  reason: string,
  createdById: string,
) {
  const [record] = await db
    .insert(quotationVersions)
    .values({
      id: uuid(),
      quotationId,
      version,
      snapshot,
      reason,
      createdById,
    })
    .returning();
  return record;
}

export async function closeNegotiation(
  id: string,
  status: "APPROVED" | "REJECTED",
) {
  const [record] = await db
    .update(negotiations)
    .set({ status, resolvedAt: new Date(), updatedAt: new Date() })
    .where(eq(negotiations.id, id))
    .returning();
  await db
    .update(negotiationChanges)
    .set({ status })
    .where(eq(negotiationChanges.negotiationId, id));
  return record;
}

export async function createOrderForQuote(
  quote: typeof quotations.$inferSelect,
) {
  const [existing] = await db
    .select()
    .from(salesOrders)
    .where(eq(salesOrders.quotationId, quote.id))
    .limit(1);
  if (existing) {
    const [fulfillment] = await db
      .select()
      .from(fulfillments)
      .where(eq(fulfillments.orderId, existing.id))
      .limit(1);
    return { order: existing, fulfillment };
  }
  const orderId = uuid();
  const [order] = await db
    .insert(salesOrders)
    .values({
      id: orderId,
      quotationId: quote.id,
      customerId: quote.customerId,
      orderNumber: `ORD-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${orderId.slice(0, 8).toUpperCase()}`,
    })
    .returning();
  const [fulfillment] = await db
    .insert(fulfillments)
    .values({ id: uuid(), orderId, quotationId: quote.id, status: "PENDING" })
    .returning();
  return { order, fulfillment };
}
