import { WebPlugin } from '@capacitor/core';
import {
  CapacitorSQLitePlugin,
  capSQLiteOptions,
  capSQLiteResult /*, jsonSQLite*/,
} from './definitions';
import { DatabaseSQLiteHelper } from './electron-utils/DatabaseSQLiteHelper';
import { isJsonSQLite } from './electron-utils/JsonUtils';
import { UtilsSQLite } from './electron-utils/UtilsSQLite';

const fs: any = window['fs' as any];
//const path: any = window['path' as any];

export class CapacitorSQLitePluginElectron extends WebPlugin
  implements CapacitorSQLitePlugin {
  private mDb!: DatabaseSQLiteHelper;
  constructor() {
    super({
      name: 'CapacitorSQLite',
      platforms: ['electron'],
    });
  }

  async echo(options: { value: string }): Promise<{ value: string }> {
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
    /*
        let encrypted: boolean = options.encrypted ? options.encrypted : false;
        let inMode: string = "no-encryption";
        let secretKey: string = "";
        let newsecretKey: string = "";
        */
    this.mDb = new DatabaseSQLiteHelper(
      `${dbName}SQLite.db` /*,encrypted,inMode,secretKey,newsecretKey*/,
    );
    if (!this.mDb.isOpen) {
      return Promise.reject({
        result: false,
        message: `Open command failed: Database ${dbName}SQLite.db not opened`,
      });
    }
    return Promise.resolve({ result: true });
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
  async execute(options: capSQLiteOptions): Promise<capSQLiteResult> {
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
  async executeSet(options: capSQLiteOptions): Promise<capSQLiteResult> {
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
  async run(options: capSQLiteOptions): Promise<capSQLiteResult> {
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
  async query(options: capSQLiteOptions): Promise<capSQLiteResult> {
    if (typeof options.statement === 'undefined') {
      return Promise.reject({
        changes: -1,
        message: 'Query command failed : Must provide a SQL statement',
      });
    }
    if (typeof options.values === 'undefined') {
      return Promise.reject({
        changes: -1,
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
      if (fs.existsSync(dbPath)) {
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
  async isJsonValid(options: capSQLiteOptions): Promise<capSQLiteResult> {
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
  async importFromJson(options: capSQLiteOptions): Promise<capSQLiteResult> {
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
    this.mDb = new DatabaseSQLiteHelper(dbName);
    const ret = await this.mDb.importJson(jsonObj);
    this.mDb.close(dbName);
    //      this.mDb = null;
    return Promise.resolve({ changes: ret });
  }
  async exportToJson(options: capSQLiteOptions): Promise<capSQLiteResult> {
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
  async createSyncTable(): Promise<capSQLiteResult> {
    const ret: any = await this.mDb.createSyncTable();
    return Promise.resolve({ changes: ret });
  }
  async setSyncDate(options: capSQLiteOptions): Promise<capSQLiteResult> {
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
}

const CapacitorSQLiteElectron = new CapacitorSQLitePluginElectron();

export { CapacitorSQLiteElectron };
import { registerWebPlugin } from '@capacitor/core';
registerWebPlugin(CapacitorSQLiteElectron);
