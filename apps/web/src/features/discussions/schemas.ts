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

/** One reply as the detail populate returns it: content, dates and a reduced author. */
export const replyItemSchema = z.object({
  documentId: z.string(),
  content: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  author: publicUserSchema.nullable(),
});
export type ReplyItem = z.infer<typeof replyItemSchema>;

/** `GET /discussions/slug/:slug`: the list item plus its replies in chronological order. */
export const discussionDetailSchema = discussionListItemSchema
  .omit({ replies: true })
  .extend({ replies: z.array(replyItemSchema) });
export type DiscussionDetail = z.infer<typeof discussionDetailSchema>;

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

export const TITLE_MIN = 10;
export const TITLE_MAX = 150;
export const CONTENT_MAX = 20000;
export const DISCUSSION_TYPES = ['question', 'discussion'] as const;
export type DiscussionType = (typeof DISCUSSION_TYPES)[number];

/**
 * What a reader writes, to create or to edit: the brief's rules (title ≥ 10,
 * content required, a space, a type). Strapi applies the same rules on its side.
 */
export const discussionInputSchema = z.object({
  type: z.enum(DISCUSSION_TYPES),
  title: z.string().trim().min(TITLE_MIN, 'titleMin').max(TITLE_MAX, 'titleMax'),
  content: z.string().trim().min(1, 'required').max(CONTENT_MAX, 'contentMax'),
  category: z.string().min(1, 'categoryRequired').max(64),
});
export type DiscussionInput = z.infer<typeof discussionInputSchema>;
export const discussionEditSchema = discussionInputSchema;
export type DiscussionEditInput = DiscussionInput;

export const discussionEnvelopeSchema = z.object({ discussion: discussionListItemSchema });
