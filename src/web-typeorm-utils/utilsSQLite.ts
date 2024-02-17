/************************************************
 * Only to be used to run TypeOrm Cli
 * migration:generate
 * A in-memory database is used
 ************************************************
 */

export class UtilsSQLite {
  public initSqlJs: any;
  public FS: any;
  public OS: any;
  public Path: any;
  private isExists = false;
  private retExists = { isExists: false, pathWasm: '' };

  constructor() {
    this.initSqlJs = require('sql.js');
    this.OS = require('os');
    this.FS = require('fs');
    this.Path = require('path');
  }
  public getTypeOrmDBFolder(): string {
    // Find the index of the "node_modules" string in the path
    const nodeModulesIndex = __dirname.indexOf('node_modules');

    // Extract the part of the path before "node_modules"
    const outputPath = __dirname.slice(0, nodeModulesIndex);

    // Extract the App name
    const appName = this.Path.basename(outputPath);

    // Get the Documents path
    const documentsDirectory = this.Path.join(this.OS.homedir(), 'Documents');

    // Add "CapacitorSQLite" and appName
    const outputFolderPath = this.Path.join(
      documentsDirectory,
      'CapacitorSQLite',
      appName,
    );

    // Ensure the output folder exists
    this.FS.mkdirSync(outputFolderPath, { recursive: true });
    return outputFolderPath;
  }
  public getTypeOrmDBPath(outputFolderPath: string, dbName: string): string {
    return this.Path.resolve(outputFolderPath, dbName);
  }
  public async checkFileExistence(wasmPath: string): Promise<any> {
    // check if a public folder exists
    const folder = (await this.checkFolderExistence('public'))
      ? 'public'
      : 'src';
    const pathWasm = this.Path.join(folder, wasmPath);
    const retObj: any = {};
    retObj.pathWasm = pathWasm;
    try {
      if (this.FS.existsSync(pathWasm)) {
        retObj.isExists = true;
        return Promise.resolve(retObj);
      } else {
        retObj.isExists = false;
        return Promise.resolve(retObj);
      }
    } catch (err) {
      retObj.isExists = false;
      return Promise.resolve(retObj);
    }
  }
  public async checkFolderExistence(folder: string): Promise<boolean> {
    try {
      if (this.FS.existsSync(folder)) {
        return Promise.resolve(true);
      } else {
        return Promise.resolve(false);
      }
    } catch (err) {
      return Promise.resolve(false);
    }
  }
  public async openOrCreateDatabase(
    wasmPath: string,
    databasePath: string,
  ): Promise<any> {
    let mDB: any;
    const msg = 'OpenOrCreateDatabase';
    try {
      this.retExists = await this.checkFileExistence(wasmPath);
      this.isExists = this.retExists.isExists;
    } catch (err) {
      this.isExists = false;
    }
    if (!this.isExists) {
      return Promise.reject(msg + ' No sql-wasm.wasm found in ' + wasmPath);
    }

    try {
      const config = {
        locateFile: (file: any) => `${this.retExists.pathWasm}/${file}`,
      };

      const SQL = await this.initSqlJs(config);
      // Check if the database exists
      if (!this.FS.existsSync(databasePath)) {
        mDB = new SQL.Database();
      } else {
        // Read the database file from the local disk
        const fileBuffer = this.FS.readFileSync(databasePath);
        // Create a new database instance
        mDB = new SQL.Database(fileBuffer);
      }

      return Promise.resolve(mDB);
    } catch (err: any) {
      return Promise.reject(msg + ' open database failed');
    }
  }
  public async saveDatabase(mDb: any, outputPath: string): Promise<void> {
    try {
      // Export the modified database to a Uint8Array
      const data = mDb.export();

      // Write the Uint8Array to a file on the local disk
      this.FS.writeFileSync(outputPath, Buffer.from(data));

      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  }
  public closeDB(mDB: any): Promise<void> {
    const msg = 'closeDB';
    try {
      mDB.close();
      return Promise.resolve();
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      return Promise.reject(`${msg} ${errmsg}`);
    }
  }
  public async dbChanges(mDB: any): Promise<number> {
    const SELECT_CHANGE = 'SELECT total_changes()';
    let changes = 0;
    try {
      const res = mDB.exec(SELECT_CHANGE);
      // process the row here
      changes = res[0].values[0][0];
      return Promise.resolve(changes);
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      return Promise.reject(`DbChanges failed: ${errmsg}`);
    }
  }
  public async getLastId(mDB: any): Promise<number> {
    const SELECT_LAST_ID = 'SELECT last_insert_rowid()';
    let lastId = -1;
    try {
      const res = mDB.exec(SELECT_LAST_ID);
      // process the row here
      lastId = res[0].values[0][0];
      return Promise.resolve(lastId);
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      return Promise.reject(new Error(`GetLastId failed: ${errmsg}`));
    }
  }
  public async execute(mDB: any, sql: string): Promise<number> {
    try {
      mDB.exec(sql);
      const changes = await this.dbChanges(mDB);
      return Promise.resolve(changes);
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      return Promise.reject(new Error(`Execute failed: ${errmsg}`));
    }
  }
  public async run(
    mDB: any,
    statement: string,
    values: any[],
    returnMode: string,
  ): Promise<any> {
    let res: any;
    let retValues: any[] = [];
    const retObj: any = {};

    try {
      if (values.length > 0) {
        res = mDB.exec(statement, values);
      } else {
        res = mDB.exec(statement);
      }
      if (returnMode === 'all' || returnMode === 'one') {
        if (res && res.length > 0) {
          retValues = this.getReturnedValues(res[0], returnMode);
        }
      }
      const lastId = await this.getLastId(mDB);
      retObj['lastId'] = lastId;
      if (retValues != null && retValues.length > 0)
        retObj['values'] = retValues;
      return Promise.resolve(retObj);
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      return Promise.reject(new Error(`Run failed: ${errmsg}`));
    }
  }
  public getReturnedValues(result: any, returnMode: string): any[] {
    const retValues: any[] = [];
    for (const values of result.values) {
      const row: any = {};

      for (let j = 0; j < result.columns.length; j++) {
        row[result.columns[j]] = values[j];
      }

      retValues.push(row);

      if (returnMode === 'one') {
        break;
      }
    }
    return retValues;
  }
  public async queryAll(mDB: any, sql: string, values: any[]): Promise<any[]> {
    try {
      let retArr: any[] = [];
      if (values != null && values.length > 0) {
        retArr = mDB.exec(sql, values);
      } else {
        retArr = mDB.exec(sql);
      }
      if (retArr.length == 0) return Promise.resolve([]);

      const result = retArr[0].values.map((entry: any[]) => {
        const obj: any = {};
        retArr[0].columns.forEach((column: string, index: number) => {
          obj[`${column}`] = entry[index];
        });
        return obj;
      });

      return Promise.resolve(result);
    } catch (err: any) {
      const errmsg = err.message ? err.message : err;
      return Promise.reject(new Error(`queryAll: ${errmsg}`));
    }
  }
}
