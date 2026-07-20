import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Delete,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/jwt-payload.type';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  createTransactionSchema,
  updateTransactionSchema,
  queryTransactionSchema,
} from './schemas';
import type { CreateTransactionDto } from './dto/create-transaction.dto';
import type { UpdateTransactionDto } from './dto/update-transaction.dto';
import type { QueryTransactionDto } from './dto/query-transaction.dto';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  findAll(
    @CurrentUser() user: JwtUser,
    @Query(new ZodValidationPipe(queryTransactionSchema))
    query: QueryTransactionDto,
  ) {
    return this.transactionsService.findAll(user.sub, query);
  }

  @Post()
  create(
    @CurrentUser() user: JwtUser,
    @Body(new ZodValidationPipe(createTransactionSchema))
    data: CreateTransactionDto,
  ) {
    return this.transactionsService.create(user.sub, data);
  }

  @Patch(':id/toggle-paid')
  togglePaid(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.transactionsService.togglePaid(user.sub, id);
  }

  @Patch(':id/unskip')
  unskip(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.transactionsService.unskip(user.sub, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateTransactionSchema))
    data: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(user.sub, id, data);
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.transactionsService.remove(user.sub, id);
  }
}
