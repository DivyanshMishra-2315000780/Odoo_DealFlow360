import { createNotification as persistNotification } from '@/features/notifications/service';
import { listUnread } from '@/features/notifications/repository';

export async function createNotification(
  userId: string,
  type: string,
  message: string,
  linkUrl?: string
) {
  try {
    const notification = await persistNotification({
      userId,
      type,
      message,
      linkUrl,
    });
    return notification;
  } catch (error) {
    console.error('Failed to create notification', error);
    throw new Error('Notification creation failed');
  }
}

export async function getUnreadNotifications(userId: string) {
  try {
    const notifications = await listUnread(userId);
    return notifications;
  } catch (error) {
    console.error('Failed to get notifications', error);
    throw new Error('Failed to fetch unread notifications');
  }
}
