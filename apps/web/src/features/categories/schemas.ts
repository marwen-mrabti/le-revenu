import { z } from 'zod';

/** A category as the public API returns it (branch 02 presenter: no numeric id). */
export const categorySchema = z.object({
  documentId: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  color: z.string().nullable().optional(),
  locale: z.string(),
});
export type Category = z.infer<typeof categorySchema>;
