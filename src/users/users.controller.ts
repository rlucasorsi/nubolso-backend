import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/jwt-payload.type';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { updateUserSchema } from './schemas';
import type { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@CurrentUser() user: JwtUser) {
    const found = await this.usersService.findById(user.sub);

    if (!found) {
      throw new NotFoundException('User not found');
    }

    return this.toPublicUser(found);
  }

  @Patch('me')
  async updateMe(
    @CurrentUser() user: JwtUser,
    @Body(new ZodValidationPipe(updateUserSchema)) data: UpdateUserDto,
  ) {
    const updated = await this.usersService.update(user.sub, {
      ...data,
      balanceStartDate: data.balanceStartDate
        ? new Date(data.balanceStartDate)
        : undefined,
    });

    return this.toPublicUser(updated);
  }

  @Get('me/export')
  async exportData(@CurrentUser() user: JwtUser) {
    return this.usersService.exportData(user.sub);
  }

  private toPublicUser(
    user: Awaited<ReturnType<typeof this.usersService.findById>>,
  ) {
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      googleId: user.googleId,
      isEmailVerified: user.isEmailVerified,
      currentBalance: user.currentBalance,
      balanceStartDate: user.balanceStartDate,
      greenThreshold: user.greenThreshold,
      yellowThreshold: user.yellowThreshold,
      ofxBankId: user.ofxBankId,
      ofxAcctId: user.ofxAcctId,
      plan: user.plan,
      planExpiresAt: user.planExpiresAt,
      createdAt: user.createdAt,
    };
  }

  @Delete('me')
  async deleteAccount(@CurrentUser() user: JwtUser) {
    await this.usersService.deleteAccount(user.sub);
  }
}
