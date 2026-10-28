import { describe, expect, it } from 'vitest';

import serverConfig from '../config/server';

/** Strapi's env helper, reduced to what config/server.ts calls. */
function fakeEnv(values: Record<string, string>) {
  const env = (key: string, fallback?: string) => values[key] ?? fallback;
  env.int = (key: string, fallback: number) => (key in values ? Number(values[key]) : fallback);
  env.bool = (key: string, fallback: boolean) =>
    key in values ? values[key] === 'true' : fallback;
  env.array = (key: string, fallback?: string[]) => values[key]?.split(',') ?? fallback;
  return env;
}

const base = { APP_KEYS: 'a,b', PUBLIC_URL: 'https://cms.example' };

/** Behind a TLS proxy Strapi must trust X-Forwarded-Proto, and only there. */
describe('server config', () => {
  it('does not trust proxy headers by default', () => {
    const config = serverConfig({ env: fakeEnv(base) } as never);
    expect(config.proxy).toEqual({ koa: false, ipHeader: 'X-Forwarded-For', maxIpsCount: 1 });
    expect(config.url).toBe('https://cms.example');
  });

  it('trusts one proxy hop when TRUST_PROXY=true', () => {
    const config = serverConfig({ env: fakeEnv({ ...base, TRUST_PROXY: 'true' }) } as never);
    expect(config.proxy).toMatchObject({ koa: true, maxIpsCount: 1 });
  });
});
