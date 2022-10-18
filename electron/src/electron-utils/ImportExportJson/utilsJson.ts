import type {
  JsonColumn,
  JsonIndex,
  JsonTrigger,
  JsonView,
} from '../../../../src/definitions';
import { UtilsSQLite } from '../utilsSQLite';

export class UtilsJson {
  private sqliteUtil: UtilsSQLite = new UtilsSQLite();

  /**
   * IsTableExists
   * @param db
   * @param isOpen
   * @param tableName
   */
  public async isTableExists(
    db: any,
    isOpen: boolean,
    tableName: string,
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!isOpen) {
        reject('isTableExists: database not opened');
      }
      let query = 'SELECT name FROM sqlite_master WHERE ';
      query += `type='table' AND name='${tableName}';`;
      db.all(query, [], (err: Error, rows: any[]) => {
        // process the row here
        if (err) {
          reject(`isTableExists: failed: ${err.message}`);
        } else {
          if (rows.length === 0) {
            resolve(false);
          } else {
            resolve(true);
          }
        }
      });
    });
  }
  /**
   * IsViewExists
   * @param db
   * @param isOpen
   * @param viewName
   */
  public async isViewExists(
    db: any,
    isOpen: boolean,
    viewName: string,
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!isOpen) {
        reject('isViewExists: database not opened');
      }
      let query = 'SELECT name FROM sqlite_master WHERE ';
      query += `type='view' AND name='${viewName}';`;
      db.all(query, [], (err: Error, rows: any[]) => {
        // process the row here
        if (err) {
          reject(`isViewExists: failed: ${err.message}`);
        } else {
          if (rows.length === 0) {
            resolve(false);
          } else {
            resolve(true);
          }
        }
      });
    });
  }
  /**
   * CreateSchema
   * @param mDB
   * @param jsonData
   */
  public async createSchema(mDB: any, jsonData: any): Promise<number> {
    // create the database schema
    let changes = 0;
    try {
      // start a transaction
      await this.sqliteUtil.beginTransaction(mDB, true);
    } catch (err) {
      return Promise.reject(`CreateDatabaseSchema: ${err}`);
    }

    const stmts = await this.createSchemaStatement(jsonData);
    if (stmts.length > 0) {
      const schemaStmt: string = stmts.join('\n');
      try {
        changes = await this.sqliteUtil.execute(mDB, schemaStmt, true);
        if (changes < 0) {
          try {
            await this.sqliteUtil.rollbackTransaction(mDB, true);
          } catch (err) {
            return Promise.reject('CreateSchema: changes < 0 ' + `${err}`);
          }
        }
      } catch (err) {
        const msg = err;
        try {
          await this.sqliteUtil.rollbackTransaction(mDB, true);
          return Promise.reject(`CreateSchema: ${msg}`);
        } catch (err) {
          return Promise.reject(
            'CreateSchema: changes < 0 ' + `${err}: ${msg}`,
          );
        }
      }
    }
    try {
      await this.sqliteUtil.commitTransaction(mDB, true);
      return Promise.resolve(changes);
    } catch (err) {
      return Promise.reject('CreateSchema: commit ' + `${err}`);
    }
  }

  /**
   * CreateSchemaStatement
   * @param jsonData
   */
  public async createSchemaStatement(jsonData: any): Promise<string[]> {
    const statements: string[] = [];
    let isLastModified = false;
    let isSqlDeleted = false;
    // Prepare the statement to execute
    try {
      for (const jTable of jsonData.tables) {
        if (jTable.schema != null && jTable.schema.length >= 1) {
          // create table
          statements.push('CREATE TABLE IF NOT EXISTS ' + `${jTable.name} (`);
          for (let j = 0; j < jTable.schema.length; j++) {
            if (j === jTable.schema.length - 1) {
              if (jTable.schema[j].column) {
                statements.push(
                  `${jTable.schema[j].column} ${jTable.schema[j].value}`,
                );
                if (jTable.schema[j].column === 'last_modified') {
                  isLastModified = true;
                }
                if (jTable.schema[j].column === 'sql_deleted') {
                  isSqlDeleted = true;
                }
              } else if (jTable.schema[j].foreignkey) {
                statements.push(
                  `FOREIGN KEY (${jTable.schema[j].foreignkey}) ${jTable.schema[j].value}`,
                );
              } else if (jTable.schema[j].constraint) {
                statements.push(
                  `CONSTRAINT ${jTable.schema[j].constraint} ${jTable.schema[j].value}`,
                );
              }
            } else {
              if (jTable.schema[j].column) {
                statements.push(
                  `${jTable.schema[j].column} ${jTable.schema[j].value},`,
                );
                if (jTable.schema[j].column === 'last_modified') {
                  isLastModified = true;
                }
                if (jTable.schema[j].column === 'sql_deleted') {
                  isSqlDeleted = true;
                }
              } else if (jTable.schema[j].foreignkey) {
                statements.push(
                  `FOREIGN KEY (${jTable.schema[j].foreignkey}) ${jTable.schema[j].value},`,
                );
              } else if (jTable.schema[j].constraint) {
                statements.push(
                  `CONSTRAINT ${jTable.schema[j].constraint} ${jTable.schema[j].value},`,
                );
              }
            }
          }
          statements.push(');');
          if (isLastModified && isSqlDeleted) {
            // create trigger last_modified associated with the table
            let trig = 'CREATE TRIGGER IF NOT EXISTS ';
            trig += `${jTable.name}`;
            trig += `_trigger_last_modified `;
            trig += `AFTER UPDATE ON ${jTable.name} `;
            trig += 'FOR EACH ROW WHEN NEW.last_modified < ';
            trig += 'OLD.last_modified BEGIN UPDATE ';
            trig += `${jTable.name} `;
            trig += `SET last_modified = `;
            trig += "(strftime('%s','now')) WHERE id=OLD.id; END;";
            statements.push(trig);
          }
        }

        if (jTable.indexes != null && jTable.indexes.length >= 1) {
          for (const jIndex of jTable.indexes) {
            const tableName = jTable.name;
            let stmt = `CREATE ${
              Object.keys(jIndex).includes('mode') ? jIndex.mode + ' ' : ''
            } INDEX IF NOT EXISTS `;
            stmt += `${jIndex.name} ON ${tableName} (${jIndex.value});`;
            statements.push(stmt);
          }
        }
        if (jTable.triggers != null && jTable.triggers.length >= 1) {
          for (const jTrg of jTable.triggers) {
            const tableName = jTable.name;
            if (jTrg.timeevent.toUpperCase().endsWith(' ON')) {
              jTrg.timeevent = jTrg.timeevent.substring(
                0,
                jTrg.timeevent.length - 3,
              );
            }

            let stmt = `CREATE TRIGGER IF NOT EXISTS `;
            stmt += `${jTrg.name} ${jTrg.timeevent} ON ${tableName} `;
            if (jTrg.condition) stmt += `${jTrg.condition} `;
            stmt += `${jTrg.logic};`;
            statements.push(stmt);
          }
        }
      }
      return Promise.resolve(statements);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  /**
   * CreateDataTable
   * @param mDB
   * @param table
   * @param mode
   */
  public async createDataTable(
    mDB: any,
    table: any,
    mode: string,
  ): Promise<number> {
    let lastId = -1;
    try {
      // Check if the table exists
      const tableExists = await this.isTableExists(mDB, true, table.name);
      if (!tableExists) {
        return Promise.reject(
          'CreateDataTable: Table ' + `${table.name} does not exist`,
        );
      }

      // Get the column names and types
      const tableNamesTypes: any =
        await this.sqliteUtil.getTableColumnNamesTypes(mDB, table.name);
      const tableColumnTypes: string[] = tableNamesTypes.types;
      const tableColumnNames: string[] = tableNamesTypes.names;
      if (tableColumnTypes.length === 0) {
        return Promise.reject(
          'CreateDataTable: Table ' + `${table.name} info does not exist`,
        );
      }
      // Loop on Table Values
      for (let j = 0; j < table.values.length; j++) {
        let row = table.values[j];
        let isRun = true;
        const stmt: string = await this.createRowStatement(
          mDB,
          tableColumnNames,
          row,
          j,
          table.name,
          mode,
        );

        isRun = await this.checkUpdate(
          mDB,
          stmt,
          row,
          table.name,
          tableColumnNames,
        );
        if (isRun) {
          if (stmt.substring(0, 6).toUpperCase() === 'DELETE') {
            row = [];
          }
          lastId = await this.sqliteUtil.prepareRun(mDB, stmt, row, true);
          if (lastId < 0) {
            return Promise.reject('CreateDataTable: lastId < 0');
          }
        } else {
          lastId = 0;
        }
      }
      return Promise.resolve(lastId);
    } catch (err) {
      return Promise.reject(`CreateDataTable: ${err}`);
    }
  }
  /**
   * CreateRowStatement
   * @param mDB
   * @param tColNames
   * @param row
   * @param j
   * @param tableName
   * @param mode
   * @returns
   */
  public async createRowStatement(
    mDB: any,
    tColNames: string[],
    row: any[],
    j: number,
    tableName: string,
    mode: string,
  ): Promise<string> {
    // Check the row number of columns
    if (
      row.length != tColNames.length ||
      row.length === 0 ||
      tColNames.length === 0
    ) {
      return Promise.reject(
        new Error(
          `CreateRowStatement: Table ${tableName} ` +
            `values row ${j} not correct length`,
        ),
      );
    }
    try {
      const retisIdExists: boolean = await this.isIdExists(
        mDB,
        tableName,
        tColNames[0],
        row[0],
      );
      let stmt: string;
      if (mode === 'full' || (mode === 'partial' && !retisIdExists)) {
        // Insert
        const nameString: string = tColNames.join();
        const questionMarkString = await this.createQuestionMarkString(
          tColNames.length,
        );
        stmt = `INSERT INTO ${tableName} (${nameString}) VALUES (`;
        stmt += `${questionMarkString});`;
      } else {
        // Update or Delete
        let isUpdate = true;
        const isColDeleted = (element: string) => element === `sql_deleted`;
        const idxDelete = tColNames.findIndex(isColDeleted);
        if (idxDelete >= 0) {
          if (row[idxDelete] === 1) {
            isUpdate = false;
            stmt = `DELETE FROM ${tableName} WHERE `;
            if (typeof row[0] == 'string') {
              stmt += `${tColNames[0]} = '${row[0]}';`;
            } else {
              stmt += `${tColNames[0]} = ${row[0]};`;
            }
          }
        }

        if (isUpdate) {
          // Update
          const setString: string = await this.setNameForUpdate(tColNames);
          if (setString.length === 0) {
            return Promise.reject(
              new Error(
                `CreateRowStatement: Table ${tableName} ` +
                  `values row ${j} not set to String`,
              ),
            );
          }
          stmt = `UPDATE ${tableName} SET ${setString} WHERE `;
          if (typeof row[0] == 'string') {
            stmt += `${tColNames[0]} = '${row[0]}';`;
          } else {
            stmt += `${tColNames[0]} = ${row[0]};`;
          }
        }
      }
      return Promise.resolve(stmt);
    } catch (err) {
      return Promise.reject(new Error(`CreateRowStatement: ${err.message}`));
    }
  }
  /**
   *
   * @param db
   * @param values
   * @param tbName
   * @param tColNames
   * @returns
   */
  public async checkUpdate(
    db: any,
    stmt: string,
    values: any[],
    tbName: string,
    tColNames: string[],
  ): Promise<boolean> {
    const isRun = true;
    if (stmt.substring(0, 6) === 'UPDATE') {
      try {
        let query = `SELECT * FROM ${tbName} WHERE `;
        if (typeof values[0] == 'string') {
          query += `${tColNames[0]} = '${values[0]}';`;
        } else {
          query += `${tColNames[0]} = ${values[0]};`;
        }

        const resQuery: any[] = await this.getValues(db, query, tbName);
        let resValues: any[] = [];
        if (resQuery.length > 0) {
          resValues = resQuery[0];
        }
        if (
          values.length > 0 &&
          resValues.length > 0 &&
          values.length === resValues.length
        ) {
          for (let i = 0; i < values.length; i++) {
            if (values[i] !== resValues[i]) {
              return Promise.resolve(true);
            }
          }
          return Promise.resolve(false);
        } else {
          const msg = 'Both arrays not the same length';
          return Promise.reject(new Error(`CheckUpdate: ${msg}`));
        }
      } catch (err) {
        return Promise.reject(new Error(`CheckUpdate: ${err.message}`));
      }
    } else {
      return Promise.resolve(isRun);
    }
  }
  /**
   * GetValues
   * @param mDb
   * @param query
   * @param tableName
   */
  public async getValues(
    mDb: any,
    query: string,
    tableName: string,
  ): Promise<any[]> {
    const values: any[] = [];
    try {
      // get table column names and types
      const tableNamesTypes = await this.sqliteUtil.getTableColumnNamesTypes(
        mDb,
        tableName,
      );
      let rowNames: string[] = [];
      if (Object.keys(tableNamesTypes).includes('names')) {
        rowNames = tableNamesTypes.names;
      } else {
        return Promise.reject(`GetValues: Table ${tableName} no names`);
      }
      const retValues = await this.sqliteUtil.queryAll(mDb, query, []);
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
   * CheckColumnTypes
   * @param tableTypes
   * @param rowValues
   */
  /*
  private async checkColumnTypes(
    tableTypes: any[],
    rowValues: any[],
  ): Promise<boolean> {
    const isType = true;
    for (let i = 0; i < rowValues.length; i++) {
      if (rowValues[i].toString().toUpperCase() != 'NULL') {
        try {
          await this.isType(tableTypes[i], rowValues[i]);
        } catch (err) {
          return Promise.reject(new Error('checkColumnTypes: Type not found'));
        }
      }
    }
    return Promise.resolve(isType);
  }
*/
  /**
   * IsType
   * @param type
   * @param value
   */
  /*
  private async isType(type: string, value: any): Promise<void> {
    let ret = false;
    if (type === 'NULL' && typeof value === 'object') ret = true;
    if (type === 'TEXT' && typeof value === 'string') ret = true;
    if (type === 'INTEGER' && typeof value === 'number') ret = true;
    if (type === 'REAL' && typeof value === 'number') ret = true;
    if (type === 'BLOB' && typeof value === 'string') ret = true;
    if (ret) {
      return Promise.resolve();
    } else {
      return Promise.reject(new Error('IsType: not a SQL Type'));
    }
  }
*/
  /**
   * IsIdExists
   * @param db
   * @param dbName
   * @param firstColumnName
   * @param key
   */
  private async isIdExists(
    db: any,
    dbName: string,
    firstColumnName: string,
    key: any,
  ): Promise<boolean> {
    let ret = false;
    let query: string =
      `SELECT ${firstColumnName} FROM ` +
      `${dbName} WHERE ${firstColumnName} = `;
    if (typeof key === 'number') query += `${key};`;
    if (typeof key === 'string') query += `'${key}';`;

    try {
      const resQuery: any[] = await this.sqliteUtil.queryAll(db, query, []);
      if (resQuery.length === 1) ret = true;
      return Promise.resolve(ret);
    } catch (err) {
      return Promise.reject(`IsIdExists: ${err}`);
    }
  }

  /**
   * CreateQuestionMarkString
   * @param length
   */
  private createQuestionMarkString(length: number): Promise<string> {
    return new Promise((resolve, reject) => {
      let retString = '';
      for (let i = 0; i < length; i++) {
        retString += '?,';
      }
      if (retString.length > 1) {
        retString = retString.slice(0, -1);
        resolve(retString);
      } else {
        reject('CreateQuestionMarkString: length = 0');
      }
    });
  }

  /**
   * SetNameForUpdate
   * @param names
   */
  private async setNameForUpdate(names: string[]): Promise<string> {
    let retString = '';
    for (const name of names) {
      retString += `${name} = ? ,`;
    }
    if (retString.length > 1) {
      retString = retString.slice(0, -1);
      return Promise.resolve(retString);
    } else {
      return Promise.reject('SetNameForUpdate: length = 0');
    }
  }

  /**
   * IsJsonSQLite
   * @param obj
   */
  public isJsonSQLite(obj: any): boolean {
    const keyFirstLevel: string[] = [
      'database',
      'version',
      'overwrite',
      'encrypted',
      'mode',
      'tables',
      'views',
    ];
    if (
      obj == null ||
      (Object.keys(obj).length === 0 && obj.constructor === Object)
    )
      return false;
    for (const key of Object.keys(obj)) {
      if (keyFirstLevel.indexOf(key) === -1) return false;
      if (key === 'database' && typeof obj[key] != 'string') return false;
      if (key === 'version' && typeof obj[key] != 'number') return false;
      if (key === 'overwrite' && typeof obj[key] != 'boolean') return false;
      if (key === 'encrypted' && typeof obj[key] != 'boolean') return false;
      if (key === 'mode' && typeof obj[key] != 'string') return false;
      if (key === 'tables' && typeof obj[key] != 'object') return false;
      if (key === 'tables') {
        for (const oKey of obj[key]) {
          const retTable: boolean = this.isTable(oKey);
          if (!retTable) return false;
        }
      }
      if (key === 'views' && typeof obj[key] != 'object') return false;
      if (key === 'views') {
        for (const oKey of obj[key]) {
          const retView: boolean = this.isView(oKey);
          if (!retView) return false;
        }
      }
    }
    return true;
  }

  /**
   * IsTable
   * @param obj
   */
  private isTable(obj: any): boolean {
    const keyTableLevel: string[] = [
      'name',
      'schema',
      'indexes',
      'triggers',
      'values',
    ];
    let nbColumn = 0;
    if (
      obj == null ||
      (Object.keys(obj).length === 0 && obj.constructor === Object)
    )
      return false;
    for (const key of Object.keys(obj)) {
      if (keyTableLevel.indexOf(key) === -1) return false;
      if (key === 'name' && typeof obj[key] != 'string') return false;
      if (key === 'schema' && typeof obj[key] != 'object') return false;
      if (key === 'indexes' && typeof obj[key] != 'object') return false;
      if (key === 'triggers' && typeof obj[key] != 'object') return false;
      if (key === 'values' && typeof obj[key] != 'object') return false;
      if (key === 'schema') {
        obj['schema'].forEach(
          (element: {
            column?: string;
            value: string;
            foreignkey?: string;
          }) => {
            if (element.column) {
              nbColumn++;
            }
          },
        );
        for (let i = 0; i < nbColumn; i++) {
          const retSchema: boolean = this.isSchema(obj[key][i]);
          if (!retSchema) return false;
        }
      }
      if (key === 'indexes') {
        for (const oKey of obj[key]) {
          const retIndexes: boolean = this.isIndexes(oKey);
          if (!retIndexes) return false;
        }
      }
      if (key === 'triggers') {
        for (const oKey of obj[key]) {
          const retTriggers: boolean = this.isTriggers(oKey);
          if (!retTriggers) return false;
        }
      }
      if (key === 'values') {
        if (nbColumn > 0) {
          for (const oKey of obj[key]) {
            if (typeof oKey != 'object' || oKey.length != nbColumn)
              return false;
          }
        }
      }
    }

    return true;
  }
  /**
   * IsSchema
   * @param obj
   */
  private isSchema(obj: any): boolean {
    const keySchemaLevel: string[] = [
      'column',
      'value',
      'foreignkey',
      'primarykey',
      'constraint',
    ];
    if (
      obj == null ||
      (Object.keys(obj).length === 0 && obj.constructor === Object)
    )
      return false;
    for (const key of Object.keys(obj)) {
      if (keySchemaLevel.indexOf(key) === -1) return false;
      if (key === 'column' && typeof obj[key] != 'string') return false;
      if (key === 'value' && typeof obj[key] != 'string') return false;
      if (key === 'foreignkey' && typeof obj[key] != 'string') return false;
      if (key === 'primarykey' && typeof obj[key] != 'string') return false;
      if (key === 'constraint' && typeof obj[key] != 'string') return false;
    }
    return true;
  }
  /**
   * isIndexes
   * @param obj
   */
  private isIndexes(obj: any): boolean {
    const keyIndexesLevel: string[] = ['name', 'value', 'mode'];
    if (
      obj == null ||
      (Object.keys(obj).length === 0 && obj.constructor === Object)
    )
      return false;
    for (const key of Object.keys(obj)) {
      if (keyIndexesLevel.indexOf(key) === -1) return false;
      if (key === 'name' && typeof obj[key] != 'string') return false;
      if (key === 'value' && typeof obj[key] != 'string') return false;
      if (
        key === 'mode' &&
        (typeof obj[key] != 'string' || obj[key].toUpperCase() != 'UNIQUE')
      )
        return false;
    }
    return true;
  }

  /**
   * isTriggers
   * @param obj
   */
  private isTriggers(obj: any): boolean {
    const keyTriggersLevel: string[] = [
      'name',
      'timeevent',
      'condition',
      'logic',
    ];
    if (
      obj == null ||
      (Object.keys(obj).length === 0 && obj.constructor === Object)
    )
      return false;
    for (const key of Object.keys(obj)) {
      if (keyTriggersLevel.indexOf(key) === -1) return false;
      if (key === 'name' && typeof obj[key] != 'string') return false;
      if (key === 'timeevent' && typeof obj[key] != 'string') return false;
      if (key === 'condition' && typeof obj[key] != 'string') return false;
      if (key === 'logic' && typeof obj[key] != 'string') return false;
    }
    return true;
  }
  /**
   * IsViews
   * @param obj
   */
  private isView(obj: any): boolean {
    const keyViewLevel: string[] = ['name', 'value'];
    if (
      obj == null ||
      (Object.keys(obj).length === 0 && obj.constructor === Object)
    )
      return false;
    for (const key of Object.keys(obj)) {
      if (keyViewLevel.indexOf(key) === -1) return false;
      if (key === 'name' && typeof obj[key] != 'string') return false;
      if (key === 'value' && typeof obj[key] != 'string') return false;
    }
    return true;
  }

  /**
   * checkSchemaValidity
   * @param schema
   */
  public async checkSchemaValidity(schema: JsonColumn[]): Promise<void> {
    for (let i = 0; i < schema.length; i++) {
      const sch: JsonColumn = {} as JsonColumn;
      const keys: string[] = Object.keys(schema[i]);
      if (keys.includes('column')) {
        sch.column = schema[i].column;
      }
      if (keys.includes('value')) {
        sch.value = schema[i].value;
      }
      if (keys.includes('foreignkey')) {
        sch.foreignkey = schema[i].foreignkey;
      }
      if (keys.includes('constraint')) {
        sch.constraint = schema[i].constraint;
      }
      const isValid: boolean = this.isSchema(sch);
      if (!isValid) {
        return Promise.reject(`CheckSchemaValidity: schema[${i}] not valid`);
      }
    }
    return Promise.resolve();
  }
  /**
   * checkIndexesSchemaValidity
   * @param indexes
   */
  public async checkIndexesValidity(indexes: JsonIndex[]): Promise<void> {
    for (let i = 0; i < indexes.length; i++) {
      const index: JsonIndex = {} as JsonIndex;
      const keys: string[] = Object.keys(indexes[i]);
      if (keys.includes('value')) {
        index.value = indexes[i].value;
      }
      if (keys.includes('name')) {
        index.name = indexes[i].name;
      }
      if (keys.includes('mode')) {
        index.mode = indexes[i].mode;
      }

      const isValid: boolean = this.isIndexes(index);
      if (!isValid) {
        return Promise.reject(`CheckIndexesValidity: indexes[${i}] not valid`);
      }
    }
    return Promise.resolve();
  }
  /**
   * checkTriggersValidity
   * @param triggers
   */
  public async checkTriggersValidity(triggers: JsonTrigger[]): Promise<void> {
    for (let i = 0; i < triggers.length; i++) {
      const trigger: JsonTrigger = {} as JsonTrigger;
      const keys: string[] = Object.keys(triggers[i]);
      if (keys.includes('logic')) {
        trigger.logic = triggers[i].logic;
      }
      if (keys.includes('name')) {
        trigger.name = triggers[i].name;
      }
      if (keys.includes('timeevent')) {
        trigger.timeevent = triggers[i].timeevent;
      }
      if (keys.includes('condition')) {
        trigger.condition = triggers[i].condition;
      }

      const isValid: boolean = this.isTriggers(trigger);
      if (!isValid) {
        return Promise.reject(
          `CheckTriggersValidity: triggers[${i}] not valid`,
        );
      }
    }
    return Promise.resolve();
  }
  /**
   * checkViewsValidity
   * @param views
   */
  public async checkViewsValidity(views: JsonView[]): Promise<void> {
    for (let i = 0; i < views.length; i++) {
      const view: JsonView = {} as JsonView;
      const keys: string[] = Object.keys(views[i]);
      if (keys.includes('value')) {
        view.value = views[i].value;
      }
      if (keys.includes('name')) {
        view.name = views[i].name;
      }

      const isValid: boolean = this.isView(view);
      if (!isValid) {
        return Promise.reject(`CheckViewsValidity: views[${i}] not valid`);
      }
    }
    return Promise.resolve();
  }
  /**
   * CreateView
   * @param mDB
   * @param table
   */
  public async createView(mDB: any, view: JsonView): Promise<void> {
    const stmt = `CREATE VIEW IF NOT EXISTS ${view.name} AS ${view.value};`;
    try {
      const changes = await this.sqliteUtil.execute(mDB, stmt, true);
      if (changes < 0) {
        return Promise.reject(`CreateView: ${view.name} failed`);
      }
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(`CreateView: ${err}`);
    }
  }
}
