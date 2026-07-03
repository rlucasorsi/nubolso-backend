-- AlterTable: link recurring templates to a credit card
ALTER TABLE "RecurringTemplate" ADD COLUMN "creditCardId" TEXT;

-- AlterTable: track which template materialized a purchase
ALTER TABLE "CreditCardPurchase" ADD COLUMN "templateId" TEXT;

-- CreateIndex
CREATE INDEX "RecurringTemplate_creditCardId_idx" ON "RecurringTemplate"("creditCardId");
CREATE INDEX "CreditCardPurchase_templateId_idx" ON "CreditCardPurchase"("templateId");

-- CreateIndex: dedupe realize per occurrence (mirrors Transaction @@unique([templateId, date]))
CREATE UNIQUE INDEX "CreditCardPurchase_templateId_purchaseDate_key" ON "CreditCardPurchase"("templateId", "purchaseDate");

-- AddForeignKey
ALTER TABLE "RecurringTemplate" ADD CONSTRAINT "RecurringTemplate_creditCardId_fkey"
  FOREIGN KEY ("creditCardId") REFERENCES "CreditCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CreditCardPurchase" ADD CONSTRAINT "CreditCardPurchase_templateId_fkey"
  FOREIGN KEY ("templateId") REFERENCES "RecurringTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
