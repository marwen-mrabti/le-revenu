/** Brief rule: a title has at least 10 characters; the schema rejects the rest too. */
import { beforeAll, describe, expect, it } from 'vitest';

import {
  api,
  bearer,
  errorOf,
  firstCategoryId,
  invalidPaths,
  session,
  validDiscussion,
} from './helpers/api';

describe('POST /api/discussions validation', () => {
  let category: string;
  const post = (data: Record<string, unknown>) =>
    api()
      .post('/api/discussions')
      .set(bearer(session('alice')))
      .send({ data });

  beforeAll(async () => {
    category = await firstCategoryId();
  });

  it('rejects a 9-character title with a ValidationError naming title', async () => {
    const res = await post(validDiscussion(category, { title: 'Neuf car.' })).expect(400);
    expect(errorOf(res.body).name).toBe('ValidationError');
    expect(invalidPaths(res.body)).toContain('title');
  });

  it('rejects a missing content', async () => {
    const { content: _content, ...data } = validDiscussion(category);
    const res = await post(data).expect(400);
    expect(invalidPaths(res.body)).toContain('content');
  });

  it('rejects a type outside question | discussion', async () => {
    const res = await post(validDiscussion(category, { type: 'rant' })).expect(400);
    expect(invalidPaths(res.body)).toContain('type');
  });

  it('rejects an unknown category', async () => {
    const res = await post(validDiscussion('does-not-exist')).expect(400);
    expect(errorOf(res.body).name).toBe('ValidationError');
    expect(errorOf(res.body).message).toMatch(/not found/i);
  });

  it('rejects a content over 20 000 characters', async () => {
    const res = await post(validDiscussion(category, { content: 'x'.repeat(20_001) })).expect(400);
    expect(invalidPaths(res.body)).toContain('content');
  });
});
