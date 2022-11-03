import { UtilsFile } from './utilsFile';
import { UtilsSQLite } from './utilsSQLite';

export class UtilsEncryption {
  private fileUtil: UtilsFile = new UtilsFile();
  private sqliteUtil: UtilsSQLite = new UtilsSQLite();

  /**
   * EncryptDatabase
   * @param pathDB
   * @param password
   */
  public encryptDatabase(pathDB: string, password: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const msg: string = 'EncryptDatabase: ';
      let retB: boolean = this.fileUtil.isPathExists(pathDB);
      if (retB) {
        let tempPath: string = this.fileUtil.getFilePath('temp.db');
        try {
          await this.fileUtil.renameFilePath(pathDB, tempPath);
          const oDB = await this.sqliteUtil.openOrCreateDatabase(tempPath, '', false);
          const mDB = await this.sqliteUtil.openOrCreateDatabase(
            pathDB,
            password,
            false
          );
          await this.sqlcipherEncrypt(oDB, pathDB, password);
          oDB.close();
          this.fileUtil.deleteFilePath(tempPath);
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