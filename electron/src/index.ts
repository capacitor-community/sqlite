import type {
  CapacitorSQLitePlugin,
  capAllConnectionsOptions,
  capChangeSecretOptions,
  capConnectionOptions,
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
  capSQLiteVersionUpgrade,
  capVersionResult,
  JsonSQLite,
} from '../../src/definitions';

import { Database } from './electron-utils/Database';
import { UtilsJson } from './electron-utils/ImportExportJson/utilsJson';
import { UtilsFile } from './electron-utils/utilsFile';

export class CapacitorSQLite implements CapacitorSQLitePlugin {
  private versionUpgrades: Record<
    string,
    Record<number, capSQLiteVersionUpgrade>
  > = {};
  private databases: { [databasename: string]: Database } = {};
  private fileUtil: UtilsFile = new UtilsFile();
  private jsonUtil: UtilsJson = new UtilsJson();

  async createConnection(options: capConnectionOptions): Promise<void> {
    const optionKeys = Object.keys(options);

    if (!optionKeys.includes('database')) {
      throw new Error('Must provide a database name');
    }

    const dbName: string = options.database;
    const version: number = options.version ? options.version : 1;
    /*    const encrypted = false;
    const inMode = "no-encryption";

    const encrypted: boolean =
      options.encrypted && this._osType === 'Darwin'
        ? options.encrypted
        : false;
    const inMode: string =
      options.mode && this._osType === 'Darwin'
        ? options.mode
        : 'no-encryption';
    */
    let upgrades: Record<number, capSQLiteVersionUpgrade> = {};
    const versionUpgradeKeys: string[] = Object.keys(this.versionUpgrades);

    if (
      versionUpgradeKeys.length !== 0 &&
      versionUpgradeKeys.includes(dbName)
    ) {
      upgrades = this.versionUpgrades[dbName];
    }

    const databaseConnection: Database = new Database(
      dbName + 'SQLite.db',
      /*        encrypted,
      inMode,
      */
      version,
      upgrades,
    );

    this.databases[dbName] = databaseConnection;

    return;
  }
  async closeConnection(options: capSQLiteOptions): Promise<void> {
    const dbName: string = this.getOptionValue(options, 'database');

    const database = this.getDatabaseConnectionOrThrowError(dbName);

    if (database.isDBOpen()) {
      // close the database
      try {
        await database.close();
      } catch (err) {
        throw new Error(
          `CloseConnection command failed:  close ${dbName} failed ${err.message}`,
        );
      }
    }

    // remove the connection from dictionary
    delete this.databases[dbName];
  }

  async echo(options: capEchoOptions): Promise<capEchoResult> {
    const echoValue = this.getOptionValue(options, 'value');

    const echoResult: capEchoResult = {} as capEchoResult;
    echoResult.value = echoValue;
    return echoResult;
  }

  async open(options: capSQLiteOptions): Promise<void> {
    const dbName: string = this.getOptionValue(options, 'database');
    const database = this.getDatabaseConnectionOrThrowError(dbName);

    try {
      await database.open();
      return;
    } catch (err) {
      throw new Error(`Open: ${err}`);
    }
  }

  async close(options: capSQLiteOptions): Promise<void> {
    const dbName: string = this.getOptionValue(options, 'database');
    const database = this.getDatabaseConnectionOrThrowError(dbName);

    try {
      await database.close();
      return;
    } catch (err) {
      throw new Error(`Close: ${err}`);
    }
  }

  async getVersion(options: capSQLiteOptions): Promise<capVersionResult> {
    const dbName: string = this.getOptionValue(options, 'database');
    const database = this.getDatabaseConnectionOrThrowError(dbName);

    try {
      const version: number = await database.getVersion();
      const versionResult: capVersionResult = {} as capVersionResult;
      versionResult.version = version;

      return versionResult;
    } catch (err) {
      throw new Error(`GetVersion: ${err}`);
    }
  }

  async getTableList(options: capSQLiteOptions): Promise<capSQLiteValues> {
    const dbName: string = this.getOptionValue(options, 'database');
    const database = this.getDatabaseConnectionOrThrowError(dbName);

    try {
      const tableList = await database.getTableList();
      const tableListResult: capSQLiteValues = {} as capSQLiteValues;
      tableListResult.values = tableList;

      return tableListResult;
    } catch (err) {
      throw new Error(`GetTableList: ${err}`);
    }
  }

  async execute(options: capSQLiteExecuteOptions): Promise<capSQLiteChanges> {
    const dbName: string = this.getOptionValue(options, 'database');
    const statements: string = this.getOptionValue(options, 'statements');
    const transaction: boolean = this.getOptionValue(
      options,
      'transaction',
      true,
    );

    const database = this.getDatabaseConnectionOrThrowError(dbName);

    try {
      const executeResult: number = await database.executeSQL(
        statements,
        transaction,
      );

      if (executeResult < 0) {
        throw new Error('Execute failed changes < 0');
      } else {
        return { changes: { changes: executeResult } };
      }
    } catch (err) {
      throw new Error(`Execute failed: ${err}`);
    }
  }

  async executeSet(options: capSQLiteSetOptions): Promise<capSQLiteChanges> {
    const dbName: string = this.getOptionValue(options, 'database');
    const setOfStatements: any = this.getOptionValue(options, 'set');
    const transaction: boolean = this.getOptionValue(
      options,
      'transaction',
      true,
    );

    const database = this.getDatabaseConnectionOrThrowError(dbName);

    for (const sStmt of setOfStatements) {
      if (!('statement' in sStmt) || !('values' in sStmt)) {
        throw new Error(
          'ExecuteSet: Must provide a set as ' + 'Array of {statement,values}',
        );
      }
    }

    try {
      const execSetResult: any = await database.execSet(
        setOfStatements,
        transaction,
      );

      if (execSetResult < 0) {
        throw new Error(`ExecuteSet failed changes <0`);
      } else {
        return { changes: execSetResult };
      }
    } catch (err) {
      throw new Error(`ExecuteSet failed: ${err}`);
    }
  }

  async run(options: capSQLiteRunOptions): Promise<capSQLiteChanges> {
    const dbName: string = this.getOptionValue(options, 'database');
    const statement: string = this.getOptionValue(options, 'statement');
    const values: any[] = this.getOptionValue(options, 'values', []);
    const transaction: boolean = this.getOptionValue(
      options,
      'transaction',
      true,
    );

    const database = this.getDatabaseConnectionOrThrowError(dbName);

    try {
      const runResult: any = await database.runSQL(
        statement,
        values,
        transaction,
      );
      return { changes: runResult };
    } catch (err) {
      throw new Error(`RUN failed: ${err} `);
    }
  }

  async query(options: capSQLiteQueryOptions): Promise<capSQLiteValues> {
    const dbName: string = this.getOptionValue(options, 'database');
    const statement: string = this.getOptionValue(options, 'statement');
    const values: any[] = this.getOptionValue(options, 'values', []);

    if (statement.length === 0) {
      throw new Error('Statement may not be an empty string.');
    }

    const database = this.getDatabaseConnectionOrThrowError(dbName);

    try {
      const queryResult: any[] = await database.selectSQL(statement, values);
      return { values: queryResult };
    } catch (err) {
      throw new Error(`Query failed: ${err}`);
    }
  }

  async isDBExists(options: capSQLiteOptions): Promise<capSQLiteResult> {
    const dbName: string = this.getOptionValue(options, 'database');

    // Throw an error, if db connection is not opened yet:
    this.getDatabaseConnectionOrThrowError(dbName);

    const isExists: boolean = this.fileUtil.isFileExists(dbName + 'SQLite.db');
    return { result: isExists };
  }

  async isDBOpen(options: capSQLiteOptions): Promise<capSQLiteResult> {
    const dbName: string = this.getOptionValue(options, 'database');
    const database = this.getDatabaseConnectionOrThrowError(dbName);

    const isOpen: boolean = await database.isDBOpen();
    return { result: isOpen };
  }
  async isDatabase(options: capSQLiteOptions): Promise<capSQLiteResult> {
    const dbName: string = this.getOptionValue(options, 'database');
    const isExists: boolean = this.fileUtil.isFileExists(dbName + 'SQLite.db');

    return { result: isExists };
  }

  async isTableExists(
    options: capSQLiteTableOptions,
  ): Promise<capSQLiteResult> {
    const dbName: string = this.getOptionValue(options, 'database');
    const tableName: string = this.getOptionValue(options, 'table');

    const database = this.getDatabaseConnectionOrThrowError(dbName);

    try {
      const isTableExistsResult: boolean = await database.isTableExists(
        tableName,
      );
      return { result: isTableExistsResult };
    } catch (err) {
      throw new Error(`isTableExists: ${err}`);
    }
  }

  async deleteDatabase(options: capSQLiteOptions): Promise<void> {
    const dbName: string = this.getOptionValue(options, 'database');
    const database = this.getDatabaseConnectionOrThrowError(dbName);

    try {
      await database.deleteDB(dbName + 'SQLite.db');
      return;
    } catch (err) {
      throw new Error(`Delete: ${err}`);
    }
  }

  async isJsonValid(options: capSQLiteImportOptions): Promise<capSQLiteResult> {
    const jsonString: string = this.getOptionValue(options, 'jsonstring');
    const jsonObj = JSON.parse(jsonString);
    const isValid = this.jsonUtil.isJsonSQLite(jsonObj);

    if (!isValid) {
      throw new Error('Stringify Json Object not Valid');
    } else {
      return { result: true };
    }
  }

  async importFromJson(
    options: capSQLiteImportOptions,
  ): Promise<capSQLiteChanges> {
    const jsonString: string = this.getOptionValue(options, 'jsonstring');

    const jsonObj = JSON.parse(jsonString);
    const isValid = this.jsonUtil.isJsonSQLite(jsonObj);

    if (!isValid) {
      throw new Error('Must provide a valid JsonSQLite Object');
    }

    const vJsonObj: JsonSQLite = jsonObj;
    const dbName = `${vJsonObj.database}SQLite.db`;
    const targetDbVersion: number = vJsonObj.version ?? 1;
    const mode: string = vJsonObj.mode;
    const overwrite: boolean = vJsonObj.overwrite ?? false;
    //    const encrypted: boolean = vJsonObj.encrypted ?? false;
    //    const mode: string = encrypted ? 'secret' : 'no-encryption';

    // Create the database
    const database: Database = new Database(
      dbName,
      /*encrypted, mode, */
      targetDbVersion,
      {},
    );

    try {
      if (overwrite && mode === 'full') {
        const isExists = this.fileUtil.isFileExists(dbName);
        if (isExists) {
          await this.fileUtil.deleteFileName(dbName);
        }
      }
      // Open the database
      await database.open();
      const tableList = await database.getTableList();
      if (mode === 'full' && tableList.length > 0) {
        const currentVersion = await database.getVersion();
        if (targetDbVersion < currentVersion) {
          throw new Error(
            `ImportFromJson: Cannot import a version lower than ${currentVersion}`,
          );
        }
        if (currentVersion === targetDbVersion) {
          return { changes: { changes: 0 } };
        }
      }

      // Import the JsonSQLite Object
      const changes = await database.importJson(vJsonObj);
      // Close the database
      await database.close();
      return { changes: { changes: changes } };
    } catch (err) {
      throw new Error(`ImportFromJson: ${err}`);
    }
  }

  async exportToJson(options: capSQLiteExportOptions): Promise<capSQLiteJson> {
    const dbName: string = this.getOptionValue(options, 'database');
    const exportMode: string = this.getOptionValue(options, 'jsonexportmode');

    const database = this.getDatabaseConnectionOrThrowError(dbName);

    try {
      const exportJsonResult: any = await database.exportJson(exportMode);
      const resultKeys = Object.keys(exportJsonResult);

      if (resultKeys.includes('message')) {
        throw new Error(`exportToJson: ${exportJsonResult.message}`);
      } else {
        return { export: exportJsonResult };
      }
    } catch (err) {
      throw new Error(`exportToJson: ${err}`);
    }
  }

  async createSyncTable(options: capSQLiteOptions): Promise<capSQLiteChanges> {
    const dbName: string = this.getOptionValue(options, 'database');

    const database = this.getDatabaseConnectionOrThrowError(dbName);

    try {
      const createTableSyncResult: number = await database.createSyncTable();
      return {
        changes: { changes: createTableSyncResult },
      };
    } catch (err) {
      throw new Error(`createSyncTable: ${err}`);
    }
  }
  async setSyncDate(options: capSQLiteSyncDateOptions): Promise<void> {
    const dbName: string = this.getOptionValue(options, 'database');
    const syncDate: string = this.getOptionValue(options, 'syncdate');

    const database = this.getDatabaseConnectionOrThrowError(dbName);

    try {
      await database.setSyncDate(syncDate);
      return;
    } catch (err) {
      throw new Error(`SetSyncDate: ${err}`);
    }
  }

  async getSyncDate(options: capSQLiteOptions): Promise<capSQLiteSyncDate> {
    const dbName: string = this.getOptionValue(options, 'database');
    const database = this.getDatabaseConnectionOrThrowError(dbName);

    try {
      const ret: any = await database.getSyncDate();
      return Promise.resolve(ret);
    } catch (err) {
      throw new Error(`GetSyncDate: ${err}`);
    }
  }

  async deleteExportedRows(options: capSQLiteOptions): Promise<void> {
    const dbName: string = this.getOptionValue(options, 'database');
    const database = this.getDatabaseConnectionOrThrowError(dbName);
    try {
      await database.deleteExportedRows();
      return Promise.resolve();
    } catch (err) {
      throw new Error(`DeleteExportedRows: ${err}`);
    }
  }

  async addUpgradeStatement(options: capSQLiteUpgradeOptions): Promise<void> {
    const dbName: string = this.getOptionValue(options, 'database');
    const upgrades: capSQLiteVersionUpgrade[] = this.getOptionValue(
      options,
      'upgrade',
    );

    const firstUpgrade = upgrades[0];
    const versionUpgradeKeys = Object.keys(firstUpgrade);

    if (
      !versionUpgradeKeys.includes('toVersion') ||
      !versionUpgradeKeys.includes('statements')
    ) {
      throw new Error('Must provide an upgrade capSQLiteVersionUpgrade Object');
    }

    if (typeof firstUpgrade.toVersion != 'number') {
      throw new Error('upgrade.toVersion must be a number');
    }

    const upgradeVersionDict: Record<number, capSQLiteVersionUpgrade> = {};
    upgradeVersionDict[firstUpgrade.toVersion] = firstUpgrade;
    this.versionUpgrades[dbName] = upgradeVersionDict;

    return;
  }

  async copyFromAssets(options: capSQLiteFromAssetsOptions): Promise<void> {
    const overwrite: boolean = this.getOptionValue(options, 'overwrite', false);

    // check if the assets/database folder exists
    const assetsDbPath = this.fileUtil.getAssetsDatabasesPath();
    const pathExists: boolean = this.fileUtil.isPathExists(assetsDbPath);

    if (pathExists) {
      // get the database files
      const dbList: string[] = await this.fileUtil.getFileList(assetsDbPath);

      // loop through the database files
      dbList.forEach(async (db: string) => {
        if (db.substring(db.length - 3) === '.db') {
          // for each copy the file to the Application database folder
          await this.fileUtil.copyFromAssetToDatabase(db, overwrite);
        }
        if (db.substring(db.length - 4) === '.zip') {
          await this.fileUtil.unzipDatabase(db, overwrite);
        }
      });

      return;
    } else {
      throw new Error(
        `CopyFromAssets: assets/databases folder does not exist:[${assetsDbPath}]`,
      );
    }
  }

  async getDatabaseList(): Promise<capSQLiteValues> {
    // get the database folder
    const pathDatabase = this.fileUtil.getDatabasesPath();

    // get the list of databases
    const files: string[] = await this.fileUtil.getFileList(pathDatabase);

    if (files.length > 0) {
      return { values: files };
    } else {
      throw new Error(`isTableExists: No databases found in [${pathDatabase}]`);
    }
  }

  async checkConnectionsConsistency(
    options: capAllConnectionsOptions,
  ): Promise<capSQLiteResult> {
    const dbNames: string[] = this.getOptionValue(options, 'dbNames');

    const checkConsistencyResult: capSQLiteResult = {} as capSQLiteResult;
    checkConsistencyResult.result = false;

    try {
      let inConnectionsSet: Set<string> = new Set(Object.keys(this.databases));
      const outConnectionSet: Set<string> = new Set(dbNames);
      if (outConnectionSet.size === 0) {
        await this.resetDbDict(Object.keys(this.databases));
        return Promise.resolve(checkConsistencyResult);
      }
      if (inConnectionsSet.size < outConnectionSet.size) {
        await this.resetDbDict(Object.keys(this.databases));
        return Promise.resolve(checkConsistencyResult);
      }
      if (inConnectionsSet.size > outConnectionSet.size) {
        for (const key of inConnectionsSet) {
          if (!Array.from(outConnectionSet.keys()).includes(key)) {
            const opt: capSQLiteOptions = {} as capSQLiteOptions;
            opt.database = key;
            await this.closeConnection(opt);
          }
        }
      }
      inConnectionsSet = new Set(Object.keys(this.databases));
      if (inConnectionsSet.size === outConnectionSet.size) {
        const symmetricDifferenceSet = await this.symmetricDifference(
          inConnectionsSet,
          outConnectionSet,
        );
        if (symmetricDifferenceSet.size === 0) {
          checkConsistencyResult.result = true;
          return checkConsistencyResult;
        } else {
          await this.resetDbDict(Object.keys(this.databases));
          return checkConsistencyResult;
        }
      } else {
        await this.resetDbDict(Object.keys(this.databases));
        return checkConsistencyResult;
      }
    } catch (err) {
      throw new Error(`CheckConnectionsConsistency: ${err}`);
    }
  }

  private async resetDbDict(keys: string[]): Promise<void> {
    try {
      for (const key of keys) {
        const opt: capSQLiteOptions = {} as capSQLiteOptions;
        opt.database = key;
        await this.closeConnection(opt);
      }
    } catch (err) {
      throw new Error(`ResetDbDict: ${err}`);
    }
  }

  private async symmetricDifference(
    setA: Set<string>,
    setB: Set<string>,
  ): Promise<Set<string>> {
    const difference: Set<string> = new Set(setA);
    for (const elem of setB) {
      if (difference.has(elem)) {
        difference.delete(elem);
      } else {
        difference.add(elem);
      }
    }
    return difference;
  }

  /**
   * Returns a database connection, if it already exists.
   * If the conneciton does not exist yet, it throws an error.
   *
   * @param dbName
   * @returns
   */
  private getDatabaseConnectionOrThrowError(dbName: string): Database {
    const databaseNames = Object.keys(this.databases);

    if (!databaseNames.includes(dbName)) {
      throw new Error(`No connection available for database "${dbName}"`);
    }

    return this.databases[dbName];
  }

  /**
   * Gets the value of an option from the options object.
   * If the `optionKey` does not exist and there is no `defaultValue` defined, an exception is thrown.
   * If the `optionKey` does not exist but there is a `defaultValue`, the `defaultValue` is returned.
   *
   * @param options
   * @param optionKey
   * @param defaultValue
   * @returns
   */
  private getOptionValue(
    options: { [optionKey: string]: any },
    optionKey: string,
    defaultValue: any = undefined,
  ): any {
    const optionKeys = Object.keys(options);

    if (!optionKeys.includes(optionKey)) {
      if (defaultValue === undefined) {
        throw new Error(`Must provide "${optionKey}" in options.`);
      } else {
        return defaultValue;
      }
    }

    return options[optionKey];
  }

  ////////////////////////////////
  //// UNIMPLEMENTED METHODS
  ////////////////////////////////

  async getMigratableDbList(
    options: capSQLitePathOptions,
  ): Promise<capSQLiteValues> {
    console.log('getCordovaDbList', options);
    throw new Error('Method not implemented.');
  }

  async addSQLiteSuffix(options: capSQLitePathOptions): Promise<void> {
    console.log(`${JSON.stringify(options)}`);
    throw new Error('Method not implemented.');
  }
  async deleteOldDatabases(options: capSQLitePathOptions): Promise<void> {
    console.log(`${JSON.stringify(options)}`);
    throw new Error('Method not implemented.');
  }
  async moveDatabasesAndAddSuffix(
    options: capSQLitePathOptions,
  ): Promise<void> {
    console.log(`${JSON.stringify(options)}`);
    throw new Error('Method not implemented.');
  }

  async getUrl(): Promise<capSQLiteUrl> {
    throw new Error('Method not implemented.');
  }

  async initWebStore(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async saveToStore(options: capSQLiteOptions): Promise<void> {
    console.log(`${JSON.stringify(options)}`);
    throw new Error('Method not implemented.');
  }

  async isSecretStored(): Promise<capSQLiteResult> {
    throw new Error('Method not implemented.');
  }

  async setEncryptionSecret(options: capSetSecretOptions): Promise<void> {
    console.log(`${JSON.stringify(options)}`);
    throw new Error('Method not implemented.');
  }

  async changeEncryptionSecret(options: capChangeSecretOptions): Promise<void> {
    console.log(`${JSON.stringify(options)}`);
    throw new Error('Method not implemented.');
  }

  async clearEncryptionSecret(): Promise<void> {
    console.log('clearEncryptionSecret');
    throw new Error('Method not implemented.');
  }

  async getNCDatabasePath(
    options: capNCDatabasePathOptions,
  ): Promise<capNCDatabasePathResult> {
    console.log('getNCDatabasePath', options);
    throw new Error('Method not implemented.');
  }

  async createNCConnection(options: capNCConnectionOptions): Promise<void> {
    console.log('createNCConnection', options);
    throw new Error('Method not implemented.');
  }

  async closeNCConnection(options: capNCOptions): Promise<void> {
    console.log('closeNCConnection', options);
    throw new Error('Method not implemented.');
  }

  async isNCDatabase(options: capNCOptions): Promise<capSQLiteResult> {
    console.log('isNCDatabase', options);
    throw new Error('Method not implemented.');
  }
}
