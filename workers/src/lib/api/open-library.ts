import { fetchWithRetry } from './base';
import type { OpenLibraryResponse } from '../../types/book';

const OPEN_LIBRARY_BASE = 'https://openlibrary.org/search.json';
export const OPEN_LIBRARY_KEYWORDS = ['japanese novel', 'fantasy fiction', 'science fiction', 'romance'];
const LIMIT = 25;

export async function fetchOpenLibraryBooks(keyword: string): Promise<OpenLibraryResponse> {
  const url = `${OPEN_LIBRARY_BASE}?q=${encodeURIComponent(keyword)}&fields=key,title,author_name&limit=${LIMIT}`;
  return fetchWithRetry<OpenLibraryResponse>(url, { timeout: 15000 });
}
