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
exports.CreditCardInvoicesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const date_helpers_1 = require("./utils/date-helpers");
const invoice_batch_1 = require("./utils/invoice-batch");
function computeTotal(installments) {
    return installments.reduce((sum, i) => sum + i.amount, 0);
}
function computePriceInstallment(principal, monthlyRatePct, n) {
    if (monthlyRatePct === 0 || n === 0)
        return principal / n;
    const r = monthlyRatePct / 100;
    return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}
let CreditCardInvoicesService = class CreditCardInvoicesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAllForCard(userId, cardId) {
        const card = await this.prisma.creditCard.findFirst({
            where: { id: cardId, userId },
        });
        if (!card)
            throw new common_1.NotFoundException('Credit card not found');
        const invoices = await this.prisma.creditCardInvoice.findMany({
            where: { cardId },
            include: {
                installments: { include: { purchase: true } },
                transaction: true,
            },
            orderBy: [{ referenceYear: 'asc' }, { referenceMonth: 'asc' }],
        });
        return invoices.map((invoice) => ({
            ...invoice,
            totalAmount: computeTotal(invoice.installments),
        }));
    }
    async findAllForUser(userId, from, to) {
        const invoices = await this.prisma.creditCardInvoice.findMany({
            where: {
                userId,
                paymentDate: {
                    gte: from ? new Date(from) : undefined,
                    lte: to ? new Date(to) : undefined,
                },
            },
            include: {
                installments: true,
                transaction: true,
                card: true,
            },
            orderBy: { paymentDate: 'asc' },
        });
        return invoices.map((invoice) => ({
            ...invoice,
            totalAmount: computeTotal(invoice.installments),
        }));
    }
    async findOne(userId, id) {
        const invoice = await this.prisma.creditCardInvoice.findFirst({
            where: { id, userId },
            include: {
                installments: { include: { purchase: true } },
                transaction: true,
                card: true,
                remainderPurchases: true,
            },
        });
        if (!invoice)
            throw new common_1.NotFoundException('Invoice not found');
        return { ...invoice, totalAmount: computeTotal(invoice.installments) };
    }
    async updatePaymentDate(userId, id, dto) {
        const invoice = await this.findOne(userId, id);
        if (invoice.isPaid) {
            throw new common_1.BadRequestException('Não é possível alterar a data de pagamento de uma fatura já paga');
        }
        return this.prisma.creditCardInvoice.update({
            where: { id },
            data: {
                paymentDate: new Date(dto.paymentDate),
                paymentDateOverridden: true,
            },
        });
    }
    async pay(userId, id, dto) {
        const invoice = await this.findOne(userId, id);
        if (invoice.isPaid)
            throw new common_1.BadRequestException('Fatura já paga');
        const card = invoice.card;
        const paymentDate = dto.paymentDate
            ? new Date(dto.paymentDate)
            : invoice.paymentDate;
        const isFullPayment = dto.amount >= invoice.totalAmount - 0.005;
        return this.prisma.$transaction(async (tx) => {
            const transaction = invoice.transactionId
                ? await tx.transaction.update({
                    where: { id: invoice.transactionId },
                    data: { amount: dto.amount, date: paymentDate, isPaid: true },
                })
                : await tx.transaction.create({
                    data: {
                        description: `Fatura ${card.name} ${String(invoice.referenceMonth).padStart(2, '0')}/${invoice.referenceYear}`,
                        amount: dto.amount,
                        type: 'EXPENSE',
                        date: paymentDate,
                        isPaid: true,
                        userId,
                    },
                });
            const updated = await tx.creditCardInvoice.update({
                where: { id },
                data: {
                    isPaid: true,
                    paidAmount: dto.amount,
                    paymentDate,
                    paymentDateOverridden: true,
                    transactionId: transaction.id,
                },
                include: { installments: true, transaction: true, card: true },
            });
            if (!isFullPayment) {
                const remainderAmount = invoice.totalAmount - dto.amount;
                const installmentsCount = dto.remainderInstallments ?? 1;
                let totalRemainder;
                if (dto.installmentAmount) {
                    totalRemainder = dto.installmentAmount * installmentsCount;
                }
                else if (dto.interestRate != null && dto.interestRate > 0) {
                    const pmt = computePriceInstallment(remainderAmount, dto.interestRate, installmentsCount);
                    totalRemainder = pmt * installmentsCount;
                }
                else {
                    totalRemainder = remainderAmount;
                }
                const remainderPurchase = await tx.creditCardPurchase.create({
                    data: {
                        description: `Saldo remanescente - Fatura ${String(invoice.referenceMonth).padStart(2, '0')}/${invoice.referenceYear}`,
                        totalAmount: totalRemainder,
                        installmentsCount,
                        purchaseDate: new Date(),
                        cardId: invoice.cardId,
                        userId,
                        originInvoiceId: invoice.id,
                    },
                });
                const baseMonth = (0, date_helpers_1.getRemainderBaseMonth)(invoice);
                const amounts = (0, date_helpers_1.distributeAmounts)(totalRemainder, installmentsCount);
                const plan = [];
                for (let i = 1; i <= installmentsCount; i++) {
                    const { year, month } = (0, date_helpers_1.addMonths)(baseMonth.year, baseMonth.month, i - 1);
                    plan.push({
                        number: i,
                        totalCount: installmentsCount,
                        amount: amounts[i - 1],
                        referenceYear: year,
                        referenceMonth: month,
                        ...(0, date_helpers_1.computeInvoiceDates)(card, year, month),
                    });
                }
                await (0, invoice_batch_1.resolveInvoicesAndCreateInstallments)(tx, {
                    cardId: card.id,
                    userId,
                    purchaseId: remainderPurchase.id,
                    plan,
                });
            }
            return { ...updated, totalAmount: computeTotal(updated.installments) };
        }, { timeout: 15000 });
    }
    async reopen(userId, id) {
        const invoice = await this.findOne(userId, id);
        if (!invoice.isPaid) {
            throw new common_1.BadRequestException('Esta fatura ainda não foi paga');
        }
        if (invoice.remainderPurchases.length > 0) {
            const allInstallments = await this.prisma.creditCardInstallment.findMany({
                where: { purchaseId: { in: invoice.remainderPurchases.map((p) => p.id) } },
                include: { invoice: true },
            });
            if (allInstallments.some((i) => i.invoice.isPaid)) {
                throw new common_1.BadRequestException('Não é possível reabrir esta fatura: o saldo remanescente já foi processado em uma fatura que já está paga. Reabra primeiro essa fatura.');
            }
        }
        return this.prisma.$transaction(async (tx) => {
            await tx.creditCardInvoice.update({
                where: { id },
                data: { isPaid: false, paidAmount: null, transactionId: null },
            });
            if (invoice.transactionId) {
                await tx.transaction.delete({ where: { id: invoice.transactionId } });
            }
            for (const purchase of invoice.remainderPurchases) {
                await tx.creditCardInstallment.deleteMany({ where: { purchaseId: purchase.id } });
                await tx.creditCardPurchase.delete({ where: { id: purchase.id } });
            }
            const updated = await tx.creditCardInvoice.findUniqueOrThrow({
                where: { id },
                include: { installments: true, transaction: true, card: true },
            });
            return { ...updated, totalAmount: computeTotal(updated.installments) };
        }, { timeout: 15000 });
    }
};
exports.CreditCardInvoicesService = CreditCardInvoicesService;
exports.CreditCardInvoicesService = CreditCardInvoicesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CreditCardInvoicesService);
//# sourceMappingURL=credit-card-invoices.service.js.map