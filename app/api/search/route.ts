import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateEmbedding } from '@/lib/gemini';

export const dynamic = 'force-dynamic';

/**
 * セマンティック検索API
 * Gemini Embeddingsを使用して意味的な類似度で書籍を検索
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const limit = parseInt(searchParams.get('limit') || '10');

  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter "q" is required' },
      { status: 400 }
    );
  }

  try {
    // クエリのembeddingを生成
    const queryEmbedding = await generateEmbedding(query);

    // Pgvectorを使用してコサイン類似度で検索
    // embedding IS NOT NULL で、embeddingが設定されている書籍のみを検索
    const results = await prisma.$queryRaw<
      Array<{
        id: number;
        source: string;
        sourceid: string;
        title: string;
        author: string | null;
        description: string | null;
        url: string | null;
        metadata: any;
        createdat: Date;
        updatedat: Date;
        similarity: number;
      }>
    >`
      SELECT
        id,
        source,
        "sourceId" as sourceid,
        title,
        author,
        description,
        url,
        metadata,
        "createdAt" as createdat,
        "updatedAt" as updatedat,
        1 - (embedding <=> ${`[${queryEmbedding.join(',')}]`}::vector) as similarity
      FROM "Book"
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> ${`[${queryEmbedding.join(',')}]`}::vector
      LIMIT ${limit}
    `;

    // 結果をフォーマット
    const books = results.map((row) => ({
      id: row.id,
      source: row.source,
      sourceId: row.sourceid,
      title: row.title,
      author: row.author,
      description: row.description,
      url: row.url,
      metadata: row.metadata,
      createdAt: row.createdat,
      updatedAt: row.updatedat,
      similarity: row.similarity,
    }));

    return NextResponse.json({
      query,
      books,
      count: books.length,
    });
  } catch (error) {
    console.error('Semantic search error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to perform semantic search',
        message: errorMessage,
        hint: 'Ensure pgvector extension is enabled and embeddings are generated for books',
      },
      { status: 500 }
    );
  }
}
