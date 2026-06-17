import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { CategoriesModule } from './categories/categories.module';
import { TransactionsModule } from './transactions/transactions.module';
import { RecurringTemplatesModule } from './recurring-templates/recurring-templates.module';
import { GoalsModule } from './goals/goals.module';
import { CreditCardsModule } from './credit-cards/credit-cards.module';

@Module({
  imports: [
    ConfigModule.forRoot({ 
      isGlobal: true,
      envFilePath: '.env', // No backend, it will be relative to where it runs
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    TransactionsModule,
    RecurringTemplatesModule,
    GoalsModule,
    CreditCardsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
