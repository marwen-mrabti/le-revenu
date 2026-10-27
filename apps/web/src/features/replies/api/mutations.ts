'use client';

import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';

import { bffPost } from '@/lib/api/client';

import { replyEnvelopeSchema, type ReplyEditInput, type ReplyInput } from '../schemas';

/** Posts a reply; the caller refreshes the server tree so the cached read is re-rendered. */
export function useCreateReply() {
  return useMutation({
    mutationFn: (input: ReplyInput) => bffPost('/api/replies', input, replyEnvelopeSchema),
  });
}

export function useUpdateReply(documentId: string) {
  return useMutation({
    mutationFn: (input: ReplyEditInput) =>
      bffPost(`/api/replies/${encodeURIComponent(documentId)}`, input, replyEnvelopeSchema, {
        method: 'PATCH',
      }),
  });
}

export function useDeleteReply(documentId: string) {
  return useMutation({
    mutationFn: (input: { discussion: string }) =>
      bffPost(
        `/api/replies/${encodeURIComponent(documentId)}?discussion=${encodeURIComponent(input.discussion)}`,
        undefined,
        z.undefined(),
        { method: 'DELETE' },
      ),
  });
}
