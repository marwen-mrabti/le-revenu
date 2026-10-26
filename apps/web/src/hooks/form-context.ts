import { createFormHookContexts } from '@tanstack/react-form';

/** Contexts shared by the form hook and the field components (TanStack Form composition). */
export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts();
