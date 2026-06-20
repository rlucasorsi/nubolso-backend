import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { memoryStorage } from 'multer';
import { OfxImportService } from './ofx-import.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/jwt-payload.type';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { confirmImportSchema } from './schemas';
import type { ConfirmImportDto } from './dto/confirm-import.dto';

@Controller('imports/ofx')
@UseGuards(JwtAuthGuard)
export class OfxImportController {
  constructor(private readonly ofxImportService: OfxImportService) {}

  @Post()
  // Upload envolve parsing de regex + queries no DB por transação: limite mais
  // restritivo que o throttler global (100/min) para conter abuso direcionado.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    }),
  )
  upload(
    @CurrentUser() user: JwtUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.ofxImportService.upload(user.sub, file);
  }

  @Get()
  findAll(@CurrentUser() user: JwtUser) {
    return this.ofxImportService.findAllBatches(user.sub);
  }

  @Get(':id')
  findOne(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.ofxImportService.findBatchDetail(user.sub, id);
  }

  @Post(':id/confirm')
  confirm(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(confirmImportSchema)) data: ConfirmImportDto,
  ) {
    return this.ofxImportService.confirm(user.sub, id, data.decisions);
  }

  @Post(':id/rollback')
  rollback(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.ofxImportService.rollback(user.sub, id);
  }

  @Delete(':id')
  cancel(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.ofxImportService.cancel(user.sub, id);
  }
}
