import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly pool: Pool;
  private readonly logger = new Logger(PrismaService.name);

  constructor(config: ConfigService) {
    const pool = new Pool({
      connectionString: config.get('DATABASE_URL'),
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    super({ adapter: new PrismaPg(pool) });
    this.pool = pool;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect().catch((err) =>
      this.logger.error('Error disconnecting Prisma', err),
    );
    await this.pool.end().catch((err) =>
      this.logger.error('Error ending pg pool', err),
    );
  }
}
