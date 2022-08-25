export class UtilsFile {
  pathDB = 'Databases';
  Path: any = null;
  NodeFs: any = null;
  JSZip: any = null;
  Os: any = null;
  Electron: any = null;
  AppName = '';
  HomeDir = '';
  osType: string;
  sep = '/';
  appPath: string;
  capConfig: any;

  constructor() {
    this.Path = require('path');
    this.NodeFs = require('fs');
    this.Os = require('os');
    this.JSZip = require('jszip');
    this.Electron = require('electron');

    this.HomeDir = this.Os.homedir();
    const dir: string = __dirname;
    const idx: number = dir.indexOf('\\');
    if (idx != -1) this.sep = '\\';
    this.appPath = this.Electron.app.getAppPath();
    const rawdata = this.NodeFs.readFileSync(
      this.Path.resolve(this.appPath, 'package.json'),
    );
    this.AppName = JSON.parse(rawdata).name;
    const pathToBuild = this.Path.join(this.appPath, 'build');
    if (
      this.NodeFs.existsSync(this.Path.join(pathToBuild, 'capacitor.config.js'))
    ) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      this.capConfig = require(this.Path.join(
        pathToBuild,
        'capacitor.config.js',
      )).default;
    } else {
      this.capConfig = JSON.parse(
        this.NodeFs.readFileSync(
          this.Path.join(this.appPath, 'capacitor.config.json'),
        ).toString(),
      );
    }
    this.osType = this.Os.type();
    switch (this.osType) {
      case 'Darwin':
        this.pathDB =
          this.capConfig.plugins.CapacitorSQLite.electronMacLocation;
        break;
      case 'Linux':
        this.pathDB =
          this.capConfig.plugins.CapacitorSQLite.electronLinuxLocation;
        break;
      case 'Windows_NT':
        this.pathDB =
          this.capConfig.plugins.CapacitorSQLite.electronWindowsLocation;
        break;
      default:
        console.log('other operating system');
    }
    console.log(`&&& Databases path: ${this.pathDB}`);
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
   * GetDatabasesPath
   * get the database folder path
   */
  public getDatabasesPath(): string {
    let retPath = '';
    const sep = this.Path.sep;
    const dbFolder: string = this.pathDB;
    if (dbFolder.includes(sep)) {
      retPath = dbFolder;
      if (this.Path.basename(dbFolder) !== this.AppName) {
        retPath = this.Path.join(dbFolder, this.AppName);
      }
    } else {
      retPath = this.Path.join(this.HomeDir, dbFolder, this.AppName);
    }
    const retB: boolean = this._createFolderIfNotExists(retPath);
    if (!retB) retPath = '';
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
    const ext = '.db';
    const sep = this.Path.sep;
    if (db.substring(db.length - 3) === ext) {
      if (!db.includes('SQLite.db')) {
        toDb = db.slice(db.lastIndexOf(sep) + 1, -3) + 'SQLite.db';
      }
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
      if (this.Path.extname(file) == '.db' || this.Path.extname(file) == '.zip')
        dbs.push(file);
    });
    return Promise.resolve(dbs);
  }
  /**
   * CopyFromAssetToDatabase
   * @param db
   * @param overwrite
   */
  public async copyFromAssetToDatabase(
    db: string,
    overwrite: boolean,
  ): Promise<void> {
    const pAsset: string = this.Path.join(this.getAssetsDatabasesPath(), db);
    const toDb: string = this.setPathSuffix(db);
    const pDb: string = this.Path.join(this.getDatabasesPath(), toDb);
    await this.copyFilePath(pAsset, pDb, overwrite);
    return Promise.resolve();
  }
  /**
   * unzipDatabase
   * @param db
   * @param overwrite
   */
  public async unzipDatabase(db: string, overwrite: boolean): Promise<void> {
    const pZip: string = this.Path.join(this.getAssetsDatabasesPath(), db);
    // Read the Zip file
    this.NodeFs.readFile(pZip, (err: any, data: any) => {
      if (err) {
        console.log(err);
        return Promise.reject(`unzipDatabase ${JSON.stringify(err)}`);
      }
      const zip = new this.JSZip();
      zip.loadAsync(data).then((contents: any) => {
        Object.keys(contents.files).forEach(filename => {
          zip
            .file(filename)
            .async('nodebuffer')
            .then(async (content: any) => {
              const toDb: string = this.setPathSuffix(filename);
              const pDb: string = this.Path.join(this.getDatabasesPath(), toDb);
              // check filePath exists
              const isPath = this.isPathExists(pDb);
              if (!isPath || overwrite) {
                if (overwrite && isPath) {
                  await this.deleteFilePath(pDb);
                }
                this.NodeFs.writeFileSync(pDb, content);
              }
              return Promise.resolve();
            });
        });
      });
    });
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
        await this.copyFilePath(filePath, toFilePath, true);
        return Promise.resolve();
      } catch (err) {
        return Promise.reject(`CopyFileName: ${err}`);
      }
    } else {
      return Promise.reject('CopyFileName: cannot get the ' + 'filePath');
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
    overwrite: boolean,
  ): Promise<void> {
    if (filePath.length !== 0 && toFilePath.length !== 0) {
      // check filePath exists
      const isPath = this.isPathExists(toFilePath);
      if (!isPath || overwrite) {
        try {
          if (overwrite && isPath) {
            await this.deleteFilePath(toFilePath);
          }
          this.NodeFs.copyFileSync(filePath, toFilePath);
        } catch (err) {
          return Promise.reject(`CopyFilePath: ${err}`);
        }
      }
      return Promise.resolve();
    } else {
      return Promise.reject('CopyFilePath: cannot get the ' + 'filePath');
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
      return Promise.reject(`CopyFile: ${err}`);
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
          'DeleteFileName: delete filePath ' + `failed ${err}`,
        );
      }
    } else {
      return Promise.reject('DeleteFileName: get filePath ' + 'failed');
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
          return Promise.reject('DeleteFilePath: ' + `${err}`);
        }
      } else {
        return Promise.resolve();
      }
    } else {
      return Promise.reject('DeleteFilePath: delete filePath' + 'failed');
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
        return Promise.reject(`RenameFileName: ${err}`);
      }
    } else {
      return Promise.reject('RenameFileName: filePaths do not ' + 'exist');
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
          return Promise.reject('RenameFilePath: ' + `${err}`);
        }
      } else {
        return Promise.reject('RenameFilePath: filePath ' + 'does not exist');
      }
    } else {
      return Promise.reject('RenameFilePath: filePath not found');
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
          return Promise.reject('RestoreFileName: ' + `${err}`);
        }
      } else {
        return Promise.reject(
          `RestoreFileName: ${fileName} ` + 'does not exist',
        );
      }
    } else {
      return Promise.reject(
        `RestoreFileName: ${mFileName} ` + 'does not exist',
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
    const sep = this.Path.sep;
    const path = directory.replace(/\/$/, '').split(sep);
    for (let i = 1; i <= path.length; i++) {
      const segment = path.slice(0, i).join(sep);
      segment.length > 0 && !this.NodeFs.existsSync(segment)
        ? this.NodeFs.mkdirSync(segment)
        : null;
    }
    return;
  }
}
