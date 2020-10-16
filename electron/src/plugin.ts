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
  capSQLiteVersionUpgrade,
} from './definitions';
import { DatabaseSQLiteHelper } from './electron-utils/DatabaseSQLiteHelper';
import { isJsonSQLite } from './electron-utils/JsonUtils';
import { UtilsSQLite } from './electron-utils/UtilsSQLite';

const { remote } = require('electron');
export class CapacitorSQLiteElectronWeb
  extends WebPlugin
  implements CapacitorSQLitePlugin {
  NodeFs: any = null;
  RemoteRef: any = null;
  private mDb!: DatabaseSQLiteHelper;
  private versionUpgrades: Record<
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
    this.NodeFs = require('fs');
  }
  async echo(options: capEchoOptions): Promise<capEchoResult> {
    console.log('ECHO in CapacitorSQLiteElectronWeb ', options);
    console.log(this.RemoteRef);
    return options;
  }
  async open(options: capSQLiteOptions): Promise<capSQLiteResult> {
    if (typeof options.database === 'undefined') {
      return Promise.reject({
        result: false,
        message: 'Must provide a database name',
      });
    }
    const dbName: string = options.database;
    const dbVersion: number = options.version ?? 1;
    /*
            let encrypted: boolean = options.encrypted ? options.encrypted : false;
            let inMode: string = "no-encryption";
            let secretKey: string = "";
            let newsecretKey: string = "";
            */
    console.log('---> in Open this.versionUpgrades ' + this.versionUpgrades);
    this.mDb = new DatabaseSQLiteHelper(
      `${dbName}SQLite.db`,
      dbVersion,
      this.versionUpgrades /*,encrypted,inMode,secretKey,newsecretKey*/,
    );
    await this.mDb.setup();
    if (!this.mDb.isOpen) {
      return Promise.resolve({
        result: false,
        message: `Open command failed: Database ${dbName}SQLite.db not opened`,
      });
    } else {
      return Promise.resolve({ result: true });
    }
  }
  async close(options: capSQLiteOptions): Promise<capSQLiteResult> {
    if (typeof options.database === 'undefined') {
      return Promise.reject({
        result: false,
        message: 'Close command failed: Must provide a database name',
      });
    }
    const dbName: string = options.database;
    const ret = await this.mDb.close(`${dbName}SQLite.db`);
    if (!ret) {
      return Promise.reject({ status: false, message: 'Close command failed' });
    }
    return Promise.resolve({ result: true });
  }
  async execute(options: capSQLiteExecuteOptions): Promise<capSQLiteChanges> {
    const retRes = { changes: -1 };
    if (typeof options.statements === 'undefined') {
      return Promise.reject({
        changes: retRes,
        message: 'Execute command failed : Must provide raw SQL statements',
      });
    }
    const statements: string = options.statements;
    const ret: any = await this.mDb.exec(statements);
    return Promise.resolve({ changes: ret });
  }
  async executeSet(options: capSQLiteSetOptions): Promise<capSQLiteChanges> {
    const retRes = { changes: -1 };
    if (typeof options.set === 'undefined') {
      return Promise.reject({
        changes: retRes,
        message:
          'ExecuteSet command failed : Must provide a set of SQL statements',
      });
    }
    const setOfStatements: Array<any> = options.set;
    if (setOfStatements.length === 0) {
      return Promise.reject({
        changes: retRes,
        message:
          'ExecuteSet command failed : Must provide a non-empty set of SQL statements',
      });
    }
    for (let i = 0; i < setOfStatements.length; i++) {
      if (
        !('statement' in setOfStatements[i]) ||
        !('values' in setOfStatements[i])
      ) {
        return Promise.reject({
          changes: retRes,
          message:
            'ExecuteSet command failed : Must provide a set as Array of {statement,values}',
        });
      }
    }
    const ret: any = await this.mDb.execSet(setOfStatements);
    return Promise.resolve({ changes: ret });
  }
  async run(options: capSQLiteRunOptions): Promise<capSQLiteChanges> {
    const retRes = { changes: -1 };
    if (typeof options.statement === 'undefined') {
      return Promise.reject({
        changes: retRes,
        message: 'Run command failed : Must provide a SQL statement',
      });
    }
    if (typeof options.values === 'undefined') {
      return Promise.reject({
        changes: retRes,
        message: 'Run command failed : Values should be an Array of values',
      });
    }
    const statement: string = options.statement;
    const values: Array<any> = options.values;
    let ret: number;
    if (values.length > 0) {
      ret = await this.mDb.run(statement, values);
    } else {
      ret = await this.mDb.run(statement, []);
    }
    return Promise.resolve({ changes: ret });
  }
  async query(options: capSQLiteQueryOptions): Promise<capSQLiteValues> {
    if (typeof options.statement === 'undefined') {
      return Promise.reject({
        values: [],
        message: 'Query command failed : Must provide a SQL statement',
      });
    }
    if (typeof options.values === 'undefined') {
      return Promise.reject({
        values: [],
        message: 'Query command failed : Values should be an Array of values',
      });
    }
    const statement: string = options.statement;
    const values: Array<any> = options.values;
    let ret: Array<any>;
    if (values.length > 0) {
      ret = await this.mDb.query(statement, values);
    } else {
      ret = await this.mDb.query(statement, []);
    }
    return Promise.resolve({ values: ret });
  }
  async isDBExists(options: capSQLiteOptions): Promise<capSQLiteResult> {
    let dbName = options.database;
    if (dbName == null) {
      return Promise.reject({
        result: false,
        message: 'Must provide a Database Name',
      });
    }
    dbName = `${options.database}SQLite.db`;
    const utils: UtilsSQLite = new UtilsSQLite();
    const dbPath = utils.getDBPath(dbName);
    let message: string = '';
    let ret: boolean = false;
    try {
      if (this.NodeFs.existsSync(dbPath)) {
        //file exists
        ret = true;
      }
    } catch (err) {
      ret = false;
      message = err.message;
    } finally {
      if (ret) {
        return Promise.resolve({ result: ret });
      } else {
        return Promise.resolve({ result: ret, message: message });
      }
    }
  }
  async deleteDatabase(options: capSQLiteOptions): Promise<capSQLiteResult> {
    let dbName = options.database;
    if (dbName == null) {
      return Promise.reject({
        result: false,
        message: 'Must provide a Database Name',
      });
    }
    dbName = `${options.database}SQLite.db`;
    if (typeof this.mDb === 'undefined' || this.mDb === null) {
      return Promise.reject({
        result: false,
        message: 'The database is not opened',
      });
    }
    const ret = await this.mDb.deleteDB(dbName);
    return Promise.resolve({ result: ret });
  }
  async isJsonValid(options: capSQLiteImportOptions): Promise<capSQLiteResult> {
    const jsonStrObj = options.jsonstring;
    if (
      typeof jsonStrObj != 'string' ||
      jsonStrObj == null ||
      jsonStrObj.length === 0
    ) {
      return Promise.reject({
        result: false,
        message: 'Must provide a json object',
      });
    }
    const jsonObj = JSON.parse(jsonStrObj);
    const isValid = isJsonSQLite(jsonObj);
    if (!isValid) {
      return Promise.reject({
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
    const jsonStrObj = options.jsonstring;
    if (
      typeof jsonStrObj != 'string' ||
      jsonStrObj == null ||
      jsonStrObj.length === 0
    ) {
      return Promise.reject({
        changes: retRes,
        message: 'Must provide a json object',
      });
    }
    const jsonObj = JSON.parse(jsonStrObj);
    const isValid = isJsonSQLite(jsonObj);
    if (!isValid)
      return Promise.reject({
        changes: retRes,
        message: 'Must provide a jsonSQLite object',
      });
    const dbName: string = `${jsonObj.database}SQLite.db`;
    const dbVersion: number = jsonObj.version ?? 1;
    this.mDb = new DatabaseSQLiteHelper(dbName, dbVersion, {});
    await this.mDb.setup();
    const ret = await this.mDb.importJson(jsonObj);
    this.mDb.close(dbName);
    //      this.mDb = null;
    return Promise.resolve({ changes: ret });
  }
  async exportToJson(options: capSQLiteExportOptions): Promise<capSQLiteJson> {
    const retRes = {};
    if (typeof options.jsonexportmode === 'undefined') {
      return Promise.reject({
        export: retRes,
        message: 'Must provide a json export mode',
      });
    }
    if (
      options.jsonexportmode != 'full' &&
      options.jsonexportmode != 'partial'
    ) {
      return Promise.reject({
        export: retRes,
        message: "Json export mode should be 'full' or 'partial'",
      });
    }
    const exportMode: string = options.jsonexportmode;
    const ret: any = await this.mDb.exportJson(exportMode);
    return Promise.resolve({ export: ret });
  }
  async createSyncTable(): Promise<capSQLiteChanges> {
    const ret: any = await this.mDb.createSyncTable();
    return Promise.resolve({ changes: ret });
  }
  async setSyncDate(
    options: capSQLiteSyncDateOptions,
  ): Promise<capSQLiteResult> {
    if (
      typeof options.syncdate === 'undefined' ||
      typeof options.syncdate != 'string'
    ) {
      return Promise.reject({
        result: false,
        message: 'Must provide a synchronization date',
      });
    }
    const syncDate: string = options.syncdate;
    const ret: boolean = await this.mDb.setSyncDate(syncDate);
    return Promise.resolve({ result: ret });
  }
  async addUpgradeStatement(
    options: capSQLiteUpgradeOptions,
  ): Promise<capSQLiteResult> {
    if (
      typeof options.database === 'undefined' ||
      typeof options.database != 'string'
    ) {
      return Promise.reject({
        result: false,
        message: 'Must provide a database name',
      });
    }
    if (typeof options.upgrade[0] === 'undefined') {
      return Promise.reject({
        result: false,
        message: 'Must provide an upgrade Object',
      });
    }
    const upgrade = options.upgrade[0];
    const keys: Array<string> = Object.keys(upgrade);
    if (
      !keys.includes('fromVersion') ||
      !keys.includes('toVersion') ||
      !keys.includes('statement')
    ) {
      return Promise.reject({
        result: false,
        message: 'Must provide an upgrade capSQLiteVersionUpgrade Object',
      });
    }
    const fullDBName = `${options.database}SQLite.db`;
    if (!this.versionUpgrades[fullDBName]) {
      this.versionUpgrades[fullDBName] = {};
    }
    this.versionUpgrades[fullDBName][upgrade.fromVersion] = {
      fromVersion: upgrade.fromVersion,
      toVersion: upgrade.toVersion,
      statement: upgrade.statement,
    };
    if (upgrade.set)
      this.versionUpgrades[fullDBName][upgrade.fromVersion]['set'] =
        upgrade.set;
    return Promise.resolve({ result: true });
  }
}
const CapacitorSQLite = new CapacitorSQLiteElectronWeb();
export { CapacitorSQLite };
import { registerWebPlugin } from '@capacitor/core';
registerWebPlugin(CapacitorSQLite);
