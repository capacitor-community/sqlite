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
  public async encryptDatabase(
    pathDB: string,
    password: string,
  ): Promise<void> {
    const msg = 'EncryptDatabase: ';
    const retB: boolean = this.fileUtil.isPathExists(pathDB);
    if (retB) {
      try {
        const mDB = await this.sqliteUtil.openOrCreateDatabase(
          pathDB,
          '',
          false,
        );
        this.sqliteUtil.pragmaReKey(mDB, '', password);
        this.sqliteUtil.closeDB(mDB);
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
}