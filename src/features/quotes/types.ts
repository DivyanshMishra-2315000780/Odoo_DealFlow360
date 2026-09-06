import { z } from 'zod';

export const createQuoteInput = z.object({
  quoteRequestId: z.string().min(1).optional(),
  customerId: z.string().min(1).optional(),
  priceListId: z.string().min(1).optional(),
  currency: z.string().length(3).optional(),
  validityDate: z.coerce.date().optional(),
  paymentTerms: z.string().nullable().optional(),
  title: z.string().optional(),
  lines: z.array(z.object({
    productId: z.string().min(1), quantity: z.number().int().positive(),
    discountPercentage: z.union([z.string(), z.number()]).transform(Number).refine((value) => value >= 0 && value <= 100),
  }).strict()).min(1),
}).strict().refine((value) => value.quoteRequestId || value.customerId, {
  message: 'quoteRequestId or customerId is required',
});

export const updateQuoteInput = z.object({
  lines:z.array(z.object({productId:z.string().min(1),quantity:z.number().int().positive(),discountPercentage:z.number().min(0).max(100)}).strict()).min(1).optional(),
  validityDate: z.coerce.date().optional(),
  paymentTerms: z.string().nullable().optional(),
}).strict();

export const negotiationInput = z.object({
  requestType: z.enum(['CHANGE_REQUEST', 'COUNTER_OFFER']),
  customerNotes: z.string().trim().min(1).max(5000),
  changes: z.array(z.object({
    quotationLineId: z.string().min(1),
    fieldChanged: z.enum(['quantity', 'unitPrice', 'discountPercentage']),
    requestedValue: z.union([z.number(), z.string()]).transform(Number).refine(Number.isFinite),
  }).strict()).min(1),
}).strict();

export const negotiationReviewInput = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  comment: z.string().trim().max(5000).optional(),
}).strict();

export type CreateQuoteInput = z.infer<typeof createQuoteInput>;
export type QuoteStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'SENT' | 'UNDER_NEGOTIATION' |
  'RE_APPROVAL_REQUIRED' | 'CONFIRMED' | 'FULFILLMENT' | 'BILLING' | 'COMPLETED' | 'REJECTED' |
  'REVISION_REQUIRED' | 'CANCELLED';
