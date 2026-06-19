"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const REQUIRED_ENV_VARS = ['JWT_SECRET', 'DATABASE_URL', 'RESEND_API_KEY'];
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
    const isProd = process.env.NODE_ENV === 'production';
    const allowedOrigins = isProd
        ? ['https://nubolso.com']
        : ['http://localhost:3001', 'http://localhost:3000', 'https://nubolso.com'];
    app.enableCors({
        origin: allowedOrigins,
        credentials: true,
    });
    const port = process.env.PORT || 3000;
    await app.listen(port);
    logger.log(`Application is running on port ${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map