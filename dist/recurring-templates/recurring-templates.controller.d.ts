import { RecurringTemplatesService } from './recurring-templates.service';
import type { JwtUser } from '../auth/jwt-payload.type';
import type { CreateRecurringTemplateDto } from './dto/create-recurring-template.dto';
import type { UpdateRecurringTemplateDto } from './dto/update-recurring-template.dto';
import type { RealizeRecurringTemplateDto } from './dto/realize-recurring-template.dto';
import type { SkipRecurringTemplateDto } from './dto/skip-recurring-template.dto';
export declare class RecurringTemplatesController {
    private readonly recurringTemplatesService;
    constructor(recurringTemplatesService: RecurringTemplatesService);
    findAll(user: JwtUser): Promise<({
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
    create(user: JwtUser, data: CreateRecurringTemplateDto): Promise<{
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
    update(user: JwtUser, id: string, data: UpdateRecurringTemplateDto): Promise<{
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
    remove(user: JwtUser, id: string): Promise<{
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
    realize(user: JwtUser, id: string, data: RealizeRecurringTemplateDto): Promise<{
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
    skip(user: JwtUser, id: string, data: SkipRecurringTemplateDto): Promise<{
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
}
