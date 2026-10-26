import type { z } from 'zod';

/** Error shape every BFF route handler returns (see lib/api/errors.ts). */
export interface ApiErrorBody {
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function parseError(response: Response): Promise<ApiError> {
  const body = (await response.json().catch(() => null)) as Partial<ApiErrorBody> | null;
  return new ApiError(
    response.status,
    body?.code ?? 'HTTP_ERROR',
    body?.message ?? `Request failed with status ${response.status}`,
    body?.fieldErrors,
  );
}

/** Browser → own BFF (`/api/*`). The browser never learns the Strapi URL. */
export async function bffGet<T>(
  path: string,
  schema: z.ZodType<T>,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(path, { signal, headers: { accept: 'application/json' } });
  if (!response.ok) throw await parseError(response);
  return schema.parse(await response.json());
}

export async function bffPost<T>(path: string, body: unknown, schema: z.ZodType<T>): Promise<T> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw await parseError(response);
  if (response.status === 204) return schema.parse(undefined);
  return schema.parse(await response.json());
}
