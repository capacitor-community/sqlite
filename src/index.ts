import { registerPlugin } from '@capacitor/core';

import type { CapacitorSQLitePlugin } from './definitions';

const CapacitorSQLite = registerPlugin<CapacitorSQLitePlugin>('CapacitorSQLite', {
  web: () => import('./web').then((m) => new m.CapacitorSQLiteWeb()),
  electron: () => (window as any).CapacitorCustomPlatform.plugins.CapacitorSQLite,
});

export { CapacitorSQLite };
export * from './definitions';
// Additive web-only exports. They do not appear in CapacitorSQLitePlugin and change no existing
// signature; they exist so bundlers that cannot resolve the shipped worker can supply their own.
export { setSqliteWorkerFactory, setSqliteWebOptions } from './web/worker-factory';
export type { SqliteWorkerFactory } from './web/worker-factory';
export { setSqliteLocalDiskAdapter } from './web/localdisk';
export type { LocalDiskAdapter, PickedFile } from './web/localdisk';
