import type { capSQLiteVersionUpgrade } from '../../../src/definitions';

import type { Database } from './Database';
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
    mDB: Database,
    vUpgDict: Record<number, capSQLiteVersionUpgrade>,
    curVersion: number,
    targetVersion: number
  ): Promise<number> {
    let changes;
    const sortedKeys: Int32Array = new Int32Array(Object.keys(vUpgDict).map((item) => parseInt(item))).sort();
    for (const versionKey of sortedKeys) {
      if (versionKey > curVersion && versionKey <= targetVersion) {
        const statements = vUpgDict[versionKey].statements;
        if (statements.length === 0) {
          return Promise.reject('onUpgrade: statements not given');
        }

        try {
          // set Foreign Keys Off
          this.sqliteUtil.setForeignKeyConstraintsEnabled(mDB.database, false);
          const initChanges = this.sqliteUtil.dbChanges(mDB.database);
          await this.executeStatementsProcess(mDB, statements);

          this.sqliteUtil.setVersion(mDB.database, versionKey);
          // set Foreign Keys On
          this.sqliteUtil.setForeignKeyConstraintsEnabled(mDB.database, true);
          changes = (await this.sqliteUtil.dbChanges(mDB.database)) - initChanges;
        } catch (err) {
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
  private async executeStatementsProcess(mDB: Database, statements: string[]): Promise<void> {
    try {
      this.sqliteUtil.beginTransaction(mDB.database, true);
      mDB.setIsTransActive(true);
      for (const statement of statements) {
        this.sqliteUtil.execute(mDB.database, statement, false, true);
      }

      this.sqliteUtil.commitTransaction(mDB.database, true);
      mDB.setIsTransActive(false);
      return Promise.resolve();
    } catch (err) {
      this.sqliteUtil.rollbackTransaction(mDB.database, true);
      mDB.setIsTransActive(false);
      return Promise.reject(`ExecuteStatementProcess: ${err}`);
    }
  }
}
