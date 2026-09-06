import Decimal from 'decimal.js';

interface RiskQuotation { customerTier?: string }
interface DiscountRiskResult { blendedDiscountRisk?: string | number | Decimal; quotationDiscountStatus: string }

export function calculateRisk(
  quotation: RiskQuotation,
  discountResult: DiscountRiskResult,
  marginPct: number | Decimal,
  dealValue: number | Decimal
) {
  let riskScore = 0;
  const reasons: string[] = [];
  
  const margin = new Decimal(marginPct);
  const value = new Decimal(dealValue);
  const blendedRisk = new Decimal(discountResult.blendedDiscountRisk || 0);

  // Discount violation
  if (discountResult.quotationDiscountStatus === 'EXCEEDED') {
    const points = Math.min(30, blendedRisk.mul(5).toNumber());
    riskScore += points;
    reasons.push(`Discount limit exceeded. Blended risk contribution: ${blendedRisk.toFixed(2)}`);
  }

  // Margin deterioration
  const targetMargin = new Decimal(30); // Configurable default
  if (margin.lessThan(targetMargin)) {
    const drop = targetMargin.minus(margin);
    const points = Math.min(40, drop.mul(2).toNumber());
    riskScore += points;
    reasons.push(`Projected margin dropped to ${margin.toFixed(2)}% (Target: ${targetMargin}%)`);
  }

  // Deal size risk
  const highValueThreshold = new Decimal(100000); // Configurable
  if (value.greaterThan(highValueThreshold)) {
    riskScore += 10;
    reasons.push(`High deal value: ${value.toFixed(2)}`);
  }

  // Customer tier
  if (quotation.customerTier === 'NEW' || quotation.customerTier === 'HIGH_RISK') {
    riskScore += 20;
    reasons.push(`Customer tier is ${quotation.customerTier}`);
  }

  let riskLevel = 'LOW';
  let requiredApprovalLevel = 1;

  if (riskScore > 75) {
    riskLevel = 'CRITICAL';
    requiredApprovalLevel = 4;
  } else if (riskScore > 50) {
    riskLevel = 'HIGH';
    requiredApprovalLevel = 3;
  } else if (riskScore > 25) {
    riskLevel = 'MEDIUM';
    requiredApprovalLevel = 2;
  }

  return {
    riskScore,
    riskLevel,
    riskReasons: reasons,
    requiredApprovalLevel
  };
}
