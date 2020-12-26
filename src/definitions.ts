declare module '@capacitor/core' {
  interface PluginRegistry {
    CapacitorSQLite: CapacitorSQLitePlugin;
  }
}

export interface CapacitorSQLitePlugin {
  /**
   * Echo a given string
   *
   * @param options: capEchoOptions
   * @return Promise<{ value: string }
   * @since 0.0.1
   */
  echo(options: capEchoOptions): Promise<capEchoResult>;
  /**
   * Open a SQLite database
   * @param options: capSQLiteOptions
   * @returns Promise<capSQLiteResult>
   * @since 0.0.1
   */
  open(options: capSQLiteOptions): Promise<capSQLiteResult>;
  /**
   * Close a SQLite database
   * @param options: capSQLiteOptions
   * @returns Promise<capSQLiteResult>
   * @since 0.0.1
   */
  close(options: capSQLiteOptions): Promise<capSQLiteResult>;
  /**
   * Execute a Batch of Raw Statements as String
   * @param options: capSQLiteExecuteOptions
   * @returns Promise<capSQLiteChanges>
   * @since 0.0.1
   */
  execute(options: capSQLiteExecuteOptions): Promise<capSQLiteChanges>;
  /**
   * Execute a Set of Raw Statements as Array of CapSQLiteSet
   * @param options: capSQLiteSetOptions
   * @returns Promise<capSQLiteChanges>
   * @since 2.2.0-2
   */
  executeSet(options: capSQLiteSetOptions): Promise<capSQLiteChanges>;
  /**
   * Execute a Single Statement
   * @param options: capSQLiteRunOptions
   * @returns Promise<capSQLiteChanges>
   * @since 0.0.1
   */
  run(options: capSQLiteRunOptions): Promise<capSQLiteChanges>;
  /**
   * Query a Single Statement
   * @param options: capSQLiteQueryOptions
   * @returns Promise<capSQLiteValues>
   * @since 0.0.1
   */
  query(options: capSQLiteQueryOptions): Promise<capSQLiteValues>;
  /**
   * Check is a SQLite database exists
   * @param options: capSQLiteOptions
   * @returns Promise<capSQLiteResult>
   * @since 2.0.1-1
   */
  isDBExists(options: capSQLiteOptions): Promise<capSQLiteResult>;
  /**
   * Delete a SQLite database
   * @param options: capSQLiteOptions
   * @returns Promise<capSQLiteResult>
   * @since 0.0.1
   */
  deleteDatabase(options: capSQLiteOptions): Promise<capSQLiteResult>;
  /**
   * Is Json Object Valid
   * @param options: capSQLiteImportOptions
   * @returns Promise<capSQLiteResult>
   * @since 2.0.1-1
   */
  isJsonValid(options: capSQLiteImportOptions): Promise<capSQLiteResult>;
  /**
   * Import from Json Object
   * @param options: capSQLiteImportOptions
   * @returns Promise<capSQLiteChanges>
   * @since 2.0.0-3
   */
  importFromJson(options: capSQLiteImportOptions): Promise<capSQLiteChanges>;
  /**
   * Export to Json Object
   * @param options: capSQLiteExportOptions
   * @returns Promise<capSQLiteJson>
   * @since 2.0.1-1
   */
  exportToJson(options: capSQLiteExportOptions): Promise<capSQLiteJson>;
  /**
   * Create a synchronization table
   * @returns Promise<capSQLiteChanges>
   * @since 2.0.1-1
   */
  createSyncTable(): Promise<capSQLiteChanges>;
  /**
   * Set the synchronization date
   * @param options: capSQLiteSyncDateOptions
   * @returns Promise<capSQLiteResult>
   * @since 2.0.1-1
   */
  setSyncDate(options: capSQLiteSyncDateOptions): Promise<capSQLiteResult>;
  /**
   * Add the upgrade Statement for database version upgrading
   * @param options: capSQLiteUpgradeOptions
   * @returns Promise<capSQLiteResult>
   * @since 2.4.2-6 iOS & Electron 2.4.2-7 Android
   */
  addUpgradeStatement(
    options: capSQLiteUpgradeOptions,
  ): Promise<capSQLiteResult>;
}
export interface capEchoOptions {
  /**
   *  String to be echoed
   */
  value?: string;
}

export interface capSQLiteOptions {
  /**
   * The database name
   */
  database?: string;
  /**
   * The database  version
   */
  version?: number;
  /**
   * Set to true (database encryption) / false
   * - Open method only
   */
  encrypted?: boolean;
  /**
   * Set the mode for database encryption
   * ["encryption", "secret", "newsecret"]
   * - Open method only
   */
  mode?: string;
}
export interface capSQLiteExecuteOptions {
  /**
   * The batch of raw SQL statements as string
   */
  statements?: string;
}
export interface capSQLiteSetOptions {
  /**
   * The batch of raw SQL statements as Array of capSQLLiteSet
   */
  set?: capSQLiteSet[];
}
export interface capSQLiteRunOptions {
  /**
   * A statement
   */
  statement?: string;
  /**
   * A set of values for a statement
   */
  values?: any[];
}
export interface capSQLiteQueryOptions {
  /**
   * A statement
   */
  statement?: string;
  /**
   * A set of values for a statement
   */
  values?: string[];
}
export interface capSQLiteImportOptions {
  /**
   * Set the JSON object to import
   *
   */
  jsonstring?: string;
}
export interface capSQLiteExportOptions {
  /**
   * Set the mode to export JSON Object:
   * "full" or "partial"
   *
   */
  jsonexportmode?: string;
}
export interface capSQLiteSyncDateOptions {
  /**
   * Set the synchronization date
   * Format yyyy-MM-dd'T'HH:mm:ss.SSSZ
   */
  syncdate?: string;
}
export interface capSQLiteSet {
  /**
   * A statement
   */
  statement?: string;
  /**
   * the data values list as an Array
   */
  values?: any[];
}
export interface capSQLiteUpgradeOptions {
  /**
   * The database name
   */
  database?: string;
  /**
   * The upgrade options for version upgrade
   * Array of length 1 to easiest the iOS plugin
   */
  upgrade?: capSQLiteVersionUpgrade[];
}
export interface capEchoResult {
  /**
   * String returned
   */
  value?: string;
}
export interface capSQLiteResult {
  /**
   * result set to true when successful else false
   */
  result?: boolean;
  /**
   * a returned message
   */
  message?: string;
}
export interface capSQLiteChanges {
  /**
   * the number of changes from an execute or run command
   */
  changes?: any;
  /**
   * a returned message
   */
  message?: string;
}
export interface capSQLiteValues {
  /**
   * the data values list as an Array
   */
  values?: any[];
  /**
   * a returned message
   */
  message?: string;
}
export interface capSQLiteJson {
  /**
   * an export JSON object
   */
  export?: JsonSQLite;
  /**
   * a returned message
   */
  message?: string;
}

/* JSON Types */
export interface JsonSQLite {
  /**
   * The database name
   */
  database: string;
  /**
   *  The database version
   */
  version: number;
  /**
   * Set to true (database encryption) / false
   */
  encrypted: boolean;
  /***
   * Set the mode
   * ["full", "partial"]
   */
  mode: string;
  /***
   * Array of Table (JsonTable)
   */
  tables: JsonTable[];
}
export interface JsonTable {
  /**
   * The database name
   */
  name: string;
  /***
   * Array of Schema (JsonColumn)
   */
  schema?: JsonColumn[];
  /***
   * Array of Index (JsonIndex)
   */
  indexes?: JsonIndex[];
  /***
   * Array of Table data
   */
  values?: any[][];
}
export interface JsonColumn {
  /**
   * The column name
   */
  column?: string;
  /**
   * The column data (type, unique, ...)
   */
  value: string;
  /**
   * The column foreign key constraints
   */
  foreignkey?: string;
}
export interface JsonIndex {
  /**
   * The index name
   */
  name: string;
  /**
   * The column name to be indexed
   */
  column: string;
}
export interface capSQLiteVersionUpgrade {
  fromVersion: number;
  toVersion: number;
  statement: string;
  set?: capSQLiteSet[];
}
