import { Controller, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CreditCardPurchasesService } from './credit-card-purchases.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/jwt-payload.type';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { createPurchaseSchema } from './schemas';
import type { CreatePurchaseDto } from './dto/create-purchase.dto';

@Controller('credit-cards/purchases')
@UseGuards(JwtAuthGuard)
export class CreditCardPurchasesController {
  constructor(private readonly purchasesService: CreditCardPurchasesService) {}

  @Post()
  create(
    @CurrentUser() user: JwtUser,
    @Body(new ZodValidationPipe(createPurchaseSchema)) data: CreatePurchaseDto,
  ) {
    return this.purchasesService.create(user.sub, data);
  }

  @Post('simulate')
  simulate(
    @CurrentUser() user: JwtUser,
    @Body(new ZodValidationPipe(createPurchaseSchema)) data: CreatePurchaseDto,
  ) {
    return this.purchasesService.simulate(user.sub, data);
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.purchasesService.remove(user.sub, id);
  }
}
