import 'server-only';

import qs from 'qs';
import type { z } from 'zod';

import { env } from '@/config/env';

import { strapiErrorSchema } from './schemas';

/** A Strapi call that did not produce the expected result. `code` is stable; `message` is Strapi's. */
export class StrapiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'StrapiError';
  }
}

export interface StrapiFetchOptions<T> {
  /** Serialised with `qs` the way Strapi expects (`filters[slug][$eq]=…`). */
  query?: Record<string, unknown>;
  /** The reader's JWT for authenticated calls. Never logged, never returned. */
  jwt?: string;
  /** Parsed before anything is returned: a backend change fails loudly here. */
  schema: z.ZodType<T>;
  /** Next cache tags for reads that may be cached (`strapi:categories`, …). */
  tags?: string[];
  init?: Omit<RequestInit, 'headers' | 'body' | 'method'> & {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  };
  body?: unknown;
}

/**
 * The single transport to Strapi. Only this module reads `STRAPI_URL`.
 * Throws `StrapiError` for network failures, non-2xx answers and unexpected shapes.
 */
export async function strapiFetch<T>(path: string, options: StrapiFetchOptions<T>): Promise<T> {
  const { query, jwt, schema, tags, init, body } = options;
  const search = query ? `?${qs.stringify(query, { encodeValuesOnly: true })}` : '';
  const url = `${env.STRAPI_URL}/api${path}${search}`;

  const headers: Record<string, string> = { accept: 'application/json' };
  if (jwt) headers.authorization = `Bearer ${jwt}`;
  if (body !== undefined) headers['content-type'] = 'application/json';

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      method: init?.method ?? (body === undefined ? 'GET' : 'POST'),
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      ...(tags ? { next: { tags } } : {}),
    });
  } catch (cause) {
    throw new StrapiError(503, 'UNAVAILABLE', 'Strapi is unreachable', cause);
  }

  if (response.status === 204) return schema.parse(undefined);

  const json: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const parsed = strapiErrorSchema.safeParse(json);
    if (parsed.success) {
      const { status, name, message, details } = parsed.data.error;
      throw new StrapiError(status, name, message, details);
    }
    throw new StrapiError(response.status, 'HTTP_ERROR', `Strapi answered ${response.status}`);
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new StrapiError(
      502,
      'INVALID_RESPONSE',
      `Unexpected Strapi response for ${path}`,
      parsed.error.issues,
    );
  }
  return parsed.data;
}
