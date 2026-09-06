import { z } from 'zod';

export const updateProfileInput = z.object({
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
  companyName: z.string().trim().min(1).optional(),
  industry: z.string().trim().nullable().optional(),
}).strict();
