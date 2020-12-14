import { UtilsFile } from './utilsFile';
import { UtilsSQLite } from './utilsSQLite';

//1234567890123456789012345678901234567890123456789012345678901234567890
export class UtilsEncryption {
  private _uFile: UtilsFile = new UtilsFile();
  private _uSQLite: UtilsSQLite = new UtilsSQLite();

  /**
   * EncryptDatabase
   * @param pathDB
   * @param password
   */
  public encryptDatabase(pathDB: string, password: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const msg: string = 'EncryptDatabase: ';
      let retB: boolean = this._uFile.isPathExists(pathDB);
      if (retB) {
        let tempPath: string = this._uFile.getFilePath('temp.db');
        try {
          await this._uFile.renameFilePath(pathDB, tempPath);
          const oDB = await this._uSQLite.openOrCreateDatabase(tempPath, '');
          const mDB = await this._uSQLite.openOrCreateDatabase(
            pathDB,
            password,
          );
          await this.sqlcipherEncrypt(oDB, pathDB, password);
          oDB.close();
          this._uFile.deleteFilePath(tempPath);
          mDB.close();
          resolve();
        } catch (err) {
          reject(new Error(`${msg} ${err.message} `));
        }
      } else {
        reject(new Error(`${msg}file path ${pathDB} ` + 'does not exist'));
      }
    });
  }
  /**
   * SqlcipherEncrypt
   * @param oDB
   * @param pathDB
   * @param password
   */
  private sqlcipherEncrypt(
    oDB: any,
    pathDB: string,
    password: string,
  ): Promise<void> {
    return new Promise(async resolve => {
      oDB.serialize(() => {
        let stmt = `ATTACH DATABASE '${pathDB}' `;
        stmt += `AS encrypted KEY '${password}';`;
        oDB.run(stmt);
        oDB.run("SELECT sqlcipher_export('encrypted');");
        oDB.run('DETACH DATABASE encrypted;');
      });
      resolve();
    });
  }
}
