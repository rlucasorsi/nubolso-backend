import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import type { Plan } from '@prisma/client';

export const REQUIRED_PLAN_KEY = 'requiredPlan';
export const RequiresPlan = (plan: Plan) =>
  SetMetadata(REQUIRED_PLAN_KEY, plan);

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPlan = this.reflector.getAllAndOverride<Plan>(
      REQUIRED_PLAN_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPlan) return true;

    const request = context
      .switchToHttp()
      .getRequest<{ user?: { sub?: string } }>();
    const userId = request.user?.sub;

    if (!userId) return false;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    if (!user || user.plan !== requiredPlan) {
      throw new ForbiddenException('Upgrade required');
    }

    return true;
  }
}
