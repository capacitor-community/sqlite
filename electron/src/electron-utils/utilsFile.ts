export class UtilsFile {
  pathDB: string = 'Databases';
  Path: any = null;
  NodeFs: any = null;
  Os: any = null;
  AppName: String = '';
  HomeDir: String = '';

  constructor() {
    this.Path = require('path');
    this.NodeFs = require('fs');
    this.Os = require('os');
    this.HomeDir = this.Os.homedir();
    this.AppName = require('../../package.json').name;
  }
  /**
   * IsPathExists
   * @param filePath
   */
  public isPathExists(filePath: string): boolean {
    let ret: boolean = false;
    try {
      if (this.NodeFs.existsSync(filePath)) {
        ret = true;
      }
    } catch (err) {
      console.error('Error isFileExist: ' + err);
      ret = false;
    }
    return ret;
  }
  /**
   * IsFileExists
   * @param fileName
   */
  public isFileExists(fileName: string): boolean {
    let ret: boolean = false;
    const filePath: string = this.getFilePath(fileName);
    if (filePath.length > 0) {
      ret = this.isPathExists(filePath);
    }
    return ret;
  }

  /**
   * GetFilePath
   * get the file path
   * @param fileName
   */
  public getFilePath(fileName: string): string {
    return this.Path.join(this.getDatabasesPath(), fileName);
  }
  /**
   * GetDatabasesPath
   * get the database folder path
   */
  public getDatabasesPath(): string {
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
      retPath = this.Path.join(dir, dbFolder);
      const retB: boolean = this._createFolderIfNotExists(
        this.Path.join(dir, dbFolder),
      );
      if (!retB) retPath = '';
    } else {
      retPath = this.Path.join(this.HomeDir, dbFolder, this.AppName);
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
  /**
   * GetAssetsDatabasesPath
   * get the assets databases folder path
   */
  public getAssetsDatabasesPath(): string {
    let retPath: string = '';
    let sep: string = '/';
    const idx: number = __dirname.indexOf('\\');
    if (idx != -1) sep = '\\';
    const dir: string = __dirname.substring(0, __dirname.lastIndexOf(sep) + 1);
    retPath = this.Path.join(dir, 'app', 'assets', this.pathDB.toLowerCase());
    console.log(`$$$ AssetsDatabases ${retPath}`);
    return retPath;
  }
  /**
   * SetPathSuffix
   * @param db
   */
  public setPathSuffix(db: string): string {
    let toDb: string = db;
    if (db.length > 9) {
      const last9: string = db.slice(-9);
      if (last9 != 'SQLite.db') {
        toDb = this.Path.parse(db).name + 'SQLite.db';
      }
    } else {
      toDb = toDb + 'SQLite.db';
    }
    return toDb;
  }
  /**
   * GetFileList
   * get the file list for a given folder
   * @param path
   */
  public getFileList(path: string): Promise<string[]> {
    return new Promise(async resolve => {
      const filenames = this.NodeFs.readdirSync(path);
      let dbs: string[] = [];
      filenames.forEach((file: string) => {
        if (this.Path.extname(file) == '.db') dbs.push(file);
      });
      resolve(dbs);
    });
  }
  /**
   * CopyFromAssetToDatabase
   * @param db
   * @param toDb
   */
  public copyFromAssetToDatabase(db: string, toDb: string): Promise<void> {
    return new Promise(async resolve => {
      const pAsset: string = this.Path.join(this.getAssetsDatabasesPath(), db);
      const pDb: string = this.Path.join(this.getDatabasesPath(), toDb);
      await this.copyFilePath(pAsset, pDb);
      resolve();
    });
  }
  /**
   * CopyFileName
   * Copy file name
   * @param fileName
   * @param toFileName
   */
  public copyFileName(fileName: string, toFileName: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      // get File Paths
      const filePath = this.getFilePath(fileName);
      const toFilePath = this.getFilePath(toFileName);
      if (filePath.length !== 0 && toFilePath.length !== 0) {
        try {
          await this.copyFilePath(filePath, toFilePath);
          resolve();
        } catch (err) {
          reject(new Error(`CopyFileName: ${err.message}`));
        }
      } else {
        reject(new Error('CopyFileName: cannot get the ' + 'filePath'));
      }
    });
  }
  /**
   * CopyFilePath
   * Copy file Path
   * @param filePath
   * @param toFilePath
   */
  public copyFilePath(filePath: string, toFilePath: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      if (filePath.length !== 0 && toFilePath.length !== 0) {
        // check filePath exists
        const isPath = this.isPathExists(filePath);
        if (isPath) {
          try {
            await this.deleteFilePath(toFilePath);
            this.NodeFs.copyFileSync(filePath, toFilePath);
            resolve();
          } catch (err) {
            reject(new Error(`CopyFilePath: ${err.message}`));
          }
        } else {
          reject(new Error('CopyFilePath: filePath does not ' + 'exist'));
        }
      } else {
        reject(new Error('CopyFilePath: cannot get the ' + 'filePath'));
      }
    });
  }
  /**
   * DeleteFileName
   * Delete a file by its name
   * @param fileName
   */
  public deleteFileName(fileName: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      // get file path
      const filePath = this.getFilePath(fileName);
      if (filePath.length !== 0) {
        try {
          await this.deleteFilePath(filePath);
          resolve();
        } catch (err) {
          reject(
            new Error(
              'DeleteFileName: delete filePath ' + `failed ${err.message}`,
            ),
          );
        }
      } else {
        reject(new Error('DeleteFileName: get filePath ' + 'failed'));
      }
    });
  }
  /**
   * DeleteFilePath
   * Delete a file by its path
   * @param filePath
   */
  public deleteFilePath(filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (filePath.length !== 0) {
        // check if path exists
        const isPath = this.isPathExists(filePath);
        if (isPath) {
          try {
            this.NodeFs.unlinkSync(filePath);
            resolve();
          } catch (err) {
            reject(new Error('DeleteFilePath: ' + `${err.message}`));
          }
        } else {
          resolve();
        }
      } else {
        reject(new Error('DeleteFilePath: delete filePath' + 'failed'));
      }
    });
  }
  /**
   * RenameFileName
   * @param fileName
   * @param toFileName
   */
  public renameFileName(fileName: string, toFileName: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      // get File Paths
      const filePath = this.getFilePath(fileName);
      const toFilePath = this.getFilePath(toFileName);
      if (filePath.length !== 0 && toFilePath.length !== 0) {
        try {
          await this.renameFilePath(filePath, toFilePath);
          resolve();
        } catch (err) {
          reject(new Error(`RenameFileName: ${err.message}`));
        }
      } else {
        reject(new Error('RenameFileName: filePaths do not ' + 'exist'));
      }
    });
  }
  /**
   * RenameFilePath
   * @param filePath
   * @param toFilePath
   */
  public renameFilePath(filePath: string, toFilePath: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      if (filePath.length !== 0 && toFilePath.length !== 0) {
        // check filePath exists
        const isPath = this.isPathExists(filePath);
        if (isPath) {
          // delete toFilePath if exists
          try {
            await this.deleteFilePath(toFilePath);
            this.NodeFs.renameSync(filePath, toFilePath);
            resolve();
          } catch (err) {
            reject(new Error('RenameFilePath: ' + `${err.message}`));
          }
        } else {
          reject(new Error('RenameFilePath: filePath ' + 'does not exist'));
        }
      } else {
        reject(new Error('RenameFilePath: filePath not found'));
      }
    });
  }
  /**
   * RestoreFileName
   * @param fileName
   * @param prefix
   */
  public restoreFileName(fileName: string, prefix: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const mFileName = `${prefix}-${fileName}`;
      // check if file exists
      const isFilePre: boolean = this.isFileExists(mFileName);
      if (isFilePre) {
        const isFile: boolean = this.isFileExists(fileName);
        if (isFile) {
          try {
            await this.deleteFileName(fileName);
            await this.renameFileName(mFileName, fileName);
            resolve();
          } catch (err) {
            reject(new Error('RestoreFileName: ' + `${err.message}`));
          }
        } else {
          reject(new Error(`RestoreFileName: ${fileName} ` + 'does not exist'));
        }
      } else {
        reject(new Error(`RestoreFileName: ${mFileName} ` + 'does not exist'));
      }
    });
  }
  /**
   * CreateFolderIfNotExists
   * Create directory
   * @param folder
   */
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
  /**
   * MkdirSyncRecursive
   * Create directories recursively
   * @param directory
   */
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
