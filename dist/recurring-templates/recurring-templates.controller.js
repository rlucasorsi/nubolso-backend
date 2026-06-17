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
exports.RecurringTemplatesController = void 0;
const common_1 = require("@nestjs/common");
const recurring_templates_service_1 = require("./recurring-templates.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const zod_validation_pipe_1 = require("../common/pipes/zod-validation.pipe");
const schemas_1 = require("./schemas");
let RecurringTemplatesController = class RecurringTemplatesController {
    recurringTemplatesService;
    constructor(recurringTemplatesService) {
        this.recurringTemplatesService = recurringTemplatesService;
    }
    findAll(user) {
        return this.recurringTemplatesService.findAll(user.sub);
    }
    create(user, data) {
        return this.recurringTemplatesService.create(user.sub, data);
    }
    update(user, id, data) {
        return this.recurringTemplatesService.update(user.sub, id, data);
    }
    remove(user, id) {
        return this.recurringTemplatesService.remove(user.sub, id);
    }
    realize(user, id, data) {
        return this.recurringTemplatesService.realize(user.sub, id, data);
    }
    skip(user, id, data) {
        return this.recurringTemplatesService.skip(user.sub, id, data);
    }
};
exports.RecurringTemplatesController = RecurringTemplatesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RecurringTemplatesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(schemas_1.createRecurringTemplateSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], RecurringTemplatesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(schemas_1.updateRecurringTemplateSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], RecurringTemplatesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], RecurringTemplatesController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/realize'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(schemas_1.realizeRecurringTemplateSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], RecurringTemplatesController.prototype, "realize", null);
__decorate([
    (0, common_1.Post)(':id/skip'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(schemas_1.skipRecurringTemplateSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], RecurringTemplatesController.prototype, "skip", null);
exports.RecurringTemplatesController = RecurringTemplatesController = __decorate([
    (0, common_1.Controller)('recurring-templates'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [recurring_templates_service_1.RecurringTemplatesService])
], RecurringTemplatesController);
//# sourceMappingURL=recurring-templates.controller.js.map