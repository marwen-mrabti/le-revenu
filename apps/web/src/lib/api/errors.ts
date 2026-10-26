import 'server-only';

import { unstable_rethrow } from 'next/navigation';
import { z } from 'zod';

import { StrapiError } from '@/lib/strapi/base';

import type { ApiErrorBody } from './client';

const PUBLIC_MESSAGES: Partial<Record<number, string>> = {
  400: 'Requête invalide.',
  401: 'Connectez-vous pour continuer.',
  403: "Vous n'avez pas le droit d'effectuer cette action.",
  404: 'Introuvable.',
  422: 'Certains champs sont invalides.',
  429: 'Trop de tentatives, réessayez dans une minute.',
  502: 'Le serveur de contenu a répondu de façon inattendue.',
  503: 'Le serveur de contenu est indisponible.',
};

const GENERIC_MESSAGE = 'Une erreur est survenue.';

function messageFor(status: number): string {
  return PUBLIC_MESSAGES[status] ?? GENERIC_MESSAGE;
}

function json(status: number, body: ApiErrorBody): Response {
  return Response.json(body, { status, headers: { 'cache-control': 'no-store' } });
}

/**
 * Maps any error thrown in a route handler to the documented JSON shape.
 * Strapi messages are never echoed; the original is logged server-side.
 */
export function toErrorResponse(error: unknown): Response {
  // Next's own control-flow errors (redirects, prerender bail-outs) must keep propagating.
  unstable_rethrow(error);
  if (error instanceof z.ZodError) {
    return json(422, {
      code: 'VALIDATION',
      message: messageFor(422),
      fieldErrors: z.flattenError(error).fieldErrors as Record<string, string[]>,
    });
  }
  if (error instanceof StrapiError) {
    // Strapi's 400 ValidationError becomes our 422; unknown statuses are reported as a bad upstream answer.
    let status = 502;
    if (error.status === 400) status = 422;
    else if (PUBLIC_MESSAGES[error.status]) status = error.status;
    if (status >= 500) console.error('[bff] strapi error', error.status, error.code, error.message);
    return json(status, { code: error.code, message: messageFor(status) });
  }
  console.error('[bff] unexpected error', error);
  return json(500, { code: 'INTERNAL', message: GENERIC_MESSAGE });
}
