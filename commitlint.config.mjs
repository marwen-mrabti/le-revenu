/**
 * Conventional Commits, one or two lines, no tool attribution.
 * Example: feat(cms): force author from session on discussion create
 */
const forbidden = /co-authored-by|generated with|claude|copilot|chatgpt|ai-generated/i;

export default {
  extends: ['@commitlint/config-conventional'],
  plugins: [
    {
      rules: {
        'no-tool-attribution': ({ raw }) => [
          !forbidden.test(raw),
          'Commit messages must not contain tool attribution or Co-Authored-By trailers.',
        ],
        'max-two-lines': ({ raw }) => {
          const lines = raw
            .trim()
            .split('\n')
            .filter((l) => l.trim() !== '' && !l.startsWith('#'));
          return [lines.length <= 2, 'Commit messages must be one or two lines.'];
        },
      },
    },
  ],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'refactor',
        'chore',
        'test',
        'docs',
        'ci',
        'style',
        'perf',
        'build',
        'revert',
      ],
    ],
    'scope-enum': [2, 'always', ['web', 'cms', 'docker', 'ci', 'docs', 'deps', 'repo']],
    'scope-empty': [1, 'never'],
    'header-max-length': [2, 'always', 72],
    'body-max-line-length': [2, 'always', 100],
    'subject-case': [2, 'always', 'lower-case'],
    'no-tool-attribution': [2, 'always'],
    'max-two-lines': [2, 'always'],
  },
};
