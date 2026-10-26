import type { Core, UID } from '@strapi/strapi';

/** The request pieces our controllers read. Structural on purpose: no dependency on Koa types. */
export interface ApiContext {
  query: Record<string, unknown>;
  params: Record<string, string | undefined>;
  state: { auth?: unknown; user?: { documentId: string } };
  request: { body?: { data?: Record<string, unknown> } };
  status: number;
}

/**
 * Explicit versions of the core controller helpers (`validateQuery`, `sanitizeOutput`, …),
 * bound to one content type. Same Strapi functions underneath, no reliance on `this`.
 */
export function contentApi(strapi: Core.Strapi, uid: UID.ContentType) {
  const schema = strapi.getModel(uid);
  const api = strapi.contentAPI;

  return {
    /** Validates then sanitises `ctx.query` for the caller's permissions. */
    async query(ctx: ApiContext): Promise<Record<string, unknown>> {
      const options = { auth: ctx.state.auth };
      await api.validate.query(ctx.query, schema, options);
      return api.sanitize.query(ctx.query, schema, options);
    },
    /** Validates then sanitises a request body (unknown keys, restricted relations). */
    async input(data: Record<string, unknown>, ctx: ApiContext): Promise<Record<string, unknown>> {
      const options = { auth: ctx.state.auth };
      await api.validate.input(data, schema, options);
      return (await api.sanitize.input(data, schema, options)) as Record<string, unknown>;
    },
    /** Removes private fields and relations the caller may not read. */
    async output(entity: unknown, ctx: ApiContext): Promise<Record<string, unknown>> {
      return (await api.sanitize.output(entity, schema, { auth: ctx.state.auth })) as Record<
        string,
        unknown
      >;
    },
  };
}

/** Narrows Koa's loosely typed context to the shape above. */
export function fromKoa(ctx: unknown): ApiContext {
  return ctx as ApiContext;
}

/** Strapi 5 response envelope. */
export function envelope<T>(data: T, meta: Record<string, unknown> = {}) {
  return { data, meta };
}
