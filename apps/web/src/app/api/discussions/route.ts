import { connection, type NextRequest } from 'next/server';

import { getDiscussions } from '@/features/discussions/data';
import { discussionQuerySchema } from '@/features/discussions/schemas';
import { toErrorResponse } from '@/lib/api/errors';

/** Public list read for client-side refetches (filter changes). Same DAL as the page. */
export async function GET(request: NextRequest): Promise<Response> {
  // Request-time by nature: the build must not try to prerender this handler.
  await connection();
  try {
    const { locale, ...filters } = discussionQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    const page = await getDiscussions(filters, locale);
    return Response.json(page, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return toErrorResponse(error);
  }
}
