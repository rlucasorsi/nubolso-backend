import { CreditCardPurchasesService } from './credit-card-purchases.service';
import type { JwtUser } from '../auth/jwt-payload.type';
import type { CreatePurchaseDto } from './dto/create-purchase.dto';
export declare class CreditCardPurchasesController {
    private readonly purchasesService;
    constructor(purchasesService: CreditCardPurchasesService);
    create(user: JwtUser, data: CreatePurchaseDto): Promise<({
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
    simulate(user: JwtUser, data: CreatePurchaseDto): Promise<{
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
    remove(user: JwtUser, id: string): Promise<void>;
}
