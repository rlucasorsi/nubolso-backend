import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
export declare class TransactionsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(userId: string, query: QueryTransactionDto): Promise<({
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
    create(userId: string, data: CreateTransactionDto): Promise<{
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
    update(userId: string, id: string, data: UpdateTransactionDto): Promise<{
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
    private validateDate;
    togglePaid(userId: string, id: string): Promise<{
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
    remove(userId: string, id: string): Promise<{
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
    private findOne;
}
