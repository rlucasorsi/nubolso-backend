-- Enable Row Level Security on all user-scoped tables.
-- The application enforces this via PrismaService.withUser(), which opens an
-- interactive transaction and runs:
--   SET LOCAL app.current_user_id = '<userId>'
-- before any data operation. SET LOCAL reverts automatically on transaction end.
--
-- FORCE ROW LEVEL SECURITY ensures policies apply even when the connecting role
-- is the table owner (default PostgreSQL behaviour bypasses RLS for owners).
--
-- Deploy order: apply application code that uses withUser() FIRST, then run
-- this migration. Running the migration before the code update will cause all
-- data queries to return empty rows (current_setting returns NULL → no match).
--
-- Child tables without a direct userId column (GoalContribution,
-- CreditCardInstallment, ImportBatchItem) are protected transitively through
-- their parent tables, which do have RLS enabled.

-- Transaction
ALTER TABLE "Transaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Transaction" FORCE ROW LEVEL SECURITY;

CREATE POLICY user_isolation ON "Transaction"
  FOR ALL
  USING ("userId" = current_setting('app.current_user_id', true))
  WITH CHECK ("userId" = current_setting('app.current_user_id', true));

-- RecurringTemplate
ALTER TABLE "RecurringTemplate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RecurringTemplate" FORCE ROW LEVEL SECURITY;

CREATE POLICY user_isolation ON "RecurringTemplate"
  FOR ALL
  USING ("userId" = current_setting('app.current_user_id', true))
  WITH CHECK ("userId" = current_setting('app.current_user_id', true));

-- Category
ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Category" FORCE ROW LEVEL SECURITY;

CREATE POLICY user_isolation ON "Category"
  FOR ALL
  USING ("userId" = current_setting('app.current_user_id', true))
  WITH CHECK ("userId" = current_setting('app.current_user_id', true));

-- Goal
ALTER TABLE "Goal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Goal" FORCE ROW LEVEL SECURITY;

CREATE POLICY user_isolation ON "Goal"
  FOR ALL
  USING ("userId" = current_setting('app.current_user_id', true))
  WITH CHECK ("userId" = current_setting('app.current_user_id', true));

-- CreditCard
ALTER TABLE "CreditCard" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CreditCard" FORCE ROW LEVEL SECURITY;

CREATE POLICY user_isolation ON "CreditCard"
  FOR ALL
  USING ("userId" = current_setting('app.current_user_id', true))
  WITH CHECK ("userId" = current_setting('app.current_user_id', true));

-- CreditCardPurchase
ALTER TABLE "CreditCardPurchase" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CreditCardPurchase" FORCE ROW LEVEL SECURITY;

CREATE POLICY user_isolation ON "CreditCardPurchase"
  FOR ALL
  USING ("userId" = current_setting('app.current_user_id', true))
  WITH CHECK ("userId" = current_setting('app.current_user_id', true));

-- CreditCardInvoice
ALTER TABLE "CreditCardInvoice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CreditCardInvoice" FORCE ROW LEVEL SECURITY;

CREATE POLICY user_isolation ON "CreditCardInvoice"
  FOR ALL
  USING ("userId" = current_setting('app.current_user_id', true))
  WITH CHECK ("userId" = current_setting('app.current_user_id', true));

-- InstallmentAdvance
ALTER TABLE "InstallmentAdvance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InstallmentAdvance" FORCE ROW LEVEL SECURITY;

CREATE POLICY user_isolation ON "InstallmentAdvance"
  FOR ALL
  USING ("userId" = current_setting('app.current_user_id', true))
  WITH CHECK ("userId" = current_setting('app.current_user_id', true));

-- ImportBatch
ALTER TABLE "ImportBatch" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ImportBatch" FORCE ROW LEVEL SECURITY;

CREATE POLICY user_isolation ON "ImportBatch"
  FOR ALL
  USING ("userId" = current_setting('app.current_user_id', true))
  WITH CHECK ("userId" = current_setting('app.current_user_id', true));
