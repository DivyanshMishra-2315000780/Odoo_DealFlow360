import Decimal from 'decimal.js';

interface DiscountLine {
  id?: string;
  productId?: string;
  discountPercentage?: string | number;
  categoryId?: string | null;
  netAmount?: string | number;
}

interface DiscountRule {
  customerTier?: string | null;
  userRole?: string | null;
  categoryId?: string | null;
  productId?: string | null;
  maxDiscountPct: string | number;
}

interface DiscountQuotation { salesExecRole: string }

export function evaluateLineDiscount(
  line: DiscountLine,
  discountRules: DiscountRule[],
  customerTier: string,
  userRole: string
) {
  const reqDiscount = new Decimal(line.discountPercentage || 0);
  let allowedDiscount = new Decimal(5); // fallback default 5%

  const applicableRules = discountRules.filter(r => 
    (!r.customerTier || r.customerTier === customerTier) &&
    (!r.userRole || r.userRole === userRole) &&
    (!r.categoryId || r.categoryId === line.categoryId) &&
    (!r.productId || r.productId === line.productId)
  );

  if (applicableRules.length > 0) {
    allowedDiscount = Decimal.min(...applicableRules.map(r => new Decimal(r.maxDiscountPct)));
  }

  let excessDiscount = new Decimal(0);
  let status = 'COMPLIANT';
  const reasons: string[] = [];

  if (reqDiscount.greaterThan(allowedDiscount)) {
    excessDiscount = reqDiscount.minus(allowedDiscount);
    status = 'EXCEEDED';
    reasons.push(`Discount of ${reqDiscount}% exceeds allowed limit of ${allowedDiscount}% by ${excessDiscount}%`);
  }

  return {
    allowedDiscount,
    requestedDiscount: reqDiscount,
    excessDiscount,
    status,
    reasons
  };
}

export function evaluateQuotationDiscounts(
  quotation: DiscountQuotation,
  lines: DiscountLine[],
  rules: DiscountRule[],
  customerTier: string
) {
  const lineResults = [];
  let blendedDiscountRisk = new Decimal(0);
  let quotationDiscountStatus = 'COMPLIANT';

  const totalNetAmount = lines.reduce((sum, line) => sum.plus(new Decimal(line.netAmount || 0)), new Decimal(0));

  for (const line of lines) {
    const res = evaluateLineDiscount(line, rules, customerTier, quotation.salesExecRole);
    lineResults.push({ lineId: line.id, ...res });

    if (res.status === 'EXCEEDED') {
      quotationDiscountStatus = 'EXCEEDED';
    }

    if (!totalNetAmount.isZero() && res.excessDiscount.greaterThan(0)) {
      const lineWeight = new Decimal(line.netAmount || 0).dividedBy(totalNetAmount);
      const lineRiskContribution = res.excessDiscount.mul(lineWeight);
      blendedDiscountRisk = blendedDiscountRisk.plus(lineRiskContribution);
    }
  }

  return {
    lineResults,
    blendedDiscountRisk,
    quotationDiscountStatus
  };
}
