import 'server-only';

import { strapiFetch, type StrapiFetchOptions } from './base';

/** Anonymous reads: what any visitor could fetch. No token, GET only. */
export function strapiGet<T>(
  path: string,
  options: Pick<StrapiFetchOptions<T>, 'query' | 'schema' | 'tags'>,
): Promise<T> {
  return strapiFetch(path, options);
}
