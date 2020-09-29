export class UtilsSQLite {
  public pathDB: string = 'Databases';
  Path: any = null;
  NodeFs: any = null;
  RemoteRef: any = null;
  Os: any = null;
  SQLite3: any = null;
  AppName: String = null;
  HomeDir: String = null;

  constructor() {
    this.Path = require('path');
    this.NodeFs = require('fs');
    this.Os = require('os');
    this.SQLite3 = require('sqlite3');
    this.HomeDir = this.Os.homedir();
    /**
     * !!! in case you want your databases to be stored in YourApplication/Electron/
     * comment the below line
     */
    this.AppName = require('../../package.json').name;
  }
  public connection(dbName: string, readOnly?: boolean /*,key?:string*/): any {
    const flags = readOnly
      ? this.SQLite3.OPEN_READONLY
      : this.SQLite3.OPEN_CREATE | this.SQLite3.OPEN_READWRITE;

    // get the path for the database
    const dbPath = this.getDBPath(dbName);
    let dbOpen: any = null;

    if (dbPath.length > 0) {
      try {
        dbOpen = new this.SQLite3.Database(dbPath, flags);
      } catch (e) {
        console.log('Error: in UtilsSQLite.connection ', e);
        dbOpen = null;
      } finally {
        if (dbOpen != null) {
          const statements: string = 'PRAGMA foreign_keys = ON;';
          dbOpen.serialize(() => {
            dbOpen.exec(statements, (err: Error) => {
              if (err) {
                console.log(
                  `exec: Error PRAGMA foreign_keys failed : ${err.message}`,
                );
                dbOpen = null;
              }
            });
          });
        }
        return dbOpen;
      }
    }
  }

  public getWritableDatabase(dbName: string /*, secret: string*/): any {
    const db: any = this.connection(dbName, false /*,secret*/);
    return db;
  }

  public getReadableDatabase(dbName: string /*, secret: string*/): any {
    const db: any = this.connection(dbName, true /*,secret*/);
    return db;
  }
  public getDBPath(dbName: string): string {
    let retPath: string = '';
    const dbFolder: string = this.pathDB;
    if (this.AppName == null) {
      let sep: string = '/';
      const idx: number = __dirname.indexOf('\\');
      if (idx != -1) sep = '\\';
      const dir: string = __dirname.substring(
        0,
        __dirname.lastIndexOf(sep) + 1,
      );
      retPath = this.Path.join(dir, dbFolder, dbName);
      const retB: boolean = this._createFolderIfNotExists(
        this.Path.join(dir, dbFolder),
      );
      if (!retB) retPath = '';
    } else {
      retPath = this.Path.join(this.HomeDir, dbFolder, this.AppName, dbName);
      let retB: boolean = this._createFolderIfNotExists(
        this.Path.join(this.HomeDir, dbFolder),
      );
      if (retB) {
        retB = this._createFolderIfNotExists(
          this.Path.join(this.HomeDir, dbFolder, this.AppName),
        );
        if (!retB) retPath = '';
      } else {
        retPath = '';
      }
    }
    return retPath;
  }
  private _createFolderIfNotExists(folder: string): boolean {
    let ret: boolean;
    try {
      if (!this.NodeFs.existsSync(folder)) {
        this._mkdirSyncRecursive(folder);
      }
      ret = true;
    } catch (e) {
      console.log('Error: in getDBPath', e);
      ret = false;
    }
    return ret;
  }
  private _mkdirSyncRecursive(directory: string): void {
    var path = directory.replace(/\/$/, '').split('/');
    for (var i = 1; i <= path.length; i++) {
      var segment = path.slice(0, i).join('/');
      segment.length > 0 && !this.NodeFs.existsSync(segment)
        ? this.NodeFs.mkdirSync(segment)
        : null;
    }
    return;
  }
}
