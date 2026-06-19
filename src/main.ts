import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

const REQUIRED_ENV_VARS = ['JWT_SECRET', 'DATABASE_URL', 'RESEND_API_KEY'];

function assertRequiredEnv(): void {
  const missing = REQUIRED_ENV_VARS.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

async function bootstrap() {
  assertRequiredEnv();

  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  const extraOrigins = (process.env.FRONTEND_URL ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const allowedOrigins = [
    'http://localhost:3001',
    'http://localhost:3000',
    ...extraOrigins,
  ];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  app.enableShutdownHooks();

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Application is running on port ${port}`);
}
bootstrap();
