import { z } from 'zod';

export const confirmImportSchema = z.object({
  decisions: z
    .array(
      z.object({
        itemId: z.string().uuid('itemId inválido'),
        action: z.enum(['IMPORT', 'SKIP']),
      }),
    )
    .default([]),
});

export type ConfirmImportDto = z.infer<typeof confirmImportSchema>;
