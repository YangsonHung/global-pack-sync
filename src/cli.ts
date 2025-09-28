#!/usr/bin/env node

import NpmMigrate from './index';

async function main(): Promise<void> {
  const migrator = new NpmMigrate();
  await migrator.run();
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error('Unhandled error:', message);
  process.exit(1);
});
