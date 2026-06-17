export interface YearMonth {
    year: number;
    month: number;
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
export declare function clampDay(year: number, month: number, day: number): number;
export declare function buildDate(year: number, month: number, day: number): Date;
export declare function addMonths(year: number, month: number, offset: number): YearMonth;
export declare function getBaseInvoiceMonth(purchaseDate: Date, closingDay: number): YearMonth;
export declare function getInstallmentInvoiceMonth(purchaseDate: Date, closingDay: number, n: number): YearMonth;
export declare function computeInvoiceDates(card: CardDateConfig, year: number, month: number): InvoiceDates;
export declare function getRemainderBaseMonth(originInvoice: {
    referenceYear: number;
    referenceMonth: number;
}): YearMonth;
export declare function distributeAmounts(totalAmount: number, count: number): number[];
