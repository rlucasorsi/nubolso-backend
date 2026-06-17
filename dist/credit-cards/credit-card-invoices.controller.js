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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreditCardInvoicesController = void 0;
const common_1 = require("@nestjs/common");
const credit_card_invoices_service_1 = require("./credit-card-invoices.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const zod_validation_pipe_1 = require("../common/pipes/zod-validation.pipe");
const schemas_1 = require("./schemas");
let CreditCardInvoicesController = class CreditCardInvoicesController {
    invoicesService;
    constructor(invoicesService) {
        this.invoicesService = invoicesService;
    }
    findAllForUser(user, from, to) {
        return this.invoicesService.findAllForUser(user.sub, from, to);
    }
    findOne(user, id) {
        return this.invoicesService.findOne(user.sub, id);
    }
    updatePaymentDate(user, id, data) {
        return this.invoicesService.updatePaymentDate(user.sub, id, data);
    }
    pay(user, id, data) {
        return this.invoicesService.pay(user.sub, id, data);
    }
    reopen(user, id) {
        return this.invoicesService.reopen(user.sub, id);
    }
    findAllForCard(user, cardId) {
        return this.invoicesService.findAllForCard(user.sub, cardId);
    }
};
exports.CreditCardInvoicesController = CreditCardInvoicesController;
__decorate([
    (0, common_1.Get)('invoices'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], CreditCardInvoicesController.prototype, "findAllForUser", null);
__decorate([
    (0, common_1.Get)('invoices/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CreditCardInvoicesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)('invoices/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(schemas_1.updateInvoiceSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], CreditCardInvoicesController.prototype, "updatePaymentDate", null);
__decorate([
    (0, common_1.Post)('invoices/:id/pay'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(schemas_1.payInvoiceSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], CreditCardInvoicesController.prototype, "pay", null);
__decorate([
    (0, common_1.Post)('invoices/:id/reopen'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CreditCardInvoicesController.prototype, "reopen", null);
__decorate([
    (0, common_1.Get)(':cardId/invoices'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('cardId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CreditCardInvoicesController.prototype, "findAllForCard", null);
exports.CreditCardInvoicesController = CreditCardInvoicesController = __decorate([
    (0, common_1.Controller)('credit-cards'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [credit_card_invoices_service_1.CreditCardInvoicesService])
], CreditCardInvoicesController);
//# sourceMappingURL=credit-card-invoices.controller.js.map