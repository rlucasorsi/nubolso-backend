import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private enabled = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    const publicKey = this.config.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.config.get<string>('VAPID_PRIVATE_KEY');
    const subject =
      this.config.get<string>('VAPID_SUBJECT') ?? 'mailto:admin@nubolso.com';

    if (!publicKey || !privateKey) {
      this.logger.warn(
        'VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY not set — Web Push disabled. ' +
          'Generate keys with: npx web-push generate-vapid-keys',
      );
      return;
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);
    this.enabled = true;
    this.logger.log('Web Push initialized');
  }

  async sendToUser(
    userId: string,
    payload: {
      title: string;
      body: string;
      data?: Record<string, string>;
      tag?: string;
    },
  ): Promise<void> {
    if (!this.enabled) return;

    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userId },
    });

    await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush
          .sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            JSON.stringify(payload),
          )
          .catch(async (err: webpush.WebPushError) => {
            if (err.statusCode === 404 || err.statusCode === 410) {
              await this.prisma.pushSubscription.deleteMany({
                where: { endpoint: sub.endpoint },
              });
              this.logger.warn(
                `Removed stale push subscription: ${sub.endpoint}`,
              );
            } else {
              this.logger.error(`Push send failed: ${err.message}`);
            }
          }),
      ),
    );
  }

  async subscribe(
    userId: string,
    endpoint: string,
    p256dh: string,
    auth: string,
  ) {
    return this.prisma.pushSubscription.upsert({
      where: { endpoint },
      create: { userId, endpoint, p256dh, auth },
      update: { userId, p256dh, auth },
    });
  }

  async unsubscribe(endpoint: string) {
    await this.prisma.pushSubscription.deleteMany({ where: { endpoint } });
  }
}
