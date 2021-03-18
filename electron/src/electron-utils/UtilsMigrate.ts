import { UtilsFile } from './utilsFile';

export class UtilsMigrate {
  private _uFile: UtilsFile = new UtilsFile();

  public async addSQLiteSuffix(folderPath: string): Promise<void> {
    const toPath: string = this._uFile.getDatabasesPath();
    folderPath =
      folderPath !== 'default'
        ? this._uFile.getCustomerPath(folderPath)
        : toPath;
    // check if path exists
    const isPath: boolean = this._uFile.isPathExists(folderPath);
    if (!isPath) {
      return Promise.reject(new Error(`path ${folderPath} does not exists`));
    }
    // get the files
    const files: string[] = await this._uFile.getFileList(folderPath);
    files.forEach(async file => {
      let newFile: string = file;
      if (!file.includes('SQLite.db')) {
        const arFile: string[] = file.split('.db');
        if (arFile.length != 2) {
          return Promise.reject(new Error('Not a .db file'));
        }
        newFile = arFile[0].concat('SQLite.db');
        try {
          await this._uFile.copyFile(folderPath, file, toPath, newFile);
        } catch (err) {
          return Promise.reject(new Error(`addSQLiteSuffix: ${err.message} `));
        }
      }
    });
    return Promise.resolve();
  }
  public async deleteOldDatabases(folderPath: string): Promise<void> {
    const toPath: string = this._uFile.getDatabasesPath();
    folderPath =
      folderPath !== 'default'
        ? this._uFile.getCustomerPath(folderPath)
        : toPath;
    // check if path exists
    const isPath: boolean = this._uFile.isPathExists(folderPath);
    if (!isPath) {
      return Promise.reject(new Error(`path ${folderPath} does not exists`));
    }
    console.log(`$$folderPath ${folderPath}`);
    // get the files
    const files: string[] = await this._uFile.getFileList(folderPath);
    files.forEach(async file => {
      if (!file.includes('SQLite.db')) {
        try {
          console.log(`$$file ${file}`);
          const fPath: string = this._uFile.getCustomerFilePath(
            folderPath,
            file,
          );
          await this._uFile.deleteFilePath(fPath);
        } catch (err) {
          return Promise.reject(
            new Error(`deleteFilePath: ${folderPath} failed`),
          );
        }
      }
    });
    return Promise.resolve();
  }
}
