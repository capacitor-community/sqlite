import { open, unlink } from 'node:fs/promises';

export class UtilsFile {
  pathDB = 'Databases';
  Path: any = null;
  NodeFs: any = null;
  NodeFetch: any = null;
  JSZip: any = null;
  Os: any = null;
  Electron: any = null;
  AppName = '';
  HomeDir = '';
  osType: string;
  sep = '/';
  appPath: string;
  capConfig: any;
  isEncryption = false;

  constructor() {
    this.Path = require('path');
    this.NodeFs = require('fs');
    this.NodeFetch = require('node-fetch');
    this.Os = require('os');
    this.JSZip = require('jszip');
    this.Electron = require('electron');

    this.HomeDir = this.Os.homedir();
    const dir: string = __dirname;
    const idx: number = dir.indexOf('\\');
    if (idx != -1) this.sep = '\\';
    this.appPath = this.Electron.app.getAppPath();

    const rawdata = this.NodeFs.readFileSync(this.Path.resolve(this.appPath, 'package.json'));
    this.AppName = JSON.parse(rawdata).name;
    const pathToBuild = this.Path.join(this.appPath, 'build');
    if (this.NodeFs.existsSync(this.Path.join(pathToBuild, 'capacitor.config.js'))) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      this.capConfig = require(this.Path.join(pathToBuild, 'capacitor.config.js')).default;
    } else {
      this.capConfig = JSON.parse(
        this.NodeFs.readFileSync(this.Path.join(this.appPath, 'capacitor.config.json')).toString()
      );
    }
    this.isEncryption = this.capConfig.plugins.CapacitorSQLite.electronIsEncryption
      ? this.capConfig.plugins.CapacitorSQLite.electronIsEncryption
      : false;
    this.osType = this.Os.type();
    switch (this.osType) {
      case 'Darwin':
        this.pathDB = this.capConfig.plugins.CapacitorSQLite.electronMacLocation
          ? this.capConfig.plugins.CapacitorSQLite.electronMacLocation
          : 'Databases';
        break;
      case 'Linux':
        this.pathDB = this.capConfig.plugins.CapacitorSQLite.electronLinuxLocation
          ? this.capConfig.plugins.CapacitorSQLite.electronLinuxLocation
          : 'Databases';
        break;
      case 'Windows_NT':
        this.pathDB = this.capConfig.plugins.CapacitorSQLite.electronWindowsLocation
          ? this.capConfig.plugins.CapacitorSQLite.electronWindowsLocation
          : 'Databases';
        break;
      default:
        console.log('other operating system');
    }
  }
  /**
   * Get isEncryption from config
   * @returns
   */
  public getIsEncryption(): boolean {
    return this.isEncryption;
  }
  /**
   * GetExtName
   * @param filePath
   * @returns
   */
  public getExtName(filePath: string): string {
    const matches = filePath.match(/\.([a-zA-Z0-9]+)(?:[\\?#]|$)/);
    return matches ? `.${matches[1].toLowerCase()}` : ''; // returns the matched extension in lowercase

    //    return this.Path.extname(filePath);
  }
  public getBaseName(filePath: string): string {
    const decodedUrl = decodeURIComponent(filePath); // Decode the URL component
    const baseName = this.Path.basename(decodedUrl, this.Path.extname(filePath));
    return baseName;
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
   * GetCachePath
   * get the database cache folder path
   */
  public getCachePath(): string {
    let retPath = '';
    const databasePath = this.getDatabasesPath();
    retPath = this.Path.join(databasePath, 'cache');
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
    const webDir = this.capConfig.webDir;
    const dir = webDir === 'www' ? 'src' : 'public';
    let mAppPath = this.appPath;
    if (this.Path.basename(this.appPath) === 'electron') {
      mAppPath = this.Path.dirname(this.appPath);
    }
    retPath = this.Path.resolve(mAppPath, dir, 'assets', 'databases');
    return retPath;
  }
  /**
   * SetPathSuffix
   * @param db
   */
  public setPathSuffix(db: string): string {
    let toDb: string = db;
    const ext = '.db';
    const dirName = this.Path.dirname(db);
    const baseName = this.getBaseName(db);
    if (this.getExtName(db) === ext) {
      if (!baseName.includes('SQLite')) {
        const dbName = `${baseName}SQLite`;
        toDb = `${this.Path.join(dirName, dbName)}${ext}`;
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
      if (this.getExtName(file) == '.db' || this.getExtName(file) == '.zip') dbs.push(file);
    });
    return Promise.resolve(dbs);
  }
  /**
   * CopyFromAssetToDatabase
   * @param db
   * @param overwrite
   */
  public async copyFromAssetToDatabase(db: string, overwrite: boolean): Promise<void> {
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
  public async unzipDatabase(db: string, fPath: string, overwrite: boolean): Promise<void> {
    const pZip: string = this.Path.join(fPath, db);

    try {
      // Read the Zip file
      const data = await this.NodeFs.promises.readFile(pZip);

      const zip = new this.JSZip();
      const contents = await zip.loadAsync(data);

      // Create an array to store promises for writing files
      const writePromises: Promise<void>[] = [];

      Object.keys(contents.files).forEach((filename) => {
        writePromises.push(
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
                await this.NodeFs.promises.writeFile(pDb, content);
              }
            })
        );
      });

      // Wait for all write promises to resolve
      await Promise.all(writePromises);

      return Promise.resolve();
    } catch (err) {
      console.log(err);
      return Promise.reject(`unzipDatabase ${JSON.stringify(err)}`);
    }
  }
  /**
   * CopyFileName
   * Copy file name
   * @param fileName
   * @param toFileName
   */
  public async copyFileName(fileName: string, toFileName: string): Promise<void> {
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
  public async copyFilePath(filePath: string, toFilePath: string, overwrite: boolean): Promise<void> {
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
  public async copyFile(fromPath: string, fromFile: string, toPath: string, toFile: string): Promise<void> {
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
        return Promise.reject('DeleteFileName: delete filePath ' + `failed ${err}`);
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
    let unlinkRetries = 50000;

    /**
     * On windows, the file lock behaves unpredictable. Often it claims a databsae file is locked / busy, although
     * the file stream is already closed.
     * Even though we already checked the status with the `waitForFilePathLock()` method previously.
     *
     * The only way to handle this reliably is to retry deletion until it works.
     */
    const deleteFile = async () => {
      try {
        await unlink(filePath);
      } catch (err) {
        unlinkRetries--;
        if (unlinkRetries > 0) {
          await deleteFile();
        } else {
          throw err;
        }
      }
    };

    if (filePath.length !== 0) {
      // check if path exists
      const isPath = this.isPathExists(filePath);
      if (isPath) {
        try {
          await this.waitForFilePathLock(filePath);
          // actually delete the file
          await deleteFile();
          return Promise.resolve();
        } catch (err) {
          return Promise.reject(`DeleteFilePath: ${err}`);
        }
      } else {
        return Promise.resolve();
      }
    } else {
      return Promise.reject('DeleteFilePath: delete filePath' + 'failed');
    }
  }

  public async waitForFilePathLock(filePath: string, timeoutMS = 4000): Promise<void> {
    let timeIsOver = false;

    setTimeout(() => {
      timeIsOver = true;
    }, timeoutMS);

    return new Promise((resolve, reject) => {
      const check = async () => {
        if (timeIsOver) {
          reject(
            new Error(`WaitForFilePathLock: The resource is still locked / busy after ${timeoutMS} milliseconds.`)
          );
          return;
        }

        // check if path exists
        const isPath = this.isPathExists(filePath);

        // The file path does not exist. A non existant path cannot be locked.
        if (!isPath) {
          resolve();
          return;
        }

        try {
          const stream = await open(filePath, 'r+');

          // We need to close the stream afterwards, because otherwise, we're locking the file
          await stream.close();

          resolve();
        } catch (err) {
          if (err.code === 'EBUSY') {
            // The resource is busy. Retry in 100ms
            setTimeout(() => {
              check();
            }, 100);
            return;
          } else if (err.code === 'ENOENT') {
            // The file does not exist (anymore). So it cannot be locked.
            resolve();
            return;
          } else {
            // Something else went wrong.
            reject(new Error(`WaitForFilePathLock: Error while checking the file: ${err}`));
          }
        }
      };

      check();
    });
  }

  /**
   * RenameFileName
   * @param fileName
   * @param toFileName
   */
  public async renameFileName(fileName: string, toFileName: string): Promise<void> {
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
  public async renameFilePath(filePath: string, toFilePath: string): Promise<void> {
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
        return Promise.reject(`RenameFilePath: ${filePath} does not exist`);
      }
    } else {
      return Promise.reject('RenameFilePath: filePath not found');
    }
  }
  public async moveDatabaseFromCache(): Promise<void> {
    const cachePath: string = this.getCachePath();
    const databasePath: string = this.getDatabasesPath();
    const dbCacheList: string[] = await this.getFileList(cachePath);
    for (const name of dbCacheList) {
      const ext: string = this.getExtName(name);
      const fromDBName: string = this.Path.join(cachePath, name);
      if (ext === '.db') {
        const pDb: string = this.setPathSuffix(this.Path.join(databasePath, name));
        try {
          await this.renameFilePath(fromDBName, pDb);
        } catch (err) {
          return Promise.reject('moveDatabaseFromCache: ' + `${err}`);
        }
      }
      if (ext === '.zip') {
        try {
          await this.deleteFilePath(fromDBName);
        } catch (err) {
          return Promise.reject('moveDatabaseFromCache: ' + `${err}`);
        }
      }
    }

    return Promise.resolve();
  }
  /**
   * RestoreFileName
   * @param fileName
   * @param prefix
   */
  public async restoreFileName(fileName: string, prefix: string): Promise<void> {
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
        return Promise.reject(`RestoreFileName: ${fileName} ` + 'does not exist');
      }
    } else {
      return Promise.reject(`RestoreFileName: ${mFileName} ` + 'does not exist');
    }
  }
  /**
   * DownloadFileFromHTTP
   * @param url
   * @param path
   */
  public async downloadFileFromHTTP(url: string, pathFolder: string): Promise<void> {
    const res: any = await this.NodeFetch(url);
    const ext: string = this.getExtName(url);
    const dbName: string = this.getBaseName(url);
    const filePath = `${this.Path.join(pathFolder, dbName)}${ext}`;
    const fileStream: any = this.NodeFs.createWriteStream(filePath);
    await new Promise((resolve, reject) => {
      res.body.pipe(fileStream);
      res.body.on('error', reject);
      fileStream.on('finish', resolve);
    });
  }
  public readFileAsPromise(path: string, options: { start: number; end: number }): Promise<string> {
    return new Promise((resolve, reject) => {
      const fileStream = this.NodeFs.createReadStream(path, options);

      const chunks: any[] = [];
      fileStream.on('data', (data: any) => {
        chunks.push(data);
      });

      fileStream.on('close', () => {
        resolve(chunks.toString());
      });

      fileStream.on('error', (err: any) => {
        const msg = err.message ? err.message : err;
        reject(msg);
      });
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
    const sep = this.Path.sep;
    const path = directory.replace(/\/$/, '').split(sep);
    for (let i = 1; i <= path.length; i++) {
      const segment = path.slice(0, i).join(sep);
      segment.length > 0 && !this.NodeFs.existsSync(segment) ? this.NodeFs.mkdirSync(segment) : null;
    }
    return;
  }
}
