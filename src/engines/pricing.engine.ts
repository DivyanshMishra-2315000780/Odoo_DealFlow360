import Decimal from 'decimal.js';

export function calculateLineAmounts(
  quantity: string | number | Decimal,
  unitPrice: string | number | Decimal,
  unitCost: string | number | Decimal,
  discountPercentage: string | number | Decimal = 0
) {
  const q = new Decimal(quantity);
  const price = new Decimal(unitPrice);
  const cost = new Decimal(unitCost);
  const discountPct = new Decimal(discountPercentage).dividedBy(100);

  const grossAmount = q.mul(price);
  const discountAmount = grossAmount.mul(discountPct);
  const netAmount = grossAmount.minus(discountAmount);
  
  const lineCost = q.mul(cost);
  const lineProfit = netAmount.minus(lineCost);
  
  let lineMarginPercentage = new Decimal(0);
  if (!netAmount.isZero()) {
    lineMarginPercentage = lineProfit.dividedBy(netAmount).mul(100);
  }

  return {
    grossAmount,
    discountAmount,
    netAmount,
    lineCost,
    lineProfit,
    lineMarginPercentage,
  };
}

interface PricedLine {
  grossAmount?: string | number | Decimal;
  discountAmount?: string | number | Decimal;
  netAmount?: string | number | Decimal;
  lineCost?: string | number | Decimal;
  lineProfit?: string | number | Decimal;
}

export function calculateQuoteTotals(lines: PricedLine[]) {
  let subtotal = new Decimal(0);
  let totalDiscount = new Decimal(0);
  let netSubtotal = new Decimal(0);
  let totalCost = new Decimal(0);
  let totalProfit = new Decimal(0);

  for (const line of lines) {
    subtotal = subtotal.plus(new Decimal(line.grossAmount || 0));
    totalDiscount = totalDiscount.plus(new Decimal(line.discountAmount || 0));
    netSubtotal = netSubtotal.plus(new Decimal(line.netAmount || 0));
    totalCost = totalCost.plus(new Decimal(line.lineCost || 0));
    totalProfit = totalProfit.plus(new Decimal(line.lineProfit || 0));
  }

  let marginPercentage = new Decimal(0);
  if (!netSubtotal.isZero()) {
    marginPercentage = totalProfit.dividedBy(netSubtotal).mul(100);
  }

  return {
    subtotal,
    totalDiscount,
    netSubtotal,
    totalCost,
    totalProfit,
    marginPercentage,
  };
}
