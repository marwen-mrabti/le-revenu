import { revalidateTag } from 'next/cache';
import type { NextRequest } from 'next/server';

import { replyItemSchema } from '@/features/discussions/schemas';
import { replyInputSchema } from '@/features/replies/schemas';
import { BffError, toErrorResponse } from '@/lib/api/errors';
import { assertJson, assertSameOrigin } from '@/lib/api/guards';
import { readSessionFrom } from '@/lib/auth/session';
import { entryTag } from '@/lib/cache/tags';
import { StrapiError } from '@/lib/strapi/base';
import { strapiAuth } from '@/lib/strapi/private';
import { strapiOne } from '@/lib/strapi/schemas';

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

/** Strapi's verdicts on a write, as stable codes the form can act on. */
export function mapReplyError(error: unknown): unknown {
  if (!(error instanceof StrapiError)) return error;
  if (error.status === 403 || error.status === 401) {
    return new BffError(401, 'UNAUTHENTICATED', 'Votre session a expiré.');
  }
  if (error.status === 404)
    return new BffError(404, 'NOT_FOUND', "Cette discussion n'existe plus.");
  if (error.status === 400) {
    return new BffError(422, 'VALIDATION', 'Réponse invalide.', { content: ['replyMin'] });
  }
  return error;
}
