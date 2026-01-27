// Narou (小説家になろう) API クライアント

import { prisma } from '../prisma';
import { fetchWithRetry } from './base';
import type { NarouNovel, NarouApiResponse, SyncResult } from '@/app/types/book';

const NAROU_API_URL =
  'https://api.syosetu.com/novelapi/api/?out=json&of=n-t-w-s&lim=200';

export async function fetchNarouNovels(): Promise<NarouNovel[]> {
  const data = await fetchWithRetry<NarouApiResponse>(NAROU_API_URL);
  const [, ...novels] = data;
  return novels;
}

export async function syncNarouToBooks(): Promise<SyncResult> {
  try {
    const novels = await fetchNarouNovels();
    let created = 0;
    let updated = 0;

    for (const novel of novels) {
      const bookData = {
        source: 'NAROU' as const,
        sourceId: novel.ncode,
        title: novel.title,
        author: novel.writer,
        description: novel.story,
        url: `https://ncode.syosetu.com/${novel.ncode.toLowerCase()}/`,
        metadata: { userid: novel.userid },
      };

      const existing = await prisma.book.findUnique({
        where: {
          source_sourceId: { source: 'NAROU', sourceId: novel.ncode },
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

    return {
      success: true,
      source: 'NAROU',
      message: `Synced ${created} new, ${updated} updated`,
      created,
      updated,
    };
  } catch (error) {
    return {
      success: false,
      source: 'NAROU',
      message: error instanceof Error ? error.message : 'Unknown error',
      created: 0,
      updated: 0,
      errors: [String(error)],
    };
  }
}
