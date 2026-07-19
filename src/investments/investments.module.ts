import { Module } from '@nestjs/common';
import { InvestmentsService } from './investments.service';
import { InvestmentsQuoteService } from './investments-quote.service';
import { InvestmentsController } from './investments.controller';

@Module({
  providers: [InvestmentsService, InvestmentsQuoteService],
  controllers: [InvestmentsController],
})
export class InvestmentsModule {}
