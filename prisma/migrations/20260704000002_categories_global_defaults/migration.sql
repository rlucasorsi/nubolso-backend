-- Categorias passam a ser globais (sem vínculo com o tipo do lançamento).
ALTER TABLE "Category" DROP COLUMN "type";

-- Novos atributos de categoria.
ALTER TABLE "Category" ADD COLUMN "icon" TEXT;
ALTER TABLE "Category" ADD COLUMN "isDefault" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Category" ADD COLUMN "includeInBalanceBase" BOOLEAN NOT NULL DEFAULT true;

-- Backfill: cria as categorias padrão para todo usuário que ainda não as tenha (por nome).
-- O RLS é desabilitado momentaneamente porque o INSERT cruza vários usuários e não há
-- app.current_user_id definido no contexto da migração (rodada via DIRECT_URL).
ALTER TABLE "Category" DISABLE ROW LEVEL SECURITY;

INSERT INTO "Category" ("id", "name", "color", "icon", "isDefault", "includeInBalanceBase", "userId")
SELECT gen_random_uuid(), d.name, d.color, d.icon, true, true, u.id
FROM "User" u
CROSS JOIN (VALUES
  ('Salário',    '#22c55e', 'Wallet'),
  ('Água',       '#38bdf8', 'Droplet'),
  ('Luz',        '#f59e0b', 'Zap'),
  ('Celular',    '#a855f7', 'Smartphone'),
  ('Internet',   '#3b82f6', 'Wifi'),
  ('Condomínio', '#f97316', 'Building2'),
  ('IPTU',       '#ef4444', 'Landmark'),
  ('Outros',     '#94a3b8', 'Tag')
) AS d(name, color, icon)
WHERE NOT EXISTS (
  SELECT 1 FROM "Category" c WHERE c."userId" = u.id AND c."name" = d.name
);

-- Restaura o RLS (ENABLE + FORCE, como definido em 20260701000001_add_rls_policies).
ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Category" FORCE ROW LEVEL SECURITY;
