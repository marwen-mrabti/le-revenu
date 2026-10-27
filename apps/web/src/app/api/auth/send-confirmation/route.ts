import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { forgotPasswordSchema } from '@/features/auth/schemas';
import { toAuthErrorResponse } from '@/lib/api/auth-errors';
import { assertJson, assertSameOrigin } from '@/lib/api/guards';
import { StrapiError, strapiFetch } from '@/lib/strapi/base';

/** Resends the confirmation mail. Always 200, even when already confirmed or unknown. */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    assertSameOrigin(request);
    assertJson(request);
    const body = forgotPasswordSchema.parse(await request.json());
    try {
      await strapiFetch('/auth/send-email-confirmation', { body, schema: z.unknown() });
    } catch (error) {
      // "Already confirmed" or a blocked account: nothing to tell an anonymous caller.
      if (!(error instanceof StrapiError && error.status === 400)) throw error;
    }
    return Response.json({ ok: true }, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return toAuthErrorResponse(error);
  }
}
