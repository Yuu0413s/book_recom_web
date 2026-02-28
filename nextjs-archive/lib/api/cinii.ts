// CiNii Books API クライアント

import { prisma } from '../prisma';
import { fetchWithRetry } from './base';
import type { CiNiiResponse, SyncResult } from '@/app/types/book';

const CINII_API_BASE = 'https://ci.nii.ac.jp/books/opensearch/search';
const SEARCH_KEYWORDS = ['小説', 'ファンタジー', 'SF', '恋愛'];
const COUNT = 25; // 25件 × 4キーワード = 100件

export async function fetchCiNiiBooks(keyword: string): Promise<CiNiiResponse> {
  const url = `${CINII_API_BASE}?q=${encodeURIComponent(keyword)}&format=json&count=${COUNT}`;
  return fetchWithRetry<CiNiiResponse>(url);
}

export async function syncCiNiiToBooks(): Promise<SyncResult> {
  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const keyword of SEARCH_KEYWORDS) {
    try {
      const response = await fetchCiNiiBooks(keyword);
      const graph = response['@graph']?.[0];
      const items = graph?.items || [];

      for (const item of items) {
        // @id URLからNCIDを抽出
        const ncidMatch = item['@id'].match(/ncid\/([A-Z0-9]+)/i);
        const sourceId = ncidMatch?.[1] || item['@id'];

        const creator = item['dc:creator'];
        const author = Array.isArray(creator)
          ? creator.join(', ')
          : creator || null;

        const bookData = {
          source: 'CINII' as const,
          sourceId,
          title: item.title,
          author,
          description: null, // CiNiiの検索ではdescriptionは返らない
          url: item['@id'],
          metadata: {
            keyword,
            publisher: item['dc:publisher'],
          },
        };

        const existing = await prisma.book.findUnique({
          where: {
            source_sourceId: { source: 'CINII', sourceId },
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
    source: 'CINII',
    message: `Synced ${created} new, ${updated} updated`,
    created,
    updated,
    errors: errors.length > 0 ? errors : undefined,
  };
}
