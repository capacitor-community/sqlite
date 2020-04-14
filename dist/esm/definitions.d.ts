declare module "@capacitor/core" {
    interface PluginRegistry {
        CapacitorSQLite: CapacitorSQLitePlugin;
    }
}
export interface CapacitorSQLitePlugin {
    echo(options: {
        value: string;
    }): Promise<{
        value: string;
    }>;
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
     * Execute a Set of Raw Statements
     * @param {capSQLiteOptions} options {statements: string}
     * @returns {Promise<capSQLiteResult>} {changes:number}
     */
    execute(options: capSQLiteOptions): Promise<capSQLiteResult>;
    /**
     * Execute a Single Statement
     * @param {capSQLiteOptions} options {statement: string, values:Array<any> }
     * @returns {Promise<capSQLiteResult>} {changes:number}
     */
    run(options: capSQLiteOptions): Promise<capSQLiteResult>;
    /**
     * Query a Single Statement
     * @param {capSQLiteOptions} options {statement: string, values:Array<string> }
     * @returns {Promise<capSQLiteResult>} {values:Array<any>}
     */
    query(options: capSQLiteOptions): Promise<capSQLiteResult>;
    /**
     * Delete a SQLite database
     * @param {capSQLiteOptions} options {database: string}
     * @returns {Promise<capSQLiteResult>} {result:boolean}
     */
    deleteDatabase(options: capSQLiteOptions): Promise<capSQLiteResult>;
    /**
     * Import from Json Object
     * @param {capSQLiteOptions} options {jsonstring: string}
     * @returns {Promise<capSQLiteResult>} {changes:number}
     */
    importFromJson(options: capSQLiteOptions): Promise<capSQLiteResult>;
}
export interface capSQLiteOptions {
    /**
     * The database name
     */
    database?: string;
    /**
     * The batch of raw SQL statements
     */
    statements?: string;
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
}
export interface capSQLiteResult {
    /**
     * result set to true when successful else false
     */
    result?: boolean;
    /**
     * the number of changes from an execute or run command
     */
    changes?: number;
    /**
     * the data values list as an Array
     */
    values?: Array<any>;
    /**
     * a message
     */
    message?: string;
}
