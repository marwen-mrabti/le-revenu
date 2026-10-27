import type { NextRequest } from 'next/server';

import { toAuthErrorResponse } from '@/lib/api/auth-errors';
import {
  registerSchema,
  strapiRegisterResponseSchema,
  toSessionUser,
} from '@/features/auth/schemas';
import { assertJson, assertSameOrigin } from '@/lib/api/guards';
import { setSession } from '@/lib/auth/session';
import { strapiFetch } from '@/lib/strapi/base';

/**
 * Creates the reader in Strapi. With a mailer, Strapi answers no token: the account is pending
 * until the confirmation link is used. Without one (zero-setup mode), it answers a token and
 * the reader is logged in at once.
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    assertSameOrigin(request);
    assertJson(request);
    const body = registerSchema.parse(await request.json());
    const { jwt, user } = await strapiFetch('/auth/local/register', {
      body,
      schema: strapiRegisterResponseSchema,
    });
    const response = Response.json(
      { user: toSessionUser(user), pending: !jwt },
      { status: 201, headers: { 'cache-control': 'no-store' } },
    );
    if (jwt) setSession(response, jwt);
    return response;
  } catch (error) {
    return toAuthErrorResponse(error);
  }
}
