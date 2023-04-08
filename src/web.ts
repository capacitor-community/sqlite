import { WebPlugin } from '@capacitor/core';

import type {
  CapacitorSQLitePlugin,
  capAllConnectionsOptions,
  capChangeSecretOptions,
  capEchoOptions,
  capEchoResult,
  capNCConnectionOptions,
  capNCDatabasePathOptions,
  capNCDatabasePathResult,
  capNCOptions,
  capSetSecretOptions,
  capSQLiteChanges,
  capSQLiteExecuteOptions,
  capSQLiteExportOptions,
  capSQLiteFromAssetsOptions,
  capSQLiteHTTPOptions,
  capSQLiteLocalDiskOptions,
  capSQLiteImportOptions,
  capSQLiteJson,
  capSQLiteOptions,
  capSQLitePathOptions,
  capSQLiteQueryOptions,
  capSQLiteResult,
  capSQLiteRunOptions,
  capSQLiteSetOptions,
  capSQLiteSyncDate,
  capSQLiteSyncDateOptions,
  capSQLiteTableOptions,
  capSQLiteUpgradeOptions,
  capSQLiteUrl,
  capSQLiteValues,
  capVersionResult,
} from './definitions';

export class CapacitorSQLiteWeb
  extends WebPlugin
  implements CapacitorSQLitePlugin
{
  private jeepSqliteElement: any = null;
  private isWebStoreOpen = false;

  async initWebStore(): Promise<void> {
    await customElements.whenDefined('jeep-sqlite');

    this.jeepSqliteElement = document.querySelector('jeep-sqlite');

    this.ensureJeepSqliteIsAvailable();

    this.jeepSqliteElement.addEventListener(
      'jeepSqliteImportProgress',
      (event: CustomEvent) => {
        this.notifyListeners('sqliteImportProgressEvent', event.detail);
      },
    );
    this.jeepSqliteElement.addEventListener(
      'jeepSqliteExportProgress',
      (event: CustomEvent) => {
        this.notifyListeners('sqliteExportProgressEvent', event.detail);
      },
    );
    this.jeepSqliteElement.addEventListener(
      'jeepSqliteHTTPRequestEnded',
      (event: CustomEvent) => {
        this.notifyListeners('sqliteHTTPRequestEndedEvent', event.detail);
      },
    );
    this.jeepSqliteElement.addEventListener(
      'jeepSqlitePickDatabaseEnded',
      (event: CustomEvent) => {
        this.notifyListeners('sqlitePickDatabaseEndedEvent', event.detail);
      },
    );
    this.jeepSqliteElement.addEventListener(
      'jeepSqliteSaveDatabaseToDisk',
      (event: CustomEvent) => {
        this.notifyListeners('sqliteSaveDatabaseToDiskEvent', event.detail);
      },
    );

    if (!this.isWebStoreOpen) {
      this.isWebStoreOpen = await this.jeepSqliteElement.isStoreOpen();
    }

    return;
  }

  async saveToStore(options: capSQLiteOptions): Promise<void> {
    this.ensureJeepSqliteIsAvailable();
    this.ensureWebstoreIsOpen();

    try {
      await this.jeepSqliteElement.saveToStore(options);
      return;
    } catch (err) {
      throw new Error(`${err}`);
    }
  }
  async getFromLocalDiskToStore(
    options: capSQLiteLocalDiskOptions,
  ): Promise<void> {
    this.ensureJeepSqliteIsAvailable();
    this.ensureWebstoreIsOpen();

    try {
      await this.jeepSqliteElement.getFromLocalDiskToStore(options);
      return;
    } catch (err) {
      throw new Error(`${err}`);
    }
  }
  async saveToLocalDisk(options: capSQLiteOptions): Promise<void> {
    this.ensureJeepSqliteIsAvailable();
    this.ensureWebstoreIsOpen();

    try {
      await this.jeepSqliteElement.saveToLocalDisk(options);
      return;
    } catch (err) {
      throw new Error(`${err}`);
    }
  }

  async echo(options: capEchoOptions): Promise<capEchoResult> {
    this.ensureJeepSqliteIsAvailable();

    const echoResult = await this.jeepSqliteElement.echo(options);
    return echoResult;
  }

  async createConnection(options: capSQLiteOptions): Promise<void> {
    this.ensureJeepSqliteIsAvailable();
    this.ensureWebstoreIsOpen();

    try {
      await this.jeepSqliteElement.createConnection(options);
      return;
    } catch (err) {
      throw new Error(`${err}`);
    }
  }

  async open(options: capSQLiteOptions): Promise<void> {
    this.ensureJeepSqliteIsAvailable();
    this.ensureWebstoreIsOpen();

    try {
      await this.jeepSqliteElement.open(options);
      return;
    } catch (err) {
      throw new Error(`${err}`);
    }
  }

  async closeConnection(options: capSQLiteOptions): Promise<void> {
    this.ensureJeepSqliteIsAvailable();
    this.ensureWebstoreIsOpen();

    try {
      await this.jeepSqliteElement.closeConnection(options);
      return;
    } catch (err) {
      throw new Error(`${err}`);
    }
  }

  async getVersion(options: capSQLiteOptions): Promise<capVersionResult> {
    this.ensureJeepSqliteIsAvailable();
    this.ensureWebstoreIsOpen();

    try {
      const versionResult: capVersionResult =
        await this.jeepSqliteElement.getVersion(options);
      return versionResult;
    } catch (err) {
      throw new Error(`${err}`);
    }
  }

  async checkConnectionsConsistency(
    options: capAllConnectionsOptions,
  ): Promise<capSQLiteResult> {
    this.ensureJeepSqliteIsAvailable();

    try {
      const consistencyResult: capSQLiteResult =
        await this.jeepSqliteElement.checkConnectionsConsistency(options);
      return consistencyResult;
    } catch (err) {
      throw new Error(`${err}`);
    }
  }

  async close(options: capSQLiteOptions): Promise<void> {
    this.ensureJeepSqliteIsAvailable();
    this.ensureWebstoreIsOpen();

    try {
      await this.jeepSqliteElement.close(options);
      return;
    } catch (err) {
      throw new Error(`${err}`);
    }
  }

  async getTableList(options: capSQLiteOptions): Promise<capSQLiteValues> {
    this.ensureJeepSqliteIsAvailable();
    this.ensureWebstoreIsOpen();

    try {
      const tableListResult: capSQLiteValues =
        await this.jeepSqliteElement.getTableList(options);
      return tableListResult;
    } catch (err) {
      throw new Error(`${err}`);
    }
  }

  async execute(options: capSQLiteExecuteOptions): Promise<capSQLiteChanges> {
    this.ensureJeepSqliteIsAvailable();
    this.ensureWebstoreIsOpen();

    try {
      const executeResult: capSQLiteChanges =
        await this.jeepSqliteElement.execute(options);
      return executeResult;
    } catch (err) {
      throw new Error(`${err}`);
    }
  }

  async executeSet(options: capSQLiteSetOptions): Promise<capSQLiteChanges> {
    this.ensureJeepSqliteIsAvailable();
    this.ensureWebstoreIsOpen();

    try {
      const executeResult: capSQLiteChanges =
        await this.jeepSqliteElement.executeSet(options);
      return executeResult;
    } catch (err) {
      throw new Error(`${err}`);
    }
  }

  async run(options: capSQLiteRunOptions): Promise<capSQLiteChanges> {
    this.ensureJeepSqliteIsAvailable();
    this.ensureWebstoreIsOpen();

    try {
      const runResult: capSQLiteChanges = await this.jeepSqliteElement.run(
        options,
      );
      return runResult;
    } catch (err) {
      throw new Error(`${err}`);
    }
  }
  async query(options: capSQLiteQueryOptions): Promise<capSQLiteValues> {
    this.ensureJeepSqliteIsAvailable();
    this.ensureWebstoreIsOpen();

    try {
      const queryResult: capSQLiteValues = await this.jeepSqliteElement.query(
        options,
      );
      return queryResult;
    } catch (err) {
      throw new Error(`${err}`);
    }
  }
  async isDBExists(options: capSQLiteOptions): Promise<capSQLiteResult> {
    this.ensureJeepSqliteIsAvailable();
    this.ensureWebstoreIsOpen();

    try {
      const dbExistsResult: capSQLiteResult =
        await this.jeepSqliteElement.isDBExists(options);
      return dbExistsResult;
    } catch (err) {
      throw new Error(`${err}`);
    }
  }

  async isDBOpen(options: capSQLiteOptions): Promise<capSQLiteResult> {
    this.ensureJeepSqliteIsAvailable();
    this.ensureWebstoreIsOpen();

    try {
      const isDBOpenResult: capSQLiteResult =
        await this.jeepSqliteElement.isDBOpen(options);
      return isDBOpenResult;
    } catch (err) {
      throw new Error(`${err}`);
    }
  }

  async isDatabase(options: capSQLiteOptions): Promise<capSQLiteResult> {
    this.ensureJeepSqliteIsAvailable();
    this.ensureWebstoreIsOpen();

    try {
      const isDatabaseResult: capSQLiteResult =
        await this.jeepSqliteElement.isDatabase(options);
      return isDatabaseResult;
    } catch (err) {
      throw new Error(`${err}`);
    }
  }

  async isTableExists(
    options: capSQLiteTableOptions,
  ): Promise<capSQLiteResult> {
    this.ensureJeepSqliteIsAvailable();
    this.ensureWebstoreIsOpen();

    try {
      const tableExistsResult = await this.jeepSqliteElement.isTableExists(
        options,
      );
      return tableExistsResult;
    } catch (err) {
      throw new Error(`${err}`);
    }
  }
  async deleteDatabase(options: capSQLiteOptions): Promise<void> {
    this.ensureJeepSqliteIsAvailable();
    this.ensureWebstoreIsOpen();

    try {
      await this.jeepSqliteElement.deleteDatabase(options);
      return;
    } catch (err) {
      throw new Error(`${err}`);
    }
  }
  async isJsonValid(options: capSQLiteImportOptions): Promise<capSQLiteResult> {
    this.ensureJeepSqliteIsAvailable();
    this.ensureWebstoreIsOpen();

    try {
      const isJsonValidResult = await this.jeepSqliteElement.isJsonValid(
        options,
      );
      return isJsonValidResult;
    } catch (err) {
      throw new Error(`${err}`);
    }
  }

  async importFromJson(
    options: capSQLiteImportOptions,
  ): Promise<capSQLiteChanges> {
    this.ensureJeepSqliteIsAvailable();
    this.ensureWebstoreIsOpen();

    try {
      const importFromJsonResult: capSQLiteChanges =
        await this.jeepSqliteElement.importFromJson(options);
      return importFromJsonResult;
    } catch (err) {
      throw new Error(`${err}`);
    }
  }

  async exportToJson(options: capSQLiteExportOptions): Promise<capSQLiteJson> {
    this.ensureJeepSqliteIsAvailable();
    this.ensureWebstoreIsOpen();

    try {
      const exportToJsonResult: capSQLiteJson =
        await this.jeepSqliteElement.exportToJson(options);
      return exportToJsonResult;
    } catch (err) {
      throw new Error(`${err}`);
    }
  }
  async createSyncTable(options: capSQLiteOptions): Promise<capSQLiteChanges> {
    this.ensureJeepSqliteIsAvailable();
    this.ensureWebstoreIsOpen();

    try {
      const createSyncTableResult: capSQLiteChanges =
        await this.jeepSqliteElement.createSyncTable(options);
      return createSyncTableResult;
    } catch (err) {
      throw new Error(`${err}`);
    }
  }

  async setSyncDate(options: capSQLiteSyncDateOptions): Promise<void> {
    this.ensureJeepSqliteIsAvailable();
    this.ensureWebstoreIsOpen();
    try {
      await this.jeepSqliteElement.setSyncDate(options);
      return;
    } catch (err) {
      throw new Error(`${err}`);
    }
  }

  async getSyncDate(options: capSQLiteOptions): Promise<capSQLiteSyncDate> {
    this.ensureJeepSqliteIsAvailable();
    this.ensureWebstoreIsOpen();

    try {
      const getSyncDateResult: capSQLiteSyncDate =
        await this.jeepSqliteElement.getSyncDate(options);
      return getSyncDateResult;
    } catch (err) {
      throw new Error(`${err}`);
    }
  }
  async deleteExportedRows(options: capSQLiteOptions): Promise<void> {
    this.ensureJeepSqliteIsAvailable();
    this.ensureWebstoreIsOpen();
    try {
      await this.jeepSqliteElement.deleteExportedRows(options);
      return;
    } catch (err) {
      throw new Error(`${err}`);
    }
  }

  async addUpgradeStatement(options: capSQLiteUpgradeOptions): Promise<void> {
    this.ensureJeepSqliteIsAvailable();
    this.ensureWebstoreIsOpen();

    try {
      await this.jeepSqliteElement.addUpgradeStatement(options);
      return;
    } catch (err) {
      throw new Error(`${err}`);
    }
  }

  async copyFromAssets(options: capSQLiteFromAssetsOptions): Promise<void> {
    this.ensureJeepSqliteIsAvailable();
    this.ensureWebstoreIsOpen();

    try {
      await this.jeepSqliteElement.copyFromAssets(options);
      return;
    } catch (err) {
      throw new Error(`${err}`);
    }
  }

  async getFromHTTPRequest(options: capSQLiteHTTPOptions): Promise<void> {
    this.ensureJeepSqliteIsAvailable();
    this.ensureWebstoreIsOpen();

    try {
      await this.jeepSqliteElement.getFromHTTPRequest(options);
      return;
    } catch (err) {
      throw new Error(`${err}`);
    }
  }

  async getDatabaseList(): Promise<capSQLiteValues> {
    this.ensureJeepSqliteIsAvailable();
    this.ensureWebstoreIsOpen();

    try {
      const databaseListResult: capSQLiteValues =
        await this.jeepSqliteElement.getDatabaseList();
      return databaseListResult;
    } catch (err) {
      throw new Error(`${err}`);
    }
  }

  /**
   * Checks if the `jeep-sqlite` element is present in the DOM.
   * If it's not in the DOM, this method throws an Error.
   *
   * Attention: This will always fail, if the `intWebStore()` method wasn't called before.
   */
  private ensureJeepSqliteIsAvailable() {
    if (this.jeepSqliteElement === null) {
      throw new Error(
        `The jeep-sqlite element is not present in the DOM! Please check the @capacitor-community/sqlite documentation for instructions regarding the web platform.`,
      );
    }
  }

  private ensureWebstoreIsOpen() {
    if (!this.isWebStoreOpen) {
      /**
       * if (!this.isWebStoreOpen)
        this.isWebStoreOpen = await this.jeepSqliteElement.isStoreOpen();
       */
      throw new Error(
        'WebStore is not open yet. You have to call "initWebStore()" first.',
      );
    }
  }

  ////////////////////////////////////
  ////// UNIMPLEMENTED METHODS
  ////////////////////////////////////

  async getUrl(): Promise<capSQLiteUrl> {
    throw this.unimplemented('Not implemented on web.');
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

  async moveDatabasesAndAddSuffix(
    options: capSQLitePathOptions,
  ): Promise<void> {
    console.log('moveDatabasesAndAddSuffix', options);
    throw this.unimplemented('Not implemented on web.');
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

  async clearEncryptionSecret(): Promise<void> {
    console.log('clearEncryptionSecret');
    throw this.unimplemented('Not implemented on web.');
  }

  async checkEncryptionSecret(
    options: capSetSecretOptions,
  ): Promise<capSQLiteResult> {
    console.log('checkEncryptionPassPhrase', options);
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

  async isDatabaseEncrypted(
    options: capSQLiteOptions,
  ): Promise<capSQLiteResult> {
    console.log('isDatabaseEncrypted', options);
    throw this.unimplemented('Not implemented on web.');
  }

  async isInConfigEncryption(): Promise<capSQLiteResult> {
    throw this.unimplemented('Not implemented on web.');
  }

  async isInConfigBiometricAuth(): Promise<capSQLiteResult> {
    throw this.unimplemented('Not implemented on web.');
  }
}
