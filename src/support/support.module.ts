import { Module } from '@nestjs/common';
import { SupportController } from './support.controller';
import { MailerModule } from '../mailer/mailer.module';

@Module({
  imports: [MailerModule],
  controllers: [SupportController],
})
export class SupportModule {}
