import { UtilsSQLite } from './utilsSQLite';

export class UtilsDrop {
  private sqliteUtil: UtilsSQLite = new UtilsSQLite();

  /**
   * DropElements
   * @param db
   * @param type ["table","index","trigger"]
   */
  public dropElements(db: any, type: string): void {
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
        throw new Error(`DropElements: ${type} ` + 'not found');
    }
    // get the element's names
    let stmt = 'SELECT name FROM sqlite_master WHERE ';
    stmt += `type = '${type}' ${stmt1};`;
    try {
      const elements: any[] = this.sqliteUtil.queryAll(db, stmt, []);
      if (elements.length > 0) {
        const upType: string = type.toUpperCase();
        const statements: string[] = [];
        for (const elem of elements) {
          let stmt = `DROP ${upType} IF EXISTS `;
          stmt += `${elem.name};`;
          statements.push(stmt);
        }
        for (const stmt of statements) {
          const results = this.sqliteUtil.prepareRun(db, stmt, [], false, 'no');
          if (results.lastId < 0) {
            throw new Error(`${msg}: lastId < 0`);
          }
        }
      }
      return;
    } catch (err) {
      throw new Error(`${msg}: ${err}`);
    }
  }
  /**
   * DropAll
   * Drop all database's elements
   * @param db
   */
  public dropAll(db: any): void {
    try {
      // drop tables
      this.dropElements(db, 'table');
      // drop indexes
      this.dropElements(db, 'index');
      // drop triggers
      this.dropElements(db, 'trigger');
      // drop views
      this.dropElements(db, 'view');
      // vacuum the database
      this.sqliteUtil.prepareRun(db, 'VACUUM;', [], false, 'no');
      return;
    } catch (err) {
      throw new Error(`DropAll: ${err}`);
    }
  }
  /**
   * DropTempTables
   * @param db
   * @param alterTables
   */
  public dropTempTables(db: any, alterTables: Record<string, string[]>): void {
    const tempTables: string[] = Object.keys(alterTables);
    const statements: string[] = [];
    for (const tTable of tempTables) {
      let stmt = 'DROP TABLE IF EXISTS ';
      stmt += `_temp_${tTable};`;
      statements.push(stmt);
    }
    try {
      const results = this.sqliteUtil.execute(db, statements.join('\n'), false);
      if (results.changes < 0) {
        throw new Error('DropTempTables: changes < 0');
      }
      return;
    } catch (err) {
      throw new Error(`DropTempTables: ${err}`);
    }
  }
}