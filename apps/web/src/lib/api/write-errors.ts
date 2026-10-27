import { BffError } from '@/lib/api/errors';
import { StrapiError } from '@/lib/strapi/base';

/**
 * Strapi's verdicts on a write (create, update, delete) as stable codes the
 * forms act on: a stale cookie, a record that is gone or not ours, a rule.
 */
export function mapWriteError(error: unknown, invalidField: string): unknown {
  if (!(error instanceof StrapiError)) return error;
  if (error.status === 401) return new BffError(401, 'UNAUTHENTICATED', 'Votre session a expiré.');
  if (error.status === 403)
    return new BffError(403, 'FORBIDDEN', 'Cette action ne vous est pas permise.');
  if (error.status === 404) return new BffError(404, 'NOT_FOUND', "Ce contenu n'existe plus.");
  if (error.status === 400) {
    return new BffError(422, 'VALIDATION', 'Contenu invalide.', { [invalidField]: ['invalid'] });
  }
  return error;
}
