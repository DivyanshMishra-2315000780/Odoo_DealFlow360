import { SubscriptionPlan } from '@/types/auth';

export const PLAN_PRICING: Record<SubscriptionPlan, { name: string; monthlyRate: number; seats: number }> = {
  NONE: { name: '14-Day Free Trial', monthlyRate: 0, seats: 2 },
  STARTER: { name: 'Starter Deal Desk', monthlyRate: 499, seats: 5 },
  PROFESSIONAL: { name: 'Professional Suite', monthlyRate: 1499, seats: 25 },
  ENTERPRISE: { name: 'Global Enterprise', monthlyRate: 3999, seats: 100 },
};

export interface ProrationCalculation {
  currentPlan: SubscriptionPlan;
  newPlan: SubscriptionPlan;
  currentRate: number;
  newRate: number;
  rateDifferential: number;
  daysRemaining: number;
  totalDaysInCycle: number;
  proratedAmount: number;
  isUpgrade: boolean;
  explanation: string;
}

/**
 * Calculates accurate prorated subscription charges / credits
 * based on the remaining days in the active 30-day billing cycle.
 */
export function calculateSubscriptionProration({
  currentPlan,
  newPlan,
  daysRemaining = 18,
  totalDaysInCycle = 30,
}: {
  currentPlan: SubscriptionPlan;
  newPlan: SubscriptionPlan;
  daysRemaining?: number;
  totalDaysInCycle?: number;
}): ProrationCalculation {
  const currentRate = PLAN_PRICING[currentPlan]?.monthlyRate || 0;
  const newRate = PLAN_PRICING[newPlan]?.monthlyRate || 0;
  const rateDifferential = newRate - currentRate;
  const isUpgrade = rateDifferential > 0;

  // Formula: (daysRemaining / totalDaysInCycle) * (newRate - currentRate)
  const exactProration = (daysRemaining / totalDaysInCycle) * rateDifferential;
  const proratedAmount = Math.round(exactProration * 100) / 100;

  let explanation = '';
  if (currentPlan === newPlan) {
    explanation = 'No change in plan.';
  } else if (isUpgrade) {
    explanation = `Upgrading from ${PLAN_PRICING[currentPlan].name} to ${PLAN_PRICING[newPlan].name}. Prorated charge for ${daysRemaining} remaining days in the current cycle: $${proratedAmount.toLocaleString()}.`;
  } else {
    explanation = `Downgrading from ${PLAN_PRICING[currentPlan].name} to ${PLAN_PRICING[newPlan].name}. A prorated credit of $${Math.abs(proratedAmount).toLocaleString()} will be applied to your next invoice.`;
  }

  return {
    currentPlan,
    newPlan,
    currentRate,
    newRate,
    rateDifferential,
    daysRemaining,
    totalDaysInCycle,
    proratedAmount,
    isUpgrade,
    explanation,
  };
}
