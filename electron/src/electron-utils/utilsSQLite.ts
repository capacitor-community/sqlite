import type { Changes } from '../../../src/definitions';

import type { Database } from './Database';
import { UtilsSQL92Compatibility } from './UtilsSQL92Compatibility';
import { UtilsDelete } from './utilsDelete';
import { UtilsFile } from './utilsFile';
import { UtilsSQLStatement } from './utilsSqlstatement';

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
  private statUtil: UtilsSQLStatement = new UtilsSQLStatement();
  private delUtil: UtilsDelete = new UtilsDelete();
  private sql92Utils: UtilsSQL92Compatibility = new UtilsSQL92Compatibility();

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
        //        verbose: console.log,
        fileMustExist: false,
      });
    } else {
      mDB = new this.BCSQLite3(pathDB, {
        //        verbose: console.log,
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
  public execute(
    mDB: any,
    sql: string,
    fromJson: boolean,
    isSQL92: boolean,
  ): Changes {
    const result = { changes: 0, lastId: -1 };
    const msg = 'Execute';
    let changes = -1;
    let lastId = -1;
    let initChanges = -1;
    try {
      initChanges = this.dbChanges(mDB);
      let sqlStmt = sql;

      // modify sql to sql92 compatible
      sqlStmt = this.statementsToSQL92(mDB, sql, fromJson, isSQL92);
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
  private statementsToSQL92(
    mDB: any,
    sql: string,
    fromJson: boolean,
    isSQL92: boolean,
  ): string {
    // split the statements in an array of statement
    let sqlStmt = sql.replace(/\n/g, '');
    // deal with trigger
    sqlStmt = sqlStmt.replace(/end;/g, 'END;');
    sqlStmt = sqlStmt.replace(/;END;/g, '&END;');
    const sqlStmts: string[] = sqlStmt.split(';');
    const resArr: string[] = [];
    // loop through the statement
    for (const stmt of sqlStmts) {
      let rStmt = stmt.trim();
      const method = rStmt
        .substring(0, Math.min(stmt.trim().length, 6))
        .toUpperCase();
      switch (method) {
        case 'CREATE':
          if (rStmt.includes('&END')) {
            rStmt = rStmt.replace(/&END/g, ';END');
          }
          break;
        case 'DELETE':
          if (
            !fromJson &&
            rStmt.toLowerCase().includes('WHERE'.toLowerCase())
          ) {
            let whereStmt = rStmt;
            if (!isSQL92) whereStmt = this.cleanStatement(rStmt);
            rStmt = this.deleteSQL(mDB, whereStmt, []);
          }
          break;
        case 'INSERT':
          if (rStmt.toLowerCase().includes('VALUES'.toLowerCase())) {
            if (!isSQL92) rStmt = this.cleanStatement(rStmt);
          }
          break;
        case 'UPDATE':
          if (rStmt.toLowerCase().includes('SET'.toLowerCase())) {
            if (!isSQL92) rStmt = this.cleanStatement(`${stmt.trim()}`);
          }
          break;
        case 'SELECT':
          if (
            !fromJson &&
            rStmt.toLowerCase().includes('WHERE'.toLowerCase())
          ) {
            if (!isSQL92) rStmt = this.cleanStatement(rStmt);
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
    isSQL92: boolean,
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
            let nStatement = statement;
            if (!isSQL92) {
              nStatement = this.cleanStatement(statement);
            }
            result = this.prepareRun(mDB, nStatement, [], fromJson, returnMode);
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
   * @param returnMode
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
      const params = this.getStmtAndNames(stmt, returnMode);
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
            const value = this.queryOne(mDB, sql, [], true);
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

            result.values = this.queryAll(mDB, sql, [], true);
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
      if (!isLast || !isDel) {
        return sqlStmt;
      }
      // Replace DELETE by UPDATE
      // set sql_deleted to 1 and the last_modified to
      // timenow
      const whereClause = this.statUtil.extractWhereClause(sqlStmt);
      if (!whereClause) {
        const msg = 'deleteSQL: cannot find a WHERE clause';
        throw new Error(`${msg}`);
      }
      const tableName = this.statUtil.extractTableName(sqlStmt);
      if (!tableName) {
        const msg = 'deleteSQL: cannot find a WHERE clause';
        throw new Error(`${msg}`);
      }
      const colNames = this.statUtil.extractColumnNames(whereClause);
      if (colNames.length === 0) {
        const msg =
          'deleteSQL: Did not find column names in the WHERE Statement';
        throw new Error(`${msg}`);
      }
      const setStmt = 'sql_deleted = 1';
      // Find REFERENCES if any and update the sql_deleted
      // column
      const hasToUpdate = this.findReferencesAndUpdate(
        mDB,
        tableName,
        whereClause,
        colNames,
        values,
      );
      if (hasToUpdate) {
        const whereStmt = whereClause.endsWith(';')
          ? whereClause.slice(0, -1)
          : whereClause;
        sqlStmt = `UPDATE ${tableName} SET ${setStmt} WHERE ${whereStmt} AND sql_deleted = 0;`;
      } else {
        sqlStmt = '';
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
   * @param initColNames
   * @param values
   * @returns
   */
  public findReferencesAndUpdate(
    mDB: Database,
    tableName: string,
    whereStmt: string,
    initColNames: string[],
    values: any[],
  ): boolean {
    try {
      const retBool = true;
      const result = this.getReferences(mDB, tableName);
      const references = result.retRefs;
      const tableNameWithRefs = result.tableWithRefs;
      if (references.length <= 0) {
        return retBool;
      }
      if (tableName === tableNameWithRefs) {
        return retBool;
      }
      // Loop through references
      for (const ref of references) {
        // Extract the FOREIGN KEY constraint info from the ref statement
        const foreignKeyInfo = this.statUtil.extractForeignKeyInfo(ref);

        // Get the tableName of the references
        const refTable: string = foreignKeyInfo.tableName;
        if (refTable === '' || refTable !== tableName) {
          continue;
        }

        // Get the with ref column names
        const withRefsNames: string[] = foreignKeyInfo.forKeys;
        // Get the column names
        const colNames: string[] = foreignKeyInfo.refKeys;
        if (colNames.length !== withRefsNames.length) {
          const msg = 'findReferencesAndUpdate: mismatch length';
          throw new Error(msg);
        }

        const action: string = foreignKeyInfo.action;
        if (action === 'NO_ACTION') {
          continue;
        }
        const updTableName: string = tableNameWithRefs;
        const updColNames: string[] = withRefsNames;
        let results: { setStmt: string; uWhereStmt: string } = {
          uWhereStmt: '',
          setStmt: '',
        };
        if (!this.delUtil.checkValuesMatch(withRefsNames, initColNames)) {
          // Case: no match
          // Search for related items in tableName
          const result = this.searchForRelatedItems(
            mDB,
            updTableName,
            tableName,
            whereStmt,
            withRefsNames,
            colNames,
            values,
          );
          if (result.relatedItems.length === 0 && result.key.length <= 0) {
            continue;
          }

          if (updTableName !== tableName) {
            switch (action) {
              case 'RESTRICT':
                results = this.delUtil.upDateWhereForRestrict(result);
                break;
              case 'CASCADE':
                results = this.delUtil.upDateWhereForCascade(result);
                break;
              default:
                results = this.delUtil.upDateWhereForDefault(
                  withRefsNames,
                  result,
                );
                break;
            }
          }
        } else {
          throw new Error(
            'Not implemented. Please transfer your example to the maintener',
          );
        }

        if (results.setStmt.length > 0 && results.uWhereStmt.length > 0) {
          this.executeUpdateForDelete(
            mDB,
            updTableName,
            results.uWhereStmt,
            results.setStmt,
            updColNames,
            values,
          );
        }
      }
      return retBool;
    } catch (error) {
      const msg = error.message ? error.message : error;
      throw new Error(msg);
    }
  }
  /**
   * getReferences
   * @param db
   * @param tableName
   * @returns
   */
  public getReferences(
    db: Database,
    tableName: string,
  ): { tableWithRefs: string; retRefs: string[] } {
    const sqlStmt: string =
      'SELECT sql FROM sqlite_master ' +
      "WHERE sql LIKE('%FOREIGN KEY%') AND sql LIKE('%REFERENCES%') AND " +
      "sql LIKE('%" +
      tableName +
      "%') AND sql LIKE('%ON DELETE%');";
    try {
      const res: any[] = this.queryAll(db, sqlStmt, [], true);
      // get the reference's string(s)
      let retRefs: string[] = [];
      let tableWithRefs = '';
      if (res.length > 0) {
        const result = this.getRefs(res[0].sql);
        retRefs = result.foreignKeys;
        tableWithRefs = result.tableName;
      }
      return { tableWithRefs: tableWithRefs, retRefs: retRefs };
    } catch (err) {
      const error = err.message ? err.message : err;
      const msg = `getReferences: ${error}`;
      throw new Error(msg);
    }
  }
  /**
   * getRefs
   * @param sqlStatement
   * @returns
   */
  public getRefs(sqlStatement: string): {
    tableName: string;
    foreignKeys: string[];
  } {
    let tableName = '';
    const foreignKeys: string[] = [];
    const statement = this.statUtil.flattenMultilineString(sqlStatement);

    try {
      // Regular expression pattern to match the table name
      const tableNamePattern = /CREATE\s+TABLE\s+(\w+)\s+\(/;
      const tableNameMatch = statement.match(tableNamePattern);
      if (tableNameMatch) {
        tableName = tableNameMatch[1];
      }

      // Regular expression pattern to match the FOREIGN KEY constraints
      const foreignKeyPattern =
        /FOREIGN\s+KEY\s+\([^)]+\)\s+REFERENCES\s+(\w+)\s*\([^)]+\)\s+ON\s+DELETE\s+(CASCADE|RESTRICT|SET\s+DEFAULT|SET\s+NULL|NO\s+ACTION)/g;
      const foreignKeyMatches = statement.matchAll(foreignKeyPattern);
      for (const foreignKeyMatch of foreignKeyMatches) {
        const foreignKey = foreignKeyMatch[0];
        foreignKeys.push(foreignKey);
      }
    } catch (error) {
      const msg = `getRefs: Error creating regular expression: ${error}`;
      throw new Error(msg);
    }

    return { tableName, foreignKeys };
  }
  /**
   * executeUpdateForDelete
   * @param mDB
   * @param tableName
   * @param whereStmt
   * @param setStmt
   * @param colNames
   * @param values
   */
  public executeUpdateForDelete(
    mDB: any,
    tableName: string,
    whereStmt: string,
    setStmt: string,
    colNames: string[],
    values: any[],
  ): void {
    try {
      let lastId = -1;

      // Update sql_deleted for this references
      const stmt = `UPDATE ${tableName} SET ${setStmt} ${whereStmt}`;
      const selValues: any[] = [];
      if (values.length > 0) {
        const arrVal: string[] = whereStmt.split('?');
        if (arrVal[arrVal.length - 1] === ';') {
          arrVal.pop();
        }

        for (let jdx = 0; jdx < arrVal.length; jdx++) {
          for (const updVal of colNames) {
            const indices: number[] = this.statUtil.indicesOf(
              arrVal[jdx],
              updVal,
            );
            if (indices.length > 0) {
              selValues.push(values[jdx]);
            }
          }
        }
      }
      const retObj = this.runExec(mDB, stmt, selValues, 'no');
      lastId = retObj['lastInsertRowid'];

      if (lastId === -1) {
        const msg = `UPDATE sql_deleted failed for table: ${tableName}`;
        throw new Error(msg);
      }
    } catch (error) {
      const msg = error.message ? error.message : error;
      throw new Error(msg);
    }
  }
  /**
   * QueryAll
   * @param mDB
   * @param sql
   * @param values
   */
  public queryAll(
    mDB: any,
    sql: string,
    values: any[],
    isSQL92: boolean,
  ): any[] {
    const msg = 'QueryAll';
    try {
      let cSql = sql;
      if (!isSQL92) {
        cSql = this.cleanStatement(sql);
      }
      const stmt = mDB.prepare(cSql);

      if (!stmt.reader) {
        // statement doesn't returns data
        if (values != null && values.length > 0) {
          stmt.run(values);
        } else {
          stmt.run();
        }
        return [];
      }

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
  public queryOne(mDB: any, sql: string, values: any[], isSQL92: boolean): any {
    const msg = 'QueryOne';
    try {
      let cSql = sql;
      if (!isSQL92) {
        cSql = this.cleanStatement(sql);
      }
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
      const retQuery: any[] = this.queryAll(mDb, sql, [], true);
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
      const retQuery: any[] = this.queryAll(mDb, sql, [], true);
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
  public searchForRelatedItems(
    mDB: Database,
    updTableName: string,
    tableName: string,
    whStmt: string,
    withRefsNames: string[],
    colNames: string[],
    values: any[],
  ): { key: string; relatedItems: any[] } {
    const relatedItems: any[] = [];
    let key = '';
    const t1Names = withRefsNames.map(name => `t1.${name}`);
    const t2Names = colNames.map(name => `t2.${name}`);
    try {
      // addPrefix to the whereClause and swap colNames with  withRefsNames
      let whereClause = this.statUtil.addPrefixToWhereClause(
        whStmt,
        colNames,
        withRefsNames,
        't2.',
      );
      // look at the whereclause and change colNames with  withRefsNames
      if (whereClause.endsWith(';')) {
        whereClause = whereClause.slice(0, -1);
      }
      const resultString = t1Names
        .map((t1, index) => `${t1} = ${t2Names[index]}`)
        .join(' AND ');

      const sql =
        `SELECT t1.rowid FROM ${updTableName} t1 ` +
        `JOIN ${tableName} t2 ON ${resultString} ` +
        `WHERE ${whereClause} AND t1.sql_deleted = 0;`;
      const vals: any[] = this.queryAll(mDB, sql, values, true);
      if (vals.length > 0) {
        key = Object.keys(vals[0])[0];
        relatedItems.push(...vals);
      }
      return { key: key, relatedItems: relatedItems };
    } catch (error) {
      const msg = error.message ? error.message : error;
      throw new Error(msg);
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
      sql = this.sql92Utils.compatibleSQL92(sql);
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
