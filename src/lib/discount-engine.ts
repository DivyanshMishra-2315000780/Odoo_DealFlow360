import {
  CustomerTier,
  ProductCategory,
  CUSTOMER_TIER_LIMITS,
  CATEGORY_DISCOUNT_LIMITS,
  QuotationLineItem,
  RiskDiagnosis,
  RiskLevel,
} from '@/types/dealflow';

/**
 * Calculates the strict effective discount limit for a product category under a customer's tier.
 * Formula: minimum(customer tier limit, category limit)
 */
export function calculateEffectiveDiscountLimit(
  tier: CustomerTier,
  category: ProductCategory
): number {
  const tierLimit = CUSTOMER_TIER_LIMITS[tier];
  const categoryLimit = CATEGORY_DISCOUNT_LIMITS[category];
  return Math.min(tierLimit, categoryLimit);
}

/**
 * Evaluates a single quotation line item against policy.
 */
export function evaluateLineItem(
  item: Omit<QuotationLineItem, 'effectiveLimit' | 'isViolation' | 'excessPercent' | 'lineTotal'>,
  tier: CustomerTier
): QuotationLineItem {
  const effectiveLimit = calculateEffectiveDiscountLimit(tier, item.category);
  const isViolation = item.discountPercent > effectiveLimit;
  const excessPercent = isViolation ? item.discountPercent - effectiveLimit : 0;

  const rawSubtotal = item.unitPrice * item.quantity;
  const discountAmount = rawSubtotal * (item.discountPercent / 100);
  const lineTotal = Math.round((rawSubtotal - discountAmount) * 100) / 100;

  return {
    ...item,
    effectiveLimit,
    isViolation,
    excessPercent,
    lineTotal,
  };
}

/**
 * Computes quotation aggregate amounts, discount total, and overall risk diagnosis.
 * Incorporates the enterprise principle:
 * - What happened?
 * - Why does it matter?
 * - What should the user do next?
 */
export function evaluateQuotationRisk(
  items: QuotationLineItem[],
  tier: CustomerTier
): {
  subtotal: number;
  totalDiscountAmount: number;
  grandTotal: number;
  riskDiagnosis: RiskDiagnosis;
  dealHealthScore: number;
} {
  let subtotal = 0;
  let grandTotal = 0;
  const violations: QuotationLineItem[] = [];

  for (const item of items) {
    const itemRaw = item.unitPrice * item.quantity;
    subtotal += itemRaw;
    grandTotal += item.lineTotal;
    if (item.isViolation) {
      violations.push(item);
    }
  }

  const totalDiscountAmount = Math.max(0, Math.round((subtotal - grandTotal) * 100) / 100);
  const averageDiscount = subtotal > 0 ? (totalDiscountAmount / subtotal) * 100 : 0;

  // Evaluate risk level & diagnosis
  let level: RiskLevel = 'LOW';
  let whatHappened = 'All line item discounts comply with tier and category threshold caps.';
  let whyItMatters = 'Margin targets preserved. Routine automated approval workflow qualifies.';
  let nextAction = 'Ready for commercial confirmation or client dispatch.';
  let requiresFinanceApproval = false;
  let requiresExecutiveApproval = false;
  let dealHealthScore = 95;

  if (violations.length > 0) {
    const maxExcess = Math.max(...violations.map((v) => v.excessPercent));
    const violationNames = violations.map((v) => `${v.productName} (+${v.excessPercent}% excess)`).join(', ');

    dealHealthScore = Math.max(20, Math.round(90 - violations.length * 15 - maxExcess * 2));

    if (maxExcess > 10 || totalDiscountAmount > 15000) {
      level = 'CRITICAL';
      requiresFinanceApproval = true;
      requiresExecutiveApproval = true;
      whatHappened = `Critical policy breach: ${violationNames}. Discount ceiling breached by up to ${maxExcess} percentage points.`;
      whyItMatters = `Significant gross margin dilution exceeding executive governance limits. Customer tier (${tier}) does not bypass approval policies.`;
      nextAction = 'Route to VP of Sales and CFO for joint executive override review before issuing contract.';
    } else if (maxExcess > 5 || violations.length > 1) {
      level = 'HIGH';
      requiresFinanceApproval = true;
      whatHappened = `High discount violation detected on ${violationNames}. Permitted limit exceeded.`;
      whyItMatters = `Service/Hardware discount caps exceeded for ${tier} tier. Requires financial authorization.`;
      nextAction = 'Finance approval required. Re-evaluate service delivery margin or submit for manager approval.';
    } else {
      level = 'MEDIUM';
      requiresFinanceApproval = false;
      whatHappened = `Moderate variance on ${violationNames}.`;
      whyItMatters = `Line item exceeds standard policy by ${maxExcess} percentage points.`;
      nextAction = 'Sales Manager approval required prior to quotation dispatch.';
    }
  } else if (averageDiscount > 12) {
    level = 'MEDIUM';
    dealHealthScore = 80;
    whatHappened = `Aggregate discount across all lines reaches ${averageDiscount.toFixed(1)}%.`;
    whyItMatters = 'Deal size is substantial; aggregate discount approaches upper tier allowance.';
    nextAction = 'Review overall margin impact before final contract binding.';
  }

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    totalDiscountAmount,
    grandTotal: Math.round(grandTotal * 100) / 100,
    riskDiagnosis: {
      level,
      whatHappened,
      whyItMatters,
      nextAction,
      requiresFinanceApproval,
      requiresExecutiveApproval,
    },
    dealHealthScore,
  };
}
