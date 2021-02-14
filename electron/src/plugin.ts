import { WebPlugin } from '@capacitor/core';
import {
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
} from './definitions';
import { Database } from './electron-utils/Database';
import { UtilsFile } from './electron-utils/utilsFile';
import { UtilsJson } from './electron-utils/ImportExportJson/utilsJson';
import { UtilsMigrate } from './electron-utils/utilsMigrate';

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
    super({
      name: 'CapacitorSQLite',
      platforms: ['electron'],
    });
    console.log('CapacitorSQLite Electron');
    this.RemoteRef = remote;
    this._osType = this._uFile.osType;
  }
  async createConnection(
    options: capConnectionOptions,
  ): Promise<capSQLiteResult> {
    const keys = Object.keys(options);
    if (!keys.includes('database')) {
      return Promise.resolve({
        result: false,
        message: 'Must provide a database name',
      });
    }
    const dbName: string = options.database!;
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
    let mDb: Database = new Database(
      dbName + 'SQLite.db',
      encrypted,
      inMode,
      version,
      upgDict,
    );
    this._dbDict[dbName] = mDb;
    return Promise.resolve({ result: true });
  }
  async closeConnection(options: capSQLiteOptions): Promise<capSQLiteResult> {
    let keys = Object.keys(options);
    if (!keys.includes('database')) {
      return Promise.resolve({
        result: false,
        message: 'Must provide a database name',
      });
    }
    const dbName: string = options.database!;
    keys = Object.keys(this._dbDict);
    if (!keys.includes(dbName)) {
      return Promise.resolve({
        result: false,
        message:
          'CloseConnection command failed: No ' +
          'available connection for ' +
          dbName,
      });
    }

    const mDB = this._dbDict[dbName];
    if (mDB.isDBOpen()) {
      // close the database
      try {
        await mDB.close();
      } catch (err) {
        return Promise.resolve({
          result: false,
          message:
            'CloseConnection command failed: ' +
            'close ' +
            dbName +
            ' failed ' +
            err.message,
        });
      }
    }
    // remove the connection from dictionary
    delete this._dbDict[dbName];
    return Promise.resolve({ result: true });
  }

  async echo(options: capEchoOptions): Promise<capEchoResult> {
    const ret: any = {};
    ret.value = options.value;
    return ret;
  }
  async open(options: capSQLiteOptions): Promise<capSQLiteResult> {
    let keys = Object.keys(options);
    if (!keys.includes('database')) {
      return Promise.resolve({
        result: false,
        message: 'Must provide a database name',
      });
    }
    const dbName: string = options.database!;
    keys = Object.keys(this._dbDict);
    if (!keys.includes(dbName)) {
      return Promise.resolve({
        result: false,
        message: `Open: No available connection for ${dbName}`,
      });
    }

    const mDB = this._dbDict[dbName];
    try {
      await mDB.open();
      return Promise.resolve({ result: true });
    } catch (err) {
      return Promise.resolve({
        result: false,
        message: `Open: ${err.message}`,
      });
    }
  }
  async close(options: capSQLiteOptions): Promise<capSQLiteResult> {
    let keys = Object.keys(options);
    if (!keys.includes('database')) {
      return Promise.resolve({
        result: false,
        message: 'Must provide a database name',
      });
    }
    const dbName: string = options.database!;
    keys = Object.keys(this._dbDict);
    if (!keys.includes(dbName)) {
      return Promise.resolve({
        result: false,
        message: `Close: No available connection for ${dbName}`,
      });
    }

    const mDB = this._dbDict[dbName];
    try {
      await mDB.close();
      return Promise.resolve({ result: true });
    } catch (err) {
      return Promise.resolve({
        result: false,
        message: `Close: ${err.message}`,
      });
    }
  }
  async execute(options: capSQLiteExecuteOptions): Promise<capSQLiteChanges> {
    let keys = Object.keys(options);
    if (!keys.includes('database')) {
      return Promise.resolve({
        changes: { changes: -1 },
        message: 'Must provide a database name',
      });
    }
    if (!keys.includes('statements') || options.statements!.length === 0) {
      return Promise.resolve({
        changes: { changes: -1 },
        message: 'Must provide raw SQL statements',
      });
    }
    const dbName: string = options.database!;
    const statements: string = options.statements!;
    keys = Object.keys(this._dbDict);
    if (!keys.includes(dbName)) {
      return Promise.resolve({
        changes: { changes: -1 },
        message: `Execute: No available connection for ${dbName}`,
      });
    }
    const mDB = this._dbDict[dbName];
    try {
      const ret: number = await mDB.executeSQL(statements);
      if (ret < 0) {
        return Promise.resolve({
          changes: { changes: -1 },
          message: 'Execute failed',
        });
      } else {
        return Promise.resolve({ changes: { changes: ret } });
      }
    } catch (err) {
      return Promise.resolve({
        changes: { changes: -1 },
        message: `Execute failed: ${err}`,
      });
    }
  }
  async executeSet(options: capSQLiteSetOptions): Promise<capSQLiteChanges> {
    let keys = Object.keys(options);
    if (!keys.includes('database')) {
      return Promise.resolve({
        changes: { changes: -1 },
        message: 'Must provide a database name',
      });
    }
    if (!keys.includes('set') || options.set!.length === 0) {
      return Promise.resolve({
        changes: { changes: -1 },
        message: 'Must provide a non-empty set of SQL ' + 'statements',
      });
    }
    const dbName: string = options.database!;
    const setOfStatements: Array<any> = options.set!;
    keys = Object.keys(this._dbDict);
    if (!keys.includes(dbName)) {
      return Promise.resolve({
        changes: { changes: -1 },
        message: `ExecuteSet: No available connection for ${dbName}`,
      });
    }
    const mDB = this._dbDict[dbName];

    for (let i = 0; i < setOfStatements.length; i++) {
      if (
        !('statement' in setOfStatements[i]) ||
        !('values' in setOfStatements[i])
      ) {
        return Promise.reject({
          changes: { changes: -1 },
          message:
            'ExecuteSet: Must provide a set as ' +
            'Array of {statement,values}',
        });
      }
    }
    try {
      const ret: any = await mDB.execSet(setOfStatements);
      if (ret < 0) {
        return Promise.resolve({
          changes: { changes: -1 },
          message: `ExecuteSet failed`,
        });
      } else {
        return Promise.resolve({ changes: ret });
      }
    } catch (err) {
      return Promise.resolve({
        changes: { changes: -1 },
        message: `ExecuteSet failed: ${err}`,
      });
    }
  }
  async run(options: capSQLiteRunOptions): Promise<capSQLiteChanges> {
    let keys = Object.keys(options);
    if (!keys.includes('database')) {
      return Promise.resolve({
        changes: { changes: -1, lastId: -1 },
        message: 'Must provide a database name',
      });
    }
    if (!keys.includes('statement') || options.statement!.length === 0) {
      return Promise.resolve({
        changes: { changes: -1, lastId: -1 },
        message: 'Must provide a query statement',
      });
    }
    if (!keys.includes('values')) {
      return Promise.resolve({
        changes: { changes: -1, lastId: -1 },
        message: 'Must provide an Array of values',
      });
    }
    const dbName: string = options.database!;
    const statement: string = options.statement!;
    const values: Array<any> =
      options.values!.length > 0 ? options.values! : [];
    keys = Object.keys(this._dbDict);
    if (!keys.includes(dbName)) {
      return Promise.resolve({
        changes: { changes: -1, lastId: -1 },
        message: `Run: No available connection for ${dbName}`,
      });
    }
    const mDB = this._dbDict[dbName];
    try {
      const ret: any = await mDB.runSQL(statement, values);
      return Promise.resolve({ changes: ret });
    } catch (err) {
      return Promise.resolve({
        changes: { changes: -1, lastId: -1 },
        message: `RUN failed: ${err} `,
      });
    }
  }
  async query(options: capSQLiteQueryOptions): Promise<capSQLiteValues> {
    let keys = Object.keys(options);
    if (!keys.includes('database')) {
      return Promise.resolve({
        values: [],
        message: 'Must provide a database name',
      });
    }
    if (!keys.includes('statement') || options.statement!.length === 0) {
      return Promise.resolve({
        values: [],
        message: 'Must provide a query statement',
      });
    }
    if (!keys.includes('values')) {
      return Promise.resolve({
        values: [],
        message: 'Must provide an Array of strings',
      });
    }
    const dbName: string = options.database!;
    const statement: string = options.statement!;
    const values: Array<string> =
      options.values!.length > 0 ? options.values! : [];
    keys = Object.keys(this._dbDict);
    if (!keys.includes(dbName)) {
      return Promise.resolve({
        values: [],
        message: `Query: No available connection for ${dbName}`,
      });
    }
    const mDB = this._dbDict[dbName];
    let ret: any[] = [];
    try {
      ret = await mDB.selectSQL(statement, values);
      return Promise.resolve({ values: ret });
    } catch (err) {
      return Promise.resolve({ values: [], message: `Query failed: ${err}` });
    }
  }
  async isDBExists(options: capSQLiteOptions): Promise<capSQLiteResult> {
    let keys = Object.keys(options);
    if (!keys.includes('database')) {
      return Promise.resolve({
        result: false,
        message: 'Must provide a database name',
      });
    }
    const dbName: string = options.database!;
    keys = Object.keys(this._dbDict);
    if (!keys.includes(dbName)) {
      return Promise.resolve({
        result: false,
        message:
          'IsDBExists command failed: No available ' +
          'connection for ' +
          dbName,
      });
    }
    const isExists: boolean = this._uFile.isFileExists(dbName + 'SQLite.db');
    return Promise.resolve({
      result: isExists,
    });
  }
  async isDatabase(options: capSQLiteOptions): Promise<capSQLiteResult> {
    let keys = Object.keys(options);
    if (!keys.includes('database')) {
      return Promise.resolve({
        result: false,
        message: 'Must provide a database name',
      });
    }
    const dbName: string = options.database!;
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
      return Promise.resolve({
        result: false,
        message: 'Must provide a database name',
      });
    }
    const dbName: string = options.database!;
    if (!keys.includes('table')) {
      return Promise.resolve({
        result: false,
        message: 'Must provide a table name',
      });
    }
    const tableName: string = options.table!;
    keys = Object.keys(this._dbDict);
    if (!keys.includes(dbName)) {
      return Promise.resolve({
        result: false,
        message:
          'IsDBExists command failed: No available ' +
          'connection for ' +
          dbName,
      });
    }
    const mDB = this._dbDict[dbName];
    try {
      const res: any = await mDB.isTableExists(tableName);
      return Promise.resolve({ result: res.result });
    } catch (err) {
      return Promise.resolve({
        result: false,
        message: `isTableExists: ${err.message}`,
      });
    }
  }
  async getDatabaseList(): Promise<capSQLiteValues> {
    // get the database folder
    const pathDatabase = this._uFile.getDatabasesPath();
    // get the list of databases
    const files: string[] = await this._uFile.getFileList(pathDatabase);
    return Promise.resolve({
      values: files,
    });
  }
  async addSQLiteSuffix(
    options: capSQLitePathOptions,
  ): Promise<capSQLiteResult> {
    const folderPath: string = options.folderPath
      ? options.folderPath
      : 'default';

    try {
      await this._uMigrate.addSQLiteSuffix(folderPath);
      return Promise.resolve({
        result: true,
      });
    } catch (err) {
      return Promise.resolve({
        result: false,
        message: `addSQLiteSuffix: ${err.message}`,
      });
    }
  }
  async deleteOldDatabases(
    options: capSQLitePathOptions,
  ): Promise<capSQLiteResult> {
    const folderPath: string = options.folderPath
      ? options.folderPath
      : 'default';

    try {
      await this._uMigrate.deleteOldDatabases(folderPath);
      return Promise.resolve({
        result: true,
      });
    } catch (err) {
      return Promise.resolve({
        result: false,
        message: `deleteOldDatabases: ${err.message}`,
      });
    }
  }
  async deleteDatabase(options: capSQLiteOptions): Promise<capSQLiteResult> {
    let keys = Object.keys(options);
    if (!keys.includes('database')) {
      return Promise.resolve({
        result: false,
        message: 'Must provide a database name',
      });
    }
    const dbName: string = options.database!;
    keys = Object.keys(this._dbDict);
    if (!keys.includes(dbName)) {
      return Promise.resolve({
        result: false,
        message: 'deleteDatabase: No available connection for ' + `${dbName}`,
      });
    }

    const mDB = this._dbDict[dbName];
    try {
      await mDB.deleteDB(dbName + 'SQLite.db');
      return Promise.resolve({ result: true });
    } catch (err) {
      return Promise.resolve({
        result: false,
        message: `Delete: ${err.message}`,
      });
    }
  }
  async isJsonValid(options: capSQLiteImportOptions): Promise<capSQLiteResult> {
    let keys = Object.keys(options);
    if (!keys.includes('jsonstring')) {
      return Promise.resolve({
        result: false,
        message: 'Must provide a json object',
      });
    }
    const jsonStrObj: string = options.jsonstring;
    const jsonObj = JSON.parse(jsonStrObj);
    const isValid = this._uJson.isJsonSQLite(jsonObj);
    if (!isValid) {
      return Promise.resolve({
        result: false,
        message: 'Stringify Json Object not Valid',
      });
    } else {
      return Promise.resolve({ result: true });
    }
  }
  async importFromJson(
    options: capSQLiteImportOptions,
  ): Promise<capSQLiteChanges> {
    const retRes = { changes: -1 };
    let keys = Object.keys(options);
    if (!keys.includes('jsonstring')) {
      return Promise.resolve({
        changes: retRes,
        message: 'Must provide a json object',
      });
    }
    const jsonStrObj: string = options.jsonstring;
    const jsonObj = JSON.parse(jsonStrObj);
    const isValid = this._uJson.isJsonSQLite(jsonObj);
    if (!isValid) {
      return Promise.resolve({
        changes: retRes,
        message: 'Must provide a valid JsonSQLite Object',
      });
    }
    const vJsonObj: JsonSQLite = jsonObj;
    const dbName: string = `${vJsonObj.database}SQLite.db`;
    const dbVersion: number = vJsonObj.version ?? 1;
    const encrypted: boolean = vJsonObj.encrypted ?? false;
    const mode: string = encrypted ? 'secret' : 'no-encryption';

    // Create the database
    let mDb: Database = new Database(dbName, encrypted, mode, dbVersion, {});
    try {
      // Open the database
      await mDb.open();
      // Import the JsonSQLite Object
      const changes = await mDb.importJson(vJsonObj);
      // Close the database
      await mDb.close();
      return Promise.resolve({ changes: { changes: changes } });
    } catch (err) {
      return Promise.resolve({
        changes: retRes,
        message: `ImportFromJson: ${err.message}`,
      });
    }
  }
  async exportToJson(options: capSQLiteExportOptions): Promise<capSQLiteJson> {
    let retRes: JsonSQLite = {} as JsonSQLite;
    let keys = Object.keys(options);
    if (!keys.includes('database')) {
      return Promise.resolve({
        export: retRes,
        message: 'Must provide a database name',
      });
    }
    if (!keys.includes('jsonexportmode')) {
      return Promise.resolve({
        export: retRes,
        message: 'Must provide a json export mode',
      });
    }
    const dbName: string = options.database!;
    const exportMode: string = options.jsonexportmode;
    keys = Object.keys(this._dbDict);
    if (!keys.includes(dbName)) {
      return Promise.resolve({
        export: retRes,
        message: 'exportToJson: No available connection for ' + `${dbName}`,
      });
    }
    const mDB = this._dbDict[dbName];
    try {
      const ret: any = await mDB.exportJson(exportMode);
      const keys = Object.keys(ret);
      if (keys.includes('message')) {
        return Promise.resolve({
          export: retRes,
          message: `exportToJson: ${ret.message}`,
        });
      } else {
        return Promise.resolve({ export: ret });
      }
    } catch (err) {
      return Promise.resolve({
        export: retRes,
        message: `exportToJson: ${err.message}`,
      });
    }
  }
  async createSyncTable(options: capSQLiteOptions): Promise<capSQLiteChanges> {
    let keys = Object.keys(options);
    if (!keys.includes('database')) {
      return Promise.resolve({
        changes: { changes: -1 },
        message: 'Must provide a database name',
      });
    }
    const dbName: string = options.database!;
    keys = Object.keys(this._dbDict);
    if (!keys.includes(dbName)) {
      return Promise.resolve({
        changes: { changes: -1 },
        message: 'CreateSyncTable: No available connection for ' + `${dbName}`,
      });
    }

    const mDB = this._dbDict[dbName];
    const ret: any = await mDB.createSyncTable();
    if (ret.message === null) {
      return Promise.resolve({ changes: ret.changes });
    } else {
      return Promise.resolve({ changes: ret.changes, message: ret.message });
    }
  }
  async setSyncDate(
    options: capSQLiteSyncDateOptions,
  ): Promise<capSQLiteResult> {
    let keys = Object.keys(options);
    if (!keys.includes('database')) {
      return Promise.resolve({
        result: false,
        message: 'Must provide a database name',
      });
    }
    if (!keys.includes('syncdate')) {
      return Promise.resolve({
        result: false,
        message: 'Must provide a synchronization date',
      });
    }
    const dbName: string = options.database!;
    const syncDate: string = options.syncdate!;
    keys = Object.keys(this._dbDict);
    if (!keys.includes(dbName)) {
      return Promise.resolve({
        result: false,
        message: `SetSyncDate: No available connection for ${dbName}`,
      });
    }

    const mDB = this._dbDict[dbName];
    const ret: any = await mDB.setSyncDate(syncDate);
    return Promise.resolve(ret);
  }
  async getSyncDate(
    options: capSQLiteSyncDateOptions,
  ): Promise<capSQLiteSyncDate> {
    let keys = Object.keys(options);
    if (!keys.includes('database')) {
      return Promise.resolve({
        syncDate: 0,
        message: 'Must provide a database name',
      });
    }
    const dbName: string = options.database!;
    keys = Object.keys(this._dbDict);
    if (!keys.includes(dbName)) {
      return Promise.resolve({
        syncDate: 0,
        message: `GetSyncDate: No available connection for ${dbName}`,
      });
    }

    const mDB = this._dbDict[dbName];
    const ret: any = await mDB.getSyncDate();
    return Promise.resolve(ret);
  }
  async addUpgradeStatement(
    options: capSQLiteUpgradeOptions,
  ): Promise<capSQLiteResult> {
    let keys = Object.keys(options);
    if (!keys.includes('database')) {
      return Promise.resolve({
        result: false,
        message: 'Must provide a database name',
      });
    }
    if (!keys.includes('upgrade')) {
      return Promise.resolve({
        result: false,
        message: 'Must provide an upgrade statement',
      });
    }
    const dbName: string = options.database!;
    const upgrade = options.upgrade![0];
    keys = Object.keys(upgrade);
    if (
      !keys.includes('fromVersion') ||
      !keys.includes('toVersion') ||
      !keys.includes('statement')
    ) {
      return Promise.reject({
        result: false,
        message: 'Must provide an upgrade ' + 'capSQLiteVersionUpgrade Object',
      });
    }
    if (typeof upgrade.fromVersion != 'number') {
      return Promise.reject({
        result: false,
        message: 'ugrade.fromVersion must be a number',
      });
    }
    const upgVDict: Record<number, capSQLiteVersionUpgrade> = {};
    upgVDict[upgrade.fromVersion] = upgrade;
    this._versionUpgrades[dbName] = upgVDict;
    return Promise.resolve({ result: true });
  }
  async copyFromAssets(): Promise<capSQLiteResult> {
    // check if the assets/database folder exists
    const assetsDbPath = this._uFile.getAssetsDatabasesPath();
    const res: boolean = this._uFile.isPathExists(assetsDbPath);
    if (res) {
      // get the database files
      const dbList: string[] = await this._uFile.getFileList(assetsDbPath);
      // loop through the database files
      const toDbList: string[] = [];
      dbList.forEach(async (db: string) => {
        // for each check if the suffix SQLite.db is there or add it
        let toDb: string = this._uFile.setPathSuffix(db);
        toDbList.push(toDb);
        // for each copy the file to the Application database folder
        await this._uFile.copyFromAssetToDatabase(db, toDb);
      });
      return Promise.resolve({ result: true });
    } else {
      return Promise.resolve({
        result: false,
        message: 'CopyFromAssets: assets/databases folder does not exist',
      });
    }
  }
}
const CapacitorSQLite = new CapacitorSQLiteElectronWeb();
export { CapacitorSQLite };
import { registerWebPlugin } from '@capacitor/core';
registerWebPlugin(CapacitorSQLite);
