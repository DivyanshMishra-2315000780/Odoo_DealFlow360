import { requireAuth } from '@/lib/auth/rbac';
import { insertNotification, listUnread, markRead } from './repository';
import { markNotificationsInput, type CreateNotificationInput } from './types';

export const createNotification = (input: CreateNotificationInput) => insertNotification(input);

export async function getMyNotifications() {
  const user = await requireAuth();
  return listUnread(user.userId);
}
export async function markMyNotifications(input: unknown) {
  const user = await requireAuth();
  const values = markNotificationsInput.parse(input);
  return markRead(user.userId, values.ids);
}
