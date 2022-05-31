export class UtilsSQLite {
  //  public JSQlite: any;
  public SQLite3: any;

  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    //    this.JSQlite = require('@journeyapps/sqlcipher').verbose();
    this.SQLite3 = require('sqlite3');
  }
  /**
   * OpenOrCreateDatabase
   * @param pathDB
   * @param password
   */
  public async openOrCreateDatabase(
    pathDB: string /*,
    password: string,*/,
  ): Promise<any> {
    const msg = 'OpenOrCreateDatabase: ';
    // open sqlite3 database
    /*    const mDB: any = new this.JSQlite.Database(pathDB, {
      verbose: console.log,
    });
    */
    const mDB: any = new this.SQLite3.Database(pathDB, {
      verbose: console.log,
    });
    if (mDB != null) {
      try {
        await this.dbChanges(mDB);
      } catch (err) {
        return Promise.reject(msg + `dbChanges ${err}`);
      }

      try {
        /*        // set the password
        if (password.length > 0) {
          await this.setCipherPragma(mDB, password);
        }
*/
        // set Foreign Keys On
        await this.setForeignKeyConstraintsEnabled(mDB, true);

        // Check Version
        const curVersion: number = await this.getVersion(mDB);
        if (curVersion === 0) {
          await this.setVersion(mDB, 1);
        }
      } catch (err) {
        return Promise.reject(msg + `${err}`);
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
  /*
  public async setCipherPragma(mDB: any, password: string): Promise<void> {
    return new Promise((resolve, reject) => {
      mDB.serialize(() => {
        mDB.run('PRAGMA cipher_compatibility = 4');
        mDB.run(`PRAGMA key = '${password}'`, (err: any) => {
          if (err) {
            reject(new Error('SetForeignKey: ' + `${err.message}`));
          }
          resolve();
        });
      });
    });
  }
*/
  /**
   * SetForeignKeyConstraintsEnabled
   * @param mDB
   * @param toggle
   */
  public async setForeignKeyConstraintsEnabled(
    mDB: any,
    toggle: boolean,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      let key = 'OFF';
      if (toggle) {
        key = 'ON';
      }
      mDB.run(`PRAGMA foreign_keys = '${key}'`, (err: any) => {
        if (err) {
          reject(`SetForeignKey: ${err.message}`);
        }
        resolve();
      });
    });
  }
  /**
   * GetVersion
   * @param mDB
   */
  public async getVersion(mDB: any): Promise<number> {
    return new Promise((resolve, reject) => {
      let version = 0;
      const SELECT_VERSION = 'PRAGMA user_version;';
      mDB.get(SELECT_VERSION, [], (err: any, row: any) => {
        // process the row here
        if (err) {
          reject('getVersion failed: ' + `${err.message}`);
        } else {
          if (row == null) {
            version = 0;
          } else {
            const key: any = Object.keys(row)[0];
            version = row[key];
          }
          resolve(version);
        }
      });
    });
  }
  /**
   * SetVersion
   * @param mDB
   * @param version
   */
  public async setVersion(mDB: any, version: number): Promise<void> {
    return new Promise((resolve, reject) => {
      mDB.run(`PRAGMA user_version = ${version}`, (err: any) => {
        if (err) {
          reject('setVersion failed: ' + `${err.message}`);
        }
        resolve();
      });
    });
  }
  /**
   * ChangePassword
   * @param pathDB
   * @param password
   * @param newpassword
   */
  /*

  public async changePassword(
    pathDB: string,
    password: string,
    newpassword: string,
  ): Promise<void> {
    let mDB: any;
    try {
      mDB = await this.openOrCreateDatabase(pathDB, password);
      await this.pragmaReKey(mDB, password, newpassword);
    } catch (err) {
      return Promise.reject(err);
    } finally {
      mDB.close();
    }
  }
*/
  /**
   * PragmaReKey
   * @param mDB
   * @param password
   * @param newpassword
   */
  /*
  private async pragmaReKey(
    mDB: any,
    password: string,
    newpassword: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      mDB.serialize(() => {
        mDB.run('PRAGMA cipher_compatibility = 4');
        mDB.run(`PRAGMA key = '${password}'`);
        mDB.run(`PRAGMA rekey = '${newpassword}'`, (err: any) => {
          if (err) {
            reject(new Error('ChangePassword: ' + `${err.message}`));
          }
          resolve();
        });
      });
    });
  }
*/
  /**
   * BeginTransaction
   * @param db
   * @param isOpen
   */
  public async beginTransaction(db: any, isOpen: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      const msg = 'BeginTransaction: ';
      if (!isOpen) {
        return Promise.reject(`${msg}database not opened`);
      }
      const sql = 'BEGIN TRANSACTION;';
      db.run(sql, (err: any) => {
        if (err) {
          reject(`${msg}${err.message}`);
        }
        resolve();
      });
    });
  }
  /**
   * RollbackTransaction
   * @param db
   * @param isOpen
   */
  public async rollbackTransaction(db: any, isOpen: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      const msg = 'RollbackTransaction: ';
      if (!isOpen) {
        reject(`${msg}database not opened`);
      }
      const sql = 'ROLLBACK TRANSACTION;';
      db.run(sql, (err: any) => {
        if (err) {
          reject(`${msg}${err.message}`);
        }
        resolve();
      });
    });
  }
  /**
   * CommitTransaction
   * @param db
   * @param isOpen
   */
  public async commitTransaction(db: any, isOpen: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      const msg = 'CommitTransaction: ';
      if (!isOpen) {
        reject(`${msg}database not opened`);
      }
      const sql = 'COMMIT TRANSACTION;';
      db.run(sql, (err: any) => {
        if (err) {
          reject(`${msg}${err.message}`);
        }
        resolve();
      });
    });
  }
  /**
   * DbChanges
   * return total number of changes
   * @param db
   */
  public async dbChanges(db: any): Promise<number> {
    return new Promise((resolve, reject) => {
      const SELECT_CHANGE = 'SELECT total_changes()';
      let changes = 0;

      db.get(SELECT_CHANGE, [], (err: any, row: any) => {
        // process the row here
        if (err) {
          reject(`DbChanges failed: ${err.message}`);
        } else {
          if (row == null) {
            changes = 0;
          } else {
            const key: any = Object.keys(row)[0];
            changes = row[key];
          }
          resolve(changes);
        }
      });
    });
  }
  /**
   * GetLastId
   * @param db
   */
  public getLastId(db: any): Promise<number> {
    return new Promise((resolve, reject) => {
      const SELECT_LAST_ID = 'SELECT last_insert_rowid()';
      let lastId = -1;
      db.get(SELECT_LAST_ID, [], (err: any, row: any) => {
        // process the row here
        if (err) {
          reject(`GetLastId failed: ${err.message}`);
        } else {
          if (row == null) resolve(lastId);
          const key: any = Object.keys(row)[0];
          lastId = row[key];
          resolve(lastId);
        }
      });
    });
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
  ): Promise<number> {
    let changes = -1;
    let initChanges = -1;
    try {
      initChanges = await this.dbChanges(mDB);
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
          const trimStmt = stmt.trim().substring(0, 11).toUpperCase();
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

      await this.execDB(mDB, sqlStmt);
      changes = (await this.dbChanges(mDB)) - initChanges;
      return Promise.resolve(changes);
    } catch (err) {
      return Promise.reject(`Execute: ${err.message}`);
    }
  }
  /**
   * ExecDB
   * @param mDB
   * @param sql
   */
  private async execDB(mDB: any, sql: string): Promise<void> {
    return new Promise((resolve, reject) => {
      mDB.exec(sql, async (err: any) => {
        if (err) {
          reject(`Execute: ${err.message}: `);
        }
        resolve();
      });
    });
  }
  /**
   * ExecuteSet
   * @param db
   * @param set
   */
  public async executeSet(
    db: any,
    set: any[],
    fromJson: boolean,
  ): Promise<number> {
    let lastId = -1;
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
            lastId = await this.prepareRun(db, statement, mVal, fromJson);
          }
        } else {
          const mVal: any[] = await this.replaceUndefinedByNull(values);
          lastId = await this.prepareRun(db, statement, mVal, fromJson);
        }
      } catch (err) {
        return Promise.reject(`ExecuteSet: ${err}`);
      }
    }
    return Promise.resolve(lastId);
  }
  /**
   * PrepareRun
   * @param db
   * @param statement
   * @param values
   */
  public async prepareRun(
    db: any,
    statement: string,
    values: any[],
    fromJson: boolean,
  ): Promise<number> {
    const stmtType: string = statement
      .replace(/\n/g, '')
      .trim()
      .substring(0, 6)
      .toUpperCase();
    let sqlStmt: string = statement;
    let lastId = -1;
    try {
      if (!fromJson && stmtType === 'DELETE') {
        sqlStmt = await this.deleteSQL(db, statement, values);
      }
      let mVal: any[] = [];
      if (values != null && values.length > 0) {
        mVal = await this.replaceUndefinedByNull(values);
      }

      await this.runExec(db, sqlStmt, mVal);

      lastId = await this.getLastId(db);
      return Promise.resolve(lastId);

    } catch (err) {
        return Promise.reject(`PrepareRun: ${err}`);
    }
  }

  private async runExec(db: any, stmt: string, values: any[] = []): Promise<void> {
    return new Promise((resolve, reject) => {
      if (values != null && values.length > 0) {
        db.run(stmt, values, (err: any) => {
          if (err) {
             reject(err.message);
          } else {
            resolve();
          }
        });
      } else {
        db.exec(stmt, (err: any) => {
          if (err) {
            reject(err.message);
          } else {
            resolve();
          }
        });
      }
    });
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
   * @param db
   * @param statement
   * @param values
   * @returns
   */
  public async deleteSQL(
    db: any,
    statement: string,
    values: any[],
  ): Promise<string> {
    let sqlStmt: string = statement;
    try {
      const isLast: boolean = await this.isLastModified(db, true);
      const isDel: boolean = await this.isSqlDeleted(db, true);
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
        await this.findReferencesAndUpdate(db, tableName, clauseStmt, values);
      }
      return sqlStmt;
    } catch (err) {
      return Promise.reject(`DeleteSL: ${err}`);
    }
  }
  /**
   * findReferencesAndUpdate
   * @param db
   * @param tableName
   * @param whereStmt
   * @param values
   * @returns
   */
  public async findReferencesAndUpdate(
    db: any,
    tableName: string,
    whereStmt: string,
    values: any[],
  ): Promise<void> {
    try {
      const references = await this.getReferences(db, tableName);
      for (const refe of references) {
        // get the tableName of the reference
        const refTable: string = await this.getReferenceTableName(refe.sql);
        if (refTable.length <= 0) {
          continue;
        }

        // get the columnName
        const colName: string = await this.getReferenceColumnName(refe.sql);
        if (colName.length <= 0) {
          continue;
        }
        // update the where clause
        const uWhereStmt: string = await this.updateWhere(whereStmt, colName);
        if (uWhereStmt.length <= 0) {
          continue;
        }

        //update sql_deleted for this reference
        const stmt = `UPDATE ${refTable} SET sql_deleted = 1 ${uWhereStmt}`;
        if (values != null && values.length > 0) {
          const mVal: any[] = await this.replaceUndefinedByNull(values);
          await db.run(stmt, mVal);
        } else {
          await db.exec(stmt);
        }
        const lastId: number = await this.getLastId(db);
        if (lastId == -1) {
          const msg = `UPDATE sql_deleted failed for references table: ${refTable}`;
          return Promise.reject(new Error(`findReferencesAndUpdate: ${msg}`));
        }
      }
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(
        new Error(`findReferencesAndUpdate: ${err.message}`),
      );
    }
  }
  public async getReferenceTableName(refValue: string): Promise<string> {
    let tableName = '';
    if (
      refValue.length > 0 &&
      refValue.substring(0, 12).toLowerCase() === 'CREATE TABLE'.toLowerCase()
    ) {
      const oPar = refValue.indexOf('(');
      tableName = refValue.substring(13, oPar).trim();
    }
    return tableName;
  }
  public async getReferenceColumnName(refValue: string): Promise<string> {
    let colName = '';
    if (refValue.length > 0) {
      const index: number = refValue
        .toLowerCase()
        .indexOf('FOREIGN KEY'.toLowerCase());
      const stmt: string = refValue.substring(index + 12);
      const oPar: number = stmt.indexOf('(');
      const cPar: number = stmt.indexOf(')');
      colName = stmt.substring(oPar + 1, cPar).trim();
    }
    return colName;
  }
  public async updateWhere(whStmt: string, colName: string): Promise<string> {
    let whereStmt = '';
    if (whStmt.length > 0) {
      const index: number = whStmt.toLowerCase().indexOf('WHERE'.toLowerCase());
      const stmt: string = whStmt.substring(index + 6);
      const fEqual: number = stmt.indexOf('=');
      const whereColName: string = stmt.substring(0, fEqual).trim();
      whereStmt = whStmt.replace(whereColName, colName);
    }
    return whereStmt;
  }

  public async getReferences(db: any, tableName: string): Promise<any[]> {
    const sqlStmt: string =
      'SELECT sql FROM sqlite_master ' +
      "WHERE sql LIKE('%REFERENCES%') AND " +
      "sql LIKE('%" +
      tableName +
      "%') AND sql LIKE('%ON DELETE%');";
    try {
      const res: any[] = await this.queryAll(db, sqlStmt, []);
      return Promise.resolve(res);
    } catch (err) {
      return Promise.reject(new Error(`getReferences: ${err.message}`));
    }
  }

  /**
   * QueryAll
   * @param mDB
   * @param sql
   * @param values
   */
  public queryAll(mDB: any, sql: string, values: any[]): Promise<any[]> {
    return new Promise((resolve, reject) => {
      mDB.serialize(() => {
        mDB.all(sql, values, (err: any, rows: any[]) => {
          if (err) {
            reject(`QueryAll: ${err.message}`);
          } else {
            if (rows == null) {
              rows = [];
            }
            resolve(rows);
          }
        });
      });
    });
  }
  /**
   * GetTablesNames
   * @param mDb
   */
  public async getTablesNames(mDb: any): Promise<string[]> {
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
    } catch (err) {
      return Promise.reject(`getTablesNames: ${err}`);
    }
  }
  /**
   * GetViewsNames
   * @param mDb
   */
  public async getViewsNames(mDb: any): Promise<string[]> {
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
    } catch (err) {
      return Promise.reject(`getViewsNames: ${err}`);
    }
  }
  /**
   * isLastModified
   * @param db
   * @param isOpen
   */
  public async isLastModified(db: any, isOpen: boolean): Promise<boolean> {
    if (!isOpen) {
      return Promise.reject('isLastModified: database not opened');
    }
    try {
      const tableList: string[] = await this.getTablesNames(db);
      for (const table of tableList) {
        const tableNamesTypes: any = await this.getTableColumnNamesTypes(
          db,
          table,
        );
        const tableColumnNames: string[] = tableNamesTypes.names;
        if (tableColumnNames.includes('last_modified')) {
          return Promise.resolve(true);
        }
      }
    } catch (err) {
      return Promise.reject(`isLastModified: ${err}`);
    }
  }
  /**
   * isSqlDeleted
   * @param db
   * @param isOpen
   */
  public async isSqlDeleted(db: any, isOpen: boolean): Promise<boolean> {
    if (!isOpen) {
      return Promise.reject('isSqlDeleted: database not opened');
    }
    try {
      const tableList: string[] = await this.getTablesNames(db);
      for (const table of tableList) {
        const tableNamesTypes: any = await this.getTableColumnNamesTypes(
          db,
          table,
        );
        const tableColumnNames: string[] = tableNamesTypes.names;
        if (tableColumnNames.includes('sql_deleted')) {
          return Promise.resolve(true);
        }
      }
    } catch (err) {
      return Promise.reject(`isSqlDeleted: ${err}`);
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
    let resQuery: any[] = [];
    const retNames: string[] = [];
    const retTypes: string[] = [];
    const query = `PRAGMA table_info('${tableName}');`;
    try {
      resQuery = await this.queryAll(mDB, query, []);
      if (resQuery.length > 0) {
        for (const query of resQuery) {
          retNames.push(query.name);
          retTypes.push(query.type);
        }
      }
      return Promise.resolve({ names: retNames, types: retTypes });
    } catch (err) {
      return Promise.reject('GetTableColumnNamesTypes: ' + `${err}`);
    }
  }
}
