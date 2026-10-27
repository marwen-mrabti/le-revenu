import type { Core, Modules } from '@strapi/strapi';

type Webhook = Modules.WebhookStore.Webhook;
interface WebhookStore {
  findWebhooks(): Promise<Webhook[]>;
  createWebhook(data: Webhook): Promise<Webhook>;
  updateWebhook(id: string, data: Webhook): Promise<Webhook | null>;
}
interface WebhookRunner {
  add(webhook: Webhook): void;
  update(webhook: Webhook): void;
}

export const WEBHOOK_NAME = 'next-revalidate';
const EVENTS = ['entry.create', 'entry.update', 'entry.delete'];

/**
 * The webhook that tells the web app a content entry changed (ADR-0006), so
 * its tagged cache of discussions and categories is refreshed after an edit in
 * the admin. Created or updated at boot from `WEB_URL`: a clone gets the same
 * one. The shared secret travels in `webhooks.defaultHeaders` (config/server.ts).
 */
export async function ensureWebhook(strapi: Core.Strapi): Promise<void> {
  const url = `${String(process.env.WEB_URL).replace(/\/$/, '')}/api/revalidate`;
  const store = strapi.get('webhookStore') as WebhookStore;
  const runner = strapi.get('webhookRunner') as WebhookRunner;
  const wanted = { name: WEBHOOK_NAME, url, headers: {}, events: EVENTS, isEnabled: true };

  const existing = (await store.findWebhooks()).find((webhook) => webhook.name === WEBHOOK_NAME);
  if (!existing) {
    // The store assigns the id; the type of `createWebhook` still asks for the full record.
    runner.add(await store.createWebhook(wanted as unknown as Webhook));
    strapi.log.info(`webhook: ${WEBHOOK_NAME} → ${url}`);
    return;
  }
  const sameEvents =
    existing.events.length === EVENTS.length && EVENTS.every((e) => existing.events.includes(e));
  if (existing.url === url && existing.isEnabled && sameEvents) return;
  const updated = await store.updateWebhook(existing.id, { ...existing, ...wanted });
  if (updated) runner.update(updated);
  strapi.log.info(`webhook: ${WEBHOOK_NAME} updated → ${url}`);
}
