import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StripeService } from './stripe.service';
import { BillingController } from './billing.controller';
import { WebhookController } from './webhook.controller';

@Module({
  imports: [PrismaModule],
  providers: [StripeService],
  controllers: [BillingController, WebhookController],
})
export class BillingModule {}
