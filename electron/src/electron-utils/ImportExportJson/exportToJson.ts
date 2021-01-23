import type {
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
  public async createExportObject(
    mDB: any,
    sqlObj: JsonSQLite,
  ): Promise<JsonSQLite> {
    const retObj: JsonSQLite = {} as JsonSQLite;
    let tables: JsonTable[] = [];
    let errmsg = '';
    try {
      // get Table's name
      const resTables: any[] = await this.getTablesNameSQL(mDB);
      if (resTables.length === 0) {
        return Promise.reject(
          new Error("createExportObject: table's names failed"),
        );
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
            errmsg =
              'createExportObject: expMode ' + sqlObj.mode + ' not defined';
            break;
          }
        }
        if (errmsg.length > 0) {
          return Promise.reject(new Error(errmsg));
        }
        if (tables.length > 0) {
          retObj.database = sqlObj.database;
          retObj.version = sqlObj.version;
          retObj.encrypted = sqlObj.encrypted;
          retObj.mode = sqlObj.mode;
          retObj.tables = tables;
        }
        return Promise.resolve(retObj);
      }
    } catch (err) {
      return Promise.reject(new Error('createExportObject: ' + err.message));
    }
  }
  /**
   * GetTablesNameSQL
   * @param mDb
   */
  public async getTablesNameSQL(mDb: any): Promise<any[]> {
    let sql = 'SELECT name,sql FROM sqlite_master WHERE ';
    sql += "type='table' AND name NOT LIKE 'sync_table' ";
    sql += "AND name NOT LIKE '_temp_%' ";
    sql += "AND name NOT LIKE 'sqlite_%';";
    let retQuery: any[] = [];
    try {
      retQuery = await this._uSQLite.queryAll(mDb, sql, []);
      return Promise.resolve(retQuery);
    } catch (err) {
      return Promise.reject(new Error(`getTablesNames: ${err.message}`));
    }
  }

  /**
   * GetSyncDate
   * @param mDb
   */
  public async getSyncDate(mDb: any): Promise<number> {
    return new Promise((resolve, reject) => {
      let retDate = -1;
      // get the last sync date
      const stmt = `SELECT sync_date FROM sync_table;`;
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
    const tables: JsonTable[] = [];
    let errmsg = ';';
    try {
      // Loop through the tables
      for (const rTable of resTables) {
        let tableName: string;
        let sqlStmt: string;

        if (rTable.name) {
          tableName = rTable.name;
        } else {
          errmsg = 'GetTablesFull: no name';
          break;
        }
        if (rTable.sql) {
          sqlStmt = rTable.sql;
        } else {
          errmsg = 'GetTablesFull: no sql';
          break;
        }
        const table: JsonTable = {} as JsonTable;

        // create Table's Schema
        const schema: JsonColumn[] = await this.getSchema(sqlStmt, tableName);
        if (schema.length === 0) {
          errmsg = 'GetTablesFull: no Schema returned';
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
        const query = `SELECT * FROM ${tableName};`;
        const values: any[] = await this.getValues(mDb, query, tableName);
        table.name = tableName;
        if (schema.length > 0) {
          table.schema = schema;
        } else {
          errmsg = `GetTablesFull: must contain schema`;
          break;
        }
        if (indexes.length > 0) {
          table.indexes = indexes;
        }
        if (values.length > 0) {
          table.values = values;
        }
        if (Object.keys(table).length <= 1) {
          errmsg = `GetTablesFull: table ${tableName} is not a jsonTable`;
          break;
        }

        tables.push(table);
      }
      if (errmsg.length > 0) {
        return Promise.reject(new Error(errmsg));
      }
      return Promise.resolve(tables);
    } catch (err) {
      return Promise.reject(new Error(`GetTablesFull: ${err.message}`));
    }
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
    const schema: JsonColumn[] = [];
    // take the substring between parenthesis
    const openPar: number = sqlStmt.indexOf('(');
    const closePar: number = sqlStmt.lastIndexOf(')');
    const sstr: string = sqlStmt.substring(openPar + 1, closePar);
    let errmsg = '';
    let isStrfTime = false;
    if (sstr.includes('strftime')) isStrfTime = true;
    let sch: string[] = sstr.replace(/\n/g, '').split(',');
    if (isStrfTime) {
      const nSch: string[] = [];
      for (let j = 0; j < sch.length; j++) {
        if (sch[j].includes('strftime')) {
          nSch.push(sch[j] + ',' + sch[j + 1]);
          j++;
        } else {
          nSch.push(sch[j]);
        }
      }
      sch = [...nSch];
    }
    for (const rSch of sch) {
      const rstr = rSch.trim();
      const idx = rstr.indexOf(' ');
      //find the index of the first
      let row: string[] = [rstr.slice(0, idx), rstr.slice(idx + 1)];
      if (row.length != 2) {
        errmsg = `GetSchema: table ${tableName} row length != 2`;
        break;
      }
      if (row[0].toUpperCase() != 'FOREIGN') {
        schema.push({ column: row[0], value: row[1] });
      } else {
        const oPar: number = rstr.indexOf('(');
        const cPar: number = rstr.indexOf(')');
        row = [rstr.slice(oPar + 1, cPar), rstr.slice(cPar + 2)];
        if (row.length != 2) {
          errmsg = `GetSchema: table ${tableName} row length != 2`;
          break;
        }
        schema.push({ foreignkey: row[0], value: row[1] });
      }
    }
    if (errmsg.length > 0) {
      return Promise.reject(new Error(errmsg));
    }
    return Promise.resolve(schema);
  }

  /**
   * GetIndexes
   * @param mDb
   * @param sqlStmt
   * @param tableName
   */
  private async getIndexes(mDb: any, tableName: string): Promise<JsonIndex[]> {
    const indexes: JsonIndex[] = [];
    let errmsg = '';
    try {
      let stmt = 'SELECT name,tbl_name,sql FROM sqlite_master WHERE ';
      stmt += `type = 'index' AND tbl_name = '${tableName}' `;
      stmt += `AND sql NOTNULL;`;
      const retIndexes = await this._uSQLite.queryAll(mDb, stmt, []);
      if (retIndexes.length > 0) {
        for (const rIndex of retIndexes) {
          const keys: string[] = Object.keys(rIndex);
          if (keys.length === 3) {
            if (rIndex['tbl_name'] === tableName) {
              const sql: string = rIndex['sql'];
              const mode: string = sql.includes('UNIQUE') ? 'UNIQUE' : '';
              const oPar: number = sql.lastIndexOf('(');
              const cPar: number = sql.lastIndexOf(')');
              const index: JsonIndex = {} as JsonIndex;
              index.name = rIndex['name'];
              index.value = sql.slice(oPar + 1, cPar);
              if (mode.length > 0) index.mode = mode;
              indexes.push(index);
            } else {
              errmsg = `GetIndexes: Table ${tableName} doesn't match`;
              break;
            }
          } else {
            errmsg = `GetIndexes: Table ${tableName} creating indexes`;
            break;
          }
        }
        if (errmsg.length > 0) {
          return Promise.reject(new Error(errmsg));
        }
      }
      return Promise.resolve(indexes);
    } catch (err) {
      return Promise.reject(new Error(`GetIndexes: ${err.message}`));
    }
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
    const values: any[] = [];
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
        return Promise.reject(
          new Error(`GetValues: Table ${tableName} no names`),
        );
      }
      const retValues = await this._uSQLite.queryAll(mDb, query, []);
      for (const rValue of retValues) {
        const row: any[] = [];
        for (const rName of rowNames) {
          if (Object.keys(rValue).includes(rName)) {
            row.push(rValue[rName]);
          } else {
            row.push('NULL');
          }
        }
        values.push(row);
      }
      return Promise.resolve(values);
    } catch (err) {
      return Promise.reject(new Error(`GetValues: ${err.message}`));
    }
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
    const tables: JsonTable[] = [];
    let modTables: any = {};
    let syncDate = 0;
    let modTablesKeys: string[] = [];
    let errmsg = '';
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
      for (const rTable of resTables) {
        let tableName = '';
        let sqlStmt = '';
        if (rTable.name) {
          tableName = rTable.name;
        } else {
          errmsg = 'GetTablesFull: no name';
          break;
        }
        if (rTable.sql) {
          sqlStmt = rTable.sql;
        } else {
          errmsg = 'GetTablesFull: no sql';
          break;
        }
        if (
          modTablesKeys.length == 0 ||
          modTablesKeys.indexOf(tableName) === -1 ||
          modTables[tableName] == 'No'
        ) {
          continue;
        }
        const table: JsonTable = {} as JsonTable;
        let schema: JsonColumn[] = [];
        let indexes: JsonIndex[] = [];
        table.name = rTable;
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
        let query = '';
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
          errmsg = `GetTablesPartial: table ${tableName} is not a jsonTable`;
          break;
        }
        tables.push(table);
      }
      if (errmsg.length > 0) {
        return Promise.reject(new Error(errmsg));
      }
      return Promise.resolve(tables);
    } catch (err) {
      return Promise.reject(new Error(`GetTablesPartial: ${err.message}`));
    }
  }
  /**
   * GetPartialModeData
   * @param mDb
   * @param resTables
   */
  private async getPartialModeData(mDb: any, resTables: any[]): Promise<any> {
    const retData: any = {};
    try {
      // get the synchronization date
      const syncDate: number = await this.getSyncDate(mDb);
      if (syncDate <= 0) {
        return Promise.reject(new Error(`GetPartialModeData: no syncDate`));
      }
      // get the tables which have been updated
      // since last synchronization
      const modTables: any = await this.getTablesModified(
        mDb,
        resTables,
        syncDate,
      );
      if (modTables.length <= 0) {
        return Promise.reject(new Error(`GetPartialModeData: no modTables`));
      }
      retData.syncDate = syncDate;
      retData.modTables = modTables;
      return Promise.resolve(retData);
    } catch (err) {
      return Promise.reject(new Error(`GetPartialModeData: ${err.message}`));
    }
  }
  private async getTablesModified(
    db: any,
    tables: any[],
    syncDate: number,
  ): Promise<any> {
    let errmsg = '';
    try {
      const retModified: any = {};
      for (const rTable of tables) {
        let mode: string;
        // get total count of the table
        let stmt = 'SELECT count(*) AS tcount  ';
        stmt += `FROM ${rTable.name};`;
        let retQuery: any[] = await this._uSQLite.queryAll(db, stmt, []);
        if (retQuery.length != 1) {
          errmsg = 'GetTableModified: total ' + 'count not returned';
          break;
        }
        const totalCount: number = retQuery[0]['tcount'];
        // get total count of modified since last sync
        stmt = 'SELECT count(*) AS mcount FROM ';
        stmt += `${rTable.name} WHERE last_modified > `;
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
        const key: string = rTable.name;
        retModified[key] = mode;
      }
      if (errmsg.length > 0) {
        return Promise.reject(new Error(errmsg));
      }
      return Promise.resolve(retModified);
    } catch (err) {
      return Promise.reject(new Error(`GetTableModified: ${err.message}`));
    }
  }
}
