import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { forgotPasswordSchema } from '@/features/auth/schemas';
import { toAuthErrorResponse } from '@/lib/api/auth-errors';
import { assertJson, assertSameOrigin } from '@/lib/api/guards';
import { strapiFetch } from '@/lib/strapi/base';

/** Asks Strapi to mail a reset link. Always 200: an unknown address must look like a known one. */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    assertSameOrigin(request);
    assertJson(request);
    const body = forgotPasswordSchema.parse(await request.json());
    await strapiFetch('/auth/forgot-password', { body, schema: z.unknown() });
    return Response.json({ ok: true }, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return toAuthErrorResponse(error);
  }
}
