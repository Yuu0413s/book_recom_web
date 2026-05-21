import type { Env } from '../index';
import { generateEmbedding, createBookEmbeddingText } from './gemini';
import { upsertVector } from './vectorize';

const BATCH_SIZE = 25;

export async function generateEmbeddingBatch(env: Env): Promise<void> {
  const books = await env.DB.prepare(
    'SELECT id, title, author, description FROM books WHERE has_embedding = 0 LIMIT ?'
  ).bind(BATCH_SIZE).all<{ id: number; title: string; author: string | null; description: string | null }>();

  if (books.results.length === 0) {
    console.log('All embeddings are up to date.');
    return;
  }

  let processed = 0;
  let errors = 0;

  for (const book of books.results) {
    try {
      const text = createBookEmbeddingText(book);
      const embedding = await generateEmbedding(text, env.GEMINI_API_KEY);
      await upsertVector(env.VECTORIZE, String(book.id), embedding);
      await env.DB.prepare('UPDATE books SET has_embedding = 1 WHERE id = ?').bind(book.id).run();
      processed++;
      await new Promise((r) => setTimeout(r, 700));
    } catch (e) {
      errors++;
      console.error(`Embedding cron failed for book ${book.id}:`, String(e));
    }
  }

  console.log(`Embedding cron: processed=${processed}, errors=${errors}`);
}
