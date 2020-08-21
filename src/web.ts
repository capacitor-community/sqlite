import { WebPlugin } from '@capacitor/core';
import {
  CapacitorSQLitePlugin,
  capSQLiteOptions,
  capSQLiteResult,
  capSQLiteVersionUpgrade,
} from './definitions';

export class CapacitorSQLiteWeb extends WebPlugin
  implements CapacitorSQLitePlugin {
  constructor() {
    super({
      name: 'CapacitorSQLite',
      platforms: ['web'],
    });
  }

  async echo(options: { value: string }): Promise<{ value: string }> {
    console.log('ECHO', options);
    return options;
  }
  async open(options: capSQLiteOptions): Promise<capSQLiteResult> {
    console.log('open', options);
    return Promise.reject('Not implemented');
  }
  async close(options: capSQLiteOptions): Promise<capSQLiteResult> {
    console.log('close', options);
    return Promise.reject('Not implemented');
  }
  async execute(options: capSQLiteOptions): Promise<capSQLiteResult> {
    console.log('execute', options);
    return Promise.reject('Not implemented');
  }
  async executeSet(options: capSQLiteOptions): Promise<capSQLiteResult> {
    console.log('execute', options);
    return Promise.reject('Not implemented');
  }
  async run(options: capSQLiteOptions): Promise<capSQLiteResult> {
    console.log('run', options);
    return Promise.reject('Not implemented');
  }
  async query(options: capSQLiteOptions): Promise<capSQLiteResult> {
    console.log('query', options);
    return Promise.reject('Not implemented');
  }
  async isDBExists(options: capSQLiteOptions): Promise<capSQLiteResult> {
    console.log('isDBExists', options);
    return Promise.reject('Not implemented');
  }
  async deleteDatabase(options: capSQLiteOptions): Promise<capSQLiteResult> {
    console.log('deleteDatabase', options);
    return Promise.reject('Not implemented');
  }
  async isJsonValid(options: capSQLiteOptions): Promise<capSQLiteResult> {
    console.log('isJsonValid', options);
    return Promise.reject('Not implemented');
  }

  async importFromJson(options: capSQLiteOptions): Promise<capSQLiteResult> {
    console.log('importFromJson', options);
    return Promise.reject('Not implemented');
  }
  async exportToJson(options: capSQLiteOptions): Promise<capSQLiteResult> {
    console.log('exportToJson', options);
    return Promise.reject('Not implemented');
  }
  async createSyncTable(): Promise<capSQLiteResult> {
    console.log('createSyncTable');
    return Promise.reject('Not implemented');
  }
  async setSyncDate(options: capSQLiteOptions): Promise<capSQLiteResult> {
    console.log('setSyncDate', options);
    return Promise.reject('Not implemented');
  }
  async addUpgradeStatement(
    database: string,
    upgrade: capSQLiteVersionUpgrade,
  ): Promise<void> {
    console.log('addUpgradeStatement', database, upgrade);
    return Promise.reject('Not implemented');
  }
}

const CapacitorSQLite = new CapacitorSQLiteWeb();

export { CapacitorSQLite };

import { registerWebPlugin } from '@capacitor/core';
registerWebPlugin(CapacitorSQLite);
