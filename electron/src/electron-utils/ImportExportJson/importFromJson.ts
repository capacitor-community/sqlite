import { JsonSQLite } from '../../definitions';
import { UtilsJson } from './utilsJson';
import { UtilsSQLite } from '../utilsSQLite';
import { UtilsDrop } from '../utilsDrop';

export class ImportFromJson {
  private _uJson: UtilsJson = new UtilsJson();
  private _uSQLite: UtilsSQLite = new UtilsSQLite();
  private _uDrop: UtilsDrop = new UtilsDrop();
  /**
   * CreateDatabaseSchema
   * @param mDB
   * @param jsonData
   */
  public createDatabaseSchema(mDB: any, jsonData: JsonSQLite): Promise<number> {
    return new Promise(async (resolve, reject) => {
      let changes: number = -1;
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
        resolve(changes);
      } catch (err) {
        reject(new Error('CreateDatabaseSchema: ' + `${err.message}`));
      }
    });
  }
  public createTablesData(mDB: any, jsonData: JsonSQLite): Promise<number> {
    return new Promise(async (resolve, reject) => {
      let changes: number = 0;
      let isValue: boolean = false;
      let lastId: number = -1;
      let msg: string = '';
      let initChanges: number = -1;
      try {
        initChanges = await this._uSQLite.dbChanges(mDB);
        // start a transaction
        await this._uSQLite.beginTransaction(mDB, true);
      } catch (err) {
        reject(new Error(`createTablesData: ${err.message}`));
      }
      for (let i: number = 0; i < jsonData.tables.length; i++) {
        if (
          jsonData.tables[i].values != null &&
          jsonData.tables[i].values!.length >= 1
        ) {
          // Create the table's data
          try {
            lastId = await this._uJson.createDataTable(
              mDB,
              jsonData.tables[i],
              jsonData.mode,
            );
            if (lastId < 0) break;
            isValue = true;
          } catch (err) {
            msg = err.message;
            isValue = false;
            break;
          }
        }
      }
      if (isValue) {
        try {
          await this._uSQLite.commitTransaction(mDB, true);
          changes = (await this._uSQLite.dbChanges(mDB)) - initChanges;
          resolve(changes);
        } catch (err) {
          reject(new Error('createTablesData: ' + `${err.message}`));
        }
      } else {
        try {
          await this._uSQLite.rollbackTransaction(mDB, true);
          reject(new Error(`createTablesData: ${msg}`));
        } catch (err) {
          reject(new Error('createTablesData: ' + `${err.message}: ${msg}`));
        }
      }
    });
  }
}
