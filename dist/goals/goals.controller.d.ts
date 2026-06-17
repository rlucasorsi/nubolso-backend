import { GoalsService } from './goals.service';
import type { JwtUser } from '../auth/jwt-payload.type';
import type { CreateGoalDto } from './dto/create-goal.dto';
import type { UpdateGoalDto } from './dto/update-goal.dto';
import type { CreateContributionDto } from './dto/create-contribution.dto';
import type { ListContributionsQueryDto } from './dto/list-contributions-query.dto';
export declare class GoalsController {
    private readonly goalsService;
    constructor(goalsService: GoalsService);
    findAll(user: JwtUser): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        description: string;
        userId: string;
        color: string;
        icon: string;
        targetAmount: number;
        savedAmount: number;
        deadline: Date;
    }[]>;
    create(user: JwtUser, data: CreateGoalDto): Promise<{
        contributions: {
            id: string;
            createdAt: Date;
            description: string;
            amount: number;
            date: Date;
            goalId: string;
        }[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        description: string;
        userId: string;
        color: string;
        icon: string;
        targetAmount: number;
        savedAmount: number;
        deadline: Date;
    }>;
    update(user: JwtUser, id: string, data: UpdateGoalDto): Promise<{
        contributions: {
            id: string;
            createdAt: Date;
            description: string;
            amount: number;
            date: Date;
            goalId: string;
        }[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        description: string;
        userId: string;
        color: string;
        icon: string;
        targetAmount: number;
        savedAmount: number;
        deadline: Date;
    }>;
    remove(user: JwtUser, id: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        description: string;
        userId: string;
        color: string;
        icon: string;
        targetAmount: number;
        savedAmount: number;
        deadline: Date;
    }>;
    addContribution(user: JwtUser, id: string, data: CreateContributionDto): Promise<{
        contributions: {
            id: string;
            createdAt: Date;
            description: string;
            amount: number;
            date: Date;
            goalId: string;
        }[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        description: string;
        userId: string;
        color: string;
        icon: string;
        targetAmount: number;
        savedAmount: number;
        deadline: Date;
    }>;
    listContributions(user: JwtUser, id: string, query: ListContributionsQueryDto): Promise<{
        data: {
            id: string;
            createdAt: Date;
            description: string;
            amount: number;
            date: Date;
            goalId: string;
        }[];
        page: number;
        limit: number;
        total: number;
        hasMore: boolean;
    }>;
}
