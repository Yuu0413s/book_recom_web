// 統一Book型定義

export type DataSource = 'NAROU' | 'GOOGLE_BOOKS' | 'OPEN_LIBRARY' | 'AOZORA' | 'CINII';

// 統一Book型
export interface Book {
  id: number;
  source: DataSource;
  sourceId: string;
  title: string;
  author: string | null;
  description: string | null;
  url: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookWithScore extends Book {
  score?: number;
}

// Narou API レスポンス型
export interface NarouNovel {
  title: string;
  ncode: string;
  userid: number;
  writer: string;
  story: string;
}

export type NarouApiResponse = [{ allcount: number }, ...NarouNovel[]];

// Google Books API レスポンス型
export interface GoogleBooksResponse {
  items?: GoogleBookItem[];
}

export interface GoogleBookItem {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    description?: string;
  };
}

// Open Library API レスポンス型
export interface OpenLibraryResponse {
  numFound: number;
  start: number;
  docs: OpenLibraryDoc[];
}

export interface OpenLibraryDoc {
  key: string;
  title: string;
  author_name?: string[];
}

// Aozora (ZORAPI) API レスポンス型
export interface AozoraResponse {
  books: AozoraBook[];
  links?: {
    next?: string;
    prev?: string;
  };
}

export interface AozoraBook {
  作品ID: string;
  作品名: string;
  作品名読み?: string;
  書き出し?: string;
  図書カードURL?: string;
  姓?: string;
  名?: string;
  累計アクセス数?: number;
}

// CiNii Books API レスポンス型
export interface CiNiiResponse {
  '@context'?: Record<string, string>;
  '@graph'?: CiNiiGraph[];
}

export interface CiNiiGraph {
  'opensearch:totalResults'?: number;
  items?: CiNiiItem[];
}

export interface CiNiiItem {
  '@id': string;
  title: string;
  'dc:creator'?: string | string[];
  'dc:publisher'?: string;
}

// 同期結果型
export interface SyncResult {
  success: boolean;
  source: DataSource;
  message: string;
  created: number;
  updated: number;
  errors?: string[];
}

// 全体同期結果型
export interface FullSyncResult {
  success: boolean;
  results: SyncResult[];
  totalCreated: number;
  totalUpdated: number;
  duration: number;
}
