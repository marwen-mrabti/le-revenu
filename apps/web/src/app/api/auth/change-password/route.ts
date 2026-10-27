import type { NextRequest } from 'next/server';

import {
  changePasswordSchema,
  strapiAuthResponseSchema,
  toSessionUser,
} from '@/features/auth/schemas';
import { toAuthErrorResponse } from '@/lib/api/auth-errors';
import { BffError } from '@/lib/api/errors';
import { assertJson, assertSameOrigin } from '@/lib/api/guards';
import { readSessionFrom, setSession } from '@/lib/auth/session';
import { strapiAuth } from '@/lib/strapi/private';

/** Current password + new one → Strapi issues a fresh token, the cookie is rotated. */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    assertSameOrigin(request);
    assertJson(request);
    const jwt = readSessionFrom(request);
    if (!jwt) throw new BffError(401, 'UNAUTHENTICATED', 'Connectez-vous pour continuer.');
    const body = changePasswordSchema.parse(await request.json());
    const result = await strapiAuth('/auth/change-password', {
      jwt,
      body,
      schema: strapiAuthResponseSchema,
    });
    const response = Response.json(
      { user: toSessionUser(result.user) },
      { headers: { 'cache-control': 'no-store' } },
    );
    setSession(response, result.jwt);
    return response;
  } catch (error) {
    return toAuthErrorResponse(error);
  }
}
