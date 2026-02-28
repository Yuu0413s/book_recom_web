export interface BookRow {
  id: number;
  source: string;
  source_id: string;
  title: string;
  author: string | null;
  description: string | null;
  url: string | null;
  metadata: string | null;
  created_at: string;
  updated_at: string;
}

function toBook(row: BookRow) {
  return {
    id: row.id,
    source: row.source,
    sourceId: row.source_id,
    title: row.title,
    author: row.author,
    description: row.description,
    url: row.url,
    metadata: row.metadata ? JSON.parse(row.metadata) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getBooks(
  db: D1Database,
  opts: { source?: string | null; limit: number; offset: number }
) {
  const { source, limit, offset } = opts;
  let result;
  if (source) {
    result = await db
      .prepare('SELECT * FROM books WHERE source = ? ORDER BY updated_at DESC LIMIT ? OFFSET ?')
      .bind(source, limit, offset)
      .all<BookRow>();
  } else {
    result = await db
      .prepare('SELECT * FROM books ORDER BY updated_at DESC LIMIT ? OFFSET ?')
      .bind(limit, offset)
      .all<BookRow>();
  }
  return result.results.map(toBook);
}

export async function countBooks(
  db: D1Database,
  opts: { source?: string | null }
) {
  const { source } = opts;
  if (source) {
    const r = await db
      .prepare('SELECT COUNT(*) as c FROM books WHERE source = ?')
      .bind(source)
      .first<{ c: number }>();
    return r?.c ?? 0;
  }
  const r = await db.prepare('SELECT COUNT(*) as c FROM books').first<{ c: number }>();
  return r?.c ?? 0;
}

export async function getBooksById(db: D1Database, ids: number[]) {
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => '?').join(',');
  const result = await db
    .prepare(`SELECT * FROM books WHERE id IN (${placeholders})`)
    .bind(...ids)
    .all<BookRow>();
  return result.results.map(toBook);
}

export async function upsertBook(
  db: D1Database,
  book: {
    source: string;
    sourceId: string;
    title: string;
    author: string | null;
    description: string | null;
    url: string | null;
    metadata: Record<string, unknown> | null;
  }
): Promise<{ id: number; isNew: boolean }> {
  const existing = await db
    .prepare('SELECT id FROM books WHERE source = ? AND source_id = ?')
    .bind(book.source, book.sourceId)
    .first<{ id: number }>();

  const metadataJson = book.metadata ? JSON.stringify(book.metadata) : null;

  if (existing) {
    await db
      .prepare(
        'UPDATE books SET title=?, author=?, description=?, url=?, metadata=?, updated_at=CURRENT_TIMESTAMP WHERE id=?'
      )
      .bind(book.title, book.author, book.description, book.url, metadataJson, existing.id)
      .run();
    return { id: existing.id, isNew: false };
  } else {
    const result = await db
      .prepare(
        'INSERT INTO books (source, source_id, title, author, description, url, metadata) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(book.source, book.sourceId, book.title, book.author, book.description, book.url, metadataJson)
      .run();
    return { id: result.meta.last_row_id as number, isNew: true };
  }
}

export async function createSyncLog(db: D1Database, source: string): Promise<number> {
  const result = await db
    .prepare('INSERT INTO sync_logs (source, status, started_at) VALUES (?, ?, CURRENT_TIMESTAMP)')
    .bind(source, 'RUNNING')
    .run();
  return result.meta.last_row_id as number;
}

export async function updateSyncLog(
  db: D1Database,
  id: number,
  data: { status: string; created: number; updated: number; errors?: string }
) {
  await db
    .prepare(
      'UPDATE sync_logs SET status=?, created=?, updated=?, errors=?, ended_at=CURRENT_TIMESTAMP WHERE id=?'
    )
    .bind(data.status, data.created, data.updated, data.errors ?? null, id)
    .run();
}
