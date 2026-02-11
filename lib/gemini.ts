import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini クライアントの初期化
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * テキストをembeddingに変換
 * @param text - 変換するテキスト
 * @returns 768次元のembeddingベクトル
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: 'models/text-embedding-004' });

  const result = await model.embedContent(text);
  return result.embedding.values;
}

/**
 * 書籍情報からembedding用のテキストを生成
 */
export function createBookEmbeddingText(book: {
  title: string;
  author: string | null;
  description: string | null;
}): string {
  const parts = [
    `タイトル: ${book.title}`,
    book.author && `著者: ${book.author}`,
    book.description && `概要: ${book.description}`,
  ].filter(Boolean);

  return parts.join('\n');
}
