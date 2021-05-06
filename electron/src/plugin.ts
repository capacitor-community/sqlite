import { WebPlugin } from '@capacitor/core';

import type {
  CapacitorSQLitePlugin,
  capConnectionOptions,
  capEchoOptions,
  capEchoResult,
  capSQLiteChanges,
  capSQLiteExecuteOptions,
  capSQLiteExportOptions,
  capSQLiteImportOptions,
  capSQLiteJson,
  capSQLiteOptions,
  capSQLiteQueryOptions,
  capSQLiteResult,
  capSQLiteRunOptions,
  capSQLiteSetOptions,
  capSQLiteSyncDateOptions,
  capSQLiteUpgradeOptions,
  capSQLiteValues,
  capSQLiteVersionUpgrade,
  capSQLiteSyncDate,
  capSQLiteTableOptions,
  capSQLitePathOptions,
  JsonSQLite,
  capAllConnectionsOptions,
  capSetSecretOptions,
  capChangeSecretOptions,
} from './definitions';
import { Database } from './electron-utils/Database';
import { UtilsJson } from './electron-utils/ImportExportJson/utilsJson';
import { UtilsFile } from './electron-utils/utilsFile';
import { UtilsMigrate } from './electron-utils/utilsMigrate';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { remote } = require('electron');

export class CapacitorSQLiteElectronWeb
  extends WebPlugin
  implements CapacitorSQLitePlugin {
  RemoteRef: any = null;
  private _dbDict: any = {};
  private _uFile: UtilsFile = new UtilsFile();
  private _uJson: UtilsJson = new UtilsJson();
  private _uMigrate: UtilsMigrate = new UtilsMigrate();
  private _osType: string;
  private _versionUpgrades: Record<
    string,
    Record<number, capSQLiteVersionUpgrade>
  > = {};

  constructor() {
    super();
    console.log('CapacitorSQLite Electron');
    this.RemoteRef = remote;
    this._osType = this._uFile.osType;
  }
  async isSecretStored(): Promise<capSQLiteResult> {
    console.log('isSecretStored');
    throw this.unimplemented('Not implemented on Electron.');
  }
  async setEncryptionSecret(options: capSetSecretOptions): Promise<void> {
    console.log('setEncryptionSecret', options);
    throw this.unimplemented('Not implemented on Electron.');
  }
  async changeEncryptionSecret(options: capChangeSecretOptions): Promise<void> {
    console.log('changeEncryptionSecret', options);
    throw this.unimplemented('Not implemented on Electron.');
  }

  async createConnection(options: capConnectionOptions): Promise<void> {
    const keys = Object.keys(options);
    if (!keys.includes('database')) {
      return Promise.reject('Must provide a database name');
    }
    const dbName: string = options.database;
    const version: number = options.version ? options.version : 1;
    const encrypted: boolean =
      options.encrypted && this._osType === 'Darwin'
        ? options.encrypted
        : false;
    const inMode: string =
      options.mode && this._osType === 'Darwin'
        ? options.mode
        : 'no-encryption';
    let upgDict: Record<number, capSQLiteVersionUpgrade> = {};
    const vUpgKeys: string[] = Object.keys(this._versionUpgrades);
    if (vUpgKeys.length !== 0 && vUpgKeys.includes(dbName)) {
      upgDict = this._versionUpgrades[dbName];
    }
    const mDb: Database = new Database(
      dbName + 'SQLite.db',
      encrypted,
      inMode,
      version,
      upgDict,
    );
    this._dbDict[dbName] = mDb;
    return Promise.resolve();
  }
  async closeConnection(options: capSQLiteOptions): Promise<void> {
    let keys = Object.keys(options);
    if (!keys.includes('database')) {
      return Promise.reject('Must provide a database name');
    }
    const dbName: string = options.database;
    keys = Object.keys(this._dbDict);
    if (!keys.includes(dbName)) {
      return Promise.reject(
        'CloseConnection command failed: No ' +
          'available connection for ' +
          dbName,
      );
    }

    const mDB = this._dbDict[dbName];
    if (mDB.isDBOpen()) {
      // close the database
      try {
        await mDB.close();
      } catch (err) {
        return Promise.reject(
          'CloseConnection command failed: ' +
            'close ' +
            dbName +
            ' failed ' +
            err.message,
        );
      }
    }
    // remove the connection from dictionary
    delete this._dbDict[dbName];
    return Promise.resolve();
  }

  async echo(options: capEchoOptions): Promise<capEchoResult> {
    const ret: any = {};
    ret.value = options.value;
    return Promise.resolve(ret);
  }
  async open(options: capSQLiteOptions): Promise<void> {
    let keys = Object.keys(options);
    if (!keys.includes('database')) {
      return Promise.reject('Must provide a database name');
    }
    const dbName: string = options.database;
    keys = Object.keys(this._dbDict);
    if (!keys.includes(dbName)) {
      return Promise.reject(`Open: No available connection for ${dbName}`);
    }

    const mDB = this._dbDict[dbName];
    try {
      await mDB.open();
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(`Open: ${err.message}`);
    }
  }
  async close(options: capSQLiteOptions): Promise<void> {
    let keys = Object.keys(options);
    if (!keys.includes('database')) {
      return Promise.reject('Must provide a database name');
    }
    const dbName: string = options.database;
    keys = Object.keys(this._dbDict);
    if (!keys.includes(dbName)) {
      return Promise.reject(`Close: No available connection for ${dbName}`);
    }

    const mDB = this._dbDict[dbName];
    try {
      await mDB.close();
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(`Close: ${err.message}`);
    }
  }
  async checkConnectionsConsistency(
    options: capAllConnectionsOptions,
  ): Promise<capSQLiteResult> {
    console.log('checkConsistency', options);
    throw this.unimplemented('Not implemented on Electron.');
  }

  async execute(options: capSQLiteExecuteOptions): Promise<capSQLiteChanges> {
    let keys = Object.keys(options);
    if (!keys.includes('database')) {
      return Promise.reject('Must provide a database name');
    }
    if (!keys.includes('statements') || options.statements.length === 0) {
      return Promise.reject('Must provide raw SQL statements');
    }
    const dbName: string = options.database;
    const statements: string = options.statements;
    keys = Object.keys(this._dbDict);
    if (!keys.includes(dbName)) {
      return Promise.reject(`Execute: No available connection for ${dbName}`);
    }
    const mDB = this._dbDict[dbName];
    try {
      const ret: number = await mDB.executeSQL(statements);
      if (ret < 0) {
        return Promise.reject('Execute failed changes < 0');
      } else {
        return Promise.resolve({ changes: { changes: ret } });
      }
    } catch (err) {
      return Promise.reject(`Execute failed: ${err}`);
    }
  }
  async executeSet(options: capSQLiteSetOptions): Promise<capSQLiteChanges> {
    let keys = Object.keys(options);
    if (!keys.includes('database')) {
      return Promise.reject('Must provide a database name');
    }
    if (!keys.includes('set') || options.set.length === 0) {
      return Promise.reject('Must provide a non-empty set of SQL statements');
    }
    const dbName: string = options.database;
    const setOfStatements: any[] = options.set;
    keys = Object.keys(this._dbDict);
    if (!keys.includes(dbName)) {
      return Promise.reject(
        `ExecuteSet: No available connection for ${dbName}`,
      );
    }
    const mDB = this._dbDict[dbName];

    for (const sStmt of setOfStatements) {
      if (!('statement' in sStmt) || !('values' in sStmt)) {
        return Promise.reject(
          'ExecuteSet: Must provide a set as ' + 'Array of {statement,values}',
        );
      }
    }
    try {
      const ret: any = await mDB.execSet(setOfStatements);
      if (ret < 0) {
        return Promise.reject(`ExecuteSet failed changes <0`);
      } else {
        return Promise.resolve({ changes: ret });
      }
    } catch (err) {
      return Promise.reject(`ExecuteSet failed: ${err}`);
    }
  }
  async run(options: capSQLiteRunOptions): Promise<capSQLiteChanges> {
    let keys = Object.keys(options);
    if (!keys.includes('database')) {
      return Promise.reject('Must provide a database name');
    }
    if (!keys.includes('statement') || options.statement.length === 0) {
      return Promise.reject('Must provide a query statement');
    }
    if (!keys.includes('values')) {
      return Promise.reject('Must provide an Array of values');
    }
    const dbName: string = options.database;
    const statement: string = options.statement;
    const values: any[] = options.values.length > 0 ? options.values : [];
    keys = Object.keys(this._dbDict);
    if (!keys.includes(dbName)) {
      return Promise.reject(`Run: No available connection for ${dbName}`);
    }
    const mDB = this._dbDict[dbName];
    try {
      const ret: any = await mDB.runSQL(statement, values);
      return Promise.resolve({ changes: ret });
    } catch (err) {
      return Promise.reject(`RUN failed: ${err} `);
    }
  }
  async query(options: capSQLiteQueryOptions): Promise<capSQLiteValues> {
    let keys = Object.keys(options);
    if (!keys.includes('database')) {
      return Promise.reject('Must provide a database name');
    }
    if (!keys.includes('statement') || options.statement.length === 0) {
      return Promise.reject('Must provide a query statement');
    }
    if (!keys.includes('values')) {
      return Promise.reject('Must provide an Array of strings');
    }
    const dbName: string = options.database;
    const statement: string = options.statement;
    const values: string[] = options.values.length > 0 ? options.values : [];
    keys = Object.keys(this._dbDict);
    if (!keys.includes(dbName)) {
      return Promise.reject(`Query: No available connection for ${dbName}`);
    }
    const mDB = this._dbDict[dbName];
    let ret: any[] = [];
    try {
      ret = await mDB.selectSQL(statement, values);
      return Promise.resolve({ values: ret });
    } catch (err) {
      return Promise.reject(`Query failed: ${err}`);
    }
  }
  async isDBExists(options: capSQLiteOptions): Promise<capSQLiteResult> {
    let keys = Object.keys(options);
    if (!keys.includes('database')) {
      return Promise.reject('Must provide a database name');
    }
    const dbName: string = options.database;
    keys = Object.keys(this._dbDict);
    if (!keys.includes(dbName)) {
      return Promise.reject(
        'IsDBExists command failed: No available ' + 'connection for ' + dbName,
      );
    }
    const isExists: boolean = this._uFile.isFileExists(dbName + 'SQLite.db');
    return Promise.resolve({
      result: isExists,
    });
  }
  async isDBOpen(options: capSQLiteOptions): Promise<capSQLiteResult> {
    let keys = Object.keys(options);
    if (!keys.includes('database')) {
      return Promise.reject('Must provide a database name');
    }
    const dbName: string = options.database;
    keys = Object.keys(this._dbDict);
    if (!keys.includes(dbName)) {
      return Promise.reject(
        'isDBOpen command failed: No available ' + 'connection for ' + dbName,
      );
    }
    const mDB = this._dbDict[dbName];
    const isOpen: boolean = await mDB.isDBOpen();
    return Promise.resolve({ result: isOpen });
  }
  async isDatabase(options: capSQLiteOptions): Promise<capSQLiteResult> {
    const keys = Object.keys(options);
    if (!keys.includes('database')) {
      return Promise.reject('Must provide a database name');
    }
    const dbName: string = options.database;
    const isExists: boolean = this._uFile.isFileExists(dbName + 'SQLite.db');
    return Promise.resolve({
      result: isExists,
    });
  }

  async isTableExists(
    options: capSQLiteTableOptions,
  ): Promise<capSQLiteResult> {
    let keys = Object.keys(options);
    if (!keys.includes('database')) {
      return Promise.reject('Must provide a database name');
    }

    const dbName: string = options.database;
    if (!keys.includes('table')) {
      return Promise.reject('Must provide a table name');
    }
    const tableName: string = options.table;
    keys = Object.keys(this._dbDict);
    if (!keys.includes(dbName)) {
      return Promise.reject(
        'isTableExists command failed: No available ' +
          'connection for ' +
          dbName,
      );
    }
    const mDB = this._dbDict[dbName];
    try {
      const res: any = await mDB.isTableExists(tableName);
      return Promise.resolve({ result: res.result });
    } catch (err) {
      return Promise.reject(`isTableExists: ${err.message}`);
    }
  }
  async getDatabaseList(): Promise<capSQLiteValues> {
    // get the database folder
    const pathDatabase = this._uFile.getDatabasesPath();
    // get the list of databases
    const files: string[] = await this._uFile.getFileList(pathDatabase);
    if (files.length > 0) {
      return Promise.resolve({ values: files });
    } else {
      return Promise.reject(`isTableExists: No databases found`);
    }
  }
  async addSQLiteSuffix(options: capSQLitePathOptions): Promise<void> {
    const folderPath: string = options.folderPath
      ? options.folderPath
      : 'default';

    try {
      await this._uMigrate.addSQLiteSuffix(folderPath);
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(`addSQLiteSuffix: ${err.message}`);
    }
  }
  async deleteOldDatabases(options: capSQLitePathOptions): Promise<void> {
    const folderPath: string = options.folderPath
      ? options.folderPath
      : 'default';

    try {
      await this._uMigrate.deleteOldDatabases(folderPath);
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(`deleteOldDatabases: ${err.message}`);
    }
  }
  async deleteDatabase(options: capSQLiteOptions): Promise<void> {
    let keys = Object.keys(options);
    if (!keys.includes('database')) {
      return Promise.reject('Must provide a database name');
    }
    const dbName: string = options.database;
    keys = Object.keys(this._dbDict);
    if (!keys.includes(dbName)) {
      return Promise.reject(
        'deleteDatabase: No available connection for ' + `${dbName}`,
      );
    }

    const mDB = this._dbDict[dbName];
    try {
      await mDB.deleteDB(dbName + 'SQLite.db');
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(`Delete: ${err.message}`);
    }
  }
  async isJsonValid(options: capSQLiteImportOptions): Promise<capSQLiteResult> {
    const keys = Object.keys(options);
    if (!keys.includes('jsonstring')) {
      return Promise.reject('Must provide a json object');
    }
    const jsonStrObj: string = options.jsonstring;
    const jsonObj = JSON.parse(jsonStrObj);
    const isValid = this._uJson.isJsonSQLite(jsonObj);
    if (!isValid) {
      return Promise.reject('Stringify Json Object not Valid');
    } else {
      return Promise.resolve({ result: true });
    }
  }
  async importFromJson(
    options: capSQLiteImportOptions,
  ): Promise<capSQLiteChanges> {
    const keys = Object.keys(options);
    if (!keys.includes('jsonstring')) {
      return Promise.reject('Must provide a json object');
    }
    const jsonStrObj: string = options.jsonstring;
    const jsonObj = JSON.parse(jsonStrObj);
    const isValid = this._uJson.isJsonSQLite(jsonObj);
    if (!isValid) {
      return Promise.reject('Must provide a valid JsonSQLite Object');
    }
    const vJsonObj: JsonSQLite = jsonObj;
    const dbName = `${vJsonObj.database}SQLite.db`;
    const dbVersion: number = vJsonObj.version ?? 1;
    const encrypted: boolean = vJsonObj.encrypted ?? false;
    const mode: string = encrypted ? 'secret' : 'no-encryption';

    // Create the database
    const mDb: Database = new Database(dbName, encrypted, mode, dbVersion, {});
    try {
      // Open the database
      await mDb.open();
      // Import the JsonSQLite Object
      const changes = await mDb.importJson(vJsonObj);
      // Close the database
      await mDb.close();
      return Promise.resolve({ changes: { changes: changes } });
    } catch (err) {
      return Promise.reject(`ImportFromJson: ${err.message}`);
    }
  }
  async exportToJson(options: capSQLiteExportOptions): Promise<capSQLiteJson> {
    let keys = Object.keys(options);
    if (!keys.includes('database')) {
      return Promise.reject('Must provide a database name');
    }
    if (!keys.includes('jsonexportmode')) {
      return Promise.reject('Must provide a json export mode');
    }
    const dbName: string = options.database;
    const exportMode: string = options.jsonexportmode;
    keys = Object.keys(this._dbDict);
    if (!keys.includes(dbName)) {
      return Promise.reject(
        'exportToJson: No available connection for ' + `${dbName}`,
      );
    }
    const mDB = this._dbDict[dbName];
    try {
      const ret: any = await mDB.exportJson(exportMode);
      const keys = Object.keys(ret);
      if (keys.includes('message')) {
        return Promise.reject(`exportToJson: ${ret.message}`);
      } else {
        return Promise.resolve({ export: ret });
      }
    } catch (err) {
      return Promise.reject(`exportToJson: ${err.message}`);
    }
  }
  async createSyncTable(options: capSQLiteOptions): Promise<capSQLiteChanges> {
    let keys = Object.keys(options);
    if (!keys.includes('database')) {
      return Promise.reject('Must provide a database name');
    }
    const dbName: string = options.database;
    keys = Object.keys(this._dbDict);
    if (!keys.includes(dbName)) {
      return Promise.reject(
        'CreateSyncTable: No available connection for ' + `${dbName}`,
      );
    }

    const mDB = this._dbDict[dbName];
    try {
      const ret: number = await mDB.createSyncTable();
      return Promise.resolve({ changes: { changes: ret } });
    } catch (err) {
      return Promise.reject(`createSyncTable: ${err.message}`);
    }
  }
  async setSyncDate(options: capSQLiteSyncDateOptions): Promise<void> {
    let keys = Object.keys(options);
    if (!keys.includes('database')) {
      return Promise.reject('Must provide a database name');
    }
    if (!keys.includes('syncdate')) {
      return Promise.reject('Must provide a synchronization date');
    }
    const dbName: string = options.database;
    const syncDate: string = options.syncdate;
    keys = Object.keys(this._dbDict);
    if (!keys.includes(dbName)) {
      return Promise.reject(
        `SetSyncDate: No available connection for ${dbName}`,
      );
    }

    const mDB = this._dbDict[dbName];
    try {
      await mDB.setSyncDate(syncDate);
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(`SetSyncDate: ${err.message}`);
    }
  }
  async getSyncDate(
    options: capSQLiteSyncDateOptions,
  ): Promise<capSQLiteSyncDate> {
    let keys = Object.keys(options);
    if (!keys.includes('database')) {
      return Promise.reject('Must provide a database name');
    }
    const dbName: string = options.database;
    keys = Object.keys(this._dbDict);
    if (!keys.includes(dbName)) {
      return Promise.reject(
        `GetSyncDate: No available connection for ${dbName}`,
      );
    }

    const mDB = this._dbDict[dbName];
    try {
      const ret: any = await mDB.getSyncDate();
      return Promise.resolve(ret);
    } catch (err) {
      return Promise.reject(`GetSyncDate: ${err.message}`);
    }
  }
  async addUpgradeStatement(options: capSQLiteUpgradeOptions): Promise<void> {
    let keys = Object.keys(options);
    if (!keys.includes('database')) {
      return Promise.reject('Must provide a database name');
    }
    if (!keys.includes('upgrade')) {
      return Promise.reject('Must provide an upgrade statement');
    }
    const dbName: string = options.database;
    const upgrade = options.upgrade[0];
    keys = Object.keys(upgrade);
    if (
      !keys.includes('fromVersion') ||
      !keys.includes('toVersion') ||
      !keys.includes('statement')
    ) {
      return Promise.reject(
        'Must provide an upgrade capSQLiteVersionUpgrade Object',
      );
    }
    if (typeof upgrade.fromVersion != 'number') {
      return Promise.reject('ugrade.fromVersion must be a number');
    }
    const upgVDict: Record<number, capSQLiteVersionUpgrade> = {};
    upgVDict[upgrade.fromVersion] = upgrade;
    this._versionUpgrades[dbName] = upgVDict;
    return Promise.resolve();
  }
  async copyFromAssets(): Promise<void> {
    // check if the assets/database folder exists
    const assetsDbPath = this._uFile.getAssetsDatabasesPath();
    const res: boolean = this._uFile.isPathExists(assetsDbPath);
    if (res) {
      // get the database files
      const dbList: string[] = await this._uFile.getFileList(assetsDbPath);
      // loop through the database files
      const toDbList: string[] = [];
      dbList.forEach(async (db: string) => {
        console.log(`>>> ${db}`);
        // for each check if the suffix SQLite.db is there or add it
        const toDb: string = this._uFile.setPathSuffix(db);
        toDbList.push(toDb);
        // for each copy the file to the Application database folder
        await this._uFile.copyFromAssetToDatabase(db, toDb);
      });
      return Promise.resolve();
    } else {
      return Promise.reject(
        'CopyFromAssets: assets/databases folder does not exist',
      );
    }
  }
}
