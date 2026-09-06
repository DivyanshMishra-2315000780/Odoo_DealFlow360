export const VALID_TRANSITIONS: Record<string, string[]> = {
  'DRAFT': ['PENDING_APPROVAL', 'APPROVED', 'CANCELLED'],
  'PENDING_APPROVAL': ['APPROVED', 'SENT', 'REJECTED', 'REVISION_REQUIRED', 'CANCELLED'],
  'APPROVED': ['SENT', 'UNDER_NEGOTIATION', 'CONFIRMED', 'CANCELLED'],
  'SENT': ['UNDER_NEGOTIATION', 'CONFIRMED', 'FULFILLMENT', 'CANCELLED'],
  'UNDER_NEGOTIATION': ['PENDING_APPROVAL', 'SENT', 'CONFIRMED', 'CANCELLED'],
  'RE_APPROVAL_REQUIRED': ['PENDING_APPROVAL', 'CANCELLED'],
  'CONFIRMED': ['FULFILLMENT', 'CANCELLED'],
  'FULFILLMENT': ['BILLING', 'CANCELLED'],
  'BILLING': ['COMPLETED', 'CANCELLED'],
  'COMPLETED': [],
  'REJECTED': ['DRAFT', 'CANCELLED'],
  'REVISION_REQUIRED': ['DRAFT', 'CANCELLED'],
  'CANCELLED': []
};

export function canTransition(currentStatus: string, targetStatus: string, context?: { requiresApproval?: boolean }): { allowed: boolean, reason?: string } {
  const allowedTargets = VALID_TRANSITIONS[currentStatus] || [];
  
  if (!allowedTargets.includes(targetStatus)) {
    return { allowed: false, reason: `Cannot transition from ${currentStatus} to ${targetStatus}` };
  }

  // Custom preconditions based on context
  if (currentStatus === 'DRAFT' && targetStatus === 'APPROVED' && context?.requiresApproval) {
    return { allowed: false, reason: 'Quotation requires approval before being APPROVED' };
  }

  return { allowed: true };
}

export function transition(quotationId: string, currentStatus: string, targetStatus: string, context?: { requiresApproval?: boolean }) {
  const check = canTransition(currentStatus, targetStatus, context);
  
  if (!check.allowed) {
    throw new Error(`Invalid transition: ${check.reason}`);
  }

  // Normally we would update DB here or return the new state for the caller to save
  return {
    quotationId,
    previousStatus: currentStatus,
    newStatus: targetStatus,
    transitionedAt: new Date(),
    context
  };
}
