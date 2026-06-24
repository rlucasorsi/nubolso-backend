import {
  Controller,
  Post,
  Req,
  Headers,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import Stripe from 'stripe';
import { StripeService } from './stripe.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('billing')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('webhook')
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') sig: string,
  ) {
    if (!sig) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    let event: Stripe.Event;
    try {
      event = this.stripeService.constructWebhookEvent(req.rawBody!, sig);
    } catch (err) {
      throw new BadRequestException(
        `Webhook signature verification failed: ${(err as Error).message}`,
      );
    }

    try {
      await this.processEvent(event);
    } catch (err) {
      this.logger.error(`Failed to process webhook event ${event.type}`, err);
    }

    return { received: true };
  }

  private async processEvent(event: Stripe.Event) {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const subscriptionId = session.subscription as string | null;

        if (!userId) return;

        await this.prisma.user.update({
          where: { id: userId },
          data: {
            plan: 'PRO',
            stripeSubscriptionId: subscriptionId,
          },
        });

        this.logger.log(`User ${userId} upgraded to PRO`);
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const isActive = ['active', 'trialing', 'past_due'].includes(
          subscription.status,
        );

        await this.prisma.user.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            plan: isActive ? 'PRO' : 'FREE',
            stripeSubscriptionId: isActive ? subscription.id : null,
          },
        });

        this.logger.log(
          `Subscription ${subscription.id} status=${subscription.status} — plan set to ${isActive ? 'PRO' : 'FREE'}`,
        );
        break;
      }

      default:
        break;
    }
  }
}
