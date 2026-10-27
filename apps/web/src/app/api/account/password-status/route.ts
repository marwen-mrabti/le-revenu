import { connection } from 'next/server';
import type { NextRequest } from 'next/server';

import { getPasswordStatus } from '@/features/auth/data';
import { BffError, toErrorResponse } from '@/lib/api/errors';
import { readSessionFrom } from '@/lib/auth/session';

/** `{ hasPassword }` for the logged-in reader; the account page reads it server-side too. */
export async function GET(request: NextRequest): Promise<Response> {
  await connection();
  try {
    const jwt = readSessionFrom(request);
    if (!jwt) throw new BffError(401, 'UNAUTHENTICATED', 'Connectez-vous pour continuer.');
    const hasPassword = await getPasswordStatus(jwt);
    return Response.json({ hasPassword }, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return toErrorResponse(error);
  }
}
