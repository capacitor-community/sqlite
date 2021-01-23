import { UtilsFile } from './utilsFile';
import { UtilsSQLite } from './utilsSQLite';

export class UtilsEncryption {
  private _uFile: UtilsFile = new UtilsFile();
  private _uSQLite: UtilsSQLite = new UtilsSQLite();

  /**
   * EncryptDatabase
   * @param pathDB
   * @param password
   */
  public async encryptDatabase(
    pathDB: string,
    password: string,
  ): Promise<void> {
    const msg = 'EncryptDatabase: ';
    const retB: boolean = this._uFile.isPathExists(pathDB);
    if (retB) {
      const tempPath: string = this._uFile.getFilePath('temp.db');
      try {
        await this._uFile.renameFilePath(pathDB, tempPath);
        const oDB = await this._uSQLite.openOrCreateDatabase(tempPath, '');
        const mDB = await this._uSQLite.openOrCreateDatabase(pathDB, password);
        await this.sqlcipherEncrypt(oDB, pathDB, password);
        oDB.close();
        this._uFile.deleteFilePath(tempPath);
        mDB.close();
        return Promise.resolve();
      } catch (err) {
        return Promise.reject(new Error(`${msg} ${err.message} `));
      }
    } else {
      return Promise.reject(
        new Error(`${msg}file path ${pathDB} ` + 'does not exist'),
      );
    }
  }
  /**
   * SqlcipherEncrypt
   * @param oDB
   * @param pathDB
   * @param password
   */
  private async sqlcipherEncrypt(
    oDB: any,
    pathDB: string,
    password: string,
  ): Promise<void> {
    try {
      oDB.serialize(() => {
        let stmt = `ATTACH DATABASE '${pathDB}' `;
        stmt += `AS encrypted KEY '${password}';`;
        oDB.run(stmt);
        oDB.run("SELECT sqlcipher_export('encrypted');");
        oDB.run('DETACH DATABASE encrypted;');
      });
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  }
}
