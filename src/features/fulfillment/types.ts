import { z } from 'zod';

export const confirmAllocationsInput = z.object({
  allocations: z.array(z.object({
    productId: z.string().min(1), warehouseId: z.string().min(1), allocatedQty: z.number().int().positive(),
  }).strict()),
}).strict();

export const fulfillmentStatusInput = z.object({ status: z.enum(['SHIPPED', 'DELIVERED']) }).strict();
