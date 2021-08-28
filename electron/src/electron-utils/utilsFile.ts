export class UtilsFile {
  pathDB = 'Databases';
  Path: any = null;
  NodeFs: any = null;
  Os: any = null;
  AppName = '';
  HomeDir = '';
  osType: string;
  sep = '/';
  appPath: string;

  constructor() {
    this.Path = require('path');
    this.NodeFs = require('fs');
    this.Os = require('os');
    this.HomeDir = this.Os.homedir();
    const dir: string = __dirname;
    const idx: number = dir.indexOf('\\');
    if (idx != -1) this.sep = '\\';
    this.appPath = dir.substring(
      0,
      dir.indexOf(`electron${this.sep}`) /* + 8*/,
    );
    const rawdata = this.NodeFs.readFileSync(
      this.Path.resolve(this.appPath, 'package.json'),
    );
    this.AppName = JSON.parse(rawdata).name;
    this.osType = this.Os.type();
  }
  /**
   * IsPathExists
   * @param filePath
   */
  public isPathExists(filePath: string): boolean {
    let ret = false;
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
    let ret = false;
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
   * GetCustomerPath
   * get the customer path
   */
  public getCustomerPath(custPath: string): string {
    return this.Path.join(this.HomeDir, custPath);
  }
  /**
   * GetCustomerFilePath
   * get the customer file path
   */
  public getCustomerFilePath(custPath: string, file: string): string {
    return this.Path.join(custPath, file);
  }
  /**
   * GetDatabasesPath
   * get the database folder path
   */
  public getDatabasesPath(): string {
    let retPath = '';
    const dbFolder: string = this.pathDB;
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

    return retPath;
  }
  /**
   * GetAssetsDatabasesPath
   * get the assets databases folder path
   */
  public getAssetsDatabasesPath(): string {
    let retPath = '';
    const rawdata = this.NodeFs.readFileSync(
      this.Path.resolve(this.appPath, 'capacitor.config.json'),
    );
    const webDir = JSON.parse(rawdata).webDir;
    const dir = webDir === 'www' ? 'src' : 'public';
    retPath = this.Path.resolve(
      this.appPath,
      dir,
      'assets',
      this.pathDB.toLowerCase(),
    );
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
  public async getFileList(path: string): Promise<string[]> {
    const filenames = this.NodeFs.readdirSync(path);
    const dbs: string[] = [];
    filenames.forEach((file: string) => {
      if (this.Path.extname(file) == '.db') dbs.push(file);
    });
    return Promise.resolve(dbs);
  }
  /**
   * CopyFromAssetToDatabase
   * @param db
   * @param toDb
   */
  public async copyFromAssetToDatabase(
    db: string,
    toDb: string,
  ): Promise<void> {
    const pAsset: string = this.Path.join(this.getAssetsDatabasesPath(), db);
    const pDb: string = this.Path.join(this.getDatabasesPath(), toDb);
    await this.copyFilePath(pAsset, pDb);
    return Promise.resolve();
  }
  /**
   * CopyFileName
   * Copy file name
   * @param fileName
   * @param toFileName
   */
  public async copyFileName(
    fileName: string,
    toFileName: string,
  ): Promise<void> {
    // get File Paths
    const filePath = this.getFilePath(fileName);
    const toFilePath = this.getFilePath(toFileName);
    if (filePath.length !== 0 && toFilePath.length !== 0) {
      try {
        await this.copyFilePath(filePath, toFilePath);
        return Promise.resolve();
      } catch (err) {
        return Promise.reject(new Error(`CopyFileName: ${err.message}`));
      }
    } else {
      return Promise.reject(
        new Error('CopyFileName: cannot get the ' + 'filePath'),
      );
    }
  }
  /**
   * CopyFilePath
   * Copy file Path
   * @param filePath
   * @param toFilePath
   */
  public async copyFilePath(
    filePath: string,
    toFilePath: string,
  ): Promise<void> {
    if (filePath.length !== 0 && toFilePath.length !== 0) {
      // check filePath exists
      const isPath = this.isPathExists(filePath);
      if (isPath) {
        try {
          await this.deleteFilePath(toFilePath);
          this.NodeFs.copyFileSync(filePath, toFilePath);
          return Promise.resolve();
        } catch (err) {
          return Promise.reject(new Error(`CopyFilePath: ${err.message}`));
        }
      } else {
        return Promise.reject(
          new Error('CopyFilePath: filePath does not ' + 'exist'),
        );
      }
    } else {
      return Promise.reject(
        new Error('CopyFilePath: cannot get the ' + 'filePath'),
      );
    }
  }
  public async copyFile(
    fromPath: string,
    fromFile: string,
    toPath: string,
    toFile: string,
  ): Promise<void> {
    const fPath: string = this.Path.join(fromPath, fromFile);
    const tPath: string = this.Path.join(toPath, toFile);
    try {
      this.NodeFs.copyFileSync(fPath, tPath);
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(new Error(`CopyFile: ${err.message}`));
    }
  }
  /**
   * DeleteFileName
   * Delete a file by its name
   * @param fileName
   */
  public async deleteFileName(fileName: string): Promise<void> {
    // get file path
    const filePath = this.getFilePath(fileName);
    if (filePath.length !== 0) {
      try {
        await this.deleteFilePath(filePath);
        return Promise.resolve();
      } catch (err) {
        return Promise.reject(
          new Error(
            'DeleteFileName: delete filePath ' + `failed ${err.message}`,
          ),
        );
      }
    } else {
      return Promise.reject(
        new Error('DeleteFileName: get filePath ' + 'failed'),
      );
    }
  }
  /**
   * DeleteFilePath
   * Delete a file by its path
   * @param filePath
   */
  public async deleteFilePath(filePath: string): Promise<void> {
    if (filePath.length !== 0) {
      // check if path exists
      const isPath = this.isPathExists(filePath);
      if (isPath) {
        try {
          this.NodeFs.unlinkSync(filePath);
          return Promise.resolve();
        } catch (err) {
          return Promise.reject(
            new Error('DeleteFilePath: ' + `${err.message}`),
          );
        }
      } else {
        return Promise.resolve();
      }
    } else {
      return Promise.reject(
        new Error('DeleteFilePath: delete filePath' + 'failed'),
      );
    }
  }
  /**
   * RenameFileName
   * @param fileName
   * @param toFileName
   */
  public async renameFileName(
    fileName: string,
    toFileName: string,
  ): Promise<void> {
    // get File Paths
    const filePath = this.getFilePath(fileName);
    const toFilePath = this.getFilePath(toFileName);
    if (filePath.length !== 0 && toFilePath.length !== 0) {
      try {
        await this.renameFilePath(filePath, toFilePath);
        return Promise.resolve();
      } catch (err) {
        return Promise.reject(new Error(`RenameFileName: ${err.message}`));
      }
    } else {
      return Promise.reject(
        new Error('RenameFileName: filePaths do not ' + 'exist'),
      );
    }
  }
  /**
   * RenameFilePath
   * @param filePath
   * @param toFilePath
   */
  public async renameFilePath(
    filePath: string,
    toFilePath: string,
  ): Promise<void> {
    if (filePath.length !== 0 && toFilePath.length !== 0) {
      // check filePath exists
      const isPath = this.isPathExists(filePath);
      if (isPath) {
        // delete toFilePath if exists
        try {
          await this.deleteFilePath(toFilePath);
          this.NodeFs.renameSync(filePath, toFilePath);
          return Promise.resolve();
        } catch (err) {
          return Promise.reject(
            new Error('RenameFilePath: ' + `${err.message}`),
          );
        }
      } else {
        return Promise.reject(
          new Error('RenameFilePath: filePath ' + 'does not exist'),
        );
      }
    } else {
      return Promise.reject(new Error('RenameFilePath: filePath not found'));
    }
  }
  /**
   * RestoreFileName
   * @param fileName
   * @param prefix
   */
  public async restoreFileName(
    fileName: string,
    prefix: string,
  ): Promise<void> {
    const mFileName = `${prefix}-${fileName}`;
    // check if file exists
    const isFilePre: boolean = this.isFileExists(mFileName);
    if (isFilePre) {
      const isFile: boolean = this.isFileExists(fileName);
      if (isFile) {
        try {
          await this.deleteFileName(fileName);
          await this.renameFileName(mFileName, fileName);
          return Promise.resolve();
        } catch (err) {
          return Promise.reject(
            new Error('RestoreFileName: ' + `${err.message}`),
          );
        }
      } else {
        return Promise.reject(
          new Error(`RestoreFileName: ${fileName} ` + 'does not exist'),
        );
      }
    } else {
      return Promise.reject(
        new Error(`RestoreFileName: ${mFileName} ` + 'does not exist'),
      );
    }
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
    const path = directory.replace(/\/$/, '').split('/');
    for (let i = 1; i <= path.length; i++) {
      const segment = path.slice(0, i).join('/');
      segment.length > 0 && !this.NodeFs.existsSync(segment)
        ? this.NodeFs.mkdirSync(segment)
        : null;
    }
    return;
  }
}
