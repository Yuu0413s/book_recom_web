import { fetchWithRetry } from './base';
import type { NarouNovel, NarouApiResponse } from '../../types/book';

const NAROU_API_URL =
  'https://api.syosetu.com/novelapi/api/?out=json&of=n-t-w-s&lim=100';

export async function fetchNarouNovels(): Promise<NarouNovel[]> {
  const data = await fetchWithRetry<NarouApiResponse>(NAROU_API_URL);
  const [, ...novels] = data;
  return novels;
}
