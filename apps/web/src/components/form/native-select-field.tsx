'use client';

import { ChevronDownIcon } from 'lucide-react';
import { useId } from 'react';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { useFieldContext } from '@/hooks/form-context';
import { cn } from '@/lib/utils';

import { clearBlurError, useVisibleFieldErrors } from './field-errors';

interface NativeSelectFieldProps {
  label: string;
  description?: string;
  /** First, disabled entry: "Choisissez un espace…". */
  placeholder: string;
  options: Array<{ value: string; label: string }>;
}

/** A native select bound to the current form field: keyboard, screen readers and mobile pickers for free. */
export function NativeSelectField({
  label,
  description,
  placeholder,
  options,
}: NativeSelectFieldProps) {
  const field = useFieldContext<string>();
  const id = useId();
  const errors = useVisibleFieldErrors();
  const invalid = errors.length > 0;

  return (
    <Field data-invalid={invalid || undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <select
          id={id}
          name={field.name}
          value={field.state.value}
          aria-invalid={invalid || undefined}
          aria-describedby={description ? `${id}-description` : undefined}
          onBlur={field.handleBlur}
          onChange={(event) => {
            clearBlurError(field);
            field.handleChange(event.target.value);
          }}
          className={cn(
            'h-10 w-full appearance-none rounded-lg border border-input bg-transparent pr-9 pl-2.5 text-base transition-colors outline-none md:text-sm',
            'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30',
            field.state.value === '' && 'text-muted-foreground',
          )}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value} className="text-foreground">
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
      </div>
      {description ? (
        <FieldDescription id={`${id}-description`}>{description}</FieldDescription>
      ) : null}
      <FieldError errors={errors} />
    </Field>
  );
}
