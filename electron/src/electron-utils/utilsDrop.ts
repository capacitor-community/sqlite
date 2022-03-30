import { UtilsSQLite } from './utilsSQLite';

export class UtilsDrop {
  private _uSQLite: UtilsSQLite = new UtilsSQLite();

  /**
   * GetTablesNames
   * @param mDb
   */
  public async getTablesNames(mDb: any): Promise<string[]> {
    let sql = 'SELECT name FROM sqlite_master WHERE ';
    sql += "type='table' AND name NOT LIKE 'sync_table' ";
    sql += "AND name NOT LIKE '_temp_%' ";
    sql += "AND name NOT LIKE 'sqlite_%' ";
    sql += 'ORDER BY rootpage DESC;';
    const retArr: string[] = [];
    try {
      const retQuery: any[] = await this._uSQLite.queryAll(mDb, sql, []);
      for (const query of retQuery) {
        retArr.push(query.name);
      }
      return Promise.resolve(retArr);
    } catch (err) {
      return Promise.reject(`getTablesNames: ${err}`);
    }
  }
  /**
   * GetViewsNames
   * @param mDb
   */
  public async getViewsNames(mDb: any): Promise<string[]> {
    let sql = 'SELECT name FROM sqlite_master WHERE ';
    sql += "type='view' AND name NOT LIKE 'sqlite_%' ";
    sql += 'ORDER BY rootpage DESC;';
    const retArr: string[] = [];
    try {
      const retQuery: any[] = await this._uSQLite.queryAll(mDb, sql, []);
      for (const query of retQuery) {
        retArr.push(query.name);
      }
      return Promise.resolve(retArr);
    } catch (err) {
      return Promise.reject(`getViewsNames: ${err}`);
    }
  }
  /**
   * DropElements
   * @param db
   * @param type ["table","index","trigger"]
   */
  public async dropElements(db: any, type: string): Promise<void> {
    let msg = '';
    let stmt1 = `AND name NOT LIKE ('sqlite_%')`;

    switch (type) {
      case 'index':
        msg = 'DropIndexes';
        break;
      case 'trigger':
        msg = 'DropTriggers';
        break;
      case 'table':
        msg = 'DropTables';
        stmt1 += ` AND name NOT IN ('sync_table')`;
        break;
      case 'view':
        msg = 'DropViews';
        break;
      default:
        return Promise.reject(`DropElements: ${type} ` + 'not found');
    }
    // get the element's names
    let stmt = 'SELECT name FROM sqlite_master WHERE ';
    stmt += `type = '${type}' ${stmt1};`;
    try {
      const elements: any[] = await this._uSQLite.queryAll(db, stmt, []);
      if (elements.length > 0) {
        const upType: string = type.toUpperCase();
        const statements: string[] = [];
        for (const elem of elements) {
          let stmt = `DROP ${upType} IF EXISTS `;
          stmt += `${elem.name};`;
          statements.push(stmt);
        }
        for (const stmt of statements) {
          const lastId: number = await this._uSQLite.prepareRun(db, stmt, []);
          if (lastId < 0) {
            return Promise.reject(`${msg}: lastId < 0`);
          }
        }
      }
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(`${msg}: ${err}`);
    }
  }
  /**
   * DropAll
   * Drop all database's elements
   * @param db
   */
  public async dropAll(db: any): Promise<void> {
    try {
      // drop tables
      await this.dropElements(db, 'table');
      // drop indexes
      await this.dropElements(db, 'index');
      // drop triggers
      await this.dropElements(db, 'trigger');
      // drop views
      await this.dropElements(db, 'view');
      // vacuum the database
      await this._uSQLite.prepareRun(db, 'VACUUM;', []);
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(`DropAll: ${err}`);
    }
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
    const tempTables: string[] = Object.keys(alterTables);
    const statements: string[] = [];
    for (const tTable of tempTables) {
      let stmt = 'DROP TABLE IF EXISTS ';
      stmt += `_temp_${tTable};`;
      statements.push(stmt);
    }
    try {
      const changes: number = await this._uSQLite.execute(
        db,
        statements.join('\n'),
      );
      if (changes < 0) {
        return Promise.reject('DropTempTables: changes < 0');
      }
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(`DropTempTables: ${err}`);
    }
  }
}
