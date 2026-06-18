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
exports.TransactionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TransactionsService = class TransactionsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(userId, query) {
        const { startDate, endDate, type, categoryId, isPaid } = query;
        return this.prisma.transaction.findMany({
            where: {
                userId,
                type,
                categoryId,
                isPaid,
                date: {
                    gte: startDate ? new Date(startDate) : undefined,
                    lte: endDate ? new Date(endDate) : undefined,
                },
            },
            include: {
                category: true,
            },
            orderBy: { date: 'desc' },
        });
    }
    async create(userId, data) {
        await this.validateDate(userId, data.date);
        return this.prisma.transaction.create({
            data: {
                description: data.description ?? '',
                amount: data.amount,
                type: data.type,
                date: new Date(data.date),
                isPaid: data.isPaid ?? false,
                userId,
                categoryId: data.categoryId,
            },
            include: {
                category: true,
            },
        });
    }
    async update(userId, id, data) {
        await this.findOne(userId, id);
        if (data.date) {
            await this.validateDate(userId, data.date);
        }
        return this.prisma.transaction.update({
            where: { id },
            data: {
                ...data,
                date: data.date ? new Date(data.date) : undefined,
            },
            include: {
                category: true,
            },
        });
    }
    async validateDate(userId, date) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { balanceStartDate: true },
        });
        if (user?.balanceStartDate && new Date(date) < user.balanceStartDate) {
            throw new common_1.BadRequestException('A data do lançamento não pode ser anterior à data inicial do saldo');
        }
    }
    async togglePaid(userId, id) {
        const transaction = await this.findOne(userId, id);
        return this.prisma.transaction.update({
            where: { id },
            data: { isPaid: !transaction.isPaid },
            include: {
                category: true,
            },
        });
    }
    async remove(userId, id) {
        await this.findOne(userId, id);
        return this.prisma.transaction.delete({
            where: { id },
        });
    }
    async findOne(userId, id) {
        const transaction = await this.prisma.transaction.findFirst({
            where: { id, userId },
        });
        if (!transaction) {
            throw new common_1.NotFoundException('Transaction not found');
        }
        return transaction;
    }
};
exports.TransactionsService = TransactionsService;
exports.TransactionsService = TransactionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TransactionsService);
//# sourceMappingURL=transactions.service.js.map