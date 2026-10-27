import type { NextRequest } from 'next/server';

import { setPasswordSchema } from '@/features/auth/schemas';
import { toAuthErrorResponse } from '@/lib/api/auth-errors';
import { BffError } from '@/lib/api/errors';
import { assertJson, assertSameOrigin } from '@/lib/api/guards';
import { readSessionFrom } from '@/lib/auth/session';
import { strapiAuth } from '@/lib/strapi/private';
import { z } from 'zod';

const okSchema = z.object({ ok: z.boolean() });

/** First password of an account without one (Google sign-up). Strapi refuses a second one (409). */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    assertSameOrigin(request);
    assertJson(request);
    const jwt = readSessionFrom(request);
    if (!jwt) throw new BffError(401, 'UNAUTHENTICATED', 'Connectez-vous pour continuer.');
    const body = setPasswordSchema.parse(await request.json());
    await strapiAuth('/auth/set-password', { jwt, body, schema: okSchema });
    return Response.json({ ok: true }, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return toAuthErrorResponse(error);
  }
}
