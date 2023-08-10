import type {
  capSQLiteVersionUpgrade,
  JsonSQLite,
  EncryptJson,
  Changes,
} from '../../../src/definitions';
import { GlobalSQLite } from '../GlobalSQLite';

import { ExportToJson } from './ImportExportJson/exportToJson';
import { ImportFromJson } from './ImportExportJson/importFromJson';
import { UtilsJson } from './ImportExportJson/utilsJson';
import { UtilsJsonEncryption } from './ImportExportJson/utilsJsonEncryption';
import { UtilsEncryption } from './utilsEncryption';
import { UtilsFile } from './utilsFile';
import { UtilsSQLite } from './utilsSQLite';
import { UtilsSecret } from './utilsSecret';
import { UtilsUpgrade } from './utilsUpgrade';

export class Database {
  private _isDbOpen: boolean;
  private dbName: string;
  private _encrypted: boolean;
  private _mode: string;
  private _isEncryption: boolean;
  private version: number;
  private readonly: boolean;
  private pathDB: string;
  private jsonEncryptUtil: UtilsJsonEncryption = new UtilsJsonEncryption();
  private fileUtil: UtilsFile = new UtilsFile();
  private sqliteUtil: UtilsSQLite = new UtilsSQLite();
  private jsonUtil: UtilsJson = new UtilsJson();
  private globalUtil: GlobalSQLite = new GlobalSQLite();
  private encryptionUtil: UtilsEncryption = new UtilsEncryption();
  private secretUtil: UtilsSecret = new UtilsSecret();
  private upgradeUtil: UtilsUpgrade = new UtilsUpgrade();
  private importFromJsonUtil: ImportFromJson = new ImportFromJson();
  private exportToJsonUtil: ExportToJson = new ExportToJson();
  private database: any;
  private upgradeVersionDict: Record<number, capSQLiteVersionUpgrade> = {};

  constructor(
    dbName: string,
    encrypted: boolean,
    mode: string,
    version: number,
    isEncryption: boolean,
    readonly: boolean,
    upgDict: Record<number, capSQLiteVersionUpgrade>,
    globalUtil?: GlobalSQLite,
  ) {
    this.dbName = dbName;
    this._encrypted = encrypted;
    this._mode = mode;
    this._isEncryption = isEncryption;
    this.version = version;
    this.readonly = readonly;
    this.upgradeVersionDict = upgDict;
    this.pathDB = this.fileUtil.getFilePath(dbName);
    this._isDbOpen = false;
    this.globalUtil = globalUtil ? globalUtil : new GlobalSQLite();

    if (this.pathDB.length === 0)
      throw new Error('Could not generate a path to ' + dbName);
    console.log(`&&& Databases path: ${this.pathDB}`);
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
   * open the better-sqlite3 database
   * @returns Promise<boolean>
   */
  async open(): Promise<void> {
    this._isDbOpen = false;
    let password = '';
    try {
      if (
        this._encrypted &&
        (this._mode === 'secret' || this._mode === 'encryption')
      ) {
        password = this.secretUtil.getPassphrase();

        if (password.length <= 0) {
          password = this.globalUtil.secret;
        }
      }
      if (this._mode === 'encryption') {
        await this.encryptionUtil.encryptDatabase(this.pathDB, password);
      }
      this.database = this.sqliteUtil.openOrCreateDatabase(
        this.pathDB,
        password,
        this.readonly,
      );
      this._isDbOpen = true;
      if (!this.readonly) {
        const curVersion: number = this.sqliteUtil.getVersion(this.database);
        if (
          this.version > curVersion &&
          Object.keys(this.upgradeVersionDict).length > 0
        ) {
          try {
            await this.fileUtil.copyFileName(
              this.dbName,
              `backup-${this.dbName}`,
            );

            // execute the upgrade flow process
            await this.upgradeUtil.onUpgrade(
              this.database,
              this.upgradeVersionDict,
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
      }
      return;
    } catch (err) {
      if (this._isDbOpen) this.sqliteUtil.closeDB(this.database);
      throw new Error(`Open: ${err}`);
    }
  }
  /**
   * Close
   * close better-sqlite3 database
   * @returns Promise<boolean>
   */
  dbClose(): void {
    this.ensureDatabaseIsOpen();
    try {
      this.sqliteUtil.closeDB(this.database);
    } catch (err) {
      throw new Error(`Close failed: ${this.dbName}  ${err}`);
    } finally {
      this._isDbOpen = false;
    }
    return;
  }
  /**
   * ChangeSecret
   * open the @journeyapps/sqlcipher sqlite3 database
   * @returns Promise<void>
   */
  async changeSecret(): Promise<void> {
    try {
      if (this._mode === 'encryption') {
        // change the password
        const oPassword: string = this.globalUtil.secret;
        const nPassword: string = this.globalUtil.newsecret;
        this.sqliteUtil.changePassword(this.pathDB, oPassword, nPassword);
      }
      return;
    } catch (err) {
      throw new Error(`Change secret: ${err}`);
    }
  }
  /**
   * GetVersion
   * get the database version
   * @returns Promise<number>
   */
  getVersion(): number {
    this.ensureDatabaseIsOpen();

    try {
      const currentVersion: number = this.sqliteUtil.getVersion(this.database);
      return currentVersion;
    } catch (err) {
      if (this._isDbOpen) this.sqliteUtil.closeDB(this.database);
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
      this.dbClose();
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
  isTableExists(tableName: string): boolean {
    this.ensureDatabaseIsOpen();

    const isOpen: boolean = this._isDbOpen;

    try {
      const tableExistsResult = this.jsonUtil.isTableExists(
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
  createSyncTable(): number {
    this.ensureDatabaseIsOpen();

    let changes = -1;
    const isOpen = this._isDbOpen;
    // check if the table has already being created
    try {
      const retB = this.jsonUtil.isTableExists(
        this.database,
        isOpen,
        'sync_table',
      );
      if (!retB) {
        const isLastModified = this.sqliteUtil.isLastModified(
          this.database,
          isOpen,
        );
        const isSqlDeleted = this.sqliteUtil.isSqlDeleted(
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
                              ${date});`;
          const results = this.sqliteUtil.execute(this.database, stmts, false);
          changes = results.changes;
          if (results.changes < 0) {
            throw new Error(`CreateSyncTable: failed changes < 0`);
          }
        } else {
          throw new Error('No last_modified/sql_deleted columns in tables');
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
  setSyncDate(syncDate: string): any {
    this.ensureDatabaseIsOpen();

    try {
      const isTable = this.jsonUtil.isTableExists(
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

      const results = this.sqliteUtil.execute(this.database, stmt, false);

      if (results.changes < 0) {
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
  getSyncDate(): any {
    this.ensureDatabaseIsOpen();

    try {
      const isTable = this.jsonUtil.isTableExists(
        this.database,
        this._isDbOpen,
        'sync_table',
      );
      if (!isTable) {
        throw new Error('No sync_table available');
      }
      const syncDate: number = this.exportToJsonUtil.getSyncDate(this.database);
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
  executeSQL(sql: string, transaction: boolean): number {
    this.ensureDatabaseIsOpen();

    try {
      if (transaction) {
        const mode: string = this.sqliteUtil.getJournalMode(this.database);
        console.log(`$$$ in executeSQL journal_mode: ${mode} $$$`);
        this.sqliteUtil.beginTransaction(this.database, this._isDbOpen);
      }
      const results = this.sqliteUtil.execute(this.database, sql, false);

      if (results.changes < 0) {
        throw new Error('ExecuteSQL: changes < 0');
      }

      if (transaction) {
        this.sqliteUtil.commitTransaction(this.database, this._isDbOpen);
      }

      return results.changes;
    } catch (executeError) {
      let message = `${executeError}`;
      try {
        if (transaction) {
          this.sqliteUtil.rollbackTransaction(this.database, this._isDbOpen);
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
  selectSQL(sql: any, values: any[]): any[] {
    this.ensureDatabaseIsOpen();

    try {
      const selectResult = this.sqliteUtil.queryAll(this.database, sql, values);
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
  runSQL(
    statement: string,
    values: any[],
    transaction: boolean,
    returnMode: string,
  ): Changes {
    this.ensureDatabaseIsOpen();

    try {
      // start a transaction
      if (transaction) {
        const mode: string = this.sqliteUtil.getJournalMode(this.database);
        console.log(`$$$ in runSQL journal_mode: ${mode} $$$`);
        this.sqliteUtil.beginTransaction(this.database, this._isDbOpen);
      }
    } catch (err) {
      throw new Error(`RunSQL: ${err}`);
    }
    try {
      const results = this.sqliteUtil.prepareRun(
        this.database,
        statement,
        values,
        false,
        returnMode,
      );
      if (results.lastId < 0) {
        if (transaction) {
          this.sqliteUtil.rollbackTransaction(this.database, this._isDbOpen);
        }

        throw new Error(`RunSQL: return LastId < 0`);
      }
      if (transaction) {
        this.sqliteUtil.commitTransaction(this.database, this._isDbOpen);
      }
      return results;
    } catch (err) {
      if (transaction) {
        this.sqliteUtil.rollbackTransaction(this.database, this._isDbOpen);
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
  execSet(set: any[], transaction: boolean, returnMode: string): Changes {
    this.ensureDatabaseIsOpen();

    let results: Changes = { changes: 0, lastId: -1 };
    try {
      // start a transaction
      if (transaction) {
        const mode: string = this.sqliteUtil.getJournalMode(this.database);
        console.log(`$$$ in execSet journal_mode: ${mode} $$$`);
        this.sqliteUtil.beginTransaction(this.database, this._isDbOpen);
      }
    } catch (err) {
      throw new Error(`ExecSet: ${err}`);
    }
    try {
      results = this.sqliteUtil.executeSet(
        this.database,
        set,
        false,
        returnMode,
      );
      if (transaction) {
        this.sqliteUtil.commitTransaction(this.database, this._isDbOpen);
      }
      return results;
    } catch (err) {
      const message: string = err;

      try {
        if (transaction) {
          this.sqliteUtil.rollbackTransaction(this.database, this._isDbOpen);
        }
      } catch (err) {
        throw new Error(`ExecSet: ${message}: ` + `${err}`);
      }
    }
  }
  deleteExportedRows(): void {
    this.ensureDatabaseIsOpen();
    try {
      this.exportToJsonUtil.delExportedRows(this.database);
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
  public getTableList(): any[] {
    this.ensureDatabaseIsOpen();

    try {
      const tableNames = this.sqliteUtil.getTablesNames(this.database);
      return tableNames;
    } catch (err) {
      throw new Error(`GetTableList: ${err}`);
    }
  }

  public importJson(jsonData: JsonSQLite): number {
    let changes = 0;
    this.ensureDatabaseIsOpen();

    try {
      // set Foreign Keys Off
      this.sqliteUtil.setForeignKeyConstraintsEnabled(this.database, false);
      if (jsonData.tables && jsonData.tables.length > 0) {
        // create the database schema
        changes = this.importFromJsonUtil.createDatabaseSchema(
          this.database,
          jsonData,
        );

        if (changes != -1) {
          // create the tables data
          changes += this.importFromJsonUtil.createTablesData(
            this.database,
            jsonData,
          );
        }
      }
      if (jsonData.views && jsonData.views.length > 0) {
        // create the views
        changes += this.importFromJsonUtil.createViews(this.database, jsonData);
      }
      // set Foreign Keys On
      this.sqliteUtil.setForeignKeyConstraintsEnabled(this.database, true);

      return changes;
    } catch (err) {
      throw new Error(`ImportJson: ${err}`);
    }
  }

  public exportJson(mode: string): any {
    const inJson: JsonSQLite = {} as JsonSQLite;
    inJson.database = this.dbName.slice(0, -9);
    inJson.version = this.version;
    inJson.encrypted = false;
    inJson.mode = mode;
    this.ensureDatabaseIsOpen();

    try {
      const isTable = this.jsonUtil.isTableExists(
        this.database,
        this._isDbOpen,
        'sync_table',
      );
      if (isTable) {
        this.exportToJsonUtil.setLastExportDate(
          this.database,
          new Date().toISOString(),
        );
      }
      let jsonResult: any = this.exportToJsonUtil.createExportObject(
        this.database,
        inJson,
      );
      const keys = Object.keys(jsonResult);
      if (keys.length === 0) {
        const msg =
          `ExportJson: return Object is empty ` + `No data to synchronize`;
        throw new Error(msg);
      }
      let isValid = this.jsonUtil.isJsonSQLite(jsonResult);

      if (this._encrypted && this._isEncryption) {
        jsonResult.overwrite = true;
        jsonResult.encrypted = true;
        const base64Str: string =
          this.jsonEncryptUtil.encryptJSONObject(jsonResult);
        jsonResult = {} as EncryptJson;
        jsonResult.expData = base64Str;
        isValid = true;
      }

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