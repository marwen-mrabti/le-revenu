import { z } from 'zod';

/**
 * Shapes shared by every Strapi response. Feature DTOs build on these and
 * describe exactly what the forced populates return (ADR-0005).
 */

export const paginationSchema = z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  pageCount: z.number().int().min(0),
  total: z.number().int().min(0),
});
export type Pagination = z.infer<typeof paginationSchema>;

export const strapiList = <T extends z.ZodType>(item: T) =>
  z.object({ data: z.array(item), meta: z.object({ pagination: paginationSchema }) });

export const strapiOne = <T extends z.ZodType>(item: T) => z.object({ data: item });

export const strapiErrorSchema = z.object({
  error: z.object({
    status: z.number(),
    name: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

/** The only shape of a user the API ever exposes to readers. */
export const publicUserSchema = z.object({
  documentId: z.string(),
  username: z.string(),
  displayName: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
});
export type PublicUser = z.infer<typeof publicUserSchema>;
