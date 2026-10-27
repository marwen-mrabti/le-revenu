import { createFormHook } from '@tanstack/react-form';

import { PasswordField } from '@/components/form/password-field';
import { SubmitButton } from '@/components/form/submit-button';
import { TextField } from '@/components/form/text-field';
import { TextareaField } from '@/components/form/textarea-field';

import { fieldContext, formContext } from './form-context';

/**
 * `useAppForm` gives every form the same pre-bound field components:
 * `<form.AppField name="email">{(f) => <f.TextField label="…" />}</form.AppField>`.
 * Validation is a zod schema whose messages are keys of the `Form` namespace.
 */
/** Field rules: validate on change (keeps the submit button right) and on blur (required, empty). */
export const rules = <T>(schema: T) => ({ onChange: schema, onBlur: schema });

export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { TextField, PasswordField, TextareaField },
  formComponents: { SubmitButton },
});
