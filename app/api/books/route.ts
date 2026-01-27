import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { DataSource } from '@/app/types/book';

export const dynamic = 'force-dynamic';

/**
 * フロントエンド用: DBから書籍データを取得
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const source = searchParams.get('source') as DataSource | null;
  const limit = parseInt(searchParams.get('limit') || '200');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    const where = source ? { source } : {};

    const books = await prisma.book.findMany({
      where,
      take: Math.min(limit, 500),
      skip: offset,
      orderBy: { updatedAt: 'desc' },
    });

    const total = await prisma.book.count({ where });

    return NextResponse.json({
      books,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + books.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching books:', error);
    return NextResponse.json(
      { error: 'Failed to fetch books' },
      { status: 500 }
    );
  }
}
