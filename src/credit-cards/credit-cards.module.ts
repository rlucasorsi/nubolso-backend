import { Module } from '@nestjs/common';
import { CreditCardsService } from './credit-cards.service';
import { CreditCardsController } from './credit-cards.controller';
import { CreditCardPurchasesService } from './credit-card-purchases.service';
import { CreditCardPurchasesController } from './credit-card-purchases.controller';
import { CreditCardInvoicesService } from './credit-card-invoices.service';
import { CreditCardInvoicesController } from './credit-card-invoices.controller';

@Module({
  providers: [
    CreditCardsService,
    CreditCardPurchasesService,
    CreditCardInvoicesService,
  ],
  controllers: [
    CreditCardsController,
    CreditCardPurchasesController,
    CreditCardInvoicesController,
  ],
})
export class CreditCardsModule {}
