import { fetchWithRetry } from './base';
import type { AozoraResponse } from '../../types/book';

const AOZORA_API_BASE = 'https://api.bungomail.com/v0/books';
const LIMIT = 50;

export async function fetchAozoraBooks(after?: string): Promise<AozoraResponse> {
  const url = after
    ? `${AOZORA_API_BASE}?limit=${LIMIT}&after=${after}`
    : `${AOZORA_API_BASE}?limit=${LIMIT}`;
  return fetchWithRetry<AozoraResponse>(url);
}
