import { and, desc, eq, isNull, or } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { db } from '@/db';
import { customers, quotations, quoteRequestItems, quoteRequests } from '@/db/schema';

export async function insertQuoteRequest(
  values: Omit<typeof quoteRequests.$inferInsert, 'id' | 'requestNumber'>,
  items: Array<Omit<typeof quoteRequestItems.$inferInsert, 'id' | 'quoteRequestId'>>,
) {
  const id = uuid();
  const [request] = await db.insert(quoteRequests).values({
    id, requestNumber: `RFQ-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${id.slice(0, 8).toUpperCase()}`,
    ...values,
  }).returning();
  const savedItems = await db.insert(quoteRequestItems).values(items.map((item) => ({ id: uuid(), quoteRequestId: id, ...item }))).returning();
  return { ...request, items: savedItems };
}

export async function findQuoteRequest(id: string) {
  const [request] = await db.select().from(quoteRequests).where(eq(quoteRequests.id, id)).limit(1);
  if (!request) return null;
  const items = await db.select().from(quoteRequestItems).where(eq(quoteRequestItems.quoteRequestId, id));
  const [customer]=await db.select().from(customers).where(eq(customers.id,request.customerId)).limit(1);
  const [quote]=await db.select({id:quotations.id}).from(quotations).where(eq(quotations.quoteRequestId,id)).limit(1);
  return { ...request, items,customer,quotationId:quote?.id };
}

export async function listQuoteRequestsFor(customerId: string | null, salesExecId: string | null) {
  const query = db.select().from(quoteRequests).orderBy(desc(quoteRequests.createdAt));
  if (customerId !== null) return Promise.all((await query.where(eq(quoteRequests.customerId, customerId))).map(row=>findQuoteRequest(row.id)));
  if (salesExecId) return Promise.all((await query.where(or(
    eq(quoteRequests.assignedSalesExecId, salesExecId),
    and(eq(quoteRequests.status, 'SUBMITTED'), isNull(quoteRequests.assignedSalesExecId)),
  ))).map(row=>findQuoteRequest(row.id)));
  return Promise.all((await query).map(row=>findQuoteRequest(row.id)));
}

export async function assignQuoteRequest(id: string, salesExecId: string) {
  const [request] = await db.update(quoteRequests).set({
    assignedSalesExecId: salesExecId, status: 'ASSIGNED', updatedAt: new Date(),
  }).where(and(eq(quoteRequests.id, id), eq(quoteRequests.status, 'SUBMITTED'))).returning();
  return request ?? null;
}

export async function markQuoteRequestQuoted(id: string) {
  const [request] = await db.update(quoteRequests).set({ status: 'QUOTED', updatedAt: new Date() })
    .where(eq(quoteRequests.id, id)).returning();
  return request ?? null;
}

export async function closeQuoteRequest(id: string) {
  const [request] = await db.update(quoteRequests).set({ status: 'CLOSED', updatedAt: new Date() })
    .where(eq(quoteRequests.id, id)).returning();
  return request ?? null;
}
