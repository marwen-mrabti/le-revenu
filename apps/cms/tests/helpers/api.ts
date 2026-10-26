/** Small helpers shared by the test files: HTTP client, sessions, fixtures, JSON probes. */
import supertest from 'supertest';
import { inject } from 'vitest';

import type { DemoUser, Session } from '../vitest.d';

export type { Session };

/** supertest bound to the Strapi instance started by the global setup. */
export const api = () => supertest(inject('baseUrl'));

export const session = (name: DemoUser): Session => inject('sessions')[name];

export const bearer = (who: Session) => ({ Authorization: `Bearer ${who.jwt}` });

export interface ApiError {
  status: number;
  name: string;
  message: string;
  details: { errors?: Array<{ path: string[]; message: string }>; [key: string]: unknown };
}

export const errorOf = (body: unknown): ApiError => (body as { error: ApiError }).error;

/** Every attribute path named in a 400 ValidationError, flattened. */
export const invalidPaths = (body: unknown): string[] =>
  (errorOf(body).details.errors ?? []).flatMap((e) => e.path);

/** True when `key` appears anywhere in the JSON tree. Used for `id` and `email`. */
export function hasKeyDeep(value: unknown, key: string): boolean {
  if (Array.isArray(value)) return value.some((item) => hasKeyDeep(item, key));
  if (value !== null && typeof value === 'object') {
    return Object.entries(value).some(([k, v]) => k === key || hasKeyDeep(v, key));
  }
  return false;
}

export async function firstCategoryId(): Promise<string> {
  const res = await api().get('/api/categories').expect(200);
  return (res.body.data as Array<{ documentId: string }>)[0].documentId;
}

export const validDiscussion = (category: string, overrides: Record<string, unknown> = {}) => ({
  title: 'Un titre de discussion assez long',
  content: 'Un contenu de discussion pour les tests.',
  type: 'question',
  category,
  ...overrides,
});

export interface DiscussionRow {
  documentId: string;
  title: string;
  slug: string;
  author: { documentId: string; username: string };
}

export async function createDiscussion(
  who: Session,
  category: string,
  overrides: Record<string, unknown> = {},
): Promise<DiscussionRow> {
  const res = await api()
    .post('/api/discussions')
    .set(bearer(who))
    .send({ data: validDiscussion(category, overrides) })
    .expect(201);
  return res.body.data as DiscussionRow;
}

export async function createReply(
  who: Session,
  discussion: string,
  content = 'Une réponse de test.',
): Promise<{ documentId: string; author: { username: string } }> {
  const res = await api()
    .post('/api/replies')
    .set(bearer(who))
    .send({ data: { content, discussion } })
    .expect(201);
  return res.body.data;
}
