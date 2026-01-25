import { prisma } from './prisma';

const NAROU_API_URL = 'https://api.syosetu.com/novelapi/api/?out=json&of=n-t-w-s&lim=200';

interface NarouNovel {
  title: string;
  ncode: string;
  userid: number;
  writer: string;
  story: string;
}

type NarouApiResponse = [{ allcount: number }, ...NarouNovel[]];

/**
 * なろうAPIから小説データを取得
 */
export async function fetchNovelsFromApi(): Promise<NarouNovel[]> {
  const response = await fetch(NAROU_API_URL, {
    headers: {
      'User-Agent': 'book_recom_web/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`なろうAPI エラー: ${response.status} ${response.statusText}`);
  }

  const data: NarouApiResponse = await response.json();
  const [, ...novels] = data;
  return novels;
}

/**
 * 小説データをDBにUpsert（存在すれば更新、なければ作成）
 */
export async function upsertNovels(novels: NarouNovel[]): Promise<{
  created: number;
  updated: number;
}> {
  let created = 0;
  let updated = 0;

  for (const novel of novels) {
    const url = `https://ncode.syosetu.com/${novel.ncode.toLowerCase()}/`;

    const existing = await prisma.novel.findUnique({
      where: { ncode: novel.ncode },
    });

    if (existing) {
      await prisma.novel.update({
        where: { ncode: novel.ncode },
        data: {
          title: novel.title,
          writer: novel.writer,
          userid: novel.userid,
          story: novel.story,
          url,
        },
      });
      updated++;
    } else {
      await prisma.novel.create({
        data: {
          ncode: novel.ncode,
          title: novel.title,
          writer: novel.writer,
          userid: novel.userid,
          story: novel.story,
          url,
        },
      });
      created++;
    }
  }

  return { created, updated };
}

/**
 * APIからデータを取得し、DBに保存するメイン関数
 */
export async function syncNovelsFromApi(): Promise<{
  success: boolean;
  message: string;
  created: number;
  updated: number;
}> {
  try {
    const novels = await fetchNovelsFromApi();
    const result = await upsertNovels(novels);

    return {
      success: true,
      message: `同期完了: ${result.created}件作成, ${result.updated}件更新`,
      ...result,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : '不明なエラー';
    return {
      success: false,
      message: `同期失敗: ${message}`,
      created: 0,
      updated: 0,
    };
  }
}
