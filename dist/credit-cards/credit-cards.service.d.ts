import { PrismaService } from '../prisma/prisma.service';
import { CreateCreditCardDto } from './dto/create-credit-card.dto';
import { UpdateCreditCardDto } from './dto/update-credit-card.dto';
export declare class CreditCardsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(userId: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        userId: string;
        isActive: boolean;
        closingDay: number;
        dueDay: number;
        paymentDay: number;
    }[]>;
    findOne(userId: string, id: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        userId: string;
        isActive: boolean;
        closingDay: number;
        dueDay: number;
        paymentDay: number;
    }>;
    create(userId: string, data: CreateCreditCardDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        userId: string;
        isActive: boolean;
        closingDay: number;
        dueDay: number;
        paymentDay: number;
    }>;
    update(userId: string, id: string, data: UpdateCreditCardDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        userId: string;
        isActive: boolean;
        closingDay: number;
        dueDay: number;
        paymentDay: number;
    }>;
    remove(userId: string, id: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        userId: string;
        isActive: boolean;
        closingDay: number;
        dueDay: number;
        paymentDay: number;
    }>;
    private propagatePaymentDayChange;
}
