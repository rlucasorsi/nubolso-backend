"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const helmet_1 = __importDefault(require("helmet"));
const app_module_1 = require("./app.module");
const REQUIRED_ENV_VARS = ['JWT_SECRET', 'DATABASE_URL'];
function assertRequiredEnv() {
    const missing = REQUIRED_ENV_VARS.filter((v) => !process.env[v]);
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}
async function bootstrap() {
    assertRequiredEnv();
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const logger = new common_1.Logger('Bootstrap');
    app.use((0, helmet_1.default)());
    const isProd = process.env.NODE_ENV === 'production';
    const allowedOrigins = isProd
        ? ['https://nubolso.com']
        : ['http://localhost:3001', 'http://localhost:3000', 'https://nubolso.com'];
    app.enableCors({
        origin: allowedOrigins,
    });
    const port = process.env.PORT || 3000;
    await app.listen(port);
    logger.log(`Application is running on port ${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map