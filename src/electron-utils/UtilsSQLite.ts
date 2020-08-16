const sqlite3: any = window['sqlite3' as any];
const fs: any = window['fs' as any];
const path: any = window['path' as any];
const appName: any = window['appName' as any];
const homeDir = window['homeDir' as any];

export class UtilsSQLite {
  public pathDB: string = 'Databases';

  constructor() {}

  public connection(
    dbName: string,
    readOnly?: boolean,
    dbVersion = 1 /*,key?:string*/,
  ): any {
    const flags = readOnly
      ? sqlite3.OPEN_READONLY
      : sqlite3.OPEN_CREATE | sqlite3.OPEN_READWRITE;

    // get the path for the database
    const dbPath = this.getDBPath(dbName);
    let dbOpen: any = null;

    if (dbPath.length > 0) {
      try {
        dbOpen = new sqlite3.Database(dbPath, flags);
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

          const versionStatement: string = 'PRAGMA user_version;';
          dbOpen.serialize(() => {
            dbOpen.get(versionStatement, (err: Error, row: any) => {
              if (err) {
                console.log(
                  `get: Error PRAGMA user_version failed : ${err.message}`,
                );
                dbOpen = null;
                return;
              }

              if (row === undefined || row['user_version'] === 0) {
                dbOpen.run('PRAGMA user_version = $version;', {
                  $version: dbVersion,
                });
              } else if (row['user_version'] !== dbVersion) {
                console.log(
                  `Error PRAGMA user_version failed : Version mismatch expected Version ${dbVersion} found Version ${row['user_version']}`,
                );
                dbOpen = null;
                return;
              }
            });
          });
        }
        return dbOpen;
      }
    }
  }

  public getWritableDatabase(
    dbName: string,
    dbVersion = 1 /*, secret: string*/,
  ): any {
    const db: any = this.connection(dbName, false, dbVersion /*,secret*/);
    return db;
  }

  public getReadableDatabase(
    dbName: string,
    dbVersion = 1 /*, secret: string*/,
  ): any {
    const db: any = this.connection(dbName, true, dbVersion /*,secret*/);
    return db;
  }

  public getDBPath(dbName: string): string {
    let retPath: string = '';
    const dbFolder: string = this.pathDB;
    if (appName == null) {
      let sep: string = '/';
      const idx: number = __dirname.indexOf('\\');
      if (idx != -1) sep = '\\';
      const dir: string = __dirname.substring(
        0,
        __dirname.lastIndexOf(sep) + 1,
      );
      retPath = path.join(dir, dbFolder, dbName);
      const retB: boolean = this._createFolderIfNotExists(
        path.join(dir, dbFolder),
      );
      if (!retB) retPath = '';
    } else {
      retPath = path.join(homeDir, dbFolder, appName, dbName);
      let retB: boolean = this._createFolderIfNotExists(
        path.join(homeDir, dbFolder),
      );
      if (retB) {
        retB = this._createFolderIfNotExists(
          path.join(homeDir, dbFolder, appName),
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
      if (!fs.existsSync(folder)) {
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
      segment.length > 0 && !fs.existsSync(segment)
        ? fs.mkdirSync(segment)
        : null;
    }
    return;
  }
}
