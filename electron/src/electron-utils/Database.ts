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
  private _isDbOpen: boolean;
  private dbName: string;
  //  private _encrypted: boolean;
  //  private _mode: string;
  private version: number;
  private pathDB: string;
  private fileUtil: UtilsFile = new UtilsFile();
  private sqliteUtil: UtilsSQLite = new UtilsSQLite();
  private jsonUtil: UtilsJson = new UtilsJson();
  //  private _uGlobal: GlobalSQLite = new GlobalSQLite();
  //  private _uEncrypt: UtilsEncryption = new UtilsEncryption();
  private upgradeUtil: UtilsUpgrade = new UtilsUpgrade();
  private importFromJsonUtil: ImportFromJson = new ImportFromJson();
  private exportToJsonUtil: ExportToJson = new ExportToJson();
  private database: any;
  private upgradeVersionDict: Record<number, capSQLiteVersionUpgrade> = {};

  constructor(
    dbName: string,
    //    encrypted: boolean,
    //    mode: string,
    version: number,
    upgDict: Record<number, capSQLiteVersionUpgrade>,
  ) {
    this.dbName = dbName;
    //    this._encrypted = encrypted;
    //    this._mode = mode;
    this.version = version;
    this.upgradeVersionDict = upgDict;
    this.pathDB = this.fileUtil.getFilePath(dbName);
    this._isDbOpen = false;

    if (this.pathDB.length === 0)
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
    return this._isDbOpen;
  }
  /**
   * Open
   * open the @journeyapps/sqlcipher sqlite3 database
   * @returns Promise<boolean>
   */
  async open(): Promise<void> {
    this._isDbOpen = false;
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
      this.database = await this.sqliteUtil.openOrCreateDatabase(
        this.pathDB /*,
        password,*/,
      );

      const curVersion: number = await this.sqliteUtil.getVersion(
        this.database,
      );
      this._isDbOpen = true;

      if (
        this.version > curVersion &&
        Object.keys(this.upgradeVersionDict).length > 0
      ) {
        try {
          // execute the upgrade flow process
          await this.upgradeUtil.onUpgrade(
            this.database,
            this.upgradeVersionDict,
            this.dbName,
            curVersion,
            this.version,
          );
          // delete the backup database
          await this.fileUtil.deleteFileName(`backup-${this.dbName}`);
        } catch (err) {
          // restore the database from backup
          try {
            await this.fileUtil.restoreFileName(this.dbName, 'backup');
          } catch (err) {
            throw new Error(`Open: ${err}`);
          }
        }
      }
      return;
    } catch (err) {
      if (this._isDbOpen) this.close();
      throw new Error(`Open: ${err}`);
    }
  }
  /**
   * Close
   * close the @journeyapps/sqlcipher sqlite3 database
   * @returns Promise<boolean>
   */
  async close(): Promise<void> {
    this.ensureDatabaseIsOpen();

    this.database.close((err: Error) => {
      if (err) {
        throw new Error('Close failed: ${this.dbName}  ${err}');
      }
      this._isDbOpen = false;
    });
  }

  /**
   * GetVersion
   * get the database version
   * @returns Promise<number>
   */
  async getVersion(): Promise<number> {
    this.ensureDatabaseIsOpen();

    try {
      const currentVersion: number = await this.sqliteUtil.getVersion(
        this.database,
      );
      return currentVersion;
    } catch (err) {
      if (this._isDbOpen) this.close();
      throw new Error(`getVersion: ${err}`);
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
    const isExists: boolean = this.fileUtil.isFileExists(dbName);

    if (isExists && !this._isDbOpen) {
      // open the database
      try {
        await this.open();
      } catch (err) {
        throw new Error(`DeleteDB: ${err}`);
      }
    }

    // close the database
    try {
      await this.close();
    } catch (err) {
      throw new Error('DeleteDB: Close failed');
    }

    // delete the database
    if (isExists) {
      try {
        await this.fileUtil.deleteFileName(dbName);
      } catch (err) {
        throw new Error(`DeleteDB: deleteFile ${dbName} failed ${err}`);
      }
    }
    return;
  }

  /**
   * IsTableExists
   * @param tableName
   * @returns
   */
  async isTableExists(tableName: string): Promise<boolean> {
    this.ensureDatabaseIsOpen();

    const isOpen: boolean = this._isDbOpen;

    try {
      const tableExistsResult = await this.jsonUtil.isTableExists(
        this.database,
        isOpen,
        tableName,
      );
      return tableExistsResult;
    } catch (err) {
      throw new Error(`IsTableExists: ${err}`);
    }
  }
  /**
   * CreateSyncTable
   * create the synchronization table
   * @returns Promise<number>
   */
  async createSyncTable(): Promise<number> {
    this.ensureDatabaseIsOpen();

    let changes = -1;
    const isOpen = this._isDbOpen;
    // check if the table has already being created
    try {
      const retB = await this.jsonUtil.isTableExists(
        this.database,
        isOpen,
        'sync_table',
      );
      if (!retB) {
        const isLastModified = await this.sqliteUtil.isLastModified(
          this.database,
          isOpen,
        );
        const isSqlDeleted = await this.sqliteUtil.isSqlDeleted(
          this.database,
          isOpen,
        );
        if (isLastModified && isSqlDeleted) {
          const date: number = Math.round(new Date().getTime() / 1000);
          let stmts = `
                          CREATE TABLE IF NOT EXISTS sync_table (
                              id INTEGER PRIMARY KEY NOT NULL,
                              sync_date INTEGER
                              );`;
          stmts += `INSERT INTO sync_table (sync_date) VALUES (
                              "${date}");`;
          changes = await this.sqliteUtil.execute(this.database, stmts, false);
          if (changes < 0) {
            throw new Error(`CreateSyncTable: failed changes < 0`);
          }
        } else {
          throw new Error('No last_modified column in tables');
        }
      } else {
        changes = 0;
      }
      return changes;
    } catch (err) {
      throw new Error(`CreateSyncTable: ${err}`);
    }
  }
  /**
   * SetSyncDate
   * store the synchronization date
   * @param syncDate: string
   * @returns Promise<{result: boolean, message: string}>
   */
  async setSyncDate(syncDate: string): Promise<any> {
    this.ensureDatabaseIsOpen();

    try {
      const isTable = await this.jsonUtil.isTableExists(
        this.database,
        this._isDbOpen,
        'sync_table',
      );
      if (!isTable) {
        throw new Error('No sync_table available');
      }
      const syncDateUnixTimestamp: number = Math.round(
        new Date(syncDate).getTime() / 1000,
      );
      let stmt = `UPDATE sync_table SET sync_date = `;
      stmt += `${syncDateUnixTimestamp} WHERE id = 1;`;

      const changes: number = await this.sqliteUtil.execute(
        this.database,
        stmt,
        false,
      );

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
    this.ensureDatabaseIsOpen();

    try {
      const isTable = await this.jsonUtil.isTableExists(
        this.database,
        this._isDbOpen,
        'sync_table',
      );
      if (!isTable) {
        throw new Error('No sync_table available');
      }
      const syncDate: number = await this.exportToJsonUtil.getSyncDate(
        this.database,
      );
      if (syncDate > 0) {
        return { syncDate };
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
    this.ensureDatabaseIsOpen();

    try {
      if (transaction) {
        await this.sqliteUtil.beginTransaction(this.database, this._isDbOpen);
      }

      const changes = await this.sqliteUtil.execute(this.database, sql, false);

      if (changes < 0) {
        throw new Error('ExecuteSQL: changes < 0');
      }

      if (transaction) {
        await this.sqliteUtil.commitTransaction(this.database, this._isDbOpen);
      }

      return changes;
    } catch (executeError) {
      let message = `${executeError}`;
      try {
        if (transaction) {
          await this.sqliteUtil.rollbackTransaction(
            this.database,
            this._isDbOpen,
          );
        }
      } catch (rollbackErr) {
        message += ` : ${rollbackErr}`;
      }
      throw new Error(`ExecuteSQL: ${message}`);
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
    this.ensureDatabaseIsOpen();

    try {
      const selectResult = await this.sqliteUtil.queryAll(
        this.database,
        sql,
        values,
      );
      return selectResult;
    } catch (err) {
      throw new Error(`SelectSQL: ${err}`);
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
    this.ensureDatabaseIsOpen();

    const result: any = { changes: -1, lastId: -1 };
    let initChanges = -1;

    try {
      initChanges = await this.sqliteUtil.dbChanges(this.database);
      // start a transaction
      if (transaction) {
        await this.sqliteUtil.beginTransaction(this.database, this._isDbOpen);
      }
    } catch (err) {
      throw new Error(`RunSQL: ${err}`);
    }
    try {
      const lastId = await this.sqliteUtil.prepareRun(
        this.database,
        statement,
        values,
        false,
      );
      if (lastId < 0) {
        if (transaction) {
          await this.sqliteUtil.rollbackTransaction(
            this.database,
            this._isDbOpen,
          );
        }

        throw new Error(`RunSQL: return LastId < 0`);
      }
      if (transaction) {
        await this.sqliteUtil.commitTransaction(this.database, this._isDbOpen);
      }
      result.changes =
        (await this.sqliteUtil.dbChanges(this.database)) - initChanges;
      result.lastId = lastId;

      return result;
    } catch (err) {
      if (transaction) {
        await this.sqliteUtil.rollbackTransaction(
          this.database,
          this._isDbOpen,
        );
      }
      throw new Error(`RunSQL: ${err}`);
    }
  }

  /**
   * ExecSet
   * execute a set of raw sql statements with/without binding values
   * @param set: any[]
   * @returns Promise<{changes:number, lastId:number}>
   */
  async execSet(set: any[], transaction: boolean): Promise<any> {
    this.ensureDatabaseIsOpen();

    const result: any = { changes: -1, lastId: -1 };
    let initChanges = -1;

    try {
      initChanges = await this.sqliteUtil.dbChanges(this.database);

      // start a transaction
      if (transaction) {
        await this.sqliteUtil.beginTransaction(this.database, this._isDbOpen);
      }
    } catch (err) {
      throw new Error(`ExecSet: ${err}`);
    }
    try {
      result.lastId = await this.sqliteUtil.executeSet(
        this.database,
        set,
        false,
      );
      if (transaction) {
        await this.sqliteUtil.commitTransaction(this.database, this._isDbOpen);
      }

      result.changes =
        (await this.sqliteUtil.dbChanges(this.database)) - initChanges;
      return result;
    } catch (err) {
      const message: string = err;

      try {
        if (transaction) {
          await this.sqliteUtil.rollbackTransaction(
            this.database,
            this._isDbOpen,
          );
        }
      } catch (err) {
        throw new Error(`ExecSet: ${message}: ` + `${err}`);
      }
    }
  }
  async deleteExportedRows(): Promise<void> {
    this.ensureDatabaseIsOpen();
    try {
      await this.exportToJsonUtil.delExportedRows(this.database);
      return;
    } catch (err) {
      throw new Error(`DeleteExportedRows: ${err}`);
    }
  }
  /**
   * GetTableList
   * get the table's list
   * @returns
   */
  public async getTableList(): Promise<any[]> {
    this.ensureDatabaseIsOpen();

    try {
      const tableNames = await this.sqliteUtil.getTablesNames(this.database);
      return tableNames;
    } catch (err) {
      throw new Error(`GetTableList: ${err}`);
    }
  }

  public async importJson(jsonData: JsonSQLite): Promise<number> {
    let changes = 0;
    this.ensureDatabaseIsOpen();

    try {
      // set Foreign Keys Off
      await this.sqliteUtil.setForeignKeyConstraintsEnabled(
        this.database,
        false,
      );
      if (jsonData.tables && jsonData.tables.length > 0) {
        // create the database schema
        changes = await this.importFromJsonUtil.createDatabaseSchema(
          this.database,
          jsonData,
        );

        if (changes != -1) {
          // create the tables data
          changes += await this.importFromJsonUtil.createTablesData(
            this.database,
            jsonData,
          );
        }
      }
      if (jsonData.views && jsonData.views.length > 0) {
        // create the views
        changes += await this.importFromJsonUtil.createViews(
          this.database,
          jsonData,
        );
      }
      // set Foreign Keys On
      await this.sqliteUtil.setForeignKeyConstraintsEnabled(
        this.database,
        true,
      );

      return changes;
    } catch (err) {
      throw new Error(`ImportJson: ${err}`);
    }
  }

  public async exportJson(mode: string): Promise<any> {
    const inJson: JsonSQLite = {} as JsonSQLite;
    inJson.database = this.dbName.slice(0, -9);
    inJson.version = this.version;
    inJson.encrypted = false;
    inJson.mode = mode;
    this.ensureDatabaseIsOpen();

    try {
      await this.exportToJsonUtil.setLastExportDate(
        this.database,
        new Date().toISOString(),
      );

      const jsonResult: JsonSQLite = await this.exportToJsonUtil.createExportObject(
        this.database,
        inJson,
      );
      const keys = Object.keys(jsonResult);
      if (keys.length === 0) {
        const msg =
          `ExportJson: return Object is empty ` + `No data to synchronize`;
        throw new Error(msg);
      }

      const isValid = this.jsonUtil.isJsonSQLite(jsonResult);

      if (isValid) {
        return jsonResult;
      } else {
        throw new Error(`ExportJson: retJson not valid`);
      }
    } catch (err) {
      throw new Error(`ExportJson: ${err}`);
    }
  }

  /**
   * Throws an error if `this._isDbOpen` is `false`.
   */
  private ensureDatabaseIsOpen() {
    if (!this._isDbOpen || !this.database) {
      throw new Error(
        `getVersion: Database ${this.dbName} is not open yet. You should open it first.`,
      );
    }
  }
}
