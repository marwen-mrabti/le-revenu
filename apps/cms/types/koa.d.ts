/**
 * `Core.PolicyContext` is built on Koa's `ExtendableContext`, which has neither
 * the route parameters (added by @koa/router) nor `state` (where Users &
 * Permissions puts the logged-in user). Declared here once for policies and
 * controllers.
 */
import 'koa';

declare module 'koa' {
  interface ExtendableContext {
    params: Record<string, string>;
    state: {
      /** Set by Users & Permissions when a valid Bearer token is present. */
      user?: { id: number; documentId: string; username?: string; email?: string };
      auth?: unknown;
    };
  }
}
