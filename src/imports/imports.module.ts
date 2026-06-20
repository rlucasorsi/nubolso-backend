import { Module } from '@nestjs/common';
import { OfxImportService } from './ofx-import.service';
import { OfxImportController } from './ofx-import.controller';

@Module({
  providers: [OfxImportService],
  controllers: [OfxImportController],
})
export class ImportsModule {}
