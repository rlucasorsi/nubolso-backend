import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/jwt-payload.type';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { createCategorySchema, updateCategorySchema } from './schemas';
import type { CreateCategoryDto, UpdateCategoryDto } from './schemas';

@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  findAll(@CurrentUser() user: JwtUser) {
    return this.categoriesService.findAll(user.sub);
  }

  @Post()
  create(
    @CurrentUser() user: JwtUser,
    @Body(new ZodValidationPipe(createCategorySchema)) data: CreateCategoryDto,
  ) {
    return this.categoriesService.create(user.sub, data);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateCategorySchema)) data: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(user.sub, id, data);
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.categoriesService.remove(user.sub, id);
  }
}
