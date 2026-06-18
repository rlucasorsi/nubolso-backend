import { PrismaService } from '../prisma/prisma.service';
import { CreateCreditCardDto } from './dto/create-credit-card.dto';
import { UpdateCreditCardDto } from './dto/update-credit-card.dto';
export declare class CreditCardsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(userId: string): Promise<{
        closingDay: number;
        dueDay: number;
        paymentDay: number;
        name: string;
        isActive: boolean;
        id: string;
        userId: string;
        createdAt: Date;
    }[]>;
    findOne(userId: string, id: string): Promise<{
        closingDay: number;
        dueDay: number;
        paymentDay: number;
        name: string;
        isActive: boolean;
        id: string;
        userId: string;
        createdAt: Date;
    }>;
    create(userId: string, data: CreateCreditCardDto): Promise<{
        closingDay: number;
        dueDay: number;
        paymentDay: number;
        name: string;
        isActive: boolean;
        id: string;
        userId: string;
        createdAt: Date;
    }>;
    update(userId: string, id: string, data: UpdateCreditCardDto): Promise<{
        closingDay: number;
        dueDay: number;
        paymentDay: number;
        name: string;
        isActive: boolean;
        id: string;
        userId: string;
        createdAt: Date;
    }>;
    remove(userId: string, id: string): Promise<{
        closingDay: number;
        dueDay: number;
        paymentDay: number;
        name: string;
        isActive: boolean;
        id: string;
        userId: string;
        createdAt: Date;
    }>;
    private propagatePaymentDayChange;
}
