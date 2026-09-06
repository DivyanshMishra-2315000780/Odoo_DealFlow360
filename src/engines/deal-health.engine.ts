interface HealthQuotation { marginPercentage: string | number; fulfillmentRisk?: string }
interface HealthEvent { type: string; days?: number }

export function calculateDealHealth(quotation: HealthQuotation, events: HealthEvent[]) {
  let healthScore = 100;
  const contributingFactors: string[] = [];

  // Evaluate recent events
  for (const event of events) {
    if (event.type === 'INACTIVITY' && (event.days ?? 0) > 14) {
      healthScore -= 15;
      contributingFactors.push(`Inactivity for ${event.days ?? 0} days (-15)`);
    }
    if (event.type === 'DISCOUNT_ANOMALY') {
      healthScore -= 20;
      contributingFactors.push('Discount anomaly detected (-20)');
    }
    if (event.type === 'DELIVERY_SLIPPAGE') {
      healthScore -= 10;
      contributingFactors.push('Delivery slippage risk (-10)');
    }
    if (event.type === 'APPROVAL_DELAY') {
      healthScore -= 10;
      contributingFactors.push('Approval delay (-10)');
    }
  }

  // Evaluate intrinsic quotation risk
  if (Number(quotation.marginPercentage) < 20) {
    healthScore -= 25;
    contributingFactors.push('Margin risk: below 20% (-25)');
  }
  
  if (quotation.fulfillmentRisk === 'HIGH') {
    healthScore -= 15;
    contributingFactors.push('High fulfillment risk (-15)');
  }

  healthScore = Math.max(0, healthScore);
  
  let status = 'HEALTHY';
  if (healthScore < 40) {
    status = 'CRITICAL';
  } else if (healthScore < 70) {
    status = 'WATCH';
  }

  return {
    healthScore,
    status,
    contributingFactors
  };
}
