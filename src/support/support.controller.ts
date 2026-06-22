import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

const supportSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  subject: z.string().min(1),
  message: z.string().min(10).max(2000),
});

type SupportDto = z.infer<typeof supportSchema>;

@Controller('support')
export class SupportController {
  @Post()
  @HttpCode(201)
  submit(@Body(new ZodValidationPipe(supportSchema)) dto: SupportDto) {
    console.log('[Support Request]', {
      timestamp: new Date().toISOString(),
      ...dto,
    });
    return { success: true };
  }
}
