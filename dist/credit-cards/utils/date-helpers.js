"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clampDay = clampDay;
exports.buildDate = buildDate;
exports.addMonths = addMonths;
exports.getBaseInvoiceMonth = getBaseInvoiceMonth;
exports.getInstallmentInvoiceMonth = getInstallmentInvoiceMonth;
exports.computeInvoiceDates = computeInvoiceDates;
exports.getRemainderBaseMonth = getRemainderBaseMonth;
exports.distributeAmounts = distributeAmounts;
function clampDay(year, month, day) {
    return Math.min(day, new Date(year, month, 0).getDate());
}
function buildDate(year, month, day) {
    return new Date(Date.UTC(year, month - 1, clampDay(year, month, day)));
}
function addMonths(year, month, offset) {
    const total = year * 12 + (month - 1) + offset;
    return { year: Math.floor(total / 12), month: (total % 12) + 1 };
}
function getBaseInvoiceMonth(purchaseDate, closingDay) {
    const y = purchaseDate.getUTCFullYear();
    const m = purchaseDate.getUTCMonth() + 1;
    const d = purchaseDate.getUTCDate();
    const closingThisMonth = clampDay(y, m, closingDay);
    return d <= closingThisMonth ? { year: y, month: m } : addMonths(y, m, 1);
}
function getInstallmentInvoiceMonth(purchaseDate, closingDay, n) {
    const base = getBaseInvoiceMonth(purchaseDate, closingDay);
    return addMonths(base.year, base.month, n - 1);
}
function computeInvoiceDates(card, year, month) {
    const closingDate = buildDate(year, month, card.closingDay);
    const dueMonth = card.dueDay <= card.closingDay
        ? addMonths(year, month, 1)
        : { year, month };
    const dueDate = buildDate(dueMonth.year, dueMonth.month, card.dueDay);
    const paymentMonth = card.paymentDay <= card.closingDay
        ? addMonths(year, month, 1)
        : { year, month };
    const paymentDate = buildDate(paymentMonth.year, paymentMonth.month, card.paymentDay);
    return { closingDate, dueDate, paymentDate };
}
function getRemainderBaseMonth(originInvoice) {
    return addMonths(originInvoice.referenceYear, originInvoice.referenceMonth, 1);
}
function distributeAmounts(totalAmount, count) {
    const cents = Math.round(totalAmount * 100);
    const base = Math.floor(cents / count);
    const remainder = cents - base * count;
    const amounts = Array(count).fill(base);
    for (let i = 0; i < remainder; i++)
        amounts[count - 1 - i] += 1;
    return amounts.map((c) => c / 100);
}
//# sourceMappingURL=date-helpers.js.map