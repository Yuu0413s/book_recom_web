// Aozora (青空文庫 ZORAPI) API クライアント

import { prisma } from '../prisma';
import { fetchWithRetry } from './base';
import type { AozoraResponse, SyncResult } from '@/app/types/book';

const AOZORA_API_BASE = 'https://api.bungomail.com/v0/books';
const LIMIT = 50;

export async function fetchAozoraBooks(
  after?: string
): Promise<AozoraResponse> {
  const url = after
    ? `${AOZORA_API_BASE}?limit=${LIMIT}&after=${after}`
    : `${AOZORA_API_BASE}?limit=${LIMIT}`;
  return fetchWithRetry<AozoraResponse>(url);
}

export async function syncAozoraToBooks(): Promise<SyncResult> {
  let created = 0;
  let updated = 0;
  const errors: string[] = [];
  let after: string | undefined;
  let pageCount = 0;
  const maxPages = 4; // 1回の同期で最大200件 (50 * 4)

  try {
    while (pageCount < maxPages) {
      const response = await fetchAozoraBooks(after);

      for (const book of response.books) {
        const authorName = [book.姓, book.名].filter(Boolean).join(' ');

        const bookData = {
          source: 'AOZORA' as const,
          sourceId: book.作品ID,
          title: book.作品名,
          author: authorName || null,
          description: book.書き出し || null,
          url:
            book.図書カードURL ||
            `https://www.aozora.gr.jp/cards/${book.作品ID}/`,
          metadata: {
            titleReading: book.作品名読み,
            accessCount: book.累計アクセス数,
          },
        };

        const existing = await prisma.book.findUnique({
          where: {
            source_sourceId: { source: 'AOZORA', sourceId: book.作品ID },
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

      // 次ページのオフセットを取得
      if (response.links?.next) {
        const nextUrl = new URL(response.links.next, AOZORA_API_BASE);
        after = nextUrl.searchParams.get('after') || undefined;
      } else {
        break;
      }

      pageCount++;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  } catch (error) {
    errors.push(String(error));
  }

  return {
    success: errors.length === 0,
    source: 'AOZORA',
    message: `Synced ${created} new, ${updated} updated`,
    created,
    updated,
    errors: errors.length > 0 ? errors : undefined,
  };
}
