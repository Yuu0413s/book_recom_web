import { Hono } from 'hono';
import type { Env } from '../index';
import { generateEmbedding, createBookEmbeddingText } from '../lib/gemini';
import { upsertVector } from '../lib/vectorize';

export const embeddingsRoute = new Hono<{ Bindings: Env }>();

type BookRow = { id: number; title: string; author: string | null; description: string | null };

async function processBatch(env: Env, books: BookRow[]) {
  let processed = 0;
  let errors = 0;

  for (const book of books) {
    try {
      const text = createBookEmbeddingText(book);
      const embedding = await generateEmbedding(text, env.GEMINI_API_KEY);
      await upsertVector(env.VECTORIZE, String(book.id), embedding);
      processed++;
      // 100 QPM 制限対応: 700ms 間隔 ≒ 85 QPM
      await new Promise((r) => setTimeout(r, 700));
    } catch (e) {
      errors++;
      console.error(`Embedding failed for book ${book.id}:`, String(e));
    }
  }

  return { processed, errors };
}

// デバッグ用: 利用可能なモデル一覧
embeddingsRoute.get('/models', async (c) => {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${c.env.GEMINI_API_KEY}`
  );
  const data = await res.json();
  return c.json(data);
});

// POST /api/embeddings/generate?limit=25&offset=0
embeddingsRoute.post('/generate', async (c) => {
  const limit = Math.min(Number(c.req.query('limit') ?? 25), 25);
  const offset = Number(c.req.query('offset') ?? 0);

  try {
    const books = await c.env.DB.prepare(
      'SELECT id, title, author, description FROM books LIMIT ? OFFSET ?'
    ).bind(limit, offset).all<BookRow>();

    const totalCount = await c.env.DB.prepare('SELECT COUNT(*) as cnt FROM books').first<{ cnt: number }>();
    const total = totalCount?.cnt ?? 0;

    const { processed, errors } = await processBatch(c.env, books.results);

    return c.json({
      success: true,
      processed,
      errors,
      batchSize: books.results.length,
      offset,
      total,
      nextOffset: offset + books.results.length,
      hasMore: offset + books.results.length < total,
    });
  } catch (error) {
    return c.json({ error: 'Failed to generate embeddings', message: String(error) }, 500);
  }
});
