interface NegotiationQuotation { netTotal?: string | number; riskScore: number }
interface NegotiationChange {
  type: 'DISCOUNT_INCREASE' | 'QUANTITY_DECREASE' | 'PRICE_CHANGE';
  productId: string; amount?: number; percentage?: number; delta?: number;
}

export function evaluateNegotiation(quotation: NegotiationQuotation, changes: NegotiationChange[]) {
  let requiresReapproval = false;
  const reasons: string[] = [];
  
  let newTotal = Number(quotation.netTotal || 0);
  let newRisk = Number(quotation.riskScore || 0);

  for (const change of changes) {
    if (change.type === 'DISCOUNT_INCREASE') {
      requiresReapproval = true;
      reasons.push(`Discount increased on product ${change.productId} by ${change.amount}%`);
      newRisk += 10;
    }
    
    if (change.type === 'QUANTITY_DECREASE' && (change.percentage ?? 0) > 20) {
      requiresReapproval = true;
      reasons.push(`Quantity decreased significantly (over 20%) on ${change.productId}`);
    }
    
    if (change.type === 'PRICE_CHANGE') {
      newTotal += change.delta ?? 0;
    }
  }

  if (newRisk > 50 && quotation.riskScore <= 50) {
    requiresReapproval = true;
    reasons.push('Risk score crossed critical threshold due to negotiation changes');
  }

  return {
    requiresReapproval,
    newTotals: { netTotal: newTotal },
    newRisk,
    reasons
  };
}
