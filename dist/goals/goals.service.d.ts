import { PrismaService } from '../prisma/prisma.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { CreateContributionDto } from './dto/create-contribution.dto';
export declare class GoalsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(userId: string): Promise<{
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
    create(userId: string, data: CreateGoalDto): Promise<{
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
    update(userId: string, id: string, data: UpdateGoalDto): Promise<{
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
    remove(userId: string, id: string): Promise<{
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
    addContribution(userId: string, id: string, data: CreateContributionDto): Promise<{
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
    listContributions(userId: string, id: string, page: number, limit: number): Promise<{
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
    private findOne;
}
