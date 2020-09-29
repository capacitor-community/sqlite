declare module '@capacitor/core' {
  interface PluginRegistry {
    CapacitorSQLite: CapacitorSQLitePlugin;
  }
}

export interface CapacitorSQLitePlugin {
  echo(options: { value: string }): Promise<{ value: string }>;
  /**
   * Open a SQLite database
   * @param {capSQLiteOptions} options {database: string, encrypted?: boolean, mode?: string}
   * @returns {Promise<capSQLiteResult>} {result:boolean}
   */
  open(options: capSQLiteOptions): Promise<capSQLiteResult>;
  /**
   * Close a SQLite database
   * @param {capSQLiteOptions} options {database: string}
   * @returns {Promise<capSQLiteResult>} {result:boolean}
   */
  close(options: capSQLiteOptions): Promise<capSQLiteResult>;
  /**
   * Execute a Batch of Raw Statements as String
   * @param {capSQLiteOptions} options {statements: string}
   * @returns {Promise<capSQLiteResult>} {changes:{changes:number}}
   */
  execute(options: capSQLiteOptions): Promise<capSQLiteResult>;
  /**
   * Execute a Set of Raw Statements as Array of CapSQLiteSet
   * @param {capSQLiteOptions} options {set: Array<CapSQLiteSet>}
   * @returns {Promise<capSQLiteResult>} {changes:{changes:number}}
   */
  executeSet(options: capSQLiteOptions): Promise<capSQLiteResult>;
  /**
   * Execute a Single Statement
   * @param {capSQLiteOptions} options {statement: string, values:Array<any> }
   * @returns {Promise<capSQLiteResult>} {changes:{changes:number,lastId:number}}
   */
  run(options: capSQLiteOptions): Promise<capSQLiteResult>;
  /**
   * Query a Single Statement
   * @param {capSQLiteOptions} options {statement: string, values:Array<string> }
   * @returns {Promise<capSQLiteResult>} {values:Array<any>}
   */
  query(options: capSQLiteOptions): Promise<capSQLiteResult>;
  /**
   * Check is a SQLite database exists
   * @param {capSQLiteOptions} options {database: string}
   * @returns {Promise<capSQLiteResult>} {result:boolean}
   */
  isDBExists(options: capSQLiteOptions): Promise<capSQLiteResult>;
  /**
   * Delete a SQLite database
   * @param {capSQLiteOptions} options {database: string}
   * @returns {Promise<capSQLiteResult>} {result:boolean}
   */
  deleteDatabase(options: capSQLiteOptions): Promise<capSQLiteResult>;
  /**
   * Is Json Object Valid
   * @param {capSQLiteOptions} options {jsonstring: string}
   * @returns {Promise<capSQLiteResult>} {result:boolean}
   */
  isJsonValid(options: capSQLiteOptions): Promise<capSQLiteResult>;
  /**
   * Import from Json Object
   * @param {capSQLiteOptions} options {jsonstring: string}
   * @returns {Promise<capSQLiteResult>} {changes:{changes:number}}
   */
  importFromJson(options: capSQLiteOptions): Promise<capSQLiteResult>;
  /**
   * Export to Json Object
   * @param {capSQLiteOptions} options {jsonexportmode: string}
   * @returns {Promise<capSQLiteResult>} {export:any}
   */
  exportToJson(options: capSQLiteOptions): Promise<capSQLiteResult>;
  /**
   * Create a synchronization table
   * @returns {Promise<capSQLiteResult>} {changes:{changes:number}}
   */
  createSyncTable(): Promise<capSQLiteResult>;
  /**
   * Set the synchronization date
   * @param {capSQLiteOptions} options {syncdate: string}
   * @returns {Promise<capSQLiteResult>} {result:boolean}
   */
  setSyncDate(options: capSQLiteOptions): Promise<capSQLiteResult>;
}

export interface capSQLiteOptions {
  /**
   * The database name
   */
  database?: string;
  /**
   * The batch of raw SQL statements as string
   */
  statements?: string;
  /**
   * The batch of raw SQL statements as Array of capSQLLiteSet
   */
  set?: Array<capSQLiteSet>;
  /**
   * A statement
   */
  statement?: string;
  /**
   * A set of values for a statement
   */
  values?: Array<any>;
  /**
   * Set to true for database encryption
   */
  encrypted?: boolean;
  /***
   * Set the mode for database encryption
   * ["encryption", "secret","newsecret"]
   */
  mode?: string;
  /***
   * Set the JSON object to import
   *
   */
  jsonstring?: string;
  /***
   * Set the mode to export JSON Object
   * "full", "partial"
   *
   */
  jsonexportmode?: string;
  /***
   * Set the synchronization date
   *
   */
  syncdate?: string;
}

export interface capSQLiteResult {
  /**
   * result set to true when successful else false
   */
  result?: boolean;
  /**
   * the number of changes from an execute or run command
   */
  changes?: any;
  /**
   * the data values list as an Array
   */
  values?: Array<any>;
  /**
   * a message
   */
  message?: string;
  /**
   * an export JSON object
   */
  export?: any;
}
export interface capSQLiteSet {
  /**
   * A statement
   */
  statement?: String;
  /**
   * the data values list as an Array
   */
  values?: Array<any>;
}
