'use client';

import { useTranslations } from 'next-intl';

import { withForm } from '@/hooks/form';

import {
  CONTENT_MAX,
  DISCUSSION_TYPES,
  discussionInputSchema,
  type DiscussionInput,
} from '../schemas';

export interface SpaceOption {
  documentId: string;
  name: string;
}

export const discussionFormDefaults: DiscussionInput = {
  type: 'question',
  title: '',
  content: '',
  category: '',
};

/**
 * Type cards, title, space, content: the same four fields to create and to
 * edit a discussion. Fields validate on mount too, so the submit button only
 * lights up once the form is valid; errors stay hidden until a blur or a submit.
 */
export const DiscussionFields = withForm({
  defaultValues: discussionFormDefaults,
  props: { spaces: [] as SpaceOption[] },
  render: function Fields({ form, spaces }) {
    const t = useTranslations('DiscussionNew');
    return (
      <div className="flex flex-col gap-4">
        <form.AppField name="type">
          {(field) => (
            <field.RadioCardsField
              label={t('typeLabel')}
              options={DISCUSSION_TYPES.map((value) => ({
                value,
                title: t(`type_${value}`),
                description: t(`typeHint_${value}`),
              }))}
            />
          )}
        </form.AppField>
        <form.AppField
          name="title"
          validators={{
            onMount: discussionInputSchema.shape.title,
            onChange: discussionInputSchema.shape.title,
            onBlur: discussionInputSchema.shape.title,
          }}
        >
          {(field) => (
            <field.TextField
              label={t('titleLabel')}
              description={t('titleHint')}
              placeholder={t('titlePlaceholder')}
            />
          )}
        </form.AppField>
        <form.AppField
          name="category"
          validators={{
            onMount: discussionInputSchema.shape.category,
            onChange: discussionInputSchema.shape.category,
            onBlur: discussionInputSchema.shape.category,
          }}
        >
          {(field) => (
            <field.NativeSelectField
              label={t('space')}
              placeholder={t('spacePlaceholder')}
              options={spaces.map((space) => ({ value: space.documentId, label: space.name }))}
            />
          )}
        </form.AppField>
        <form.AppField
          name="content"
          validators={{
            onMount: discussionInputSchema.shape.content,
            onChange: discussionInputSchema.shape.content,
            onBlur: discussionInputSchema.shape.content,
          }}
        >
          {(field) => (
            <field.TextareaField
              label={t('content')}
              placeholder={t('contentPlaceholder')}
              maxLength={CONTENT_MAX}
              rows={8}
            />
          )}
        </form.AppField>
      </div>
    );
  },
});
