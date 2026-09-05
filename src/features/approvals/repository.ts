import { BusinessError } from '@/lib/errors';
import { and, asc, eq, lt, ne } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { db } from '@/db';
import { approvalDecisions, approvalRequests, approvalSteps, quotations } from '@/db/schema';
import type { ApprovalAction } from './types';

export function listPendingSteps(role: typeof approvalSteps.$inferSelect.requiredRole) {
  return db.select({ step: approvalSteps, request: approvalRequests, quotation: quotations })
    .from(approvalSteps)
    .innerJoin(approvalRequests, eq(approvalSteps.requestId, approvalRequests.id))
    .innerJoin(quotations, eq(approvalRequests.quotationId, quotations.id))
    .where(and(eq(approvalSteps.requiredRole, role), eq(approvalSteps.status, 'PENDING')))
    .orderBy(asc(approvalSteps.sequence));
}

export async function findApprovalRequest(id: string) {
  const [request] = await db.select().from(approvalRequests).where(eq(approvalRequests.id, id)).limit(1);
  if (!request) return null;
  const [steps, decisions] = await Promise.all([
    db.select().from(approvalSteps).where(eq(approvalSteps.requestId, id)).orderBy(asc(approvalSteps.sequence)),
    db.select({ decision: approvalDecisions, step: approvalSteps }).from(approvalDecisions)
      .innerJoin(approvalSteps, eq(approvalDecisions.stepId, approvalSteps.id))
      .where(eq(approvalSteps.requestId, id)),
  ]);
  return { ...request, steps, decisions: decisions.map(({ decision }) => decision) };
}

export async function findApprovalStep(id: string) {
  const [result] = await db.select({ step: approvalSteps, request: approvalRequests })
    .from(approvalSteps).innerJoin(approvalRequests, eq(approvalSteps.requestId, approvalRequests.id))
    .where(eq(approvalSteps.id, id)).limit(1);
  return result ?? null;
}

export async function saveDecision(stepId: string, userId: string, action: ApprovalAction, comment?: string) {
  const [step] = await db.update(approvalSteps).set({ status: action, updatedAt: new Date() })
    .where(and(eq(approvalSteps.id, stepId),eq(approvalSteps.status,'PENDING'))).returning();
  if(!step)throw new BusinessError('Approval already decided','INVALID_STATE',409);
  const [decision] = await db.insert(approvalDecisions).values({ id: uuid(), stepId, userId, action, comment }).returning();
  return { step, decision };
}

export async function hasUnapprovedSteps(requestId: string, currentStepId: string) {
  const [step] = await db.select({ id: approvalSteps.id }).from(approvalSteps).where(and(
    eq(approvalSteps.requestId, requestId), ne(approvalSteps.id, currentStepId), ne(approvalSteps.status, 'APPROVED'),
  )).limit(1);
  return Boolean(step);
}

export async function hasPendingPriorSteps(requestId: string, sequence: number) {
  const [step] = await db.select({ id: approvalSteps.id }).from(approvalSteps).where(and(
    eq(approvalSteps.requestId, requestId), lt(approvalSteps.sequence, sequence), ne(approvalSteps.status, 'APPROVED'),
  )).limit(1);
  return Boolean(step);
}

export async function finishRequest(
  requestId: string,
  quotationId: string,
  action: ApprovalAction,
  kind: typeof approvalRequests.$inferSelect.kind,
) {
  await db.update(approvalRequests).set({ status: action, updatedAt: new Date() }).where(eq(approvalRequests.id, requestId));
  if(action!=='APPROVED')await db.update(approvalSteps).set({status:'SKIPPED',updatedAt:new Date()}).where(and(eq(approvalSteps.requestId,requestId),eq(approvalSteps.status,'PENDING')));
  const quoteStatus = action === 'APPROVED' && kind === 'NEGOTIATION' ? 'SENT' : action;
  const [quote] = await db.update(quotations).set({ status: quoteStatus, updatedAt: new Date() })
    .where(eq(quotations.id, quotationId)).returning();
  return quote;
}
