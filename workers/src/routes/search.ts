import { Hono } from 'hono';
import type { Env } from '../index';
import { generateEmbedding } from '../lib/gemini';
import { getBooksById } from '../lib/db';
import { vectorSearch } from '../lib/vectorize';

export const searchRoute = new Hono<{ Bindings: Env }>();

searchRoute.get('/', async (c) => {
  const query = c.req.query('q');
  const limit = parseInt(c.req.query('limit') ?? '10');

  if (!query) {
    return c.json({ error: 'Query parameter "q" is required' }, 400);
  }

  try {
    const queryEmbedding = await generateEmbedding(query, c.env.GEMINI_API_KEY);
    const matches = await vectorSearch(c.env.VECTORIZE, queryEmbedding, limit);

    if (matches.length === 0) {
      return c.json({ query, books: [], count: 0 });
    }

    const bookIds = matches.map((m) => parseInt(m.id));
    const books = await getBooksById(c.env.DB, bookIds);

    // Vectorize の score (cosine: 0.5~1.0) を 0~1 スケールに変換して similarity として付与
    const scoreMap = new Map(matches.map((m) => [parseInt(m.id), m.score * 2 - 1]));
    const booksWithScore = books
      .map((book) => ({ ...book, score: scoreMap.get(book.id) ?? 0 }))
      .sort((a, b) => b.score - a.score);

    return c.json({ query, books: booksWithScore, count: booksWithScore.length });
  } catch (error) {
    return c.json(
      {
        error: 'Failed to perform semantic search',
        message: String(error),
        hint: 'Ensure Vectorize index exists and embeddings are generated',
      },
      500
    );
  }
});
