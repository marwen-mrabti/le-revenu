import type { NextRequest } from 'next/server';

import { getStrapiUser } from '@/features/auth/data';
import {
  accountSchema,
  deleteAccountSchema,
  strapiUserSchema,
  toSessionUser,
} from '@/features/auth/schemas';
import { toAuthErrorResponse } from '@/lib/api/auth-errors';
import { BffError } from '@/lib/api/errors';
import { assertJson, assertSameOrigin } from '@/lib/api/guards';
import { clearSession, readSessionFrom } from '@/lib/auth/session';
import { strapiAuth } from '@/lib/strapi/private';

const NO_STORE = { 'cache-control': 'no-store' };

async function requireUser(request: NextRequest) {
  const jwt = readSessionFrom(request);
  const user = jwt ? await getStrapiUser(jwt) : null;
  if (!jwt || !user) throw new BffError(401, 'UNAUTHENTICATED', 'Connectez-vous pour continuer.');
  return { jwt, user };
}

/** Display name and username of the session's reader. Strapi's is-self policy guards the record. */
export async function PATCH(request: NextRequest): Promise<Response> {
  try {
    assertSameOrigin(request);
    assertJson(request);
    const { jwt, user } = await requireUser(request);
    const body = accountSchema.parse(await request.json());
    const updated = await strapiAuth(`/users/${user.id}`, {
      jwt,
      body,
      init: { method: 'PUT' },
      schema: strapiUserSchema,
    });
    return Response.json({ user: toSessionUser(updated) }, { headers: NO_STORE });
  } catch (error) {
    return toAuthErrorResponse(error);
  }
}

/** Deletes the session's reader after they typed their username; the session ends with it. */
export async function DELETE(request: NextRequest): Promise<Response> {
  try {
    assertSameOrigin(request);
    assertJson(request);
    const { jwt, user } = await requireUser(request);
    const { username } = deleteAccountSchema.parse(await request.json());
    if (username !== user.username) {
      throw new BffError(422, 'VALIDATION', 'Certains champs sont invalides.', {
        username: ['usernameMismatch'],
      });
    }
    await strapiAuth(`/users/${user.id}`, {
      jwt,
      init: { method: 'DELETE' },
      schema: strapiUserSchema,
    });
    const response = new Response(null, { status: 204, headers: NO_STORE });
    clearSession(response);
    return response;
  } catch (error) {
    return toAuthErrorResponse(error);
  }
}
