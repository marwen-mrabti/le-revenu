import type { NextRequest } from 'next/server';

import { toAuthErrorResponse } from '@/lib/api/auth-errors';
import {
  registerSchema,
  strapiRegisterResponseSchema,
  toSessionUser,
} from '@/features/auth/schemas';
import { assertJson, assertSameOrigin } from '@/lib/api/guards';
import { strapiFetch } from '@/lib/strapi/base';

/** Creates the reader in Strapi. No session yet: the account activates through the confirmation mail. */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    assertSameOrigin(request);
    assertJson(request);
    const body = registerSchema.parse(await request.json());
    const { user } = await strapiFetch('/auth/local/register', {
      body,
      schema: strapiRegisterResponseSchema,
    });
    return Response.json(
      { user: toSessionUser(user), pending: true },
      { status: 201, headers: { 'cache-control': 'no-store' } },
    );
  } catch (error) {
    return toAuthErrorResponse(error);
  }
}
