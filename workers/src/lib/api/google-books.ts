import { fetchWithRetry } from './base';
import type { GoogleBooksResponse } from '../../types/book';

const GOOGLE_BOOKS_BASE = 'https://www.googleapis.com/books/v1/volumes';
export const GOOGLE_BOOKS_KEYWORDS = ['小説', 'ファンタジー', 'SF', '恋愛', 'ミステリー'];
const MAX_RESULTS = 20;

export async function fetchGoogleBooks(keyword: string): Promise<GoogleBooksResponse> {
  const url = `${GOOGLE_BOOKS_BASE}?q=${encodeURIComponent(keyword)}&maxResults=${MAX_RESULTS}&fields=items(id,volumeInfo(title,authors,description))`;
  return fetchWithRetry<GoogleBooksResponse>(url);
}
