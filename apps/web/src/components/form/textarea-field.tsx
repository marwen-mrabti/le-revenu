'use client';

import { useId } from 'react';

import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { useFieldContext } from '@/hooks/form-context';
import { cn } from '@/lib/utils';

import { clearBlurError, useVisibleFieldErrors } from './field-errors';

interface TextareaFieldProps {
  label: string;
  /** Visually hidden label: the surrounding card already says what the box is. */
  hideLabel?: boolean;
  placeholder?: string;
  /** Shows a live `n / max` counter, red past the limit. */
  maxLength?: number;
  rows?: number;
  autoFocus?: boolean;
}

/** One labelled textarea bound to the current form field, with its counter and translated errors. */
export function TextareaField({
  label,
  hideLabel = false,
  placeholder,
  maxLength,
  rows = 5,
  autoFocus,
}: TextareaFieldProps) {
  const field = useFieldContext<string>();
  const id = useId();
  const errors = useVisibleFieldErrors();
  const invalid = errors.length > 0;
  const length = field.state.value.length;
  const over = maxLength !== undefined && length > maxLength;

  return (
    <Field data-invalid={invalid || undefined}>
      <FieldLabel htmlFor={id} className={cn(hideLabel && 'sr-only')}>
        {label}
      </FieldLabel>
      <Textarea
        id={id}
        name={field.name}
        value={field.state.value}
        placeholder={placeholder}
        rows={rows}
        autoFocus={autoFocus}
        aria-invalid={invalid || undefined}
        aria-describedby={maxLength !== undefined ? `${id}-counter` : undefined}
        onBlur={field.handleBlur}
        onChange={(event) => {
          clearBlurError(field);
          field.handleChange(event.target.value);
        }}
        className="min-h-28 resize-y text-[15px]"
      />
      <div className="flex items-start justify-between gap-3">
        <FieldError errors={errors} />
        {maxLength !== undefined ? (
          <output
            id={`${id}-counter`}
            aria-live="polite"
            className={cn(
              'ml-auto text-xs text-muted-foreground tabular-nums',
              over && 'font-semibold text-destructive',
            )}
          >
            {length} / {maxLength}
          </output>
        ) : null}
      </div>
    </Field>
  );
}
