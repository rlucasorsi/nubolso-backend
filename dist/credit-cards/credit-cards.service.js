"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreditCardsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const date_helpers_1 = require("./utils/date-helpers");
let CreditCardsService = class CreditCardsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(userId) {
        return this.prisma.creditCard.findMany({
            where: { userId },
            orderBy: { createdAt: 'asc' },
        });
    }
    async findOne(userId, id) {
        const card = await this.prisma.creditCard.findFirst({
            where: { id, userId },
        });
        if (!card) {
            throw new common_1.NotFoundException('Credit card not found');
        }
        return card;
    }
    async create(userId, data) {
        return this.prisma.creditCard.create({
            data: { ...data, userId },
        });
    }
    async update(userId, id, data) {
        const card = await this.findOne(userId, id);
        const updated = await this.prisma.creditCard.update({
            where: { id },
            data,
        });
        if (data.paymentDay !== undefined && data.paymentDay !== card.paymentDay) {
            await this.propagatePaymentDayChange(updated);
        }
        return updated;
    }
    async remove(userId, id) {
        await this.findOne(userId, id);
        return this.prisma.creditCard.update({
            where: { id },
            data: { isActive: false },
        });
    }
    async propagatePaymentDayChange(card) {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const invoices = await this.prisma.creditCardInvoice.findMany({
            where: {
                cardId: card.id,
                isPaid: false,
                paymentDateOverridden: false,
                paymentDate: { gte: today },
            },
        });
        await Promise.all(invoices.map((invoice) => {
            const { paymentDate } = (0, date_helpers_1.computeInvoiceDates)(card, invoice.referenceYear, invoice.referenceMonth);
            return this.prisma.creditCardInvoice.update({ where: { id: invoice.id }, data: { paymentDate } });
        }));
    }
};
exports.CreditCardsService = CreditCardsService;
exports.CreditCardsService = CreditCardsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CreditCardsService);
//# sourceMappingURL=credit-cards.service.js.map