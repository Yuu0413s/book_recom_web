export async function generateEmbedding(text: string, apiKey: string): Promise<number[]> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: { parts: [{ text }] },
        outputDimensionality: 768,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json<{ embedding: { values: number[] } }>();
  return data.embedding.values;
}

export function createBookEmbeddingText(book: {
  title: string;
  author: string | null;
  description: string | null;
}): string {
  return [
    `タイトル: ${book.title}`,
    book.author && `著者: ${book.author}`,
    book.description && `概要: ${book.description}`,
  ]
    .filter(Boolean)
    .join('\n');
}
