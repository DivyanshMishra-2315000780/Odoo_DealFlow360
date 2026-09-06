import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { subscriptionPlans, subscriptions } from '@/db/schema';

export function listSubscriptionPlans() {
  return db.select().from(subscriptionPlans).orderBy(subscriptionPlans.price);
}

export async function listSubscriptionsFor(customerId?: string) {
  const query = db.select({ subscription: subscriptions, plan: subscriptionPlans }).from(subscriptions)
    .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id)).orderBy(desc(subscriptions.createdAt));
  return customerId ? query.where(eq(subscriptions.customerId, customerId)) : query;
}
export async function findSubscription(id: string) {
  const [record] = await db.select({ subscription: subscriptions, plan: subscriptionPlans }).from(subscriptions)
    .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
    .where(eq(subscriptions.id, id)).limit(1);
  return record ?? null;
}
