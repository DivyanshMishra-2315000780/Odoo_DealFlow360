import { z } from 'zod';

const requirementItem = z.object({
  productId: z.string().min(1).optional(), description: z.string().trim().min(1),
  quantity: z.number().int().positive().default(1), requirements: z.record(z.string(), z.unknown()).optional(),
}).strict();

export const createQuoteRequestInput = z.object({
  title: z.string().trim().min(3).max(200), description: z.string().trim().min(10).max(10000),
  budget: z.union([z.string(), z.number()]).transform(String).optional(), targetDate: z.coerce.date().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(), items: z.array(requirementItem).min(1),
}).strict();

export const assignQuoteRequestInput = z.object({ assignedSalesExecId: z.string().min(1).optional() }).strict();
