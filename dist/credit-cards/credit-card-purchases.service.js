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
exports.CreditCardPurchasesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const date_helpers_1 = require("./utils/date-helpers");
const invoice_batch_1 = require("./utils/invoice-batch");
let CreditCardPurchasesService = class CreditCardPurchasesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    buildInstallmentPlan(card, dto) {
        const purchaseDate = new Date(dto.purchaseDate);
        const amounts = (0, date_helpers_1.distributeAmounts)(dto.totalAmount, dto.installmentsCount, dto.strategy);
        return amounts.map((amount, idx) => {
            const number = idx + 1;
            const { year, month } = (0, date_helpers_1.getInstallmentInvoiceMonth)(purchaseDate, card.closingDay, number);
            const dates = (0, date_helpers_1.computeInvoiceDates)(card, year, month);
            return {
                number,
                totalCount: dto.installmentsCount,
                amount,
                referenceYear: year,
                referenceMonth: month,
                ...dates,
            };
        });
    }
    async create(userId, dto) {
        const card = await this.prisma.creditCard.findFirst({
            where: { id: dto.cardId, userId },
        });
        if (!card)
            throw new common_1.NotFoundException('Credit card not found');
        if (!card.isActive)
            throw new common_1.BadRequestException('Este cartão está inativo');
        const plan = this.buildInstallmentPlan(card, dto);
        return this.prisma.$transaction(async (tx) => {
            const purchase = await tx.creditCardPurchase.create({
                data: {
                    description: dto.description ?? '',
                    totalAmount: dto.totalAmount,
                    installmentsCount: dto.installmentsCount,
                    purchaseDate: new Date(dto.purchaseDate),
                    cardId: card.id,
                    userId,
                },
            });
            await (0, invoice_batch_1.resolveInvoicesAndCreateInstallments)(tx, {
                cardId: card.id,
                userId,
                purchaseId: purchase.id,
                plan,
            });
            return tx.creditCardPurchase.findUnique({
                where: { id: purchase.id },
                include: { installments: { include: { invoice: true } } },
            });
        }, { timeout: 15000 });
    }
    async remove(userId, id) {
        const purchase = await this.prisma.creditCardPurchase.findFirst({
            where: { id, userId },
            include: { installments: { include: { invoice: true } } },
        });
        if (!purchase)
            throw new common_1.NotFoundException('Compra não encontrada');
        const hasPaidInvoice = purchase.installments.some((i) => i.invoice.isPaid);
        if (hasPaidInvoice) {
            throw new common_1.BadRequestException('Não é possível excluir uma compra com parcelas em faturas já pagas');
        }
        const invoiceIds = [...new Set(purchase.installments.map((i) => i.invoiceId))];
        await this.prisma.creditCardPurchase.delete({ where: { id } });
        await this.prisma.creditCardInvoice.deleteMany({
            where: { id: { in: invoiceIds }, installments: { none: {} } },
        });
    }
    async simulate(userId, dto) {
        const card = await this.prisma.creditCard.findFirst({
            where: { id: dto.cardId, userId },
        });
        if (!card)
            throw new common_1.NotFoundException('Credit card not found');
        const plan = this.buildInstallmentPlan(card, dto);
        const installments = await Promise.all(plan.map(async (item) => {
            const existingInvoice = await this.prisma.creditCardInvoice.findUnique({
                where: {
                    cardId_referenceYear_referenceMonth: {
                        cardId: card.id,
                        referenceYear: item.referenceYear,
                        referenceMonth: item.referenceMonth,
                    },
                },
                include: { installments: true },
            });
            const invoiceCurrentTotal = existingInvoice
                ? existingInvoice.installments.reduce((sum, i) => sum + i.amount, 0)
                : 0;
            return {
                number: item.number,
                totalCount: item.totalCount,
                amount: item.amount,
                referenceYear: item.referenceYear,
                referenceMonth: item.referenceMonth,
                paymentDate: item.paymentDate.toISOString().split('T')[0],
                invoiceExists: !!existingInvoice,
                invoiceCurrentTotal,
                invoiceProjectedTotal: invoiceCurrentTotal + item.amount,
            };
        }));
        const impactedInvoices = installments.map((i) => ({
            referenceYear: i.referenceYear,
            referenceMonth: i.referenceMonth,
            paymentDate: i.paymentDate,
            currentTotal: i.invoiceCurrentTotal,
            projectedTotal: i.invoiceProjectedTotal,
            delta: i.amount,
        }));
        return { installments, impactedInvoices };
    }
};
exports.CreditCardPurchasesService = CreditCardPurchasesService;
exports.CreditCardPurchasesService = CreditCardPurchasesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CreditCardPurchasesService);
//# sourceMappingURL=credit-card-purchases.service.js.map