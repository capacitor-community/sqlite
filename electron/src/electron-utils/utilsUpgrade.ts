import type { capSQLiteVersionUpgrade, capSQLiteSet } from '../definitions';

import { UtilsJson } from './ImportExportJson/utilsJson';
import { UtilsDrop } from './utilsDrop';
import { UtilsFile } from './utilsFile';
import { UtilsSQLite } from './utilsSQLite';

export class UtilsUpgrade {
  private _uSQLite: UtilsSQLite = new UtilsSQLite();
  private _uFile: UtilsFile = new UtilsFile();
  private _uDrop: UtilsDrop = new UtilsDrop();
  private _uJson: UtilsJson = new UtilsJson();
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
        return Promise.reject(new Error('onUpgrade: toVersion not given'));
      }
      const toVersion: number = upgrade.toVersion;
      if (!keys.includes('statement')) {
        return Promise.reject(new Error('onUpgrade: statement not given'));
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
        return Promise.reject(new Error(`onUpgrade: ${msg}`));
      }
      try {
        // set Foreign Keys Off
        await this._uSQLite.setForeignKeyConstraintsEnabled(mDB, false);
        await this._uFile.copyFileName(dbName, `backup-${dbName}`);
        const initChanges = await this._uSQLite.dbChanges(mDB);

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
        await this._uSQLite.setForeignKeyConstraintsEnabled(mDB, true);
        const changes = (await this._uSQLite.dbChanges(mDB)) - initChanges;
        return Promise.resolve(changes);
      } catch (err) {
        return Promise.reject(new Error(`onUpgrade: ${err.message}`));
      }
    } else {
      return Promise.reject(new Error('onUpgrade: upgrade not found'));
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
      await this._uDrop.dropElements(mDB, 'index');
      // -> Drop all Triggers
      await this._uDrop.dropElements(mDB, 'trigger');

      // -> Create new tables from upgrade.statement
      const changes: number = await this._uSQLite.execute(mDB, statement);
      if (changes < 0) {
        return Promise.reject(
          new Error('ExecuteStatementProcess: ' + 'changes < 0'),
        );
      }
      // -> Create the list of table's common fields
      await this.findCommonColumns(mDB);

      // -> Update the new table's data from old table's data
      if (Object.keys(this._commonColumns).length > 0) {
        await this.updateNewTablesData(mDB);
      }

      // -> Drop _temp_tables
      await this._uDrop.dropTempTables(mDB, this._alterTables);
      // -> Do some cleanup
      this._alterTables = {};
      this._commonColumns = {};
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(
        new Error(`ExecuteStatementProcess: ${err.message}`),
      );
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
      const lastId = await this._uSQLite.executeSet(mDB, set);
      if (lastId < 0) {
        return Promise.reject(new Error('ExecuteSetProcess: lastId ' + '< 0'));
      }
      // -> update database version
      await this._uSQLite.setVersion(mDB, toVersion);
      // -> update syncDate if any
      const retB = await this._uJson.isTableExists(mDB, true, 'sync_table');
      if (retB) {
        const sDate: number = Math.round(new Date().getTime() / 1000);
        let stmt = 'UPDATE sync_table SET ';
        stmt += `sync_date = ${sDate} WHERE id = 1;`;
        const changes: number = await this._uSQLite.execute(mDB, stmt);
        if (changes < 0) {
          return Promise.reject(
            new Error('ExecuteSetProcess: changes ' + '< 0'),
          );
        }
      }
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(new Error(`ExecuteSetProcess: ${err.message}`));
    }
  }
  /**
   * BackupTables
   * @param mDB
   */
  private async backupTables(mDB: any): Promise<void> {
    const msg = 'BackupTables: ';
    try {
      const tables: string[] = await this._uDrop.getTablesNames(mDB);
      for (const table of tables) {
        try {
          await this.backupTable(mDB, table);
        } catch (err) {
          return Promise.reject(
            new Error(`${msg}table ${table}: ` + `${err.message}`),
          );
        }
      }
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(new Error(`BackupTables: ${err.message}`));
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
      await this._uSQLite.beginTransaction(mDB, true);
      // get the table's column names
      const colNames: string[] = await this.getTableColumnNames(mDB, table);
      this._alterTables[`${table}`] = colNames;
      // prefix the table with _temp_
      let stmt = `ALTER TABLE ${table} RENAME `;
      stmt += `TO _temp_${table};`;
      const lastId: number = await this._uSQLite.prepareRun(mDB, stmt, []);
      if (lastId < 0) {
        let msg = 'BackupTable: lastId < 0';
        try {
          await this._uSQLite.rollbackTransaction(mDB, true);
        } catch (err) {
          msg += `: ${err.message}`;
        }
        return Promise.reject(new Error(`${msg}`));
      } else {
        try {
          await this._uSQLite.commitTransaction(mDB, true);
        } catch (err) {
          return Promise.reject(new Error('BackupTable: ' + `${err.message}`));
        }
      }
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(new Error(`BackupTable: ${err.message}`));
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
      resQuery = await this._uSQLite.queryAll(mDB, query, []);
      if (resQuery.length > 0) {
        for (const query of resQuery) {
          retNames.push(query.name);
        }
      }
      return Promise.resolve(retNames);
    } catch (err) {
      return Promise.reject(
        new Error('GetTableColumnNames: ' + `${err.message}`),
      );
    }
  }
  /**
   * FindCommonColumns
   * @param mDB
   */
  private async findCommonColumns(mDB: any): Promise<void> {
    try {
      // Get new table list
      const tables: any[] = await this._uDrop.getTablesNames(mDB);
      if (tables.length === 0) {
        return Promise.reject(
          new Error('FindCommonColumns: get ' + "table's names failed"),
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
      return Promise.reject(new Error(`FindCommonColumns: ${err.message}`));
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
      await this._uSQLite.beginTransaction(mDB, true);

      const statements: string[] = [];
      const keys: string[] = Object.keys(this._commonColumns);
      keys.forEach(key => {
        const columns = this._commonColumns[key].join(',');
        let stmt = `INSERT INTO ${key} `;
        stmt += `(${columns}) `;
        stmt += `SELECT ${columns} FROM _temp_${key};`;
        statements.push(stmt);
      });
      const changes: number = await this._uSQLite.execute(
        mDB,
        statements.join('\n'),
      );
      if (changes < 0) {
        let msg: string = 'updateNewTablesData: ' + 'changes < 0';
        try {
          await this._uSQLite.rollbackTransaction(mDB, true);
        } catch (err) {
          msg += `: ${err.message}`;
        }
        return Promise.reject(new Error(`${msg}`));
      } else {
        try {
          await this._uSQLite.commitTransaction(mDB, true);
          return Promise.resolve();
        } catch (err) {
          return Promise.reject(
            new Error('updateNewTablesData: ' + `${err.message}`),
          );
        }
      }
    } catch (err) {
      return Promise.reject(
        new Error('updateNewTablesData: ' + `${err.message}`),
      );
    }
  }
}
