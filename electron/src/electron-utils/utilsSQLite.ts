//import { UtilsFile } from './utilsFile';

const SQLITE_OPEN_READONLY = 1;

export class UtilsSQLite {
  public BCSQLite3: any;
//  public JSQlite: any;
//  public SQLite3: any;
//  private fileUtil: UtilsFile = new UtilsFile();
//  private isEncryption: boolean = this.fileUtil.getIsEncryption();

  constructor() {
/*
    if(this.isEncryption) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      this.mSQLite = require('@journeyapps/sqlcipher').verbose();
    } else {
      this.mSQLite = require('sqlite3');
    }
*/
    this.BCSQLite3 = require('better-sqlite3-multiple-ciphers');
  }
  /**
   * OpenOrCreateDatabase
   * @param pathDB
   * @param password
   */
  public async openOrCreateDatabase(
    pathDB: string,
    password: string,
    readonly: boolean,
  ): Promise<any> {
    const msg = 'OpenOrCreateDatabase: ';
    // open sqlite3 database
    let mDB: any;
    if (!readonly) {
      mDB = new this.BCSQLite3(pathDB, {
        verbose: console.log,
        fileMustExist: false,
      });
    } else {
      mDB = new this.BCSQLite3(pathDB, {
        verbose: console.log,
        readonly: SQLITE_OPEN_READONLY,
        fileMustExist: true,
      });
    }
    if (mDB != null) {
      try {
        await this.dbChanges(mDB);
      } catch (err: any) {
        const errmsg = err.message ? err.message : err;
        return Promise.reject(`${msg} ${errmsg}`);
      }

      try {
        // set the password
        if (password.length > 0) {
          await this.setCipherPragma(mDB, password);
        }
        // set Foreign Keys On
        await this.setForeignKeyConstraintsEnabled(mDB, true);
      } catch (err: any) {
        const errmsg = err.message ? err.message : err;
        return Promise.reject(`${msg} ${errmsg}`);
      }
      return Promise.resolve(mDB);
    } else {
      return Promise.reject(msg + 'open database failed');
    }
  }
  /**
   * SetCipherPragma
   * @param mDB
   * @param password
   */
  public async setCipherPragma(mDB: any, passphrase: string): Promise<void> {
    const msg = 'setCipherPragma: ';
    try {
      mDB.pragma(`cipher='sqlcipher'`)
      mDB.pragma(`legacy=4`)
      mDB.pragma(`key='${passphrase}'`);
      return Promise.resolve();
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      return Promise.reject(`${msg} ${errmsg}`);
    }
}
  /**
   * SetForeignKeyConstraintsEnabled
   * @param mDB
   * @param toggle
   */
  public async setForeignKeyConstraintsEnabled(
    mDB: any,
    toggle: boolean,
  ): Promise<void> {
    const msg = 'SetForeignKeyConstraintsEnabled: ';
    let key = 'OFF';
    if (toggle) {
      key = 'ON';
    }
    try {
      mDB.pragma(`foreign_keys = '${key}'`);
      return Promise.resolve();
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      return Promise.reject(`${msg} ${errmsg}`);
    }
 }
  /**
   * GetVersion
   * @param mDB
   */
  public async getVersion(mDB: any): Promise<number> {
    const msg = 'GetVersion: ';
    try {
      const version = mDB.pragma('user_version');
      return Promise.resolve(version)
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      return Promise.reject(`${msg} ${errmsg}`);
    }
 }
  /**
   * SetVersion
   * @param mDB
   * @param version
   */
  public async setVersion(mDB: any, version: number): Promise<void> {
    const msg = 'SetVersion: ';
    try {
      mDB.pragma(`user_version = '${version}'`);
      return;
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      return Promise.reject(`${msg} ${errmsg}`);
    }
 }
  /**
   * ChangePassword
   * @param pathDB
   * @param password
   * @param newpassword
   */
  public async changePassword(
    pathDB: string,
    password: string,
    newpassword: string,
  ): Promise<void> {
    let mDB: any;
    const msg = "ChangePassword";
    try {
      mDB = await this.openOrCreateDatabase(pathDB, password, false);
      await this.pragmaReKey(mDB, password, newpassword);
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      return Promise.reject(`${msg} ${errmsg}`);
    } finally {
      mDB.close();
    }
  }
  /**
   * PragmaReKey
   * @param mDB
   * @param password
   * @param newpassword
   */
  private async pragmaReKey(
    mDB: any,
    passphrase: string,
    newpassphrase: string,
  ): Promise<void> {
    const msg = 'PragmaReKey: ';
    try {
      mDB.pragma(`cipher='sqlcipher'`)
      mDB.pragma(`legacy=4`)
      mDB.pragma(`key='${passphrase}'`);
      mDB.pragma(`rekey='${newpassphrase}'`);
      return;
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      return Promise.reject(`${msg} ${errmsg}`);
    }
  }
  /**
   * BeginTransaction
   * @param db
   * @param isOpen
   */
  public async beginTransaction(db: any, isOpen: boolean): Promise<void> {
    // eslint-disable-next-line no-async-promise-executor
    const msg = 'BeginTransaction: ';
    if (!isOpen) {
      return Promise.reject(`${msg} database not opened`);
    }
    const sql = 'BEGIN TRANSACTION;';
    try {
      db.exec(sql);
      return Promise.resolve();
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      return Promise.reject(`${msg} ${errmsg}`);
    }
  }
  /**
   * RollbackTransaction
   * @param db
   * @param isOpen
   */
  public async rollbackTransaction(db: any, isOpen: boolean): Promise<void> {
    const msg = 'RollbackTransaction: ';
    if (!isOpen) {
      return Promise.reject(`${msg} database not opened`);
    }
    const sql = 'ROLLBACK TRANSACTION;';
    try {
      db.exec(sql);
      return Promise.resolve();
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      return Promise.reject(`${msg} ${errmsg}`);
    }
  }
  /**
   * CommitTransaction
   * @param db
   * @param isOpen
   */
  public async commitTransaction(db: any, isOpen: boolean): Promise<void> {
    const msg = 'CommitTransaction: ';
    if (!isOpen) {
      return Promise.reject(`${msg} database not opened`);
    }
    const sql = 'COMMIT TRANSACTION;';
    try {
      db.exec(sql);
      return Promise.resolve();
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      return Promise.reject(`${msg} ${errmsg}`);
    }
  }
  /**
   * DbChanges
   * return total number of changes
   * @param db
   */
  public async dbChanges(db: any): Promise<number> {
    const msg = 'DbChanges: ';
    let changes = 0;
    try {
      const statement = db.prepare('SELECT total_changes()');
      const firstRow = statement.get();
      if (firstRow != null) {
        const key: any = Object.keys(firstRow)[0];
        changes = firstRow[key];
      }
      return Promise.resolve(changes);
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      return Promise.reject(`${msg} ${errmsg}`);
    }

  }
  /**
   * GetLastId
   * @param db
   */
  public getLastId(db: any): Promise<number> {
    const msg = 'GetLastId: ';
    let lastId = -1;
    try {
      const statement = db.prepare('SELECT last_insert_rowid()');
      const firstRow = statement.get();
      if (firstRow != null) {
        const key: any = Object.keys(firstRow)[0];
        lastId = firstRow[key];
      }
      return Promise.resolve(lastId);
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      return Promise.reject(`${msg} ${errmsg}`);
    }

  }
  /**
   * Execute
   * @param mDB
   * @param sql
   */
  public async execute(
    mDB: any,
    sql: string,
    fromJson: boolean,
  ): Promise<{changes: number, lastId: number}> {
    const result = {changes: 0, lastId: -1};
    const msg = "Execute";
    try {
      let sqlStmt = sql;
      // Check for DELETE FROM in sql string
      if (
        !fromJson &&
        sql.toLowerCase().includes('DELETE FROM'.toLowerCase())
      ) {
        sqlStmt = sql.replace(/\n/g, '');
        const sqlStmts: string[] = sqlStmt.split(';');
        const resArr: string[] = [];
        for (const stmt of sqlStmts) {
          const trimStmt = stmt
            .trim()
            .substring(0, Math.min(stmt.trim().length, 11))
            .toUpperCase();
          if (
            trimStmt === 'DELETE FROM' &&
            stmt.toLowerCase().includes('WHERE'.toLowerCase())
          ) {
            const whereStmt = `${stmt.trim()};`;
            const rStmt = await this.deleteSQL(mDB, whereStmt, []);
            resArr.push(rStmt);
          } else {
            resArr.push(stmt);
          }
        }
        sqlStmt = resArr.join(';');
      }

      const ret = await this.execDB(mDB, sqlStmt);
      result.changes = ret.changes;
      result.lastId = ret.lastInsertRowId;
      return Promise.resolve(result);
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      return Promise.reject(`${msg} ${errmsg}`);
    }
  }
  /**
   * ExecDB
   * @param mDB
   * @param sql
   */
  private async execDB(mDB: any, sql: string): Promise<{changes: number, lastInsertRowId: number}> {
    const msg = 'execDB: ';
    try {
      const statement = mDB.prepare(sql);
      const result = statement.run();
      return Promise.resolve(result);
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      return Promise.reject(`${msg} ${errmsg}`);
    }
  }
  /**
   * ExecuteSet
   * @param mDB
   * @param set
   * @param fromJson
   */
  public async executeSet(
    mDB: any,
    set: any[],
    fromJson: boolean,
  ): Promise<{changes: number, lastId: number}> {
    let result = {changes: 0, lastId: -1};
    const msg = "ExecuteSet"
    for (let i = 0; i < set.length; i++) {
      const statement = 'statement' in set[i] ? set[i].statement : null;
      const values =
        'values' in set[i] && set[i].values.length > 0 ? set[i].values : [];
      if (statement == null) {
        let msg = 'ExecuteSet: Error Nostatement';
        msg += ` for index ${i}`;
        return Promise.reject(msg);
      }
      try {
        if (Array.isArray(values[0])) {
          for (const val of values) {
            const mVal: any[] = await this.replaceUndefinedByNull(val);
            result = await this.prepareRun(mDB, statement, mVal, fromJson);
          }
        } else {
          const mVal: any[] = await this.replaceUndefinedByNull(values);
          result = await this.prepareRun(mDB, statement, mVal, fromJson);
        }
      } catch (err: any) {
        const errmsg = err.message ? err.message : err;
        return Promise.reject(`${msg} ${errmsg}`);
      }
    }
    return Promise.resolve(result);
  }
  /**
   * PrepareRun
   * @param mDB
   * @param statement
   * @param values
   * @param fromJson
   */
  public async prepareRun(
    mDB: any,
    statement: string,
    values: any[],
    fromJson: boolean,
  ): Promise<{changes: number, lastId: number}> {
    const result = {changes: 0, lastId: -1};
    const msg = "PrepareRun";

    const stmtType: string = statement
      .replace(/\n/g, '')
      .trim()
      .substring(0, 6)
      .toUpperCase();
    let sqlStmt: string = statement;
    try {
      if (!fromJson && stmtType === 'DELETE') {
        sqlStmt = await this.deleteSQL(mDB, statement, values);
      }
      let mVal: any[] = [];
      if (values != null && values.length > 0) {
        mVal = await this.replaceUndefinedByNull(values);
      }

      const ret = await this.runExec(mDB, sqlStmt, mVal);
      result.changes = ret.changes;
      result.lastId = ret.lastInsertRowId;
      return Promise.resolve(result);
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      return Promise.reject(`${msg} ${errmsg}`);
    }
  }

  private async runExec(
    mDB: any,
    stmt: string,
    values: any[] = [],
  ): Promise<{changes: number, lastInsertRowId: number}> {
    const msg = 'runExec: ';
    try {
      const statement = mDB.prepare(stmt);
      let result: {changes: number, lastInsertRowId: number};
      if (values != null && values.length > 0) {
        result = statement.run(values);
      } else {
        result = statement.run();
      }
      return Promise.resolve(result);
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      return Promise.reject(`${msg} ${errmsg}`);
    }
  }
  /**
   * replaceUndefinedByNull
   * @param values
   * @returns
   */
  public async replaceUndefinedByNull(values: any[]): Promise<any[]> {
    const retValues: any[] = [];
    if (values.length > 0) {
      for (const val of values) {
        let mVal: any = val;
        if (typeof val === 'undefined') mVal = null;
        retValues.push(mVal);
      }
    }
    return Promise.resolve(retValues);
  }
  /**
   * deleteSQL
   * @param mDB
   * @param statement
   * @param values
   * @returns
   */
  public async deleteSQL(
    mDB: any,
    statement: string,
    values: any[],
  ): Promise<string> {
    let sqlStmt: string = statement;
    const msg = "DeleteSQL"
    try {
      const isLast: boolean = await this.isLastModified(mDB, true);
      const isDel: boolean = await this.isSqlDeleted(mDB, true);
      if (isLast && isDel) {
        // Replace DELETE by UPDATE and set sql_deleted to 1
        const wIdx: number = statement.toUpperCase().indexOf('WHERE');
        const preStmt: string = statement.substring(0, wIdx - 1);
        const clauseStmt: string = statement.substring(wIdx, statement.length);
        const tableName: string = preStmt
          .substring('DELETE FROM'.length)
          .trim();
        sqlStmt = `UPDATE ${tableName} SET sql_deleted = 1 ${clauseStmt}`;
        // Find REFERENCES if any and update the sql_deleted column
        await this.findReferencesAndUpdate(mDB, tableName, clauseStmt, values);
      }
      return sqlStmt;
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      return Promise.reject(`${msg} ${errmsg}`);
    }
  }
  /**
   * findReferencesAndUpdate
   * @param mDB
   * @param tableName
   * @param whereStmt
   * @param values
   * @returns
   */
  public async findReferencesAndUpdate(
    mDB: any,
    tableName: string,
    whereStmt: string,
    values: any[],
  ): Promise<void> {
    const msg = "FindReferencesAndUpdate";
    try {
      const references = await this.getReferences(mDB, tableName);
      if (references.length <= 0) {
        return;
      }
      const tableNameWithRefs = references.pop();
      for (const refe of references) {
        // get the tableName of the reference
        const refTable: string = await this.getReferenceTableName(refe);
        if (refTable.length <= 0) {
          continue;
        }
        // get the with references columnName
        const withRefsNames: string[] = await this.getWithRefsColumnName(refe);
        if (withRefsNames.length <= 0) {
          continue;
        }
        // get the referenced columnName
        const colNames: string[] = await this.getReferencedColumnName(refe);
        if (colNames.length <= 0) {
          continue;
        }
        // update the where clause
        const uWhereStmt: string = await this.updateWhere(
          whereStmt,
          withRefsNames,
          colNames,
        );
        if (uWhereStmt.length <= 0) {
          continue;
        }
        let updTableName: string = tableNameWithRefs;
        let updColNames: string[] = colNames;
        if (tableNameWithRefs === tableName) {
          updTableName = refTable;
          updColNames = withRefsNames;
        }

        //update sql_deleted for this reference
        const stmt: string =
          'UPDATE ' + updTableName + ' SET sql_deleted = 1 ' + uWhereStmt;
        const selValues: any[] = [];
        if (values != null && values.length > 0) {
          const mVal: any[] = await this.replaceUndefinedByNull(values);
          let arrVal: string[] = whereStmt.split('?');
          if (arrVal[arrVal.length - 1] === ';') arrVal = arrVal.slice(0, -1);
          for (const [j, val] of arrVal.entries()) {
            for (const updVal of updColNames) {
              const idxVal = val.indexOf(updVal);
              if (idxVal > -1) {
                selValues.push(mVal[j]);
              }
            }
          }
        }
  
        const ret = await this.runExec(mDB, stmt, selValues);
  
        const lastId: number = ret.lastInsertRowId;
        if (lastId == -1) {
          const msg = `UPDATE sql_deleted failed for references table: ${refTable}`;
          return Promise.reject(new Error(`findReferencesAndUpdate: ${msg}`));
        }
      }
      return Promise.resolve();
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      return Promise.reject(`${msg} ${errmsg}`);
    }
  }
  public async getReferenceTableName(refValue: string): Promise<string> {
    let tableName = '';
    if (refValue.length > 0) {
      const arr: string[] = refValue.split(new RegExp('REFERENCES', 'i'));
      if (arr.length === 2) {
        const oPar: number = arr[1].indexOf('(');
        tableName = arr[1].substring(0, oPar).trim();
      }
    }
    return tableName;
  }
  public async getReferencedColumnName(refValue: string): Promise<string[]> {
    let colNames: string[] = [];
    if (refValue.length > 0) {
      const arr: string[] = refValue.split(new RegExp('REFERENCES', 'i'));
      if (arr.length === 2) {
        const oPar: number = arr[1].indexOf('(');
        const cPar: number = arr[1].indexOf(')');
        const colStr = arr[1].substring(oPar + 1, cPar).trim();
        colNames = colStr.split(',');
      }
    }
    return colNames;
  }
  public async getWithRefsColumnName(refValue: string): Promise<string[]> {
    let colNames: string[] = [];
    if (refValue.length > 0) {
      const arr: string[] = refValue.split(new RegExp('REFERENCES', 'i'));
      if (arr.length === 2) {
        const oPar: number = arr[0].indexOf('(');
        const cPar: number = arr[0].indexOf(')');
        const colStr = arr[0].substring(oPar + 1, cPar).trim();
        colNames = colStr.split(',');
      }
    }
    return colNames;
  }
  public async updateWhere(
    whStmt: string,
    withRefsNames: string[],
    colNames: string[],
  ): Promise<string> {
    let whereStmt = '';
    if (whStmt.length > 0) {
      const index: number = whStmt.toLowerCase().indexOf('WHERE'.toLowerCase());
      const stmt: string = whStmt.substring(index + 6);
      if (withRefsNames.length === colNames.length) {
        for (let i = 0; i < withRefsNames.length; i++) {
          let colType = 'withRefsNames';
          let idx = stmt.indexOf(withRefsNames[i]);
          if (idx === -1) {
            idx = stmt.indexOf(colNames[i]);
            colType = 'colNames';
          }
          if (idx > -1) {
            let valStr = '';
            const fEqual = stmt.indexOf('=', idx);
            if (fEqual > -1) {
              const iAnd = stmt.indexOf('AND', fEqual);
              const ilAnd = stmt.indexOf('and', fEqual);
              if (iAnd > -1) {
                valStr = stmt.substring(fEqual + 1, iAnd - 1).trim();
              } else if (ilAnd > -1) {
                valStr = stmt.substring(fEqual + 1, ilAnd - 1).trim();
              } else {
                valStr = stmt.substring(fEqual + 1, stmt.length).trim();
              }
              if (i > 0) {
                whereStmt += ' AND ';
              }
              if (colType === 'withRefsNames') {
                whereStmt += `${colNames[i]} = ${valStr}`;
              } else {
                whereStmt += `${withRefsNames[i]} = ${valStr}`;
              }
            }
          }
        }

        whereStmt = 'WHERE ' + whereStmt;
      }
    }
    return whereStmt;
  }

  public async getReferences(mDB: any, tableName: string): Promise<any[]> {
    const msg = "GetReferences";
    const sqlStmt: string =
      'SELECT sql FROM sqlite_master ' +
      "WHERE sql LIKE('%FOREIGN KEY%') AND sql LIKE('%REFERENCES%') AND " +
      "sql LIKE('%" +
      tableName +
      "%') AND sql LIKE('%ON DELETE%');";
    try {
      const res: any[] = await this.queryAll(mDB, sqlStmt, []);
      // get the reference's string(s)
      let retRefs: string[] = [];
      if (res.length > 0) {
        retRefs = await this.getRefs(res[0].sql);
      }
      return Promise.resolve(retRefs);
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      return Promise.reject(`${msg} ${errmsg}`);
    }
  }
  public async getRefs(str: string): Promise<string[]> {
    const retRefs: string[] = [];
    const arrFor: string[] = str.split(new RegExp('FOREIGN KEY', 'i'));
    // Loop through Foreign Keys
    for (let i = 1; i < arrFor.length; i++) {
      retRefs.push(arrFor[i].split(new RegExp('ON DELETE', 'i'))[0].trim());
    }
    // find table name with references
    if (str.substring(0, 12).toLowerCase() === 'CREATE TABLE'.toLowerCase()) {
      const oPar = str.indexOf('(');
      const tableName = str.substring(13, oPar).trim();
      retRefs.push(tableName);
    }

    return retRefs;
  }
  /**
   * QueryAll
   * @param mDB
   * @param sql
   * @param values
   */
  public queryAll(mDB: any, sql: string, values: any[]): Promise<any[]> {
    const msg = "QueryAll";
    try {
      const stmt = mDB.prepare(sql);
      let rows
      if (values != null && values.length > 0) {
        rows = stmt.all(values);
      } else {
        rows = stmt.all();
      }
      if (rows == null) {
        rows = [];
      }
      Promise.resolve(rows);
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      return Promise.reject(`${msg} ${errmsg}`);
    }
  }
  /**
   * QueryAll
   * @param mDB
   * @param sql
   * @param values
   */
  public queryOne(mDB: any, sql: string, values: any[]): Promise<any> {
    const msg = "QueryOne";
    try {
      const stmt = mDB.prepare(sql);

      let row
      if (values != null && values.length > 0) {
        row = stmt.get(values);
      } else {
        row = stmt.get();
      }
      Promise.resolve(row);
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      return Promise.reject(`${msg} ${errmsg}`);
    }
  }
  /**
   * GetTablesNames
   * @param mDb
   */
  public async getTablesNames(mDb: any): Promise<string[]> {
    const msg = "getTablesNames";
    let sql = 'SELECT name FROM sqlite_master WHERE ';
    sql += "type='table' AND name NOT LIKE 'sync_table' ";
    sql += "AND name NOT LIKE '_temp_%' ";
    sql += "AND name NOT LIKE 'sqlite_%' ";
    sql += 'ORDER BY rootpage DESC;';
    const retArr: string[] = [];
    try {
      const retQuery: any[] = await this.queryAll(mDb, sql, []);
      for (const query of retQuery) {
        retArr.push(query.name);
      }
      return Promise.resolve(retArr);
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      return Promise.reject(`${msg} ${errmsg}`);
    }
  }
  
  /**
   * GetViewsNames
   * @param mDb
   */
  public async getViewsNames(mDb: any): Promise<string[]> {
    const msg = "GetViewsNames";
    let sql = 'SELECT name FROM sqlite_master WHERE ';
    sql += "type='view' AND name NOT LIKE 'sqlite_%' ";
    sql += 'ORDER BY rootpage DESC;';
    const retArr: string[] = [];
    try {
      const retQuery: any[] = await this.queryAll(mDb, sql, []);
      for (const query of retQuery) {
        retArr.push(query.name);
      }
      return Promise.resolve(retArr);
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      return Promise.reject(`${msg} ${errmsg}`);
    }
  }
  /**
   * isLastModified
   * @param mDB
   * @param isOpen
   */
  public async isLastModified(mDB: any, isOpen: boolean): Promise<boolean> {
    const msg = "IsLastModified";
    if (!isOpen) {
      return Promise.reject(`${msg} database not opened`);
    }
    try {
      const tableList: string[] = await this.getTablesNames(mDB);
      for (const table of tableList) {
        const tableNamesTypes: any = await this.getTableColumnNamesTypes(
          mDB,
          table,
        );
        const tableColumnNames: string[] = tableNamesTypes.names;
        if (tableColumnNames.includes('last_modified')) {
          return Promise.resolve(true);
        }
      }
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      return Promise.reject(`${msg} ${errmsg}`);
    }
  }
  /**
   * isSqlDeleted
   * @param mDB
   * @param isOpen
   */
  public async isSqlDeleted(mDB: any, isOpen: boolean): Promise<boolean> {
    const msg = "IsSqlDeleted"
    if (!isOpen) {
      return Promise.reject(`${msg} database not opened`);
    }
    try {
      const tableList: string[] = await this.getTablesNames(mDB);
      for (const table of tableList) {
        const tableNamesTypes: any = await this.getTableColumnNamesTypes(
          mDB,
          table,
        );
        const tableColumnNames: string[] = tableNamesTypes.names;
        if (tableColumnNames.includes('sql_deleted')) {
          return Promise.resolve(true);
        }
      }
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      return Promise.reject(`${msg} ${errmsg}`);
    }
  }
  public async getJournalMode(mDB: any): Promise<string> {
    const msg = "getJournalMode";
    try {
      const retMode = mDB.pragma('journal_mode');
      return retMode;
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      return Promise.reject(`${msg} ${errmsg}`);
    }
  }
  /**
   * GetTableColumnNamesTypes
   * @param mDB
   * @param tableName
   */
  public async getTableColumnNamesTypes(
    mDB: any,
    tableName: string,
  ): Promise<any> {
    const msg = "getTableColumnNamesTypes";
    try {
      const infos = mDB.pragma(`table_info('${tableName}')`);
      const retNames: string[] = [];
      const retTypes: string[] = [];
      for(const info of infos) {
        retNames.push(info.name);
        retTypes.push(info.type); 
      }
      return Promise.resolve({ names: retNames, types: retTypes });
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      return Promise.reject(`${msg} ${errmsg}`);
    }
  }
}
