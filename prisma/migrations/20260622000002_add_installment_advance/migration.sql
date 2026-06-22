-- AlterTable: add anticipation fields to installments
ALTER TABLE "CreditCardInstallment"
  ADD COLUMN "isAnticipated" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "advanceId" TEXT;

-- CreateTable: InstallmentAdvance
CREATE TABLE "InstallmentAdvance" (
    "id"                TEXT NOT NULL,
    "purchaseId"        TEXT NOT NULL,
    "invoiceId"         TEXT NOT NULL,
    "userId"            TEXT NOT NULL,
    "installmentsCount" INTEGER NOT NULL,
    "originalAmount"    DOUBLE PRECISION NOT NULL,
    "paidAmount"        DOUBLE PRECISION NOT NULL,
    "discount"          DOUBLE PRECISION NOT NULL,
    "anticipatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstallmentAdvance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InstallmentAdvance_purchaseId_idx" ON "InstallmentAdvance"("purchaseId");
CREATE INDEX "InstallmentAdvance_invoiceId_idx" ON "InstallmentAdvance"("invoiceId");
CREATE INDEX "InstallmentAdvance_userId_idx" ON "InstallmentAdvance"("userId");
CREATE INDEX "CreditCardInstallment_advanceId_idx" ON "CreditCardInstallment"("advanceId");

-- AddForeignKey
ALTER TABLE "InstallmentAdvance" ADD CONSTRAINT "InstallmentAdvance_purchaseId_fkey"
  FOREIGN KEY ("purchaseId") REFERENCES "CreditCardPurchase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "InstallmentAdvance" ADD CONSTRAINT "InstallmentAdvance_invoiceId_fkey"
  FOREIGN KEY ("invoiceId") REFERENCES "CreditCardInvoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "InstallmentAdvance" ADD CONSTRAINT "InstallmentAdvance_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CreditCardInstallment" ADD CONSTRAINT "CreditCardInstallment_advanceId_fkey"
  FOREIGN KEY ("advanceId") REFERENCES "InstallmentAdvance"("id") ON DELETE SET NULL ON UPDATE CASCADE;
