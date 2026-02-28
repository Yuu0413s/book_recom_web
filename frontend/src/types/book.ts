export type DataSource = 'NAROU' | 'GOOGLE_BOOKS' | 'OPEN_LIBRARY' | 'AOZORA' | 'CINII';

export interface Book {
  id: number;
  source: DataSource;
  sourceId: string;
  title: string;
  author: string | null;
  description: string | null;
  url: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface BookWithScore extends Book {
  score?: number;
}
