import { count, desc, sum } from 'drizzle-orm';
import { db } from '@/db';
import { quotations } from '@/db/schema';

export function getDealStatusReport() {
  return db.select({
    status: quotations.status,
    deals: count(),
    value: sum(quotations.totalAmount),
  }).from(quotations).groupBy(quotations.status).orderBy(desc(count()));
}
