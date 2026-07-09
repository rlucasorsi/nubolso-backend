import { Module } from '@nestjs/common';
import { CategoryBudgetsService } from './category-budgets.service';
import { CategoryBudgetsController } from './category-budgets.controller';

@Module({
  providers: [CategoryBudgetsService],
  controllers: [CategoryBudgetsController],
  exports: [CategoryBudgetsService],
})
export class CategoryBudgetsModule {}
