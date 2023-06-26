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
        await this.fileUtil.copyFilePath(pathDB, tempPath, true);

        const oDB = await this.sqliteUtil.openOrCreateDatabase(
          tempPath,
          '',
          false,
        );
        const mDB = await this.sqliteUtil.openOrCreateDatabase(
          pathDB,
          '',
          true,
        );
        this.sqliteUtil.pragmaReKey(oDB,'',password);
        this.sqliteUtil.closeDB(oDB);
        this.sqliteUtil.closeDB(mDB);
        this.fileUtil.deleteFilePath(pathDB);
        this.fileUtil.renameFilePath(tempPath, pathDB);
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
/*  private async sqlcipherEncrypt(
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
  */
}
