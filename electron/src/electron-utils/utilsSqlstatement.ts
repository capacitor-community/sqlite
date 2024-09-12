export class UtilsSQLStatement {
  public extractTableName(statement: string): string | null {
    const pattern = /(?:INSERT\s+INTO|UPDATE|DELETE\s+FROM)\s+([^\s]+)/i;
    const match = statement.match(pattern);
    if (match?.[1]) {
      const tableName = match[1];
      return tableName;
    }
    return null;
  }

  public extractWhereClause(statement: string): string | null {
    const pattern = /WHERE(.+?)(?:ORDER\s+BY|LIMIT|$)/i;
    const match = statement.match(pattern);
    if (match?.[1]) {
      const whereClause = match[1].trim();
      return whereClause;
    }
    return null;
  }

  public addPrefixToWhereClause(whereClause: string, colNames: string[], refNames: string[], prefix: string): string {
    let columnValuePairs: string[];
    if (whereClause.includes('AND')) {
      // Split the WHERE clause based on the "AND" keyword
      const subSequenceArray = whereClause.split('AND');
      columnValuePairs = subSequenceArray.map((pair) => pair.trim());
    } else {
      columnValuePairs = [whereClause];
    }

    const modifiedPairs = columnValuePairs.map((pair) => {
      const match = pair.match(/(\w+)\s*(=|IN|BETWEEN|LIKE)\s*(.+)/);
      if (!match) {
        return pair;
      }

      const column = match[1].trim();
      const operator = match[2].trim();
      const value = match[3].trim();
      let newColumn = column;
      const index: number = this.findIndexOfStringInArray(column, refNames);
      if (index !== -1) {
        newColumn = this.getStringAtIndex(colNames, index);
      }
      const modifiedColumn = `${prefix}${newColumn}`;
      const ret = `${modifiedColumn} ${operator} ${value}`;
      return ret;
    });

    return modifiedPairs.join(' AND ');
  }

  public findIndexOfStringInArray(target: string, array: string[]): number {
    return array.indexOf(target);
  }
  public getStringAtIndex(array: string[], index: number): string | undefined {
    if (index >= 0 && index < array.length) {
      return array[index];
    } else {
      return undefined;
    }
  }
  public extractForeignKeyInfo(sqlStatement: string): {
    forKeys: string[];
    tableName: string;
    refKeys: string[];
    action: string;
  } {
    // Define the regular expression pattern for extracting the FOREIGN KEY clause
    const foreignKeyPattern =
      /\bFOREIGN\s+KEY\s*\(([^)]+)\)\s+REFERENCES\s+(\w+)\s*\(([^)]+)\)\s+(ON\s+DELETE\s+(RESTRICT|CASCADE|SET\s+NULL|SET\s+DEFAULT|NO\s+ACTION))?/;
    const matches = sqlStatement.match(foreignKeyPattern);

    if (matches) {
      const foreignKeyInfo = {
        forKeys: matches[1].split(',').map((key) => key.trim()),
        tableName: matches[2],
        refKeys: matches[3].split(',').map((key) => key.trim()),
        action: matches[5] ? matches[5] : 'NO ACTION',
      };
      return foreignKeyInfo;
    } else {
      throw new Error('extractForeignKeyInfo: No FOREIGN KEY found');
    }
  }
  public extractColumnNames(whereClause: string): string[] {
    const keywords: Set<string> = new Set(['AND', 'OR', 'IN', 'VALUES', 'LIKE', 'BETWEEN', 'NOT']);

    const regex =
      /\b[a-zA-Z]\w*\b(?=\s*(?:<=?|>=?|<>?|=|AND|OR|BETWEEN|NOT|IN|LIKE))|\b[a-zA-Z]\w*\b\s+BETWEEN\s+'[^']+'\s+AND\s+'[^']+'|\(([^)]+)\)\s+IN\s+\(?\s*VALUES\s*\(/g;
    let match;
    const columns: string[] = [];

    while ((match = regex.exec(whereClause)) !== null) {
      const columnList = match[1];
      if (columnList) {
        const columnNamesArray = columnList.split(',');
        for (const columnName of columnNamesArray) {
          columns.push(columnName.trim());
        }
      } else {
        const matchedText = match[0];
        if (!keywords.has(matchedText.trim().toUpperCase())) {
          columns.push(matchedText.trim());
        }
      }
    }

    return columns;
  }

  public flattenMultilineString(input: string): string {
    const lines = input.split(/\r?\n/);
    return lines.join(' ');
  }

  public extractCombinedPrimaryKey(whereClause: string): string[][] | null {
    const pattern = /WHERE\s*\((.+?)\)\s*(?:=|IN)\s*\((.+?)\)/g;
    const regex = new RegExp(pattern);
    const matches = whereClause.matchAll(regex);

    const primaryKeySets: string[][] = [];
    for (const match of matches) {
      const keysString = match[1].trim();
      const keys = keysString.split(',').map((key) => key.trim());
      primaryKeySets.push(keys);
    }

    return primaryKeySets.length === 0 ? null : primaryKeySets;
  }

  public getWhereStmtForCombinedPK(whStmt: string, withRefs: string[], colNames: string[], keys: string[][]): string {
    let retWhere: string = whStmt;

    for (const grpKeys of keys) {
      const repKeys: string[] = grpKeys.join(',') === withRefs.join(',') ? colNames : withRefs;
      for (const [index, key] of grpKeys.entries()) {
        retWhere = this.replaceAllString(retWhere, key, repKeys[index]);
      }
    }

    return retWhere;
  }

  public replaceAllString(originalStr: string, searchStr: string, replaceStr: string): string {
    return originalStr.split(searchStr).join(replaceStr);
  }

  public replaceString = (originalStr: string, searchStr: string, replaceStr: string): string => {
    const range = originalStr.indexOf(searchStr);
    if (range !== -1) {
      const modifiedStr =
        originalStr.substring(0, range) + replaceStr + originalStr.substring(range + searchStr.length);
      return modifiedStr;
    }
    return originalStr;
  };

  public indicesOf(str: string, searchStr: string, fromIndex = 0): number[] {
    // Helper function to find indices of a substring within a string
    const indices: number[] = [];
    let currentIndex = str.indexOf(searchStr, fromIndex);
    while (currentIndex !== -1) {
      indices.push(currentIndex);
      currentIndex = str.indexOf(searchStr, currentIndex + 1);
    }
    return indices;
  }

  public getWhereStmtForNonCombinedPK(whStmt: string, withRefs: string[], colNames: string[]): string {
    let whereStmt = '';
    let stmt: string = whStmt.substring(6);

    for (let idx = 0; idx < withRefs.length; idx++) {
      let colType = 'withRefsNames';
      let idxs: number[] = this.indicesOf(stmt, withRefs[idx]);
      if (idxs.length === 0) {
        idxs = this.indicesOf(stmt, colNames[idx]);
        colType = 'colNames';
      }

      if (idxs.length > 0) {
        let valStr = '';
        const indicesEqual = this.indicesOf(stmt, '=', idxs[0]);

        if (indicesEqual.length > 0) {
          const indicesAnd = this.indicesOf(stmt, 'AND', indicesEqual[0]);

          if (indicesAnd.length > 0) {
            valStr = stmt.substring(indicesEqual[0] + 1, indicesAnd[0] - 1);
            stmt = stmt.substring(indicesAnd[0] + 3);
          } else {
            valStr = stmt.substring(indicesEqual[0] + 1);
          }
          if (idx > 0) {
            whereStmt += ' AND ';
          }

          if (colType === 'withRefsNames') {
            whereStmt += colNames[idx] + ' = ' + valStr;
          } else {
            whereStmt += withRefs[idx] + ' = ' + valStr;
          }
        }
      }
    }

    whereStmt = 'WHERE ' + whereStmt;
    return whereStmt;
  }

  public updateWhere(whStmt: string, withRefs: string[], colNames: string[]): string {
    let whereStmt = '';
    if (whStmt.length <= 0) {
      return whereStmt;
    }
    if (whStmt.toUpperCase().substring(0, 5) !== 'WHERE') {
      return whereStmt;
    }

    if (withRefs.length === colNames.length) {
      // get whereStmt for primary combined key
      const keys = this.extractCombinedPrimaryKey(whStmt);
      if (keys) {
        whereStmt = this.getWhereStmtForCombinedPK(whStmt, withRefs, colNames, keys);
      } else {
        // get for non primary combined key
        whereStmt = this.getWhereStmtForNonCombinedPK(whStmt, withRefs, colNames);
      }
    }
    return whereStmt;
  }
}
