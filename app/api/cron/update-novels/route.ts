import { NextRequest, NextResponse } from 'next/server';
import { syncNovelsFromApi } from '@/lib/narou-api';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Vercel Hobby: 10s, Pro: 60s

/**
 * Cron Job: 1時間ごとになろうAPIから小説データを取得しDBに保存
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
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // 小説データの同期処理
  console.log('Starting novel sync from Narou API...');
  const result = await syncNovelsFromApi();

  if (result.success) {
    console.log(result.message);
    return NextResponse.json({
      success: true,
      message: result.message,
      created: result.created,
      updated: result.updated,
      timestamp: new Date().toISOString(),
    });
  } else {
    console.error(result.message);
    return NextResponse.json(
      {
        success: false,
        error: result.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
