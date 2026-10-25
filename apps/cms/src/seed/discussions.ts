import type { Core } from '@strapi/strapi';

import { uniqueSlug } from '../api/discussion/services/slug';
import { DISCUSSIONS } from './data/discussions';

const DISCUSSION_UID = 'api::discussion.discussion';
const REPLY_UID = 'api::reply.reply';

interface Refs {
  users: Map<string, number>;
  /** slug → documentId; a documentId connects to the default-locale (French) row */
  categories: Map<string, string>;
}

const minutesAgo = (now: number, minutes: number) => new Date(now - minutes * 60_000).toISOString();

/** Creates the discussions and their replies, dated over the past month so sorting is visible. */
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
          discussion: discussion.id,
          createdAt: replyAt,
          updatedAt: replyAt,
        },
      });
    }
  }
  return count;
}
