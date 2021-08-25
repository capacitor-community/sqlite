import { registerPlugin } from '@capacitor/core';

import type { CapacitorSQLitePlugin } from './definitions';

const CapacitorSQLite = registerPlugin<CapacitorSQLitePlugin>(
  'CapacitorSQLite',
  {
    web: () => import('./web').then(m => new m.CapacitorSQLiteWeb()),
    electron: () =>
      (window as any).CapacitorCustomPlatform.plugins.CapacitorSQLite,
  },
);

export { CapacitorSQLite };
export * from './definitions';
