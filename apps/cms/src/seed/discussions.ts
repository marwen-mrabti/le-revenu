import type { Core } from '@strapi/strapi';

import { DISCUSSION_UID } from '../api/discussion/constants';
import { uniqueSlug } from '../api/discussion/utils/slug';
import { REPLY_UID } from '../api/reply/constants';
import { DISCUSSIONS } from './data/discussions';

interface Refs {
  /** username → documentId */
  users: Map<string, string>;
  /** slug → documentId; a documentId connects to the default-locale (French) row */
  categories: Map<string, string>;
}

const minutesAgo = (now: number, minutes: number) => new Date(now - minutes * 60_000).toISOString();

/**
 * Creates the discussions and their replies, dated over the past month so sorting
 * is visible. Relations are connected by documentId; numeric ids never appear.
 */
export async function seedDiscussions(strapi: Core.Strapi, refs: Refs): Promise<number> {
  const now = Date.now();
  let count = 0;

  for (const item of DISCUSSIONS) {
    const author = refs.users.get(item.author);
    const category = refs.categories.get(item.category);
    if (author === undefined || category === undefined) {
      throw new Error(`seed: unknown author or category for "${item.title}"`);
    }
    const createdAt = minutesAgo(now, item.minutesAgo);
    const discussion = await strapi.documents(DISCUSSION_UID).create({
      data: {
        title: item.title,
        slug: await uniqueSlug(strapi, item.title),
        content: item.content,
        type: item.type,
        author,
        category,
        createdAt,
        updatedAt: createdAt,
      },
    });
    count += 1;

    for (const reply of item.replies) {
      const replyAuthor = refs.users.get(reply.author);
      if (replyAuthor === undefined)
        throw new Error(`seed: unknown reply author "${reply.author}"`);
      const replyAt = minutesAgo(now, reply.minutesAgo);
      await strapi.documents(REPLY_UID).create({
        data: {
          content: reply.content,
          author: replyAuthor,
          discussion: discussion.documentId,
          createdAt: replyAt,
          updatedAt: replyAt,
        },
      });
    }
  }
  return count;
}
