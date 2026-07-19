-- CreateEnum
CREATE TYPE "InvestmentType" AS ENUM ('CDB', 'FII', 'STOCK', 'OTHER');
CREATE TYPE "InvestmentMovementType" AS ENUM ('CONTRIBUTION', 'YIELD', 'ADJUSTMENT');

-- CreateTable
CREATE TABLE "Investment" (
    "id"             TEXT NOT NULL,
    "name"           TEXT NOT NULL,
    "type"           "InvestmentType" NOT NULL,
    "ticker"         TEXT,
    "currentBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "userId"         TEXT NOT NULL,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Investment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestmentMovement" (
    "id"           TEXT NOT NULL,
    "amount"       DOUBLE PRECISION NOT NULL,
    "description"  TEXT NOT NULL,
    "date"         TIMESTAMP(3) NOT NULL,
    "type"         "InvestmentMovementType" NOT NULL,
    "investmentId" TEXT NOT NULL,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvestmentMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Investment_userId_idx" ON "Investment"("userId");
CREATE INDEX "InvestmentMovement_investmentId_idx" ON "InvestmentMovement"("investmentId");

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "InvestmentMovement" ADD CONSTRAINT "InvestmentMovement_investmentId_fkey"
  FOREIGN KEY ("investmentId") REFERENCES "Investment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Row-level security. Investment tem userId direto e recebe policy própria,
-- mesma isolação das demais tabelas (ver 20260701000001_add_rls_policies).
-- InvestmentMovement não tem userId próprio e não recebe policy própria -
-- fica protegida transitivamente via investmentId -> Investment.userId,
-- mesmo padrão de GoalContribution (não isolada diretamente, só acessível
-- através de queries que já filtram pelo Investment do usuário).
ALTER TABLE "Investment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Investment" FORCE ROW LEVEL SECURITY;

CREATE POLICY user_isolation ON "Investment"
  FOR ALL
  USING ("userId" = current_setting('app.current_user_id', true))
  WITH CHECK ("userId" = current_setting('app.current_user_id', true));
