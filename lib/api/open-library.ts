// Open Library API クライアント

import { prisma } from '../prisma';
import { fetchWithRetry } from './base';
import type { OpenLibraryResponse, SyncResult } from '@/app/types/book';

const OPEN_LIBRARY_BASE = 'https://openlibrary.org/search.json';
const SEARCH_KEYWORDS = [
  'japanese novel',
  'fantasy fiction',
  'science fiction',
  'romance',
];
const LIMIT = 200;

export async function fetchOpenLibraryBooks(
  keyword: string
): Promise<OpenLibraryResponse> {
  const url = `${OPEN_LIBRARY_BASE}?q=${encodeURIComponent(keyword)}&fields=key,title,author_name&limit=${LIMIT}`;
  return fetchWithRetry<OpenLibraryResponse>(url, { timeout: 15000 });
}

export async function syncOpenLibraryToBooks(): Promise<SyncResult> {
  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const keyword of SEARCH_KEYWORDS) {
    try {
      const response = await fetchOpenLibraryBooks(keyword);

      for (const doc of response.docs) {
        // keyからwork IDを抽出 (e.g., "/works/OL15437W" -> "OL15437W")
        const workId = doc.key.replace('/works/', '');

        const bookData = {
          source: 'OPEN_LIBRARY' as const,
          sourceId: workId,
          title: doc.title,
          author: doc.author_name?.join(', ') || null,
          description: null, // Search APIはdescriptionを返さない
          url: `https://openlibrary.org${doc.key}`,
          metadata: { keyword },
        };

        const existing = await prisma.book.findUnique({
          where: {
            source_sourceId: { source: 'OPEN_LIBRARY', sourceId: workId },
          },
        });

        if (existing) {
          await prisma.book.update({
            where: { id: existing.id },
            data: bookData,
          });
          updated++;
        } else {
          await prisma.book.create({ data: bookData });
          created++;
        }
      }

      // レート制限対策
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      errors.push(`Keyword "${keyword}": ${error}`);
    }
  }

  return {
    success: errors.length === 0,
    source: 'OPEN_LIBRARY',
    message: `Synced ${created} new, ${updated} updated`,
    created,
    updated,
    errors: errors.length > 0 ? errors : undefined,
  };
}
