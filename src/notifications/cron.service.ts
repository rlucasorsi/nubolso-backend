import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';
import { PushService } from './push.service';

const TODAY_LABEL = () => new Date().toISOString().split('T')[0];

@Injectable()
export class NotificationsCronService {
  private readonly logger = new Logger(NotificationsCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly pushService: PushService,
  ) {}

  /** Runs every day at 08:00 UTC */
  @Cron('0 8 * * *')
  async runDailyNotifications() {
    this.logger.log('Running daily notifications job');
    const today = new Date();
    const todayDay = today.getDate();
    const todayMonth = today.getMonth() + 1;
    const todayYear = today.getFullYear();

    // Tomorrow
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowDay = tomorrow.getDate();

    const dateLabel = TODAY_LABEL();

    const users = await this.prisma.user.findMany({ select: { id: true } });

    await Promise.allSettled(
      users.map((user) =>
        this.processUserNotifications(
          user.id,
          todayDay,
          tomorrowDay,
          todayMonth,
          todayYear,
          dateLabel,
        ),
      ),
    );

    this.logger.log('Daily notifications job completed');
  }

  private async processUserNotifications(
    userId: string,
    todayDay: number,
    tomorrowDay: number,
    todayMonth: number,
    todayYear: number,
    dateLabel: string,
  ) {
    await Promise.allSettled([
      this.processRecurringDue(userId, todayDay, tomorrowDay, dateLabel),
      this.processInvoiceDue(userId, todayMonth, todayYear, dateLabel),
    ]);
  }

  private async processRecurringDue(
    userId: string,
    todayDay: number,
    tomorrowDay: number,
    dateLabel: string,
  ) {
    const templates = await this.prisma.recurringTemplate.findMany({
      where: {
        userId,
        isActive: true,
        dayOfMonth: { in: [todayDay, tomorrowDay] },
        OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
      },
    });

    for (const template of templates) {
      const isDueToday = template.dayOfMonth === todayDay;
      const title = isDueToday
        ? `${template.description} vence hoje`
        : `${template.description} vence amanhã`;
      const body = `Lembre-se de efetivar este lançamento recorrente.`;
      const dedupeKey = `RECURRING_DUE:${template.id}:${dateLabel}`;

      const { isNew } = await this.notificationsService.createIfNew({
        userId,
        type: 'RECURRING_DUE',
        title,
        body,
        data: { url: '/dashboard', templateId: template.id },
        dedupeKey,
      });

      if (isNew) {
        await this.pushService.sendToUser(userId, {
          title,
          body,
          data: { url: '/dashboard' },
          tag: dedupeKey,
        });
      }
    }
  }

  private async processInvoiceDue(
    userId: string,
    todayMonth: number,
    todayYear: number,
    dateLabel: string,
  ) {
    // Check current month's invoice and the previous one (in case it's overdue)
    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - 1);
    const windowEnd = new Date();
    windowEnd.setDate(windowEnd.getDate() + 1);

    const invoices = await this.prisma.creditCardInvoice.findMany({
      where: {
        userId,
        isPaid: false,
        paymentDate: { gte: windowStart, lte: windowEnd },
      },
      include: { card: { select: { name: true } } },
    });

    for (const invoice of invoices) {
      const dueStr = invoice.paymentDate.toLocaleDateString('pt-BR');
      const title = `Fatura ${invoice.card.name} a pagar`;
      const body = `Fatura de ${invoice.referenceMonth.toString().padStart(2, '0')}/${invoice.referenceYear} vence em ${dueStr}.`;
      const dedupeKey = `INVOICE_DUE:${invoice.id}:${dateLabel}`;

      const { isNew } = await this.notificationsService.createIfNew({
        userId,
        type: 'INVOICE_DUE',
        title,
        body,
        data: { url: '/cards', invoiceId: invoice.id },
        dedupeKey,
      });

      if (isNew) {
        await this.pushService.sendToUser(userId, {
          title,
          body,
          data: { url: '/cards' },
          tag: dedupeKey,
        });
      }
    }
  }
}
