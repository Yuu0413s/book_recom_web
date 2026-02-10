import { NextResponse } from 'next/server';
import { syncAllSources } from '@/lib/sync/book-sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * 初期データ投入用エンドポイント（一時的）
 *
 * 使用方法: ブラウザで https://your-domain.vercel.app/api/seed にアクセス
 *
 * 注意: データ投入後、このファイルを削除してください
 */
export async function GET() {
  console.log('Starting manual data seed...');
  const result = await syncAllSources();

  if (result.success) {
    console.log(
      `Seed completed: ${result.totalCreated} created, ${result.totalUpdated} updated in ${result.duration}ms`
    );
    return NextResponse.json({
      success: true,
      message: `Successfully seeded data: ${result.totalCreated} created, ${result.totalUpdated} updated`,
      results: result.results,
      duration: result.duration,
      timestamp: new Date().toISOString(),
    });
  } else {
    const failedSources = result.results
      .filter((r) => !r.success)
      .map((r) => r.source);

    console.error(`Seed partially failed. Failed sources: ${failedSources.join(', ')}`);
    return NextResponse.json(
      {
        success: false,
        message: `Partial seed failure. Failed: ${failedSources.join(', ')}`,
        results: result.results,
        duration: result.duration,
        timestamp: new Date().toISOString(),
      },
      { status: 207 }
    );
  }
}
