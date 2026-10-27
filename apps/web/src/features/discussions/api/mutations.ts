'use client';

import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';

import { bffPost } from '@/lib/api/client';

import { discussionEnvelopeSchema, type DiscussionEditInput } from '../schemas';

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
