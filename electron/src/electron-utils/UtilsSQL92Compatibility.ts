export class UtilsSQL92Compatibility {
  public compatibleSQL92(statement: string): string {
    let newStatement = '';
    const action = statement.trim().split(' ')[0].toUpperCase();
    switch (action) {
      case 'INSERT':
        newStatement = this.insertSQL92(statement);
        break;
      case 'UPDATE':
        newStatement = this.updateSQL92(statement);
        break;
      case 'DELETE':
      case 'SELECT':
        newStatement = this.whereSQL92(statement);
        break;
      default:
        throw new Error(`Error: ${action} not implemented`);
    }
    return newStatement;
  }
  public insertSQL92(insertStatement: string): string {
    // Split the statement into parts
    const inStmt = insertStatement.trim();
    const valuesStartIndex = inStmt.indexOf('VALUES');
    const columnsPart = inStmt.substring(0, valuesStartIndex);
    const valuesPart = inStmt.substring(valuesStartIndex);

    // Extract values and replace double quotes with single quotes
    const modifiedValuesPart = valuesPart.replace(/"([^"]+)"/g, "'$1'");

    // Reconstruct the modified statement
    const modifiedStatement = columnsPart + modifiedValuesPart;
    return modifiedStatement;
  }

  public updateSQL92(updateStatement: string): string {
    // Split the statement into SET and WHERE parts
    let isWhere = true;
    const setWhereSplit = updateStatement.toUpperCase().split('WHERE');
    if (setWhereSplit.length <= 1) isWhere = false;
    const setUpdate = setWhereSplit[0].toUpperCase().split('SET')[0].trim();
    const setPart = setWhereSplit[0].toUpperCase().split('SET')[1].trim();
    const modifiedSetPart = this.modSetPart(setPart);
    let modifiedStatement = `${setUpdate} SET ${modifiedSetPart}`;
    if (isWhere) {
      for (let i = 1; i < setWhereSplit.length; i++) {
        const wherePart = setWhereSplit[i].trim();
        const modifiedWherePart = this.modWherePart(wherePart);
        modifiedStatement += ` WHERE ${modifiedWherePart}`;
      }
    }
    return modifiedStatement;
  }

  public whereSQL92(statement: string): string {
    // Split the statement into SET and WHERE parts
    const setWhereSplit = statement.toUpperCase().split('WHERE');
    if (setWhereSplit.length <= 1) return statement;
    let modifiedStatement = `${setWhereSplit[0].trim()}`;
    for (let i = 1; i < setWhereSplit.length; i++) {
      const wherePart = setWhereSplit[1].trim();
      const modifiedWherePart = this.modWherePart(wherePart);
      modifiedStatement += ` WHERE ${modifiedWherePart}`;
    }
    return modifiedStatement;
  }

  public modSetPart(setStatement: string): string {
    const commaPart = setStatement.split(',');
    const modCommaPart = [];
    for (const com of commaPart) {
      const equalPart = com.split('=');
      const value = equalPart[1].replaceAll(`"`, `'`);
      modCommaPart.push(`${equalPart[0].trim()} = ${value.trim()}`);
    }
    return modCommaPart.toString();
  }
  public modWherePart(whereStatement: string): string {
    const keywords: Set<string> = new Set([
      '=',
      '<>',
      '>',
      '>=',
      '<',
      '<=',
      'IN',
      'VALUES',
      '(',
      ',',
      ')',
      'BETWEEN',
      'LIKE',
      'AND',
      'OR',
      'NOT',
    ]);
    const newTokens: string[] = [];
    const tokens = whereStatement
      .split(/(\s|,|\(|\))/)
      .filter((item) => item !== ' ')
      .filter((item) => item !== '');
    let inClause = false;
    let inValues = false;
    let modValue = false;
    let betwClause = false;
    let opsClause = false;
    let inValValues = false;
    let inValPar = false;
    for (const token of tokens) {
      if (new Set(['=', '<>', '>', '>=', '<', '<=']).has(token)) {
        newTokens.push(token);
        modValue = true;
        opsClause = false;
      } else if (token.toUpperCase() === 'BETWEEN') {
        newTokens.push(token);
        betwClause = true;
        modValue = true;
        opsClause = false;
      } else if (betwClause && token.toUpperCase() === 'AND') {
        newTokens.push(token);
        modValue = true;
        betwClause = false;
      } else if (token.toUpperCase() === 'LIKE') {
        newTokens.push(token);
        opsClause = false;
        modValue = true;
      } else if (token.toUpperCase() === 'AND' || token.toUpperCase() === 'OR' || token.toUpperCase() === 'NOT') {
        newTokens.push(token);
        opsClause = true;
      } else if (token.toUpperCase() === 'IN') {
        newTokens.push(token);
        opsClause = false;
        inClause = true;
      } else if (inClause && token === '(') {
        newTokens.push(token);
        modValue = true;
        inValues = true;
      } else if (inValues && token.toUpperCase() === ',') {
        newTokens.push(token);
        modValue = true;
      } else if (inValues && token.toUpperCase() === 'VALUES') {
        newTokens.push(token);
        inValues = false;
        inValValues = true;
        inClause = false;
      } else if (inValValues && token === '(') {
        newTokens.push(token);
        inValPar = true;
        modValue = true;
      } else if (inValPar && token.toUpperCase() === ',') {
        newTokens.push(token);
        modValue = true;
      } else if (inValPar && inValValues && token === ')') {
        newTokens.push(token);
        inValPar = false;
        inValues = true;
      } else if ((inValues || inValValues) && token === ')') {
        newTokens.push(token);
        inValValues = false;
        inValues = false;
        inClause = false;
      } else if (modValue && !opsClause && !keywords.has(token.toUpperCase())) {
        if (token.length > 0) {
          const nwToken = token.replaceAll(`"`, `'`);
          newTokens.push(nwToken);
          modValue = false;
        }
      } else {
        newTokens.push(token);
      }
    }
    const ns = newTokens.join(' ');
    return ns;
  }
}
