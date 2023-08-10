
class UtilsDeleteError {
  static upDateWhereForDefault(message: string) {
    return new UtilsDeleteError(message);
  }
  static upDateWhereForRestrict(message: string) {
    return new UtilsDeleteError(message);
  }
  static upDateWhereForCascade(message: string) {
    return new UtilsDeleteError(message);
  }
  static executeUpdateForDelete(message: string) {
    return new UtilsDeleteError(message);
  }

  constructor(public message: string) {}
}

export class UtilsDelete {

  public getReferencedTableName(refValue: string): string {
    let tableName = '';

    if (refValue.length > 0) {
      const arr: string[] = refValue.split(new RegExp('REFERENCES','i'));
      if (arr.length === 2) {
        const oPar: number = arr[1].indexOf("(");
        tableName = arr[1].substring(0, oPar).trim();
      }
    }
    return tableName;
  }


  public upDateWhereForDefault(
                    withRefsNames: string[],
                    results: { key: string, relatedItems: any[] }
                  ): { setStmt: string; uWhereStmt: string } {
    let setStmt = '';
    let uWhereStmt = '';
    try {

      const key = results.key;
      const cols: any[] = [];
      for (const relItem of results.relatedItems) {
        const mVal = relItem[key];
        if (mVal !== undefined) {
          cols.push(mVal);
        }
      }

      // Create the set statement
      for (const name of withRefsNames) {
        setStmt += `${name} = NULL, `;
      }
      setStmt += 'sql_deleted = 0';

      // Create the where statement
      uWhereStmt = `WHERE ${key} IN (`;
      for (const col of cols) {
        uWhereStmt += `${col},`;
      }
      if (uWhereStmt.endsWith(',')) {
        uWhereStmt = uWhereStmt.slice(0, -1);
      }
      uWhereStmt += ');';
    } catch (error) {
      const msg = error.message ? error.message : error;
      throw UtilsDeleteError.upDateWhereForDefault(msg);
    }
    return { setStmt, uWhereStmt };
  }

  public upDateWhereForRestrict(
                        results: { key: string, relatedItems: any[] }
                      ): { setStmt: string; uWhereStmt: string } {
    try {
      const setStmt = '';
      const uWhereStmt = '';
      if (results.relatedItems.length > 0) {
        const msg =
          'Restrict mode related items exist, please delete them first';
        throw UtilsDeleteError.upDateWhereForRestrict(msg);
      }
      return { setStmt, uWhereStmt };
    } catch (error) {
      const msg = error.message ? error.message : error;
      throw UtilsDeleteError.upDateWhereForRestrict(
        msg
      );
    }
  }
  public upDateWhereForCascade(
                      results: { key: string, relatedItems: any[] }
                    ): { setStmt: string; uWhereStmt: string } {
    let setStmt = '';
    let uWhereStmt = '';
    try {
      const key = results.key;
      const cols: any[] = [];
      for (const relItem of results.relatedItems) {
        const mVal = relItem[key];
        if (mVal !== undefined) {
          cols.push(mVal);
        }
      }
      setStmt += 'sql_deleted = 1';

      // Create the where statement
      uWhereStmt = `WHERE ${key} IN (`;
      for (const col of cols) {
        uWhereStmt += `${col},`;
      }
      if (uWhereStmt.endsWith(',')) {
        uWhereStmt = uWhereStmt.slice(0, -1);
      }
      uWhereStmt += ');';

    } catch (error) {
      const msg = error.message ? error.message : error;
      throw UtilsDeleteError.upDateWhereForCascade(msg);
    }
    return { setStmt, uWhereStmt };
  }

  public getCurrentTimeAsInteger(): number {
    const currentTime = Math.floor(Date.now() / 1000);
    return currentTime;
  }

  public checkValuesMatch(array1: string[], array2: string[]): boolean {
    for (const value of array1) {
      if (!array2.includes(value)) {
        return false;
      }
    }
    return true;
  }
}
