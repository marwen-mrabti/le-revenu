'use client';

import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useFieldContext } from '@/hooks/form-context';

import { clearBlurError, useVisibleFieldErrors } from './field-errors';

interface PasswordFieldProps {
  label: string;
  description?: string;
  autoComplete: 'current-password' | 'new-password';
}

/** Password input with a show / hide toggle. */
export function PasswordField({ label, description, autoComplete }: PasswordFieldProps) {
  const field = useFieldContext<string>();
  const t = useTranslations('Form');
  const id = useId();
  const [visible, setVisible] = useState(false);
  const errors = useVisibleFieldErrors();
  const invalid = errors.length > 0;

  return (
    <Field data-invalid={invalid || undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <Input
          id={id}
          name={field.name}
          type={visible ? 'text' : 'password'}
          value={field.state.value}
          autoComplete={autoComplete}
          aria-invalid={invalid || undefined}
          aria-describedby={description ? `${id}-description` : undefined}
          onBlur={field.handleBlur}
          onChange={(event) => {
            clearBlurError(field);
            field.handleChange(event.target.value);
          }}
          className="h-10 pr-10"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={visible ? t('hidePassword') : t('showPassword')}
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
          className="absolute top-1/2 right-1.5 -translate-y-1/2 text-muted-foreground"
        >
          {visible ? <EyeOffIcon aria-hidden="true" /> : <EyeIcon aria-hidden="true" />}
        </Button>
      </div>
      {description ? (
        <FieldDescription id={`${id}-description`}>{description}</FieldDescription>
      ) : null}
      <FieldError errors={errors} />
    </Field>
  );
}
