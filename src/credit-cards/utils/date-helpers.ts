export interface YearMonth {
  year: number;
  month: number; // 1-12
}

export interface CardDateConfig {
  closingDay: number;
  dueDay: number;
  paymentDay: number;
}

export interface InvoiceDates {
  closingDate: Date;
  dueDate: Date;
  paymentDate: Date;
}

export function clampDay(year: number, month: number, day: number): number {
  // new Date(year, month, 0) = last day of `month` (1-12)
  return Math.min(day, new Date(year, month, 0).getDate());
}

export function buildDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, clampDay(year, month, day)));
}

export function addMonths(
  year: number,
  month: number,
  offset: number,
): YearMonth {
  const total = year * 12 + (month - 1) + offset;
  return { year: Math.floor(total / 12), month: (total % 12) + 1 };
}

// Installment 1 of a new purchase: if purchaseDate.day <= closingDay (clamped),
// it lands in THIS month's invoice; otherwise NEXT month's.
export function getBaseInvoiceMonth(
  purchaseDate: Date,
  closingDay: number,
): YearMonth {
  const y = purchaseDate.getUTCFullYear();
  const m = purchaseDate.getUTCMonth() + 1;
  const d = purchaseDate.getUTCDate();
  const closingThisMonth = clampDay(y, m, closingDay);
  return d <= closingThisMonth ? { year: y, month: m } : addMonths(y, m, 1);
}

// Installment n (1-based) = base month + (n-1)
export function getInstallmentInvoiceMonth(
  purchaseDate: Date,
  closingDay: number,
  n: number,
): YearMonth {
  const base = getBaseInvoiceMonth(purchaseDate, closingDay);
  return addMonths(base.year, base.month, n - 1);
}

// Given an invoice's (year, month), compute closing/due/default-payment dates.
// If dueDay/paymentDay <= closingDay, they roll to the month AFTER closing
// (standard card behavior, e.g. closing=28, due=5 -> due is next month's 5th).
export function computeInvoiceDates(
  card: CardDateConfig,
  year: number,
  month: number,
): InvoiceDates {
  const closingDate = buildDate(year, month, card.closingDay);

  const dueMonth =
    card.dueDay <= card.closingDay
      ? addMonths(year, month, 1)
      : { year, month };
  const dueDate = buildDate(dueMonth.year, dueMonth.month, card.dueDay);

  const paymentMonth =
    card.paymentDay <= card.closingDay
      ? addMonths(year, month, 1)
      : { year, month };
  const paymentDate = buildDate(
    paymentMonth.year,
    paymentMonth.month,
    card.paymentDay,
  );

  return { closingDate, dueDate, paymentDate };
}

// For a "remainder" purchase created from a partial payment: installment 1
// goes to the invoice for the month AFTER the paid invoice's reference month.
export function getRemainderBaseMonth(originInvoice: {
  referenceYear: number;
  referenceMonth: number;
}): YearMonth {
  return addMonths(
    originInvoice.referenceYear,
    originInvoice.referenceMonth,
    1,
  );
}

// Split totalAmount into `count` installments; last ones absorb rounding remainder cents.
export function distributeAmounts(
  totalAmount: number,
  count: number,
): number[] {
  const cents = Math.round(totalAmount * 100);
  const base = Math.floor(cents / count);
  const remainder = cents - base * count;
  const amounts = Array(count).fill(base);
  for (let i = 0; i < remainder; i++) amounts[count - 1 - i] += 1;
  return amounts.map((c) => c / 100);
}
