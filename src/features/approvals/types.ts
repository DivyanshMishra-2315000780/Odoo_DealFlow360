import { z } from 'zod';

export const approvalDecisionInput = z.object({ comment: z.string().max(5000).optional() }).strict();
export type ApprovalAction = 'APPROVED' | 'REJECTED' | 'REVISION_REQUIRED';
