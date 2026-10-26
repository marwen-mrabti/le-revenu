import type { NextRequest } from 'next/server';

import { toAuthErrorResponse } from '@/lib/api/auth-errors';
import { loginSchema, strapiAuthResponseSchema, toSessionUser } from '@/features/auth/schemas';
import { assertJson, assertSameOrigin } from '@/lib/api/guards';
import { setSession } from '@/lib/auth/session';
import { strapiFetch } from '@/lib/strapi/base';

/** Email or username + password → session cookie. The JWT never leaves this handler. */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    assertSameOrigin(request);
    assertJson(request);
    const body = loginSchema.parse(await request.json());
    const { jwt, user } = await strapiFetch('/auth/local', {
      body,
      schema: strapiAuthResponseSchema,
    });
    const response = Response.json(
      { user: toSessionUser(user) },
      { headers: { 'cache-control': 'no-store' } },
    );
    setSession(response, jwt);
    return response;
  } catch (error) {
    return toAuthErrorResponse(error);
  }
}
