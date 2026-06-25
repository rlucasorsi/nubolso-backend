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
import { RecurringTemplatesService } from './recurring-templates.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/jwt-payload.type';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  createRecurringTemplateSchema,
  updateRecurringTemplateSchema,
  realizeRecurringTemplateSchema,
  skipRecurringTemplateSchema,
} from './schemas';
import type { CreateRecurringTemplateDto } from './dto/create-recurring-template.dto';
import type { UpdateRecurringTemplateDto } from './dto/update-recurring-template.dto';
import type { RealizeRecurringTemplateDto } from './dto/realize-recurring-template.dto';
import type { SkipRecurringTemplateDto } from './dto/skip-recurring-template.dto';

@Controller('recurring-templates')
@UseGuards(JwtAuthGuard)
export class RecurringTemplatesController {
  constructor(
    private readonly recurringTemplatesService: RecurringTemplatesService,
  ) {}

  @Get()
  findAll(@CurrentUser() user: JwtUser) {
    return this.recurringTemplatesService.findAll(user.sub);
  }

  @Post()
  create(
    @CurrentUser() user: JwtUser,
    @Body(new ZodValidationPipe(createRecurringTemplateSchema))
    data: CreateRecurringTemplateDto,
  ) {
    return this.recurringTemplatesService.create(user.sub, data);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateRecurringTemplateSchema))
    data: UpdateRecurringTemplateDto,
  ) {
    return this.recurringTemplatesService.update(user.sub, id, data);
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.recurringTemplatesService.remove(user.sub, id);
  }

  @Post(':id/realize')
  realize(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(realizeRecurringTemplateSchema))
    data: RealizeRecurringTemplateDto,
  ) {
    return this.recurringTemplatesService.realize(user.sub, id, data);
  }

  @Post(':id/skip')
  skip(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(skipRecurringTemplateSchema))
    data: SkipRecurringTemplateDto,
  ) {
    return this.recurringTemplatesService.skip(user.sub, id, data);
  }
}
