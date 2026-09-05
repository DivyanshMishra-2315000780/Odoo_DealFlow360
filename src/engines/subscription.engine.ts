import Decimal from 'decimal.js';

export function calculateProration(
  currentQty: number,
  newQty: number,
  cyclePrice: number | string | Decimal,
  cycleDays: number,
  remainingDays: number
) {
  const price = new Decimal(cyclePrice);
  const dailyRate = price.dividedBy(cycleDays);
  
  const currentDailyTotal = dailyRate.mul(currentQty);
  const newDailyTotal = dailyRate.mul(newQty);
  
  const credit = currentDailyTotal.mul(remainingDays);
  const charge = newDailyTotal.mul(remainingDays);
  const netAdjustment = charge.minus(credit);
  
  return {
    dailyRate,
    credit,
    charge,
    netAdjustment
  };
}

export function calculateCancellationCredit(subscription: {
  cycleDays?: number; remainingDays?: number; cyclePrice?: number | string | Decimal;
}) {
  const cycleDays = subscription.cycleDays || 30;
  const remainingDays = subscription.remainingDays || 0;
  const cyclePrice = new Decimal(subscription.cyclePrice || 0);
  
  const dailyRate = cyclePrice.dividedBy(cycleDays);
  const credit = dailyRate.mul(remainingDays);
  
  return {
    unusedPeriod: remainingDays,
    credit,
    effectiveDate: new Date()
  };
}
