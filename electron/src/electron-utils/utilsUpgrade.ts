import type {
  capSQLiteVersionUpgrade,
  capSQLiteSet,
} from '../../../src/definitions';

import { UtilsJson } from './ImportExportJson/utilsJson';
import { UtilsDrop } from './utilsDrop';
import { UtilsFile } from './utilsFile';
import { UtilsSQLite } from './utilsSQLite';

export class UtilsUpgrade {
  private sqliteUtil: UtilsSQLite = new UtilsSQLite();
  private fileUtil: UtilsFile = new UtilsFile();
  private dropUtil: UtilsDrop = new UtilsDrop();
  private jsonUtil: UtilsJson = new UtilsJson();
  private _alterTables: Record<string, string[]> = {};
  private _commonColumns: Record<string, string[]> = {};

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
    dbName: string,
    curVersion: number,
    targetVersion: number,
  ): Promise<number> {
    const upgrade: capSQLiteVersionUpgrade = vUpgDict[curVersion];
    if (upgrade != null) {
      const keys: string[] = Object.keys(upgrade);
      if (!keys.includes('toVersion')) {
        return Promise.reject('onUpgrade: toVersion not given');
      }
      const toVersion: number = upgrade.toVersion;
      if (!keys.includes('statement')) {
        return Promise.reject('onUpgrade: statement not given');
      }
      const statement: string = upgrade.statement;
      let set: capSQLiteSet[] = [];
      if (keys.includes('set')) {
        set = upgrade.set;
      }
      if (targetVersion < toVersion) {
        let msg = 'Error: version mistmatch ';
        msg += 'Upgrade Statement would upgrade to ';
        msg += `version ${toVersion} , but target version `;
        msg += `is ${targetVersion} for database ${dbName}`;
        msg += ` and version ${curVersion}`;
        return Promise.reject(`onUpgrade: ${msg}`);
      }
      try {
        // set Foreign Keys Off
        await this.sqliteUtil.setForeignKeyConstraintsEnabled(mDB, false);
        await this.fileUtil.copyFileName(dbName, `backup-${dbName}`);
        const initChanges = await this.sqliteUtil.dbChanges(mDB);

        // Here we assume that all table schemas are given
        // in the upgrade statement
        if (statement.length > 0) {
          await this.executeStatementProcess(mDB, statement);

          // Here we assume that the Set contains only
          // - the data for new tables
          //   as INSERT statements
          // - the data for new columns in existing tables
          //   as UPDATE statements
          if (set.length > 0) {
            await this.executeSetProcess(mDB, set, toVersion);
          }
        }
        // set Foreign Keys On
        await this.sqliteUtil.setForeignKeyConstraintsEnabled(mDB, true);
        const changes = (await this.sqliteUtil.dbChanges(mDB)) - initChanges;
        return Promise.resolve(changes);
      } catch (err) {
        return Promise.reject(`onUpgrade: ${err}`);
      }
    } else {
      return Promise.reject('onUpgrade: upgrade not found');
    }
  }
  /**
   * ExecuteStatementProcess
   * @param mDB
   * @param statement
   */
  private async executeStatementProcess(
    mDB: any,
    statement: string,
  ): Promise<void> {
    try {
      // -> backup all existing tables  "tableName" in
      //    "temp_tableName"
      await this.backupTables(mDB);

      // -> Drop all Indexes
      await this.dropUtil.dropElements(mDB, 'index');
      // -> Drop all Triggers
      await this.dropUtil.dropElements(mDB, 'trigger');

      // -> Create new tables from upgrade.statement
      const changes: number = await this.sqliteUtil.execute(
        mDB,
        statement,
        false,
      );
      if (changes < 0) {
        return Promise.reject('ExecuteStatementProcess: ' + 'changes < 0');
      }
      // -> Create the list of table's common fields
      await this.findCommonColumns(mDB);

      // -> Update the new table's data from old table's data
      if (Object.keys(this._commonColumns).length > 0) {
        await this.updateNewTablesData(mDB);
      }

      return Promise.resolve();
    } catch (err) {
      return Promise.reject(`ExecuteStatementProcess: ${err}`);
    } finally {
      // -> Drop _temp_tables
      await this.dropUtil.dropTempTables(mDB, this._alterTables);
      // -> Do some cleanup
      this._alterTables = {};
      this._commonColumns = {};
    }
  }
  /**
   * ExecuteSetProcess
   * @param mDB
   * @param set
   * @param toVersion
   */
  private async executeSetProcess(
    mDB: any,
    set: capSQLiteSet[],
    toVersion: number,
  ): Promise<void> {
    try {
      // -> load new data
      const lastId = await this.sqliteUtil.executeSet(mDB, set, false);
      if (lastId < 0) {
        return Promise.reject('ExecuteSetProcess: lastId ' + '< 0');
      }
      // -> update database version
      await this.sqliteUtil.setVersion(mDB, toVersion);
      // -> update syncDate if any
      const retB = await this.jsonUtil.isTableExists(mDB, true, 'sync_table');
      if (retB) {
        const sDate: number = Math.round(new Date().getTime() / 1000);
        let stmt = 'UPDATE sync_table SET ';
        stmt += `sync_date = ${sDate} WHERE id = 1;`;
        const changes: number = await this.sqliteUtil.execute(mDB, stmt, false);
        if (changes < 0) {
          return Promise.reject('ExecuteSetProcess: changes ' + '< 0');
        }
      }
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(`ExecuteSetProcess: ${err}`);
    }
  }
  /**
   * BackupTables
   * @param mDB
   */
  private async backupTables(mDB: any): Promise<void> {
    const msg = 'BackupTables: ';
    try {
      const tables: string[] = await this.sqliteUtil.getTablesNames(mDB);
      for (const table of tables) {
        try {
          await this.backupTable(mDB, table);
        } catch (err) {
          return Promise.reject(`${msg}table ${table}: ` + `${err}`);
        }
      }
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(`BackupTables: ${err}`);
    }
  }
  /**
   * BackupTable
   * @param mDB
   * @param table
   */
  private async backupTable(mDB: any, table: string): Promise<void> {
    try {
      // start a transaction
      await this.sqliteUtil.beginTransaction(mDB, true);
      // get the table's column names
      const colNames: string[] = await this.getTableColumnNames(mDB, table);
      this._alterTables[`${table}`] = colNames;
      const tmpTable = `_temp_${table}`;
      // Drop the tmpTable if exists
      const delStmt = `DROP TABLE IF EXISTS ${tmpTable};`;
      await this.sqliteUtil.prepareRun(mDB, delStmt, [], false);
      // prefix the table with _temp_
      let stmt = `ALTER TABLE ${table} RENAME `;
      stmt += `TO ${tmpTable};`;
      const lastId: number = await this.sqliteUtil.prepareRun(
        mDB,
        stmt,
        [],
        false,
      );
      if (lastId < 0) {
        let msg = 'BackupTable: lastId < 0';
        try {
          await this.sqliteUtil.rollbackTransaction(mDB, true);
        } catch (err) {
          msg += `: ${err}`;
        }
        return Promise.reject(`${msg}`);
      } else {
        try {
          await this.sqliteUtil.commitTransaction(mDB, true);
        } catch (err) {
          return Promise.reject('BackupTable: ' + `${err}`);
        }
      }
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(`BackupTable: ${err}`);
    }
  }
  /**
   * GetTableColumnNames
   * @param mDB
   * @param tableName
   */
  private async getTableColumnNames(
    mDB: any,
    tableName: string,
  ): Promise<string[]> {
    let resQuery: any[] = [];
    const retNames: string[] = [];
    const query = `PRAGMA table_info('${tableName}');`;
    try {
      resQuery = await this.sqliteUtil.queryAll(mDB, query, []);
      if (resQuery.length > 0) {
        for (const query of resQuery) {
          retNames.push(query.name);
        }
      }
      return Promise.resolve(retNames);
    } catch (err) {
      return Promise.reject('GetTableColumnNames: ' + `${err}`);
    }
  }
  /**
   * FindCommonColumns
   * @param mDB
   */
  private async findCommonColumns(mDB: any): Promise<void> {
    try {
      // Get new table list
      const tables: any[] = await this.sqliteUtil.getTablesNames(mDB);
      if (tables.length === 0) {
        return Promise.reject(
          'FindCommonColumns: get ' + "table's names failed",
        );
      }
      for (const table of tables) {
        // get the column's name
        const tableNames: any = await this.getTableColumnNames(mDB, table);
        // find the common columns
        const keys: string[] = Object.keys(this._alterTables);
        if (keys.includes(table)) {
          this._commonColumns[table] = this.arraysIntersection(
            this._alterTables[table],
            tableNames,
          );
        }
      }
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(`FindCommonColumns: ${err}`);
    }
  }
  /**
   * ArraysIntersection
   * @param a1
   * @param a2
   */
  private arraysIntersection(a1: any[], a2: any[]): any[] {
    if (a1 != null && a2 != null) {
      const first = new Set(a1);
      const second = new Set(a2);
      return [...first].filter(item => second.has(item));
    } else {
      return [];
    }
  }
  /**
   * UpdateNewTablesData
   * @param mDB
   */
  private async updateNewTablesData(mDB: any): Promise<void> {
    try {
      // start a transaction
      await this.sqliteUtil.beginTransaction(mDB, true);

      const statements: string[] = [];
      const keys: string[] = Object.keys(this._commonColumns);
      keys.forEach(key => {
        const columns = this._commonColumns[key].join(',');
        let stmt = `INSERT INTO ${key} `;
        stmt += `(${columns}) `;
        stmt += `SELECT ${columns} FROM _temp_${key};`;
        statements.push(stmt);
      });
      const changes: number = await this.sqliteUtil.execute(
        mDB,
        statements.join('\n'),
        false,
      );
      if (changes < 0) {
        let msg: string = 'updateNewTablesData: ' + 'changes < 0';
        try {
          await this.sqliteUtil.rollbackTransaction(mDB, true);
        } catch (err) {
          msg += `: ${err}`;
        }
        return Promise.reject(`${msg}`);
      } else {
        try {
          await this.sqliteUtil.commitTransaction(mDB, true);
          return Promise.resolve();
        } catch (err) {
          return Promise.reject('updateNewTablesData: ' + `${err}`);
        }
      }
    } catch (err) {
      return Promise.reject('updateNewTablesData: ' + `${err}`);
    }
  }
}
