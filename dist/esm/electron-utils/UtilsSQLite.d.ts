export declare class UtilsSQLite {
    pathDB: string;
    constructor();
    connection(dbName: string, readOnly?: boolean): any;
    getWritableDatabase(dbName: string): any;
    getReadableDatabase(dbName: string): any;
    getDBPath(dbName: string): string;
    private _createFolderIfNotExists;
    private _mkdirSyncRecursive;
}
