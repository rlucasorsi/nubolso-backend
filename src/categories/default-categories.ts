import { TransactionType } from '@prisma/client';

// Categorias padrão criadas automaticamente para todo novo usuário.
// Mantenha em sincronia com o backfill/tipos em prisma/migrations
// (20260704000002_categories_global_defaults e 20260704000003_category_type).
// "Outros" é protegida: não pode ser editada nem excluída (ver CategoriesService).
export const DEFAULT_CATEGORIES: {
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
}[] = [
  { name: 'Salário', type: 'INCOME', color: '#22c55e', icon: 'Wallet' },
  { name: 'Água', type: 'EXPENSE', color: '#38bdf8', icon: 'Droplet' },
  { name: 'Luz', type: 'EXPENSE', color: '#f59e0b', icon: 'Zap' },
  { name: 'Celular', type: 'EXPENSE', color: '#a855f7', icon: 'Smartphone' },
  { name: 'Internet', type: 'EXPENSE', color: '#3b82f6', icon: 'Wifi' },
  { name: 'Condomínio', type: 'EXPENSE', color: '#f97316', icon: 'Building2' },
  { name: 'IPTU', type: 'EXPENSE', color: '#ef4444', icon: 'Landmark' },
  { name: 'Outros', type: 'EXPENSE', color: '#94a3b8', icon: 'Tag' },
];

export const PROTECTED_CATEGORY_NAME = 'Outros';
