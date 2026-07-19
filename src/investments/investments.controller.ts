import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InvestmentsService } from './investments.service';
import { InvestmentsQuoteService } from './investments-quote.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/jwt-payload.type';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  createInvestmentSchema,
  updateInvestmentSchema,
  createInvestmentMovementSchema,
  listInvestmentMovementsQuerySchema,
  investmentQuoteQuerySchema,
  investmentTickerSearchQuerySchema,
} from './schemas';
import type { CreateInvestmentDto } from './dto/create-investment.dto';
import type { UpdateInvestmentDto } from './dto/update-investment.dto';
import type { CreateInvestmentMovementDto } from './dto/create-investment-movement.dto';
import type { ListInvestmentMovementsQueryDto } from './dto/list-investment-movements-query.dto';
import type { InvestmentQuoteQueryDto } from './dto/investment-quote-query.dto';
import type { InvestmentTickerSearchQueryDto } from './dto/investment-ticker-search-query.dto';

@Controller('investments')
@UseGuards(JwtAuthGuard)
export class InvestmentsController {
  constructor(
    private readonly investmentsService: InvestmentsService,
    private readonly quoteService: InvestmentsQuoteService,
  ) {}

  @Get()
  findAll(@CurrentUser() user: JwtUser) {
    return this.investmentsService.findAll(user.sub);
  }

  @Get('quote')
  getQuote(
    @Query(new ZodValidationPipe(investmentQuoteQuerySchema))
    query: InvestmentQuoteQueryDto,
  ) {
    return this.quoteService.getQuote(query.ticker);
  }

  @Get('search')
  searchTickers(
    @Query(new ZodValidationPipe(investmentTickerSearchQuerySchema))
    query: InvestmentTickerSearchQueryDto,
  ) {
    return this.quoteService.searchTickers(query.q);
  }

  @Post()
  create(
    @CurrentUser() user: JwtUser,
    @Body(new ZodValidationPipe(createInvestmentSchema))
    data: CreateInvestmentDto,
  ) {
    return this.investmentsService.create(user.sub, data);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateInvestmentSchema))
    data: UpdateInvestmentDto,
  ) {
    return this.investmentsService.update(user.sub, id, data);
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.investmentsService.remove(user.sub, id);
  }

  @Post(':id/movements')
  addMovement(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createInvestmentMovementSchema))
    data: CreateInvestmentMovementDto,
  ) {
    return this.investmentsService.addMovement(user.sub, id, data);
  }

  @Get(':id/movements')
  listMovements(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Query(new ZodValidationPipe(listInvestmentMovementsQuerySchema))
    query: ListInvestmentMovementsQueryDto,
  ) {
    return this.investmentsService.listMovements(
      user.sub,
      id,
      query.page ?? 1,
      query.limit ?? 10,
    );
  }

  @Delete(':id/movements/:movementId')
  removeMovement(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Param('movementId') movementId: string,
  ) {
    return this.investmentsService.removeMovement(user.sub, id, movementId);
  }
}
