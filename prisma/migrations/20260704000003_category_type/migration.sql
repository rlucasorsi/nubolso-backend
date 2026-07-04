-- Categorias voltam a ter um tipo (Receita/Despesa/Investimento).
-- Adiciona a coluna com default temporário para preencher as linhas existentes.
ALTER TABLE "Category" ADD COLUMN "type" "TransactionType" NOT NULL DEFAULT 'EXPENSE';

-- Ajusta o tipo das categorias padrão já semeadas. O UPDATE cruza vários usuários e
-- não há app.current_user_id no contexto da migração, então o RLS é desabilitado
-- momentaneamente (senão o USING da policy zera as linhas afetadas).
ALTER TABLE "Category" DISABLE ROW LEVEL SECURITY;

UPDATE "Category" SET "type" = 'INCOME'
WHERE "isDefault" = true AND "name" = 'Salário';

ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Category" FORCE ROW LEVEL SECURITY;

-- Remove o default: a partir de agora o tipo é sempre informado pela aplicação.
ALTER TABLE "Category" ALTER COLUMN "type" DROP DEFAULT;
