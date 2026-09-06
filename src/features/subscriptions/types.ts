import { z } from 'zod';

export const simulateSubscriptionInput = z.object({
  newQuantity: z.number().int().positive(), remainingDays: z.number().int().min(0).optional(), cycleDays: z.number().int().positive().optional(),
}).strict();
