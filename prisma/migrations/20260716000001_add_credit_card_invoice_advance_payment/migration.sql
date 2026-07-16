-- CreateTable
CREATE TABLE "CreditCardInvoiceAdvancePayment" (
    "id"            TEXT NOT NULL,
    "invoiceId"     TEXT NOT NULL,
    "userId"        TEXT NOT NULL,
    "amount"        DOUBLE PRECISION NOT NULL,
    "paymentDate"   TIMESTAMP(3) NOT NULL,
    "transactionId" TEXT NOT NULL,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditCardInvoiceAdvancePayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CreditCardInvoiceAdvancePayment_transactionId_key" ON "CreditCardInvoiceAdvancePayment"("transactionId");
CREATE INDEX "CreditCardInvoiceAdvancePayment_invoiceId_idx" ON "CreditCardInvoiceAdvancePayment"("invoiceId");
CREATE INDEX "CreditCardInvoiceAdvancePayment_userId_idx" ON "CreditCardInvoiceAdvancePayment"("userId");

-- AddForeignKey
ALTER TABLE "CreditCardInvoiceAdvancePayment" ADD CONSTRAINT "CreditCardInvoiceAdvancePayment_invoiceId_fkey"
  FOREIGN KEY ("invoiceId") REFERENCES "CreditCardInvoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CreditCardInvoiceAdvancePayment" ADD CONSTRAINT "CreditCardInvoiceAdvancePayment_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CreditCardInvoiceAdvancePayment" ADD CONSTRAINT "CreditCardInvoiceAdvancePayment_transactionId_fkey"
  FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Row-level security, same isolation policy as sibling credit-card tables
-- (see 20260701000001_add_rls_policies).
ALTER TABLE "CreditCardInvoiceAdvancePayment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CreditCardInvoiceAdvancePayment" FORCE ROW LEVEL SECURITY;

CREATE POLICY user_isolation ON "CreditCardInvoiceAdvancePayment"
  FOR ALL
  USING ("userId" = current_setting('app.current_user_id', true))
  WITH CHECK ("userId" = current_setting('app.current_user_id', true));
