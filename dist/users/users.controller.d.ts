import { UsersService } from './users.service';
import type { JwtUser } from '../auth/jwt-payload.type';
import type { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getMe(user: JwtUser): Promise<{
        name: string;
        id: string;
        email: string;
        googleId: string | null;
        isEmailVerified: boolean;
        verificationCode: string | null;
        verificationCodeExpiresAt: Date | null;
        verificationAttempts: number;
        passwordResetCode: string | null;
        passwordResetCodeExpiresAt: Date | null;
        currentBalance: number;
        balanceStartDate: Date | null;
        greenThreshold: number;
        yellowThreshold: number;
        createdAt: Date;
    }>;
    updateMe(user: JwtUser, data: UpdateUserDto): Promise<{
        name: string;
        id: string;
        email: string;
        googleId: string | null;
        isEmailVerified: boolean;
        verificationCode: string | null;
        verificationCodeExpiresAt: Date | null;
        verificationAttempts: number;
        passwordResetCode: string | null;
        passwordResetCodeExpiresAt: Date | null;
        currentBalance: number;
        balanceStartDate: Date | null;
        greenThreshold: number;
        yellowThreshold: number;
        createdAt: Date;
    }>;
}
