'use client';

import { useMutation } from '@tanstack/react-query';

import { bffPost } from '@/lib/api/client';

import { replyEnvelopeSchema, type ReplyInput } from '../schemas';

/** Posts a reply; the caller refreshes the server tree so the cached read is re-rendered. */
export function useCreateReply() {
  return useMutation({
    mutationFn: (input: ReplyInput) => bffPost('/api/replies', input, replyEnvelopeSchema),
  });
}
