import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { PushService } from './push.service';
import { NotificationsCronService } from './cron.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/jwt-payload.type';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  paginationSchema,
  subscribePushSchema,
  unsubscribePushSchema,
  type PaginationDto,
  type SubscribePushDto,
  type UnsubscribePushDto,
} from './schemas';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly pushService: PushService,
    private readonly cronService: NotificationsCronService,
  ) {}

  @Get()
  findAll(
    @CurrentUser() user: JwtUser,
    @Query(new ZodValidationPipe(paginationSchema)) query: PaginationDto,
  ) {
    return this.notificationsService.findAll(
      user.sub,
      query.page,
      query.pageSize,
    );
  }

  @Get('unread-count')
  getUnreadCount(@CurrentUser() user: JwtUser) {
    return this.notificationsService.getUnreadCount(user.sub);
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  markRead(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.notificationsService.markRead(user.sub, id);
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  markAllRead(@CurrentUser() user: JwtUser) {
    return this.notificationsService.markAllRead(user.sub);
  }

  /** Dev-only: trigger the daily cron job immediately (authenticated, runs for all users). */
  @Post('dev/trigger-cron')
  @HttpCode(HttpStatus.OK)
  async triggerCron() {
    if (process.env.NODE_ENV === 'production') {
      return { skipped: true, reason: 'Not available in production' };
    }
    await this.cronService.runDailyNotifications();
    return { triggered: true };
  }
}

@Controller('push')
@UseGuards(JwtAuthGuard)
export class PushController {
  constructor(private readonly pushService: PushService) {}

  @Post('subscribe')
  @HttpCode(HttpStatus.OK)
  subscribe(
    @CurrentUser() user: JwtUser,
    @Body(new ZodValidationPipe(subscribePushSchema)) dto: SubscribePushDto,
  ) {
    return this.pushService.subscribe(
      user.sub,
      dto.endpoint,
      dto.keys.p256dh,
      dto.keys.auth,
    );
  }

  @Post('unsubscribe')
  @HttpCode(HttpStatus.OK)
  unsubscribe(
    @CurrentUser() user: JwtUser,
    @Body(new ZodValidationPipe(unsubscribePushSchema)) dto: UnsubscribePushDto,
  ) {
    return this.pushService.unsubscribe(dto.endpoint);
  }
}
