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
  capSQLiteUpgradeOptions,
  capSQLiteTableOptions,
  capSQLitePathOptions,
  capEchoResult,
  capSQLiteResult,
  capSQLiteChanges,
  capSQLiteValues,
  capSQLiteJson,
  capSQLiteSyncDate,
  capAllConnectionsOptions,
  capSetSecretOptions,
  capChangeSecretOptions,
} from './definitions';

export class CapacitorSQLiteWeb
  extends WebPlugin
  implements CapacitorSQLitePlugin {
  async echo(options: capEchoOptions): Promise<capEchoResult> {
    console.log('ECHO in Web plugin', options);
    return options;
  }
  async isSecretStored(): Promise<capSQLiteResult> {
    console.log('isSecretStored');
    throw this.unimplemented('Not implemented on web.');
  }
  async setEncryptionSecret(options: capSetSecretOptions): Promise<void> {
    console.log('setEncryptionSecret', options);
    throw this.unimplemented('Not implemented on web.');
  }
  async changeEncryptionSecret(options: capChangeSecretOptions): Promise<void> {
    console.log('changeEncryptionSecret', options);
    throw this.unimplemented('Not implemented on web.');
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
  async checkConnectionsConsistency(
    options: capAllConnectionsOptions,
  ): Promise<capSQLiteResult> {
    console.log('checkConsistency', options);
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
  async isDBOpen(options: capSQLiteOptions): Promise<capSQLiteResult> {
    console.log('in Web isDBOpen', options);
    throw this.unimplemented('Not implemented on web.');
  }
  async isDatabase(options: capSQLiteOptions): Promise<capSQLiteResult> {
    console.log('in Web isDatabase', options);
    throw this.unimplemented('Not implemented on web.');
  }

  async isTableExists(
    options: capSQLiteTableOptions,
  ): Promise<capSQLiteResult> {
    console.log('in Web isTableExists', options);
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
  async getDatabaseList(): Promise<capSQLiteValues> {
    throw this.unimplemented('Not implemented on web.');
  }
  async addSQLiteSuffix(options: capSQLitePathOptions): Promise<void> {
    console.log('addSQLiteSuffix', options);
    throw this.unimplemented('Not implemented on web.');
  }
  async deleteOldDatabases(options: capSQLitePathOptions): Promise<void> {
    console.log('deleteOldDatabases', options);
    throw this.unimplemented('Not implemented on web.');
  }
}
