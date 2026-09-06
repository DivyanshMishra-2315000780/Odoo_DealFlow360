import { and, desc, eq, inArray } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { db } from '@/db';
import { notifications } from '@/db/schema';
import type { CreateNotificationInput } from './types';

export async function insertNotification(input: CreateNotificationInput) {
  const [notification] = await db.insert(notifications).values({ id: uuid(), ...input }).returning();
  return notification;
}
export function listUnread(userId: string) {
  return db.select().from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.read, false)))
    .orderBy(desc(notifications.createdAt));
}
export async function markRead(userId: string, ids?: string[]) {
  const filter = ids?.length
    ? and(eq(notifications.userId, userId), inArray(notifications.id, ids))
    : eq(notifications.userId, userId);
  return db.update(notifications).set({ read: true }).where(filter).returning();
}
