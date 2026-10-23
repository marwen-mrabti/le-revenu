import { defineConfig } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import tanstackQuery from '@tanstack/eslint-plugin-query';
import { nextConfig } from '@repo/eslint-config/next';

export default defineConfig(
  nextConfig({
    nextVitals,
    nextTs,
    tanstackQuery: tanstackQuery.configs['flat/recommended'],
  }),
);
