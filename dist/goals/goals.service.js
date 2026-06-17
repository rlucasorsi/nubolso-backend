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
exports.GoalsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let GoalsService = class GoalsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(userId) {
        return this.prisma.goal.findMany({
            where: { userId },
            orderBy: { createdAt: 'asc' },
        });
    }
    async create(userId, data) {
        return this.prisma.goal.create({
            data: {
                name: data.name,
                description: data.description,
                icon: data.icon,
                color: data.color,
                targetAmount: data.targetAmount,
                savedAmount: data.savedAmount ?? 0,
                deadline: new Date(data.deadline),
                userId,
            },
            include: { contributions: true },
        });
    }
    async update(userId, id, data) {
        await this.findOne(userId, id);
        const { contributions, deadline, ...rest } = data;
        return this.prisma.$transaction(async (tx) => {
            if (contributions) {
                await tx.goalContribution.deleteMany({ where: { goalId: id } });
                if (contributions.length > 0) {
                    await tx.goalContribution.createMany({
                        data: contributions.map((c) => ({
                            amount: c.amount,
                            description: c.description,
                            date: new Date(c.date),
                            goalId: id,
                        })),
                    });
                }
            }
            return tx.goal.update({
                where: { id },
                data: {
                    ...rest,
                    deadline: deadline ? new Date(deadline) : undefined,
                },
                include: { contributions: { orderBy: { date: 'desc' } } },
            });
        });
    }
    async remove(userId, id) {
        await this.findOne(userId, id);
        return this.prisma.goal.delete({ where: { id } });
    }
    async addContribution(userId, id, data) {
        const goal = await this.findOne(userId, id);
        return this.prisma.$transaction(async (tx) => {
            await tx.goalContribution.create({
                data: {
                    amount: data.amount,
                    description: data.description ?? 'Aporte Manual',
                    date: data.date ? new Date(data.date) : new Date(),
                    goalId: id,
                },
            });
            return tx.goal.update({
                where: { id },
                data: { savedAmount: goal.savedAmount + data.amount },
                include: { contributions: { orderBy: { date: 'desc' } } },
            });
        });
    }
    async listContributions(userId, id, page, limit) {
        await this.findOne(userId, id);
        const [data, total] = await this.prisma.$transaction([
            this.prisma.goalContribution.findMany({
                where: { goalId: id },
                orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.goalContribution.count({ where: { goalId: id } }),
        ]);
        return {
            data,
            page,
            limit,
            total,
            hasMore: page * limit < total,
        };
    }
    async findOne(userId, id) {
        const goal = await this.prisma.goal.findFirst({ where: { id, userId } });
        if (!goal) {
            throw new common_1.NotFoundException('Goal not found');
        }
        return goal;
    }
};
exports.GoalsService = GoalsService;
exports.GoalsService = GoalsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GoalsService);
//# sourceMappingURL=goals.service.js.map