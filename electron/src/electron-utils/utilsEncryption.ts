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
      const tempPath: string = this.fileUtil.getFilePath('temp.db');
      try {
        await this.fileUtil.renameFilePath(pathDB, tempPath);
        const oDB = await this.sqliteUtil.openOrCreateDatabase(
          tempPath,
          '',
          false,
        );
        const mDB = await this.sqliteUtil.openOrCreateDatabase(
          pathDB,
          password,
          false,
        );
        await this.sqlcipherEncrypt(oDB, pathDB, password);
        oDB.close();
        this.fileUtil.deleteFilePath(tempPath);
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
    oDB.serialize(() => {
      let stmt = `ATTACH DATABASE '${pathDB}' `;
      stmt += `AS encrypted KEY '${password}';`;
      oDB.run(stmt);
      oDB.run("SELECT sqlcipher_export('encrypted');");
      oDB.run('DETACH DATABASE encrypted;');
    });
    return Promise.resolve();
  }
}
