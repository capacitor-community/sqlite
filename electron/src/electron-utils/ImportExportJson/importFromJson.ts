import type { JsonSQLite, Changes } from '../../../../src/definitions';
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
  public createDatabaseSchema(mDB: any, jsonData: JsonSQLite): number {
    let changes = -1;
    const version: number = jsonData.version;
    try {
      // set User Version PRAGMA
      this.sqliteUtil.setVersion(mDB, version);
      // DROP ALL when mode="full"
      if (jsonData.mode === 'full') {
        this.dropUtil.dropAll(mDB);
      }
      // create database schema
      changes = this.jsonUtil.createSchema(mDB, jsonData);
      return changes;
    } catch (err) {
      throw new Error('CreateDatabaseSchema: ' + `${err}`);
    }
  }
  public createTablesData(mDB: any, jsonData: JsonSQLite): number {
    const msg = 'CreateTablesData';
    let results: Changes;
    let isValue = false;
    let message = '';
    try {
      // start a transaction
      this.sqliteUtil.beginTransaction(mDB, true);
    } catch (err) {
      throw new Error(`${msg} ${err}`);
    }
    for (const jTable of jsonData.tables) {
      if (jTable.values != null && jTable.values.length >= 1) {
        // Create the table's data
        try {
          results = this.jsonUtil.createDataTable(mDB, jTable, jsonData.mode);
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
        this.sqliteUtil.commitTransaction(mDB, true);
        return results.changes;
      } catch (err) {
        throw new Error(`${msg} ${err}`);
      }
    } else {
      if (message.length > 0) {
        try {
          this.sqliteUtil.rollbackTransaction(mDB, true);
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
  public createViews(mDB: any, jsonData: JsonSQLite): number {
    const msg = 'CreateViews';
    let isView = false;
    let message = '';
    let results: Changes;
    try {
      // start a transaction
      this.sqliteUtil.beginTransaction(mDB, true);
    } catch (err) {
      throw new Error(`${msg} ${err}`);
    }
    for (const jView of jsonData.views) {
      if (jView.value != null) {
        // Create the view
        try {
          results = this.jsonUtil.createView(mDB, jView);
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
        this.sqliteUtil.commitTransaction(mDB, true);
        return results.changes;
      } catch (err) {
        throw new Error(`${msg} ${err}`);
      }
    } else {
      if (message.length > 0) {
        try {
          this.sqliteUtil.rollbackTransaction(mDB, true);
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