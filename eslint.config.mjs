import { defineConfig } from 'eslint/config';
import { base } from '@repo/eslint-config/base';

// Root-level and packages/* files only. Each app lints itself with its own config.
export default defineConfig([...base, { ignores: ['apps/**'] }]);
