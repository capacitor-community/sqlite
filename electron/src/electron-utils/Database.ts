import { UtilsFile } from './utilsFile';
import { UtilsSQLite } from './utilsSQLite';
import { UtilsJson } from './ImportExportJson/utilsJson';
import { GlobalSQLite } from '../GlobalSQLite';
import { UtilsEncryption } from './utilsEncryption';
import { UtilsUpgrade } from './utilsUpgrade';
import { ImportFromJson } from './ImportExportJson/importFromJson';
import { ExportToJson } from './ImportExportJson/exportToJson';
import { capSQLiteVersionUpgrade, JsonSQLite } from '../definitions';
//1234567890123456789012345678901234567890123456789012345678901234567890

export class Database {
  private _isDBOpen: boolean;
  private _dbName: string;
  private _encrypted: boolean;
  private _mode: string;
  private _version: number;
  private _pathDB: string;
  private _uFile: UtilsFile = new UtilsFile();
  private _uSQLite: UtilsSQLite = new UtilsSQLite();
  private _uJson: UtilsJson = new UtilsJson();
  private _uGlobal: GlobalSQLite = new GlobalSQLite();
  private _uEncrypt: UtilsEncryption = new UtilsEncryption();
  private _uUpg: UtilsUpgrade = new UtilsUpgrade();
  private _iFJson: ImportFromJson = new ImportFromJson();
  private _eTJson: ExportToJson = new ExportToJson();
  private _mDB: any;
  private _vUpgDict: Record<number, capSQLiteVersionUpgrade> = {};

  constructor(
    dbName: string,
    encrypted: boolean,
    mode: string,
    version: number,
    upgDict: Record<number, capSQLiteVersionUpgrade>,
  ) {
    this._dbName = dbName;
    this._encrypted = encrypted;
    this._mode = mode;
    this._version = version;
    this._vUpgDict = upgDict;
    this._pathDB = this._uFile.getFilePath(dbName);
    this._isDBOpen = false;

    if (this._pathDB.length === 0)
      throw new Error('Could not generate a path to ' + dbName);
    console.log('DB Path: ' + this._pathDB);
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
    return new Promise(async (resolve, reject) => {
      this._isDBOpen = false;
      let password: string = '';
      try {
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
          await this._uSQLite.changePassword(
            this._pathDB,
            oPassword,
            nPassword,
          );
          password = nPassword;
        }

        if (this._mode === 'encryption') {
          await this._uEncrypt.encryptDatabase(this._pathDB, password);
        }
        this._mDB = await this._uSQLite.openOrCreateDatabase(
          this._pathDB,
          password,
        );

        let curVersion: number = await this._uSQLite.getVersion(this._mDB);
        this._isDBOpen = true;

        if (this._version > curVersion) {
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
              reject(new Error(`Open: ${err.message}`));
            }
          }
        }
        resolve();
      } catch (err) {
        if (this._isDBOpen) this.close();
        reject(new Error(`Open: ${err.message}`));
      }
    });
  }
  /**
   * Close
   * close the @journeyapps/sqlcipher sqlite3 database
   * @returns Promise<boolean>
   */
  async close(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      if (this._mDB != null && this._isDBOpen) {
        this._mDB.close((err: Error) => {
          if (err) {
            let msg: string = 'Close: Failed in closing: ';
            msg += `${this._dbName}  ${err.message}`;
            reject(new Error(msg));
          }
          this._isDBOpen = false;
          resolve();
        });
      }
      resolve();
    });
  }
  /**
   * DeleteDB
   * delete a database
   * @param dbName: string
   * @returns Promise<boolean>
   */
  async deleteDB(dbName: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      // test if file exists
      const isExists: boolean = this._uFile.isFileExists(dbName);
      if (isExists && !this._isDBOpen) {
        // open the database
        try {
          await this.open();
        } catch (err) {
          reject(new Error(`DeleteDB: ${err.message}`));
        }
      }
      // close the database
      try {
        await this.close();
      } catch (err) {
        reject(new Error('DeleteDB: Close failed'));
      }
      // delete the database
      if (isExists) {
        try {
          await this._uFile.deleteFileName(dbName);
        } catch (err) {
          let msg: string = `DeleteDB: deleteFile ${dbName}`;
          msg += ` failed ${err.message}`;
          reject(new Error(msg));
        }
      }
      resolve();
    });
  }
  /**
   * CreateSyncTable
   * create the synchronization table
   * @returns Promise<{result: boolean, message: string}>
   */
  async createSyncTable(): Promise<any> {
    if (!this._isDBOpen) {
      let msg = `CreateSyncTable: Database ${this._dbName} `;
      msg += `not opened`;
      return { result: false, message: msg };
    }
    let changes: number = -1;
    let isOpen = this._isDBOpen;
    // check if the table has already being created
    try {
      const retB = await this._uJson.isTableExists(
        this._mDB,
        isOpen,
        'sync_table',
      );
      if (!retB) {
        const date: number = Math.round(new Date().getTime() / 1000);
        let stmts = `
                        CREATE TABLE IF NOT EXISTS sync_table (
                            id INTEGER PRIMARY KEY NOT NULL,
                            sync_date INTEGER
                            );`;
        stmts += `INSERT INTO sync_table (sync_date) VALUES (
                            "${date}");`;
        changes = await this.executeSQL(stmts);
        if (changes < 0) {
          return { changes: -1, message: `CreateSyncTable failed` };
        }
      }
      return { changes: changes };
    } catch (err) {
      return { changes: -1, message: `CreateSyncTable: ${err.message}` };
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
      const sDate: number = Math.round(new Date(syncDate).getTime() / 1000);
      let stmt: string = `UPDATE sync_table SET sync_date = `;
      stmt += `${sDate} WHERE id = 1;`;
      const changes: number = await this.executeSQL(stmt);
      if (changes < 0) {
        return { result: false, message: 'setSyncDate failed' };
      } else {
        return { result: true };
      }
    } catch (err) {
      return { result: false, message: `setSyncDate failed: ${err.message}` };
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
      const syncDate: number = await this._eTJson.getSyncDate(this._mDB);
      if (syncDate > 0) {
        return { syncDate: syncDate };
      } else {
        return { syncDate: 0, message: `setSyncDate failed` };
      }
    } catch (err) {
      return { syncDate: 0, message: `setSyncDate failed: ${err.message}` };
    }
  }
  /**
   * ExecuteSQL
   * execute raw sql statements store in a string
   * @param sql: string
   * @returns Promise<number>
   */
  async executeSQL(sql: string): Promise<number> {
    return new Promise(async (resolve, reject) => {
      if (!this._isDBOpen) {
        let msg = `ExecuteSQL: Database ${this._dbName} `;
        msg += `not opened`;
        reject(new Error(msg));
      }
      try {
        await this._uSQLite.beginTransaction(this._mDB, this._isDBOpen);
        const changes = await this._uSQLite.execute(this._mDB, sql);
        if (changes < 0) {
          reject(new Error('ExecuteSQL: changes < 0'));
        }
        await this._uSQLite.commitTransaction(this._mDB, this._isDBOpen);
        resolve(changes);
      } catch (err) {
        let msg: string = `ExecuteSQL: ${err.message}`;
        try {
          await this._uSQLite.rollbackTransaction(this._mDB, this._isDBOpen);
        } catch (err) {
          msg += ` : ${err.message}`;
        }
        reject(new Error(`ExecuteSQL: ${msg}`));
      }
    });
  }
  /**
   * SelectSQL
   * execute a sql query with/without binding values
   * @param sql: string
   * @param values: string[]
   * @returns Promise<any[]>
   */
  async selectSQL(sql: string, values: string[]): Promise<any[]> {
    return new Promise(async (resolve, reject) => {
      if (!this._isDBOpen) {
        let msg = `SelectSQL: Database ${this._dbName} `;
        msg += `not opened`;
        reject(new Error(msg));
      }
      try {
        const retArr = await this._uSQLite.queryAll(this._mDB, sql, values);
        resolve(retArr);
      } catch (err) {
        reject(new Error(`SelectSQL: ${err.message}`));
      }
    });
  }
  /**
   * runSQL
   * execute a raw sql statement with/without binding values
   * @param sql: string
   * @param values: string[]
   * @returns Promise<{changes:number, lastId:number}>
   */
  async runSQL(statement: string, values: any[]): Promise<any> {
    return new Promise(async (resolve, reject) => {
      if (!this._isDBOpen) {
        let msg = `RunSQL: Database ${this._dbName} `;
        msg += `not opened`;
        reject(new Error(msg));
      }
      let retRes: any = { changes: -1, lastId: -1 };
      let initChanges: number = -1;
      try {
        initChanges = await this._uSQLite.dbChanges(this._mDB);
        // start a transaction
        await this._uSQLite.beginTransaction(this._mDB, this._isDBOpen);
      } catch (err) {
        reject(new Error(`RunSQL: ${err.message}`));
      }
      this._mDB.run(statement, values, async (err: Error) => {
        if (err) {
          const msg: string = err.message;
          try {
            await this._uSQLite.rollbackTransaction(this._mDB, this._isDBOpen);
            reject(new Error(`RunSQL: ${err.message}`));
          } catch (err) {
            reject(new Error(`RunSQL: ${msg}: ` + `${err.message}`));
          }
        } else {
          try {
            await this._uSQLite.commitTransaction(this._mDB, this._isDBOpen);
            retRes.changes =
              (await this._uSQLite.dbChanges(this._mDB)) - initChanges;
            retRes.lastId = await this._uSQLite.getLastId(this._mDB);
            resolve(retRes);
          } catch (err) {
            reject(new Error(`RunSQL: ${err.message}`));
          }
        }
      });
    });
  }
  /**
   * ExecSet
   * execute a set of raw sql statements with/without binding values
   * @param set: any[]
   * @returns Promise<{changes:number, lastId:number}>
   */
  async execSet(set: any[]): Promise<any> {
    return new Promise(async (resolve, reject) => {
      if (!this._isDBOpen) {
        let msg = `ExecSet: Database ${this._dbName} `;
        msg += `not opened`;
        reject(new Error(msg));
      }
      let retRes: any = { changes: -1, lastId: -1 };
      let initChanges: number = -1;
      try {
        initChanges = await this._uSQLite.dbChanges(this._mDB);
        // start a transaction
        await this._uSQLite.beginTransaction(this._mDB, this._isDBOpen);
      } catch (err) {
        reject(new Error(`ExecSet: ${err.message}`));
      }
      try {
        retRes.lastId = await this._uSQLite.executeSet(this._mDB, set);
        await this._uSQLite.commitTransaction(this._mDB, this._isDBOpen);
        retRes.changes =
          (await this._uSQLite.dbChanges(this._mDB)) - initChanges;
        resolve(retRes);
      } catch (err) {
        const msg: string = err.message;
        try {
          await this._uSQLite.rollbackTransaction(this._mDB, this._isDBOpen);
        } catch (err) {
          reject(new Error(`ExecSet: ${msg}: ` + `${err.message}`));
        }
      }
    });
  }
  public importJson(jsonData: JsonSQLite): Promise<number> {
    return new Promise(async (resolve, reject) => {
      let changes: number = -1;
      if (this._isDBOpen) {
        try {
          // create the database schema
          changes = await this._iFJson.createDatabaseSchema(
            this._mDB,
            jsonData,
          );
          if (changes != -1) {
            // create the tables data
            changes = await this._iFJson.createTablesData(this._mDB, jsonData);
          }
          resolve(changes);
        } catch (err) {
          reject(new Error(`ImportJson: ${err.message}`));
        }
      } else {
        reject(new Error(`ImportJson: database is closed`));
      }
    });
  }
  public exportJson(mode: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
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
            resolve(retJson);
          } else {
            reject(new Error(`ExportJson: retJson not valid`));
          }
        } catch (err) {
          reject(new Error(`ExportJson: ${err.message}`));
        }
      } else {
        reject(new Error(`ExportJson: database is closed`));
      }
    });
  }
}
