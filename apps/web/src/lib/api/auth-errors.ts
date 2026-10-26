import 'server-only';

import { BffError, toErrorResponse } from './errors';
import { StrapiError } from '@/lib/strapi/base';

/**
 * Strapi answers 400 for both a wrong password and a taken email; the BFF
 * turns them into stable codes the forms can act on. Strapi's wording never
 * reaches the browser.
 */
export function toAuthErrorResponse(error: unknown): Response {
  if (error instanceof StrapiError) {
    if (error.status === 429) {
      return toErrorResponse(
        new BffError(429, 'RATE_LIMITED', 'Trop de tentatives, réessayez dans une minute.'),
      );
    }
    if (error.status === 400 && /invalid identifier or password/i.test(error.message)) {
      return toErrorResponse(
        new BffError(401, 'INVALID_CREDENTIALS', 'Identifiant ou mot de passe incorrect.'),
      );
    }
    if (error.status === 400 && /already taken/i.test(error.message)) {
      return toErrorResponse(
        new BffError(409, 'ALREADY_TAKEN', "Cet e-mail ou ce nom d'utilisateur est déjà utilisé.", {
          email: ['alreadyTaken'],
        }),
      );
    }
    if (error.status === 400 && /blocked/i.test(error.message)) {
      return toErrorResponse(new BffError(403, 'BLOCKED', 'Ce compte a été bloqué.'));
    }
  }
  return toErrorResponse(error);
}
