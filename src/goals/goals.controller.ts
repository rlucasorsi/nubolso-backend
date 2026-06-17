import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { GoalsService } from './goals.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/jwt-payload.type';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  createGoalSchema,
  updateGoalSchema,
  createContributionSchema,
  listContributionsQuerySchema,
} from './schemas';
import type { CreateGoalDto } from './dto/create-goal.dto';
import type { UpdateGoalDto } from './dto/update-goal.dto';
import type { CreateContributionDto } from './dto/create-contribution.dto';
import type { ListContributionsQueryDto } from './dto/list-contributions-query.dto';

@Controller('goals')
@UseGuards(JwtAuthGuard)
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Get()
  findAll(@CurrentUser() user: JwtUser) {
    return this.goalsService.findAll(user.sub);
  }

  @Post()
  create(
    @CurrentUser() user: JwtUser,
    @Body(new ZodValidationPipe(createGoalSchema)) data: CreateGoalDto,
  ) {
    return this.goalsService.create(user.sub, data);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateGoalSchema)) data: UpdateGoalDto,
  ) {
    return this.goalsService.update(user.sub, id, data);
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.goalsService.remove(user.sub, id);
  }

  @Post(':id/contributions')
  addContribution(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createContributionSchema)) data: CreateContributionDto,
  ) {
    return this.goalsService.addContribution(user.sub, id, data);
  }

  @Get(':id/contributions')
  listContributions(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Query(new ZodValidationPipe(listContributionsQuerySchema)) query: ListContributionsQueryDto,
  ) {
    return this.goalsService.listContributions(
      user.sub,
      id,
      query.page ?? 1,
      query.limit ?? 5,
    );
  }
}
