import { CreditCardsService } from './credit-cards.service';
import type { JwtUser } from '../auth/jwt-payload.type';
import type { CreateCreditCardDto } from './dto/create-credit-card.dto';
import type { UpdateCreditCardDto } from './dto/update-credit-card.dto';
export declare class CreditCardsController {
    private readonly creditCardsService;
    constructor(creditCardsService: CreditCardsService);
    findAll(user: JwtUser): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        userId: string;
        isActive: boolean;
        closingDay: number;
        dueDay: number;
        paymentDay: number;
    }[]>;
    create(user: JwtUser, data: CreateCreditCardDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        userId: string;
        isActive: boolean;
        closingDay: number;
        dueDay: number;
        paymentDay: number;
    }>;
    update(user: JwtUser, id: string, data: UpdateCreditCardDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        userId: string;
        isActive: boolean;
        closingDay: number;
        dueDay: number;
        paymentDay: number;
    }>;
    remove(user: JwtUser, id: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        userId: string;
        isActive: boolean;
        closingDay: number;
        dueDay: number;
        paymentDay: number;
    }>;
}
