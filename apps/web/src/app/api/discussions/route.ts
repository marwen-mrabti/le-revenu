import { connection, type NextRequest } from 'next/server';

import { getDiscussions } from '@/features/discussions/data';
import {
  discussionInputSchema,
  discussionListItemSchema,
  discussionQuerySchema,
} from '@/features/discussions/schemas';
import { BffError, toErrorResponse } from '@/lib/api/errors';
import { assertJson, assertSameOrigin } from '@/lib/api/guards';
import { mapWriteError } from '@/lib/api/write-errors';
import { readSessionFrom } from '@/lib/auth/session';
import { strapiAuth } from '@/lib/strapi/private';
import { strapiOne } from '@/lib/strapi/schemas';

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

/**
 * Creates a discussion for the session's reader. Strapi forces the author,
 * makes the slug and applies the brief's rules again; an unknown space comes
 * back as a field error.
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    assertSameOrigin(request);
    assertJson(request);
    const jwt = readSessionFrom(request);
    if (!jwt) throw new BffError(401, 'UNAUTHENTICATED', 'Connectez-vous pour continuer.');
    const input = discussionInputSchema.parse(await request.json());
    const { data: discussion } = await strapiAuth('/discussions', {
      jwt,
      body: { data: input },
      schema: strapiOne(discussionListItemSchema),
    }).catch((error: unknown) => {
      const mapped = mapWriteError(error, 'title');
      if (mapped instanceof BffError && mapped.code === 'NOT_FOUND') {
        throw new BffError(422, 'VALIDATION', 'Espace inconnu.', { category: ['categoryUnknown'] });
      }
      throw mapped;
    });
    return Response.json({ discussion }, { status: 201, headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return toErrorResponse(error);
  }
}
