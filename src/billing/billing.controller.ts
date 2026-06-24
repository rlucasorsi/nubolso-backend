import {
  Controller,
  Post,
  UseGuards,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { StripeService } from './stripe.service';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtUser } from '../auth/jwt-payload.type';

@Controller('billing')
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('checkout')
  async checkout(@CurrentUser() jwtUser: JwtUser) {
    let user = await this.prisma.user.findUnique({
      where: { id: jwtUser.sub },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.stripeCustomerId) {
      const customer = await this.stripeService.createCustomer(user.email);
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customer.id },
      });
    }

    const session = await this.stripeService.createCheckoutSession(
      user.stripeCustomerId!,
      user.id,
    );

    return { url: session.url };
  }

  @Post('portal')
  async portal(@CurrentUser() jwtUser: JwtUser) {
    const user = await this.prisma.user.findUnique({
      where: { id: jwtUser.sub },
    });

    if (!user?.stripeCustomerId) {
      throw new BadRequestException('No active subscription found');
    }

    const url = await this.stripeService.createPortalSession(
      user.stripeCustomerId,
    );
    return { url };
  }
}
