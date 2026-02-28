import { Hono } from 'hono';
import type { Env } from '../index';
import { syncBooksOnly } from '../sync/book-sync';

export const syncRoute = new Hono<{ Bindings: Env }>();

syncRoute.post('/', async (c) => {
  try {
    const result = await syncBooksOnly(c.env);
    return c.json({ success: true, message: 'Sync completed', ...result });
  } catch (error) {
    return c.json({ error: 'Sync failed', message: String(error) }, 500);
  }
});
