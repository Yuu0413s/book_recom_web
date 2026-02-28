import { Hono } from 'hono';
import type { Env } from '../index';
import { getBooks, countBooks } from '../lib/db';

export const booksRoute = new Hono<{ Bindings: Env }>();

booksRoute.get('/', async (c) => {
  const source = c.req.query('source') ?? null;
  const limit = Math.min(parseInt(c.req.query('limit') ?? '200'), 500);
  const offset = parseInt(c.req.query('offset') ?? '0');

  try {
    const books = await getBooks(c.env.DB, { source, limit, offset });
    const total = await countBooks(c.env.DB, { source });

    return c.json({
      books,
      pagination: { total, limit, offset, hasMore: offset + books.length < total },
    });
  } catch (error) {
    return c.json({ error: 'Failed to fetch books', message: String(error) }, 500);
  }
});
