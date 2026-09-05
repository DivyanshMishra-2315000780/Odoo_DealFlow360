export interface ApprovalStep {
  role: string;
  sequence: number;
  ruleId?: string;
}

interface ApprovalQuotation {
  totalDiscount: string | number;
  marginPercentage: string | number;
  totalAmount: string | number;
  previousVersionId?: string;
  materialChanged?: boolean;
}

interface ApprovalRule {
  id: string;
  condition: string;
  thresholdValue?: string | number;
  threshold?: string | number;
  requiredRole?: string;
  approverRole?: string;
  sequenceNumber?: number;
}

export function determineApprovalChain(
  quotation: ApprovalQuotation,
  riskResult: { riskScore: number },
  approvalRules: ApprovalRule[]
) {
  const steps: ApprovalStep[] = [
    { role: 'SALES_MANAGER', sequence: 1 },
    { role: 'FINANCE_OFFICER', sequence: 2 },
  ];
  let seq = 3;

  // Filter out self-approvals by evaluating rules
  for (const rule of approvalRules) {
    let triggered = false;

    const threshold = Number(rule.thresholdValue ?? rule.threshold ?? 0);
    if (rule.condition === 'DISCOUNT_ABOVE' && Number(quotation.totalDiscount) > threshold) triggered = true;
    if (rule.condition === 'MARGIN_BELOW' && Number(quotation.marginPercentage) < threshold) triggered = true;
    if (rule.condition === 'DEAL_VALUE_ABOVE' && Number(quotation.totalAmount) > threshold) triggered = true;
    if (rule.condition === 'RISK_LEVEL_ABOVE' && Number(riskResult.riskScore) > threshold) triggered = true;

    if (triggered) {
      const approverRole = rule.requiredRole ?? rule.approverRole;
      if (!approverRole) continue;
      if (!steps.find(s => s.role === approverRole)) {
        steps.push({ role: approverRole, sequence: seq++, ruleId: rule.id });
      }
    }
  }

  return {
    required: true,
    steps: steps.sort((a, b) => a.sequence - b.sequence)
  };
}
