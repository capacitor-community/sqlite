import { UtilsSQLite } from '../utilsSQLite';
import { JsonColumn, JsonIndex, JsonTrigger } from '../../definitions';

export class UtilsJson {
  private _uSQLite: UtilsSQLite = new UtilsSQLite();
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
      let query: string = 'SELECT name FROM sqlite_master WHERE ';
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
   * CreateSchema
   * @param mDB
   * @param jsonData
   */
  public async createSchema(mDB: any, jsonData: any): Promise<number> {
    return new Promise(async (resolve, reject) => {
      // create the database schema
      let changes: number = 0;
      try {
        // start a transaction
        await this._uSQLite.beginTransaction(mDB, true);
      } catch (err) {
        reject(new Error(`CreateDatabaseSchema: ${err.message}`));
      }

      const stmts = await this.createSchemaStatement(jsonData);
      if (stmts.length > 0) {
        const schemaStmt: string = stmts.join('\n');
        try {
          changes = await this._uSQLite.execute(mDB, schemaStmt);
          if (changes < 0) {
            try {
              await this._uSQLite.rollbackTransaction(mDB, true);
            } catch (err) {
              reject(
                new Error('CreateSchema: changes < 0 ' + `${err.message}`),
              );
            }
          }
        } catch (err) {
          const msg = err.message;
          try {
            await this._uSQLite.rollbackTransaction(mDB, true);
            reject(new Error(`CreateSchema: ${msg}`));
          } catch (err) {
            reject(
              new Error(
                'CreateSchema: changes < 0 ' + `${err.message}: ${msg}`,
              ),
            );
          }
        }
      }
      try {
        await this._uSQLite.commitTransaction(mDB, true);
        resolve(changes);
      } catch (err) {
        reject(new Error('CreateSchema: commit ' + `${err.message}`));
      }
    });
  }

  /**
   * CreateSchemaStatement
   * @param jsonData
   */
  public async createSchemaStatement(jsonData: any): Promise<string[]> {
    return new Promise(resolve => {
      let statements: string[] = [];
      // Prepare the statement to execute
      for (let i: number = 0; i < jsonData.tables.length; i++) {
        if (
          jsonData.tables[i].schema != null &&
          jsonData.tables[i].schema!.length >= 1
        ) {
          // create table
          statements.push(
            'CREATE TABLE IF NOT EXISTS ' + `${jsonData.tables[i].name} (`,
          );
          for (let j: number = 0; j < jsonData.tables[i].schema!.length; j++) {
            if (j === jsonData.tables[i].schema!.length - 1) {
              if (jsonData.tables[i].schema![j].column) {
                statements.push(
                  `${jsonData.tables[i].schema![j].column} ${
                    jsonData.tables[i].schema![j].value
                  }`,
                );
              } else if (jsonData.tables[i].schema![j].foreignkey) {
                statements.push(
                  `FOREIGN KEY (${jsonData.tables[i].schema![j].foreignkey}) ${
                    jsonData.tables[i].schema![j].value
                  }`,
                );
              } else if (jsonData.tables[i].schema![j].constraint) {
                statements.push(
                  `CONSTRAINT ${jsonData.tables[i].schema![j].constraint} ${
                    jsonData.tables[i].schema![j].value
                  }`,
                );
              }
            } else {
              if (jsonData.tables[i].schema![j].column) {
                statements.push(
                  `${jsonData.tables[i].schema![j].column} ${
                    jsonData.tables[i].schema![j].value
                  },`,
                );
              } else if (jsonData.tables[i].schema![j].foreignkey) {
                statements.push(
                  `FOREIGN KEY (${jsonData.tables[i].schema![j].foreignkey}) ${
                    jsonData.tables[i].schema![j].value
                  },`,
                );
              } else if (jsonData.tables[i].schema![j].constraint) {
                statements.push(
                  `CONSTRAINT ${jsonData.tables[i].schema![j].constraint} ${
                    jsonData.tables[i].schema![j].value
                  },`,
                );
              }
            }
          }
          statements.push(');');

          // create trigger last_modified associated with the table
          let trig: string = 'CREATE TRIGGER IF NOT EXISTS ';
          trig += `${jsonData.tables[i].name}`;
          trig += `_trigger_last_modified `;
          trig += `AFTER UPDATE ON ${jsonData.tables[i].name} `;
          trig += 'FOR EACH ROW WHEN NEW.last_modified <= ';
          trig += 'OLD.last_modified BEGIN UPDATE ';
          trig += `${jsonData.tables[i].name} `;
          trig += `SET last_modified = `;
          trig += "(strftime('%s','now')) WHERE id=OLD.id; END;";
          statements.push(trig);
        }
        if (
          jsonData.tables[i].indexes != null &&
          jsonData.tables[i].indexes!.length >= 1
        ) {
          for (let j: number = 0; j < jsonData.tables[i].indexes!.length; j++) {
            const index = jsonData.tables[i].indexes![j];
            const tableName = jsonData.tables[i].name;
            let stmt: string = `CREATE ${
              Object.keys(index).includes('mode') ? index.mode + ' ' : ''
            }INDEX IF NOT EXISTS `;
            stmt += `${index.name} ON ${tableName} (${index.value});`;
            statements.push(stmt);
          }
        }
        if (
          jsonData.tables[i].triggers != null &&
          jsonData.tables[i].triggers!.length >= 1
        ) {
          for (
            let j: number = 0;
            j < jsonData.tables[i].triggers!.length;
            j++
          ) {
            const trigger = jsonData.tables[i].triggers![j];
            const tableName = jsonData.tables[i].name;

            let stmt: string = `CREATE TRIGGER IF NOT EXISTS `;
            stmt += `${trigger.name} ${trigger.timeevent} ON ${tableName} `;
            if (trigger.condition) stmt += `${trigger.condition} `;
            stmt += `${trigger.logic};`;
            statements.push(stmt);
          }
        }
      }
      resolve(statements);
    });
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
    return new Promise(async (resolve, reject) => {
      let lastId: number = -1;
      try {
        // Check if the table exists
        const tableExists = await this.isTableExists(mDB, true, table.name);
        if (!tableExists) {
          reject(
            new Error(
              'CreateDataTable: Table ' + `${table.name} does not exist`,
            ),
          );
        }

        // Get the column names and types
        const tableNamesTypes: any = await this.getTableColumnNamesTypes(
          mDB,
          table.name,
        );
        const tableColumnTypes: Array<string> = tableNamesTypes.types;
        const tableColumnNames: Array<string> = tableNamesTypes.names;
        if (tableColumnTypes.length === 0) {
          reject(
            new Error(
              'CreateDataTable: Table ' + `${table.name} info does not exist`,
            ),
          );
        }
        // Loop on Table Values
        for (let j: number = 0; j < table.values!.length; j++) {
          // Check the row number of columns
          if (table.values![j].length != tableColumnTypes.length) {
            reject(
              new Error(
                `CreateDataTable: Table ${table.name} ` +
                  `values row ${j} not correct length`,
              ),
            );
          }
          // Check the column's type before proceeding
          const isColumnTypes: boolean = await this.checkColumnTypes(
            tableColumnTypes,
            table.values![j],
          );
          if (!isColumnTypes) {
            reject(
              new Error(
                `CreateDataTable: Table ${table.name} ` +
                  `values row ${j} not correct types`,
              ),
            );
          }
          const retisIdExists: boolean = await this.isIdExists(
            mDB,
            table.name,
            tableColumnNames[0],
            table.values![j][0],
          );
          let stmt: string;
          if (mode === 'full' || (mode === 'partial' && !retisIdExists)) {
            // Insert
            const nameString: string = tableColumnNames.join();
            const questionMarkString = await this.createQuestionMarkString(
              tableColumnNames.length,
            );
            stmt = `INSERT INTO ${table.name} (${nameString}) VALUES (`;
            stmt += `${questionMarkString});`;
          } else {
            // Update
            const setString: string = await this.setNameForUpdate(
              tableColumnNames,
            );
            if (setString.length === 0) {
              reject(
                new Error(
                  `CreateDataTable: Table ${table.name} ` +
                    `values row ${j} not set to String`,
                ),
              );
            }
            stmt =
              `UPDATE ${table.name} SET ${setString} WHERE ` +
              `${tableColumnNames[0]} = ${table.values![j][0]};`;
          }
          lastId = await this._uSQLite.prepareRun(mDB, stmt, table.values![j]);
          if (lastId < 0) {
            reject(new Error('CreateDataTable: lastId < 0'));
          }
        }
        resolve(lastId);
      } catch (err) {
        reject(new Error(`CreateDataTable: ${err.message}`));
      }
    });
  }

  /**
   * GetTableColumnNamesTypes
   * @param mDB
   * @param tableName
   */
  public getTableColumnNamesTypes(mDB: any, tableName: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      let resQuery: any[] = [];
      let retNames: string[] = [];
      let retTypes: Array<string> = [];
      const query: string = `PRAGMA table_info('${tableName}');`;
      try {
        resQuery = await this._uSQLite.queryAll(mDB, query, []);
        if (resQuery.length > 0) {
          for (let i: number = 0; i < resQuery.length; i++) {
            retNames.push(resQuery[i].name);
            retTypes.push(resQuery[i].type);
          }
        }
        resolve({ names: retNames, types: retTypes });
      } catch (err) {
        reject(new Error('GetTableColumnNamesTypes: ' + `${err.message}`));
      }
    });
  }

  /**
   * CheckColumnTypes
   * @param tableTypes
   * @param rowValues
   */
  private checkColumnTypes(
    tableTypes: Array<any>,
    rowValues: Array<any>,
  ): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      let isType: boolean = true;
      for (let i: number = 0; i < rowValues.length; i++) {
        if (rowValues[i].toString().toUpperCase() != 'NULL') {
          try {
            await this.isType(tableTypes[i], rowValues[i]);
          } catch (err) {
            reject(new Error('checkColumnTypes: Type not found'));
          }
        }
      }
      resolve(isType);
    });
  }

  /**
   * IsType
   * @param type
   * @param value
   */
  private isType(type: string, value: any): Promise<void> {
    return new Promise((resolve, reject) => {
      let ret: boolean = false;
      if (type === 'NULL' && typeof value === 'object') ret = true;
      if (type === 'TEXT' && typeof value === 'string') ret = true;
      if (type === 'INTEGER' && typeof value === 'number') ret = true;
      if (type === 'REAL' && typeof value === 'number') ret = true;
      if (type === 'BLOB' && typeof value === 'string') ret = true;
      if (ret) {
        resolve();
      } else {
        reject(new Error('IsType: not a SQL Type'));
      }
    });
  }

  /**
   * IsIdExists
   * @param db
   * @param dbName
   * @param firstColumnName
   * @param key
   */
  private isIdExists(
    db: any,
    dbName: string,
    firstColumnName: string,
    key: any,
  ): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      let ret: boolean = false;
      let query: string =
        `SELECT ${firstColumnName} FROM ` +
        `${dbName} WHERE ${firstColumnName} = `;
      if (typeof key === 'number') query += `${key};`;
      if (typeof key === 'string') query += `'${key}';`;
      try {
        const resQuery: Array<any> = await this._uSQLite.queryAll(
          db,
          query,
          [],
        );
        if (resQuery.length === 1) ret = true;
        resolve(ret);
      } catch (err) {
        reject(new Error(`IsIdExists: ${err.message}`));
      }
    });
  }

  /**
   * CreateQuestionMarkString
   * @param length
   */
  private createQuestionMarkString(length: number): Promise<string> {
    return new Promise((resolve, reject) => {
      var retString: string = '';
      for (let i: number = 0; i < length; i++) {
        retString += '?,';
      }
      if (retString.length > 1) {
        retString = retString.slice(0, -1);
        resolve(retString);
      } else {
        reject(new Error('CreateQuestionMarkString: length = 0'));
      }
    });
  }

  /**
   * SetNameForUpdate
   * @param names
   */
  private setNameForUpdate(names: String[]): Promise<string> {
    return new Promise((resolve, reject) => {
      var retString: string = '';
      for (let i: number = 0; i < names.length; i++) {
        retString += `${names[i]} = ? ,`;
      }
      if (retString.length > 1) {
        retString = retString.slice(0, -1);
        resolve(retString);
      } else {
        reject(new Error('SetNameForUpdate: length = 0'));
      }
    });
  }

  /**
   * IsJsonSQLite
   * @param obj
   */
  public isJsonSQLite(obj: any): boolean {
    const keyFirstLevel: Array<string> = [
      'database',
      'version',
      'encrypted',
      'mode',
      'tables',
    ];
    if (
      obj == null ||
      (Object.keys(obj).length === 0 && obj.constructor === Object)
    )
      return false;
    for (var key of Object.keys(obj)) {
      if (keyFirstLevel.indexOf(key) === -1) return false;
      if (key === 'database' && typeof obj[key] != 'string') return false;
      if (key === 'version' && typeof obj[key] != 'number') return false;
      if (key === 'encrypted' && typeof obj[key] != 'boolean') return false;
      if (key === 'mode' && typeof obj[key] != 'string') return false;
      if (key === 'tables' && typeof obj[key] != 'object') return false;
      if (key === 'tables') {
        for (let i: number = 0; i < obj[key].length; i++) {
          const retTable: boolean = this.isTable(obj[key][i]);
          if (!retTable) return false;
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
    const keyTableLevel: Array<string> = [
      'name',
      'schema',
      'indexes',
      'triggers',
      'values',
    ];
    let nbColumn: number = 0;
    if (
      obj == null ||
      (Object.keys(obj).length === 0 && obj.constructor === Object)
    )
      return false;
    for (var key of Object.keys(obj)) {
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
            constraint?: string;
          }) => {
            if (element.column) {
              nbColumn++;
            }
          },
        );
        for (let i: number = 0; i < nbColumn; i++) {
          const retSchema: boolean = this.isSchema(obj[key][i]);
          if (!retSchema) return false;
        }
      }
      if (key === 'indexes') {
        for (let i: number = 0; i < obj[key].length; i++) {
          const retIndexes: boolean = this.isIndexes(obj[key][i]);
          if (!retIndexes) return false;
        }
      }
      if (key === 'triggers') {
        for (let i: number = 0; i < obj[key].length; i++) {
          const retTriggers: boolean = this.isTriggers(obj[key][i]);
          if (!retTriggers) return false;
        }
      }
      if (key === 'values') {
        if (nbColumn > 0) {
          for (let i: number = 0; i < obj[key].length; i++) {
            if (
              typeof obj[key][i] != 'object' ||
              obj[key][i].length != nbColumn
            )
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
    const keySchemaLevel: Array<string> = [
      'column',
      'value',
      'foreignkey',
      'constraint',
    ];
    if (
      obj == null ||
      (Object.keys(obj).length === 0 && obj.constructor === Object)
    )
      return false;
    for (var key of Object.keys(obj)) {
      if (keySchemaLevel.indexOf(key) === -1) return false;
      if (key === 'column' && typeof obj[key] != 'string') return false;
      if (key === 'value' && typeof obj[key] != 'string') return false;
      if (key === 'foreignkey' && typeof obj[key] != 'string') return false;
      if (key === 'constraint' && typeof obj[key] != 'string') return false;
    }
    return true;
  }
  /**
   * isIndexes
   * @param obj
   */
  private isIndexes(obj: any): boolean {
    const keyIndexesLevel: Array<string> = ['name', 'value', 'mode'];
    if (
      obj == null ||
      (Object.keys(obj).length === 0 && obj.constructor === Object)
    )
      return false;
    for (var key of Object.keys(obj)) {
      if (keyIndexesLevel.indexOf(key) === -1) return false;
      if (key === 'name' && typeof obj[key] != 'string') return false;
      if (key === 'value' && typeof obj[key] != 'string') return false;
      if (
        key === 'mode' &&
        (typeof obj[key] != 'string' || obj[key] != 'UNIQUE')
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
    const keyTriggersLevel: Array<string> = [
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
    for (var key of Object.keys(obj)) {
      if (keyTriggersLevel.indexOf(key) === -1) return false;
      if (key === 'name' && typeof obj[key] != 'string') return false;
      if (key === 'timeevent' && typeof obj[key] != 'string') return false;
      if (key === 'condition' && typeof obj[key] != 'string') return false;
      if (key === 'logic' && typeof obj[key] != 'string') return false;
    }
    return true;
  }

  /**
   * checkSchemaValidity
   * @param schema
   */
  public async checkSchemaValidity(schema: JsonColumn[]): Promise<void> {
    return new Promise(async (resolve, reject) => {
      for (let i: number = 0; i < schema.length; i++) {
        let sch: JsonColumn = {} as JsonColumn;
        let keys: string[] = Object.keys(schema[i]);
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
        let isValid: boolean = this.isSchema(sch);
        if (!isValid) {
          reject(new Error(`CheckSchemaValidity: schema[${i}] not valid`));
        }
      }
      resolve();
    });
  }
  /**
   * checkIndexesSchemaValidity
   * @param indexes
   */
  public async checkIndexesValidity(indexes: JsonIndex[]): Promise<void> {
    return new Promise(async (resolve, reject) => {
      for (let i: number = 0; i < indexes.length; i++) {
        let index: JsonIndex = {} as JsonIndex;
        let keys: string[] = Object.keys(indexes[i]);
        if (keys.includes('value')) {
          index.value = indexes[i].value;
        }
        if (keys.includes('name')) {
          index.name = indexes[i].name;
        }
        if (keys.includes('mode')) {
          index.mode = indexes[i].mode;
        }

        let isValid: boolean = this.isIndexes(index);
        if (!isValid) {
          reject(new Error(`CheckIndexesValidity: indexes[${i}] not valid`));
        }
      }
      resolve();
    });
  }
  /**
   * checkTriggersValidity
   * @param triggers
   */
  public async checkTriggersValidity(triggers: JsonTrigger[]): Promise<void> {
    return new Promise(async (resolve, reject) => {
      for (let i: number = 0; i < triggers.length; i++) {
        let trigger: JsonTrigger = {} as JsonTrigger;
        let keys: string[] = Object.keys(triggers[i]);
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

        let isValid: boolean = this.isTriggers(trigger);
        if (!isValid) {
          reject(new Error(`CheckTriggersValidity: triggers[${i}] not valid`));
        }
      }
      resolve();
    });
  }
}
