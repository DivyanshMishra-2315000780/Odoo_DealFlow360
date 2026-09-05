import { CustomerTier } from '@/types/dealflow';

export interface CustomerActivityMetrics {
  annualSpend: number;
  dealCount: number;
  creditRating: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B';
  contractHistoryYears: number;
}

export interface TierCriteria {
  tier: CustomerTier;
  minSpend: number;
  minDeals: number;
  maxDiscountHardware: number;
  maxDiscountServices: number;
  description: string;
}

export const TIER_QUALIFICATION_MATRIX: Record<CustomerTier, TierCriteria> = {
  Gold: {
    tier: 'Gold',
    minSpend: 300000,
    minDeals: 3,
    maxDiscountHardware: 15,
    maxDiscountServices: 10,
    description: 'Enterprise priority account ($300k+ annual spend, ≥3 closed deals, premium credit). Hardware discounts up to 15%.',
  },
  Silver: {
    tier: 'Silver',
    minSpend: 100000,
    minDeals: 2,
    maxDiscountHardware: 10,
    maxDiscountServices: 10,
    description: 'Mid-market growth account ($100k-$300k annual spend, ≥2 closed deals). Maximum 10% on Hardware and Services.',
  },
  Bronze: {
    tier: 'Bronze',
    minSpend: 0,
    minDeals: 0,
    maxDiscountHardware: 5,
    maxDiscountServices: 5,
    description: 'Baseline introductory account ($0-$100k spend). Maximum 5% across all categories. Automatically assigned to all new registrations.',
  },
};

/**
 * System-assigned tier evaluation engine.
 * Customer Tier is NEVER selected by the customer in production;
 * it is computed objectively from verified corporate transactions and spend.
 */
export function evaluateSystemAssignedTier(metrics: CustomerActivityMetrics): {
  assignedTier: CustomerTier;
  nextTier?: CustomerTier;
  spendProgressPercent: number;
  remainingSpendForNextTier: number;
  governanceNote: string;
} {
  if (metrics.annualSpend >= TIER_QUALIFICATION_MATRIX.Gold.minSpend && metrics.dealCount >= 3) {
    return {
      assignedTier: 'Gold',
      spendProgressPercent: 100,
      remainingSpendForNextTier: 0,
      governanceNote: 'Top-tier enterprise standing achieved. 15% Hardware discount ceiling unlocked. Category limits remain non-bypassable.',
    };
  }

  if (metrics.annualSpend >= TIER_QUALIFICATION_MATRIX.Silver.minSpend && metrics.dealCount >= 2) {
    const remaining = TIER_QUALIFICATION_MATRIX.Gold.minSpend - metrics.annualSpend;
    const progress = Math.min(100, Math.round((metrics.annualSpend / TIER_QUALIFICATION_MATRIX.Gold.minSpend) * 100));
    return {
      assignedTier: 'Silver',
      nextTier: 'Gold',
      spendProgressPercent: progress,
      remainingSpendForNextTier: Math.max(0, remaining),
      governanceNote: 'Silver tier qualified. Requires $300k spend and ≥3 deals to qualify for Gold tier evaluation.',
    };
  }

  const remaining = TIER_QUALIFICATION_MATRIX.Silver.minSpend - metrics.annualSpend;
  const progress = Math.min(100, Math.round((metrics.annualSpend / TIER_QUALIFICATION_MATRIX.Silver.minSpend) * 100));
  return {
    assignedTier: 'Bronze',
    nextTier: 'Silver',
    spendProgressPercent: progress,
    remainingSpendForNextTier: Math.max(0, remaining),
    governanceNote: 'Baseline introductory tier. Tiers are automatically re-evaluated quarterly based on verifiable invoice settlement.',
  };
}
