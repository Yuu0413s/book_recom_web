import OpenAI from 'openai';

// OpenAI クライアントの初期化
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * テキストをembeddingに変換
 * @param text - 変換するテキスト
 * @returns 1536次元のembeddingベクトル
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });

  return response.data[0].embedding;
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
