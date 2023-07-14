import type { Changes } from '../../../src/definitions';

import { UtilsFile } from './utilsFile';

interface RunResults {
  /**
   * the number of changes from an execute or run command
   */
  changes: number;
  /**
   * the lastInsertRowid created from a run command
   */
  lastInsertRowid: number;
  /**
   * values when RETURNING
   */
  values?: any[];
}
//const SQLITE_OPEN_READONLY = 1;

export class UtilsSQLite {
  public BCSQLite3: any;
  private fileUtil: UtilsFile = new UtilsFile();

  constructor() {
    this.BCSQLite3 = require('better-sqlite3-multiple-ciphers');
  }
  /**
   * OpenOrCreateDatabase
   * @param pathDB
   * @param password
   */
  public openOrCreateDatabase(
    pathDB: string,
    password: string,
    readonly: boolean,
  ): any {
    const msg = 'OpenOrCreateDatabase';
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
        readonly: true,
        fileMustExist: true,
      });
    }
    if (mDB != null) {
      try {
        this.dbChanges(mDB);
      } catch (err: any) {
        const errmsg = err.message ? err.message : err;
        throw new Error(`${msg} ${errmsg}`);
      }

      try {
        // set the password
        if (password.length > 0) {
          this.setCipherPragma(mDB, password);
        }
        // set Foreign Keys On
        this.setForeignKeyConstraintsEnabled(mDB, true);
      } catch (err: any) {
        const errmsg = err.message ? err.message : err;
        throw new Error(`${msg} ${errmsg}`);
      }
      return mDB;
    } else {
      throw new Error(msg + 'open database failed');
    }
  }
  /**
   * SetCipherPragma
   * @param mDB
   * @param password
   */
  public setCipherPragma(mDB: any, passphrase: string): void {
    const msg = 'setCipherPragma';
    try {
      mDB.pragma(`cipher='sqlcipher'`);
      mDB.pragma(`legacy=4`);
      mDB.pragma(`key='${passphrase}'`);
      return;
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      throw new Error(`${msg} ${errmsg}`);
    }
  }
  /**
   * SetForeignKeyConstraintsEnabled
   * @param mDB
   * @param toggle
   */
  public setForeignKeyConstraintsEnabled(mDB: any, toggle: boolean): void {
    const msg = 'SetForeignKeyConstraintsEnabled';
    let key = 'OFF';
    if (toggle) {
      key = 'ON';
    }
    try {
      mDB.pragma(`foreign_keys = '${key}'`);
      return;
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      throw new Error(`${msg} ${errmsg}`);
    }
  }
  /**
   * CloseDB
   * @param mDB
   */
  public closeDB(mDB: any): void {
    const msg = 'closeDB';
    try {
      mDB.close();
      return;
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      throw new Error(`${msg} ${errmsg}`);
    }
  }
  /**
   * GetVersion
   * @param mDB
   */
  public getVersion(mDB: any): number {
    const msg = 'GetVersion';
    try {
      const result = mDB.pragma('user_version');
      return result[0].user_version;
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      throw new Error(`${msg} ${errmsg}`);
    }
  }

  /**
   * SetVersion
   * @param mDB
   * @param version
   */
  public setVersion(mDB: any, version: number): void {
    const msg = 'SetVersion';
    try {
      mDB.pragma(`user_version = '${version}'`);
      return;
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      throw new Error(`${msg} ${errmsg}`);
    }
  }
  /**
   * ChangePassword
   * @param pathDB
   * @param password
   * @param newpassword
   */
  public changePassword(
    pathDB: string,
    password: string,
    newpassword: string,
  ): void {
    let mDB: any;
    const msg = 'ChangePassword';
    try {
      mDB = this.openOrCreateDatabase(pathDB, password, false);
      this.pragmaReKey(mDB, password, newpassword);
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      throw new Error(`${msg} ${errmsg}`);
    } finally {
      this.closeDB(mDB);
    }
    return;
  }
  /**
   * PragmaReKey
   * @param mDB
   * @param passphrase
   * @param newpassphrase
   */
  public pragmaReKey(
    mDB: any,
    passphrase: string,
    newpassphrase: string,
  ): void {
    const msg = 'PragmaReKey: ';
    try {
      mDB.pragma(`cipher='sqlcipher'`);
      mDB.pragma(`legacy=4`);
      mDB.pragma(`key='${passphrase}'`);
      mDB.pragma(`rekey='${newpassphrase}'`);
      return;
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      throw new Error(`${msg} ${errmsg}`);
    }
  }
  /**
   * BeginTransaction
   * @param db
   * @param isOpen
   */
  public beginTransaction(db: any, isOpen: boolean): void {
    // eslint-disable-next-line no-async-promise-executor
    const msg = 'BeginTransaction: ';
    if (!isOpen) {
      throw new Error(`${msg} database not opened`);
    }
    const sql = 'BEGIN TRANSACTION;';
    try {
      db.exec(sql);
      return;
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      throw new Error(`${msg} ${errmsg}`);
    }
  }
  /**
   * RollbackTransaction
   * @param db
   * @param isOpen
   */
  public rollbackTransaction(db: any, isOpen: boolean): void {
    const msg = 'RollbackTransaction: ';
    if (!isOpen) {
      throw new Error(`${msg} database not opened`);
    }
    const sql = 'ROLLBACK TRANSACTION;';
    try {
      db.exec(sql);
      return;
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      throw new Error(`${msg} ${errmsg}`);
    }
  }
  /**
   * CommitTransaction
   * @param db
   * @param isOpen
   */
  public commitTransaction(db: any, isOpen: boolean): void {
    const msg = 'CommitTransaction: ';
    if (!isOpen) {
      throw new Error(`${msg} database not opened`);
    }
    const sql = 'COMMIT TRANSACTION;';
    try {
      db.exec(sql);
      return;
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      throw new Error(`${msg} ${errmsg}`);
    }
  }
  /**
   * DbChanges
   * return total number of changes
   * @param db
   */
  public dbChanges(db: any): number {
    const msg = 'DbChanges: ';
    let changes = 0;
    try {
      const statement = db.prepare('SELECT total_changes()');
      const firstRow = statement.get();
      if (firstRow != null) {
        const key: any = Object.keys(firstRow)[0];
        changes = firstRow[key];
      }
      return changes;
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      throw new Error(`${msg} ${errmsg}`);
    }
  }
  /**
   * GetLastId
   * @param db
   */
  public getLastId(db: any): number {
    const msg = 'GetLastId: ';
    let lastId = -1;
    try {
      const statement = db.prepare('SELECT last_insert_rowid()');
      const firstRow = statement.get();
      if (firstRow != null) {
        const key: any = Object.keys(firstRow)[0];
        lastId = firstRow[key];
      }
      return lastId;
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      throw new Error(`${msg} ${errmsg}`);
    }
  }
  /**
   * Execute
   * @param mDB
   * @param sql
   */
  public execute(mDB: any, sql: string, fromJson: boolean): Changes {
    const result = { changes: 0, lastId: -1 };
    const msg = 'Execute';
    let changes = -1;
    let lastId = -1;
    let initChanges = -1;
    try {
      initChanges = this.dbChanges(mDB);
      let sqlStmt = sql;

      if (
        sql.toLowerCase().includes('DELETE FROM'.toLowerCase()) ||
        sql.toLowerCase().includes('INSERT INTO'.toLowerCase()) ||
        sql.toLowerCase().includes('UPDATE'.toLowerCase())
      ) {
        sqlStmt = this.checkStatements(mDB, sql, fromJson);
      }
      this.execDB(mDB, sqlStmt);
      changes = this.dbChanges(mDB) - initChanges;
      lastId = this.getLastId(mDB);
      result.changes = changes;
      result.lastId = lastId;
      return result;
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      throw new Error(`${msg} ${errmsg}`);
    }
  }
  private checkStatements(mDB: any, sql: string, fromJson: boolean): string {
    // split the statements in an array of statement
    let sqlStmt = sql.replace(/\n/g, '');
    // deal with trigger
    sqlStmt = sqlStmt.replace(/end;/g, 'END;');
    sqlStmt = sqlStmt.replace(/;END;/g, '&END;');
    const sqlStmts: string[] = sqlStmt.split(';');
    const resArr: string[] = [];
    // loop through the statement
    for (const stmt of sqlStmts) {
      const method = stmt
        .trim()
        .substring(0, Math.min(stmt.trim().length, 6))
        .toUpperCase();
      let rStmt = stmt.trim();
      switch (method) {
        case 'CREATE':
          if (rStmt.includes('&END')) {
            rStmt = rStmt.replace(/&END/g, ';END');
          }
          break;
        case 'DELETE':
          if (!fromJson && stmt.toLowerCase().includes('WHERE'.toLowerCase())) {
            const whereStmt = this.cleanStatement(`${stmt.trim()}`);
            rStmt = this.deleteSQL(mDB, whereStmt, []);
          }
          break;
        case 'INSERT':
          if (stmt.toLowerCase().includes('VALUES'.toLowerCase())) {
            rStmt = this.cleanStatement(`${stmt.trim()}`);
          }
          break;
        case 'UPDATE':
          if (stmt.toLowerCase().includes('SET'.toLowerCase())) {
            rStmt = this.cleanStatement(`${stmt.trim()}`);
          }
          break;
        case 'SELECT':
          if (!fromJson && stmt.toLowerCase().includes('WHERE'.toLowerCase())) {
            rStmt = this.cleanStatement(`${stmt.trim()}`);
          }
          break;
        default:
          break;
      }
      resArr.push(rStmt);
    }
    sqlStmt = resArr.join(';');
    return sqlStmt;
  }
  /**
   * ExecDB
   * @param mDB
   * @param sql
   */
  private execDB(mDB: any, sql: string): void {
    const msg = 'execDB: ';
    try {
      mDB.exec(sql);
      return;
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      throw new Error(`${msg} ${errmsg}`);
    }
  }
  /**
   * ExecuteSet
   * @param mDB
   * @param set
   * @param fromJson
   */
  public executeSet(
    mDB: any,
    set: any[],
    fromJson: boolean,
    returnMode: string,
  ): Changes {
    const ret: Changes = { changes: 0, lastId: -1, values: [] };
    let result: Changes = { changes: 0, lastId: -1 };
    const msg = 'ExecuteSet';
    for (let i = 0; i < set.length; i++) {
      const statement = 'statement' in set[i] ? set[i].statement : null;
      const values =
        'values' in set[i] && set[i].values.length > 0 ? set[i].values : [];
      if (statement == null) {
        let msg = 'ExecuteSet: Error Nostatement';
        msg += ` for index ${i}`;
        throw new Error(msg);
      }
      try {
        if (Array.isArray(values[0])) {
          for (const val of values) {
            const mVal: any[] = this.replaceUndefinedByNull(val);
            result = this.prepareRun(
              mDB,
              statement,
              mVal,
              fromJson,
              returnMode,
            );
            ret.changes += result.changes;
            ret.lastId = result.lastId;
            const keys = Object.keys(result);
            if (keys.includes('values') && result.values.length > 0) {
              ret.values.push(result.values);
            }
          }
        } else {
          if (values.length > 0) {
            const mVal: any[] = this.replaceUndefinedByNull(values);
            result = this.prepareRun(
              mDB,
              statement,
              mVal,
              fromJson,
              returnMode,
            );
          } else {
            result = this.prepareRun(mDB, statement, [], fromJson, returnMode);
          }
          ret.changes += result.changes;
          ret.lastId = result.lastId;
          const keys = Object.keys(result);
          if (keys.includes('values') && result.values.length > 0) {
            ret.values.push(result.values);
          }
        }
      } catch (err: any) {
        const errmsg = err.message ? err.message : err;
        throw new Error(`${msg} ${errmsg}`);
      }
    }
    return ret;
  }
  /**
   * PrepareRun
   * @param mDB
   * @param statement
   * @param values
   * @param fromJson
   */
  public prepareRun(
    mDB: any,
    statement: string,
    values: any[],
    fromJson: boolean,
    returnMode: string,
  ): Changes {
    const result: Changes = { changes: 0, lastId: -1 };
    const msg = 'PrepareRun';

    const stmtType: string = statement
      .replace(/\n/g, '')
      .trim()
      .substring(0, 6)
      .toUpperCase();
    let sqlStmt: string = statement;
    try {
      if (!fromJson && stmtType === 'DELETE') {
        sqlStmt = this.deleteSQL(mDB, statement, values);
      }
      const mValues = values ? values : [];
      let mVal: any[] = [];
      if (mValues.length > 0) {
        mVal = this.replaceUndefinedByNull(mValues);
      } else {
        const findVals = sqlStmt.match(/\?/gi);
        const nbValues = findVals ? findVals.length : 0;
        for (let i = 0; i < nbValues; i++) {
          mVal.push(null);
        }
      }
      const ret: RunResults = this.runExec(mDB, sqlStmt, mVal, returnMode);
      if (ret.values != null) {
        result.values = ret.values;
        result.changes = ret.changes;
        result.lastId = ret.lastInsertRowid;
      } else {
        result.changes = ret.changes;
        result.lastId = ret.lastInsertRowid;
      }
      return result;
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      throw new Error(`${msg} ${errmsg}`);
    }
  }

  private runExec(
    mDB: any,
    stmt: string,
    values: any[] = [],
    returnMode: string,
  ): RunResults {
    let result: RunResults = { changes: 0, lastInsertRowid: -1, values: [] };
    const msg = 'runExec: ';
    try {
      const cStmt = this.cleanStatement(stmt);
      const params = this.getStmtAndNames(cStmt, returnMode);
      switch (params.mMode) {
        case 'one': {
          const iniChanges = this.dbChanges(mDB);
          if (values.length === 0) {
            const value = mDB.prepare(params.stmt).get();
            result.values.push(value);
            result.lastInsertRowid = this.getLastId(mDB);
          } else {
            const lowerId = this.getLastId(mDB) + 1;
            const statement = mDB.prepare(params.stmt);
            const res = statement.run(values);
            result.lastInsertRowid = res.lastInsertRowid;
            const sql = `SELECT ${params.names} FROM ${params.tableName} WHERE rowid = ${lowerId};`;
            const value = this.queryOne(mDB, sql, []);
            result.values.push(value);
          }
          result.changes = this.dbChanges(mDB) - iniChanges;
          break;
        }
        case 'all': {
          const iniChanges = this.dbChanges(mDB);
          if (values.length === 0) {
            result.values = mDB.prepare(params.stmt).all();
            result.lastInsertRowid = this.getLastId(mDB);
          } else {
            const lowerId = this.getLastId(mDB) + 1;
            const statement = mDB.prepare(params.stmt);

            const res = statement.run(values);
            const upperId = res.lastInsertRowid;
            const sql = `SELECT ${params.names} FROM ${params.tableName} WHERE rowid BETWEEN ${lowerId} AND ${upperId};`;

            result.values = this.queryAll(mDB, sql, []);
            result.lastInsertRowid = res.lastInsertRowid;
          }
          result.changes = this.dbChanges(mDB) - iniChanges;
          break;
        }
        default: {
          const statement = mDB.prepare(params.stmt);
          if (values != null && values.length > 0) {
            result = statement.run(values);
          } else {
            result = statement.run();
          }
        }
      }

      return result;
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      throw new Error(`${msg} ${errmsg}`);
    }
  }
  /**
   * replaceUndefinedByNull
   * @param values
   * @returns
   */
  public replaceUndefinedByNull(values: any[]): any[] {
    const retValues: any[] = [];
    if (values.length > 0) {
      for (const val of values) {
        let mVal: any = val;
        if (typeof val === 'undefined') mVal = null;
        retValues.push(mVal);
      }
    }
    return retValues;
  }
  /**
   * deleteSQL
   * @param mDB
   * @param statement
   * @param values
   * @returns
   */
  public deleteSQL(mDB: any, statement: string, values: any[]): string {
    let sqlStmt: string = statement;
    const msg = 'DeleteSQL';
    try {
      const isLast: boolean = this.isLastModified(mDB, true);
      const isDel: boolean = this.isSqlDeleted(mDB, true);
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
        this.findReferencesAndUpdate(mDB, tableName, clauseStmt, values);
      }
      return sqlStmt;
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      throw new Error(`${msg} ${errmsg}`);
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
  public findReferencesAndUpdate(
    mDB: any,
    tableName: string,
    whereStmt: string,
    values: any[],
  ): void {
    const msg = 'FindReferencesAndUpdate';
    try {
      const references = this.getReferences(mDB, tableName);
      if (references.length <= 0) {
        return;
      }
      const tableNameWithRefs = references.pop();
      for (const refe of references) {
        // get the tableName of the reference
        const refTable: string = this.getReferenceTableName(refe);
        if (refTable.length <= 0) {
          continue;
        }
        // get the with references columnName
        const withRefsNames: string[] = this.getWithRefsColumnName(refe);
        if (withRefsNames.length <= 0) {
          continue;
        }
        // get the referenced columnName
        const colNames: string[] = this.getReferencedColumnName(refe);
        if (colNames.length <= 0) {
          continue;
        }
        // update the where clause
        const uWhereStmt: string = this.updateWhere(
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
        if (values.length > 0) {
          const mVal: any[] = this.replaceUndefinedByNull(values);
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

        const ret = this.runExec(mDB, stmt, selValues, 'no');

        const lastId: number = ret.lastInsertRowid;
        if (lastId == -1) {
          const msg = `UPDATE sql_deleted failed for references table: ${refTable}`;
          throw new Error(`findReferencesAndUpdate: ${msg}`);
        }
      }
      return;
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      throw new Error(`${msg} ${errmsg}`);
    }
  }
  public getReferenceTableName(refValue: string): string {
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
  public getReferencedColumnName(refValue: string): string[] {
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
  public getWithRefsColumnName(refValue: string): string[] {
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
  public updateWhere(
    whStmt: string,
    withRefsNames: string[],
    colNames: string[],
  ): string {
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

  public getReferences(mDB: any, tableName: string): any[] {
    const msg = 'GetReferences';
    const sqlStmt: string =
      'SELECT sql FROM sqlite_master ' +
      "WHERE sql LIKE('%FOREIGN KEY%') AND sql LIKE('%REFERENCES%') AND " +
      "sql LIKE('%" +
      tableName +
      "%') AND sql LIKE('%ON DELETE%');";
    try {
      const res: any[] = this.queryAll(mDB, sqlStmt, []);
      // get the reference's string(s)
      let retRefs: string[] = [];
      if (res.length > 0) {
        retRefs = this.getRefs(res[0].sql);
      }
      return retRefs;
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      throw new Error(`${msg} ${errmsg}`);
    }
  }
  public getRefs(str: string): string[] {
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
  public queryAll(mDB: any, sql: string, values: any[]): any[] {
    const msg = 'QueryAll';
    try {
      const cSql = this.cleanStatement(sql);
      const stmt = mDB.prepare(cSql);
      let rows;
      if (values != null && values.length > 0) {
        rows = stmt.all(values);
      } else {
        rows = stmt.all();
      }
      if (rows == null) {
        rows = [];
      }
      return rows;
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      throw new Error(`${msg} ${errmsg}`);
    }
  }
  /**
   * QueryOne
   * @param mDB
   * @param sql
   * @param values
   */
  public queryOne(mDB: any, sql: string, values: any[]): any {
    const msg = 'QueryOne';
    try {
      const cSql = this.cleanStatement(sql);
      const stmt = mDB.prepare(cSql);

      let row;
      if (values != null && values.length > 0) {
        row = stmt.get(values);
      } else {
        row = stmt.get();
      }
      return row;
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      throw new Error(`${msg} ${errmsg}`);
    }
  }
  /**
   * GetTablesNames
   * @param mDb
   */
  public getTablesNames(mDb: any): string[] {
    const msg = 'getTablesNames';
    let sql = 'SELECT name FROM sqlite_master WHERE ';
    sql += "type='table' AND name NOT LIKE 'sync_table' ";
    sql += "AND name NOT LIKE '_temp_%' ";
    sql += "AND name NOT LIKE 'sqlite_%' ";
    sql += 'ORDER BY rootpage DESC;';
    const retArr: string[] = [];
    try {
      const retQuery: any[] = this.queryAll(mDb, sql, []);
      for (const query of retQuery) {
        retArr.push(query.name);
      }
      return retArr;
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      throw new Error(`${msg} ${errmsg}`);
    }
  }

  /**
   * GetViewsNames
   * @param mDb
   */
  public getViewsNames(mDb: any): string[] {
    const msg = 'GetViewsNames';
    let sql = 'SELECT name FROM sqlite_master WHERE ';
    sql += "type='view' AND name NOT LIKE 'sqlite_%' ";
    sql += 'ORDER BY rootpage DESC;';
    const retArr: string[] = [];
    try {
      const retQuery: any[] = this.queryAll(mDb, sql, []);
      for (const query of retQuery) {
        retArr.push(query.name);
      }
      return retArr;
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      throw new Error(`${msg} ${errmsg}`);
    }
  }
  /**
   * isLastModified
   * @param mDB
   * @param isOpen
   */
  public isLastModified(mDB: any, isOpen: boolean): boolean {
    const msg = 'IsLastModified';
    if (!isOpen) {
      throw new Error(`${msg} database not opened`);
    }
    try {
      const tableList: string[] = this.getTablesNames(mDB);
      for (const table of tableList) {
        const tableNamesTypes: any = this.getTableColumnNamesTypes(mDB, table);
        const tableColumnNames: string[] = tableNamesTypes.names;
        if (tableColumnNames.includes('last_modified')) {
          return true;
        }
      }
      return false;
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      throw new Error(`${msg} ${errmsg}`);
    }
  }
  /**
   * isSqlDeleted
   * @param mDB
   * @param isOpen
   */
  public isSqlDeleted(mDB: any, isOpen: boolean): boolean {
    const msg = 'IsSqlDeleted';
    if (!isOpen) {
      throw new Error(`${msg} database not opened`);
    }
    try {
      const tableList: string[] = this.getTablesNames(mDB);
      for (const table of tableList) {
        const tableNamesTypes: any = this.getTableColumnNamesTypes(mDB, table);
        const tableColumnNames: string[] = tableNamesTypes.names;
        if (tableColumnNames.includes('sql_deleted')) {
          return true;
        }
      }
      return false;
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      throw new Error(`${msg} ${errmsg}`);
    }
  }
  public getJournalMode(mDB: any): string {
    const msg = 'getJournalMode';
    try {
      const retMode = mDB.pragma('journal_mode');
      console.log(`journal_mode: ${retMode[0].journal_mode}`);
      return retMode[0].journal_mode;
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      throw new Error(`${msg} ${errmsg}`);
    }
  }
  public async isDatabaseEncrypted(dbName: string): Promise<boolean> {
    const msg = 'isDatabaseEncrypted';
    try {
      const isExists: boolean = this.fileUtil.isFileExists(dbName);
      if (isExists) {
        const filePath = this.fileUtil.getFilePath(dbName);
        return await this.isDBEncrypted(filePath);
      } else {
        throw new Error(`${msg}: Database ${dbName} does not exist`);
      }
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      throw new Error(`${msg} ${errmsg}`);
    }
  }
  public async isDBEncrypted(filePath: string): Promise<boolean> {
    try {
      const retStr = await this.fileUtil.readFileAsPromise(filePath, {
        start: 0,
        end: 12,
      });
      if (retStr === 'SQLite format') return false;
      else return true;
    } catch (error) {
      return true;
    }
  }
  /**
   * GetTableColumnNamesTypes
   * @param mDB
   * @param tableName
   */
  public getTableColumnNamesTypes(mDB: any, tableName: string): any {
    const msg = 'getTableColumnNamesTypes';
    try {
      const infos = mDB.pragma(`table_info('${tableName}')`);
      const retNames: string[] = [];
      const retTypes: string[] = [];
      for (const info of infos) {
        retNames.push(info.name);
        retTypes.push(info.type);
      }
      return { names: retNames, types: retTypes };
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      throw new Error(`${msg} ${errmsg}`);
    }
  }
  private cleanStatement(stmt: string): string {
    let sql = '';
    if (
      stmt.toLowerCase().includes('INSERT INTO'.toLowerCase()) ||
      stmt.toLowerCase().includes('SELECT'.toLowerCase()) ||
      stmt.toLowerCase().includes('UPDATE'.toLowerCase()) ||
      stmt.toLowerCase().includes('DELETE FROM'.toLowerCase())
    ) {
      // check for JSON string
      sql = this.dealJsonString(stmt);
      sql = sql.replaceAll('"', "'");
      sql = sql.replaceAll('§', '"');
    } else {
      sql = stmt;
    }
    return sql;
  }
  private findIndex(str: string, char: string): number[] {
    const a = [];
    for (let i = str.length; i--; ) if (str[i] == char) a.push(i);
    return a.reverse();
  }
  private dealJsonString(stmt: string): string {
    let retStmt = stmt;
    const oJ = this.findIndex(stmt, '{');
    const eJ = this.findIndex(stmt, '}');
    for (let i = 0; i < oJ.length; i++) {
      const g = retStmt.substring(oJ[i] + 1, eJ[i]).replaceAll('"', '§');
      retStmt = retStmt.substring(0, oJ[i] + 1) + g + retStmt.substring(eJ[i]);
    }
    return retStmt;
  }
  private getStmtAndNames(stmt: string, returnMode: string): any {
    const retObj: any = {};
    const mStmt = stmt;
    if (
      mStmt.toUpperCase().includes('RETURNING') &&
      (returnMode === 'all' || returnMode === 'one')
    ) {
      retObj.tableName = this.getTableName(mStmt);
      retObj.mMode = returnMode;
      const idx = mStmt.toUpperCase().indexOf('RETURNING') + 9;
      const names = mStmt.substring(idx).trim();
      retObj.names = names.slice(-1) === ';' ? names.slice(0, -1) : names;
      retObj.stmt = mStmt;
    } else {
      retObj.mMode = 'no';
      if (mStmt.toUpperCase().includes('RETURNING')) {
        const idx = mStmt.toUpperCase().indexOf('RETURNING');
        retObj.stmt = mStmt.slice(0, idx).trim() + ';';
      } else {
        retObj.stmt = mStmt;
      }
    }
    return retObj;
  }
  private getTableName(sqlStatement: string): string | null {
    const patterns: { [key: string]: RegExp } = {
      insert: /INSERT\s+INTO\s+(\w+)/i,
      delete: /DELETE\s+FROM\s+(\w+)/i,
      update: /UPDATE\s+(\w+)/i,
      select: /SELECT.*\s+FROM\s+(\w+)/i,
    };

    let tableName: string | null = null;

    Object.keys(patterns).some((key: string) => {
      const pattern: RegExp = patterns[key];
      const match: RegExpExecArray | null = pattern.exec(sqlStatement);
      if (match) {
        tableName = match[1];
        return true; // Stop iterating through patterns
      }
      return false;
    });

    return tableName;
  }
}
