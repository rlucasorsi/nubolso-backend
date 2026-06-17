import { PrismaService } from '../prisma/prisma.service';
import { TransactionType } from '@prisma/client';
export declare class CategoriesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(userId: string): Promise<{
        name: string;
        id: string;
        type: import(".prisma/client").$Enums.TransactionType;
        userId: string;
        color: string | null;
    }[]>;
    create(userId: string, data: {
        name: string;
        color?: string;
        type: TransactionType;
    }): Promise<{
        name: string;
        id: string;
        type: import(".prisma/client").$Enums.TransactionType;
        userId: string;
        color: string | null;
    }>;
    remove(userId: string, id: string): Promise<{
        name: string;
        id: string;
        type: import(".prisma/client").$Enums.TransactionType;
        userId: string;
        color: string | null;
    }>;
}
