import { WebPlugin } from '@capacitor/core';
import {
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
  async open(options: capSQLiteOptions): Promise<capSQLiteResult> {
    console.log('open', options);
    return Promise.resolve({
      result: false,
      message: `Not implemented on Web Platform`,
    });
  }
  async close(options: capSQLiteOptions): Promise<capSQLiteResult> {
    console.log('close', options);
    return Promise.resolve({
      result: false,
      message: `Not implemented on Web Platform`,
    });
  }
  async execute(options: capSQLiteExecuteOptions): Promise<capSQLiteChanges> {
    console.log('execute', options);
    return Promise.resolve({
      result: false,
      message: `Not implemented on Web Platform`,
    });
  }
  async executeSet(options: capSQLiteSetOptions): Promise<capSQLiteChanges> {
    console.log('execute', options);
    return Promise.resolve({
      result: false,
      message: `Not implemented on Web Platform`,
    });
  }
  async run(options: capSQLiteRunOptions): Promise<capSQLiteChanges> {
    console.log('run', options);
    return Promise.resolve({
      result: false,
      message: `Not implemented on Web Platform`,
    });
  }
  async query(options: capSQLiteQueryOptions): Promise<capSQLiteValues> {
    console.log('query', options);
    return Promise.resolve({
      result: false,
      message: `Not implemented on Web Platform`,
    });
  }
  async isDBExists(options: capSQLiteOptions): Promise<capSQLiteResult> {
    console.log('in Web isDBExists', options);
    return Promise.resolve({
      result: false,
      message: `Not implemented on Web Platform`,
    });
  }
  async deleteDatabase(options: capSQLiteOptions): Promise<capSQLiteResult> {
    console.log('deleteDatabase', options);
    return Promise.resolve({
      result: false,
      message: `Not implemented on Web Platform`,
    });
  }
  async isJsonValid(options: capSQLiteImportOptions): Promise<capSQLiteResult> {
    console.log('isJsonValid', options);
    return Promise.resolve({
      result: false,
      message: `Not implemented on Web Platform`,
    });
  }

  async importFromJson(
    options: capSQLiteImportOptions,
  ): Promise<capSQLiteChanges> {
    console.log('importFromJson', options);
    return Promise.resolve({
      result: false,
      message: `Not implemented on Web Platform`,
    });
  }
  async exportToJson(options: capSQLiteExportOptions): Promise<capSQLiteJson> {
    console.log('exportToJson', options);
    return Promise.resolve({
      result: false,
      message: `Not implemented on Web Platform`,
    });
  }
  async createSyncTable(): Promise<capSQLiteChanges> {
    console.log('createSyncTable');
    return Promise.resolve({
      result: false,
      message: `Not implemented on Web Platform`,
    });
  }
  async setSyncDate(
    options: capSQLiteSyncDateOptions,
  ): Promise<capSQLiteResult> {
    console.log('setSyncDate', options);
    return Promise.resolve({
      result: false,
      message: `Not implemented on Web Platform`,
    });
  }
  async addUpgradeStatement(
    options: capSQLiteUpgradeOptions,
  ): Promise<capSQLiteResult> {
    console.log('addUpgradeStatement', options);
    return Promise.resolve({
      result: false,
      message: `Not implemented on Web Platform`,
    });
  }
}

const CapacitorSQLite = new CapacitorSQLiteWeb();

export { CapacitorSQLite };

import { registerWebPlugin } from '@capacitor/core';
registerWebPlugin(CapacitorSQLite);
