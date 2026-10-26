import 'server-only';

import { strapiFetch, type StrapiFetchOptions } from './base';

/** Calls made on behalf of a logged-in reader: the session JWT goes in the Bearer header. */
export function strapiAuth<T>(
  path: string,
  options: Pick<StrapiFetchOptions<T>, 'query' | 'schema' | 'body' | 'init'> & { jwt: string },
): Promise<T> {
  return strapiFetch(path, options);
}
