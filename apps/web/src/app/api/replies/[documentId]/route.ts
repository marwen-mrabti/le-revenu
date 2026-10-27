import { revalidateTag } from 'next/cache';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { replyItemSchema } from '@/features/discussions/schemas';
import { replyEditSchema } from '@/features/replies/schemas';
import { BffError, toErrorResponse } from '@/lib/api/errors';
import { assertJson, assertSameOrigin } from '@/lib/api/guards';
import { mapWriteError } from '@/lib/api/write-errors';
import { readSessionFrom } from '@/lib/auth/session';
import { entryTag } from '@/lib/cache/tags';
import { strapiAuth } from '@/lib/strapi/private';
import { strapiOne } from '@/lib/strapi/schemas';

type Context = RouteContext<'/api/replies/[documentId]'>;
const NO_STORE = { 'cache-control': 'no-store' };
const discussionParam = z.string().min(1).max(64);

/** The author edits their reply. Strapi's is-owner policy answers 403 for anyone else. */
export async function PATCH(request: NextRequest, { params }: Context): Promise<Response> {
  try {
    assertSameOrigin(request);
    assertJson(request);
    const jwt = readSessionFrom(request);
    if (!jwt) throw new BffError(401, 'UNAUTHENTICATED', 'Connectez-vous pour continuer.');
    const { documentId } = await params;
    const input = replyEditSchema.parse(await request.json());
    const { data: reply } = await strapiAuth(`/replies/${encodeURIComponent(documentId)}`, {
      jwt,
      body: { data: { content: input.content } },
      init: { method: 'PUT' },
      schema: strapiOne(replyItemSchema),
    }).catch((error: unknown) => {
      throw mapWriteError(error, 'content');
    });
    revalidateTag(entryTag('discussions', input.discussion), { expire: 0 });
    return Response.json({ reply }, { headers: NO_STORE });
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** The author deletes their reply; `?discussion=` names the cached page to expire. */
export async function DELETE(request: NextRequest, { params }: Context): Promise<Response> {
  try {
    assertSameOrigin(request);
    const jwt = readSessionFrom(request);
    if (!jwt) throw new BffError(401, 'UNAUTHENTICATED', 'Connectez-vous pour continuer.');
    const { documentId } = await params;
    const discussion = discussionParam.parse(request.nextUrl.searchParams.get('discussion'));
    await strapiAuth(`/replies/${encodeURIComponent(documentId)}`, {
      jwt,
      init: { method: 'DELETE' },
      schema: z.unknown(),
    }).catch((error: unknown) => {
      throw mapWriteError(error, 'content');
    });
    revalidateTag(entryTag('discussions', discussion), { expire: 0 });
    return new Response(null, { status: 204, headers: NO_STORE });
  } catch (error) {
    return toErrorResponse(error);
  }
}
