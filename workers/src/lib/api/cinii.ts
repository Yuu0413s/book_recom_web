import { fetchWithRetry } from './base';
import type { CiNiiResponse } from '../../types/book';

const CINII_API_BASE = 'https://ci.nii.ac.jp/books/opensearch/search';
export const CINII_KEYWORDS = ['小説', 'ファンタジー', 'SF', '恋愛'];
const COUNT = 25;

export async function fetchCiNiiBooks(keyword: string): Promise<CiNiiResponse> {
  const url = `${CINII_API_BASE}?q=${encodeURIComponent(keyword)}&format=json&count=${COUNT}`;
  return fetchWithRetry<CiNiiResponse>(url);
}
