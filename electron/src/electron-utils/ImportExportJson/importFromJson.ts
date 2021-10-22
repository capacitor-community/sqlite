import type { JsonSQLite } from '../../../../src/definitions';
import { UtilsDrop } from '../utilsDrop';
import { UtilsSQLite } from '../utilsSQLite';

import { UtilsJson } from './utilsJson';

export class ImportFromJson {
  private _uJson: UtilsJson = new UtilsJson();
  private _uSQLite: UtilsSQLite = new UtilsSQLite();
  private _uDrop: UtilsDrop = new UtilsDrop();
  /**
   * CreateDatabaseSchema
   * @param mDB
   * @param jsonData
   */
  public async createDatabaseSchema(
    mDB: any,
    jsonData: JsonSQLite,
  ): Promise<number> {
    let changes = -1;
    const version: number = jsonData.version;
    try {
      // set Foreign Keys On
      await this._uSQLite.setForeignKeyConstraintsEnabled(mDB, true);
      // set User Version PRAGMA
      await this._uSQLite.setVersion(mDB, version);
      // DROP ALL when mode="full"
      if (jsonData.mode === 'full') {
        await this._uDrop.dropAll(mDB);
      }
      // create database schema
      changes = await this._uJson.createSchema(mDB, jsonData);
      return Promise.resolve(changes);
    } catch (err) {
      return Promise.reject('CreateDatabaseSchema: ' + `${err}`);
    }
  }
  public async createTablesData(
    mDB: any,
    jsonData: JsonSQLite,
  ): Promise<number> {
    let changes = 0;
    let isValue = false;
    let lastId = -1;
    let msg = '';
    let initChanges = -1;
    try {
      initChanges = await this._uSQLite.dbChanges(mDB);
      // start a transaction
      await this._uSQLite.beginTransaction(mDB, true);
    } catch (err) {
      return Promise.reject(`createTablesData: ${err}`);
    }
    for (const jTable of jsonData.tables) {
      if (jTable.values != null && jTable.values.length >= 1) {
        // Create the table's data
        try {
          lastId = await this._uJson.createDataTable(
            mDB,
            jTable,
            jsonData.mode,
          );
          if (lastId < 0) break;
          isValue = true;
        } catch (err) {
          msg = err;
          isValue = false;
          break;
        }
      }
    }
    if (isValue) {
      try {
        await this._uSQLite.commitTransaction(mDB, true);
        changes = (await this._uSQLite.dbChanges(mDB)) - initChanges;
        return Promise.resolve(changes);
      } catch (err) {
        return Promise.reject('createTablesData: ' + `${err}`);
      }
    } else {
      if (msg.length > 0) {
        try {
          await this._uSQLite.rollbackTransaction(mDB, true);
          return Promise.reject(new Error(`createTablesData: ${msg}`));
        } catch (err) {
          return Promise.reject('createTablesData: ' + `${err}: ${msg}`);
        }
      } else {
        // case were no values given
        return Promise.resolve(0);
      }
    }
  }
  /**
   * CreateViews
   * @param mDB
   * @param jsonData
   */
  public async createViews(mDB: any, jsonData: JsonSQLite): Promise<number> {
    let isView = false;
    let msg = '';
    let initChanges = -1;
    let changes = -1;
    try {
      initChanges = await this._uSQLite.dbChanges(mDB);
      // start a transaction
      await this._uSQLite.beginTransaction(mDB, true);
    } catch (err) {
      return Promise.reject(`createViews: ${err}`);
    }
    for (const jView of jsonData.views) {
      if (jView.value != null) {
        // Create the view
        try {
          await this._uJson.createView(mDB, jView);
          isView = true;
        } catch (err) {
          msg = err;
          isView = false;
          break;
        }
      }
    }
    if (isView) {
      try {
        await this._uSQLite.commitTransaction(mDB, true);
        changes = (await this._uSQLite.dbChanges(mDB)) - initChanges;
        return Promise.resolve(changes);
      } catch (err) {
        return Promise.reject('createViews: ' + `${err}`);
      }
    } else {
      if (msg.length > 0) {
        try {
          await this._uSQLite.rollbackTransaction(mDB, true);
          return Promise.reject(new Error(`createViews: ${msg}`));
        } catch (err) {
          return Promise.reject('createViews: ' + `${err}: ${msg}`);
        }
      } else {
        // case were no views given
        return Promise.resolve(0);
      }
    }
  }
}
