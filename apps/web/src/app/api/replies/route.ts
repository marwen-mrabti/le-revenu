import { revalidateTag } from 'next/cache';
import type { NextRequest } from 'next/server';

import { replyItemSchema } from '@/features/discussions/schemas';
import { replyInputSchema } from '@/features/replies/schemas';
import { BffError, toErrorResponse } from '@/lib/api/errors';
import { assertJson, assertSameOrigin } from '@/lib/api/guards';
import { readSessionFrom } from '@/lib/auth/session';
import { entryTag } from '@/lib/cache/tags';
import { strapiAuth } from '@/lib/strapi/private';
import { strapiOne } from '@/lib/strapi/schemas';
import { mapWriteError } from '@/lib/api/write-errors';

/**
 * Posts a reply for the session's reader. Strapi forces the author and checks
 * the discussion exists; the cached discussion is expired at once so the next
 * read shows the reply.
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    assertSameOrigin(request);
    assertJson(request);
    const jwt = readSessionFrom(request);
    if (!jwt) throw new BffError(401, 'UNAUTHENTICATED', 'Connectez-vous pour continuer.');
    const input = replyInputSchema.parse(await request.json());
    const { data: reply } = await strapiAuth('/replies', {
      jwt,
      body: { data: input },
      schema: strapiOne(replyItemSchema),
    }).catch((error: unknown) => {
      throw mapReplyError(error);
    });
    revalidateTag(entryTag('discussions', input.discussion), { expire: 0 });
    return Response.json({ reply }, { status: 201, headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** A 403 on a create means the token is stale (nobody else is involved): the form asks to log in again. */
export function mapReplyError(error: unknown): unknown {
  const mapped = mapWriteError(error, 'content');
  return mapped instanceof BffError && mapped.code === 'FORBIDDEN'
    ? new BffError(401, 'UNAUTHENTICATED', 'Votre session a expiré.')
    : mapped;
}
