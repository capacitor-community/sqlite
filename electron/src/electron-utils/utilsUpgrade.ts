import type { capSQLiteVersionUpgrade } from '../../../src/definitions';

import { UtilsSQLite } from './utilsSQLite';

export class UtilsUpgrade {
  private sqliteUtil: UtilsSQLite = new UtilsSQLite();

  /**
   * OnUpgrade
   * @param mDB
   * @param vUpgDict
   * @param dbName
   * @param curVersion
   * @param targetVersion
   */
  public async onUpgrade(
    mDB: any,
    vUpgDict: Record<number, capSQLiteVersionUpgrade>,
    curVersion: number,
    targetVersion: number,
  ): Promise<number> {
    const sortedKeys: number[] = Object.keys(vUpgDict)
      .map(item => parseInt(item))
      .sort();

    for (const versionKey of sortedKeys) {
      if (versionKey > curVersion && versionKey <= targetVersion) {
        const statements = vUpgDict[versionKey].statements;

        if (statements.length === 0) {
          return Promise.reject('onUpgrade: statements not given');
        }

        try {
          await this.executeStatementsProcess(mDB, statements);

          await this.sqliteUtil.setVersion(mDB, versionKey);
        } catch (err) {
          return Promise.reject(`onUpgrade: ${err}`);
        }
      }
    }
  }
  /**
   * ExecuteStatementProcess
   * @param mDB
   * @param statements
   */
  private async executeStatementsProcess(
    mDB: any,
    statements: string[],
  ): Promise<void> {
    await this.sqliteUtil.beginTransaction(mDB, mDB._isDbOpen);

    try {
      for (const statement of statements) {
        await this.sqliteUtil.execute(mDB, statement, false);
      }

      await this.sqliteUtil.commitTransaction(mDB, mDB._isDbOpen);

      return Promise.resolve();
    } catch (err) {
      await this.sqliteUtil.rollbackTransaction(mDB, mDB._isDbOpen);

      return Promise.reject(`ExecuteStatementProcess: ${err}`);
    }
  }
}
