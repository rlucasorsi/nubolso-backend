import { Module } from '@nestjs/common';
import {
  NotificationsController,
  PushController,
} from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PushService } from './push.service';
import { NotificationsCronService } from './cron.service';
import { NotificationsBudgetCronService } from './budget-cron.service';

@Module({
  controllers: [NotificationsController, PushController],
  providers: [
    NotificationsService,
    PushService,
    NotificationsCronService,
    NotificationsBudgetCronService,
  ],
  exports: [NotificationsService, PushService],
})
export class NotificationsModule {}
