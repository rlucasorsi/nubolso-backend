-- AlterTable
ALTER TABLE "CreditCardPurchase" ADD COLUMN     "categoryId" TEXT;

-- CreateIndex
CREATE INDEX "CreditCardPurchase_categoryId_idx" ON "CreditCardPurchase"("categoryId");

-- AddForeignKey
ALTER TABLE "CreditCardPurchase" ADD CONSTRAINT "CreditCardPurchase_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
