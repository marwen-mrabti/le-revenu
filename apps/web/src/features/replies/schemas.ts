import { z } from 'zod';

import { replyItemSchema } from '@/features/discussions/schemas';

export const REPLY_MIN = 2;
export const REPLY_MAX = 5000;

/** What the reader types; Strapi enforces the same lengths on its side (schema.json). */
export const replyInputSchema = z.object({
  content: z.string().trim().min(REPLY_MIN, 'replyMin').max(REPLY_MAX, 'replyMax'),
  discussion: z.string().min(1).max(64),
});
export type ReplyInput = z.infer<typeof replyInputSchema>;

/** `POST /api/replies` answers the created reply, as the detail populate shapes it. */
export const replyEnvelopeSchema = z.object({ reply: replyItemSchema });

/** Editing keeps the same content rules; the discussion id names the cache entry to expire. */
export const replyEditSchema = replyInputSchema;
export type ReplyEditInput = z.infer<typeof replyEditSchema>;
