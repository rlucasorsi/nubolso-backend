import { Prisma } from '@prisma/client';
export interface InstallmentPlanItem {
    number: number;
    totalCount: number;
    amount: number;
    referenceYear: number;
    referenceMonth: number;
    closingDate: Date;
    dueDate: Date;
    paymentDate: Date;
}
export declare function resolveInvoicesAndCreateInstallments(tx: Prisma.TransactionClient, params: {
    cardId: string;
    userId: string;
    purchaseId: string;
    plan: InstallmentPlanItem[];
}): Promise<void>;
