import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { dealHealth, dealHealthEvents, quotations } from '@/db/schema';

export function listHealthRecords() {
  return db.select({ health: dealHealth, quotation: quotations }).from(dealHealth)
    .innerJoin(quotations, eq(dealHealth.quotationId, quotations.id)).orderBy(desc(dealHealth.updatedAt));
}
export async function findHealthByQuote(quoteId: string) {
  const [record] = await db.select({ health: dealHealth, quotation: quotations }).from(dealHealth)
    .innerJoin(quotations, eq(dealHealth.quotationId, quotations.id))
    .where(eq(dealHealth.quotationId, quoteId)).limit(1);
  if (!record) return null;
  const events = await db.select().from(dealHealthEvents)
    .where(eq(dealHealthEvents.dealHealthId, record.health.id)).orderBy(desc(dealHealthEvents.createdAt));
  return { ...record, events };
}
