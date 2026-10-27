'use client';

import { useId } from 'react';

import { useFieldContext } from '@/hooks/form-context';
import { cn } from '@/lib/utils';

interface RadioCardsFieldProps {
  label: string;
  options: Array<{ value: string; title: string; description?: string }>;
}

/** Native radios dressed as cards: arrow keys, screen readers and the brand highlight. */
export function RadioCardsField({ label, options }: RadioCardsFieldProps) {
  const field = useFieldContext<string>();
  const id = useId();

  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="sr-only">{label}</legend>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {options.map((option) => {
          const checked = field.state.value === option.value;
          return (
            <label
              key={option.value}
              className={cn(
                'flex cursor-pointer items-start gap-2.5 rounded-xl border border-border px-3.5 py-3 transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50',
                checked && 'border-primary bg-primary/8',
              )}
            >
              <input
                type="radio"
                name={`${id}-${field.name}`}
                value={option.value}
                checked={checked}
                onChange={() => field.handleChange(option.value)}
                className="mt-1 accent-primary"
              />
              <span className="min-w-0">
                <span className="block text-[14.5px] font-semibold">{option.title}</span>
                {option.description ? (
                  <span className="block text-[12.5px] text-muted-foreground">
                    {option.description}
                  </span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
