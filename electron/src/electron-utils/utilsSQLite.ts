//1234567890123456789012345678901234567890123456789012345678901234567890
export class UtilsSQLite {
  private _JSQlite: any;
  constructor() {
    this._JSQlite = require('@journeyapps/sqlcipher').verbose();
  }
  /**
   * OpenOrCreateDatabase
   * @param pathDB
   * @param password
   */
  public openOrCreateDatabase(pathDB: string, password: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      let msg: string = 'OpenOrCreateDatabase: ';
      // open sqlite3 database
      const mDB: any = new this._JSQlite.Database(pathDB, {
        verbose: console.log,
      });
      if (mDB != null) {
        try {
          await this.dbChanges(mDB);
        } catch (err) {
          reject(new Error(msg + `dbChanges ${err.message}`));
        }
        // set the password
        if (password.length > 0) {
          try {
            await this.setCipherPragma(mDB, password);
          } catch (err) {
            reject(new Error(msg + `${err.message}`));
          }
        }
        resolve(mDB);
      } else {
        reject(new Error(msg + 'open database failed'));
      }
    });
  }
  /**
   * SetCipherPragma
   * @param mDB
   * @param password
   */
  public setCipherPragma(mDB: any, password: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      mDB.serialize(() => {
        mDB.run('PRAGMA cipher_compatibility = 4');
        mDB.run(`PRAGMA key = '${password}'`, (err: Error) => {
          if (err) {
            reject(new Error('SetForeignKey: ' + `${err.message}`));
          }
          resolve();
        });
      });
    });
  }
  /**
   * SetForeignKeyConstraintsEnabled
   * @param mDB
   * @param toggle
   */
  public setForeignKeyConstraintsEnabled(
    mDB: any,
    toggle: boolean,
  ): Promise<void> {
    return new Promise(async (resolve, reject) => {
      var key: String = 'OFF';
      if (toggle) {
        key = 'ON';
      }
      mDB.run(`PRAGMA foreign_keys = '${key}'`, (err: Error) => {
        if (err) {
          reject(new Error(`SetForeignKey: ${err.message}`));
        }
        resolve();
      });
    });
  }
  /**
   * GetVersion
   * @param mDB
   */
  public getVersion(mDB: any): Promise<number> {
    return new Promise(async (resolve, reject) => {
      let version: number = 0;
      const SELECT_VERSION: string = 'PRAGMA user_version;';
      mDB.get(SELECT_VERSION, (err: Error, row: any) => {
        // process the row here
        if (err) {
          reject(new Error('getVersion failed: ' + `${err.message}`));
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
  public setVersion(mDB: any, version: number): Promise<void> {
    return new Promise(async (resolve, reject) => {
      mDB.run(`PRAGMA user_version = ${version}`, (err: Error) => {
        if (err) {
          reject(new Error('setVersion failed: ' + `${err.message}`));
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
  public changePassword(
    pathDB: string,
    password: string,
    newpassword: string,
  ): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const mDB = await this.openOrCreateDatabase(pathDB, password);
        mDB.serialize(() => {
          mDB.run('PRAGMA cipher_compatibility = 4');
          mDB.run(`PRAGMA key = '${password}'`);
          mDB.run(`PRAGMA rekey = '${newpassword}'`, (err: Error) => {
            if (err) {
              mDB.close();
              reject(new Error('ChangePassword: ' + `${err.message}`));
            }
            mDB.close();
            resolve();
          });
        });
      } catch (err) {
        reject(new Error(`ChangePassword: ${err.message}`));
      }
    });
  }
  /**
   * BeginTransaction
   * @param db
   * @param isOpen
   */
  public beginTransaction(db: any, isOpen: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      const msg: string = 'BeginTransaction: ';
      if (!isOpen) {
        reject(new Error(`${msg}database not opened`));
      }
      const sql: string = 'BEGIN TRANSACTION;';
      db.run(sql, (err: Error) => {
        if (err) {
          reject(new Error(`${msg}${err.message}`));
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
  public rollbackTransaction(db: any, isOpen: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      const msg: string = 'RollbackTransaction: ';
      if (!isOpen) {
        reject(new Error(`${msg}database not opened`));
      }
      const sql: string = 'ROLLBACK TRANSACTION;';
      db.run(sql, (err: Error) => {
        if (err) {
          reject(new Error(`${msg}${err.message}`));
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
  public commitTransaction(db: any, isOpen: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      const msg: string = 'CommitTransaction: ';
      if (!isOpen) {
        reject(new Error(`${msg}database not opened`));
      }
      const sql: string = 'COMMIT TRANSACTION;';
      db.run(sql, (err: Error) => {
        if (err) {
          reject(new Error(`${msg}${err.message}`));
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
  public dbChanges(db: any): Promise<number> {
    return new Promise((resolve, reject) => {
      const SELECT_CHANGE: string = 'SELECT total_changes()';
      let changes: number = 0;

      db.get(SELECT_CHANGE, (err: Error, row: any) => {
        // process the row here
        if (err) {
          reject(new Error(`DbChanges failed: ${err.message}`));
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
      const SELECT_LAST_ID: string = 'SELECT last_insert_rowid()';
      let lastId: number = -1;
      db.get(SELECT_LAST_ID, (err: Error, row: any) => {
        // process the row here
        if (err) {
          let msg: string = 'GetLastId failed: ';
          msg += `${err.message}`;
          reject(new Error(msg));
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
  public execute(mDB: any, sql: string): Promise<number> {
    return new Promise(async (resolve, reject) => {
      let changes: number = -1;
      let initChanges: number = -1;
      try {
        initChanges = await this.dbChanges(mDB);
      } catch (err) {
        reject(new Error(`Execute: ${err.message}`));
      }
      mDB.exec(sql, async (err: Error) => {
        if (err) {
          const msg: string = err.message;
          reject(new Error(`Execute: ${msg}: `));
        }
        try {
          changes = (await this.dbChanges(mDB)) - initChanges;
        } catch (err) {
          reject(new Error(`ExecuteSQL: ${err.message}`));
        }
        resolve(changes);
      });
    });
  }
  /**
   * ExecuteSet
   * @param db
   * @param set
   */
  public executeSet(db: any, set: any[]): Promise<number> {
    return new Promise(async (resolve, reject) => {
      let lastId: number = -1;
      for (let i = 0; i < set.length; i++) {
        const statement = 'statement' in set[i] ? set[i].statement : null;
        const values =
          'values' in set[i] && set[i].values.length > 0 ? set[i].values : null;
        if (statement == null || values == null) {
          let msg: string = 'ExecuteSet: Error statement';
          msg += ` or values are null for index ${i}`;
          reject(new Error(msg));
          break;
        }
        try {
          if (Array.isArray(values[0])) {
            for (let j = 0; j < values.length; j++) {
              lastId = await this.prepareRun(db, statement, values[j]);
            }
          } else {
            lastId = await this.prepareRun(db, statement, values);
          }
        } catch (err) {
          reject(new Error(`ExecuteSet: ${err.message}`));
          break;
        }
      }
      resolve(lastId);
    });
  }
  /**
   * PrepareRun
   * @param db
   * @param statement
   * @param values
   */
  public prepareRun(
    db: any,
    statement: string,
    values: any[],
  ): Promise<number> {
    return new Promise((resolve, reject) => {
      let lastId: number = -1;
      db.run(statement, values, async (err: Error) => {
        if (err) {
          let msg: string = `PrepareRun: run `;
          msg += `${err.message}`;
          reject(new Error(msg));
        } else {
          try {
            lastId = await this.getLastId(db);
            resolve(lastId);
          } catch (err) {
            let msg: string = `PrepareRun: lastId `;
            msg += `${err.message}`;
            reject(new Error(msg));
          }
        }
      });
    });
  }
  /**
   * QueryAll
   * @param mDB
   * @param sql
   * @param values
   */
  public queryAll(mDB: any, sql: string, values: string[]): Promise<any[]> {
    return new Promise((resolve, reject) => {
      mDB.serialize(() => {
        mDB.all(sql, values, (err: Error, rows: any[]) => {
          if (err) {
            reject(new Error(`QueryAll: ${err.message}`));
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
}
