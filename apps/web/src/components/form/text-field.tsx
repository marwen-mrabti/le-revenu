'use client';

import { useId } from 'react';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useFieldContext } from '@/hooks/form-context';

import { useVisibleFieldErrors } from './field-errors';

interface TextFieldProps {
  label: string;
  description?: string;
  type?: 'text' | 'email';
  autoComplete?: string;
  placeholder?: string;
}

/** One labelled input bound to the current form field, with its translated errors. */
export function TextField({
  label,
  description,
  type = 'text',
  autoComplete,
  placeholder,
}: TextFieldProps) {
  const field = useFieldContext<string>();
  const id = useId();
  const errors = useVisibleFieldErrors();
  const invalid = errors.length > 0;

  return (
    <Field data-invalid={invalid || undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        name={field.name}
        type={type}
        value={field.state.value}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        aria-describedby={description ? `${id}-description` : undefined}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value)}
        className="h-10"
      />
      {description ? (
        <FieldDescription id={`${id}-description`}>{description}</FieldDescription>
      ) : null}
      <FieldError errors={errors} />
    </Field>
  );
}
