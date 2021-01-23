import { WebPlugin } from '@capacitor/core';

import type {
  CapacitorSQLitePlugin,
  capEchoOptions,
  capSQLiteOptions,
  capSQLiteExecuteOptions,
  capSQLiteSetOptions,
  capSQLiteRunOptions,
  capSQLiteQueryOptions,
  capSQLiteImportOptions,
  capSQLiteExportOptions,
  capSQLiteSyncDateOptions,
  capEchoResult,
  capSQLiteResult,
  capSQLiteChanges,
  capSQLiteValues,
  capSQLiteJson,
  capSQLiteUpgradeOptions,
  capSQLiteSyncDate,
} from './definitions';

export class CapacitorSQLiteWeb
  extends WebPlugin
  implements CapacitorSQLitePlugin {
  constructor() {
    super({
      name: 'CapacitorSQLite',
      platforms: ['web'],
    });
  }

  async echo(options: capEchoOptions): Promise<capEchoResult> {
    console.log('ECHO in Web plugin', options);
    return options;
  }
  async createConnection(options: capSQLiteOptions): Promise<void> {
    console.log('createConnection', options);
    throw this.unimplemented('Not implemented on web.');
  }
  async open(options: capSQLiteOptions): Promise<void> {
    console.log('open', options);
    throw this.unimplemented('Not implemented on web.');
  }
  async closeConnection(options: capSQLiteOptions): Promise<void> {
    console.log('closeConnection', options);
    throw this.unimplemented('Not implemented on web.');
  }
  async close(options: capSQLiteOptions): Promise<void> {
    console.log('close', options);
    throw this.unimplemented('Not implemented on web.');
  }
  async execute(options: capSQLiteExecuteOptions): Promise<capSQLiteChanges> {
    console.log('execute', options);
    throw this.unimplemented('Not implemented on web.');
  }
  async executeSet(options: capSQLiteSetOptions): Promise<capSQLiteChanges> {
    console.log('execute', options);
    throw this.unimplemented('Not implemented on web.');
  }
  async run(options: capSQLiteRunOptions): Promise<capSQLiteChanges> {
    console.log('run', options);
    throw this.unimplemented('Not implemented on web.');
  }
  async query(options: capSQLiteQueryOptions): Promise<capSQLiteValues> {
    console.log('query', options);
    throw this.unimplemented('Not implemented on web.');
  }
  async isDBExists(options: capSQLiteOptions): Promise<capSQLiteResult> {
    console.log('in Web isDBExists', options);
    throw this.unimplemented('Not implemented on web.');
  }
  async deleteDatabase(options: capSQLiteOptions): Promise<void> {
    console.log('deleteDatabase', options);
    throw this.unimplemented('Not implemented on web.');
  }
  async isJsonValid(options: capSQLiteImportOptions): Promise<capSQLiteResult> {
    console.log('isJsonValid', options);
    throw this.unimplemented('Not implemented on web.');
  }

  async importFromJson(
    options: capSQLiteImportOptions,
  ): Promise<capSQLiteChanges> {
    console.log('importFromJson', options);
    throw this.unimplemented('Not implemented on web.');
  }
  async exportToJson(options: capSQLiteExportOptions): Promise<capSQLiteJson> {
    console.log('exportToJson', options);
    throw this.unimplemented('Not implemented on web.');
  }
  async createSyncTable(options: capSQLiteOptions): Promise<capSQLiteChanges> {
    console.log('createSyncTable', options);
    throw this.unimplemented('Not implemented on web.');
  }
  async setSyncDate(options: capSQLiteSyncDateOptions): Promise<void> {
    console.log('setSyncDate', options);
    throw this.unimplemented('Not implemented on web.');
  }
  async getSyncDate(options: capSQLiteOptions): Promise<capSQLiteSyncDate> {
    console.log('getSyncDate', options);
    throw this.unimplemented('Not implemented on web.');
  }
  async addUpgradeStatement(options: capSQLiteUpgradeOptions): Promise<void> {
    console.log('addUpgradeStatement', options);
    throw this.unimplemented('Not implemented on web.');
  }
  async copyFromAssets(): Promise<void> {
    console.log('copyFromAssets');
    throw this.unimplemented('Not implemented on web.');
  }
}
