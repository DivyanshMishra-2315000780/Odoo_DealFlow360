import Decimal from 'decimal.js';

export const ZERO = new Decimal(0);

export function toDecimal(value: string | number | Decimal): Decimal {
  if (value instanceof Decimal) return value;
  return new Decimal(value || 0);
}

export function multiply(a: string | number | Decimal, b: string | number | Decimal): Decimal {
  return toDecimal(a).times(toDecimal(b));
}

export function divide(a: string | number | Decimal, b: string | number | Decimal): Decimal {
  const divBy = toDecimal(b);
  if (divBy.isZero()) {
    throw new Error('Division by zero');
  }
  return toDecimal(a).dividedBy(divBy);
}

export function add(a: string | number | Decimal, b: string | number | Decimal): Decimal {
  return toDecimal(a).plus(toDecimal(b));
}

export function subtract(a: string | number | Decimal, b: string | number | Decimal): Decimal {
  return toDecimal(a).minus(toDecimal(b));
}

export function percentage(amount: string | number | Decimal, pct: string | number | Decimal): Decimal {
  return multiply(amount, divide(pct, 100));
}
