-- CreateEnum
CREATE TYPE "ImportBatchStatus" AS ENUM ('PENDING_REVIEW', 'CONFIRMED', 'CANCELED', 'ROLLED_BACK');

-- CreateEnum
CREATE TYPE "ImportItemStatus" AS ENUM ('NEW', 'DUPLICATE_EXACT', 'POSSIBLE_DUPLICATE');

-- CreateEnum
CREATE TYPE "ImportItemDecision" AS ENUM ('IMPORT', 'SKIP');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "ofxAcctId" TEXT,
ADD COLUMN     "ofxBankId" TEXT;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "fitId" TEXT,
ADD COLUMN     "importBatchId" TEXT;

-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "bankId" TEXT,
    "acctId" TEXT,
    "status" "ImportBatchStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "totalCount" INTEGER NOT NULL DEFAULT 0,
    "newCount" INTEGER NOT NULL DEFAULT 0,
    "duplicateExactCount" INTEGER NOT NULL DEFAULT 0,
    "possibleDuplicateCount" INTEGER NOT NULL DEFAULT 0,
    "importedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "ImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportBatchItem" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "fitId" TEXT,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "TransactionType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "ImportItemStatus" NOT NULL,
    "matchedTransactionId" TEXT,
    "similarityScore" DOUBLE PRECISION,
    "decision" "ImportItemDecision",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportBatchItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ImportBatch_userId_idx" ON "ImportBatch"("userId");

-- CreateIndex
CREATE INDEX "ImportBatchItem_batchId_idx" ON "ImportBatchItem"("batchId");

-- CreateIndex
CREATE INDEX "Transaction_importBatchId_idx" ON "Transaction"("importBatchId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_userId_fitId_key" ON "Transaction"("userId", "fitId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatchItem" ADD CONSTRAINT "ImportBatchItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

