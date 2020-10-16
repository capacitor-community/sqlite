import { UtilsSQLite } from './UtilsSQLite';
import {
  JsonSQLite,
  JsonTable,
  JsonColumn,
  JsonIndex,
  capSQLiteVersionUpgrade,
} from '../definitions';
import { isJsonSQLite, isTable } from './JsonUtils';

export class DatabaseSQLiteHelper {
  public isOpen: boolean = false;
  NodeFs: any = null;

  private _databaseName: string;
  private _databaseVersion: number;
  private _upgradeStatements: Record<
    string,
    Record<number, capSQLiteVersionUpgrade>
  >;
  private _alterTables: Record<string, Array<string>> = {};
  private _commonColumns: Record<string, Array<string>> = {};
  //    private _encrypted: boolean;
  //    private _mode: string;
  //    private _secret: string = "";
  //    private _newsecret: string;
  private _utils: UtilsSQLite;

  constructor(
    dbName: string,
    dbVersion = 1,
    upgradeStatements: Record<string, Record<number, capSQLiteVersionUpgrade>>,

    /*, encrypted:boolean = false, mode:string = "no-encryption",
        secret:string = "",newsecret:string=""*/
  ) {
    this.NodeFs = require('fs');
    this._utils = new UtilsSQLite();
    this._databaseName = dbName;
    this._databaseVersion = dbVersion;
    this._upgradeStatements = upgradeStatements;
    //        this._encrypted = encrypted;
    //        this._mode = mode;
    //        this._secret = secret;
    //        this._newsecret = newsecret;
  }
  public async setup(): Promise<any> {
    await this._openDB();
  }

  private async _openDB() {
    const db = this._utils.connection(
      this._databaseName,
      false /*,this._secret*/,
    );
    if (db != null) {
      this.isOpen = true;
      // check if the database got a version
      let curVersion: number = await this.getDBVersion(db);
      console.log('openDB: curVersion ', curVersion);
      if (curVersion === -1 || curVersion === 0) {
        await this.updateDatabaseVersion(db, 1);
        curVersion = await this.getDBVersion(db);
        console.log(
          'openDB: After updateDatabaseVersion curVersion ',
          curVersion,
        );
      }
      // check if the database version is Ok
      console.log(
        'openDB: curVersion ' +
          curVersion +
          ' databaseVersion ' +
          this._databaseVersion,
      );
      console.log('this._databaseName ', this._databaseName);
      console.log('this._upgradeStatements ', this._upgradeStatements);
      if (curVersion !== this._databaseVersion) {
        // version not ok
        if (this._databaseVersion < curVersion) {
          this.isOpen = false;
          console.log(
            'openDB: Error Database version lower than current version',
          );
        } else if (
          Object.keys(this._upgradeStatements).length === 0 ||
          Object.keys(this._upgradeStatements[this._databaseName]).length === 0
        ) {
          this.isOpen = false;
          console.log(
            'openDB: Error No upgrade statements found for that database',
          );
        } else {
          // backup the current version
          const backup: boolean = await this.backupDB(this._databaseName);
          if (backup) {
            // upgrade version process
            let res: boolean = await this.onUpgrade(
              this._databaseName,
              db,
              curVersion,
              this._databaseVersion,
            );
            if (res) {
              this.isOpen = true;
            } else {
              this.isOpen = false;
              console.log(
                'openDB: Error Failed on database version ' + 'upgrading',
              );
              // restore the old version
              const restore: boolean = await this.restoreDB(this._databaseName);
              if (!restore) {
                console.log(
                  'openDB: Error Failed on database version ' + 'restoring',
                );
              }
            }
          } else {
            this.isOpen = false;
            console.log('openDB: Error Failed on database version ' + 'backup');
          }
          // delete the backup file
          const retDel = await this.deleteDB(`backup-${this._databaseName}`);
          if (!retDel) {
            console.log('openDB: Error Failed on deleting backup ');
          }
        }
      }
      db.close();
    } else {
      this.isOpen = false;
      console.log('openDB: Error Database connection failed');
    }
  }
  public createSyncTable(): Promise<any> {
    return new Promise(async resolve => {
      let retRes = { changes: -1 };
      const db = this._utils.connection(
        this._databaseName,
        false /*,this._secret*/,
      );
      if (db === null) {
        this.isOpen = false;
        console.log('exec: Error Database connection failed');
        resolve(retRes);
      }
      // check if the table has already been created
      const isExists = await this.isTableExists(db, 'sync_table');
      if (!isExists) {
        const date: number = Math.round(new Date().getTime() / 1000);
        const stmts = `
                BEGIN TRANSACTION;
                CREATE TABLE IF NOT EXISTS sync_table (
                    id INTEGER PRIMARY KEY NOT NULL,
                    sync_date INTEGER
                    );
                INSERT INTO sync_table (sync_date) VALUES ("${date}");
                COMMIT TRANSACTION;
                `;
        retRes = await this.execute(db, stmts);
      }
      db.close();
      resolve(retRes);
    });
  }
  public setSyncDate(syncDate: string): Promise<any> {
    return new Promise(async resolve => {
      let ret: boolean = false;
      const db = this._utils.connection(
        this._databaseName,
        false /*,this._secret*/,
      );
      if (db === null) {
        this.isOpen = false;
        console.log('exec: Error Database connection failed');
        resolve(ret);
      }
      const sDate: number = Math.round(new Date(syncDate).getTime() / 1000);
      let stmt: string = `UPDATE sync_table SET sync_date = ${sDate} `;
      stmt += `WHERE id = 1;`;
      const retRes = await this.execute(db, stmt);
      if (retRes.changes != -1) ret = true;
      db.close();
      resolve(ret);
    });
  }

  public close(databaseName: string): Promise<boolean> {
    return new Promise(resolve => {
      const db = this._utils.connection(databaseName, false /*,this._secret*/);
      if (db === null) {
        this.isOpen = false;
        console.log('close: Error Database connection failed');
        resolve(false);
      }
      this.isOpen = true;
      db.close((err: Error) => {
        if (err) {
          console.log('close: Error closing the database');
          resolve(false);
        } else {
          this.isOpen = false;
          resolve(true);
        }
      });
    });
  }
  public exec(statements: string): Promise<any> {
    return new Promise(async resolve => {
      let retRes = { changes: -1 };
      const db = this._utils.connection(
        this._databaseName,
        false /*,this._secret*/,
      );
      if (db === null) {
        this.isOpen = false;
        console.log('exec: Error Database connection failed');
        resolve(retRes);
      }
      retRes = await this.execute(db, statements);
      db.close();
      resolve(retRes);
    });
  }
  private execute(db: any, statements: string): Promise<any> {
    return new Promise(resolve => {
      let retRes = { changes: -1 };
      db.serialize(() => {
        db.exec(statements, async (err: Error) => {
          if (err) {
            console.log(`exec: Error Execute command failed : ${err.message}`);
            resolve(retRes);
          } else {
            const changes: number = await this.dbChanges(db);
            retRes = { changes: changes };
            resolve(retRes);
          }
        });
      });
    });
  }
  public execSet(set: Array<any>): Promise<any> {
    return new Promise(async resolve => {
      let lastId: number = -1;
      let retRes: any = { changes: -1, lastId: lastId };
      const db = this._utils.connection(
        this._databaseName,
        false /*,this._secret*/,
      );
      if (db === null) {
        this.isOpen = false;
        console.log('run: Error Database connection failed');
        resolve(retRes);
      }
      let retB: boolean = await this.beginTransaction(db);
      if (!retB) {
        db.close();
        resolve(retRes);
      }
      retRes = await this.executeSet(db, set);
      if (retRes.changes === -1) {
        console.log('executeSet: Error executeSet failed');
        db.close();
        return retRes;
      }

      retB = await this.endTransaction(db);
      if (!retB) {
        db.close();
        resolve(retRes);
      }
      const changes = await this.dbChanges(db);
      retRes.changes = changes;
      retRes.lastId = lastId;
      db.close();
      resolve(retRes);
    });
  }
  private async executeSet(db: any, set: Array<any>): Promise<any> {
    let lastId: number = -1;
    let retRes: any = { changes: -1, lastId: lastId };

    if (db === null) {
      this.isOpen = false;
      console.log('executeSet: Error Database connection failed');
      return retRes;
    }

    for (let i = 0; i < set.length; i++) {
      const statement = 'statement' in set[i] ? set[i].statement : null;
      const values =
        'values' in set[i] && set[i].values.length > 0 ? set[i].values : null;
      if (statement == null || values == null) {
        console.log('executeSet: Error statement or values are null');
        return retRes;
      }
      lastId = await this.prepare(db, statement, values);
      if (lastId === -1) {
        console.log('executeSet: Error return lastId= -1');
        return retRes;
      }
    }
    const changes = await this.dbChanges(db);
    retRes.changes = changes;
    retRes.lastId = lastId;
    return retRes;
  }
  public run(statement: string, values: Array<any>): Promise<any> {
    return new Promise(async resolve => {
      let lastId: number = -1;
      let retRes: any = { changes: -1, lastId: lastId };
      const db = this._utils.connection(
        this._databaseName,
        false /*,this._secret*/,
      );
      if (db === null) {
        this.isOpen = false;
        console.log('run: Error Database connection failed');
        resolve(retRes);
      }
      let retB: boolean = await this.beginTransaction(db);
      if (!retB) {
        db.close();
        resolve(retRes);
      }
      lastId = await this.prepare(db, statement, values);
      if (lastId === -1) {
        console.log('run: Error return lastId= -1');
        db.close();
        resolve(retRes);
      }
      retB = await this.endTransaction(db);
      if (!retB) {
        db.close();
        resolve(retRes);
      }
      const changes = await this.dbChanges(db);
      retRes.changes = changes;
      retRes.lastId = lastId;
      db.close();
      resolve(retRes);
    });
  }
  private prepare(
    db: any,
    statement: string,
    values: Array<any>,
  ): Promise<number> {
    return new Promise(async resolve => {
      let retRes: number = -1;

      if (values && values.length >= 1) {
        db.serialize(() => {
          const stmt = db.prepare(statement);
          stmt.run(values, async (err: Error) => {
            if (err) {
              console.log(
                `prepare: Error Prepare command failed : ${err.message}`,
              );
              resolve(retRes);
            } else {
              const lastId: number = await this.getLastId(db);
              if (lastId != -1) retRes = lastId;
              stmt.finalize();
              resolve(retRes);
            }
          });
        });
      } else {
        db.serialize(() => {
          db.run(statement, async (err: Error) => {
            if (err) {
              console.log(
                `prepare: Error Prepare command failed : ${err.message}`,
              );
              resolve(retRes);
            } else {
              const lastId: number = await this.getLastId(db);
              if (lastId != -1) retRes = lastId;
              resolve(retRes);
            }
          });
        });
      }
    });
  }
  public query(statement: string, values: Array<any>): Promise<Array<any>> {
    return new Promise(async resolve => {
      const db = this._utils.connection(
        this._databaseName,
        true /*,this._secret*/,
      );
      if (db === null) {
        this.isOpen = false;
        console.log('query: Error Database connection failed');
        resolve([]);
      }
      const retRows: Array<any> = await this.select(db, statement, values);
      db.close();
      resolve(retRows);
    });
  }

  private select(
    db: any,
    statement: string,
    values: Array<any>,
  ): Promise<Array<any>> {
    return new Promise(resolve => {
      let retRows: Array<any> = [];
      if (values && values.length >= 1) {
        db.serialize(() => {
          db.all(statement, values, (err: Error, rows: Array<any>) => {
            if (err) {
              console.log(
                `select: Error Query command failed : ${err.message}`,
              );
              resolve(retRows);
            } else {
              retRows = rows;
              resolve(retRows);
            }
          });
        });
      } else {
        db.serialize(() => {
          db.all(statement, (err: Error, rows: Array<any>) => {
            if (err) {
              console.log(
                `select: Error Query command failed : ${err.message}`,
              );
              resolve(retRows);
            } else {
              retRows = rows;
              resolve(retRows);
            }
          });
        });
      }
    });
  }
  public deleteDB(dbName: string): Promise<boolean> {
    return new Promise(resolve => {
      let ret: boolean = false;
      const dbPath = this._utils.getDBPath(dbName);
      if (dbPath.length > 0) {
        try {
          this.NodeFs.unlinkSync(dbPath);
          //file removed
          ret = true;
        } catch (e) {
          console.log('Error: in deleteDB');
        }
      }
      resolve(ret);
    });
  }

  public importJson(jsonData: JsonSQLite): Promise<any> {
    return new Promise(async resolve => {
      let changes: number = -1;
      // create the database schema
      changes = await this.createDatabaseSchema(jsonData);
      if (changes != -1) {
        // create the tables data
        changes = await this.createTableData(jsonData);
      }
      resolve({ changes: changes });
    });
  }
  public exportJson(mode: string): Promise<any> {
    return new Promise(async resolve => {
      let retJson: JsonSQLite = {} as JsonSQLite;
      let success: boolean = false;
      retJson.database = this._databaseName.slice(0, -9);
      retJson.version = this._databaseVersion;
      retJson.encrypted = false;
      retJson.mode = mode;
      success = await this.createJsonTables(retJson);
      if (success) {
        const isValid = isJsonSQLite(retJson);
        if (isValid) {
          resolve(retJson);
        } else {
          resolve({});
        }
      } else {
        resolve({});
      }
    });
  }

  private createDatabaseSchema(jsonData: JsonSQLite): Promise<number> {
    return new Promise(async resolve => {
      let changes: number = -1;
      let isSchema: boolean = false;
      let isIndexes: boolean = false;
      const version: number = jsonData.version;
      // set Foreign Keys PRAGMA
      let pragmas: string = 'PRAGMA foreign_keys = ON;';
      let pchanges: number = await this.exec(pragmas);

      if (pchanges === -1) resolve(-1);
      // DROP ALL when mode="full"
      if (jsonData.mode === 'full') {
        // set User Version PRAGMA
        let pragmas: string = `PRAGMA user_version = ${version};`;
        pchanges = await this.exec(pragmas);
        if (pchanges === -1) resolve(-1);
        await this.dropAll();
      }
      // create the database schema
      let statements: Array<string> = [];
      statements.push('BEGIN TRANSACTION;');
      for (let i: number = 0; i < jsonData.tables.length; i++) {
        if (
          jsonData.tables[i].schema != null &&
          jsonData.tables[i].schema!.length >= 1
        ) {
          isSchema = true;
          // create table
          statements.push(
            `CREATE TABLE IF NOT EXISTS ${jsonData.tables[i].name} (`,
          );
          for (let j: number = 0; j < jsonData.tables[i].schema!.length; j++) {
            if (j === jsonData.tables[i].schema!.length - 1) {
              if (jsonData.tables[i].schema![j].column) {
                statements.push(
                  `${jsonData.tables[i].schema![j].column} ${
                    jsonData.tables[i].schema![j].value
                  }`,
                );
              } else if (jsonData.tables[i].schema![j].foreignkey) {
                statements.push(
                  `FOREIGN KEY (${jsonData.tables[i].schema![j].foreignkey}) ${
                    jsonData.tables[i].schema![j].value
                  }`,
                );
              }
            } else {
              if (jsonData.tables[i].schema![j].column) {
                statements.push(
                  `${jsonData.tables[i].schema![j].column} ${
                    jsonData.tables[i].schema![j].value
                  },`,
                );
              } else if (jsonData.tables[i].schema![j].foreignkey) {
                statements.push(
                  `FOREIGN KEY (${jsonData.tables[i].schema![j].foreignkey}) ${
                    jsonData.tables[i].schema![j].value
                  },`,
                );
              }
            }
          }
          statements.push(');');
          // create trigger last_modified associated with the table
          let trig: string = 'CREATE TRIGGER IF NOT EXISTS ';
          trig += `${jsonData.tables[i].name}_trigger_last_modified `;
          trig += `AFTER UPDATE ON ${jsonData.tables[i].name} `;
          trig += 'FOR EACH ROW WHEN NEW.last_modified <= ';
          trig += 'OLD.last_modified BEGIN UPDATE ';
          trig += `${jsonData.tables[i].name} SET last_modified = `;
          trig += "(strftime('%s','now')) WHERE id=OLD.id; END;";
          statements.push(trig);
        }
        if (
          jsonData.tables[i].indexes != null &&
          jsonData.tables[i].indexes!.length >= 1
        ) {
          isIndexes = true;
          for (let j: number = 0; j < jsonData.tables[i].indexes!.length; j++) {
            statements.push(
              `CREATE INDEX IF NOT EXISTS ${
                jsonData.tables[i].indexes![j].name
              } ON ${jsonData.tables[i].name} (${
                jsonData.tables[i].indexes![j].column
              });`,
            );
          }
        }
      }
      if (statements.length > 1) {
        statements.push('COMMIT TRANSACTION;');

        const schemaStmt: string = statements.join('\n');
        changes = await this.exec(schemaStmt);
      } else if (!isSchema && !isIndexes) {
        changes = 0;
      }

      resolve(changes);
    });
  }
  private createTableData(jsonData: JsonSQLite): Promise<number> {
    return new Promise(async resolve => {
      let success: boolean = true;
      let changes: number = -1;
      let isValue: boolean = false;
      const db = this._utils.connection(
        this._databaseName,
        false /*,this._secret*/,
      );
      if (db === null) {
        this.isOpen = false;
        console.log('createTableData: Error Database connection failed');
        resolve(changes);
      }
      let retB: boolean = await this.beginTransaction(db);
      if (!retB) {
        db.close();
        resolve(changes);
      }

      // Create the table's data
      for (let i: number = 0; i < jsonData.tables.length; i++) {
        if (
          jsonData.tables[i].values != null &&
          jsonData.tables[i].values!.length >= 1
        ) {
          // Check if the table exists
          const tableExists = await this.isTableExists(
            db,
            jsonData.tables[i].name,
          );
          if (!tableExists) {
            console.log(
              `Error: Table ${jsonData.tables[i].name} does not exist`,
            );
            success = false;
            break;
          } else {
            // Get the column names and types
            const tableNamesTypes: any = await this.getTableColumnNamesTypes(
              db,
              jsonData.tables[i].name,
            );
            const tableColumnTypes: Array<string> = tableNamesTypes.types;
            const tableColumnNames: Array<string> = tableNamesTypes.names;
            if (tableColumnTypes.length === 0) {
              console.log(
                `Error: Table ${jsonData.tables[i].name} ` +
                  'info does not exist',
              );
              success = false;
              break;
            } else {
              isValue = true;
              // Loop on Table Values
              for (
                let j: number = 0;
                j < jsonData.tables[i].values!.length;
                j++
              ) {
                // Check the row number of columns
                if (
                  jsonData.tables[i].values![j].length !=
                  tableColumnTypes.length
                ) {
                  console.log(
                    `Error: Table ${jsonData.tables[i].name} ` +
                      `values row ${j} not correct length`,
                  );
                  success = false;
                  break;
                }
                // Check the column's type before proceeding
                const isColumnTypes: boolean = await this.checkColumnTypes(
                  tableColumnTypes,
                  jsonData.tables[i].values![j],
                );
                if (!isColumnTypes) {
                  console.log(
                    `Error: Table ${jsonData.tables[i].name} ` +
                      `values row ${j} not correct types`,
                  );
                  success = false;
                  break;
                }
                const retisIdExists: boolean = await this.isIdExists(
                  db,
                  jsonData.tables[i].name,
                  tableColumnNames[0],
                  jsonData.tables[i].values![j][0],
                );
                let stmt: string;
                if (
                  jsonData.mode === 'full' ||
                  (jsonData.mode === 'partial' && !retisIdExists)
                ) {
                  // Insert
                  const nameString: string = tableColumnNames.join();
                  const questionMarkString = await this.createQuestionMarkString(
                    tableColumnNames.length,
                  );
                  stmt =
                    `INSERT INTO ${jsonData.tables[i].name} (` +
                    `${nameString}) VALUES (`;
                  stmt += `${questionMarkString});`;
                } else {
                  // Update
                  const setString: string = await this.setNameForUpdate(
                    tableColumnNames,
                  );
                  if (setString.length === 0) {
                    console.log(
                      `Error: Table ${jsonData.tables[i].name} ` +
                        `values row ${j} not set to String`,
                    );
                    success = false;
                    break;
                  }
                  stmt =
                    `UPDATE ${jsonData.tables[i].name} SET ` +
                    `${setString} WHERE ${tableColumnNames[0]} = ` +
                    `${jsonData.tables[i].values![j][0]};`;
                }
                const lastId: number = await this.prepare(
                  db,
                  stmt,
                  jsonData.tables[i].values![j],
                );
                if (lastId === -1) {
                  console.log('run: Error return lastId= -1');
                  success = false;
                  break;
                }
              }
            }
          }
        }
      }

      if (success) {
        retB = await this.endTransaction(db);
        if (!retB) {
          db.close();
          resolve(changes);
        }
        changes = await this.dbChanges(db);
      } else {
        if (!isValue) changes = 0;
      }
      db.close();
      resolve(changes);
    });
  }
  private isTableExists(db: any, tableName: string): Promise<boolean> {
    return new Promise(async resolve => {
      // Check if the table exists
      let ret: boolean = false;
      const query: string =
        `SELECT name FROM sqlite_master WHERE ` +
        `type='table' AND name='${tableName}';`;
      const resQuery: Array<any> = await this.select(db, query, []);
      if (resQuery.length > 0) ret = true;
      resolve(ret);
    });
  }
  private getTableColumnNamesTypes(db: any, tableName: string): Promise<any> {
    return new Promise(async resolve => {
      let retTypes: Array<string> = [];
      let retNames: Array<string> = [];
      const query = `PRAGMA table_info(${tableName});`;
      const resQuery: Array<any> = await this.select(db, query, []);
      if (resQuery.length > 0) {
        for (let i: number = 0; i < resQuery.length; i++) {
          retNames.push(resQuery[i].name);
          retTypes.push(resQuery[i].type);
        }
      }
      resolve({ names: retNames, types: retTypes });
    });
  }
  private createQuestionMarkString(length: number): Promise<string> {
    return new Promise(resolve => {
      var retString: string = '';
      for (let i: number = 0; i < length; i++) {
        retString += '?,';
      }
      if (retString.length > 1) retString = retString.slice(0, -1);
      resolve(retString);
    });
  }
  private setNameForUpdate(names: String[]): Promise<string> {
    return new Promise(resolve => {
      var retString: string = '';
      for (let i: number = 0; i < names.length; i++) {
        retString += `${names[i]} = ? ,`;
      }
      if (retString.length > 1) retString = retString.slice(0, -1);
      resolve(retString);
    });
  }
  private checkColumnTypes(
    tableTypes: Array<any>,
    rowValues: Array<any>,
  ): Promise<boolean> {
    return new Promise(async resolve => {
      let isType: boolean = true;
      for (let i: number = 0; i < rowValues.length; i++) {
        if (rowValues[i].toString().toUpperCase() != 'NULL') {
          isType = await this.isType(tableTypes[i], rowValues[i]);
          if (!isType) break;
        }
      }
      resolve(isType);
    });
  }
  private isType(type: string, value: any): Promise<boolean> {
    return new Promise(resolve => {
      let ret: boolean = false;
      if (type === 'NULL' && typeof value === 'object') ret = true;
      if (type === 'TEXT' && typeof value === 'string') ret = true;
      if (type === 'INTEGER' && typeof value === 'number') ret = true;
      if (type === 'REAL' && typeof value === 'number') ret = true;
      if (type === 'BLOB' && typeof value === 'string') ret = true;
      resolve(ret);
    });
  }
  private isIdExists(
    db: any,
    dbName: string,
    firstColumnName: string,
    key: any,
  ): Promise<boolean> {
    return new Promise(async resolve => {
      let ret: boolean = false;
      const query: string =
        `SELECT ${firstColumnName} FROM ` +
        `${dbName} WHERE ${firstColumnName} = ${key};`;
      const resQuery: Array<any> = await this.select(db, query, []);
      if (resQuery.length === 1) ret = true;
      resolve(ret);
    });
  }
  private dbChanges(db: any): Promise<number> {
    return new Promise(resolve => {
      const SELECT_CHANGE: string = 'SELECT total_changes()';
      let ret: number = -1;

      db.get(SELECT_CHANGE, (err: Error, row: any) => {
        // process the row here
        if (err) {
          console.log(`"Error: dbChanges failed: " : ${err.message}`);
          resolve(ret);
        } else {
          const key: any = Object.keys(row)[0];
          const changes: number = row[key];
          resolve(changes);
        }
      });
    });
  }
  private getLastId(db: any): Promise<number> {
    return new Promise(resolve => {
      const SELECT_LAST_ID: string = 'SELECT last_insert_rowid()';
      let ret: number = -1;
      db.get(SELECT_LAST_ID, (err: Error, row: any) => {
        // process the row here
        if (err) {
          console.log(`"Error: getLastId failed: " : ${err.message}`);
          resolve(ret);
        } else {
          const key: any = Object.keys(row)[0];
          const lastId: number = row[key];
          resolve(lastId);
        }
      });
    });
  }
  private beginTransaction(db: any): Promise<boolean> {
    return new Promise(resolve => {
      const stmt = 'BEGIN TRANSACTION';
      db.exec(stmt, (err: Error) => {
        if (err) {
          console.log(
            `exec: Error Begin Transaction failed : ` + `${err.message}`,
          );
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }
  private endTransaction(db: any): Promise<boolean> {
    return new Promise(resolve => {
      const stmt = 'COMMIT TRANSACTION';
      db.exec(stmt, (err: Error) => {
        if (err) {
          console.log(
            `exec: Error End Transaction failed : ` + `${err.message}`,
          );
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }
  private createJsonTables(retJson: JsonSQLite): Promise<boolean> {
    return new Promise(async resolve => {
      let success: boolean = true;
      const databaseName: string = `${retJson.database}SQLite.db`;
      const db = this._utils.connection(databaseName, false /*,this._secret*/);
      if (db === null) {
        this.isOpen = false;
        console.log('createJsonTables: ' + 'Error Database connection failed');
        resolve(false);
      }
      // get the table's names
      let stmt: string =
        "SELECT name,sql FROM sqlite_master WHERE type = 'table' ";
      stmt += "AND name NOT LIKE 'sqlite_%' ";
      stmt += "AND name NOT LIKE 'sync_table';";
      let tables: Array<any> = await this.select(db, stmt, []);
      if (tables.length === 0) {
        console.log('createJsonTables: ' + "Error get table's names failed");
        resolve(false);
      }
      let modTables: any = {};
      let syncDate: number = 0;
      if (retJson.mode === 'partial') {
        syncDate = await this.getSyncDate(db);
        if (syncDate != -1) {
          // take the tables which have been modified or
          // created since last sync
          modTables = await this.getTableModified(db, tables, syncDate);
        } else {
          console.log('createJsonTables: ' + 'Error did not find a sync_date');
          resolve(false);
        }
      }
      let jsonTables: Array<JsonTable> = [];
      for (let i: number = 0; i < tables.length; i++) {
        if (
          retJson.mode === 'partial' &&
          (Object.keys(modTables).length === 0 ||
            Object.keys(modTables).indexOf(tables[i].name) === -1 ||
            modTables[tables[i].name] == 'No')
        ) {
          continue;
        }
        let table: JsonTable = {} as JsonTable;
        let isSchema: boolean = false;
        let isIndexes: boolean = false;
        let isValues: boolean = false;
        table.name = tables[i].name;
        if (
          retJson.mode === 'full' ||
          (retJson.mode === 'partial' && modTables[table.name] === 'Create')
        ) {
          // create the schema
          let schema: Array<JsonColumn> = [];
          // take the substring between parenthesis

          let openPar: number = tables[i].sql.indexOf('(');
          let closePar: number = tables[i].sql.lastIndexOf(')');
          let sstr: String = tables[i].sql.substring(openPar + 1, closePar);
          let sch: Array<string> = sstr.replace(/\n/g, '').split(',');
          for (let j: number = 0; j < sch.length; j++) {
            const rstr = sch[j].trim();
            let idx = rstr.indexOf(' ');
            //find the index of the first
            let row: Array<string> = [rstr.slice(0, idx), rstr.slice(idx + 1)];
            if (row.length != 2) resolve(false);
            if (row[0].toUpperCase() != 'FOREIGN') {
              schema.push({ column: row[0], value: row[1] });
            } else {
              const oPar: number = rstr.indexOf('(');
              const cPar: number = rstr.indexOf(')');
              row = [rstr.slice(oPar + 1, cPar), rstr.slice(cPar + 2)];
              if (row.length != 2) resolve(false);
              schema.push({ foreignkey: row[0], value: row[1] });
            }
          }
          table.schema = schema;
          isSchema = true;

          // create the indexes
          stmt = 'SELECT name,tbl_name,sql FROM sqlite_master WHERE ';
          stmt += `type = 'index' AND tbl_name = '${table.name}' `;
          stmt += `AND sql NOTNULL;`;
          const retIndexes: Array<any> = await this.select(db, stmt, []);
          if (retIndexes.length > 0) {
            let indexes: Array<JsonIndex> = [];
            for (let j: number = 0; j < retIndexes.length; j++) {
              const keys: Array<string> = Object.keys(retIndexes[j]);
              if (keys.length === 3) {
                if (retIndexes[j]['tbl_name'] === table.name) {
                  const sql: string = retIndexes[j]['sql'];
                  const oPar: number = sql.lastIndexOf('(');
                  const cPar: number = sql.lastIndexOf(')');
                  indexes.push({
                    name: retIndexes[j]['name'],
                    column: sql.slice(oPar + 1, cPar),
                  });
                } else {
                  console.log(
                    'createJsonTables: ' +
                      "Error indexes table name doesn't match",
                  );
                  success = false;
                  break;
                }
              } else {
                console.log('createJsonTables: ' + 'Error in creating indexes');
                success = false;
                break;
              }
            }
            table.indexes = indexes;
            isIndexes = true;
          }
        }

        const tableNamesTypes: any = await this.getTableColumnNamesTypes(
          db,
          table.name,
        );
        const rowNames: Array<string> = tableNamesTypes.names;
        // create the data
        if (
          retJson.mode === 'full' ||
          (retJson.mode === 'partial' && modTables[table.name] === 'Create')
        ) {
          stmt = `SELECT * FROM ${table.name};`;
        } else {
          if (syncDate != 0) {
            stmt =
              `SELECT * FROM ${table.name} ` +
              `WHERE last_modified > ${syncDate};`;
          } else {
            stmt = `SELECT * FROM ${table.name};`;
          }
        }
        const retValues: Array<any> = await this.select(db, stmt, []);
        let values: Array<Array<any>> = [];
        for (let j: number = 0; j < retValues.length; j++) {
          let row: Array<any> = [];
          for (let k: number = 0; k < rowNames.length; k++) {
            if (retValues[j][rowNames[k]] != null) {
              row.push(retValues[j][rowNames[k]]);
            } else {
              row.push('NULL');
            }
          }
          values.push(row);
        }
        table.values = values;
        isValues = true;
        if (
          Object.keys(table).length < 1 ||
          !isTable(table) ||
          (!isSchema && !isIndexes && !isValues)
        ) {
          console.log('createJsonTables: ' + 'Error table is not a jsonTable');
          success = false;
          break;
        }
        jsonTables.push(table);
      }
      if (!success) {
        retJson = {} as JsonSQLite;
      } else {
        retJson.tables = jsonTables;
      }
      resolve(success);
    });
  }

  private getTableModified(
    db: any,
    tables: Array<any>,
    syncDate: number,
  ): Promise<any> {
    return new Promise(async resolve => {
      let retModified: any = {};
      for (let i: number = 0; i < tables.length; i++) {
        let mode: string;
        // get total count of the table
        let stmt: string = `SELECT count(*) FROM ${tables[i].name};`;
        let retQuery: Array<any> = await this.select(db, stmt, []);
        if (retQuery.length != 1) break;
        const totalCount: number = retQuery[0]['count(*)'];
        // get total count of modified since last sync
        stmt =
          `SELECT count(*) FROM ${tables[i].name} ` +
          `WHERE last_modified > ${syncDate};`;
        retQuery = await this.select(db, stmt, []);
        if (retQuery.length != 1) break;
        const totalModifiedCount: number = retQuery[0]['count(*)'];

        if (totalModifiedCount === 0) {
          mode = 'No';
        } else if (totalCount === totalModifiedCount) {
          mode = 'Create';
        } else {
          mode = 'Modified';
        }
        const key: string = tables[i].name;
        retModified[key] = mode;
        if (i === tables.length - 1) resolve(retModified);
      }
      resolve(retModified);
    });
  }
  private getSyncDate(db: any): Promise<number> {
    return new Promise(async resolve => {
      let ret: number = -1;
      // get the last sync date
      let stmt = `SELECT sync_date FROM sync_table;`;
      let retQuery: Array<any> = await this.select(db, stmt, []);
      if (retQuery.length === 1) {
        const syncDate: number = retQuery[0]['sync_date'];
        if (syncDate > 0) ret = syncDate;
      }
      resolve(ret);
    });
  }
  private getDBVersion(db: any): Promise<number> {
    return new Promise(async resolve => {
      const query = `PRAGMA user_version;`;
      const resQuery: Array<any> = await this.select(db, query, []);
      if (resQuery.length > 0) {
        return resolve(resQuery[0].user_version);
      } else {
        return resolve(-1);
      }
    });
  }
  private async updateDatabaseVersion(
    db: any,
    newVersion: number,
  ): Promise<number> {
    let pragmas: string = `
      PRAGMA user_version = ${newVersion};
    `;
    const pchanges: number = await this.execute(db, pragmas);
    return pchanges;
  }
  private async onUpgrade(
    dbName: string,
    db: any,
    currentVersion: number,
    targetVersion: number,
  ): Promise<boolean> {
    /**
     * When upgrade statements for current database are missing
     */
    if (!this._upgradeStatements[dbName]) {
      console.log(
        `Error PRAGMA user_version failed : Version mismatch! Expec
        ted Version ${targetVersion} found Version ${currentVersion}. Mi
        ssing Upgrade Statements for Database '${dbName}' Vers
        ion ${currentVersion}.`,
      );
      return false;
    } else if (!this._upgradeStatements[dbName][currentVersion]) {
      /**
       * When upgrade statements for current version are missing
       */
      console.log(
        `Error PRAGMA user_version failed : Version mismatch! Expected V
        ersion ${targetVersion} found Version ${currentVersion}. Miss
        ing Upgrade Statements for Database '${dbName}' Versi
        on ${currentVersion}.`,
      );
      return false;
    }

    const upgrade = this._upgradeStatements[dbName][currentVersion];

    /**
     * When the version after an upgrade would be greater
     * than the targeted version
     */
    if (targetVersion < upgrade.toVersion) {
      console.log(
        `Error PRAGMA user_version failed : Version mismatch! Expect
        ed Version ${targetVersion} found Version ${currentVersion}. Up
        grade Statement would upgrade to version ${upgrade.toVersion}, b
        ut target version is ${targetVersion}.`,
      );
      return false;
    }
    // set PRAGMA
    let pragmas: string = `
      PRAGMA foreign_keys = OFF;            
    `;
    let pchanges: number = await this.execute(db, pragmas);
    if (pchanges === -1) {
      console.log('onUpgrade: Error in setting ' + 'PRAGMA foreign_keys = OFF');
      return false;
    }

    // Here we assume all the tables schema are given in
    // the upgrade statement
    if (upgrade.statement) {
      // -> backup all existing tables  "tableName" in "temp_tableName"

      let retB: boolean = await this.backupTables(db);
      if (!retB) {
        console.log('onUpgrade Error in backuping existing tables');
        return false;
      }

      // -> Drop all Indexes
      retB = await this.dropIndexes(db);
      if (!retB) {
        console.log('onUpgrade Error in dropping indexes');
        return false;
      }

      // -> Drop all Triggers
      retB = await this.dropTriggers(db);
      if (!retB) {
        console.log('onUpgrade Error in dropping triggers');
        return false;
      }

      // -> Create new tables from upgrade.statement
      const result = await this.execute(db, upgrade.statement);

      if (result.changes < 0) {
        console.log(`onUpgrade Error in creating tables `);
        return false;
      }
      // -> Create the list of table's common fields
      retB = await this.findCommonColumns(db);
      if (!retB) {
        console.log('onUpgrade Error in findCommonColumns');
        return false;
      }

      // -> Update the new table's data from old table's data
      retB = await this.updateNewTablesData(db);
      if (!retB) {
        console.log('onUpgrade Error in updateNewTablesData');
        return false;
      }
      // -> Drop _temp_tables
      retB = await this.dropTempTables(db);
      if (!retB) {
        console.log('onUpgrade Error in dropTempTables');
        return false;
      }
      // -> Do some cleanup
      this._alterTables = {};
      this._commonColumns = {};

      // here we assume that the Set contains only
      //  - the data for new tables as INSERT statements
      //  - the data for new columns in existing tables
      //    as UPDATE statements

      if (upgrade.set) {
        // -> load new data
        const result = await this.executeSet(db, upgrade.set);

        if (result.changes < 0) {
          console.log('onUpgrade Error executeSet Failed');
          return false;
        }
      }
      // -> update database version
      await this.updateDatabaseVersion(db, upgrade.toVersion);

      // -> update syncDate if any
      const isExists = await this.isTableExists(db, 'sync_table');
      if (isExists) {
        const sDate: number = Math.round(new Date().getTime() / 1000);
        let stmt: string = `UPDATE sync_table SET sync_date = ${sDate} `;
        stmt += `WHERE id = 1;`;
        const retRes = await this.execute(db, stmt);
        if (retRes.changes === -1) {
          let message: string = 'onUpgrade: Update sync_date failed ';
          console.log(message);
          return false;
        }
      }
    } else {
      let message: string = 'onUpgrade: No statement given in ';
      message += 'upgradeStatements object';
      console.log(message);
      return false;
    }
    // set PRAGMA
    pragmas = `
      PRAGMA foreign_keys = ON;            
    `;
    pchanges = await this.execute(db, pragmas);
    if (pchanges === -1) {
      console.log('onUpgrade: Error in setting ' + 'PRAGMA foreign_keys = ON');
      return false;
    }
    return true;
  }

  private async dropTempTables(db: any): Promise<boolean> {
    return new Promise(async resolve => {
      const tempTables: Array<string> = Object.keys(this._alterTables);
      const statements: Array<string> = [];
      for (let i: number = 0; i < tempTables.length; i++) {
        const stmt = `DROP TABLE IF EXISTS _temp_${tempTables[i]};`;
        statements.push(stmt);
      }
      const pchanges: any = await this.execute(db, statements.join('\n'));
      if (pchanges.changes === -1) {
        console.log('dropTempTables: Error execute failed');
        resolve(false);
      }
      resolve(true);
    });
  }

  private async backupTables(db: any): Promise<boolean> {
    return new Promise(async resolve => {
      const tables: Array<any> = await this.getTablesNames(db);
      if (tables.length === 0) {
        console.log("backupTables: Error get table's names failed");
        resolve(false);
      }
      for (let i: number = 0; i < tables.length; i++) {
        const retB: boolean = await this.backupTable(db, tables[i].name);
        if (!retB) {
          console.log('backupTables: Error backupTable failed');
          resolve(false);
        }
      }
      resolve(true);
    });
  }
  private async backupTable(db: any, tableName: string): Promise<boolean> {
    return new Promise(async resolve => {
      let retB: boolean = await this.beginTransaction(db);
      if (!retB) {
        console.log('backupTable: Error beginTransaction failed');
        resolve(false);
      }
      // get the column's name
      const tableNamesTypes: any = await this.getTableColumnNamesTypes(
        db,
        tableName,
      );
      this._alterTables[tableName] = tableNamesTypes.names;
      // prefix the table with _temp_
      let stmt: string = `ALTER TABLE ${tableName} RENAME TO _temp_${tableName};`;
      const pchanges: any = await this.execute(db, stmt);
      if (pchanges.changes === -1) {
        console.log('backupTable: Error execute failed');
        resolve(false);
      }

      retB = await this.endTransaction(db);
      if (!retB) {
        console.log('backupTable: Error endTransaction failed');
        resolve(false);
      }
      resolve(true);
    });
  }
  private async dropAll(): Promise<boolean> {
    return new Promise(async resolve => {
      // Drop All Tables
      const db = this._utils.connection(
        this._databaseName,
        false /*,this._secret*/,
      );
      if (db === null) {
        this.isOpen = false;
        console.log('dropAll: Error Database connection failed');
        resolve(false);
      }
      let retB: boolean = await this.dropTables(db);
      if (!retB) resolve(false);
      // Drop All Indexes
      retB = await this.dropIndexes(db);
      if (!retB) resolve(false);
      // Drop All Triggers
      retB = await this.dropTriggers(db);
      if (!retB) resolve(false);
      // VACCUUM
      await this.execute(db, 'VACUUM;');
      db.close();
      return true;
    });
  }
  private async dropTables(db: any): Promise<boolean> {
    return new Promise(async resolve => {
      // get the table's names
      const tables: Array<any> = await this.getTablesNames(db);

      let statements: Array<string> = [];
      for (let i: number = 0; i < tables.length; i++) {
        const stmt: string = `DROP TABLE IF EXISTS ${tables[i].name};`;
        statements.push(stmt);
      }
      if (statements.length > 0) {
        const pchanges: any = await this.execute(db, statements.join('\n'));
        if (pchanges.changes === -1) {
          console.log('dropTables: Error execute failed');
          resolve(false);
        }
      }
      resolve(true);
    });
  }
  private async dropIndexes(db: any): Promise<boolean> {
    return new Promise(async resolve => {
      // get the index's names
      let stmt: string = "SELECT name FROM sqlite_master WHERE type = 'index' ";
      stmt += "AND name NOT LIKE 'sqlite_%';";
      let indexes: Array<any> = await this.select(db, stmt, []);
      if (indexes.length === 0) {
        console.log("dropIndexes: Error get index's names failed");
        resolve(false);
      }
      let statements: Array<string> = [];
      for (let i: number = 0; i < indexes.length; i++) {
        const stmt: string = `DROP INDEX IF EXISTS ${indexes[i].name};`;
        statements.push(stmt);
      }
      if (statements.length > 0) {
        const pchanges: any = await this.execute(db, statements.join('\n'));
        if (pchanges.changes === -1) {
          console.log('dropIndexes: Error execute failed');
          resolve(false);
        }
      }
      resolve(true);
    });
  }
  private async dropTriggers(db: any): Promise<boolean> {
    return new Promise(async resolve => {
      // get the index's names
      let stmt: string =
        "SELECT name FROM sqlite_master WHERE type = 'trigger';";
      let triggers: Array<any> = await this.select(db, stmt, []);
      if (triggers.length === 0) {
        console.log("dropTriggers: Error get index's names failed");
        resolve(false);
      }
      let statements: Array<string> = [];
      for (let i: number = 0; i < triggers.length; i++) {
        let stmt: string = 'DROP TRIGGER IF EXISTS ';
        stmt += `${triggers[i].name};`;
        statements.push(stmt);
      }
      if (statements.length > 0) {
        const pchanges: any = await this.execute(db, statements.join('\n'));
        if (pchanges.changes === -1) {
          console.log('dropTriggers: Error execute failed');
          resolve(false);
        }
      }
      resolve(true);
    });
  }
  private async findCommonColumns(db: any): Promise<boolean> {
    return new Promise(async resolve => {
      // Get new table list
      const tables: Array<any> = await this.getTablesNames(db);
      if (tables.length === 0) {
        console.log("findCommonColumns: Error get table's names failed");
        resolve(false);
      }
      for (let i: number = 0; i < tables.length; i++) {
        // get the column's name
        const tableNamesTypes: any = await this.getTableColumnNamesTypes(
          db,
          tables[i].name,
        );
        // find the common columns
        const keys: Array<string> = Object.keys(this._alterTables);
        if (keys.includes(tables[i].name)) {
          this._commonColumns[tables[i].name] = this.arraysIntersection(
            this._alterTables[tables[i].name],
            tableNamesTypes.names,
          );
        }
      }
      resolve(true);
    });
  }
  private async getTablesNames(db: any): Promise<Array<any>> {
    return new Promise(async resolve => {
      // get the table's names
      let stmt: string = "SELECT name FROM sqlite_master WHERE type = 'table' ";
      stmt += "AND name NOT LIKE 'sync_table' ";
      stmt += "AND name NOT LIKE '_temp_%' ";
      stmt += "AND name NOT LIKE 'sqlite_%';";
      const tables: Array<any> = await this.select(db, stmt, []);
      resolve(tables);
    });
  }
  private async updateNewTablesData(db: any): Promise<boolean> {
    return new Promise(async resolve => {
      let retB: boolean = await this.beginTransaction(db);
      if (!retB) {
        console.log('updateNewTablesData: ' + 'Error beginTransaction failed');
        resolve(false);
      }

      let statements: Array<string> = [];
      const keys: Array<string> = Object.keys(this._commonColumns);
      keys.forEach(key => {
        const columns = this._commonColumns[key].join(',');
        let stmt: string = `INSERT INTO ${key} (${columns}) SELECT `;
        stmt += `${columns} FROM _temp_${key};`;
        statements.push(stmt);
      });
      const pchanges: any = await this.execute(db, statements.join('\n'));
      if (pchanges.changes === -1) {
        console.log('updateNewTablesData: Error execute failed');
        resolve(false);
      }

      retB = await this.endTransaction(db);
      if (!retB) {
        console.log('updateNewTablesData: ' + 'Error endTransaction failed');
        resolve(false);
      }
      resolve(true);
    });
  }
  private arraysIntersection(a1: Array<any>, a2: Array<any>): Array<any> {
    return a1.filter((n: any) => {
      return a2.indexOf(n) !== -1;
    });
  }
  private backupDB(dbName: string): Promise<boolean> {
    return new Promise(resolve => {
      const dbPath = this._utils.getDBPath(dbName);
      const dbBackupPath = this._utils.getDBPath(`backup-${dbName}`);
      if (dbPath.length > 0 && dbBackupPath.length > 0) {
        this.NodeFs.copyFile(
          dbPath,
          dbBackupPath,
          this.NodeFs.constants.COPYFILE_EXCL,
          (err: any) => {
            if (err) {
              console.log('Error: in backupDB Found:', err);
              resolve(false);
            } else {
              resolve(true);
            }
          },
        );
      } else {
        console.log('Error: in backupDB path & backuppath not correct');
        resolve(false);
      }
    });
  }
  private restoreDB(dbName: string): Promise<boolean> {
    return new Promise(resolve => {
      const dbPath = this._utils.getDBPath(dbName);
      const dbBackupPath = this._utils.getDBPath(`backup-${dbName}`);
      if (dbPath.length > 0 && dbBackupPath.length > 0) {
        const isBackup: boolean = this.isDB(dbBackupPath);
        if (!isBackup) {
          console.log('Error: in restoreDB no backup database');
          resolve(false);
        }
        const isFile: boolean = this.isDB(dbPath);
        if (isFile) {
          try {
            this.NodeFs.unlinkSync(dbPath);
            //file removed
          } catch (e) {
            console.log('Error: in restoreDB delete database failed');
            resolve(false);
          }
        }
        this.NodeFs.copyFile(
          dbBackupPath,
          dbPath,
          this.NodeFs.constants.COPYFILE_EXCL,
          (err: any) => {
            if (err) {
              console.log('Error: in restoreDB copyfile failed:', err);
              resolve(false);
            } else {
              resolve(true);
            }
          },
        );
      } else {
        console.log('Error: in backupDB path & backuppath not correct');
        resolve(false);
      }
    });
  }
  private isDB(dbPath: string): boolean {
    try {
      if (this.NodeFs.existsSync(dbPath)) {
        //file exists
        return true;
      }
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  //1234567890123456789012345678901234567890123456789012345678901234567890
}
