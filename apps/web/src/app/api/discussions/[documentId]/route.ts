import { revalidateTag } from 'next/cache';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { discussionEditSchema, discussionListItemSchema } from '@/features/discussions/schemas';
import { BffError, toErrorResponse } from '@/lib/api/errors';
import { assertJson, assertSameOrigin } from '@/lib/api/guards';
import { mapWriteError } from '@/lib/api/write-errors';
import { readSessionFrom } from '@/lib/auth/session';
import { collectionTag, entryTag } from '@/lib/cache/tags';
import { strapiAuth } from '@/lib/strapi/private';
import { strapiOne } from '@/lib/strapi/schemas';

type Context = RouteContext<'/api/discussions/[documentId]'>;
const NO_STORE = { 'cache-control': 'no-store' };

function expire(documentId: string) {
  revalidateTag(entryTag('discussions', documentId), { expire: 0 });
  revalidateTag(collectionTag('discussions'), { expire: 0 });
}

/** The author edits title and content. Author and slug never change (Strapi ignores them). */
export async function PATCH(request: NextRequest, { params }: Context): Promise<Response> {
  try {
    assertSameOrigin(request);
    assertJson(request);
    const jwt = readSessionFrom(request);
    if (!jwt) throw new BffError(401, 'UNAUTHENTICATED', 'Connectez-vous pour continuer.');
    const { documentId } = await params;
    const input = discussionEditSchema.parse(await request.json());
    const { data: discussion } = await strapiAuth(
      `/discussions/${encodeURIComponent(documentId)}`,
      {
        jwt,
        body: { data: input },
        init: { method: 'PUT' },
        schema: strapiOne(discussionListItemSchema),
      },
    ).catch((error: unknown) => {
      throw mapWriteError(error, 'title');
    });
    expire(documentId);
    return Response.json({ discussion }, { headers: NO_STORE });
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** The author deletes the discussion; Strapi removes its replies with it. */
export async function DELETE(request: NextRequest, { params }: Context): Promise<Response> {
  try {
    assertSameOrigin(request);
    const jwt = readSessionFrom(request);
    if (!jwt) throw new BffError(401, 'UNAUTHENTICATED', 'Connectez-vous pour continuer.');
    const { documentId } = await params;
    await strapiAuth(`/discussions/${encodeURIComponent(documentId)}`, {
      jwt,
      init: { method: 'DELETE' },
      schema: z.unknown(),
    }).catch((error: unknown) => {
      throw mapWriteError(error, 'title');
    });
    expire(documentId);
    return new Response(null, { status: 204, headers: NO_STORE });
  } catch (error) {
    return toErrorResponse(error);
  }
}
