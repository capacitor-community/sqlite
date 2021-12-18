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
  capVersionResult,
  capSQLiteResult,
  capSQLiteChanges,
  capSQLiteValues,
  capSQLiteJson,
  capSQLiteSyncDate,
  capAllConnectionsOptions,
  capSetSecretOptions,
  capChangeSecretOptions,
  capSQLiteFromAssetsOptions,
  capNCDatabasePathOptions,
  capNCConnectionOptions,
  capNCOptions,
  capNCDatabasePathResult,
} from './definitions';

export class CapacitorSQLiteWeb
  extends WebPlugin
  implements CapacitorSQLitePlugin {
  private sqliteEl: any = null;
  private isStoreOpen = false;

  async initWebStore(): Promise<void> {
    await customElements.whenDefined('jeep-sqlite');
    this.sqliteEl = document.querySelector('jeep-sqlite');
    if (this.sqliteEl != null) {
      this.sqliteEl.addEventListener(
        'jeepSqliteImportProgress',
        (event: CustomEvent) => {
          this.notifyListeners('sqliteImportProgressEvent', event.detail);
        },
      );
      this.sqliteEl.addEventListener(
        'jeepSqliteExportProgress',
        (event: CustomEvent) => {
          this.notifyListeners('sqliteExportProgressEvent', event.detail);
        },
      );
      if (!this.isStoreOpen)
        this.isStoreOpen = await this.sqliteEl.isStoreOpen();
      return Promise.resolve();
    } else {
      return Promise.reject('InitWeb: this.sqliteEl is null');
    }
  }
  async saveToStore(options: capSQLiteOptions): Promise<void> {
    if (this.sqliteEl != null) {
      if (this.isStoreOpen) {
        try {
          await this.sqliteEl.saveToStore(options);
          return Promise.resolve();
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

  async echo(options: capEchoOptions): Promise<capEchoResult> {
    if (this.sqliteEl != null) {
      const echo = await this.sqliteEl.echo(options);
      return echo;
    } else {
      throw this.unimplemented('Not implemented on web.');
    }
  }
  async isSecretStored(): Promise<capSQLiteResult> {
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
  async getNCDatabasePath(
    options: capNCDatabasePathOptions,
  ): Promise<capNCDatabasePathResult> {
    console.log('getNCDatabasePath', options);
    throw this.unimplemented('Not implemented on web.');
  }
  async createNCConnection(options: capNCConnectionOptions): Promise<void> {
    console.log('createNCConnection', options);
    throw this.unimplemented('Not implemented on web.');
  }
  async closeNCConnection(options: capNCOptions): Promise<void> {
    console.log('closeNCConnection', options);
    throw this.unimplemented('Not implemented on web.');
  }
  async isNCDatabase(options: capNCOptions): Promise<capSQLiteResult> {
    console.log('isNCDatabase', options);
    throw this.unimplemented('Not implemented on web.');
  }
  async createConnection(options: capSQLiteOptions): Promise<void> {
    if (this.sqliteEl != null) {
      if (this.isStoreOpen) {
        try {
          await this.sqliteEl.createConnection(options);
          return Promise.resolve();
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
    if (this.sqliteEl != null) {
      if (this.isStoreOpen) {
        try {
          await this.sqliteEl.open(options);
          return Promise.resolve();
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
    if (this.sqliteEl != null) {
      if (this.isStoreOpen) {
        try {
          await this.sqliteEl.closeConnection(options);
          return Promise.resolve();
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
  async getVersion(options: capSQLiteOptions): Promise<capVersionResult> {
    if (this.sqliteEl != null) {
      if (this.isStoreOpen) {
        try {
          const ret: capVersionResult = await this.sqliteEl.getVersion(options);
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
  async checkConnectionsConsistency(
    options: capAllConnectionsOptions,
  ): Promise<capSQLiteResult> {
    if (this.sqliteEl != null) {
      try {
        const ret: capSQLiteResult = await this.sqliteEl.checkConnectionsConsistency(
          options,
        );
        return Promise.resolve(ret);
      } catch (err) {
        return Promise.reject(`${err}`);
      }
    } else {
      throw this.unimplemented('Not implemented on web.');
    }
  }
  async close(options: capSQLiteOptions): Promise<void> {
    if (this.sqliteEl != null) {
      if (this.isStoreOpen) {
        try {
          await this.sqliteEl.close(options);
          return Promise.resolve();
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
    if (this.sqliteEl != null) {
      if (this.isStoreOpen) {
        try {
          const ret: capSQLiteChanges = await this.sqliteEl.execute(options);
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
    if (this.sqliteEl != null) {
      if (this.isStoreOpen) {
        try {
          const ret: capSQLiteChanges = await this.sqliteEl.executeSet(options);
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
  async run(options: capSQLiteRunOptions): Promise<capSQLiteChanges> {
    if (this.sqliteEl != null) {
      if (this.isStoreOpen) {
        try {
          const ret: capSQLiteChanges = await this.sqliteEl.run(options);
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
    if (this.sqliteEl != null) {
      if (this.isStoreOpen) {
        try {
          const ret: capSQLiteValues = await this.sqliteEl.query(options);
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
    if (this.sqliteEl != null) {
      if (this.isStoreOpen) {
        try {
          const ret: capSQLiteResult = await this.sqliteEl.isDBExists(options);
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
    if (this.sqliteEl != null) {
      if (this.isStoreOpen) {
        try {
          const ret: capSQLiteResult = await this.sqliteEl.isDBOpen(options);
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
    if (this.sqliteEl != null) {
      if (!this.isStoreOpen)
        this.isStoreOpen = await this.sqliteEl.isStoreOpen();
      if (this.isStoreOpen) {
        try {
          const ret: capSQLiteResult = await this.sqliteEl.isDatabase(options);
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

  async isTableExists(
    options: capSQLiteTableOptions,
  ): Promise<capSQLiteResult> {
    if (this.sqliteEl != null) {
      if (this.isStoreOpen) {
        try {
          const ret = await this.sqliteEl.isTableExists(options);
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
  async deleteDatabase(options: capSQLiteOptions): Promise<void> {
    if (this.sqliteEl != null) {
      if (this.isStoreOpen) {
        try {
          await this.sqliteEl.deleteDatabase(options);
          return Promise.resolve();
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
    if (this.sqliteEl != null) {
      if (!this.isStoreOpen)
        this.isStoreOpen = await this.sqliteEl.isStoreOpen();
      if (this.isStoreOpen) {
        try {
          const ret = await this.sqliteEl.isJsonValid(options);
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
  async importFromJson(
    options: capSQLiteImportOptions,
  ): Promise<capSQLiteChanges> {
    if (this.sqliteEl != null) {
      if (!this.isStoreOpen)
        this.isStoreOpen = await this.sqliteEl.isStoreOpen();
      if (this.isStoreOpen) {
        try {
          const ret: capSQLiteChanges = await this.sqliteEl.importFromJson(
            options,
          );
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
  async exportToJson(options: capSQLiteExportOptions): Promise<capSQLiteJson> {
    if (this.sqliteEl != null) {
      if (this.isStoreOpen) {
        try {
          const ret: capSQLiteJson = await this.sqliteEl.exportToJson(options);
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
  async createSyncTable(options: capSQLiteOptions): Promise<capSQLiteChanges> {
    if (this.sqliteEl != null) {
      if (this.isStoreOpen) {
        try {
          const ret: capSQLiteChanges = await this.sqliteEl.createSyncTable(
            options,
          );
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
  async setSyncDate(options: capSQLiteSyncDateOptions): Promise<void> {
    if (this.sqliteEl != null) {
      if (this.isStoreOpen) {
        try {
          await this.sqliteEl.setSyncDate(options);
          return Promise.resolve();
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
  async getSyncDate(options: capSQLiteOptions): Promise<capSQLiteSyncDate> {
    if (this.sqliteEl != null) {
      if (this.isStoreOpen) {
        try {
          const ret: capSQLiteSyncDate = await this.sqliteEl.getSyncDate(
            options,
          );
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
  async addUpgradeStatement(options: capSQLiteUpgradeOptions): Promise<void> {
    if (this.sqliteEl != null) {
      if (this.isStoreOpen) {
        try {
          await this.sqliteEl.addUpgradeStatement(options);
          return Promise.resolve();
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
  async copyFromAssets(options: capSQLiteFromAssetsOptions): Promise<void> {
    if (this.sqliteEl != null) {
      if (this.isStoreOpen) {
        try {
          await this.sqliteEl.copyFromAssets(options);
          return Promise.resolve();
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
  async getDatabaseList(): Promise<capSQLiteValues> {
    if (this.sqliteEl != null) {
      if (!this.isStoreOpen)
        this.isStoreOpen = await this.sqliteEl.isStoreOpen();
      if (this.isStoreOpen) {
        try {
          const ret: capSQLiteValues = await this.sqliteEl.getDatabaseList();
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
  async getMigratableDbList(
    options: capSQLitePathOptions,
  ): Promise<capSQLiteValues> {
    console.log('getMigratableDbList', options);
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
