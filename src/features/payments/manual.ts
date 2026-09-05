import { z } from 'zod';
import Decimal from 'decimal.js';
import { eq } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { db } from '@/db';
import { payments } from '@/db/schema';
import { requirePermission } from '@/lib/auth/rbac';
import { BusinessError } from '@/lib/errors';
import { findInvoiceContext,completePayment } from './repository';
import { recordAudit } from '@/features/audit/service';
// Records an already received payment; never initiates a bank or gateway transaction.
export async function recordManualPayment(input:unknown){
  const user=await requirePermission('MANAGE_PAYMENTS');
  const values=z.object({invoiceId:z.string().min(1),amount:z.number().positive().finite(),method:z.string().trim().min(1),reference:z.string().trim().min(3).max(200)}).strict().parse(input);
  const context=await findInvoiceContext(values.invoiceId);
  if(!context)throw new BusinessError('Invoice not found','NOT_FOUND',404);
  const existing=await db.select().from(payments).where(eq(payments.gatewayReference,values.reference));
  if(existing.length){const prior=existing[0];if(prior.invoiceId===values.invoiceId&&new Decimal(prior.amount).eq(values.amount)&&prior.status==='SUCCESS')return prior;throw new BusinessError('Payment reference is already recorded','DUPLICATE_REFERENCE',409);}
  if(!['ISSUED','PARTIALLY_PAID','OVERDUE'].includes(context.invoice.status))throw new BusinessError('Invoice is not payable','INVALID_STATE',409);
  const amount=new Decimal(values.amount);
  if(amount.decimalPlaces()>2||amount.gt(context.invoice.amountDue))throw new BusinessError('Enter an amount up to the outstanding balance, with at most two decimal places','INVALID_AMOUNT',400);
  const id=uuid();
  await db.insert(payments).values({id,invoiceId:values.invoiceId,amount:amount.toFixed(2),status:'PENDING',paymentMethod:values.method,gatewayReference:values.reference});
  const payment=await completePayment(id,values.invoiceId,context.invoice.orderId,context.invoice.quotationId,values.reference);
  await db.update(payments).set({signatureVerified:false,gatewayPaymentId:null}).where(eq(payments.id,id));
  await recordAudit({actorId:user.userId,actorRole:user.role,entity:'Quotation',entityId:context.invoice.quotationId??values.invoiceId,action:'RECORD_MANUAL_PAYMENT',newValue:{invoiceId:values.invoiceId,amount:amount.toFixed(2),reference:values.reference}});
  return {...payment,signatureVerified:false,gatewayPaymentId:null};
}
