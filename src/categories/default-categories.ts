// Categorias padrão criadas automaticamente para todo novo usuário.
// Mantenha em sincronia com o backfill em
// prisma/migrations/20260704000002_categories_global_defaults/migration.sql.
// "Outros" é protegida: não pode ser editada nem excluída (ver CategoriesService).
export const DEFAULT_CATEGORIES: {
  name: string;
  color: string;
  icon: string;
}[] = [
  { name: 'Salário', color: '#22c55e', icon: 'Wallet' },
  { name: 'Água', color: '#38bdf8', icon: 'Droplet' },
  { name: 'Luz', color: '#f59e0b', icon: 'Zap' },
  { name: 'Celular', color: '#a855f7', icon: 'Smartphone' },
  { name: 'Internet', color: '#3b82f6', icon: 'Wifi' },
  { name: 'Condomínio', color: '#f97316', icon: 'Building2' },
  { name: 'IPTU', color: '#ef4444', icon: 'Landmark' },
  { name: 'Outros', color: '#94a3b8', icon: 'Tag' },
];

export const PROTECTED_CATEGORY_NAME = 'Outros';
