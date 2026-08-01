/**
 * JSON shape validation, ported from
 * `electron/src/electron-utils/ImportExportJson/utilsJson.ts` (MIT, this repo), cross-checked
 * against jeep-sqlite (MIT), which carries the same logic under the same names.
 *
 * The rules are deliberately conservative and key-exact: an unknown key anywhere in the object
 * makes the whole thing invalid. `isJsonValid` is a public plugin method, so loosening this
 * would change a documented contract, not just an internal check.
 *
 * The format itself is specified in `docs/ImportExportJson.md`.
 */
import type { JsonColumn, JsonIndex, JsonSQLite, JsonTrigger, JsonView } from '../../../definitions';

const FIRST_LEVEL_KEYS = ['database', 'version', 'overwrite', 'encrypted', 'mode', 'tables', 'views'];
const TABLE_KEYS = ['name', 'schema', 'indexes', 'triggers', 'values'];
const SCHEMA_KEYS = ['column', 'value', 'foreignkey', 'primarykey', 'constraint'];
const INDEX_KEYS = ['name', 'value', 'mode'];
const TRIGGER_KEYS = ['name', 'timeevent', 'condition', 'logic'];
const VIEW_KEYS = ['name', 'value'];

function isEmptyObject(obj: any): boolean {
  return obj == null || (Object.keys(obj).length === 0 && obj.constructor === Object);
}

/** Every key present must be known, and every known key present must have the right type. */
function keysAreTyped(obj: any, allowed: string[], types: Record<string, (v: any) => boolean>): boolean {
  if (isEmptyObject(obj)) return false;
  for (const key of Object.keys(obj)) {
    if (allowed.indexOf(key) === -1) return false;
    const check = types[key];
    if (check && !check(obj[key])) return false;
  }
  return true;
}

const isString = (v: any) => typeof v === 'string';
const isNumber = (v: any) => typeof v === 'number';
const isBoolean = (v: any) => typeof v === 'boolean';
const isObject = (v: any) => typeof v === 'object';

export function isSchema(obj: any): boolean {
  return keysAreTyped(obj, SCHEMA_KEYS, {
    column: isString,
    value: isString,
    foreignkey: isString,
    primarykey: isString,
    constraint: isString,
  });
}

export function isIndex(obj: any): boolean {
  return keysAreTyped(obj, INDEX_KEYS, {
    name: isString,
    value: isString,
    // The only index modifier the format accepts.
    mode: (v: any) => typeof v === 'string' && v.toUpperCase() === 'UNIQUE',
  });
}

export function isTrigger(obj: any): boolean {
  return keysAreTyped(obj, TRIGGER_KEYS, {
    name: isString,
    timeevent: isString,
    condition: isString,
    logic: isString,
  });
}

export function isView(obj: any): boolean {
  return keysAreTyped(obj, VIEW_KEYS, { name: isString, value: isString });
}

export function isTable(obj: any): boolean {
  if (
    !keysAreTyped(obj, TABLE_KEYS, {
      name: isString,
      schema: isObject,
      indexes: isObject,
      triggers: isObject,
      values: isObject,
    })
  ) {
    return false;
  }

  // Column count comes from the schema and constrains the width of every value row.
  let columnCount = 0;
  if (obj.schema) {
    for (const element of obj.schema) {
      if (element?.column) columnCount++;
    }
    for (let i = 0; i < columnCount; i++) {
      if (!isSchema(obj.schema[i])) return false;
    }
  }
  if (obj.indexes) {
    for (const index of obj.indexes) if (!isIndex(index)) return false;
  }
  if (obj.triggers) {
    for (const trigger of obj.triggers) if (!isTrigger(trigger)) return false;
  }
  if (obj.values && columnCount > 0) {
    for (const row of obj.values) {
      if (typeof row !== 'object' || row.length !== columnCount) return false;
    }
  }
  return true;
}

export function isJsonSQLite(obj: any): boolean {
  if (
    !keysAreTyped(obj, FIRST_LEVEL_KEYS, {
      database: isString,
      version: isNumber,
      overwrite: isBoolean,
      encrypted: isBoolean,
      mode: isString,
      tables: isObject,
      views: isObject,
    })
  ) {
    return false;
  }
  if (obj.tables) {
    for (const table of obj.tables) if (!isTable(table)) return false;
  }
  if (obj.views) {
    for (const view of obj.views) if (!isView(view)) return false;
  }
  return true;
}

/**
 * The check* helpers rebuild each object from its known keys before validating, so a stray key
 * is dropped rather than failing. That asymmetry with isJsonSQLite is intentional and matches
 * the port source: these run on data the plugin itself produced during export.
 */
function pick<T extends object>(source: any, keys: string[]): T {
  const out: any = {};
  for (const key of keys) {
    if (Object.keys(source).includes(key)) out[key] = source[key];
  }
  return out as T;
}

export function checkSchemaValidity(schema: JsonColumn[]): void {
  schema.forEach((entry, index) => {
    if (!isSchema(pick<JsonColumn>(entry, ['column', 'value', 'foreignkey', 'constraint']))) {
      throw new Error(`CheckSchemaValidity: schema[${index}] not valid`);
    }
  });
}

export function checkIndexesValidity(indexes: JsonIndex[]): void {
  indexes.forEach((entry, index) => {
    if (!isIndex(pick<JsonIndex>(entry, ['name', 'value', 'mode']))) {
      throw new Error(`CheckIndexesValidity: indexes[${index}] not valid`);
    }
  });
}

export function checkTriggersValidity(triggers: JsonTrigger[]): void {
  triggers.forEach((entry, index) => {
    if (!isTrigger(pick<JsonTrigger>(entry, ['name', 'timeevent', 'condition', 'logic']))) {
      throw new Error(`CheckTriggersValidity: triggers[${index}] not valid`);
    }
  });
}

export function checkViewsValidity(views: JsonView[]): void {
  views.forEach((entry, index) => {
    if (!isView(pick<JsonView>(entry, ['name', 'value']))) {
      throw new Error(`CheckViewsValidity: views[${index}] not valid`);
    }
  });
}

/** Parse and validate in one step, with the error text the plugin has always used. */
export function parseJsonSQLite(jsonstring: string): JsonSQLite {
  let parsed: any;
  try {
    parsed = JSON.parse(jsonstring);
  } catch (err) {
    throw new Error(`ImportFromJson: Stringify Json Object not Valid`);
  }
  if (!isJsonSQLite(parsed)) {
    throw new Error(`ImportFromJson: Stringify Json Object not Valid`);
  }
  return parsed as JsonSQLite;
}
