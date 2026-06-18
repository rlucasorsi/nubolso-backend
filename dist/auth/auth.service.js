"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const google_auth_library_1 = require("google-auth-library");
const users_service_1 = require("../users/users.service");
const mailer_service_1 = require("../mailer/mailer.service");
const bcrypt = __importStar(require("bcrypt"));
const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_VERIFICATION_ATTEMPTS = 5;
let AuthService = class AuthService {
    usersService;
    jwtService;
    mailerService;
    googleClient = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    constructor(usersService, jwtService, mailerService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.mailerService = mailerService;
    }
    async register(registerDto) {
        const existingUser = await this.usersService.findByEmail(registerDto.email);
        if (existingUser) {
            throw new common_1.ConflictException('Email already registered');
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
    async login(loginDto) {
        const user = await this.usersService.findByEmail(loginDto.email);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (!user.passwordHash) {
            throw new common_1.UnauthorizedException('Esta conta usa login com Google. Use o botão "Continuar com Google".');
        }
        const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (!user.isEmailVerified) {
            throw new common_1.ForbiddenException({
                errorCode: 'EMAIL_NOT_VERIFIED',
                message: 'Confirme seu e-mail para continuar.',
            });
        }
        return this.buildAuthResponse(user);
    }
    async verifyEmail(dto) {
        const user = await this.usersService.findByEmail(dto.email);
        if (!user) {
            throw new common_1.UnauthorizedException('Código inválido ou expirado.');
        }
        if (user.isEmailVerified) {
            return this.buildAuthResponse(user);
        }
        if (user.verificationAttempts >= MAX_VERIFICATION_ATTEMPTS) {
            throw new common_1.ForbiddenException({
                errorCode: 'TOO_MANY_ATTEMPTS',
                message: 'Muitas tentativas. Solicite um novo código.',
            });
        }
        const isCodeValid = !!user.verificationCode &&
            user.verificationCode === dto.code &&
            !!user.verificationCodeExpiresAt &&
            user.verificationCodeExpiresAt > new Date();
        if (!isCodeValid) {
            await this.usersService.update(user.id, {
                verificationAttempts: user.verificationAttempts + 1,
            });
            throw new common_1.UnauthorizedException('Código inválido ou expirado.');
        }
        const updatedUser = await this.usersService.update(user.id, {
            isEmailVerified: true,
            verificationCode: null,
            verificationCodeExpiresAt: null,
            verificationAttempts: 0,
        });
        return this.buildAuthResponse(updatedUser);
    }
    async resendVerificationCode(dto) {
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
                await this.mailerService.sendVerificationCode(user.email, user.name, code);
            }
        }
        return {
            message: 'Se o e-mail existir e ainda não tiver sido confirmado, enviamos um novo código.',
        };
    }
    async forgotPassword(dto) {
        const user = await this.usersService.findByEmail(dto.email);
        if (user) {
            const code = this.generateCode();
            await this.usersService.update(user.id, {
                passwordResetCode: code,
                passwordResetCodeExpiresAt: new Date(Date.now() + CODE_TTL_MS),
            });
            await this.mailerService.sendPasswordResetCode(user.email, user.name, code);
        }
        return {
            message: 'Se o e-mail existir em nossa base, enviaremos um código de redefinição.',
        };
    }
    async resetPassword(dto) {
        const user = await this.usersService.findByEmail(dto.email);
        if (!user ||
            !user.passwordResetCode ||
            user.passwordResetCode !== dto.code ||
            !user.passwordResetCodeExpiresAt ||
            user.passwordResetCodeExpiresAt < new Date()) {
            throw new common_1.UnauthorizedException('Código inválido ou expirado.');
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
    async googleAuth(dto) {
        const ticket = await this.googleClient.verifyIdToken({
            idToken: dto.idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload?.email) {
            throw new common_1.UnauthorizedException('Token do Google inválido.');
        }
        let user = await this.usersService.findByEmail(payload.email);
        if (user) {
            if (!user.googleId || !user.isEmailVerified) {
                user = await this.usersService.update(user.id, {
                    googleId: user.googleId ?? payload.sub,
                    isEmailVerified: true,
                });
            }
        }
        else {
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
    async buildAuthResponse(user) {
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
    generateCode() {
        return String(Math.floor(100000 + Math.random() * 900000));
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        mailer_service_1.MailerService])
], AuthService);
//# sourceMappingURL=auth.service.js.map