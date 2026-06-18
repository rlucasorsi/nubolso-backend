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
                createdAt: Date;
                isPaid: boolean;
                userId: string;
                cardId: string;
                referenceMonth: number;
                referenceYear: number;
                closingDate: Date;
                dueDate: Date;
                paymentDate: Date;
                paymentDateOverridden: boolean;
                paidAmount: number | null;
                transactionId: string | null;
            };
        } & {
            number: number;
            id: string;
            createdAt: Date;
            amount: number;
            purchaseId: string;
            totalCount: number;
            invoiceId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        description: string;
        userId: string;
        totalAmount: number;
        installmentsCount: number;
        purchaseDate: Date;
        cardId: string;
        originInvoiceId: string | null;
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
