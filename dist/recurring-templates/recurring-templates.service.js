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
exports.RecurringTemplatesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let RecurringTemplatesService = class RecurringTemplatesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(userId) {
        return this.prisma.recurringTemplate.findMany({
            where: { userId },
            include: { category: true },
            orderBy: { dayOfMonth: 'asc' },
        });
    }
    async create(userId, data) {
        return this.prisma.recurringTemplate.create({
            data: { ...data, userId },
            include: { category: true },
        });
    }
    async update(userId, id, data) {
        await this.findOne(userId, id);
        return this.prisma.recurringTemplate.update({
            where: { id },
            data,
            include: { category: true },
        });
    }
    async remove(userId, id) {
        await this.findOne(userId, id);
        return this.prisma.recurringTemplate.delete({
            where: { id },
        });
    }
    async realize(userId, id, data) {
        const template = await this.findOne(userId, id);
        const date = new Date(data.date);
        return this.prisma.transaction.upsert({
            where: {
                templateId_date: {
                    templateId: id,
                    date,
                },
            },
            create: {
                description: template.description,
                amount: data.amount,
                type: template.type,
                date,
                isPaid: data.isPaid ?? false,
                templateId: id,
                categoryId: template.categoryId,
                userId,
            },
            update: {
                amount: data.amount,
                isPaid: data.isPaid ?? undefined,
            },
            include: {
                category: true,
            },
        });
    }
    async skip(userId, id, data) {
        const template = await this.findOne(userId, id);
        const date = new Date(data.date);
        return this.prisma.transaction.upsert({
            where: {
                templateId_date: {
                    templateId: id,
                    date,
                },
            },
            create: {
                description: template.description,
                amount: template.estimatedAmount,
                type: template.type,
                date,
                isPaid: false,
                isSkipped: true,
                templateId: id,
                categoryId: template.categoryId,
                userId,
            },
            update: {
                isSkipped: true,
                isPaid: false,
            },
            include: {
                category: true,
            },
        });
    }
    async findOne(userId, id) {
        const template = await this.prisma.recurringTemplate.findFirst({
            where: { id, userId },
        });
        if (!template) {
            throw new common_1.NotFoundException('Recurring template not found');
        }
        return template;
    }
};
exports.RecurringTemplatesService = RecurringTemplatesService;
exports.RecurringTemplatesService = RecurringTemplatesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RecurringTemplatesService);
//# sourceMappingURL=recurring-templates.service.js.map