//1234567890123456789012345678901234567890123456789012345678901234567890
export class UtilsJson {
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
      db.get(query, (err: Error, row: any) => {
        // process the row here
        if (err) {
          reject(`isTableExists: failed: ${err.message}`);
        } else {
          if (row == null) {
            resolve(false);
          } else {
            resolve(true);
          }
        }
      });
    });
  }
}
