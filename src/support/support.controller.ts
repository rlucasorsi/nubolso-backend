import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { MailerService } from '../mailer/mailer.service';

const supportSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  subject: z.string().min(1),
  message: z.string().min(10).max(2000),
});

type SupportDto = z.infer<typeof supportSchema>;

@Controller('support')
export class SupportController {
  constructor(private readonly mailerService: MailerService) {}

  @Post()
  @HttpCode(201)
  async submit(@Body(new ZodValidationPipe(supportSchema)) dto: SupportDto) {
    await this.mailerService.sendSupportRequest(dto);
    return { success: true };
  }
}
