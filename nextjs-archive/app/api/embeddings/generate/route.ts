import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateEmbedding, createBookEmbeddingText } from '@/lib/gemini';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

/**
 * 既存の書籍データに埋め込みを生成するエンドポイント
 *
 * このエンドポイントは一時的なもので、初回のembedding生成後は削除してください
 */
async function generateEmbeddings() {
  try {
    // embedding が null の書籍を取得
    const books = await prisma.book.findMany({
      where: {
        // embeddingがnullまたは未設定の書籍
        // Prismaではvectorカラムを直接フィルタリングできないため、
        // 全件取得してから生SQLで更新する方法を使用
      },
      select: {
        id: true,
        title: true,
        author: true,
        description: true,
      },
    });

    console.log(`Found ${books.length} books to process`);

    let processed = 0;
    let errors = 0;

    // バッチ処理（Gemini APIのレート制限を考慮）
    for (const book of books) {
      try {
        const embeddingText = createBookEmbeddingText(book);
        const embedding = await generateEmbedding(embeddingText);

        // 生SQLでembeddingを更新
        await prisma.$executeRaw`
          UPDATE "Book"
          SET embedding = ${`[${embedding.join(',')}]`}::vector
          WHERE id = ${book.id}
        `;

        processed++;

        // ログ出力（進捗確認用）
        if (processed % 10 === 0) {
          console.log(`Processed ${processed}/${books.length} books`);
        }

        // レート制限対策：50ms待機
        await new Promise((resolve) => setTimeout(resolve, 50));
      } catch (error) {
        console.error(`Error processing book ${book.id}:`, error);
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Embeddings generated for ${processed} books`,
      processed,
      errors,
      total: books.length,
    });
  } catch (error) {
    console.error('Embedding generation error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to generate embeddings',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

// POSTメソッド
export async function POST() {
  return generateEmbeddings();
}

// GETメソッド（ブラウザから直接アクセス可能）
export async function GET() {
  return generateEmbeddings();
}
