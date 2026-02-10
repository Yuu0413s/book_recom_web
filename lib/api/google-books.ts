// Google Books API クライアント

import { prisma } from '../prisma';
import { fetchWithRetry } from './base';
import type { GoogleBooksResponse, SyncResult } from '@/app/types/book';

const GOOGLE_BOOKS_BASE = 'https://www.googleapis.com/books/v1/volumes';
const SEARCH_KEYWORDS = ['小説', 'ファンタジー', 'SF', '恋愛', 'ミステリー'];
const MAX_RESULTS = 20; // 20件 × 5キーワード = 100件

export async function fetchGoogleBooks(
  keyword: string
): Promise<GoogleBooksResponse> {
  const url = `${GOOGLE_BOOKS_BASE}?q=${encodeURIComponent(keyword)}&maxResults=${MAX_RESULTS}&fields=items(id,volumeInfo(title,authors,description))`;
  return fetchWithRetry<GoogleBooksResponse>(url);
}

export async function syncGoogleBooksToBooks(): Promise<SyncResult> {
  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const keyword of SEARCH_KEYWORDS) {
    try {
      const response = await fetchGoogleBooks(keyword);

      if (!response.items) continue;

      for (const item of response.items) {
        const bookData = {
          source: 'GOOGLE_BOOKS' as const,
          sourceId: item.id,
          title: item.volumeInfo.title,
          author: item.volumeInfo.authors?.join(', ') || null,
          description: item.volumeInfo.description || null,
          url: `https://books.google.com/books?id=${item.id}`,
          metadata: { keyword },
        };

        const existing = await prisma.book.findUnique({
          where: {
            source_sourceId: { source: 'GOOGLE_BOOKS', sourceId: item.id },
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

      // レート制限対策: キーワード間に遅延
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      errors.push(`Keyword "${keyword}": ${error}`);
    }
  }

  return {
    success: errors.length === 0,
    source: 'GOOGLE_BOOKS',
    message: `Synced ${created} new, ${updated} updated`,
    created,
    updated,
    errors: errors.length > 0 ? errors : undefined,
  };
}
