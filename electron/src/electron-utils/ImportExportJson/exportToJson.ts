import type {
  JsonSQLite,
  JsonTable,
  JsonColumn,
  JsonIndex,
  JsonTrigger,
  JsonView,
} from '../../../../src/definitions';
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
    let views: JsonView[] = [];
    let errmsg = '';
    try {
      // get View's name
      views = await this.getViewsName(mDB);
      // get Table's name
      const resTables: any[] = await this.getTablesNameSQL(mDB);
      if (resTables.length === 0) {
        return Promise.reject("createExportObject: table's names failed");
      } else {
        const isTable = await this._uJson.isTableExists(
          mDB,
          true,
          'sync_table',
        );
        if (!isTable && sqlObj.mode === 'partial') {
          return Promise.reject('No sync_table available');
        }

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
          return Promise.reject(errmsg);
        }
        if (tables.length > 0) {
          retObj.database = sqlObj.database;
          retObj.version = sqlObj.version;
          retObj.encrypted = sqlObj.encrypted;
          retObj.mode = sqlObj.mode;
          retObj.tables = tables;
          if (views.length > 0) {
            retObj.views = views;
          }
        }
        return Promise.resolve(retObj);
      }
    } catch (err) {
      return Promise.reject('createExportObject: ' + err);
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
      return Promise.reject(`getTablesNameSQL: ${err}`);
    }
  }

  /**
   * GetViewsNameSQL
   * @param mDb
   */
  public async getViewsName(mDb: any): Promise<JsonView[]> {
    const views: JsonView[] = [];
    let sql = 'SELECT name,sql FROM sqlite_master WHERE ';
    sql += "type='view' AND name NOT LIKE 'sqlite_%';";
    let retQuery: any[] = [];
    try {
      retQuery = await this._uSQLite.queryAll(mDb, sql, []);
      for (const query of retQuery) {
        const view: JsonView = {} as JsonView;
        view.name = query.name;
        view.value = query.sql.substring(query.sql.indexOf('AS ') + 3);
        views.push(view);
      }
      return Promise.resolve(views);
    } catch (err) {
      return Promise.reject(`getViewsName: ${err}`);
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
          reject(`GetSyncDate: ${err.message}`);
        } else {
          if (row != null) {
            const key: any = Object.keys(row)[0];
            retDate = row[key];
            resolve(retDate);
          } else {
            reject(`GetSyncDate: no syncDate`);
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
    let errmsg = '';
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
        const schema: JsonColumn[] = await this.getSchema(sqlStmt);
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
        // create Table's triggers if any
        const triggers: JsonTrigger[] = await this.getTriggers(mDb, tableName);
        if (triggers.length > 0) {
          // check triggers validity
          await this._uJson.checkTriggersValidity(triggers);
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
        if (triggers.length > 0) {
          table.triggers = triggers;
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
        return Promise.reject(errmsg);
      }
      return Promise.resolve(tables);
    } catch (err) {
      return Promise.reject(`GetTablesFull: ${err}`);
    }
  }

  /**
   * GetSchema
   * @param mDb
   * @param sqlStmt
   * @param tableName
   */
  private async getSchema(
    sqlStmt: string /*,tableName: string,*/,
  ): Promise<JsonColumn[]> {
    const schema: JsonColumn[] = [];
    // take the substring between parenthesis
    const openPar: number = sqlStmt.indexOf('(');
    const closePar: number = sqlStmt.lastIndexOf(')');
    let sstr: string = sqlStmt.substring(openPar + 1, closePar);
    // check if there is other parenthesis and replace the ',' by '§'
    try {
      sstr = await this.modEmbeddedParentheses(sstr);
      const sch: string[] = sstr.split(',');
      // for each element of the array split the
      // first word as key
      for (const sc of sch) {
        const row: string[] = [];
        const scht: string = sc.trim();
        row[0] = scht.substring(0, scht.indexOf(' '));
        row[1] = scht.substring(scht.indexOf(' ') + 1);

        const jsonRow: JsonColumn = {} as JsonColumn;
        if (row[0].toUpperCase() === 'FOREIGN') {
          const oPar: number = sc.indexOf('(');
          const cPar: number = sc.indexOf(')');
          row[0] = sc.substring(oPar + 1, cPar);
          row[1] = sc.substring(cPar + 2);
          jsonRow['foreignkey'] = row[0];
        } else if (row[0].toUpperCase() === 'CONSTRAINT') {
          const tRow: string[] = [];
          const row1t: string = row[1].trim();
          tRow[0] = row1t.substring(0, row1t.indexOf(' '));
          tRow[1] = row1t.substring(row1t.indexOf(' ') + 1);
          row[0] = tRow[0];
          jsonRow['constraint'] = row[0];
          row[1] = tRow[1];
        } else {
          jsonRow['column'] = row[0];
        }
        jsonRow['value'] = row[1].replace(/§/g, ',');
        schema.push(jsonRow);
      }
      return Promise.resolve(schema);
    } catch (err) {
      return Promise.reject(err);
    }
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
          return Promise.reject(errmsg);
        }
      }
      return Promise.resolve(indexes);
    } catch (err) {
      return Promise.reject(`GetIndexes: ${err}`);
    }
  }
  /**
   * GetTriggers
   * @param mDb
   * @param sqlStmt
   * @param tableName
   */
  private async getTriggers(
    mDb: any,
    tableName: string,
  ): Promise<JsonTrigger[]> {
    const triggers: JsonTrigger[] = [];
    try {
      let stmt = 'SELECT name,tbl_name,sql FROM sqlite_master WHERE ';
      stmt += `type = 'trigger' AND tbl_name = '${tableName}' `;
      stmt += `AND sql NOT NULL;`;
      const retTriggers = await this._uSQLite.queryAll(mDb, stmt, []);
      if (retTriggers.length > 0) {
        for (const rTrg of retTriggers) {
          const keys: string[] = Object.keys(rTrg);
          if (keys.length === 3) {
            if (rTrg['tbl_name'] === tableName) {
              const sql: string = rTrg['sql'];

              const name: string = rTrg['name'];
              let sqlArr: string[] = sql.split(name);
              if (sqlArr.length != 2) {
                return Promise.reject(
                  `GetTriggers: sql split name does not return 2 values`,
                );
              }
              if (!sqlArr[1].includes(tableName)) {
                return Promise.reject(
                  `GetTriggers: sql split does not contains ${tableName}`,
                );
              }
              const timeEvent = sqlArr[1].split(tableName, 1)[0].trim();
              sqlArr = sqlArr[1].split(timeEvent + ' ' + tableName);
              if (sqlArr.length != 2) {
                return Promise.reject(
                  `GetTriggers: sql split tableName does not return 2 values`,
                );
              }
              let condition = '';
              let logic = '';
              if (sqlArr[1].trim().substring(0, 5).toUpperCase() !== 'BEGIN') {
                sqlArr = sqlArr[1].trim().split('BEGIN');
                if (sqlArr.length != 2) {
                  return Promise.reject(
                    `GetTriggers: sql split BEGIN does not return 2 values`,
                  );
                }
                condition = sqlArr[0].trim();
                logic = 'BEGIN' + sqlArr[1];
              } else {
                logic = sqlArr[1].trim();
              }

              const trigger: JsonTrigger = {} as JsonTrigger;
              trigger.name = name;
              trigger.logic = logic;
              if (condition.length > 0) trigger.condition = condition;
              trigger.timeevent = timeEvent;
              triggers.push(trigger);
            } else {
              return Promise.reject(
                `GetTriggers: Table ${tableName} doesn't match`,
              );
            }
          } else {
            return Promise.reject(
              `GetTriggers: Table ${tableName} creating indexes`,
            );
          }
        }
      }
      return Promise.resolve(triggers);
    } catch (err) {
      return Promise.reject(`GetTriggers: ${err}`);
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
        return Promise.reject(`GetValues: Table ${tableName} no names`);
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
      return Promise.reject(`GetValues: ${err}`);
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
        let triggers: JsonTrigger[] = [];
        table.name = rTable;
        if (modTables[table.name] === 'Create') {
          // create Table's Schema
          schema = await this.getSchema(sqlStmt);
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
          // create Table's triggers if any
          triggers = await this.getTriggers(mDb, tableName);
          if (triggers.length > 0) {
            // check triggers validity
            await this._uJson.checkTriggersValidity(triggers);
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
        if (triggers.length > 0) {
          table.triggers = triggers;
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
        return Promise.reject(errmsg);
      }
      return Promise.resolve(tables);
    } catch (err) {
      return Promise.reject(`GetTablesPartial: ${err}`);
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
        return Promise.reject(`GetPartialModeData: no syncDate`);
      }
      // get the tables which have been updated
      // since last synchronization
      const modTables: any = await this.getTablesModified(
        mDb,
        resTables,
        syncDate,
      );
      if (modTables.length <= 0) {
        return Promise.reject(`GetPartialModeData: no modTables`);
      }
      retData.syncDate = syncDate;
      retData.modTables = modTables;
      return Promise.resolve(retData);
    } catch (err) {
      return Promise.reject(`GetPartialModeData: ${err}`);
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
        return Promise.reject(errmsg);
      }
      return Promise.resolve(retModified);
    } catch (err) {
      return Promise.reject(`GetTableModified: ${err}`);
    }
  }
  private async modEmbeddedParentheses(sstr: string): Promise<string> {
    const oParArray: number[] = this.indexOfChar(sstr, '(');
    const cParArray: number[] = this.indexOfChar(sstr, ')');
    if (oParArray.length != cParArray.length) {
      return Promise.reject(
        "ModEmbeddedParentheses: Not same number of '(' & ')'",
      );
    }
    if (oParArray.length === 0) {
      return Promise.resolve(sstr);
    }
    let resStmt = sstr.substring(0, oParArray[0] - 1);
    for (let i = 0; i < oParArray.length; i++) {
      let str: string;
      if (i < oParArray.length - 1) {
        if (oParArray[i + 1] < cParArray[i]) {
          str = sstr.substring(oParArray[i] - 1, cParArray[i + 1]);
          i++;
        } else {
          str = sstr.substring(oParArray[i] - 1, cParArray[i]);
        }
      } else {
        str = sstr.substring(oParArray[i] - 1, cParArray[i]);
      }
      const newS = str.replace(/,/g, '§');
      resStmt += newS;
      if (i < oParArray.length - 1) {
        resStmt += sstr.substring(cParArray[i], oParArray[i + 1] - 1);
      }
    }
    resStmt += sstr.substring(cParArray[cParArray.length - 1], sstr.length);
    return Promise.resolve(resStmt);
  }
  private indexOfChar(str: string, char: string): number[] {
    const tmpArr: string[] = [...str];
    char = char.toLowerCase();
    return tmpArr.reduce(
      (results: number[], elem: string, idx: number) =>
        elem.toLowerCase() === char ? [...results, idx] : results,
      [],
    );
  }
}
