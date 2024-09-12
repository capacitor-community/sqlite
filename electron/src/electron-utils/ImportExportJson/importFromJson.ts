import type { JsonSQLite, Changes } from '../../../../src/definitions';
import type { Database } from '../Database';
import { UtilsDrop } from '../utilsDrop';
import { UtilsSQLite } from '../utilsSQLite';

import { UtilsJson } from './utilsJson';

export class ImportFromJson {
  private jsonUtil: UtilsJson = new UtilsJson();
  private sqliteUtil: UtilsSQLite = new UtilsSQLite();
  private dropUtil: UtilsDrop = new UtilsDrop();
  /**
   * CreateDatabaseSchema
   * @param mDB
   * @param jsonData
   */
  public createDatabaseSchema(mDB: Database, jsonData: JsonSQLite): number {
    let changes = -1;
    const version: number = jsonData.version;
    try {
      // set User Version PRAGMA
      this.sqliteUtil.setVersion(mDB.database, version);
      // DROP ALL when mode="full"
      if (jsonData.mode === 'full') {
        this.dropUtil.dropAll(mDB.database);
      }
      // create database schema
      changes = this.jsonUtil.createSchema(mDB, jsonData);
      return changes;
    } catch (err) {
      throw new Error('CreateDatabaseSchema: ' + `${err}`);
    }
  }
  public createTablesData(mDB: Database, jsonData: JsonSQLite): number {
    const msg = 'CreateTablesData';
    let results: Changes;
    let isValue = false;
    let message = '';
    let initChanges = -1;
    let changes = -1;

    try {
      initChanges = this.sqliteUtil.dbChanges(mDB.database);

      // start a transaction
      this.sqliteUtil.beginTransaction(mDB.database, true);
      mDB.setIsTransActive(true);
    } catch (err) {
      throw new Error(`${msg} ${err}`);
    }
    for (const jTable of jsonData.tables) {
      if (jTable.values != null && jTable.values.length >= 1) {
        // Create the table's data
        try {
          results = this.jsonUtil.createDataTable(mDB.database, jTable, jsonData.mode);
          if (results.lastId < 0) break;
          isValue = true;
        } catch (err) {
          message = err;
          isValue = false;
          break;
        }
      }
    }
    if (isValue) {
      try {
        this.sqliteUtil.commitTransaction(mDB.database, true);
        mDB.setIsTransActive(false);
        changes = this.sqliteUtil.dbChanges(mDB.database) - initChanges;

        return changes;
      } catch (err) {
        throw new Error(`${msg} ${err}`);
      }
    } else {
      if (message.length > 0) {
        try {
          this.sqliteUtil.rollbackTransaction(mDB.database, true);
          mDB.setIsTransActive(false);
          throw new Error(`${msg} ${message}`);
        } catch (err) {
          throw new Error(`${msg} ${err}: ${message}`);
        }
      } else {
        // case were no values given
        return 0;
      }
    }
  }
  /**
   * CreateViews
   * @param mDB
   * @param jsonData
   */
  public createViews(mDB: Database, jsonData: JsonSQLite): number {
    const msg = 'CreateViews';
    let isView = false;
    let message = '';
    let results: Changes;
    try {
      // start a transaction
      this.sqliteUtil.beginTransaction(mDB.database, true);
      mDB.setIsTransActive(true);
    } catch (err) {
      throw new Error(`${msg} ${err}`);
    }
    for (const jView of jsonData.views) {
      if (jView.value != null) {
        // Create the view
        try {
          results = this.jsonUtil.createView(mDB.database, jView);
          isView = true;
        } catch (err) {
          message = err;
          isView = false;
          break;
        }
      }
    }
    if (isView) {
      try {
        this.sqliteUtil.commitTransaction(mDB.database, true);
        mDB.setIsTransActive(false);
        return results.changes;
      } catch (err) {
        throw new Error(`${msg} ${err}`);
      }
    } else {
      if (message.length > 0) {
        try {
          this.sqliteUtil.rollbackTransaction(mDB.database, true);
          mDB.setIsTransActive(false);
          throw new Error(`${msg} ${message}`);
        } catch (err) {
          throw new Error(`${msg} ${err}: ${message}`);
        }
      } else {
        // case were no views given
        return 0;
      }
    }
  }
}
