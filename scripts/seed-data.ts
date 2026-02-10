// 一時的なデータ投入スクリプト
// 各APIから100件ずつデータを取得してDBに保存

import { syncAllSources } from '../lib/sync/book-sync';

async function main() {
  console.log('Starting data synchronization from all sources...');
  console.log('This will fetch ~100 books from each API source.\n');

  const result = await syncAllSources();

  console.log('\n========== Sync Complete ==========');
  console.log(`Total Created: ${result.totalCreated}`);
  console.log(`Total Updated: ${result.totalUpdated}`);
  console.log(`Duration: ${result.duration}ms`);
  console.log(`Overall Success: ${result.success}`);
  console.log('\nResults by source:');

  result.results.forEach((r) => {
    console.log(`\n[${r.source}]`);
    console.log(`  Success: ${r.success}`);
    console.log(`  Created: ${r.created}`);
    console.log(`  Updated: ${r.updated}`);
    if (r.errors) {
      console.log(`  Errors: ${r.errors.join(', ')}`);
    }
  });

  process.exit(result.success ? 0 : 1);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
