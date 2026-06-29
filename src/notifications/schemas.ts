import { z } from 'zod';

export const subscribePushSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export const unsubscribePushSchema = z.object({
  endpoint: z.string().url(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type SubscribePushDto = z.infer<typeof subscribePushSchema>;
export type UnsubscribePushDto = z.infer<typeof unsubscribePushSchema>;
export type PaginationDto = z.infer<typeof paginationSchema>;
