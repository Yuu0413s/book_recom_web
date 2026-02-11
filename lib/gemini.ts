/**
 * テキストをembeddingに変換（REST API直接使用）
 * @param text - 変換するテキスト
 * @returns 768次元のembeddingベクトル
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: {
          parts: [{ text }],
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.embedding.values;
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
