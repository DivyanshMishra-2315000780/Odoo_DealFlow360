import { z } from 'zod';

export const createCheckoutInput = z.object({ invoiceId: z.string().min(1) }).strict();
export const verifyPaymentInput = z.object({
  paymentId: z.string().min(1),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().regex(/^[a-f0-9]{64}$/i),
}).strict();
