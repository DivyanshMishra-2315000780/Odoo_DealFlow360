import { z } from 'zod';

export const markNotificationsInput = z.object({ ids: z.array(z.string()).optional() }).strict();
export interface CreateNotificationInput { userId: string; type: string; message: string; linkUrl?: string }
