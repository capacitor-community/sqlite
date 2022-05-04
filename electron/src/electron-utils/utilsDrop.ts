import { UtilsSQLite } from './utilsSQLite';

export class UtilsDrop {
  private sqliteUtil: UtilsSQLite = new UtilsSQLite();

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
      const elements: any[] = await this.sqliteUtil.queryAll(db, stmt, []);
      if (elements.length > 0) {
        const upType: string = type.toUpperCase();
        const statements: string[] = [];
        for (const elem of elements) {
          let stmt = `DROP ${upType} IF EXISTS `;
          stmt += `${elem.name};`;
          statements.push(stmt);
        }
        for (const stmt of statements) {
          const lastId: number = await this.sqliteUtil.prepareRun(
            db,
            stmt,
            [],
            false,
          );
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
      await this.sqliteUtil.prepareRun(db, 'VACUUM;', [], false);
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
      const changes: number = await this.sqliteUtil.execute(
        db,
        statements.join('\n'),
        false,
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
