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
    let changes;
    const sortedKeys: Int32Array = new Int32Array(
      Object.keys(vUpgDict).map(item => parseInt(item)),
    ).sort();
    console.log(`@@@ sortedKeys: ${sortedKeys}`);
    for (const versionKey of sortedKeys) {
      if (versionKey > curVersion && versionKey <= targetVersion) {
        const statements = vUpgDict[versionKey].statements;
        if (statements.length === 0) {
          return Promise.reject('onUpgrade: statements not given');
        }

        try {
          // set Foreign Keys Off
          await this.sqliteUtil.setForeignKeyConstraintsEnabled(mDB, false);
          const initChanges = await this.sqliteUtil.dbChanges(mDB);
          await this.executeStatementsProcess(mDB, statements);

          await this.sqliteUtil.setVersion(mDB, versionKey);
          // set Foreign Keys On
          await this.sqliteUtil.setForeignKeyConstraintsEnabled(mDB, true);
          changes = (await this.sqliteUtil.dbChanges(mDB)) - initChanges;
        } catch (err) {
          console.log(`@@@@ onUpgrade: ${err}`);
          return Promise.reject(`onUpgrade: ${err}`);
        }
      }
    }

    return Promise.resolve(changes);
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
    try {
      await this.sqliteUtil.beginTransaction(mDB, true);
      for (const statement of statements) {
        console.log(`@@@ statement: ${statement}`);
        await this.sqliteUtil.execute(mDB, statement, false);
      }

      await this.sqliteUtil.commitTransaction(mDB, true);

      return Promise.resolve();
    } catch (err) {
      await this.sqliteUtil.rollbackTransaction(mDB, true);
      console.log(`@@@ ExecuteStatementProcess: ${err}`);

      return Promise.reject(`ExecuteStatementProcess: ${err}`);
    }
  }
}
