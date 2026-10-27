import type { NextRequest } from 'next/server';

import {
  resetPasswordSchema,
  strapiAuthResponseSchema,
  toSessionUser,
} from '@/features/auth/schemas';
import { toAuthErrorResponse } from '@/lib/api/auth-errors';
import { assertJson, assertSameOrigin } from '@/lib/api/guards';
import { setSession } from '@/lib/auth/session';
import { strapiFetch } from '@/lib/strapi/base';

/** The mailed code plus a new password → the reader is logged in right away. */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    assertSameOrigin(request);
    assertJson(request);
    const body = resetPasswordSchema.parse(await request.json());
    const { jwt, user } = await strapiFetch('/auth/reset-password', {
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
