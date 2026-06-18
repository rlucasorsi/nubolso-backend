import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import { User } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { MailerService } from '../mailer/mailer.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendCodeDto } from './dto/resend-code.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import * as bcrypt from 'bcrypt';

const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_VERIFICATION_ATTEMPTS = 5;

@Injectable()
export class AuthService {
  private readonly googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
  );

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailerService: MailerService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 10);
    const code = this.generateCode();

    const user = await this.usersService.create({
      email: registerDto.email,
      passwordHash,
      name: registerDto.name,
      currentBalance: 0,
      isEmailVerified: false,
      verificationCode: code,
      verificationCodeExpiresAt: new Date(Date.now() + CODE_TTL_MS),
    });

    await this.mailerService.sendVerificationCode(user.email, user.name, code);

    return {
      email: user.email,
      message: 'Enviamos um código de confirmação para o seu e-mail.',
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException(
        'Esta conta usa login com Google. Use o botão "Continuar com Google".',
      );
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isEmailVerified) {
      throw new ForbiddenException({
        errorCode: 'EMAIL_NOT_VERIFIED',
        message: 'Confirme seu e-mail para continuar.',
      });
    }

    return this.buildAuthResponse(user);
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Código inválido ou expirado.');
    }

    if (user.isEmailVerified) {
      return this.buildAuthResponse(user);
    }

    if (user.verificationAttempts >= MAX_VERIFICATION_ATTEMPTS) {
      throw new ForbiddenException({
        errorCode: 'TOO_MANY_ATTEMPTS',
        message: 'Muitas tentativas. Solicite um novo código.',
      });
    }

    const isCodeValid =
      !!user.verificationCode &&
      user.verificationCode === dto.code &&
      !!user.verificationCodeExpiresAt &&
      user.verificationCodeExpiresAt > new Date();

    if (!isCodeValid) {
      await this.usersService.update(user.id, {
        verificationAttempts: user.verificationAttempts + 1,
      });
      throw new UnauthorizedException('Código inválido ou expirado.');
    }

    const updatedUser = await this.usersService.update(user.id, {
      isEmailVerified: true,
      verificationCode: null,
      verificationCodeExpiresAt: null,
      verificationAttempts: 0,
    });

    return this.buildAuthResponse(updatedUser);
  }

  async resendVerificationCode(dto: ResendCodeDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (user && !user.isEmailVerified) {
      const codeGeneratedAt = user.verificationCodeExpiresAt
        ? user.verificationCodeExpiresAt.getTime() - CODE_TTL_MS
        : 0;
      const canResend = Date.now() - codeGeneratedAt >= RESEND_COOLDOWN_MS;

      if (canResend) {
        const code = this.generateCode();
        await this.usersService.update(user.id, {
          verificationCode: code,
          verificationCodeExpiresAt: new Date(Date.now() + CODE_TTL_MS),
          verificationAttempts: 0,
        });
        await this.mailerService.sendVerificationCode(
          user.email,
          user.name,
          code,
        );
      }
    }

    return {
      message:
        'Se o e-mail existir e ainda não tiver sido confirmado, enviamos um novo código.',
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (user) {
      const code = this.generateCode();
      await this.usersService.update(user.id, {
        passwordResetCode: code,
        passwordResetCodeExpiresAt: new Date(Date.now() + CODE_TTL_MS),
      });
      await this.mailerService.sendPasswordResetCode(
        user.email,
        user.name,
        code,
      );
    }

    return {
      message:
        'Se o e-mail existir em nossa base, enviaremos um código de redefinição.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (
      !user ||
      !user.passwordResetCode ||
      user.passwordResetCode !== dto.code ||
      !user.passwordResetCodeExpiresAt ||
      user.passwordResetCodeExpiresAt < new Date()
    ) {
      throw new UnauthorizedException('Código inválido ou expirado.');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    await this.usersService.update(user.id, {
      passwordHash,
      isEmailVerified: true,
      passwordResetCode: null,
      passwordResetCodeExpiresAt: null,
    });

    return { message: 'Senha redefinida com sucesso.' };
  }

  async googleAuth(dto: GoogleAuthDto) {
    const ticket = await this.googleClient.verifyIdToken({
      idToken: dto.idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload?.email) {
      throw new UnauthorizedException('Token do Google inválido.');
    }

    let user = await this.usersService.findByEmail(payload.email);

    if (user) {
      if (!user.googleId || !user.isEmailVerified) {
        user = await this.usersService.update(user.id, {
          googleId: user.googleId ?? payload.sub,
          isEmailVerified: true,
        });
      }
    } else {
      user = await this.usersService.create({
        email: payload.email,
        name: payload.name || payload.email.split('@')[0],
        googleId: payload.sub,
        isEmailVerified: true,
        currentBalance: 0,
      });
    }

    return this.buildAuthResponse(user);
  }

  private async buildAuthResponse(user: User) {
    const payload = { sub: user.id, email: user.email };
    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  private generateCode(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
  }
}
