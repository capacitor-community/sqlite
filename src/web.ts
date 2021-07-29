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

export class CapacitorSQLiteWeb extends WebPlugin implements CapacitorSQLitePlugin {
  private jeepSqlite: any = null;
  private isStoreOpen = false;

  constructor() {
    super();
    this.jeepSqlite = document.querySelector('jeep-sqlite');
  }
  async echo(options: capEchoOptions): Promise<capEchoResult> {
    if(this.jeepSqlite != null) {
      console.log('ECHO in Web plugin', options);
      return options;  
    } else {
      throw this.unimplemented('Not implemented on web.');
    }
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
    if(this.jeepSqlite != null) {
      if(!this.isStoreOpen) this.isStoreOpen = await this.jeepSqlite.isStoreOpen();
      if(this.isStoreOpen) {
        try {
          await this.jeepSqlite.createConnection(options);

        } catch (err) {
          return Promise.reject(`${err}`);
        }
      } else {
        return Promise.reject(`Store "jeepSqliteStore" failed to open`);
      }
    } else {
      throw this.unimplemented('Not implemented on web.');
    }
  }
  async open(options: capSQLiteOptions): Promise<void> {
    if(this.jeepSqlite != null) {
      if(this.isStoreOpen) {
        try {
          await this.jeepSqlite.open(options);

        } catch (err) {
          return Promise.reject(`${err}`);
        }
      } else {
        return Promise.reject(`Store "jeepSqliteStore" failed to open`);
      }
    } else {
      throw this.unimplemented('Not implemented on web.');
    }
  }
  async closeConnection(options: capSQLiteOptions): Promise<void> {
    if(this.jeepSqlite != null) {
      if(this.isStoreOpen) {
        try {
          await this.jeepSqlite.closeConnection(options);

        } catch (err) {
          return Promise.reject(`${err}`);
        }
      } else {
        return Promise.reject(`Store "jeepSqliteStore" failed to open`);
      }
    } else {
      throw this.unimplemented('Not implemented on web.');
    }
  }
  async checkConnectionsConsistency(
    options: capAllConnectionsOptions,
  ): Promise<capSQLiteResult> {
    console.log('checkConsistency', options);
    throw this.unimplemented('Not implemented on web.');
  }
  async close(options: capSQLiteOptions): Promise<void> {
    if(this.jeepSqlite != null) {
      if(this.isStoreOpen) {
        try {
          await this.jeepSqlite.close(options);

        } catch (err) {
          return Promise.reject(`${err}`);
        }
      } else {
        return Promise.reject(`Store "jeepSqliteStore" failed to open`);
      }
    } else {
      throw this.unimplemented('Not implemented on web.');
    }
  }
  async execute(options: capSQLiteExecuteOptions): Promise<capSQLiteChanges> {
    if(this.jeepSqlite != null) {
      if(this.isStoreOpen) {
        try {
          const ret: capSQLiteChanges = await this.jeepSqlite.execute(options);
          return Promise.resolve(ret);
        } catch (err) {
          return Promise.reject(`${err}`);
        }
      } else {
        return Promise.reject(`Store "jeepSqliteStore" failed to open`);
      }
    } else {
      throw this.unimplemented('Not implemented on web.');
    }
  }
  async executeSet(options: capSQLiteSetOptions): Promise<capSQLiteChanges> {
    console.log('execute', options);
    throw this.unimplemented('Not implemented on web.');
  }
  async run(options: capSQLiteRunOptions): Promise<capSQLiteChanges> {
    if(this.jeepSqlite != null) {
      if(this.isStoreOpen) {
        try {
          const ret: capSQLiteChanges = await this.jeepSqlite.run(options);
          return Promise.resolve(ret);
        } catch (err) {
          return Promise.reject(`${err}`);
        }
      } else {
        return Promise.reject(`Store "jeepSqliteStore" failed to open`);
      }
    } else {
      throw this.unimplemented('Not implemented on web.');
    }
  }
  async query(options: capSQLiteQueryOptions): Promise<capSQLiteValues> {
    if(this.jeepSqlite != null) {
      if(this.isStoreOpen) {
        try {
          const ret: capSQLiteValues = await this.jeepSqlite.query(options);
          return Promise.resolve(ret);
        } catch (err) {
          return Promise.reject(`${err}`);
        }
      } else {
        return Promise.reject(`Store "jeepSqliteStore" failed to open`);
      }
    } else {
      throw this.unimplemented('Not implemented on web.');
    }
  }
  async isDBExists(options: capSQLiteOptions): Promise<capSQLiteResult> {
    if(this.jeepSqlite != null) {
      if(this.isStoreOpen) {
        try {
          const ret: capSQLiteResult = await this.jeepSqlite.isDBExists(options);
          return Promise.resolve(ret);
        } catch (err) {
          return Promise.reject(`${err}`);
        }
      } else {
        return Promise.reject(`Store "jeepSqliteStore" failed to open`);
      }
    } else {
      throw this.unimplemented('Not implemented on web.');
    }
  }
  async isDBOpen(options: capSQLiteOptions): Promise<capSQLiteResult> {
    if(this.jeepSqlite != null) {
      if(this.isStoreOpen) {
        try {
          const ret: capSQLiteResult = await this.jeepSqlite.isDBOpen(options);
          return Promise.resolve(ret);
        } catch (err) {
          return Promise.reject(`${err}`);
        }
      } else {
        return Promise.reject(`Store "jeepSqliteStore" failed to open`);
      }
    } else {
      throw this.unimplemented('Not implemented on web.');
    }
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
    if(this.jeepSqlite != null) {
      if(this.isStoreOpen) {
        try {
          await this.jeepSqlite.deleteDatabase(options);

        } catch (err) {
          return Promise.reject(`${err}`);
        }
      } else {
        return Promise.reject(`Store "jeepSqliteStore" failed to open`);
      }
    } else {
      throw this.unimplemented('Not implemented on web.');
    }
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
