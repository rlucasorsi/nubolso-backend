-- CreateEnum
CREATE TYPE "BudgetDirection" AS ENUM ('LIMIT', 'GOAL');

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "budgetDirection" "BudgetDirection" NOT NULL DEFAULT 'LIMIT';
