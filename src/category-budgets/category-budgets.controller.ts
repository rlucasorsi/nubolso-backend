import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CategoryBudgetsService } from './category-budgets.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/jwt-payload.type';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  queryCategoryBudgetSchema,
  upsertCategoryBudgetSchema,
} from './schemas';
import type {
  QueryCategoryBudgetDto,
  UpsertCategoryBudgetDto,
} from './schemas';

@Controller('category-budgets')
@UseGuards(JwtAuthGuard)
export class CategoryBudgetsController {
  constructor(
    private readonly categoryBudgetsService: CategoryBudgetsService,
  ) {}

  @Get()
  findByPeriod(
    @CurrentUser() user: JwtUser,
    @Query(new ZodValidationPipe(queryCategoryBudgetSchema))
    query: QueryCategoryBudgetDto,
  ) {
    return this.categoryBudgetsService.findByPeriod(
      user.sub,
      query.periodStart,
    );
  }

  @Put()
  upsert(
    @CurrentUser() user: JwtUser,
    @Body(new ZodValidationPipe(upsertCategoryBudgetSchema))
    data: UpsertCategoryBudgetDto,
  ) {
    return this.categoryBudgetsService.upsert(user.sub, data);
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.categoryBudgetsService.remove(user.sub, id);
  }
}
