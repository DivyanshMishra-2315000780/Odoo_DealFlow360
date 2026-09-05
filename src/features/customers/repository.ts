import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { customers, users } from '@/db/schema';

export async function findCustomerProfile(userId: string) {
  const [profile] = await db.select({ user: users, customer: customers }).from(users)
    .innerJoin(customers, eq(customers.userId, users.id)).where(eq(users.id, userId)).limit(1);
  return profile ?? null;
}

export async function updateCustomerProfile(
  userId: string,
  customerId: string,
  userValues: Partial<Pick<typeof users.$inferInsert, 'firstName' | 'lastName'>>,
  customerValues: Partial<Pick<typeof customers.$inferInsert, 'name' | 'industry'>>,
) {
  if (Object.keys(userValues).length) await db.update(users).set({ ...userValues, updatedAt: new Date() }).where(eq(users.id, userId));
  if (Object.keys(customerValues).length) await db.update(customers).set({ ...customerValues, updatedAt: new Date() }).where(eq(customers.id, customerId));
  return findCustomerProfile(userId);
}
