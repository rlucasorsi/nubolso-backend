import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CreditCardsService } from './credit-cards.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/jwt-payload.type';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { createCreditCardSchema, updateCreditCardSchema } from './schemas';
import type { CreateCreditCardDto } from './dto/create-credit-card.dto';
import type { UpdateCreditCardDto } from './dto/update-credit-card.dto';

@Controller('credit-cards')
@UseGuards(JwtAuthGuard)
export class CreditCardsController {
  constructor(private readonly creditCardsService: CreditCardsService) {}

  @Get()
  findAll(@CurrentUser() user: JwtUser) {
    return this.creditCardsService.findAll(user.sub);
  }

  @Post()
  create(
    @CurrentUser() user: JwtUser,
    @Body(new ZodValidationPipe(createCreditCardSchema)) data: CreateCreditCardDto,
  ) {
    return this.creditCardsService.create(user.sub, data);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateCreditCardSchema)) data: UpdateCreditCardDto,
  ) {
    return this.creditCardsService.update(user.sub, id, data);
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.creditCardsService.remove(user.sub, id);
  }
}
