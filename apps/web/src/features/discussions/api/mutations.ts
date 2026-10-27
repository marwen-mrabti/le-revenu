'use client';

import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';

import { bffPost } from '@/lib/api/client';

import {
  discussionEnvelopeSchema,
  type DiscussionEditInput,
  type DiscussionInput,
} from '../schemas';

/** Creates a discussion; the caller goes to its page (a new entry: nothing cached to expire). */
export function useCreateDiscussion() {
  return useMutation({
    mutationFn: (input: DiscussionInput) =>
      bffPost('/api/discussions', input, discussionEnvelopeSchema),
  });
}

export function useUpdateDiscussion(documentId: string) {
  return useMutation({
    mutationFn: (input: DiscussionEditInput) =>
      bffPost(
        `/api/discussions/${encodeURIComponent(documentId)}`,
        input,
        discussionEnvelopeSchema,
        {
          method: 'PATCH',
        },
      ),
  });
}

export function useDeleteDiscussion(documentId: string) {
  return useMutation({
    mutationFn: () =>
      bffPost(`/api/discussions/${encodeURIComponent(documentId)}`, undefined, z.undefined(), {
        method: 'DELETE',
      }),
  });
}
