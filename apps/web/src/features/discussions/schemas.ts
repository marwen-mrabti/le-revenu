import { z } from 'zod';

import { routing } from '@/i18n/routing';
import { paginationSchema, publicUserSchema } from '@/lib/strapi/schemas';

/** Exactly what `GET /api/discussions` returns per item (branch 02 presenter, list populate). */
export const discussionListItemSchema = z.object({
  documentId: z.string(),
  title: z.string(),
  slug: z.string(),
  content: z.string(),
  type: z.enum(['question', 'discussion']),
  createdAt: z.string(),
  updatedAt: z.string(),
  author: publicUserSchema.nullable(),
  category: z
    .object({
      documentId: z.string(),
      name: z.string(),
      slug: z.string(),
      color: z.string().nullable().optional(),
    })
    .nullable(),
  replies: z.object({ count: z.number().int().min(0) }),
});
export type DiscussionListItem = z.infer<typeof discussionListItemSchema>;

/** What the DAL and the BFF hand to the list component. */
export const discussionPageSchema = z.object({
  items: z.array(discussionListItemSchema),
  pagination: paginationSchema,
});
export type DiscussionPage = z.infer<typeof discussionPageSchema>;

export const SORTS = ['newest', 'oldest'] as const;
export type Sort = (typeof SORTS)[number];

const optionalText = z
  .string()
  .trim()
  .max(80)
  .optional()
  .transform((value) => value || undefined);

/** List filters, strict: the BFF answers 422 on anything else. The page clamps before parsing. */
export const discussionFiltersSchema = z.object({
  category: optionalText,
  sort: z.enum(SORTS).default('newest'),
  q: optionalText,
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});
export type DiscussionFilters = z.infer<typeof discussionFiltersSchema>;

/** The BFF also needs the page language to localise category names. */
export const discussionQuerySchema = discussionFiltersSchema.extend({
  locale: z.enum(routing.locales).default(routing.defaultLocale),
});
