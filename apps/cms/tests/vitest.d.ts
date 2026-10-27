/** Values the global setup hands to every test file through `inject()`. */
export interface Session {
  jwt: string;
  documentId: string;
  username: string;
}

export type DemoUser = 'alice' | 'bob';

declare module 'vitest' {
  export interface ProvidedContext {
    /** http://127.0.0.1:1338 */
    baseUrl: string;
    /** Logged-in demo readers. */
    sessions: Record<DemoUser, Session>;
    /** The test database, for reading tokens Strapi only sends by mail. */
    database: { host: string; port: number; database: string; user: string; secret: string };
  }
}
