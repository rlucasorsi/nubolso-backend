import { Module } from '@nestjs/common';
import { RecurringTemplatesService } from './recurring-templates.service';
import { RecurringTemplatesController } from './recurring-templates.controller';

@Module({
  providers: [RecurringTemplatesService],
  controllers: [RecurringTemplatesController],
})
export class RecurringTemplatesModule {}
