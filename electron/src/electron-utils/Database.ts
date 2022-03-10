//import { GlobalSQLite } from '../GlobalSQLite';
import type {
  capSQLiteVersionUpgrade,
  JsonSQLite,
} from '../../../src/definitions';

import { ExportToJson } from './ImportExportJson/exportToJson';
import { ImportFromJson } from './ImportExportJson/importFromJson';
import { UtilsJson } from './ImportExportJson/utilsJson';
//import { UtilsEncryption } from './utilsEncryption';
import { UtilsFile } from './utilsFile';
import { UtilsSQLite } from './utilsSQLite';
import { UtilsUpgrade } from './utilsUpgrade';

export class Database {
  private _isDBOpen: boolean;
  private _dbName: string;
  //  private _encrypted: boolean;
  //  private _mode: string;
  private _version: number;
  private _pathDB: string;
  private _uFile: UtilsFile = new UtilsFile();
  private _uSQLite: UtilsSQLite = new UtilsSQLite();
  private _uJson: UtilsJson = new UtilsJson();
  //  private _uGlobal: GlobalSQLite = new GlobalSQLite();
  //  private _uEncrypt: UtilsEncryption = new UtilsEncryption();
  private _uUpg: UtilsUpgrade = new UtilsUpgrade();
  private _iFJson: ImportFromJson = new ImportFromJson();
  private _eTJson: ExportToJson = new ExportToJson();
  private _mDB: any;
  private _vUpgDict: Record<number, capSQLiteVersionUpgrade> = {};

  constructor(
    dbName: string,
    //    encrypted: boolean,
    //    mode: string,
    version: number,
    upgDict: Record<number, capSQLiteVersionUpgrade>,
  ) {
    this._dbName = dbName;
    //    this._encrypted = encrypted;
    //    this._mode = mode;
    this._version = version;
    this._vUpgDict = upgDict;
    this._pathDB = this._uFile.getFilePath(dbName);
    this._isDBOpen = false;

    if (this._pathDB.length === 0)
      throw new Error('Could not generate a path to ' + dbName);
  }
  /**
   * IsDBOpen
   * return the database status
   * @param options: capSQLiteOptions
   * @returns boolean
   * @since 0.0.1
   */
  isDBOpen(): boolean {
    return this._isDBOpen;
  }
  /**
   * Open
   * open the @journeyapps/sqlcipher sqlite3 database
   * @returns Promise<boolean>
   */
  async open(): Promise<void> {
    this._isDBOpen = false;
    //    let password = '';
    try {
      /*
      if (
        this._encrypted &&
        (this._mode === 'secret' || this._mode === 'encryption')
      ) {
        password = this._uGlobal.secret;
      }
      if (this._mode === 'newsecret') {
        // change the password
        const oPassword: string = this._uGlobal.secret;
        const nPassword: string = this._uGlobal.newsecret;
        await this._uSQLite.changePassword(this._pathDB, oPassword, nPassword);
        password = nPassword;
      }

      if (this._mode === 'encryption') {
        await this._uEncrypt.encryptDatabase(this._pathDB, password);
      }
*/
      this._mDB = await this._uSQLite.openOrCreateDatabase(
        this._pathDB /*,
        password,*/,
      );

      const curVersion: number = await this._uSQLite.getVersion(this._mDB);
      this._isDBOpen = true;

      if (this._version > curVersion) {
        const keys: string[] = Object.keys(this._vUpgDict);

        if (keys.length > 0) {
          try {
            // execute the upgrade flow process
            await this._uUpg.onUpgrade(
              this._mDB,
              this._vUpgDict,
              this._dbName,
              curVersion,
              this._version,
            );
            // delete the backup database
            await this._uFile.deleteFileName(`backup-${this._dbName}`);
          } catch (err) {
            // restore the database from backup
            try {
              await this._uFile.restoreFileName(this._dbName, 'backup');
            } catch (err) {
              return Promise.reject(`Open: ${err}`);
            }
          }
        } else {
          try {
            await this._uSQLite.setVersion(this._mDB, this._version);
          } catch (err) {
            return Promise.reject(`SetVersion: ${this._version} ${err}`);
          }
        }
      }
      return Promise.resolve();
    } catch (err) {
      if (this._isDBOpen) this.close();
      return Promise.reject(`Open: ${err}`);
    }
  }
  /**
   * Close
   * close the @journeyapps/sqlcipher sqlite3 database
   * @returns Promise<boolean>
   */
  async close(): Promise<void> {
    if (this._mDB != null && this._isDBOpen) {
      this._mDB.close((err: Error) => {
        if (err) {
          let msg = 'Close: Failed in closing: ';
          msg += `${this._dbName}  ${err}`;
          return Promise.reject(msg);
        }
        this._isDBOpen = false;
        return Promise.resolve();
      });
    }
    return Promise.resolve();
  }
  /**
   * GetVersion
   * get the database version
   * @returns Promise<number>
   */
  async getVersion(): Promise<number> {
    if (this._mDB != null && this._isDBOpen) {
      try {
        const curVersion: number = await this._uSQLite.getVersion(this._mDB);
        return Promise.resolve(curVersion);
      } catch (err) {
        if (this._isDBOpen) this.close();
        return Promise.reject(`getVersion: ${err}`);
      }
    } else {
      let msg = `getVersion: Database ${this._dbName} `;
      msg += `not opened`;
      return Promise.reject(msg);
    }
  }
  /**
   * DeleteDB
   * delete a database
   * @param dbName: string
   * @returns Promise<boolean>
   */
  async deleteDB(dbName: string): Promise<void> {
    // test if file exists
    const isExists: boolean = this._uFile.isFileExists(dbName);
    if (isExists && !this._isDBOpen) {
      // open the database
      try {
        await this.open();
      } catch (err) {
        return Promise.reject(`DeleteDB: ${err}`);
      }
    }
    // close the database
    try {
      await this.close();
    } catch (err) {
      return Promise.reject('DeleteDB: Close failed');
    }
    // delete the database
    if (isExists) {
      try {
        await this._uFile.deleteFileName(dbName);
      } catch (err) {
        let msg = `DeleteDB: deleteFile ${dbName}`;
        msg += ` failed ${err}`;
        return Promise.reject(msg);
      }
    }
    return Promise.resolve();
  }
  /**
   * IsTableExists
   * @param tableName
   * @returns
   */
  async isTableExists(tableName: string): Promise<boolean> {
    if (this._mDB != null && this._isDBOpen) {
      const isOpen: boolean = this._isDBOpen;
      try {
        const retB = await this._uJson.isTableExists(
          this._mDB,
          isOpen,
          tableName,
        );
        return Promise.resolve(retB);
      } catch (err) {
        return Promise.reject(`IsTableExists: ${err}`);
      }
    } else {
      let msg = `isTableExists: Database ${this._dbName} `;
      msg += `not opened`;
      return Promise.reject(msg);
    }
  }
  /**
   * CreateSyncTable
   * create the synchronization table
   * @returns Promise<number>
   */
  async createSyncTable(): Promise<number> {
    if (!this._isDBOpen) {
      let msg = `CreateSyncTable: Database ${this._dbName} `;
      msg += `not opened`;
      return Promise.reject(msg);
    }
    let changes = -1;
    const isOpen = this._isDBOpen;
    // check if the table has already being created
    try {
      const retB = await this._uJson.isTableExists(
        this._mDB,
        isOpen,
        'sync_table',
      );
      if (!retB) {
        const isLastModified = await this._uJson.isLastModified(
          this._mDB,
          isOpen,
        );
        if (isLastModified) {
          const date: number = Math.round(new Date().getTime() / 1000);
          let stmts = `
                          CREATE TABLE IF NOT EXISTS sync_table (
                              id INTEGER PRIMARY KEY NOT NULL,
                              sync_date INTEGER
                              );`;
          stmts += `INSERT INTO sync_table (sync_date) VALUES (
                              "${date}");`;
          changes = await this._uSQLite.execute(this._mDB, stmts);
          if (changes < 0) {
            return Promise.reject(`CreateSyncTable: failed changes < 0`);
          }
        } else {
          return Promise.reject('No last_modified column in tables');
        }
      }
      return Promise.resolve(changes);
    } catch (err) {
      return Promise.reject(`CreateSyncTable: ${err}`);
    }
  }
  /**
   * SetSyncDate
   * store the synchronization date
   * @param syncDate: string
   * @returns Promise<{result: boolean, message: string}>
   */
  async setSyncDate(syncDate: string): Promise<any> {
    if (!this._isDBOpen) {
      let msg = `SetSyncDate: Database ${this._dbName} `;
      msg += `not opened`;
      return { result: false, message: msg };
    }
    try {
      const isTable = await this._uJson.isTableExists(
        this._mDB,
        this._isDBOpen,
        'sync_table',
      );
      if (!isTable) {
        return Promise.reject('No sync_table available');
      }
      const sDate: number = Math.round(new Date(syncDate).getTime() / 1000);
      let stmt = `UPDATE sync_table SET sync_date = `;
      stmt += `${sDate} WHERE id = 1;`;
      const changes: number = await this._uSQLite.execute(this._mDB, stmt);
      if (changes < 0) {
        return { result: false, message: 'setSyncDate failed' };
      } else {
        return { result: true };
      }
    } catch (err) {
      return { result: false, message: `setSyncDate failed: ${err}` };
    }
  }
  /**
   * GetSyncDate
   * store the synchronization date
   * @returns Promise<{syncDate: number, message: string}>
   */
  async getSyncDate(): Promise<any> {
    if (!this._isDBOpen) {
      let msg = `GetSyncDate: Database ${this._dbName} `;
      msg += `not opened`;
      return { syncDate: 0, message: msg };
    }
    try {
      const isTable = await this._uJson.isTableExists(
        this._mDB,
        this._isDBOpen,
        'sync_table',
      );
      if (!isTable) {
        return Promise.reject('No sync_table available');
      }
      const syncDate: number = await this._eTJson.getSyncDate(this._mDB);
      if (syncDate > 0) {
        return { syncDate: syncDate };
      } else {
        return { syncDate: 0, message: `setSyncDate failed` };
      }
    } catch (err) {
      return { syncDate: 0, message: `setSyncDate failed: ${err}` };
    }
  }
  /**
   * ExecuteSQL
   * execute raw sql statements store in a string
   * @param sql: string
   * @returns Promise<number>
   */
  async executeSQL(sql: string, transaction: boolean): Promise<number> {
    if (!this._isDBOpen) {
      let msg = `ExecuteSQL: Database ${this._dbName} `;
      msg += `not opened`;
      return Promise.reject(msg);
    }
    try {
      if (transaction)
        await this._uSQLite.beginTransaction(this._mDB, this._isDBOpen);
      const changes = await this._uSQLite.execute(this._mDB, sql);
      if (changes < 0) {
        return Promise.reject('ExecuteSQL: changes < 0');
      }
      if (transaction)
        await this._uSQLite.commitTransaction(this._mDB, this._isDBOpen);
      return Promise.resolve(changes);
    } catch (err) {
      let msg = `ExecuteSQL: ${err}`;
      try {
        if (transaction)
          await this._uSQLite.rollbackTransaction(this._mDB, this._isDBOpen);
      } catch (err) {
        msg += ` : ${err}`;
      }
      return Promise.reject(`ExecuteSQL: ${msg}`);
    }
  }
  /**
   * SelectSQL
   * execute a sql query with/without binding values
   * @param sql: string
   * @param values: string[]
   * @returns Promise<any[]>
   */
  async selectSQL(sql: any, values: any[]): Promise<any[]> {
    if (!this._isDBOpen) {
      let msg = `SelectSQL: Database ${this._dbName} `;
      msg += `not opened`;
      return Promise.reject(msg);
    }
    try {
      const retArr = await this._uSQLite.queryAll(this._mDB, sql, values);
      return Promise.resolve(retArr);
    } catch (err) {
      return Promise.reject(`SelectSQL: ${err}`);
    }
  }
  /**
   * runSQL
   * execute a raw sql statement with/without binding values
   * @param sql: string
   * @param values: string[]
   * @returns Promise<{changes:number, lastId:number}>
   */
  async runSQL(
    statement: string,
    values: any[],
    transaction: boolean,
  ): Promise<any> {
    if (!this._isDBOpen) {
      let msg = `RunSQL: Database ${this._dbName} `;
      msg += `not opened`;
      return Promise.reject(msg);
    }
    const retRes: any = { changes: -1, lastId: -1 };
    let initChanges = -1;
    try {
      initChanges = await this._uSQLite.dbChanges(this._mDB);
      // start a transaction
      if (transaction)
        await this._uSQLite.beginTransaction(this._mDB, this._isDBOpen);
    } catch (err) {
      return Promise.reject(`ExecSet: ${err}`);
    }
    try {
      const lastId = await this._uSQLite.prepareRun(
        this._mDB,
        statement,
        values,
      );
      if (lastId < 0) {
        if (transaction)
          await this._uSQLite.rollbackTransaction(this._mDB, this._isDBOpen);
        return Promise.reject(`RunSQL: return LastId < 0`);
      }
      if (transaction)
        await this._uSQLite.commitTransaction(this._mDB, this._isDBOpen);
      retRes.changes = (await this._uSQLite.dbChanges(this._mDB)) - initChanges;
      retRes.lastId = lastId;
      return Promise.resolve(retRes);
    } catch (err) {
      if (transaction)
        await this._uSQLite.rollbackTransaction(this._mDB, this._isDBOpen);
      return Promise.reject(`RunSQL: ${err}`);
    }
  }
  /**
   * ExecSet
   * execute a set of raw sql statements with/without binding values
   * @param set: any[]
   * @returns Promise<{changes:number, lastId:number}>
   */
  async execSet(set: any[], transaction: boolean): Promise<any> {
    if (!this._isDBOpen) {
      let msg = `ExecSet: Database ${this._dbName} `;
      msg += `not opened`;
      return Promise.reject(msg);
    }
    const retRes: any = { changes: -1, lastId: -1 };
    let initChanges = -1;
    try {
      initChanges = await this._uSQLite.dbChanges(this._mDB);
      // start a transaction
      if (transaction)
        await this._uSQLite.beginTransaction(this._mDB, this._isDBOpen);
    } catch (err) {
      return Promise.reject(`ExecSet: ${err}`);
    }
    try {
      retRes.lastId = await this._uSQLite.executeSet(this._mDB, set);
      if (transaction)
        await this._uSQLite.commitTransaction(this._mDB, this._isDBOpen);
      retRes.changes = (await this._uSQLite.dbChanges(this._mDB)) - initChanges;
      return Promise.resolve(retRes);
    } catch (err) {
      const msg: string = err;
      try {
        if (transaction)
          await this._uSQLite.rollbackTransaction(this._mDB, this._isDBOpen);
      } catch (err) {
        return Promise.reject(`ExecSet: ${msg}: ` + `${err}`);
      }
    }
  }
  public async importJson(jsonData: JsonSQLite): Promise<number> {
    let changes = 0;
    if (this._isDBOpen) {
      try {
        if (jsonData.tables && jsonData.tables.length > 0) {
          // create the database schema
          changes = await this._iFJson.createDatabaseSchema(
            this._mDB,
            jsonData,
          );
          if (changes != -1) {
            // create the tables data
            changes += await this._iFJson.createTablesData(this._mDB, jsonData);
          }
        }
        if (jsonData.views && jsonData.views.length > 0) {
          // create the views
          changes += await this._iFJson.createViews(this._mDB, jsonData);
        }
        return Promise.resolve(changes);
      } catch (err) {
        return Promise.reject(`ImportJson: ${err}`);
      }
    } else {
      return Promise.reject(`ImportJson: database is closed`);
    }
  }
  public async exportJson(mode: string): Promise<any> {
    const inJson: JsonSQLite = {} as JsonSQLite;
    inJson.database = this._dbName.slice(0, -9);
    inJson.version = this._version;
    inJson.encrypted = false;
    inJson.mode = mode;
    if (this._isDBOpen) {
      try {
        const retJson: JsonSQLite = await this._eTJson.createExportObject(
          this._mDB,
          inJson,
        );
        const isValid = this._uJson.isJsonSQLite(retJson);
        if (isValid) {
          return Promise.resolve(retJson);
        } else {
          return Promise.reject(`ExportJson: retJson not valid`);
        }
      } catch (err) {
        return Promise.reject(`ExportJson: ${err}`);
      }
    } else {
      return Promise.reject(`ExportJson: database is closed`);
    }
  }
}
