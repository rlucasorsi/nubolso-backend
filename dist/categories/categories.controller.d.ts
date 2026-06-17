import { CategoriesService } from './categories.service';
import type { JwtUser } from '../auth/jwt-payload.type';
import type { CreateCategoryDto } from './schemas';
export declare class CategoriesController {
    private readonly categoriesService;
    constructor(categoriesService: CategoriesService);
    findAll(user: JwtUser): Promise<{
        name: string;
        id: string;
        type: import(".prisma/client").$Enums.TransactionType;
        userId: string;
        color: string | null;
    }[]>;
    create(user: JwtUser, data: CreateCategoryDto): Promise<{
        name: string;
        id: string;
        type: import(".prisma/client").$Enums.TransactionType;
        userId: string;
        color: string | null;
    }>;
    remove(user: JwtUser, id: string): Promise<{
        name: string;
        id: string;
        type: import(".prisma/client").$Enums.TransactionType;
        userId: string;
        color: string | null;
    }>;
}
