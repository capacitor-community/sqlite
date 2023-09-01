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
  capSQLiteVersionUpgrade,
  capVersionResult,
  JsonSQLite,
  Changes,
} from '../../src/definitions';

import { GlobalSQLite } from './GlobalSQLite';
import { Database } from './electron-utils/Database';
import { UtilsJson } from './electron-utils/ImportExportJson/utilsJson';
import { UtilsJsonEncryption } from './electron-utils/ImportExportJson/utilsJsonEncryption';
import { UtilsFile } from './electron-utils/utilsFile';
import { UtilsSQLite } from './electron-utils/utilsSQLite';
import { UtilsSecret } from './electron-utils/utilsSecret';

export class CapacitorSQLite implements CapacitorSQLitePlugin {
  private versionUpgrades: Record<
    string,
    Record<number, capSQLiteVersionUpgrade>
  > = {};
  private databases: { [databasename: string]: Database } = {};
  private fileUtil: UtilsFile = new UtilsFile();
  private sqliteUtil: UtilsSQLite = new UtilsSQLite();
  private jsonUtil: UtilsJson = new UtilsJson();
  private jsonEncryptUtil: UtilsJsonEncryption = new UtilsJsonEncryption();
  private secretUtil: UtilsSecret = new UtilsSecret();
  private globalUtil: GlobalSQLite = new GlobalSQLite();
  private isEncryption: boolean = this.fileUtil.getIsEncryption();

  async createConnection(options: capConnectionOptions): Promise<void> {
    const optionKeys = Object.keys(options);

    if (!optionKeys.includes('database')) {
      throw new Error('Must provide a database name');
    }
    const dbName: string = options.database;
    const version: number = options.version ? options.version : 1;

    let encrypted = options.encrypted ? options.encrypted : false;
    if (!this.isEncryption && encrypted) {
      throw new Error(
        'Must set electronIsEncryption = true in capacitor.config.ts',
      );
    }
    let inMode: string =
      encrypted && options.mode === 'secret'
        ? 'secret'
        : encrypted && options.mode === 'encryption'
        ? 'encryption'
        : 'no-encryption';
    if (!this.isEncryption) {
      encrypted = false;
      inMode = 'no-encryption';
    }
    const readonly: boolean = options.readonly ? options.readonly : false;

    let upgrades: Record<number, capSQLiteVersionUpgrade> = {};
    const versionUpgradeKeys: string[] = Object.keys(this.versionUpgrades);

    if (
      versionUpgradeKeys.length !== 0 &&
      versionUpgradeKeys.includes(dbName)
    ) {
      upgrades = this.versionUpgrades[dbName];
    }
    const connName = readonly ? 'RO_' + dbName : 'RW_' + dbName;

    const databaseConnection: Database = new Database(
      dbName + 'SQLite.db',
      encrypted,
      inMode,
      version,
      this.isEncryption,
      readonly,
      upgrades,
      this.globalUtil,
    );

    this.databases[connName] = databaseConnection;

    return;
  }
  async closeConnection(options: capSQLiteOptions): Promise<void> {
    const dbName: string = this.getOptionValue(options, 'database');
    const readonly: boolean = options.readonly ? options.readonly : false;
    const connName = readonly ? 'RO_' + dbName : 'RW_' + dbName;
    const database = this.getDatabaseConnectionOrThrowError(connName);

    try {
      if (database.isDBOpen()) {
        // close the database
        database.dbClose();
      }
    } catch (err) {
      throw new Error(
        `CloseConnection command failed:  close ${dbName} failed ${err.message}`,
      );
    } finally {
      // remove the connection from dictionary
      delete this.databases[connName];
    }

    return;
  }
  async echo(options: capEchoOptions): Promise<capEchoResult> {
    const echoValue = this.getOptionValue(options, 'value');

    const echoResult: capEchoResult = {} as capEchoResult;
    echoResult.value = echoValue;
    return echoResult;
  }

  async open(options: capSQLiteOptions): Promise<void> {
    const dbName: string = this.getOptionValue(options, 'database');
    const readonly: boolean = options.readonly ? options.readonly : false;
    const connName = readonly ? 'RO_' + dbName : 'RW_' + dbName;
    const database = this.getDatabaseConnectionOrThrowError(connName);

    try {
      await database.open();
      return;
    } catch (err) {
      throw new Error(`Open: ${err}`);
    }
  }

  async close(options: capSQLiteOptions): Promise<void> {
    const dbName: string = this.getOptionValue(options, 'database');
    const readonly: boolean = options.readonly ? options.readonly : false;
    const connName = readonly ? 'RO_' + dbName : 'RW_' + dbName;
    const database = this.getDatabaseConnectionOrThrowError(connName);

    if (database.isDBOpen()) {
      try {
        database.dbClose();
        return;
      } catch (err) {
        throw new Error(`Close: ${err}`);
      }
    } else {
      const msg = `Database ${dbName} not opened`;
      throw new Error(`Close: ${msg}`);
    }
  }
  async beginTransaction(options: capSQLiteOptions): Promise<capSQLiteChanges> {
    const dbName: string = this.getOptionValue(options, 'database');
    const connName = 'RW_' + dbName;
    const database = this.getDatabaseConnectionOrThrowError(connName);
    if (database.isDBOpen()) {
      try {
        const changes = database.dbBeginTransaction();
        return {changes:{changes:changes}};
      } catch (err) {
        throw new Error(`BeginTransaction: ${err}`);
      }
    } else {
      const msg = `Database ${dbName} not opened`;
      throw new Error(`BeginTransaction: ${msg}`);
    }
  }
  async commitTransaction(options: capSQLiteOptions): Promise<capSQLiteChanges> {
    const dbName: string = this.getOptionValue(options, 'database');
    const connName = 'RW_' + dbName;
    const database = this.getDatabaseConnectionOrThrowError(connName);
    if (database.isDBOpen()) {
      try {
        const changes = database.dbCommitTransaction();
        return {changes:{changes:changes}};
      } catch (err) {
        throw new Error(`CommitTransaction: ${err}`);
      }
    } else {
      const msg = `Database ${dbName} not opened`;
      throw new Error(`CommitTransaction: ${msg}`);
    }
  }
  async rollbackTransaction(options: capSQLiteOptions): Promise<capSQLiteChanges> {
    const dbName: string = this.getOptionValue(options, 'database');
    const connName = 'RW_' + dbName;
    const database = this.getDatabaseConnectionOrThrowError(connName);
    if (database.isDBOpen()) {
      try {
        const changes = database.dbRollbackTransaction();
        return {changes:{changes:changes}};
      } catch (err) {
        throw new Error(`RollbackTransaction: ${err}`);
      }
    } else {
      const msg = `Database ${dbName} not opened`;
      throw new Error(`RollbackTransaction: ${msg}`);
    }
  }
  async isTransactionActive(options: capSQLiteOptions): Promise<capSQLiteResult> {
    const dbName: string = this.getOptionValue(options, 'database');
    const connName = 'RW_' + dbName;
    const database = this.getDatabaseConnectionOrThrowError(connName);
    if (database.isDBOpen()) {
      try {
        const ret = database.isTransActive();
        return {result:ret};
      } catch (err) {
        throw new Error(`IsTransactionActive: ${err}`);
      }
    } else {
      const msg = `Database ${dbName} not opened`;
      throw new Error(`IsTransactionActive: ${msg}`);
    }
  }

  async getVersion(options: capSQLiteOptions): Promise<capVersionResult> {
    const dbName: string = this.getOptionValue(options, 'database');
    const readonly: boolean = options.readonly ? options.readonly : false;
    const connName = readonly ? 'RO_' + dbName : 'RW_' + dbName;
    const database = this.getDatabaseConnectionOrThrowError(connName);

    if (database.isDBOpen()) {
      try {
        const version: number = await database.getVersion();
        const versionResult: capVersionResult = {} as capVersionResult;
        versionResult.version = version;

        return versionResult;
      } catch (err) {
        throw new Error(`GetVersion: ${err}`);
      }
    } else {
      const msg = `Database ${dbName} not opened`;
      throw new Error(`GetVersion: ${msg}`);
    }
  }

  async getTableList(options: capSQLiteOptions): Promise<capSQLiteValues> {
    const dbName: string = this.getOptionValue(options, 'database');
    const readonly: boolean = options.readonly ? options.readonly : false;
    const connName = readonly ? 'RO_' + dbName : 'RW_' + dbName;
    const database = this.getDatabaseConnectionOrThrowError(connName);

    if (database.isDBOpen()) {
      try {
        const tableList = await database.getTableList();
        const tableListResult: capSQLiteValues = {} as capSQLiteValues;
        tableListResult.values = tableList;

        return tableListResult;
      } catch (err) {
        throw new Error(`GetTableList: ${err}`);
      }
    } else {
      const msg = `Database ${dbName} not opened`;
      throw new Error(`GetTableList: ${msg}`);
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
    const readonly: boolean = options.readonly ? options.readonly : false;
    const isSQL92: boolean = (Object.keys(options)).includes('isSQL92') ? options.isSQL92 : true;

    const connName = 'RW_' + dbName;

    const database = this.getDatabaseConnectionOrThrowError(connName);

    if (database.isDBOpen()) {
      if (readonly) {
        const msg = 'not allowed in read-only mode ';
        throw new Error(`Execute: ${msg}`);
      }
      try {
        const executeResult: number = database.executeSQL(
          statements,
          transaction,
          isSQL92
        );

        if (executeResult < 0) {
          throw new Error('Execute changes < 0');
        } else {
          return { changes: { changes: executeResult } };
        }
      } catch (err) {
        throw new Error(`Execute: ${err}`);
      }
    } else {
      const msg = `Database ${dbName} not opened`;
      throw new Error(`Execute: ${msg}`);
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

    const readonly: boolean = options.readonly ? options.readonly : false;
    const returnMode: string = options.returnMode ? options.returnMode : 'no';
    const isSQL92: boolean = (Object.keys(options)).includes('isSQL92') ? options.isSQL92 : true;

    const connName = 'RW_' + dbName;

    const database = this.getDatabaseConnectionOrThrowError(connName);
    for (const sStmt of setOfStatements) {
      if (!('statement' in sStmt) || !('values' in sStmt)) {
        throw new Error(
          'ExecuteSet: Must provide a set as ' + 'Array of {statement,values}',
        );
      }
    }

    if (database.isDBOpen()) {
      if (readonly) {
        const msg = 'not allowed in read-only mode ';
        throw new Error(`ExecuteSet failed: ${msg}`);
      }

      try {
        const execSetResult: Changes = database.execSet(
          setOfStatements,
          transaction,
          returnMode,
          isSQL92
        );
        if (execSetResult.lastId < 0) {
          throw new Error(`ExecuteSet failed changes <0`);
        } else {
          return { changes: execSetResult };
        }
      } catch (err) {
        throw new Error(`ExecuteSet failed: ${err}`);
      }
    } else {
      const msg = `Database ${dbName} not opened`;
      throw new Error(`ExecuteSet failed: ${msg}`);
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

    const readonly: boolean = options.readonly ? options.readonly : false;
    const returnMode: string = options.returnMode ? options.returnMode : 'no';
    const isSQL92: boolean = (Object.keys(options)).includes('isSQL92') ? options.isSQL92 : true;

    const connName = 'RW_' + dbName;

    const database = this.getDatabaseConnectionOrThrowError(connName);

    if (database.isDBOpen()) {
      if (readonly) {
        const msg = 'not allowed in read-only mode ';
        throw new Error(`Run failed: ${msg}`);
      }
      try {
        const runResult = database.runSQL(
          statement,
          values,
          transaction,
          returnMode,
          isSQL92
        );
        return { changes: runResult };
      } catch (err) {
        throw new Error(`RUN failed: ${err} `);
      }
    } else {
      const msg = `Database ${dbName} not opened`;
      throw new Error(`Run failed: ${msg}`);
    }
  }

  async query(options: capSQLiteQueryOptions): Promise<capSQLiteValues> {
    const dbName: string = this.getOptionValue(options, 'database');
    const statement: string = this.getOptionValue(options, 'statement');
    const values: any[] = this.getOptionValue(options, 'values', []);

    if (statement.length === 0) {
      throw new Error('Query: Statement may not be an empty string.');
    }
    const readonly: boolean = options.readonly ? options.readonly : false;
    const isSQL92: boolean = (Object.keys(options)).includes('isSQL92') ? options.isSQL92 : true;

    const connName = readonly ? 'RO_' + dbName : 'RW_' + dbName;
    const database = this.getDatabaseConnectionOrThrowError(connName);

    if (database.isDBOpen()) {
      try {
        const queryResult: any[] = database.selectSQL(statement, values, isSQL92);
        return { values: queryResult };
      } catch (err) {
        throw new Error(`Query: ${err}`);
      }
    } else {
      const msg = `Database ${dbName} not opened`;
      throw new Error(`Query: ${msg}`);
    }
  }

  async isDBExists(options: capSQLiteOptions): Promise<capSQLiteResult> {
    const dbName: string = this.getOptionValue(options, 'database');

    const readonly: boolean = options.readonly ? options.readonly : false;
    const connName = readonly ? 'RO_' + dbName : 'RW_' + dbName;
    this.getDatabaseConnectionOrThrowError(connName);

    //    if (database.isDBOpen()) {

    const isExists: boolean = this.fileUtil.isFileExists(dbName + 'SQLite.db');
    return { result: isExists };
    //    } else {
    //      const msg = `Database ${dbName} not opened`;
    //     throw new Error(`isDBExists: ${msg}`);
    //    }
  }

  async isDBOpen(options: capSQLiteOptions): Promise<capSQLiteResult> {
    const dbName: string = this.getOptionValue(options, 'database');
    const readonly: boolean = options.readonly ? options.readonly : false;
    const connName = readonly ? 'RO_' + dbName : 'RW_' + dbName;
    const database = this.getDatabaseConnectionOrThrowError(connName);

    const isOpen: boolean = database.isDBOpen();
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

    const readonly: boolean = options.readonly ? options.readonly : false;
    const connName = readonly ? 'RO_' + dbName : 'RW_' + dbName;
    const database = this.getDatabaseConnectionOrThrowError(connName);

    if (database.isDBOpen()) {
      try {
        const isTableExistsResult: boolean = await database.isTableExists(
          tableName,
        );
        return { result: isTableExistsResult };
      } catch (err) {
        throw new Error(`isTableExists: ${err}`);
      }
    } else {
      const msg = `Database ${dbName} not opened`;
      throw new Error(`isTableExists: ${msg}`);
    }
  }

  async deleteDatabase(options: capSQLiteOptions): Promise<void> {
    const dbName: string = this.getOptionValue(options, 'database');
    const readonly: boolean = options.readonly ? options.readonly : false;

    const connName = 'RW_' + dbName;

    const database = this.getDatabaseConnectionOrThrowError(connName);

    if (readonly) {
      const msg = 'not allowed in read-only mode ';
      throw new Error(`DeleteDatabase failed: ${msg}`);
    }

    try {
      await database.deleteDB(dbName + 'SQLite.db');
      return;
    } catch (err) {
      throw new Error(`DeleteDatabase: ${err}`);
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

    let jsonObj = JSON.parse(jsonString);
    let inMode = 'no-encryption';
    const key = 'expData';
    if (key in jsonObj) {
      // Decrypt the data
      inMode = 'secret';
      jsonObj = this.jsonEncryptUtil.decryptJSONObject(jsonObj.expData);
    }
    const isValid = this.jsonUtil.isJsonSQLite(jsonObj);

    if (!isValid) {
      throw new Error('Must provide a valid JsonSQLite Object');
    }

    const vJsonObj: JsonSQLite = jsonObj;
    const dbName = `${vJsonObj.database}SQLite.db`;
    const targetDbVersion: number = vJsonObj.version ?? 1;
    const overwrite: boolean = vJsonObj.overwrite ?? false;
    const encrypted: boolean = vJsonObj.encrypted ?? false;
    const mode: string = vJsonObj.mode ?? 'full';
    if (!this.isEncryption && encrypted) {
      throw new Error(
        'Must set electronIsEncryption = true in capacitor.config.ts',
      );
    }
    // Create the database
    const database: Database = new Database(
      dbName,
      encrypted,
      inMode,
      targetDbVersion,
      this.isEncryption,
      false,
      {},
      this.globalUtil,
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
      database.dbClose();
      return { changes: { changes: changes } };
    } catch (err) {
      throw new Error(`ImportFromJson: ${err}`);
    }
  }

  async exportToJson(options: capSQLiteExportOptions): Promise<capSQLiteJson> {
    const dbName: string = this.getOptionValue(options, 'database');
    const exportMode: string = this.getOptionValue(options, 'jsonexportmode');
    const readonly: boolean = this.getOptionValue(options,'readonly',false);
    const encrypted: boolean = this.getOptionValue(options,'encrypted', false);
    const connName = readonly ? 'RO_' + dbName : 'RW_' + dbName;
    const database = this.getDatabaseConnectionOrThrowError(connName);
    if (database.isDBOpen()) {
      try {
        const exportJsonResult: any = database.exportJson(exportMode, encrypted);
        const resultKeys = Object.keys(exportJsonResult);

        if (resultKeys.includes('message')) {
          throw new Error(`exportToJson: ${exportJsonResult.message}`);
        } else {
          return { export: exportJsonResult };
        }
      } catch (err) {
        throw new Error(`ExportToJson: ${err}`);
      }
    } else {
      const msg = `Database ${dbName} not opened`;
      throw new Error(`ExportToJson: ${msg}`);
    }
  }

  async createSyncTable(options: capSQLiteOptions): Promise<capSQLiteChanges> {
    const dbName: string = this.getOptionValue(options, 'database');
    const readonly: boolean = options.readonly ? options.readonly : false;

    const connName = 'RW_' + dbName;

    const database = this.getDatabaseConnectionOrThrowError(connName);

    if (database.isDBOpen()) {
      if (readonly) {
        const msg = 'not allowed in read-only mode ';
        throw new Error(`CreateSyncTable failed: ${msg}`);
      }
      try {
        const createTableSyncResult: number = await database.createSyncTable();
        return {
          changes: { changes: createTableSyncResult },
        };
      } catch (err) {
        throw new Error(`CreateSyncTable: ${err}`);
      }
    } else {
      const msg = `Database ${dbName} not opened`;
      throw new Error(`CreateSyncTable: ${msg}`);
    }
  }
  async setSyncDate(options: capSQLiteSyncDateOptions): Promise<void> {
    const dbName: string = this.getOptionValue(options, 'database');
    const syncDate: string = this.getOptionValue(options, 'syncdate');

    const readonly: boolean = options.readonly ? options.readonly : false;

    const connName = 'RW_' + dbName;

    const database = this.getDatabaseConnectionOrThrowError(connName);

    if (database.isDBOpen()) {
      if (readonly) {
        const msg = 'not allowed in read-only mode ';
        throw new Error(`SetSyncDate failed: ${msg}`);
      }

      try {
        await database.setSyncDate(syncDate);
        return;
      } catch (err) {
        throw new Error(`SetSyncDate: ${err}`);
      }
    } else {
      const msg = `Database ${dbName} not opened`;
      throw new Error(`SetSyncDate: ${msg}`);
    }
  }

  async getSyncDate(options: capSQLiteOptions): Promise<capSQLiteSyncDate> {
    const dbName: string = this.getOptionValue(options, 'database');
    const readonly: boolean = options.readonly ? options.readonly : false;
    const connName = readonly ? 'RO_' + dbName : 'RW_' + dbName;
    const database = this.getDatabaseConnectionOrThrowError(connName);

    if (database.isDBOpen()) {
      try {
        const ret: any = await database.getSyncDate();
        return Promise.resolve(ret);
      } catch (err) {
        throw new Error(`GetSyncDate: ${err}`);
      }
    } else {
      const msg = `Database ${dbName} not opened`;
      throw new Error(`GetSyncDate: ${msg}`);
    }
  }

  async deleteExportedRows(options: capSQLiteOptions): Promise<void> {
    const dbName: string = this.getOptionValue(options, 'database');
    const readonly: boolean = options.readonly ? options.readonly : false;

    const connName = 'RW_' + dbName;

    const database = this.getDatabaseConnectionOrThrowError(connName);

    if (database.isDBOpen()) {
      if (readonly) {
        const msg = 'not allowed in read-only mode ';
        throw new Error(`DeleteExportedRows: ${msg}`);
      }
      try {
        await database.deleteExportedRows();
        return Promise.resolve();
      } catch (err) {
        throw new Error(`DeleteExportedRows: ${err}`);
      }
    } else {
      const msg = `Database ${dbName} not opened`;
      throw new Error(`DeleteExportedRows: ${msg}`);
    }
  }

  async addUpgradeStatement(options: capSQLiteUpgradeOptions): Promise<void> {
    const dbName: string = this.getOptionValue(options, 'database');
    const upgrades: capSQLiteVersionUpgrade[] = this.getOptionValue(
      options,
      'upgrade',
    );

    for (const upgrade of upgrades) {
      const versionUpgradeKeys = Object.keys(upgrade);
      if (
        !versionUpgradeKeys.includes('toVersion') ||
        !versionUpgradeKeys.includes('statements')
      ) {
        throw new Error(
          'Must provide an upgrade capSQLiteVersionUpgrade Object',
        );
      }
      if (typeof upgrade.toVersion != 'number') {
        throw new Error('upgrade.toVersion must be a number');
      }
      if (this.versionUpgrades[dbName]) {
        this.versionUpgrades[dbName][upgrade.toVersion] = upgrade;
      } else {
        const upgradeVersionDict: Record<number, capSQLiteVersionUpgrade> = {};
        upgradeVersionDict[upgrade.toVersion] = upgrade;
        this.versionUpgrades[dbName] = upgradeVersionDict;
      }
    }
    console.log(
      `this.versionUpgrades: ${JSON.stringify(this.versionUpgrades)}`,
    );
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
        if (this.fileUtil.getExtName(db) === '.db') {
          // for each copy the file to the Application database folder
          await this.fileUtil.copyFromAssetToDatabase(db, overwrite);
        }
        if (this.fileUtil.getExtName(db) === '.zip') {
          const assetPath = this.fileUtil.getAssetsDatabasesPath();
          await this.fileUtil.unzipDatabase(db, assetPath, overwrite);
        }
      });

      return;
    } else {
      throw new Error(
        `CopyFromAssets: assets/databases folder does not exist:[${assetsDbPath}]`,
      );
    }
  }

  async getFromHTTPRequest(options: capSQLiteHTTPOptions): Promise<void> {
    const url: string = this.getOptionValue(options, 'url', '');
    const overwrite: boolean = this.getOptionValue(options, 'overwrite', false);
    if (url.length === 0) {
      throw new Error(`getFromHTTPRequest: You must give a database url`);
    }
    const cachePath = this.fileUtil.getCachePath();
    await this.fileUtil.downloadFileFromHTTP(url, cachePath);
    if (this.fileUtil.getExtName(url) === '.zip') {
      const zipName = `${this.fileUtil.getBaseName(url)}.zip`;
      await this.fileUtil.unzipDatabase(zipName, cachePath, overwrite);
    }
    if (overwrite) {
      await this.fileUtil.moveDatabaseFromCache();
    } else {
      throw new Error(
        `getFromHTTPRequest: cannot move file from cache overwrite: ${overwrite}`,
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
    const openModes: string[] = this.getOptionValue(options, 'openModes');
    const checkConsistencyResult: capSQLiteResult = {} as capSQLiteResult;
    checkConsistencyResult.result = false;
    const dbConns: string[] = [];
    dbNames.forEach((value, i) => {
      dbConns.push(`${openModes[i]}_${value}`);
    });

    try {
      let inConnectionsSet: Set<string> = new Set(Object.keys(this.databases));
      const outConnectionSet: Set<string> = new Set(dbConns);
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
            let readonly = false;
            if (key.substring(0, 3) === 'RO_') {
              readonly = true;
            }
            opt.database = key.substring(3);
            opt.readonly = readonly;
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
  async isSecretStored(): Promise<capSQLiteResult> {
    if (!this.isEncryption) {
      throw new Error(
        `isSecretStored: Not available electronIsEncryption = false in capacitor.config.ts`,
      );
    }

    try {
      const isStored = this.secretUtil.isSecretStored();
      return { result: isStored };
    } catch (err) {
      throw new Error(`isSecretStored: ${err}`);
    }
  }

  async setEncryptionSecret(options: capSetSecretOptions): Promise<void> {
    const isEncrypt = this.fileUtil.getIsEncryption();
    if (!isEncrypt) {
      throw new Error(
        `setEncryptionSecret: Not available electronIsEncryption = false in capacitor.config.ts`,
      );
    }
    const passphrase = options.passphrase ? options.passphrase : '';
    if (passphrase.length <= 0) {
      throw new Error(`setEncryptionSecret: You must give a passphrase`);
    }
    try {
      // check if already exists
      const isStored = this.secretUtil.isSecretStored();
      if (isStored) {
        throw new Error(`setEncryptionSecret: passphrase already in store`);
      }
      await this.closeAllConnections();
      this.secretUtil.setEncryptSecret(passphrase);
      return;
    } catch (err) {
      throw new Error(`setEncryptionSecret: ${err}`);
    }
  }

  async changeEncryptionSecret(options: capChangeSecretOptions): Promise<void> {
    const isEncrypt = this.fileUtil.getIsEncryption();
    if (!isEncrypt) {
      throw new Error(
        `changeEncryptionSecret: Not available electronIsEncryption = false in capacitor.config.ts`,
      );
    }
    const oldsecret = this.secretUtil.getPassphrase();
    const oldpassphrase = options.oldpassphrase ? options.oldpassphrase : '';
    if (oldpassphrase.length <= 0) {
      throw new Error(
        `changeEncryptionSecret: You must give the oldpassphrase`,
      );
    }
    if (oldpassphrase !== oldsecret) {
      throw new Error(
        `changeEncryptionSecret: the given oldpassphrase is wrong`,
      );
    }
    const passphrase = options.passphrase ? options.passphrase : '';
    if (passphrase.length <= 0) {
      throw new Error(`changetEncryptionSecret: You must give a passphrase`);
    }
    try {
      await this.closeAllConnections();
      this.secretUtil.changeEncryptSecret(oldpassphrase, passphrase);
      return;
    } catch (err) {
      throw new Error(`changetEncryptionSecret: ${err}`);
    }
  }

  async clearEncryptionSecret(): Promise<void> {
    const isEncrypt = this.fileUtil.getIsEncryption();
    if (!isEncrypt) {
      throw new Error(
        `clearEncryptionSecret: Not available electronIsEncryption = false in capacitor.config.ts`,
      );
    }
    if (this.globalUtil == null) {
      throw new Error(`clearEncryptionSecret: No available globalUtil`);
    }
    try {
      await this.closeAllConnections();
      this.secretUtil.clearEncryptSecret();
      return;
    } catch (err) {
      throw new Error(`clearEncryptionSecret: ${err}`);
    }
  }

  async isInConfigEncryption(): Promise<capSQLiteResult> {
    return Promise.resolve({ result: this.isEncryption });
  }

  async isDatabaseEncrypted(
    options: capSQLiteOptions,
  ): Promise<capSQLiteResult> {
    const dbName: string = this.getOptionValue(options, 'database');
    try {
      const isEncrypt: boolean = await this.sqliteUtil.isDatabaseEncrypted(
        dbName + 'SQLite.db',
      );
      return { result: isEncrypt };
    } catch (err) {
      throw new Error(`isDatabaseEncrypted: ${err}`);
    }
  }
  async checkEncryptionSecret(
    options: capSetSecretOptions,
  ): Promise<capSQLiteResult> {
    const isEncrypt = this.fileUtil.getIsEncryption();
    if (!isEncrypt) {
      throw new Error(
        `checkEncryptionSecret: Not available electronIsEncryption = false in capacitor.config.ts`,
      );
    }
    const passphrase = options.passphrase ? options.passphrase : '';
    if (passphrase.length <= 0) {
      throw new Error(`checkEncryptionSecret: You must give a passphrase`);
    }
    try {
      await this.closeAllConnections();
      const isSame: boolean = this.secretUtil.checkEncryptSecret(passphrase);
      return { result: isSame };
    } catch (err) {
      throw new Error(`checkEncryptionSecret: ${err}`);
    }
  }

  ////////////////////////////////
  //// PRIVATE METHODS
  ////////////////////////////////

  private async resetDbDict(keys: string[]): Promise<void> {
    try {
      for (const key of keys) {
        const opt: capSQLiteOptions = {} as capSQLiteOptions;
        let readonly = false;
        if (key.substring(0, 3) === 'RO_') {
          readonly = true;
        }
        opt.database = key.substring(3);
        opt.readonly = readonly;
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

  private async closeAllConnections(): Promise<void> {
    const databaseNames = Object.keys(this.databases);
    try {
      for (const name of databaseNames) {
        const db = this.databases[name];
        if (db.isDBOpen()) {
          db.dbClose();
        }
      }
      return;
    } catch (err) {
      throw new Error(`CloseAllConnection command failed: ${err.message}`);
    }
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

  async saveToLocalDisk(options: capSQLiteOptions): Promise<void> {
    console.log(`${JSON.stringify(options)}`);
    throw new Error('Method not implemented.');
  }

  async getFromLocalDiskToStore(
    options: capSQLiteLocalDiskOptions,
  ): Promise<void> {
    console.log(`${JSON.stringify(options)}`);
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

  async isInConfigBiometricAuth(): Promise<capSQLiteResult> {
    throw new Error('Not implemented on web.');
  }
}


