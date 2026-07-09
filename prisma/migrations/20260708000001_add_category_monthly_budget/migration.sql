-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "monthlyBudget" DOUBLE PRECISION;

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'BUDGET_WARNING';
