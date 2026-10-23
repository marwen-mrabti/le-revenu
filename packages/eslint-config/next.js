import { base } from './base.js';

/**
 * Next.js app rules. The app itself provides `eslint-config-next` and
 * `@tanstack/eslint-plugin-query` and passes them in, so versions stay
 * pinned next to the Next version they match.
 *
 * @param {object} deps
 * @param {import('eslint').Linter.Config[]} deps.nextVitals
 * @param {import('eslint').Linter.Config[]} deps.nextTs
 * @param {import('eslint').Linter.Config[]} deps.tanstackQuery
 * @returns {import('eslint').Linter.Config[]}
 */
export function nextConfig({ nextVitals, nextTs, tanstackQuery }) {
  return [
    ...nextVitals,
    ...nextTs,
    ...tanstackQuery,
    ...base,
    {
      files: ['src/app/**/*.{ts,tsx}', 'src/features/**/*.{ts,tsx}'],
      rules: {
        'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
      },
    },
    {
      files: ['src/app/**/page.tsx', 'src/app/**/layout.tsx'],
      rules: {
        'max-lines': ['error', { max: 120, skipBlankLines: true, skipComments: true }],
      },
    },
    {
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [
              { name: 'sonner', message: 'Import toast helpers from "@/lib/toast" instead.' },
            ],
            patterns: [
              {
                group: [
                  '@/features/*/*',
                  '!@/features/*/components',
                  '!@/features/*/api',
                  '!@/features/*/schemas',
                  '!@/features/*/search-params',
                  '!@/features/*/data',
                ],
                message: 'Import a feature only through its public modules.',
              },
            ],
          },
        ],
      },
    },
    {
      ignores: [
        'src/components/ui/**',
        '.next/**',
        'next-env.d.ts',
        'playwright-report/**',
        'test-results/**',
      ],
    },
  ];
}

export default nextConfig;
