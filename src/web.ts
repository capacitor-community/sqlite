import { WebPlugin } from '@capacitor/core';
import {
  CapacitorSQLitePlugin,
  capSQLiteOptions,
  capSQLiteResult,
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

  async echo(options: { value: string }): Promise<{ value: string }> {
    console.log('ECHO in Web plugin', options);
    return options;
  }
  async open(options: capSQLiteOptions): Promise<capSQLiteResult> {
    console.log('open', options);
    return Promise.reject('Not implemented on Web Platform');
  }
  async close(options: capSQLiteOptions): Promise<capSQLiteResult> {
    console.log('close', options);
    return Promise.reject('Not implemented on Web Platform');
  }
  async execute(options: capSQLiteOptions): Promise<capSQLiteResult> {
    console.log('execute', options);
    return Promise.reject('Not implemented on Web Platform');
  }
  async executeSet(options: capSQLiteOptions): Promise<capSQLiteResult> {
    console.log('execute', options);
    return Promise.reject('Not implemented on Web Platform');
  }
  async run(options: capSQLiteOptions): Promise<capSQLiteResult> {
    console.log('run', options);
    return Promise.reject('Not implemented on Web Platform');
  }
  async query(options: capSQLiteOptions): Promise<capSQLiteResult> {
    console.log('query', options);
    return Promise.reject('Not implemented on Web Platform');
  }
  async isDBExists(options: capSQLiteOptions): Promise<capSQLiteResult> {
    console.log('in Web isDBExists', options);
    return Promise.reject('Not implemented on Web Platform');
  }
  async deleteDatabase(options: capSQLiteOptions): Promise<capSQLiteResult> {
    console.log('deleteDatabase', options);
    return Promise.reject('Not implemented on Web Platform');
  }
  async isJsonValid(options: capSQLiteOptions): Promise<capSQLiteResult> {
    console.log('isJsonValid', options);
    return Promise.reject('Not implemented on Web Platform');
  }

  async importFromJson(options: capSQLiteOptions): Promise<capSQLiteResult> {
    console.log('importFromJson', options);
    return Promise.reject('Not implemented on Web Platform');
  }
  async exportToJson(options: capSQLiteOptions): Promise<capSQLiteResult> {
    console.log('exportToJson', options);
    return Promise.reject('Not implemented on Web Platform');
  }
  async createSyncTable(): Promise<capSQLiteResult> {
    console.log('createSyncTable');
    return Promise.reject('Not implemented on Web Platform');
  }
  async setSyncDate(options: capSQLiteOptions): Promise<capSQLiteResult> {
    console.log('setSyncDate', options);
    return Promise.reject('Not implemented on Web Platform');
  }
}

const CapacitorSQLite = new CapacitorSQLiteWeb();

export { CapacitorSQLite };

import { registerWebPlugin } from '@capacitor/core';
registerWebPlugin(CapacitorSQLite);
