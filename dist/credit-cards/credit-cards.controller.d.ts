import { CreditCardsService } from './credit-cards.service';
import type { JwtUser } from '../auth/jwt-payload.type';
import type { CreateCreditCardDto } from './dto/create-credit-card.dto';
import type { UpdateCreditCardDto } from './dto/update-credit-card.dto';
export declare class CreditCardsController {
    private readonly creditCardsService;
    constructor(creditCardsService: CreditCardsService);
    findAll(user: JwtUser): Promise<{
        closingDay: number;
        dueDay: number;
        paymentDay: number;
        name: string;
        isActive: boolean;
        id: string;
        userId: string;
        createdAt: Date;
    }[]>;
    create(user: JwtUser, data: CreateCreditCardDto): Promise<{
        closingDay: number;
        dueDay: number;
        paymentDay: number;
        name: string;
        isActive: boolean;
        id: string;
        userId: string;
        createdAt: Date;
    }>;
    update(user: JwtUser, id: string, data: UpdateCreditCardDto): Promise<{
        closingDay: number;
        dueDay: number;
        paymentDay: number;
        name: string;
        isActive: boolean;
        id: string;
        userId: string;
        createdAt: Date;
    }>;
    remove(user: JwtUser, id: string): Promise<{
        closingDay: number;
        dueDay: number;
        paymentDay: number;
        name: string;
        isActive: boolean;
        id: string;
        userId: string;
        createdAt: Date;
    }>;
}
