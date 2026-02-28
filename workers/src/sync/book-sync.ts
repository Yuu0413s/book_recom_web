import type { Env } from '../index';
import { upsertBook, createSyncLog, updateSyncLog } from '../lib/db';
import { generateEmbedding, createBookEmbeddingText } from '../lib/gemini';
import { upsertVector } from '../lib/vectorize';
import { fetchNarouNovels } from '../lib/api/narou';
import { fetchGoogleBooks, GOOGLE_BOOKS_KEYWORDS } from '../lib/api/google-books';
import { fetchOpenLibraryBooks, OPEN_LIBRARY_KEYWORDS } from '../lib/api/open-library';
import { fetchCiNiiBooks, CINII_KEYWORDS } from '../lib/api/cinii';

interface BookData {
  source: string;
  sourceId: string;
  title: string;
  author: string | null;
  description: string | null;
  url: string | null;
  metadata: Record<string, unknown> | null;
}

// D1 保存のみ（Embedding なし）
async function saveBook(db: D1Database, book: BookData): Promise<{ isNew: boolean }> {
  const { isNew } = await upsertBook(db, book);
  return { isNew };
}

async function syncNarou(db: D1Database): Promise<{ created: number; updated: number }> {
  const novels = await fetchNarouNovels();
  let created = 0, updated = 0;

  for (const novel of novels) {
    const { isNew } = await saveBook(db, {
      source: 'NAROU',
      sourceId: novel.ncode,
      title: novel.title,
      author: novel.writer,
      description: novel.story,
      url: `https://ncode.syosetu.com/${novel.ncode.toLowerCase()}/`,
      metadata: { userid: novel.userid },
    });
    isNew ? created++ : updated++;
  }
  return { created, updated };
}

async function syncGoogleBooks(db: D1Database): Promise<{ created: number; updated: number }> {
  let created = 0, updated = 0;

  for (const keyword of GOOGLE_BOOKS_KEYWORDS) {
    const response = await fetchGoogleBooks(keyword);
    if (!response.items) continue;

    for (const item of response.items) {
      const { isNew } = await saveBook(db, {
        source: 'GOOGLE_BOOKS',
        sourceId: item.id,
        title: item.volumeInfo.title,
        author: item.volumeInfo.authors?.join(', ') || null,
        description: item.volumeInfo.description || null,
        url: `https://books.google.com/books?id=${item.id}`,
        metadata: { keyword },
      });
      isNew ? created++ : updated++;
    }

    await new Promise((r) => setTimeout(r, 500));
  }
  return { created, updated };
}

async function syncOpenLibrary(db: D1Database): Promise<{ created: number; updated: number }> {
  let created = 0, updated = 0;

  for (const keyword of OPEN_LIBRARY_KEYWORDS) {
    const response = await fetchOpenLibraryBooks(keyword);

    for (const doc of response.docs) {
      const workId = doc.key.replace('/works/', '');
      const { isNew } = await saveBook(db, {
        source: 'OPEN_LIBRARY',
        sourceId: workId,
        title: doc.title,
        author: doc.author_name?.join(', ') || null,
        description: null,
        url: `https://openlibrary.org${doc.key}`,
        metadata: { keyword },
      });
      isNew ? created++ : updated++;
    }

    await new Promise((r) => setTimeout(r, 1000));
  }
  return { created, updated };
}


async function syncCiNii(db: D1Database): Promise<{ created: number; updated: number }> {
  let created = 0, updated = 0;

  for (const keyword of CINII_KEYWORDS) {
    const response = await fetchCiNiiBooks(keyword);
    const graph = response['@graph']?.[0];
    const items = graph?.items || [];

    for (const item of items) {
      const ncidMatch = item['@id'].match(/ncid\/([A-Z0-9]+)/i);
      const sourceId = ncidMatch?.[1] || item['@id'];
      const creator = item['dc:creator'];
      const author = Array.isArray(creator) ? creator.join(', ') : creator || null;

      const { isNew } = await saveBook(db, {
        source: 'CINII',
        sourceId,
        title: item.title,
        author,
        description: null,
        url: item['@id'],
        metadata: { keyword, publisher: item['dc:publisher'] },
      });
      isNew ? created++ : updated++;
    }

    await new Promise((r) => setTimeout(r, 1000));
  }
  return { created, updated };
}

// HTTP 経由で呼ぶ版: D1 保存のみ（タイムアウト対策）
export async function syncBooksOnly(env: Env): Promise<{ totalCreated: number; totalUpdated: number }> {
  const sources = [
    { name: 'NAROU' as const,        fn: () => syncNarou(env.DB) },
    { name: 'GOOGLE_BOOKS' as const, fn: () => syncGoogleBooks(env.DB) },
    { name: 'OPEN_LIBRARY' as const, fn: () => syncOpenLibrary(env.DB) },
    // AOZORA: api.bungomail.com is defunct (SSL cert now belongs to hedonic.games)
    { name: 'CINII' as const,        fn: () => syncCiNii(env.DB) },
  ];

  let totalCreated = 0, totalUpdated = 0;

  for (const { name, fn } of sources) {
    const logId = await createSyncLog(env.DB, name);
    try {
      const { created, updated } = await fn();
      totalCreated += created;
      totalUpdated += updated;
      await updateSyncLog(env.DB, logId, { status: 'SUCCESS', created, updated });
    } catch (e) {
      await updateSyncLog(env.DB, logId, { status: 'FAILED', created: 0, updated: 0, errors: String(e) });
    }
  }

  return { totalCreated, totalUpdated };
}

// Cron 経由で呼ぶ版: D1 保存 + Embedding 生成（ctx.waitUntil で時間制限なし）
export async function syncAllSources(env: Env): Promise<void> {
  // まず全ソースを D1 に保存
  await syncBooksOnly(env);

  // 次に Embedding を一括生成
  const books = await env.DB.prepare(
    'SELECT id, title, author, description FROM books'
  ).all<{ id: number; title: string; author: string | null; description: string | null }>();

  for (const book of books.results) {
    try {
      const text = createBookEmbeddingText(book);
      const embedding = await generateEmbedding(text, env.GEMINI_API_KEY);
      await upsertVector(env.VECTORIZE, String(book.id), embedding);
      await new Promise((r) => setTimeout(r, 50));
    } catch (e) {
      console.warn(`Embedding failed for book ${book.id}:`, e);
    }
  }
}
