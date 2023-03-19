//import { Capacitor } from '@capacitor/core';

/**
 * CapacitorSQLitePlugin Interface
 */
export interface CapacitorSQLitePlugin {
  /**
   * Initialize the web store
   *
   * @return Promise<void>
   * @since 3.2.3-1
   */

  initWebStore(): Promise<void>;
  /**
   * Save database to  the web store
   *
   * @param options: capSQLiteOptions
   * @return Promise<void>
   * @since 3.2.3-1
   */

  saveToStore(options: capSQLiteOptions): Promise<void>;
  /**
   * Get database from local disk and save it to store
   *
   * @param options: capSQLiteLocalDiskOptions
   * @return Promise<void>
   * @since 4.6.3
   */

  getFromLocalDiskToStore(options: capSQLiteLocalDiskOptions): Promise<void>;
  /**
   * Save database to local disk
   *
   * @param options: capSQLiteOptions
   * @return Promise<void>
   * @since 4.6.3
   */

  saveToLocalDisk(options: capSQLiteOptions): Promise<void>;
  /**
   * Check if a passphrase exists in a secure store
   *
   * @return Promise<capSQLiteResult>
   * @since 3.0.0-beta.13
   */
  isSecretStored(): Promise<capSQLiteResult>;
  /**
   * Store a passphrase in a secure store
   * Update the secret of previous encrypted databases with GlobalSQLite
   * !!! Only to be used once if you wish to encrypt database !!!
   *
   * @param options capSetSecretOptions
   * @return Promise<void>
   * @since 3.0.0-beta.13
   */
  setEncryptionSecret(options: capSetSecretOptions): Promise<void>;
  /**
   * Change the passphrase in a secure store
   * Update the secret of previous encrypted databases with passphrase
   * in secure store
   *
   * @param options capChangeSecretOptions
   * @return Promise<void>
   * @since 3.0.0-beta.13
   */
  changeEncryptionSecret(options: capChangeSecretOptions): Promise<void>;
  /**
   * Clear the passphrase in the secure store
   *
   * @return Promise<void>
   * @since 3.5.1
   */
  clearEncryptionSecret(): Promise<void>;
  /**
   * Check encryption passphrase
   *
   * @return Promise<capSQLiteResult>
   * @since 4.6.1
   */

  checkEncryptionSecret(options: capSetSecretOptions): Promise<capSQLiteResult>;

  /**
   * create a database connection
   * @param options capConnectionOptions
   * @return Promise<void>
   * @since 2.9.0 refactor
   */
  createConnection(options: capConnectionOptions): Promise<void>;
  /**
   * close a database connection
   * @param options capSQLiteOptions
   * @return Promise<void>
   * @since 2.9.0 refactor
   */
  closeConnection(options: capSQLiteOptions): Promise<void>;
  /**
   * Echo a given string
   *
   * @param options: capEchoOptions
   * @return Promise<capEchoResult>
   * @since 0.0.1
   */
  echo(options: capEchoOptions): Promise<capEchoResult>;
  /**
   * Opens a SQLite database.
   * Attention: This re-opens a database if it's already open!
   *
   * @param options: capSQLiteOptions
   * @returns Promise<void>
   * @since 0.0.1
   */
  open(options: capSQLiteOptions): Promise<void>;
  /**
   * Close a SQLite database
   * @param options: capSQLiteOptions
   * @returns Promise<void>
   * @since 0.0.1
   */
  close(options: capSQLiteOptions): Promise<void>;
  /**
   * GetUrl get the database Url
   * @param options: capSQLiteOptions
   * @returns Promise<capSQLiteUrl>
   * @since 3.3.3-4
   */
  getUrl(options: capSQLiteOptions): Promise<capSQLiteUrl>;
  /**
   * Get a SQLite database version
   * @param options: capSQLiteOptions
   * @returns Promise<void>
   * @since 3.2.0
   */
  getVersion(options: capSQLiteOptions): Promise<capVersionResult>;
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
   * Check if a SQLite database exists with opened connection
   * @param options: capSQLiteOptions
   * @returns Promise<capSQLiteResult>
   * @since 2.0.1-1
   */
  isDBExists(options: capSQLiteOptions): Promise<capSQLiteResult>;
  /**
   * Check if a SQLite database is opened
   * @param options: capSQLiteOptions
   * @returns Promise<capSQLiteResult>
   * @since 3.0.0-beta.5
   */
  isDBOpen(options: capSQLiteOptions): Promise<capSQLiteResult>;
  /**
   * Check if a SQLite database is encrypted
   * @param options: capSQLiteOptions
   * @returns Promise<capSQLiteResult>
   * @since 4.6.2-2
   */
  isDatabaseEncrypted(options: capSQLiteOptions): Promise<capSQLiteResult>;
  /**
   * Check encryption value in capacitor.config
   * @returns Promise<capSQLiteResult>
   * @since 4.6.2-2
   */
  isInConfigEncryption(): Promise<capSQLiteResult>;
  /**
   * Check encryption value in capacitor.config
   * @returns Promise<capSQLiteResult>
   * @since 4.6.2-2
   */
  isInConfigBiometricAuth(): Promise<capSQLiteResult>;
  /**
   * Check if a SQLite database exists without connection
   * @param options: capSQLiteOptions
   * @returns Promise<capSQLiteResult>
   * @since 3.0.0-beta.5
   */
  isDatabase(options: capSQLiteOptions): Promise<capSQLiteResult>;
  /**
   * Check if a table exists in a SQLite database
   * @param options: capSQLiteTableOptions
   * @returns Promise<capSQLiteResult>
   * @since 3.0.0-beta.5
   */
  isTableExists(options: capSQLiteTableOptions): Promise<capSQLiteResult>;
  /**
   * Delete a SQLite database
   * @param options: capSQLiteOptions
   * @returns Promise<void>
   * @since 0.0.1
   */
  deleteDatabase(options: capSQLiteOptions): Promise<void>;
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
   * @param options: capSQLiteOptions
   * @returns Promise<capSQLiteChanges>
   * @since 2.0.1-1
   */
  createSyncTable(options: capSQLiteOptions): Promise<capSQLiteChanges>;
  /**
   * Set the synchronization date
   * @param options: capSQLiteSyncDateOptions
   * @returns Promise<void>
   * @since 2.0.1-1
   */
  setSyncDate(options: capSQLiteSyncDateOptions): Promise<void>;
  /**
   * Get the synchronization date
   * @param options: capSQLiteOptions
   * @returns Promise<capSQLiteSyncDate>
   * @since 2.9.0
   */
  getSyncDate(options: capSQLiteOptions): Promise<capSQLiteSyncDate>;
  /**
   * Remove rows with sql_deleted = 1 after an export
   * @param options
   * @returns Promise<void>
   * @since 3.4.3-2
   */
  deleteExportedRows(options: capSQLiteOptions): Promise<void>;
  /**
   * Add the upgrade Statement for database version upgrading
   * @param options: capSQLiteUpgradeOptions
   * @returns Promise<void>
   * @since 2.4.2-6 iOS & Electron 2.4.2-7 Android
   */
  addUpgradeStatement(options: capSQLiteUpgradeOptions): Promise<void>;
  /**
   * Copy databases from public/assets/databases folder to application databases folder
   * @param options: capSQLiteFromAssets  since 3.2.5-2
   * @returns Promise<void>
   * @since 2.9.0 refactor
   */
  copyFromAssets(options: capSQLiteFromAssetsOptions): Promise<void>;
  /**
   * Get database or zipped database(s) from url
   * @param options: capSQLiteHTTPOptions
   * @returns Promise<void>
   * @since 4.1.1
   */
  getFromHTTPRequest(options: capSQLiteHTTPOptions): Promise<void>;
  /**
   * Get the database list
   * @returns Promise<capSQLiteValues>
   * @since 3.0.0-beta.5
   */
  getDatabaseList(): Promise<capSQLiteValues>;
  /**
   * Get the database's table list
   * @param options
   * @returns Promise<capSQLiteValues>
   * @since 3.4.2-3
   */
  getTableList(options: capSQLiteOptions): Promise<capSQLiteValues>;
  /**
   * Get the Migratable database list
   * @param options: capSQLitePathOptions // only iOS & Android since 3.2.4-2
   * @returns Promise<capSQLiteValues>
   * @since 3.0.0-beta.5
   */
  getMigratableDbList(options: capSQLitePathOptions): Promise<capSQLiteValues>;
  /**
   * Add SQLIte Suffix to existing databases
   * @param options: capSQLitePathOptions
   * @returns Promise<void>
   * @since 3.0.0-beta.5
   */
  addSQLiteSuffix(options: capSQLitePathOptions): Promise<void>;
  /**
   * Delete Old Cordova databases
   * @param options: capSQLitePathOptions
   * @returns Promise<void>
   * @since 3.0.0-beta.5
   */
  deleteOldDatabases(options: capSQLitePathOptions): Promise<void>;
  /**
   * Moves databases to the location the plugin can read them, and adds sqlite suffix
   * This resembles calling addSQLiteSuffix and deleteOldDatabases, but it is more performant as it doesn't copy but moves the files
   * @param options: capSQLitePathOptions
   */
  moveDatabasesAndAddSuffix(options: capSQLitePathOptions): Promise<void>;
  /**
   * Check Connection Consistency JS <=> Native
   * return true : consistency, connections are opened
   * return false : no consistency, connections are closed
   * @param options: capAllConnectionsOptions
   * @returns Promise<capSQLiteResult>
   * @since 3.0.0-beta.11
   */
  checkConnectionsConsistency(
    options: capAllConnectionsOptions,
  ): Promise<capSQLiteResult>;
  /**
   * get a non conformed database path
   * @param options capNCDatabasePathOptions
   * @return Promise<capNCDatabasePathResult>
   * @since 3.3.3-1
   */
  getNCDatabasePath(
    options: capNCDatabasePathOptions,
  ): Promise<capNCDatabasePathResult>;
  /**
   * create a non conformed database connection
   * @param options capNCConnectionOptions
   * @return Promise<void>
   * @since 3.3.3-1
   */
  createNCConnection(options: capNCConnectionOptions): Promise<void>;
  /**
   * close a non conformed database connection
   * @param options capNCOptions
   * @return Promise<void>
   * @since 3.3.3-1
   */
  closeNCConnection(options: capNCOptions): Promise<void>;
  /**
   * Check if a non conformed database exists without connection
   * @param options: capNCOptions
   * @returns Promise<capSQLiteResult>
   * @since 3.3.3-1
   */
  isNCDatabase(options: capNCOptions): Promise<capSQLiteResult>;
}

export interface capSetSecretOptions {
  /**
   * The passphrase for Encrypted Databases
   */
  passphrase?: string;
}
export interface capChangeSecretOptions {
  /**
   * The new passphrase for Encrypted Databases
   */
  passphrase?: string;
  /**
   * The old passphrase for Encrypted Databases
   */
  oldpassphrase?: string;
}
export interface capEchoOptions {
  /**
   *  String to be echoed
   */
  value?: string;
}
export interface capConnectionOptions {
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
   */
  encrypted?: boolean;
  /**
   * Set the mode for database encryption
   * ["encryption", "secret", "newsecret"]
   */
  mode?: string;
  /**
   * Set to true (database in read-only mode) / false
   */
  readonly?: boolean;
}
export interface capAllConnectionsOptions {
  /**
   * the dbName of all connections
   * @since 3.0.0-beta.10
   */
  dbNames?: string[];
  /**
   * the openMode ("RW" read&write, "RO" readonly) of all connections
   * @since 4.1.0
   */
  openModes?: string[];
}
export interface capSQLiteOptions {
  /**
   * The database name
   */
  database?: string;
  /**
   * Set to true (database in read-only mode) / false
   */
  readonly?: boolean;
}
export interface capNCDatabasePathOptions {
  /**
   * the database path
   */
  path?: string;
  /**
   * The database name
   */
  database?: string;
}
export interface capNCConnectionOptions {
  /**
   * The database path
   */
  databasePath?: string;
  /**
   * The database  version
   */
  version?: number;
}

export interface capNCOptions {
  /**
   * The database path
   */
  databasePath?: string;
}
export interface capSQLiteExecuteOptions {
  /**
   * The database name
   */
  database?: string;
  /**
   * The batch of raw SQL statements as string
   */
  statements?: string;
  /**
   * Enable / Disable transactions
   * default Enable (true)
   * @since 3.0.0-beta.10
   */
  transaction?: boolean;
  /**
   * ReadOnly / ReadWrite
   * default ReadWrite (false)
   * @since 4.1.0-7
   */
  readonly?: boolean;
}
export interface capSQLiteSetOptions {
  /**
   * The database name
   */
  database?: string;
  /**
   * The batch of raw SQL statements as Array of capSQLLiteSet
   */
  set?: capSQLiteSet[];
  /**
   * Enable / Disable transactions
   * default Enable (true)
   * @since 3.0.0-beta.10
   */
  transaction?: boolean;
  /**
   * ReadOnly / ReadWrite
   * default ReadWrite (false)
   * @since 4.1.0-7
   */
  readonly?: boolean;
}
export interface capSQLiteRunOptions {
  /**
   * The database name
   */
  database?: string;
  /**
   * A statement
   */
  statement?: string;
  /**
   * A set of values for a statement
   */
  values?: any[];
  /**
   * Enable / Disable transactions
   * default Enable (true)
   * @since 3.0.0-beta.10
   */
  transaction?: boolean;
  /**
   * ReadOnly / ReadWrite
   * default ReadWrite (false)
   * @since 4.1.0-7
   */
  readonly?: boolean;
}
export interface capSQLiteQueryOptions {
  /**
   * The database name
   */
  database?: string;
  /**
   * A statement
   */
  statement?: string;
  /**
   * A set of values for a statement
   * Change to any[]
   * @since 3.0.0-beta.11
   */
  values?: any[];
  /**
   * ReadOnly / ReadWrite
   * default ReadWrite (false)
   * @since 4.1.0-7
   */
  readonly?: boolean;
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
   * The database name
   */
  database?: string;
  /**
   * Set the mode to export JSON Object:
   * "full" or "partial"
   *
   */
  jsonexportmode?: string;
  /**
   * ReadOnly / ReadWrite
   * default ReadWrite (false)
   * @since 4.1.0-7
   */
  readonly?: boolean;
}
export interface capSQLiteFromAssetsOptions {
  /**
   * Set the overwrite mode for the copy from assets
   * "true"/"false"  default to "true"
   *
   */
  overwrite?: boolean;
}
export interface capSQLiteLocalDiskOptions {
  /**
   * Set the overwrite mode for saving the database from local disk to store
   * "true"/"false"  default to "true"
   *
   */
  overwrite?: boolean;
}
export interface capSQLiteHTTPOptions {
  /**
   * The url of the database or the zipped database(s)
   */
  url?: string;

  /**
   * Set the overwrite mode for the copy from assets
   * "true"/"false"  default to "true"
   *
   */
  overwrite?: boolean;
}
export interface capSQLiteSyncDateOptions {
  /**
   * The database name
   */
  database?: string;
  /**
   * Set the synchronization date
   * Format yyyy-MM-dd'T'HH:mm:ss.SSSZ
   */
  syncdate?: string;
  /**
   * ReadOnly / ReadWrite
   * default ReadWrite (false)
   * @since 4.1.0-7
   */
  readonly?: boolean;
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
export interface capSQLitePathOptions {
  /**
   * The folder path of existing databases
   * If not given folder path is "default"
   */
  folderPath?: string;
  /**
   * The database name's list to be copied and/or deleted
   * since 3.2.4-1
   * If not given all databases in the specify folder path
   */
  dbNameList?: string[];
}
export interface capSQLiteTableOptions {
  /**
   * The database name
   */
  database?: string;
  /**
   * The table name
   */
  table?: string;
  /**
   * ReadOnly / ReadWrite
   * default ReadWrite (false)
   * @since 4.1.0-7
   */
  readonly?: boolean;
}
export interface capEchoResult {
  /**
   * String returned
   */
  value?: string;
}
export interface capNCDatabasePathResult {
  /**
   * String returned
   */
  path?: string;
}
export interface capVersionResult {
  /**
   * Number returned
   */
  version?: number;
}
export interface capSQLiteResult {
  /**
   * result set to true when successful else false
   */
  result?: boolean;
}
export interface capSQLiteUrl {
  /**
   * a returned url
   */
  url?: string;
}
export interface capSQLiteChanges {
  /**
   * a returned Changes
   */
  changes?: Changes;
}
export interface Changes {
  /**
   * the number of changes from an execute or run command
   */
  changes?: number;
  /**
   * the lastId created from a run command
   */
  lastId?: number;
}
export interface capSQLiteValues {
  /**
   * the data values list as an Array
   * iOS the first row is the returned ios_columns name list
   */
  values?: any[];
}
export interface DBSQLiteValues {
  /**
   * the data values list as an Array
   */
  values?: any[];
}
export interface capSQLiteJson {
  /**
   * an export JSON object
   */
  export?: JsonSQLite;
}
export interface capSQLiteSyncDate {
  /**
   * the synchronization date
   */
  syncDate?: number;
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
   * Delete the database prior to import (default false)
   */
  overwrite?: boolean;
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
  /***
   * Array of View (JsonView)
   */
  views?: JsonView[];
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
   * Array of Trigger (JsonTrigger)
   */
  triggers?: JsonTrigger[];
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
  /**
   * the column constraint
   */
  constraint?: string;
}
export interface JsonTrigger {
  /**
   * The trigger name
   */
  name: string;
  /**
   * The trigger time event fired
   */
  timeevent: string;

  /**
   * The trigger condition
   */
  condition?: string;

  /**
   * The logic of the trigger
   */
  logic: string;
}
export interface JsonIndex {
  /**
   * The index name
   */
  name: string;
  /**
   * The value of the index can have the following formats:
   * email
   * email ASC
   * email, MobileNumber
   * email ASC, MobileNumber DESC
   */
  value: string;
  /**
   * the mode (Optional)
   * UNIQUE
   */
  mode?: string;
}
export interface JsonView {
  /**
   * The view name
   */
  name: string;
  /**
   * The view create statement
   */
  value: string;
}
export interface capBiometricListener {
  /**
   * Biometric ready
   */
  result: boolean;
  message: string;
}
export interface capJsonProgressListener {
  /**
   * Progress message
   */
  progress?: string;
}
export interface capHttpRequestEndedListener {
  /**
   * Message
   */
  message?: string;
}
export interface capPickOrSaveDatabaseEndedListener {
  /**
   * Pick Database's name
   */
  db_name?: string;
  /**
   * Message
   */
  message?: string;
}
export interface capSQLiteVersionUpgrade {
  toVersion: number;
  statements: string[];
}

/**
 * SQLiteConnection Interface
 */
export interface ISQLiteConnection {
  /**
   * Init the web store
   * @returns Promise<void>
   * @since 3.2.3-1
   */
  initWebStore(): Promise<void>;
  /**
   * Save the datbase to the web store
   * @param database
   * @returns Promise<void>
   * @since 3.2.3-1
   */
  saveToStore(database: string): Promise<void>;
  /**
   * Get database from local disk and save it to store
   *
   * @param overwrite: boolean
   * @return Promise<void>
   * @since 4.6.3
   */
  getFromLocalDiskToStore(overwrite: boolean): Promise<void>;
  /**
   * Save database to local disk
   *
   * @param database: string
   * @return Promise<void>
   * @since 4.6.3
   */
  saveToLocalDisk(database: string): Promise<void>;
  /**
   * Echo a value
   * @param value
   * @returns Promise<capEchoResult>
   * @since 2.9.0 refactor
   */
  echo(value: string): Promise<capEchoResult>;
  /**
   * Check if a secret is stored
   * @returns Promise<capSQLiteResult>
   * @since 3.0.0-beta.13
   */
  isSecretStored(): Promise<capSQLiteResult>;
  /**
   * Set a passphrase in a secure store
   * @param passphrase
   * @returns Promise<void>
   * @since 3.0.0-beta.13
   */
  setEncryptionSecret(passphrase: string): Promise<void>;
  /**
   * Change the passphrase in a secure store
   * @param passphrase
   * @param oldpassphrase
   * @returns Promise<void>
   * @since 3.0.0-beta.13
   */
  changeEncryptionSecret(
    passphrase: string,
    oldpassphrase: string,
  ): Promise<void>;
  /**
   * Clear the passphrase in a secure store
   * @returns Promise<void>
   * @since 3.5.1
   */
  clearEncryptionSecret(): Promise<void>;
  /**
   * Check the passphrase stored in a secure store
   * @param passphrase
   * @returns Promise<capSQLiteResult>
   * @since 4.6.1
   */
  checkEncryptionSecret(passphrase: string): Promise<capSQLiteResult>;
  /**
   * Add the upgrade Statement for database version upgrading
   * @param database
   * @param toVersion
   * @param statement
   * @param set
   * @returns Promise<void>
   * @since 2.9.0 refactor
   */
  addUpgradeStatement(
    database: string,
    toVersion: number,
    statements: string[],
  ): Promise<void>;
  /**
   * Create a connection to a database
   * @param database
   * @param encrypted
   * @param mode
   * @param version
   * @param readonly
   * @returns Promise<SQLiteDBConnection>
   * @since 2.9.0 refactor
   */
  createConnection(
    database: string,
    encrypted: boolean,
    mode: string,
    version: number,
    readonly: boolean,
  ): Promise<SQLiteDBConnection>;
  /**
   * Check if a connection exists
   * @param database
   * @param readonly
   * @returns Promise<capSQLiteResult>
   * @since 3.0.0-beta.5
   */
  isConnection(database: string, readonly: boolean): Promise<capSQLiteResult>;
  /**
   * Retrieve an existing database connection
   * @param database
   * @param readonly
   * @returns Promise<SQLiteDBConnection>
   * @since 2.9.0 refactor
   */
  retrieveConnection(
    database: string,
    readonly: boolean,
  ): Promise<SQLiteDBConnection>;
  /**
   * Retrieve all database connections
   * @returns Promise<Map<string, SQLiteDBConnection>>
   * @since 2.9.0 refactor
   */
  retrieveAllConnections(): Promise<Map<string, SQLiteDBConnection>>;
  /**
   * Close a database connection
   * @param database
   * @param readonly
   * @returns Promise<void>
   * @since 2.9.0 refactor
   */
  closeConnection(database: string, readonly: boolean): Promise<void>;
  /**
   * Close all database connections
   * @returns Promise<void>
   * @since 2.9.0 refactor
   */
  closeAllConnections(): Promise<void>;
  /**
   * Check the consistency between Js Connections
   * and Native Connections
   * if inconsistency all connections are removed
   * @returns Promise<capSQLiteResult>
   * @since 3.0.0-beta.10
   */
  checkConnectionsConsistency(): Promise<capSQLiteResult>;
  /**
   * get a non-conformed database path
   * @param path
   * @param database
   * @returns Promise<capNCDatabasePathResult>
   * @since 3.3.3-1
   */
  getNCDatabasePath(
    path: string,
    database: string,
  ): Promise<capNCDatabasePathResult>;
  /**
   * Create a non-conformed database connection
   * @param databasePath
   * @param version
   * @returns Promise<SQLiteDBConnection>
   * @since 3.3.3-1
   */
  createNCConnection(
    databasePath: string,
    version: number,
  ): Promise<SQLiteDBConnection>;
  /**
   * Close a non-conformed database connection
   * @param databasePath
   * @returns Promise<void>
   * @since 3.3.3-1
   */
  closeNCConnection(databasePath: string): Promise<void>;
  /**
   * Check if a non-conformed databaseconnection exists
   * @param databasePath
   * @returns Promise<capSQLiteResult>
   * @since 3.3.3-1
   */
  isNCConnection(databasePath: string): Promise<capSQLiteResult>;
  /**
   * Retrieve an existing non-conformed database connection
   * @param databasePath
   * @returns Promise<SQLiteDBConnection>
   * @since 3.3.3-1
   */
  retrieveNCConnection(databasePath: string): Promise<SQLiteDBConnection>;

  /**
   * Import a database From a JSON
   * @param jsonstring string
   * @returns Promise<capSQLiteChanges>
   * @since 2.9.0 refactor
   */
  importFromJson(jsonstring: string): Promise<capSQLiteChanges>;
  /**
   * Check the validity of a JSON Object
   * @param jsonstring string
   * @returns Promise<capSQLiteResult>
   * @since 2.9.0 refactor
   */
  isJsonValid(jsonstring: string): Promise<capSQLiteResult>;
  /**
   * Copy databases from public/assets/databases folder to application databases folder
   * @param overwrite  since 3.2.5-2
   * @returns Promise<void>
   * @since 2.9.0 refactor
   */
  copyFromAssets(overwrite?: boolean): Promise<void>;
  /**
   *
   * @param url
   * @param overwrite
   * @returns Promise<void>
   * @since 4.1.1
   */
  getFromHTTPRequest(url?: string, overwrite?: boolean): Promise<void>;
  /**
   * Check if a SQLite database is encrypted
   * @param options: capSQLiteOptions
   * @returns Promise<capSQLiteResult>
   * @since 4.6.2-2
   */
  isDatabaseEncrypted(database: string): Promise<capSQLiteResult>;
  /**
   * Check encryption value in capacitor.config
   * @returns Promise<capSQLiteResult>
   * @since 4.6.2-2
   */
  isInConfigEncryption(): Promise<capSQLiteResult>;
  /**
   * Check encryption value in capacitor.config
   * @returns Promise<capSQLiteResult>
   * @since 4.6.2-2
   */
  isInConfigBiometricAuth(): Promise<capSQLiteResult>;
  /**
   * Check if a database exists
   * @param database
   * @returns Promise<capSQLiteResult>
   * @since 3.0.0-beta.5
   */
  isDatabase(database: string): Promise<capSQLiteResult>;
  /**
   * Check if a non conformed database exists
   * @param databasePath
   * @returns Promise<capSQLiteResult>
   * @since 3.3.3-1
   */
  isNCDatabase(databasePath: string): Promise<capSQLiteResult>;
  /**
   * Get the database list
   * @returns Promise<capSQLiteValues>
   * @since 3.0.0-beta.5
   */
  getDatabaseList(): Promise<capSQLiteValues>;
  /**
   * Get the Migratable database list
   * @param folderPath: string // only iOS & Android since 3.2.4-2
   * @returns Promise<capSQLiteValues>
   * @since 3.0.0-beta.5
   */
  getMigratableDbList(folderPath: string): Promise<capSQLiteValues>;

  /**
   * Add SQLIte Suffix to existing databases
   * @param folderPath
   * @param dbNameList since 3.2.4-1
   * @returns Promise<void>
   * @since 3.0.0-beta.5
   */
  addSQLiteSuffix(folderPath?: string, dbNameList?: string[]): Promise<void>;
  /**
   * Delete Old Cordova databases
   * @param folderPath
   * @param dbNameList since 3.2.4-1
   * @returns Promise<void>
   * @since 3.0.0-beta.5
   */
  deleteOldDatabases(folderPath?: string, dbNameList?: string[]): Promise<void>;
  /**
   * Moves databases to the location the plugin can read them, and adds sqlite suffix
   * This resembles calling addSQLiteSuffix and deleteOldDatabases, but it is more performant as it doesn't copy but moves the files
   * @param folderPath the origin from where to move the databases
   * @param dbNameList the names of the databases to move, check out the getMigratableDbList to get a list, an empty list will result in copying all the databases with '.db' extension.
   */
  moveDatabasesAndAddSuffix(
    folderPath?: string,
    dbNameList?: string[],
  ): Promise<void>;
}
/**
 * SQLiteConnection Class
 */
export class SQLiteConnection implements ISQLiteConnection {
  private _connectionDict: Map<string, SQLiteDBConnection> = new Map();
  constructor(private sqlite: any) {}

  async initWebStore(): Promise<void> {
    try {
      await this.sqlite.initWebStore();
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  }
  async saveToStore(database: string): Promise<void> {
    try {
      await this.sqlite.saveToStore({ database });
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  }
  async saveToLocalDisk(database: string): Promise<void> {
    try {
      await this.sqlite.saveToLocalDisk({ database });
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  }
  async getFromLocalDiskToStore(overwrite?: boolean): Promise<void> {
    const mOverwrite: boolean = overwrite != null ? overwrite : true;

    try {
      await this.sqlite.getFromLocalDiskToStore({ overwrite: mOverwrite });
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  }

  async echo(value: string): Promise<capEchoResult> {
    try {
      const res = await this.sqlite.echo({ value });
      return Promise.resolve(res);
    } catch (err) {
      return Promise.reject(err);
    }
  }
  async isSecretStored(): Promise<capSQLiteResult> {
    try {
      const res: capSQLiteResult = await this.sqlite.isSecretStored();
      return Promise.resolve(res);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  async setEncryptionSecret(passphrase: string): Promise<void> {
    try {
      await this.sqlite.setEncryptionSecret({ passphrase: passphrase });
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  }
  async changeEncryptionSecret(
    passphrase: string,
    oldpassphrase: string,
  ): Promise<void> {
    try {
      await this.sqlite.changeEncryptionSecret({
        passphrase: passphrase,
        oldpassphrase: oldpassphrase,
      });
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  }
  async clearEncryptionSecret(): Promise<void> {
    try {
      await this.sqlite.clearEncryptionSecret();
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  }
  async checkEncryptionSecret(passphrase: string): Promise<capSQLiteResult> {
    try {
      const res: capSQLiteResult = await this.sqlite.checkEncryptionSecret({
        passphrase: passphrase,
      });
      return Promise.resolve(res);
    } catch (err) {
      return Promise.reject(err);
    }
  }
  async addUpgradeStatement(
    database: string,
    toVersion: number,
    statements: string[],
  ): Promise<void> {
    const upgrade: capSQLiteVersionUpgrade = {
      toVersion,
      statements,
    };
    try {
      if (database.endsWith('.db')) database = database.slice(0, -3);
      await this.sqlite.addUpgradeStatement({
        database,
        upgrade: [upgrade],
      });
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  }
  async createConnection(
    database: string,
    encrypted: boolean,
    mode: string,
    version: number,
    readonly: boolean,
  ): Promise<SQLiteDBConnection> {
    try {
      if (database.endsWith('.db')) database = database.slice(0, -3);
      await this.sqlite.createConnection({
        database,
        encrypted,
        mode,
        version,
        readonly,
      });
      const conn = new SQLiteDBConnection(database, readonly, this.sqlite);
      const connName = readonly ? `RO_${database}` : `RW_${database}`;
      this._connectionDict.set(connName, conn);
      return Promise.resolve(conn);
    } catch (err) {
      return Promise.reject(err);
    }
  }
  async closeConnection(database: string, readonly: boolean): Promise<void> {
    try {
      if (database.endsWith('.db')) database = database.slice(0, -3);
      await this.sqlite.closeConnection({ database, readonly });
      const connName = readonly ? `RO_${database}` : `RW_${database}`;
      this._connectionDict.delete(connName);
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  }
  async isConnection(
    database: string,
    readonly: boolean,
  ): Promise<capSQLiteResult> {
    const res: capSQLiteResult = {} as capSQLiteResult;
    if (database.endsWith('.db')) database = database.slice(0, -3);
    const connName = readonly ? `RO_${database}` : `RW_${database}`;
    res.result = this._connectionDict.has(connName);
    return Promise.resolve(res);
  }
  async retrieveConnection(
    database: string,
    readonly: boolean,
  ): Promise<SQLiteDBConnection> {
    if (database.endsWith('.db')) database = database.slice(0, -3);
    const connName = readonly ? `RO_${database}` : `RW_${database}`;
    if (this._connectionDict.has(connName)) {
      const conn = this._connectionDict.get(connName);
      if (typeof conn != 'undefined') return Promise.resolve(conn);
      else {
        return Promise.reject(`Connection ${database} is undefined`);
      }
    } else {
      return Promise.reject(`Connection ${database} does not exist`);
    }
  }
  async getNCDatabasePath(
    path: string,
    database: string,
  ): Promise<capNCDatabasePathResult> {
    try {
      const databasePath: capNCDatabasePathResult =
        await this.sqlite.getNCDatabasePath({
          path,
          database,
        });
      return Promise.resolve(databasePath);
    } catch (err) {
      return Promise.reject(err);
    }
  }
  async createNCConnection(
    databasePath: string,
    version: number,
  ): Promise<SQLiteDBConnection> {
    try {
      await this.sqlite.createNCConnection({
        databasePath,
        version,
      });
      const conn = new SQLiteDBConnection(databasePath, true, this.sqlite);
      const connName = `RO_${databasePath})`;
      this._connectionDict.set(connName, conn);
      return Promise.resolve(conn);
    } catch (err) {
      return Promise.reject(err);
    }
  }
  async closeNCConnection(databasePath: string): Promise<void> {
    try {
      await this.sqlite.closeNCConnection({ databasePath });
      const connName = `RO_${databasePath})`;
      this._connectionDict.delete(connName);
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  }
  async isNCConnection(databasePath: string): Promise<capSQLiteResult> {
    const res: capSQLiteResult = {} as capSQLiteResult;
    const connName = `RO_${databasePath})`;
    res.result = this._connectionDict.has(connName);
    return Promise.resolve(res);
  }
  async retrieveNCConnection(
    databasePath: string,
  ): Promise<SQLiteDBConnection> {
    if (this._connectionDict.has(databasePath)) {
      const connName = `RO_${databasePath})`;
      const conn = this._connectionDict.get(connName);
      if (typeof conn != 'undefined') return Promise.resolve(conn);
      else {
        return Promise.reject(`Connection ${databasePath} is undefined`);
      }
    } else {
      return Promise.reject(`Connection ${databasePath} does not exist`);
    }
  }
  async isNCDatabase(databasePath: string): Promise<capSQLiteResult> {
    try {
      const res = await this.sqlite.isNCDatabase({ databasePath });
      return Promise.resolve(res);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  async retrieveAllConnections(): Promise<Map<string, SQLiteDBConnection>> {
    return this._connectionDict;
  }
  async closeAllConnections(): Promise<void> {
    const delDict: Map<string, SQLiteDBConnection | null> = new Map();
    try {
      for (const key of this._connectionDict.keys()) {
        const database = key.substring(3);
        const readonly = key.substring(0, 3) === 'RO_' ? true : false;
        await this.sqlite.closeConnection({ database, readonly });
        delDict.set(key, null);
      }

      for (const key of delDict.keys()) {
        this._connectionDict.delete(key);
      }
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  }
  async checkConnectionsConsistency(): Promise<capSQLiteResult> {
    try {
      const keys = [...this._connectionDict.keys()];
      const openModes = [];
      const dbNames = [];
      for (const key of keys) {
        openModes.push(key.substring(0, 2));
        dbNames.push(key.substring(3));
      }
      const res: capSQLiteResult =
        await this.sqlite.checkConnectionsConsistency({
          dbNames: dbNames,
          openModes: openModes,
        });
      if (!res.result) this._connectionDict = new Map();
      return Promise.resolve(res);
    } catch (err) {
      this._connectionDict = new Map();
      return Promise.reject(err);
    }
  }
  async importFromJson(jsonstring: string): Promise<capSQLiteChanges> {
    try {
      const ret = await this.sqlite.importFromJson({ jsonstring: jsonstring });
      return Promise.resolve(ret);
    } catch (err) {
      return Promise.reject(err);
    }
  }
  async isJsonValid(jsonstring: string): Promise<capSQLiteResult> {
    try {
      const ret = await this.sqlite.isJsonValid({ jsonstring: jsonstring });
      return Promise.resolve(ret);
    } catch (err) {
      return Promise.reject(err);
    }
  }
  async copyFromAssets(overwrite?: boolean): Promise<void> {
    const mOverwrite: boolean = overwrite != null ? overwrite : true;

    try {
      await this.sqlite.copyFromAssets({ overwrite: mOverwrite });
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  }
  async getFromHTTPRequest(url: string, overwrite?: boolean): Promise<void> {
    const mOverwrite: boolean = overwrite != null ? overwrite : true;
    try {
      await this.sqlite.getFromHTTPRequest({ url, overwrite: mOverwrite });
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  }
  async isDatabaseEncrypted(database: string): Promise<capSQLiteResult> {
    if (database.endsWith('.db')) database = database.slice(0, -3);
    try {
      const res = await this.sqlite.isDatabaseEncrypted({ database: database });
      return Promise.resolve(res);
    } catch (err) {
      return Promise.reject(err);
    }
  }
  async isInConfigEncryption(): Promise<capSQLiteResult> {
    try {
      const res = await this.sqlite.isInConfigEncryption();
      return Promise.resolve(res);
    } catch (err) {
      return Promise.reject(err);
    }
  }
  async isInConfigBiometricAuth(): Promise<capSQLiteResult> {
    try {
      const res = await this.sqlite.isInConfigBiometricAuth();
      return Promise.resolve(res);
    } catch (err) {
      return Promise.reject(err);
    }
  }
  async isDatabase(database: string): Promise<capSQLiteResult> {
    if (database.endsWith('.db')) database = database.slice(0, -3);
    try {
      const res = await this.sqlite.isDatabase({ database: database });
      return Promise.resolve(res);
    } catch (err) {
      return Promise.reject(err);
    }
  }
  async getDatabaseList(): Promise<capSQLiteValues> {
    try {
      const res = await this.sqlite.getDatabaseList();
      return Promise.resolve(res);
    } catch (err) {
      return Promise.reject(err);
    }
  }
  async getMigratableDbList(folderPath: string): Promise<capSQLiteValues> {
    if (!folderPath || folderPath.length === 0) {
      return Promise.reject('You must provide a folder path');
    }
    try {
      const res = await this.sqlite.getMigratableDbList({
        folderPath: folderPath,
      });
      return Promise.resolve(res);
    } catch (err) {
      return Promise.reject(err);
    }
  }
  async addSQLiteSuffix(
    folderPath?: string,
    dbNameList?: string[],
  ): Promise<void> {
    const path: string = folderPath ? folderPath : 'default';
    const dbList: string[] = dbNameList ? dbNameList : [];
    try {
      const res = await this.sqlite.addSQLiteSuffix({
        folderPath: path,
        dbNameList: dbList,
      });
      return Promise.resolve(res);
    } catch (err) {
      return Promise.reject(err);
    }
  }
  async deleteOldDatabases(
    folderPath?: string,
    dbNameList?: string[],
  ): Promise<void> {
    const path: string = folderPath ? folderPath : 'default';
    const dbList: string[] = dbNameList ? dbNameList : [];
    try {
      const res = await this.sqlite.deleteOldDatabases({
        folderPath: path,
        dbNameList: dbList,
      });
      return Promise.resolve(res);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  async moveDatabasesAndAddSuffix(
    folderPath?: string,
    dbNameList?: string[],
  ): Promise<void> {
    const path: string = folderPath ? folderPath : 'default';
    const dbList: string[] = dbNameList ? dbNameList : [];
    return this.sqlite.moveDatabasesAndAddSuffix({
      folderPath: path,
      dbNameList: dbList,
    });
  }
}

/**
 * SQLiteDBConnection Interface
 */
export interface ISQLiteDBConnection {
  /**
   * Get SQLite DB Connection DB name
   * @returns string
   * @since 2.9.0 refactor
   */
  getConnectionDBName(): string;

  /**
   * Get SQLite DB Connection read-only mode
   * @returns boolean
   * @since 4.1.0
   */
  getConnectionReadOnly(): boolean;

  /**
   * Open a SQLite DB Connection
   * @returns Promise<void>
   * @since 2.9.0 refactor
   */
  open(): Promise<void>;
  /**
   * Close a SQLite DB Connection
   * @returns Promise<void>
   * @since 2.9.0 refactor
   */
  close(): Promise<void>;
  /**
   * Get Database Url
   * @returns Promise<capSQLiteUrl>
   * @since 3.3.3-4
   */
  getUrl(): Promise<capSQLiteUrl>;
  /**
   * Get the a SQLite DB Version
   * @returns Promise<capVersionResult>
   * @since 3.2.0
   */
  getVersion(): Promise<capVersionResult>;
  /**
   * Execute SQLite DB Connection Statements
   * @param statements
   * @returns Promise<capSQLiteChanges>
   * @since 2.9.0 refactor
   */
  execute(statements: string, transaction?: boolean): Promise<capSQLiteChanges>;
  /**
   * Execute SQLite DB Connection Query
   * @param statement
   * @param values (optional)
   * @returns Promise<Promise<DBSQLiteValues>
   * @since 2.9.0 refactor
   */
  query(statement: string, values?: any[]): Promise<DBSQLiteValues>;
  /**
   * Execute SQLite DB Connection Raw Statement
   * @param statement
   * @param values (optional)
   * @returns Promise<capSQLiteChanges>
   * @since 2.9.0 refactor
   */
  run(
    statement: string,
    values?: any[],
    transaction?: boolean,
  ): Promise<capSQLiteChanges>;
  /**
   * Execute SQLite DB Connection Set
   * @param set
   * @returns Promise<capSQLiteChanges>
   * @since 2.9.0 refactor
   */
  executeSet(
    set: capSQLiteSet[],
    transaction?: boolean,
  ): Promise<capSQLiteChanges>;
  /**
   * Check if a SQLite DB Connection exists
   * @returns Promise<capSQLiteResult>
   * @since 2.9.0 refactor
   */
  isExists(): Promise<capSQLiteResult>;
  /**
   * Check if a SQLite database is opened
   * @returns Promise<capSQLiteResult>
   * @since 3.0.0-beta.5
   */
  isDBOpen(): Promise<capSQLiteResult>;
  /**
   * Check if a table exists
   * @returns Promise<capSQLiteResult>
   * @since 3.0.0-beta.5
   */
  isTable(table: string): Promise<capSQLiteResult>;
  /**
   * Get database's table list
   * @since 3.4.2-3
   */
  getTableList(): Promise<DBSQLiteValues>;
  /**
   * Delete a SQLite DB Connection
   * @returns Promise<void>
   * @since 2.9.0 refactor
   */
  delete(): Promise<void>;
  /**
   * Create a synchronization table
   * @returns Promise<capSQLiteChanges>
   * @since 2.9.0 refactor
   */
  createSyncTable(): Promise<capSQLiteChanges>;
  /**
   * Set the synchronization date
   * @param syncdate
   * @returns Promise<void>
   * @since 2.9.0 refactor
   */
  setSyncDate(syncdate: string): Promise<void>;
  /**
   * Get the synchronization date
   * @returns Promise<capSQLiteSyncDate>
   * @since 2.9.0 refactor
   */
  getSyncDate(): Promise<string>;
  /**
   * Export the given database to a JSON Object
   * @param mode
   * @returns Promise<capSQLiteJson>
   * @since 2.9.0 refactor
   */
  exportToJson(mode: string): Promise<capSQLiteJson>;
  /**
   * Remove rows with sql_deleted = 1 after an export
   * @returns Promise<void>
   * @since 3.4.3-2
   */
  deleteExportedRows(): Promise<void>;

  /**
   *
   * @param txn
   * @returns Promise<void>
   * @since 3.4.0
   */
  executeTransaction(
    txn: { statement: string; values?: any[] }[],
  ): Promise<void>;
}
/**
 * SQLiteDBConnection Class
 */
export class SQLiteDBConnection implements ISQLiteDBConnection {
  constructor(
    private dbName: string,
    private readonly: boolean,
    private sqlite: any,
  ) {}

  getConnectionDBName(): string {
    return this.dbName;
  }
  getConnectionReadOnly(): boolean {
    return this.readonly;
  }

  async open(): Promise<void> {
    try {
      await this.sqlite.open({
        database: this.dbName,
        readonly: this.readonly,
      });
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  }
  async close(): Promise<void> {
    try {
      await this.sqlite.close({
        database: this.dbName,
        readonly: this.readonly,
      });
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  }
  async getUrl(): Promise<capSQLiteUrl> {
    try {
      const res: capSQLiteUrl = await this.sqlite.getUrl({
        database: this.dbName,
        readonly: this.readonly,
      });
      return Promise.resolve(res);
    } catch (err) {
      return Promise.reject(err);
    }
  }
  async getVersion(): Promise<capVersionResult> {
    try {
      const version: capVersionResult = await this.sqlite.getVersion({
        database: this.dbName,
        readonly: this.readonly,
      });
      return Promise.resolve(version);
    } catch (err) {
      return Promise.reject(err);
    }
  }
  async getTableList(): Promise<DBSQLiteValues> {
    try {
      const res: any = await this.sqlite.getTableList({
        database: this.dbName,
        readonly: this.readonly,
      });
      return Promise.resolve(res);
    } catch (err) {
      return Promise.reject(err);
    }
  }
  async execute(
    statements: string,
    transaction = true,
  ): Promise<capSQLiteChanges> {
    try {
      if (!this.readonly) {
        const res: any = await this.sqlite.execute({
          database: this.dbName,
          statements: statements,
          transaction: transaction,
          readonly: false,
        });
        return Promise.resolve(res);
      } else {
        return Promise.reject('not allowed in read-only mode');
      }
    } catch (err) {
      return Promise.reject(err);
    }
  }
  async query(statement: string, values?: any[]): Promise<DBSQLiteValues> {
    let res: any;
    try {
      if (values && values.length > 0) {
        res = await this.sqlite.query({
          database: this.dbName,
          statement: statement,
          values: values,
          readonly: this.readonly,
        });
      } else {
        res = await this.sqlite.query({
          database: this.dbName,
          statement: statement,
          values: [],
          readonly: this.readonly,
        });
      }
      if (res && typeof res.values[0] === 'object') {
        if (Object.keys(res.values[0]).includes('ios_columns')) {
          const columnList: string[] = res.values[0]['ios_columns'];
          const iosRes: any[] = [];
          for (let i = 1; i < res.values.length; i++) {
            const rowJson: any = res.values[i];
            const resRowJson: any = {};
            for (const item of columnList) {
              resRowJson[item] = rowJson[item];
            }
            iosRes.push(resRowJson);
          }
          res = {};
          res['values'] = iosRes;
        }
      }
      return Promise.resolve(res);
    } catch (err) {
      return Promise.reject(err);
    }
  }
  async run(
    statement: string,
    values?: any[],
    transaction = true,
  ): Promise<capSQLiteChanges> {
    let res: any;
    try {
      if (!this.readonly) {
        if (values && values.length > 0) {
          res = await this.sqlite.run({
            database: this.dbName,
            statement: statement,
            values: values,
            transaction: transaction,
            readonly: false,
          });
          //        }
        } else {
          res = await this.sqlite.run({
            database: this.dbName,
            statement: statement,
            values: [],
            transaction: transaction,
            readonly: false,
          });
        }
        return Promise.resolve(res);
      } else {
        return Promise.reject('not allowed in read-only mode');
      }
    } catch (err) {
      return Promise.reject(err);
    }
  }
  async executeSet(
    set: capSQLiteSet[],
    transaction = true,
  ): Promise<capSQLiteChanges> {
    try {
      if (!this.readonly) {
        const res: any = await this.sqlite.executeSet({
          database: this.dbName,
          set: set,
          transaction: transaction,
          readonly: false,
        });
        //      }
        return Promise.resolve(res);
      } else {
        return Promise.reject('not allowed in read-only mode');
      }
    } catch (err) {
      return Promise.reject(err);
    }
  }
  async isExists(): Promise<capSQLiteResult> {
    try {
      const res: any = await this.sqlite.isDBExists({
        database: this.dbName,
        readonly: this.readonly,
      });
      return Promise.resolve(res);
    } catch (err) {
      return Promise.reject(err);
    }
  }
  async isTable(table: string): Promise<capSQLiteResult> {
    try {
      const res: capSQLiteResult = await this.sqlite.isTableExists({
        database: this.dbName,
        table: table,
        readonly: this.readonly,
      });
      return Promise.resolve(res);
    } catch (err) {
      return Promise.reject(err);
    }
  }
  async isDBOpen(): Promise<capSQLiteResult> {
    try {
      const res: capSQLiteResult = await this.sqlite.isDBOpen({
        database: this.dbName,
        readonly: this.readonly,
      });
      return Promise.resolve(res);
    } catch (err) {
      return Promise.reject(err);
    }
  }
  async delete(): Promise<void> {
    try {
      if (!this.readonly) {
        await this.sqlite.deleteDatabase({
          database: this.dbName,
          readonly: false,
        });
        return Promise.resolve();
      } else {
        return Promise.reject('not allowed in read-only mode');
      }
    } catch (err) {
      return Promise.reject(err);
    }
  }
  async createSyncTable(): Promise<capSQLiteChanges> {
    try {
      if (!this.readonly) {
        const res: any = await this.sqlite.createSyncTable({
          database: this.dbName,
          readonly: false,
        });
        return Promise.resolve(res);
      } else {
        return Promise.reject('not allowed in read-only mode');
      }
    } catch (err) {
      return Promise.reject(err);
    }
  }
  async setSyncDate(syncdate: string): Promise<void> {
    try {
      if (!this.readonly) {
        await this.sqlite.setSyncDate({
          database: this.dbName,
          syncdate: syncdate,
          readonly: false,
        });
        return Promise.resolve();
      } else {
        return Promise.reject('not allowed in read-only mode');
      }
    } catch (err) {
      return Promise.reject(err);
    }
  }
  async getSyncDate(): Promise<string> {
    try {
      const res: any = await this.sqlite.getSyncDate({
        database: this.dbName,
        readonly: this.readonly,
      });
      let retDate = '';
      if (res.syncDate > 0)
        retDate = new Date(res.syncDate * 1000).toISOString();
      return Promise.resolve(retDate);
    } catch (err) {
      return Promise.reject(err);
    }
  }
  async exportToJson(mode: string): Promise<capSQLiteJson> {
    try {
      const res: any = await this.sqlite.exportToJson({
        database: this.dbName,
        jsonexportmode: mode,
        readonly: this.readonly,
      });
      return Promise.resolve(res);
    } catch (err) {
      return Promise.reject(err);
    }
  }
  async deleteExportedRows(): Promise<void> {
    try {
      if (!this.readonly) {
        await this.sqlite.deleteExportedRows({
          database: this.dbName,
          readonly: false,
        });
        return Promise.resolve();
      } else {
        return Promise.reject('not allowed in read-only mode');
      }
    } catch (err) {
      return Promise.reject(err);
    }
  }

  async executeTransaction(
    txn: { statement: string; values?: any[] }[],
  ): Promise<void> {
    try {
      if (!this.readonly) {
        const ret = await this.sqlite.execute({
          database: this.dbName,
          statements: 'BEGIN TRANSACTION;',
          transaction: false,
        });
        if (ret.changes.changes < 0) {
          return Promise.reject('Error in BEGIN TRANSACTION');
        }
        for (const task of txn) {
          if (task.values && task.values.length > 0) {
            const ret = await this.sqlite.run({
              database: this.dbName,
              statement: task.statement,
              values: task.values,
              transaction: false,
              readonly: false,
            });
            if (ret.changes.lastId === -1) {
              await this.execute('ROLLBACK;', false);
              return Promise.reject('Error in transaction run ');
            }
          } else {
            const ret = await this.sqlite.execute({
              database: this.dbName,
              statements: task.statement,
              transaction: false,
              readonly: false,
            });
            if (ret.changes.changes < 0) {
              await this.sqlite.execute({
                database: this.dbName,
                statements: 'ROLLBACK;',
                transaction: false,
                readonly: false,
              });
              return Promise.reject('Error in transaction execute ');
            }
          }
        }
        await this.sqlite.execute({
          database: this.dbName,
          statements: 'COMMIT;',
          transaction: false,
          readonly: false,
        });
        return Promise.resolve();
      } else {
        return Promise.reject('not allowed in read-only mode');
      }
    } catch (err: any) {
      await this.sqlite.execute({
        database: this.dbName,
        statements: 'ROLLBACK;',
        transaction: false,
        readonly: false,
      });
      return Promise.reject(err);
    }
  }
}
