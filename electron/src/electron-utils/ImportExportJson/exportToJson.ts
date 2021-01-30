import {
  JsonSQLite,
  JsonTable,
  JsonColumn,
  JsonIndex,
} from '../../definitions';
import { UtilsSQLite } from '../utilsSQLite';
import { UtilsJson } from './utilsJson';

export class ExportToJson {
  private _uSQLite: UtilsSQLite = new UtilsSQLite();
  private _uJson: UtilsJson = new UtilsJson();
  /**
   * CreateExportObject
   * @param mDB
   * @param sqlObj
   */
  public createExportObject(mDB: any, sqlObj: JsonSQLite): Promise<JsonSQLite> {
    return new Promise(async (resolve, reject) => {
      let retObj: JsonSQLite = {} as JsonSQLite;
      let tables: JsonTable[] = [];
      try {
        // get Table's name
        let resTables: any[] = await this.getTablesNameSQL(mDB);
        if (resTables.length === 0) {
          reject(new Error("createExportObject: table's names failed"));
        } else {
          switch (sqlObj.mode) {
            case 'partial': {
              tables = await this.getTablesPartial(mDB, resTables);
              break;
            }
            case 'full': {
              tables = await this.getTablesFull(mDB, resTables);
              break;
            }
            default: {
              reject(
                new Error(
                  'createExportObject: expMode ' + sqlObj.mode + ' not defined',
                ),
              );
              break;
            }
          }
          if (tables.length > 0) {
            retObj.database = sqlObj.database;
            retObj.version = sqlObj.version;
            retObj.encrypted = sqlObj.encrypted;
            retObj.mode = sqlObj.mode;
            retObj.tables = tables;
          }
        }
      } catch (err) {
        reject(new Error('createExportObject: ' + err.message));
      } finally {
        resolve(retObj);
      }
    });
  }
  /**
   * GetTablesNameSQL
   * @param mDb
   */
  public async getTablesNameSQL(mDb: any): Promise<any[]> {
    return new Promise(async (resolve, reject) => {
      let sql: string = 'SELECT name,sql FROM sqlite_master WHERE ';
      sql += "type='table' AND name NOT LIKE 'sync_table' ";
      sql += "AND name NOT LIKE '_temp_%' ";
      sql += "AND name NOT LIKE 'sqlite_%';";
      let retQuery: any[] = [];
      try {
        retQuery = await this._uSQLite.queryAll(mDb, sql, []);
      } catch (err) {
        reject(new Error(`getTablesNames: ${err.message}`));
      } finally {
        resolve(retQuery);
      }
    });
  }

  /**
   * GetSyncDate
   * @param mDb
   */
  public async getSyncDate(mDb: any): Promise<number> {
    return new Promise((resolve, reject) => {
      let retDate: number = -1;
      // get the last sync date
      let stmt = `SELECT sync_date FROM sync_table;`;
      mDb.get(stmt, [], (err: Error, row: any) => {
        // process the row here
        if (err) {
          reject(new Error(`GetSyncDate: ${err.message}`));
        } else {
          if (row != null) {
            const key: any = Object.keys(row)[0];
            retDate = row[key];
            resolve(retDate);
          } else {
            reject(new Error(`GetSyncDate: no syncDate`));
          }
        }
      });
    });
  }
  /**
   * GetTablesFull
   * @param mDb
   * @param resTables
   */
  private async getTablesFull(
    mDb: any,
    resTables: any[],
  ): Promise<JsonTable[]> {
    return new Promise(async (resolve, reject) => {
      let tables: JsonTable[] = [];
      try {
        // Loop through the tables
        for (let i: number = 0; i < resTables.length; i++) {
          let tableName: string;
          let sqlStmt: string;

          if (resTables[i].name) {
            tableName = resTables[i].name;
          } else {
            reject(new Error('GetTablesFull: no name'));
            break;
          }
          if (resTables[i].sql) {
            sqlStmt = resTables[i].sql;
          } else {
            reject(new Error('GetTablesFull: no sql'));
            break;
          }
          let table: JsonTable = {} as JsonTable;

          // create Table's Schema
          const schema: JsonColumn[] = await this.getSchema(sqlStmt, tableName);
          if (schema.length === 0) {
            reject(new Error('GetTablesFull: no Schema returned'));
            break;
          }
          // check schema validity
          await this._uJson.checkSchemaValidity(schema);
          // create Table's indexes if any
          const indexes: JsonIndex[] = await this.getIndexes(mDb, tableName);
          if (indexes.length > 0) {
            // check indexes validity
            await this._uJson.checkIndexesValidity(indexes);
          }
          // create Table's Data
          const query: string = `SELECT * FROM ${tableName};`;
          const values: any[] = await this.getValues(mDb, query, tableName);
          table.name = tableName;
          if (schema.length > 0) {
            table.schema = schema;
          } else {
            reject(new Error(`GetTablesFull: must contain schema`));
            break;
          }
          if (indexes.length > 0) {
            table.indexes = indexes;
          }
          if (values.length > 0) {
            table.values = values;
          }
          if (Object.keys(table).length <= 1) {
            reject(
              new Error(`GetTablesFull: table ${tableName} is not a jsonTable`),
            );
          }

          tables.push(table);
        }
      } catch (err) {
        reject(new Error(`GetTablesFull: ${err.message}`));
      } finally {
        resolve(tables);
      }
    });
  }
  /**
   * ModEmbeddedParentheses
   * @param sqlStmt
   */
  private modEmbeddedParentheses(sqlStmt: string): string {
    let stmt: string = sqlStmt;
    let openPar: number = sqlStmt.indexOf('(');
    if (openPar != -1) {
      let closePar: number = sqlStmt.lastIndexOf(')');
      let tStmt: string = sqlStmt.substring(openPar + 1, closePar);
      let mStmt: string = tStmt.replace(/,/g, '§');
      stmt = sqlStmt.replace(tStmt, mStmt);
    }
    return stmt;
  }
  /**
   * GetSchema
   * @param mDb
   * @param sqlStmt
   * @param tableName
   */
  private async getSchema(
    sqlStmt: string,
    tableName: string,
  ): Promise<JsonColumn[]> {
    return new Promise(async (resolve, reject) => {
      let schema: JsonColumn[] = [];
      // take the substring between parenthesis
      let openPar: number = sqlStmt.indexOf('(');
      let closePar: number = sqlStmt.lastIndexOf(')');
      let sstr: string = sqlStmt.substring(openPar + 1, closePar);
      // check if there is other parenthesis and replace the ',' by '§'
      sstr = this.modEmbeddedParentheses(sstr);
      let sch: Array<string> = sstr.replace(/\n/g, '').split(',');
      for (let j: number = 0; j < sch.length; j++) {
        const rstr = sch[j].trim();
        let idx = rstr.indexOf(' ');
        //find the index of the first
        let row: Array<string> = [rstr.slice(0, idx), rstr.slice(idx + 1)];
        if (row.length != 2) {
          reject(new Error(`GetSchema: table ${tableName} row length != 2`));
          break;
        }
        if (row[0].toUpperCase() == 'CONSTRAINT') {
          let k: number = row[1].indexOf(' ');
          let tRow: string[] = [row[1].slice(0, k), row[1].slice(k + 1)];
          schema.push({
            constraint: tRow[0],
            value: tRow[1].replace(/§/g, ','),
          });
        } else if (row[0].toUpperCase() == 'FOREIGN') {
          const oPar: number = rstr.indexOf('(');
          const cPar: number = rstr.indexOf(')');
          row = [rstr.slice(oPar + 1, cPar), rstr.slice(cPar + 2)];
          if (row.length != 2) {
            reject(new Error(`GetSchema: table ${tableName} row length != 2`));
            break;
          }
          schema.push({ foreignkey: row[0], value: row[1].replace(/§/g, ',') });
        } else {
          schema.push({ column: row[0], value: row[1].replace(/§/g, ',') });
        }
      }
      resolve(schema);
    });
  }

  /**
   * GetIndexes
   * @param mDb
   * @param sqlStmt
   * @param tableName
   */
  private async getIndexes(mDb: any, tableName: string): Promise<JsonIndex[]> {
    return new Promise(async (resolve, reject) => {
      let indexes: JsonIndex[] = [];
      try {
        let stmt: string = 'SELECT name,tbl_name,sql FROM sqlite_master WHERE ';
        stmt += `type = 'index' AND tbl_name = '${tableName}' `;
        stmt += `AND sql NOTNULL;`;
        const retIndexes = await this._uSQLite.queryAll(mDb, stmt, []);
        if (retIndexes.length > 0) {
          for (let j: number = 0; j < retIndexes.length; j++) {
            const keys: Array<string> = Object.keys(retIndexes[j]);
            if (keys.length === 3) {
              if (retIndexes[j]['tbl_name'] === tableName) {
                const sql: string = retIndexes[j]['sql'];
                const mode: string = sql.includes('UNIQUE') ? 'UNIQUE' : '';
                const oPar: number = sql.lastIndexOf('(');
                const cPar: number = sql.lastIndexOf(')');
                let index: JsonIndex = {} as JsonIndex;
                index.name = retIndexes[j]['name'];
                index.value = sql.slice(oPar + 1, cPar);
                if (mode.length > 0) index.mode = mode;
                indexes.push(index);
              } else {
                reject(
                  new Error(`GetIndexes: Table ${tableName} doesn't match`),
                );
                break;
              }
            } else {
              reject(
                new Error(`GetIndexes: Table ${tableName} creating indexes`),
              );
              break;
            }
          }
        }
      } catch (err) {
        reject(new Error(`GetIndexes: ${err.message}`));
      } finally {
        resolve(indexes);
      }
    });
  }
  /**
   * GetValues
   * @param mDb
   * @param query
   * @param tableName
   */
  private async getValues(
    mDb: any,
    query: string,
    tableName: string,
  ): Promise<any[]> {
    return new Promise(async (resolve, reject) => {
      let values: any[] = [];
      try {
        // get table column names and types
        const tableNamesTypes = await this._uJson.getTableColumnNamesTypes(
          mDb,
          tableName,
        );
        let rowNames: string[] = [];
        if (Object.keys(tableNamesTypes).includes('names')) {
          rowNames = tableNamesTypes.names;
        } else {
          reject(new Error(`GetValues: Table ${tableName} no names`));
        }
        const retValues = await this._uSQLite.queryAll(mDb, query, []);
        for (let j: number = 0; j < retValues.length; j++) {
          let row: any[] = [];
          for (let k: number = 0; k < rowNames.length; k++) {
            const nName: string = rowNames[k];
            if (Object.keys(retValues[j]).includes(nName)) {
              row.push(retValues[j][nName]);
            } else {
              row.push('NULL');
            }
          }
          values.push(row);
        }
      } catch (err) {
        reject(new Error(`GetValues: ${err.message}`));
      } finally {
        resolve(values);
      }
    });
  }

  /**
   * GetTablesPartial
   * @param mDb
   * @param resTables
   */
  private async getTablesPartial(
    mDb: any,
    resTables: any[],
  ): Promise<JsonTable[]> {
    return new Promise(async (resolve, reject) => {
      let tables: JsonTable[] = [];
      let modTables: any = {};
      let syncDate: number = 0;
      let modTablesKeys: string[] = [];
      try {
        // Get the syncDate and the Modified Tables
        const partialModeData: any = await this.getPartialModeData(
          mDb,
          resTables,
        );
        if (Object.keys(partialModeData).includes('syncDate')) {
          syncDate = partialModeData.syncDate;
        }
        if (Object.keys(partialModeData).includes('modTables')) {
          modTables = partialModeData.modTables;
          modTablesKeys = Object.keys(modTables);
        }
        // Loop trough tables
        for (let i: number = 0; i < resTables.length; i++) {
          let tableName: string = '';
          let sqlStmt: string = '';
          if (resTables[i].name) {
            tableName = resTables[i].name;
          } else {
            reject(new Error('GetTablesFull: no name'));
            break;
          }
          if (resTables[i].sql) {
            sqlStmt = resTables[i].sql;
          } else {
            reject(new Error('GetTablesFull: no sql'));
            break;
          }
          if (
            modTablesKeys.length == 0 ||
            modTablesKeys.indexOf(tableName) === -1 ||
            modTables[tableName] == 'No'
          ) {
            continue;
          }
          let table: JsonTable = {} as JsonTable;
          let schema: JsonColumn[] = [];
          let indexes: JsonIndex[] = [];
          table.name = resTables[i];
          if (modTables[table.name] === 'Create') {
            // create Table's Schema
            schema = await this.getSchema(sqlStmt, tableName);
            if (schema.length > 0) {
              // check schema validity
              await this._uJson.checkSchemaValidity(schema);
            }
            // create Table's indexes if any
            indexes = await this.getIndexes(mDb, tableName);
            if (indexes.length > 0) {
              // check indexes validity
              await this._uJson.checkIndexesValidity(indexes);
            }
          }
          // create Table's Data
          let query: string = '';
          if (modTables[tableName] === 'Create') {
            query = `SELECT * FROM ${tableName};`;
          } else {
            query =
              `SELECT * FROM ${tableName} ` +
              `WHERE last_modified > ${syncDate};`;
          }
          const values: any[] = await this.getValues(mDb, query, tableName);

          // check the table object validity
          table.name = tableName;
          if (schema.length > 0) {
            table.schema = schema;
          }
          if (indexes.length > 0) {
            table.indexes = indexes;
          }
          if (values.length > 0) {
            table.values = values;
          }
          if (Object.keys(table).length <= 1) {
            reject(
              new Error(
                `GetTablesPartial: table ${tableName} is not a jsonTable`,
              ),
            );
          }
          tables.push(table);
        }
      } catch (err) {
        reject(new Error(`GetTablesPartial: ${err.message}`));
      } finally {
        resolve(tables);
      }
    });
  }
  /**
   * GetPartialModeData
   * @param mDb
   * @param resTables
   */
  private async getPartialModeData(mDb: any, resTables: any[]): Promise<any> {
    return new Promise(async (resolve, reject) => {
      let retData: any = {};
      try {
        // get the synchronization date
        const syncDate: number = await this.getSyncDate(mDb);
        if (syncDate <= 0) {
          reject(new Error(`GetPartialModeData: no syncDate`));
        }
        // get the tables which have been updated
        // since last synchronization
        const modTables: any = await this.getTablesModified(
          mDb,
          resTables,
          syncDate,
        );
        if (modTables.length <= 0) {
          reject(new Error(`GetPartialModeData: no modTables`));
        }
        retData.syncDate = syncDate;
        retData.modTables = modTables;
      } catch (err) {
        reject(new Error(`GetPartialModeData: ${err.message}`));
      } finally {
        resolve(retData);
      }
    });
  }
  private async getTablesModified(
    db: any,
    tables: any[],
    syncDate: number,
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        let retModified: any = {};
        for (let i: number = 0; i < tables.length; i++) {
          let mode: string;
          // get total count of the table
          let stmt: string = 'SELECT count(*) AS tcount  ';
          stmt += `FROM ${tables[i].name};`;
          let retQuery: Array<any> = await this._uSQLite.queryAll(db, stmt, []);
          if (retQuery.length != 1) {
            reject(
              new Error('GetTableModified: total ' + 'count not returned'),
            );
          }
          const totalCount: number = retQuery[0]['tcount'];
          // get total count of modified since last sync
          stmt = 'SELECT count(*) AS mcount FROM ';
          stmt += `${tables[i].name} WHERE last_modified > `;
          stmt += `${syncDate};`;
          retQuery = await this._uSQLite.queryAll(db, stmt, []);
          if (retQuery.length != 1) break;
          const totalModifiedCount: number = retQuery[0]['mcount'];

          if (totalModifiedCount === 0) {
            mode = 'No';
          } else if (totalCount === totalModifiedCount) {
            mode = 'Create';
          } else {
            mode = 'Modified';
          }
          const key: string = tables[i].name;
          retModified[key] = mode;
          if (i === tables.length - 1) resolve(retModified);
        }
      } catch (err) {
        reject(new Error(`GetTableModified: ${err.message}`));
      }
    });
  }
}
