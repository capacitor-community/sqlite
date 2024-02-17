/************************************************
 * Only to be used to run TypeOrm Cli
 * migration:generate
 * A in-memory database is used
 ************************************************
 */

import type { capSQLiteChanges, capSQLiteValues } from '../definitions';

import { UtilsSQLite } from './utilsSQLite';

export class Database {
  private _isDBOpen: boolean;
  private wasmPath = 'assets';
  private sqliteUtil: UtilsSQLite = new UtilsSQLite();
  private typeOrmDBFolder = this.sqliteUtil.getTypeOrmDBFolder();
  private dbPath = '';
  public mDb: any;

  constructor() {
    this.mDb = null;
    this._isDBOpen = false;
  }
  public async open(dbName: string): Promise<void> {
    try {
      this.dbPath = this.sqliteUtil.getTypeOrmDBPath(
        this.typeOrmDBFolder,
        `${dbName}SQLite.db`,
      );

      this.mDb = await this.sqliteUtil.openOrCreateDatabase(
        this.wasmPath,
        this.dbPath,
      );
      this._isDBOpen = true;
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(`Open: ${err}`);
    }
  }
  public async close(): Promise<void> {
    try {
      if (this._isDBOpen) {
        await this.sqliteUtil.saveDatabase(this.mDb, this.dbPath);
        await this.mDb.close();
      }
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(`Close: ${err}`);
    }
  }

  public async executeSQL(statements: string): Promise<number> {
    let changes = -1;
    try {
      if (this._isDBOpen) {
        const initChanges = await this.sqliteUtil.dbChanges(this.mDb);
        changes = await this.sqliteUtil.execute(this.mDb, statements);
        if (changes < 0) {
          return Promise.reject(new Error('ExecuteSQL: changes < 0'));
        }
        changes = (await this.sqliteUtil.dbChanges(this.mDb)) - initChanges;
      }
      return Promise.resolve(changes);
    } catch (err) {
      return Promise.reject(`ExecuteSQL: ${err}`);
    }
  }
  public async run(
    statement: string,
    values: any[],
    returnMode: string,
  ): Promise<capSQLiteChanges> {
    const retRes: any = { changes: -1, lastId: -1 };

    try {
      if (this._isDBOpen) {
        const initChanges = await this.sqliteUtil.dbChanges(this.mDb);
        const retObj = await this.sqliteUtil.run(
          this.mDb,
          statement,
          values,
          returnMode,
        );
        const lastId = retObj['lastId'];
        if (lastId < 0) {
          return Promise.reject(new Error('RunSQL: lastId < 0'));
        }
        const changes =
          (await this.sqliteUtil.dbChanges(this.mDb)) - initChanges;
        retRes.changes = changes;
        retRes.lastId = lastId;
        retRes.values = retObj['values'] ? retObj['values'] : [];
      }
      return Promise.resolve({ changes: retRes });
    } catch (err) {
      return Promise.reject(`Run: ${err}`);
    }
  }
  public async selectSQL(sql: string, values: any[]): Promise<capSQLiteValues> {
    let retArr: any[] = [];
    try {
      if (this._isDBOpen) {
        retArr = await this.sqliteUtil.queryAll(this.mDb, sql, values);
      }
      return Promise.resolve({ values: retArr });
    } catch (err) {
      return Promise.reject(`SelectSQL: ${err}`);
    }
  }
}
