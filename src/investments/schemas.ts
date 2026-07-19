import { z } from 'zod';

const isoDate = z
  .string()
  .refine((s) => !isNaN(Date.parse(s)), { message: 'Data inválida' });

export const investmentTypeEnum = z.enum([
  'CDB',
  'FII',
  'STOCK',
  'ETF',
  'OTHER',
]);
export const investmentMovementTypeEnum = z.enum([
  'CONTRIBUTION',
  'YIELD',
  'ADJUSTMENT',
]);

export const createInvestmentSchema = z
  .object({
    name: z.string().min(1, 'Nome é obrigatório'),
    type: investmentTypeEnum,
    ticker: z.string().trim().toUpperCase().min(1).optional(),
    cdiPercentage: z.number().positive().optional(),
    institution: z.string().trim().min(1, 'Banco/Corretora é obrigatório'),
    currentBalance: z.number().min(0).optional(),
  })
  .superRefine((data, ctx) => {
    if (
      (data.type === 'FII' || data.type === 'STOCK' || data.type === 'ETF') &&
      !data.ticker
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['ticker'],
        message: 'Ticker é obrigatório para FIIs, ações e ETFs',
      });
    }
  });

// type não é editável após a criação (invalidaria a obrigatoriedade de ticker
// retroativamente) — só name, ticker, cdiPercentage e institution.
export const updateInvestmentSchema = z.object({
  name: z.string().min(1).optional(),
  ticker: z.string().trim().toUpperCase().min(1).optional(),
  cdiPercentage: z.number().positive().optional(),
  institution: z.string().trim().min(1).optional(),
});

export const createInvestmentMovementSchema = z
  .object({
    type: investmentMovementTypeEnum,
    amount: z
      .number()
      .refine((n) => n !== 0, { message: 'Valor não pode ser zero' }),
    date: isoDate.optional(),
    description: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'YIELD' && data.amount < 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['amount'],
        message: 'Provento/dividendo deve ser positivo',
      });
    }
  });

export const listInvestmentMovementsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
});

export const investmentQuoteQuerySchema = z.object({
  ticker: z.string().trim().min(1, 'Ticker é obrigatório'),
});

export const investmentTickerSearchQuerySchema = z.object({
  q: z.string().trim().min(1, 'Termo de busca é obrigatório'),
});

export type CreateInvestmentDto = z.infer<typeof createInvestmentSchema>;
export type UpdateInvestmentDto = z.infer<typeof updateInvestmentSchema>;
export type CreateInvestmentMovementDto = z.infer<
  typeof createInvestmentMovementSchema
>;
export type ListInvestmentMovementsQueryDto = z.infer<
  typeof listInvestmentMovementsQuerySchema
>;
export type InvestmentQuoteQueryDto = z.infer<
  typeof investmentQuoteQuerySchema
>;
export type InvestmentTickerSearchQueryDto = z.infer<
  typeof investmentTickerSearchQuerySchema
>;
