'use client';

import { useStore } from '@tanstack/react-form';
import { useTranslations } from 'next-intl';

import { useFieldContext } from '@/hooks/form-context';

type FormKey = Parameters<ReturnType<typeof useTranslations<'Form'>>>[0];

/**
 * The current field's errors, translated, and only once the reader has left
 * the field or tried to submit: validation runs on every change (so the
 * submit button is always right) but must not shout before the reader is done.
 */
export function useVisibleFieldErrors(): Array<{ message: string }> {
  const t = useTranslations('Form');
  const field = useFieldContext<string>();
  const attempts = useStore(field.form.store, (state) => state.submissionAttempts);
  const { isBlurred, errors } = field.state.meta;
  if (!isBlurred && attempts === 0) return [];

  const isKey = (value: string): value is FormKey => t.has(value as FormKey);
  const seen = new Set<string>();
  const out: Array<{ message: string }> = [];
  for (const error of errors as Array<string | { message?: string } | undefined | null>) {
    const key = typeof error === 'string' ? error : error?.message;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push({ message: isKey(key) ? t(key) : key });
  }
  return out;
}

/**
 * TanStack keeps one error per validation cause. The onBlur verdict would
 * otherwise survive while the reader types a fix, keeping the submit button
 * disabled until the next blur; the onChange verdict alone decides meanwhile.
 */
export function clearBlurError(field: ReturnType<typeof useFieldContext<string>>): void {
  if (field.state.meta.errorMap.onBlur === undefined) return;
  field.setMeta((meta) => ({ ...meta, errorMap: { ...meta.errorMap, onBlur: undefined } }));
}
