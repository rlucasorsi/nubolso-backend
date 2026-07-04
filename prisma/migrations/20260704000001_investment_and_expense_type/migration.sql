-- Renomeia o valor do enum SPENDING -> INVESTMENT.
-- RENAME VALUE preserva todas as linhas existentes (o valor é o mesmo, só muda o
-- rótulo), então funciona como backfill: todo registro SPENDING passa a INVESTMENT.
ALTER TYPE "TransactionType" RENAME VALUE 'SPENDING' TO 'INVESTMENT';

-- Classificação de despesas (fixa/variavel). Nullable: só se aplica a EXPENSE.
CREATE TYPE "ExpenseType" AS ENUM ('fixa', 'variavel');

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "tipoDespesa" "ExpenseType";
