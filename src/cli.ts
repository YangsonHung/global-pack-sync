#!/usr/bin/env node

import GlobalPackSync from './index';

async function main(): Promise<void> {
  const migrator = new GlobalPackSync();
  await migrator.run();
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error('Unhandled error:', message);
  process.exit(1);
});
