"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZodValidationPipe = void 0;
const common_1 = require("@nestjs/common");
class ZodValidationPipe {
    schema;
    constructor(schema) {
        this.schema = schema;
    }
    transform(value) {
        const result = this.schema.safeParse(value);
        if (!result.success) {
            throw new common_1.BadRequestException({
                message: 'Dados inválidos',
                errors: result.error.flatten().fieldErrors,
            });
        }
        return result.data;
    }
}
exports.ZodValidationPipe = ZodValidationPipe;
//# sourceMappingURL=zod-validation.pipe.js.map