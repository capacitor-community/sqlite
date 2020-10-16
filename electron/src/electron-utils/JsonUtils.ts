/* JSON function */
export function isJsonSQLite(obj: any): boolean {
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
        const retTable: boolean = isTable(obj[key][i]);
        if (!retTable) return false;
      }
    }
  }
  return true;
}
export function isTable(obj: any): boolean {
  const keyTableLevel: Array<string> = ['name', 'schema', 'indexes', 'values'];
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
    if (key === 'values' && typeof obj[key] != 'object') return false;
    if (key === 'schema') {
      obj['schema'].forEach(
        (element: { column?: string; value: string; foreignkey?: string }) => {
          if (element.column) {
            nbColumn++;
          }
        },
      );
      for (let i: number = 0; i < nbColumn; i++) {
        const retSchema: boolean = isSchema(obj[key][i]);
        if (!retSchema) return false;
      }
    }
    if (key === 'indexes') {
      for (let i: number = 0; i < obj[key].length; i++) {
        const retIndexes: boolean = isIndexes(obj[key][i]);
        if (!retIndexes) return false;
      }
    }
    if (key === 'values') {
      if (nbColumn > 0) {
        for (let i: number = 0; i < obj[key].length; i++) {
          if (typeof obj[key][i] != 'object' || obj[key][i].length != nbColumn)
            return false;
        }
      }
    }
  }

  return true;
}
function isSchema(obj: any): boolean {
  const keySchemaLevel: Array<string> = ['column', 'value', 'foreignkey'];
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
  }
  return true;
}
function isIndexes(obj: any): boolean {
  const keyIndexesLevel: Array<string> = ['name', 'column'];
  if (
    obj == null ||
    (Object.keys(obj).length === 0 && obj.constructor === Object)
  )
    return false;
  for (var key of Object.keys(obj)) {
    if (keyIndexesLevel.indexOf(key) === -1) return false;
    if (key === 'name' && typeof obj[key] != 'string') return false;
    if (key === 'column' && typeof obj[key] != 'string') return false;
  }
  return true;
}
