import { NextRequest, NextResponse } from 'next/server';
import { syncAllSources } from '@/lib/sync/book-sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Vercel Hobby: 10s, Pro: 60s

/**
 * Cron Job: 定期的に全APIソースからデータを取得しDBに保存
 *
 * Vercel Cronから呼び出される。外部からの不正アクセス防止のため
 * CRON_SECRET による認証ガードを実装。
 */
export async function GET(request: NextRequest) {
  // 認証チェック
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('CRON_SECRET is not configured');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.warn('Unauthorized cron access attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 全ソースのデータ同期処理
  console.log('Starting multi-source book sync...');
  const result = await syncAllSources();

  if (result.success) {
    console.log(
      `Sync completed: ${result.totalCreated} created, ${result.totalUpdated} updated in ${result.duration}ms`
    );
    return NextResponse.json({
      success: true,
      message: `Synced all sources: ${result.totalCreated} created, ${result.totalUpdated} updated`,
      results: result.results,
      duration: result.duration,
      timestamp: new Date().toISOString(),
    });
  } else {
    const failedSources = result.results
      .filter((r) => !r.success)
      .map((r) => r.source);

    console.error(`Sync partially failed. Failed sources: ${failedSources.join(', ')}`);
    return NextResponse.json(
      {
        success: false,
        message: `Partial sync failure. Failed: ${failedSources.join(', ')}`,
        results: result.results,
        duration: result.duration,
        timestamp: new Date().toISOString(),
      },
      { status: 207 } // Multi-Status
    );
  }
}
