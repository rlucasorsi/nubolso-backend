import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreditCardInvoicesService } from './credit-card-invoices.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/jwt-payload.type';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { updateInvoiceSchema, payInvoiceSchema } from './schemas';
import type { UpdateInvoiceDto } from './dto/update-invoice.dto';
import type { PayInvoiceDto } from './dto/pay-invoice.dto';

@Controller('credit-cards')
@UseGuards(JwtAuthGuard)
export class CreditCardInvoicesController {
  constructor(private readonly invoicesService: CreditCardInvoicesService) {}

  @Get('invoices')
  findAllForUser(
    @CurrentUser() user: JwtUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.invoicesService.findAllForUser(user.sub, from, to);
  }

  @Get('invoices/:id')
  findOne(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.invoicesService.findOne(user.sub, id);
  }

  @Patch('invoices/:id')
  updatePaymentDate(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateInvoiceSchema)) data: UpdateInvoiceDto,
  ) {
    return this.invoicesService.updatePaymentDate(user.sub, id, data);
  }

  @Post('invoices/:id/pay')
  pay(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(payInvoiceSchema)) data: PayInvoiceDto,
  ) {
    return this.invoicesService.pay(user.sub, id, data);
  }

  @Post('invoices/:id/reopen')
  reopen(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.invoicesService.reopen(user.sub, id);
  }

  @Get(':cardId/invoices')
  findAllForCard(
    @CurrentUser() user: JwtUser,
    @Param('cardId') cardId: string,
  ) {
    return this.invoicesService.findAllForCard(user.sub, cardId);
  }
}
