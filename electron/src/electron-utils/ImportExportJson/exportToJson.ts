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
  private sqliteUtil: UtilsSQLite = new UtilsSQLite();
  private jsonUtil: UtilsJson = new UtilsJson();
  /**
   * CreateExportObject
   * @param mDB
   * @param sqlObj
   */
  public createExportObject(mDB: any, sqlObj: JsonSQLite): JsonSQLite {
    const msg = 'CreateExportObject';
    const retObj: JsonSQLite = {} as JsonSQLite;
    let tables: JsonTable[] = [];
    let views: JsonView[] = [];
    let errmsg = '';
    try {
      // get View's name
      views = this.getViewsName(mDB);
      // get Table's name
      const resTables: any[] = this.getTablesNameSQL(mDB);
      if (resTables.length === 0) {
        throw new Error(`${msg} table's names failed`);
      } else {
        const isTable = this.jsonUtil.isTableExists(mDB, true, 'sync_table');
        if (!isTable && sqlObj.mode === 'partial') {
          throw new Error(`${msg} No sync_table available`);
        }

        switch (sqlObj.mode) {
          case 'partial': {
            tables = this.getTablesPartial(mDB, resTables);
            break;
          }
          case 'full': {
            tables = this.getTablesFull(mDB, resTables);
            break;
          }
          default: {
            errmsg = `${msg} expMode ${sqlObj.mode} not defined`;
            break;
          }
        }
        if (errmsg.length > 0) {
          throw new Error(errmsg);
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
        return retObj;
      }
    } catch (err) {
      throw new Error(`${msg} ${err}`);
    }
  }
  /**
   * GetTablesNameSQL
   * @param mDb
   */
  public getTablesNameSQL(mDb: any): any[] {
    const msg = 'GetTablesNameSQL';
    let sql = 'SELECT name,sql FROM sqlite_master WHERE ';
    sql += "type='table' AND name NOT LIKE 'sync_table' ";
    sql += "AND name NOT LIKE '_temp_%' ";
    sql += "AND name NOT LIKE 'sqlite_%';";
    let retQuery: any[] = [];
    try {
      retQuery = this.sqliteUtil.queryAll(mDb, sql, []);
      return retQuery;
    } catch (err) {
      throw new Error(`${msg} ${err}`);
    }
  }
  public getLastExportDate(mDb: any): number {
    const msg = 'GetLastExportDate';
    let retDate = -1;
    try {
      // get the last sync date
      const stmt = `SELECT sync_date FROM sync_table WHERE id = ?;`;
      const row = this.sqliteUtil.queryOne(mDb, stmt, [2]);
      if (row != null) {
        const key: any = Object.keys(row)[0];
        retDate = row[key];
      }
      return retDate;
    } catch (err) {
      throw new Error(`${msg} ${err}`);
    }
  }
  /**
   * SetLastExportDate
   * @param mDb
   * @param lastExportedDate
   * @returns
   */
  public setLastExportDate(mDb: any, lastExportedDate: string): any {
    const msg = 'SetLastExportDate';
    try {
      const isTable = this.jsonUtil.isTableExists(mDb, true, 'sync_table');
      if (!isTable) {
        throw new Error(`${msg} No sync_table available`);
      }
      const sDate: number = Math.round(
        new Date(lastExportedDate).getTime() / 1000,
      );
      let stmt = '';
      if (this.getLastExportDate(mDb) > 0) {
        stmt = `UPDATE sync_table SET sync_date = ${sDate} WHERE id = 2;`;
      } else {
        stmt = `INSERT INTO sync_table (sync_date) VALUES (${sDate});`;
      }
      const results = this.sqliteUtil.execute(mDb, stmt, false);
      if (results.changes < 0) {
        return { result: false, message: `${msg} failed` };
      } else {
        return { result: true };
      }
    } catch (err) {
      return {
        result: false,
        message: `${msg} ${err.message}`,
      };
    }
  }
  public delExportedRows(mDb: any): void {
    const msg = 'DelExportedRows';
    let lastExportDate: number;
    try {
      // check if synchronization table exists
      const isTable = this.jsonUtil.isTableExists(mDb, true, 'sync_table');
      if (!isTable) {
        throw new Error(`${msg} No sync_table available`);
      }
      // get the last export date
      lastExportDate = this.getLastExportDate(mDb);
      if (lastExportDate < 0) {
        throw new Error(`${msg} no last exported date available`);
      }
      // get the table' name list
      const resTables: any[] = this.sqliteUtil.getTablesNames(mDb);
      if (resTables.length === 0) {
        throw new Error(`${msg} No table's names returned`);
      }
      // Loop through the tables
      for (const table of resTables) {
        // define the delete statement
        const delStmt = `DELETE FROM ${table}
              WHERE sql_deleted = 1 AND last_modified < ${lastExportDate};`;
        const results = this.sqliteUtil.prepareRun(
          mDb,
          delStmt,
          [],
          true,
          'no',
        );
        if (results.lastId < 0) {
          throw new Error(`${msg} lastId < 0`);
        }
      }
      return;
    } catch (err) {
      throw new Error(`${msg} failed: ${err.message}`);
    }
  }
  /**
   * GetViewsNameSQL
   * @param mDb
   */
  public getViewsName(mDb: any): JsonView[] {
    const views: JsonView[] = [];
    let sql = 'SELECT name,sql FROM sqlite_master WHERE ';
    sql += "type='view' AND name NOT LIKE 'sqlite_%';";
    let retQuery: any[] = [];
    try {
      retQuery = this.sqliteUtil.queryAll(mDb, sql, []);
      for (const query of retQuery) {
        const view: JsonView = {} as JsonView;
        view.name = query.name;
        view.value = query.sql.substring(query.sql.indexOf('AS ') + 3);
        views.push(view);
      }
      return views;
    } catch (err) {
      throw new Error(`getViewsName: ${err}`);
    }
  }
  /**
   * GetSyncDate
   * @param mDb
   */
  public getSyncDate(mDb: any): number {
    const msg = 'GetSyncDate';
    let retDate = -1;
    // get the last sync date
    const stmt = `SELECT sync_date FROM sync_table WHERE id = ?;`;
    const row = this.sqliteUtil.queryOne(mDb, stmt, [1]);
    if (row != null) {
      const key: any = Object.keys(row)[0];
      retDate = row[key];
      return retDate;
    } else {
      throw new Error(`${msg} no syncDate`);
    }
  }
  /**
   * GetTablesFull
   * @param mDb
   * @param resTables
   */
  private getTablesFull(mDb: any, resTables: any[]): JsonTable[] {
    const msg = 'GetTablesFull';
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
          errmsg = `${msg} no name`;
          break;
        }
        if (rTable.sql) {
          sqlStmt = rTable.sql;
        } else {
          errmsg = `${msg} no sql`;
          break;
        }
        const table: JsonTable = {} as JsonTable;

        // create Table's Schema
        const schema: JsonColumn[] = this.getSchema(sqlStmt);
        if (schema.length === 0) {
          errmsg = `${msg} no Schema returned`;
          break;
        }
        // check schema validity
        this.jsonUtil.checkSchemaValidity(schema);
        // create Table's indexes if any
        const indexes: JsonIndex[] = this.getIndexes(mDb, tableName);
        if (indexes.length > 0) {
          // check indexes validity
          this.jsonUtil.checkIndexesValidity(indexes);
        }
        // create Table's triggers if any
        const triggers: JsonTrigger[] = this.getTriggers(mDb, tableName);
        if (triggers.length > 0) {
          // check triggers validity
          this.jsonUtil.checkTriggersValidity(triggers);
        }
        // create Table's Data
        const query = `SELECT * FROM ${tableName};`;
        const values: any[] = this.jsonUtil.getValues(mDb, query, tableName);
        table.name = tableName;
        if (schema.length > 0) {
          table.schema = schema;
        } else {
          errmsg = `${msg} must contain schema`;
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
          errmsg = `${msg} table ${tableName} is not a jsonTable`;
          break;
        }

        tables.push(table);
      }
      if (errmsg.length > 0) {
        throw new Error(errmsg);
      }
      return tables;
    } catch (err) {
      throw new Error(`${msg} ${err}`);
    }
  }

  /**
   * GetSchema
   * @param mDb
   * @param sqlStmt
   * @param tableName
   */
  private getSchema(sqlStmt: string /*,tableName: string,*/): JsonColumn[] {
    const msg = 'GetSchema';
    const schema: JsonColumn[] = [];
    // take the substring between parenthesis
    const openPar: number = sqlStmt.indexOf('(');
    const closePar: number = sqlStmt.lastIndexOf(')');
    let sstr: string = sqlStmt.substring(openPar + 1, closePar);
    // check if there is other parenthesis and replace the ',' by '§'
    try {
      sstr = this.modEmbeddedParentheses(sstr);
      const sch: string[] = sstr.split(',');
      // for each element of the array split the
      // first word as key
      for (const sc of sch) {
        const row: string[] = [];
        const scht: string = sc.replace(/\n/g, '').trim();
        row[0] = scht.substring(0, scht.indexOf(' '));
        row[1] = scht.substring(scht.indexOf(' ') + 1);

        const jsonRow: JsonColumn = {} as JsonColumn;
        if (row[0].toUpperCase() === 'FOREIGN') {
          const oPar: number = scht.indexOf('(');
          const cPar: number = scht.indexOf(')');
          const fk = scht.substring(oPar + 1, cPar);
          const fknames: string[] = fk.split('§');
          row[0] = fknames.join(',');
          row[0] = row[0].replace(/, /g, ',');
          row[1] = scht.substring(cPar + 2);
          jsonRow['foreignkey'] = row[0];
        } else if (row[0].toUpperCase() === 'PRIMARY') {
          const oPar: number = scht.indexOf('(');
          const cPar: number = scht.indexOf(')');
          const pk: string = scht.substring(oPar + 1, cPar);
          const pknames: string[] = pk.split('§');
          row[0] = 'CPK_' + pknames.join('_');
          row[0] = row[0].replace(/_ /g, '_');
          row[1] = scht;
          jsonRow['constraint'] = row[0];
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
      return schema;
    } catch (err) {
      throw new Error(`${msg} ${err}`);
    }
  }

  /**
   * GetIndexes
   * @param mDb
   * @param sqlStmt
   * @param tableName
   */
  private getIndexes(mDb: any, tableName: string): JsonIndex[] {
    const msg = 'GetIndexes';
    const indexes: JsonIndex[] = [];
    let errmsg = '';
    try {
      let stmt = 'SELECT name,tbl_name,sql FROM sqlite_master WHERE ';
      stmt += `type = 'index' AND tbl_name = '${tableName}' `;
      stmt += `AND sql NOTNULL;`;
      const retIndexes = this.sqliteUtil.queryAll(mDb, stmt, []);
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
              errmsg = `${msg} Table ${tableName} doesn't match`;
              break;
            }
          } else {
            errmsg = `${msg} Table ${tableName} creating indexes`;
            break;
          }
        }
        if (errmsg.length > 0) {
          throw new Error(errmsg);
        }
      }
      return indexes;
    } catch (err) {
      throw new Error(`${msg} ${err}`);
    }
  }
  /**
   * GetTriggers
   * @param mDb
   * @param sqlStmt
   * @param tableName
   */
  private getTriggers(mDb: any, tableName: string): JsonTrigger[] {
    const msg = 'GetTriggers';
    const triggers: JsonTrigger[] = [];
    try {
      let stmt = 'SELECT name,tbl_name,sql FROM sqlite_master WHERE ';
      stmt += `type = 'trigger' AND tbl_name = '${tableName}' `;
      stmt += `AND sql NOT NULL;`;
      const retTriggers = this.sqliteUtil.queryAll(mDb, stmt, []);
      if (retTriggers.length > 0) {
        for (const rTrg of retTriggers) {
          const keys: string[] = Object.keys(rTrg);
          if (keys.length === 3) {
            if (rTrg['tbl_name'] === tableName) {
              const sql: string = rTrg['sql'];

              const name: string = rTrg['name'];
              let sqlArr: string[] = sql.split(name);
              if (sqlArr.length != 2) {
                throw new Error(
                  `${msg} sql split name does not return 2 values`,
                );
              }
              if (!sqlArr[1].includes(tableName)) {
                throw new Error(
                  `${msg} sql split does not contains ${tableName}`,
                );
              }
              const timeEvent = sqlArr[1].split(tableName, 1)[0].trim();
              sqlArr = sqlArr[1].split(timeEvent + ' ' + tableName);
              if (sqlArr.length != 2) {
                throw new Error(
                  `${msg} sql split tableName does not return 2 values`,
                );
              }
              let condition = '';
              let logic = '';
              if (sqlArr[1].trim().substring(0, 5).toUpperCase() !== 'BEGIN') {
                sqlArr = sqlArr[1].trim().split('BEGIN');
                if (sqlArr.length != 2) {
                  throw new Error(
                    `${msg} sql split BEGIN does not return 2 values`,
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
              throw new Error(`${msg} Table ${tableName} doesn't match`);
            }
          } else {
            throw new Error(`${msg} Table ${tableName} creating indexes`);
          }
        }
      }
      return triggers;
    } catch (err) {
      throw new Error(`${msg} ${err}`);
    }
  }
  /**
   * GetTablesPartial
   * @param mDb
   * @param resTables
   */
  private getTablesPartial(mDb: any, resTables: any[]): JsonTable[] {
    const msg = 'GetTablesPartial';
    const tables: JsonTable[] = [];
    let modTables: any = {};
    let syncDate = 0;
    let modTablesKeys: string[] = [];
    let errmsg = '';
    try {
      // Get the syncDate and the Modified Tables
      const partialModeData: any = this.getPartialModeData(mDb, resTables);
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
          errmsg = `${msg} no name`;
          break;
        }
        if (rTable.sql) {
          sqlStmt = rTable.sql;
        } else {
          errmsg = `${msg} no sql`;
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
          schema = this.getSchema(sqlStmt);
          if (schema.length > 0) {
            // check schema validity
            this.jsonUtil.checkSchemaValidity(schema);
          }
          // create Table's indexes if any
          indexes = this.getIndexes(mDb, tableName);
          if (indexes.length > 0) {
            // check indexes validity
            this.jsonUtil.checkIndexesValidity(indexes);
          }
          // create Table's triggers if any
          triggers = this.getTriggers(mDb, tableName);
          if (triggers.length > 0) {
            // check triggers validity
            this.jsonUtil.checkTriggersValidity(triggers);
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
        const values: any[] = this.jsonUtil.getValues(mDb, query, tableName);

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
          errmsg = `${msg} table ${tableName} is not a jsonTable`;
          break;
        }
        tables.push(table);
      }
      if (errmsg.length > 0) {
        throw new Error(errmsg);
      }
      return tables;
    } catch (err) {
      throw new Error(`${msg} ${err}`);
    }
  }
  /**
   * GetPartialModeData
   * @param mDb
   * @param resTables
   */
  private getPartialModeData(mDb: any, resTables: any[]): any {
    const msg = 'GetPartialModeData';
    const retData: any = {};
    try {
      // get the synchronization date
      const syncDate: number = this.getSyncDate(mDb);
      if (syncDate <= 0) {
        throw new Error(`${msg} no syncDate`);
      }
      // get the tables which have been updated
      // since last synchronization
      const modTables: any = this.getTablesModified(mDb, resTables, syncDate);
      if (modTables.length <= 0) {
        throw new Error(`${msg} no modTables`);
      }
      retData.syncDate = syncDate;
      retData.modTables = modTables;
      return retData;
    } catch (err) {
      throw new Error(`${msg} ${err}`);
    }
  }
  private getTablesModified(mDb: any, tables: any[], syncDate: number): any {
    const msg = 'GetTablesModified';
    let errmsg = '';
    try {
      const retModified: any = {};
      for (const rTable of tables) {
        let mode: string;
        // get total count of the table
        let stmt = 'SELECT count(*) AS tcount  ';
        stmt += `FROM ${rTable.name};`;
        let retQuery: any[] = this.sqliteUtil.queryAll(mDb, stmt, []);
        if (retQuery.length != 1) {
          errmsg = `${msg} total count not returned`;
          break;
        }
        const totalCount: number = retQuery[0]['tcount'];
        // get total count of modified since last sync
        stmt = 'SELECT count(*) AS mcount FROM ';
        stmt += `${rTable.name} WHERE last_modified > `;
        stmt += `${syncDate};`;
        retQuery = this.sqliteUtil.queryAll(mDb, stmt, []);
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
        throw new Error(errmsg);
      }
      return retModified;
    } catch (err) {
      throw new Error(`${msg} ${err}`);
    }
  }
  private modEmbeddedParentheses(sstr: string): string {
    const msg = 'ModEmbeddedParentheses';
    const oParArray: number[] = this.indexOfChar(sstr, '(');
    const cParArray: number[] = this.indexOfChar(sstr, ')');
    if (oParArray.length != cParArray.length) {
      throw new Error(`${msg} Not same number of '(' & ')'`);
    }
    if (oParArray.length === 0) {
      return sstr;
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
    return resStmt;
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