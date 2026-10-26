import type { NextRequest } from 'next/server';

import { toAuthErrorResponse } from '@/lib/api/auth-errors';
import { registerSchema, strapiAuthResponseSchema, toSessionUser } from '@/features/auth/schemas';
import { assertJson, assertSameOrigin } from '@/lib/api/guards';
import { setSession } from '@/lib/auth/session';
import { strapiFetch } from '@/lib/strapi/base';

/** Creates an Authenticated reader in Strapi and logs them in at once (no email confirmation). */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    assertSameOrigin(request);
    assertJson(request);
    const body = registerSchema.parse(await request.json());
    const { jwt, user } = await strapiFetch('/auth/local/register', {
      body,
      schema: strapiAuthResponseSchema,
    });
    const response = Response.json(
      { user: toSessionUser(user) },
      { status: 201, headers: { 'cache-control': 'no-store' } },
    );
    setSession(response, jwt);
    return response;
  } catch (error) {
    return toAuthErrorResponse(error);
  }
}
