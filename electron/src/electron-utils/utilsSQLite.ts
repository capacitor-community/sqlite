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
        return Promise.reject(new Error(msg + `dbChanges ${err.message}`));
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
        return Promise.reject(new Error(msg + `${err.message}`));
      }
      return Promise.resolve(mDB);
    } else {
      return Promise.reject(new Error(msg + 'open database failed'));
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
  public async getVersion(mDB: any): Promise<number> {
    return new Promise((resolve, reject) => {
      let version = 0;
      const SELECT_VERSION = 'PRAGMA user_version;';
      mDB.get(SELECT_VERSION, [], (err: any, row: any) => {
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
  public async setVersion(mDB: any, version: number): Promise<void> {
    return new Promise((resolve, reject) => {
      mDB.run(`PRAGMA user_version = ${version}`, (err: any) => {
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
        return Promise.reject(new Error(`${msg}database not opened`));
      }
      const sql = 'BEGIN TRANSACTION;';
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
  public async rollbackTransaction(db: any, isOpen: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      const msg = 'RollbackTransaction: ';
      if (!isOpen) {
        reject(new Error(`${msg}database not opened`));
      }
      const sql = 'ROLLBACK TRANSACTION;';
      db.run(sql, (err: any) => {
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
  public async commitTransaction(db: any, isOpen: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      const msg = 'CommitTransaction: ';
      if (!isOpen) {
        reject(new Error(`${msg}database not opened`));
      }
      const sql = 'COMMIT TRANSACTION;';
      db.run(sql, (err: any) => {
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
  public async dbChanges(db: any): Promise<number> {
    return new Promise((resolve, reject) => {
      const SELECT_CHANGE = 'SELECT total_changes()';
      let changes = 0;

      db.get(SELECT_CHANGE, [], (err: any, row: any) => {
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
      const SELECT_LAST_ID = 'SELECT last_insert_rowid()';
      let lastId = -1;
      db.get(SELECT_LAST_ID, [], (err: any, row: any) => {
        // process the row here
        if (err) {
          let msg = 'GetLastId failed: ';
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
  public async execute(mDB: any, sql: string): Promise<number> {
    let changes = -1;
    let initChanges = -1;
    try {
      initChanges = await this.dbChanges(mDB);
      await this.execDB(mDB, sql);
      changes = (await this.dbChanges(mDB)) - initChanges;
      return Promise.resolve(changes);
    } catch (err) {
      return Promise.reject(new Error(`Execute: ${err.message}`));
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
          const msg: string = err.message;
          reject(new Error(`Execute: ${msg}: `));
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
  public async executeSet(db: any, set: any[]): Promise<number> {
    let lastId = -1;
    for (let i = 0; i < set.length; i++) {
      const statement = 'statement' in set[i] ? set[i].statement : null;
      const values =
        'values' in set[i] && set[i].values.length > 0 ? set[i].values : null;
      if (statement == null || values == null) {
        let msg = 'ExecuteSet: Error statement';
        msg += ` or values are null for index ${i}`;
        return Promise.reject(new Error(msg));
      }
      try {
        if (Array.isArray(values[0])) {
          for (const val of values) {
            lastId = await this.prepareRun(db, statement, val);
          }
        } else {
          lastId = await this.prepareRun(db, statement, values);
        }
      } catch (err) {
        return Promise.reject(new Error(`ExecuteSet: ${err.message}`));
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
  public prepareRun(
    db: any,
    statement: string,
    values: any[],
  ): Promise<number> {
    return new Promise((resolve, reject) => {
      let lastId = -1;
      db.run(statement, values, async (err: any) => {
        if (err) {
          let msg = `PrepareRun: run `;
          msg += `${err.message}`;
          reject(new Error(msg));
        } else {
          try {
            lastId = await this.getLastId(db);
            resolve(lastId);
          } catch (err) {
            let msg = `PrepareRun: lastId `;
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
  public queryAll(mDB: any, sql: string, values: any[]): Promise<any[]> {
    return new Promise((resolve, reject) => {
      mDB.serialize(() => {
        mDB.all(sql, values, (err: any, rows: any[]) => {
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
