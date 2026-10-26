import path from 'node:path';

import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin({
  requestConfig: './src/i18n/request.ts',
  experimental: {
    // Type-checks message keys and ICU arguments against the French source file.
    createMessagesDeclaration: './messages/fr.json',
  },
});

const nextConfig: NextConfig = {
  cacheComponents: true,
  async redirects() {
    // The home of every locale is the discussions list. A static redirect beats a page that only redirects.
    return [
      { source: '/', destination: '/discussions', permanent: false },
      { source: '/:locale(fr|en)', destination: '/:locale/discussions', permanent: false },
    ];
  },
  partialPrefetching: true,
  typedRoutes: true,
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../../'),
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default withNextIntl(nextConfig);
