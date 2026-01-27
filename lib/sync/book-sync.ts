// 全ソース同期オーケストレーター

import { prisma } from '../prisma';
import { syncNarouToBooks } from '../api/narou';
import { syncGoogleBooksToBooks } from '../api/google-books';
import { syncOpenLibraryToBooks } from '../api/open-library';
import { syncAozoraToBooks } from '../api/aozora';
import { syncCiNiiToBooks } from '../api/cinii';
import type { SyncResult, FullSyncResult, DataSource } from '@/app/types/book';

export async function syncAllSources(): Promise<FullSyncResult> {
  const startTime = Date.now();
  const results: SyncResult[] = [];

  // 同期関数の定義
  const syncFunctions: Array<{
    source: DataSource;
    fn: () => Promise<SyncResult>;
  }> = [
    { source: 'NAROU', fn: syncNarouToBooks },
    { source: 'GOOGLE_BOOKS', fn: syncGoogleBooksToBooks },
    { source: 'OPEN_LIBRARY', fn: syncOpenLibraryToBooks },
    { source: 'AOZORA', fn: syncAozoraToBooks },
    { source: 'CINII', fn: syncCiNiiToBooks },
  ];

  for (const { source, fn } of syncFunctions) {
    // 同期開始をログに記録
    const logEntry = await prisma.syncLog.create({
      data: {
        source,
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });

    try {
      const result = await fn();
      results.push(result);

      // 結果をログに更新
      await prisma.syncLog.update({
        where: { id: logEntry.id },
        data: {
          status: result.success ? 'SUCCESS' : 'PARTIAL',
          created: result.created,
          updated: result.updated,
          errors: result.errors?.join('\n'),
          endedAt: new Date(),
        },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      results.push({
        success: false,
        source,
        message: errorMessage,
        created: 0,
        updated: 0,
        errors: [errorMessage],
      });

      await prisma.syncLog.update({
        where: { id: logEntry.id },
        data: {
          status: 'FAILED',
          errors: errorMessage,
          endedAt: new Date(),
        },
      });
    }
  }

  const duration = Date.now() - startTime;
  const totalCreated = results.reduce((sum, r) => sum + r.created, 0);
  const totalUpdated = results.reduce((sum, r) => sum + r.updated, 0);
  const allSuccess = results.every((r) => r.success);

  return {
    success: allSuccess,
    results,
    totalCreated,
    totalUpdated,
    duration,
  };
}
