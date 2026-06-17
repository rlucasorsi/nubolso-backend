import { TransactionsService } from './transactions.service';
import type { JwtUser } from '../auth/jwt-payload.type';
import type { CreateTransactionDto } from './dto/create-transaction.dto';
import type { UpdateTransactionDto } from './dto/update-transaction.dto';
import type { QueryTransactionDto } from './dto/query-transaction.dto';
export declare class TransactionsController {
    private readonly transactionsService;
    constructor(transactionsService: TransactionsService);
    findAll(user: JwtUser, query: QueryTransactionDto): Promise<({
        category: {
            name: string;
            id: string;
            type: import(".prisma/client").$Enums.TransactionType;
            userId: string;
            color: string | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        description: string;
        amount: number;
        type: import(".prisma/client").$Enums.TransactionType;
        date: Date;
        isPaid: boolean;
        isSkipped: boolean;
        templateId: string | null;
        categoryId: string | null;
        userId: string;
    })[]>;
    create(user: JwtUser, data: CreateTransactionDto): Promise<{
        category: {
            name: string;
            id: string;
            type: import(".prisma/client").$Enums.TransactionType;
            userId: string;
            color: string | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        description: string;
        amount: number;
        type: import(".prisma/client").$Enums.TransactionType;
        date: Date;
        isPaid: boolean;
        isSkipped: boolean;
        templateId: string | null;
        categoryId: string | null;
        userId: string;
    }>;
    togglePaid(user: JwtUser, id: string): Promise<{
        category: {
            name: string;
            id: string;
            type: import(".prisma/client").$Enums.TransactionType;
            userId: string;
            color: string | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        description: string;
        amount: number;
        type: import(".prisma/client").$Enums.TransactionType;
        date: Date;
        isPaid: boolean;
        isSkipped: boolean;
        templateId: string | null;
        categoryId: string | null;
        userId: string;
    }>;
    update(user: JwtUser, id: string, data: UpdateTransactionDto): Promise<{
        category: {
            name: string;
            id: string;
            type: import(".prisma/client").$Enums.TransactionType;
            userId: string;
            color: string | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        description: string;
        amount: number;
        type: import(".prisma/client").$Enums.TransactionType;
        date: Date;
        isPaid: boolean;
        isSkipped: boolean;
        templateId: string | null;
        categoryId: string | null;
        userId: string;
    }>;
    remove(user: JwtUser, id: string): Promise<{
        id: string;
        createdAt: Date;
        description: string;
        amount: number;
        type: import(".prisma/client").$Enums.TransactionType;
        date: Date;
        isPaid: boolean;
        isSkipped: boolean;
        templateId: string | null;
        categoryId: string | null;
        userId: string;
    }>;
}
