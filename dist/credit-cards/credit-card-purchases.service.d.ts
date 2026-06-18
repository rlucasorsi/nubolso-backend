import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { SimulatePurchaseDto } from './dto/simulate-purchase.dto';
import { InstallmentPlanItem } from './utils/invoice-batch';
import { CreditCard } from '@prisma/client';
export declare class CreditCardPurchasesService {
    private prisma;
    constructor(prisma: PrismaService);
    buildInstallmentPlan(card: CreditCard, dto: {
        totalAmount: number;
        installmentsCount: number;
        purchaseDate: string;
        strategy?: 'FIRST' | 'LAST';
    }): InstallmentPlanItem[];
    create(userId: string, dto: CreatePurchaseDto): Promise<({
        installments: ({
            invoice: {
                id: string;
                cardId: string;
                userId: string;
                createdAt: Date;
                referenceMonth: number;
                referenceYear: number;
                closingDate: Date;
                dueDate: Date;
                paymentDate: Date;
                paymentDateOverridden: boolean;
                isPaid: boolean;
                paidAmount: number | null;
                transactionId: string | null;
            };
        } & {
            number: number;
            id: string;
            createdAt: Date;
            totalCount: number;
            amount: number;
            purchaseId: string;
            invoiceId: string;
        })[];
    } & {
        id: string;
        description: string;
        totalAmount: number;
        installmentsCount: number;
        purchaseDate: Date;
        cardId: string;
        userId: string;
        originInvoiceId: string | null;
        createdAt: Date;
    }) | null>;
    remove(userId: string, id: string): Promise<void>;
    simulate(userId: string, dto: SimulatePurchaseDto): Promise<{
        installments: {
            number: number;
            totalCount: number;
            amount: number;
            referenceYear: number;
            referenceMonth: number;
            paymentDate: string;
            invoiceExists: boolean;
            invoiceCurrentTotal: number;
            invoiceProjectedTotal: number;
        }[];
        impactedInvoices: {
            referenceYear: number;
            referenceMonth: number;
            paymentDate: string;
            currentTotal: number;
            projectedTotal: number;
            delta: number;
        }[];
    }>;
}
