import { UtilsSQLite } from './utilsSQLite';

export class UtilsDrop {
  private _uSQLite: UtilsSQLite = new UtilsSQLite();

  /**
   * GetTablesNames
   * @param mDb
   */
  public async getTablesNames(mDb: any): Promise<string[]> {
    return new Promise(async (resolve, reject) => {
      let sql: string = 'SELECT name FROM sqlite_master WHERE ';
      sql += "type='table' AND name NOT LIKE 'sync_table' ";
      sql += "AND name NOT LIKE '_temp_%' ";
      sql += "AND name NOT LIKE 'sqlite_%' ";
      sql += 'ORDER BY rootpage DESC;';
      let retArr: string[] = [];
      try {
        const retQuery: any[] = await this._uSQLite.queryAll(mDb, sql, []);
        for (let i: number = 0; i < retQuery.length; i++) {
          retArr.push(retQuery[i].name);
        }
        resolve(retArr);
      } catch (err) {
        reject(new Error(`getTablesNames: ${err.message}`));
      }
    });
  }
  /**
   * DropElements
   * @param db
   * @param type ["table","index","trigger"]
   */
  public async dropElements(db: any, type: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      let msg: string = '';
      switch (type) {
        case 'index':
          msg = 'DropIndexes';
          break;
        case 'trigger':
          msg = 'DropTriggers';
          break;
        case 'table':
          msg = 'DropTables';
          break;
        default:
          reject(new Error(`DropElements: ${type} ` + 'not found'));
          break;
      }
      // get the element's names
      let stmt: string = 'SELECT name FROM sqlite_master WHERE ';
      stmt += `type = '${type}' AND name NOT LIKE 'sqlite_%';`;
      try {
        let elements: Array<any> = await this._uSQLite.queryAll(db, stmt, []);
        if (elements.length > 0) {
          let upType: string = type.toUpperCase();
          let statements: Array<string> = [];
          for (let i: number = 0; i < elements.length; i++) {
            let stmt: string = `DROP ${upType} IF EXISTS `;
            stmt += `${elements[i].name};`;
            statements.push(stmt);
          }
          for (let i: number = 0; i < statements.length; i++) {
            const lastId: number = await this._uSQLite.prepareRun(
              db,
              statements[i],
              [],
            );
            if (lastId < 0) {
              reject(new Error(`${msg}: lastId < 0`));
            }
          }
        }
        resolve();
      } catch (err) {
        reject(new Error(`${msg}: ${err.message}`));
      }
    });
  }
  /**
   * DropAll
   * Drop all database's elements
   * @param db
   */
  public async dropAll(db: any): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // drop tables
        await this.dropElements(db, 'table');
        // drop indexes
        await this.dropElements(db, 'index');
        // drop triggers
        await this.dropElements(db, 'trigger');
        // vacuum the database
        await this._uSQLite.prepareRun(db, 'VACUUM;', []);
        resolve();
      } catch (err) {
        reject(new Error(`DropAll: ${err.message}`));
      }
    });
  }
  /**
   * DropTempTables
   * @param db
   * @param alterTables
   */
  public async dropTempTables(
    db: any,
    alterTables: Record<string, string[]>,
  ): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const tempTables: Array<string> = Object.keys(alterTables);
      const statements: Array<string> = [];
      for (let i: number = 0; i < tempTables.length; i++) {
        let stmt = 'DROP TABLE IF EXISTS ';
        stmt += `_temp_${tempTables[i]};`;
        statements.push(stmt);
      }
      try {
        const changes: number = await this._uSQLite.execute(
          db,
          statements.join('\n'),
        );
        if (changes < 0) {
          reject(new Error('DropTempTables: changes < 0'));
        }
        resolve();
      } catch (err) {
        reject(new Error(`DropTempTables: ${err.message}`));
      }
    });
  }
}
