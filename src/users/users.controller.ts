import { Controller, Get, Patch, Body, UseGuards, NotFoundException } from '@nestjs/common';
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

    const { passwordHash, ...rest } = found;
    return rest;
  }

  @Patch('me')
  async updateMe(
    @CurrentUser() user: JwtUser,
    @Body(new ZodValidationPipe(updateUserSchema)) data: UpdateUserDto,
  ) {
    const updated = await this.usersService.update(user.sub, {
      ...data,
      balanceStartDate: data.balanceStartDate ? new Date(data.balanceStartDate) : undefined,
    });

    const { passwordHash, ...rest } = updated;
    return rest;
  }
}
