import { PrismaService } from '../prisma/prisma.service';
import { CreateRecurringTemplateDto } from './dto/create-recurring-template.dto';
import { UpdateRecurringTemplateDto } from './dto/update-recurring-template.dto';
import { RealizeRecurringTemplateDto } from './dto/realize-recurring-template.dto';
import { SkipRecurringTemplateDto } from './dto/skip-recurring-template.dto';
export declare class RecurringTemplatesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(userId: string): Promise<({
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
        type: import(".prisma/client").$Enums.TransactionType;
        categoryId: string | null;
        userId: string;
        estimatedAmount: number;
        dayOfMonth: number;
        isActive: boolean;
    })[]>;
    create(userId: string, data: CreateRecurringTemplateDto): Promise<{
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
        type: import(".prisma/client").$Enums.TransactionType;
        categoryId: string | null;
        userId: string;
        estimatedAmount: number;
        dayOfMonth: number;
        isActive: boolean;
    }>;
    update(userId: string, id: string, data: UpdateRecurringTemplateDto): Promise<{
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
        type: import(".prisma/client").$Enums.TransactionType;
        categoryId: string | null;
        userId: string;
        estimatedAmount: number;
        dayOfMonth: number;
        isActive: boolean;
    }>;
    remove(userId: string, id: string): Promise<{
        id: string;
        createdAt: Date;
        description: string;
        type: import(".prisma/client").$Enums.TransactionType;
        categoryId: string | null;
        userId: string;
        estimatedAmount: number;
        dayOfMonth: number;
        isActive: boolean;
    }>;
    realize(userId: string, id: string, data: RealizeRecurringTemplateDto): Promise<{
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
    skip(userId: string, id: string, data: SkipRecurringTemplateDto): Promise<{
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
    private findOne;
}
