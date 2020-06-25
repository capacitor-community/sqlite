import { WebPlugin } from '@capacitor/core';
import { CapacitorSQLitePlugin, capSQLiteOptions, capSQLiteResult } from './definitions';
import { DatabaseSQLiteHelper } from './electron-utils/DatabaseSQLiteHelper';
export declare class CapacitorSQLitePluginElectron extends WebPlugin implements CapacitorSQLitePlugin {
    mDb: DatabaseSQLiteHelper;
    constructor();
    echo(options: {
        value: string;
    }): Promise<{
        value: string;
    }>;
    open(options: capSQLiteOptions): Promise<capSQLiteResult>;
    close(options: capSQLiteOptions): Promise<capSQLiteResult>;
    execute(options: capSQLiteOptions): Promise<capSQLiteResult>;
    executeSet(options: capSQLiteOptions): Promise<capSQLiteResult>;
    run(options: capSQLiteOptions): Promise<capSQLiteResult>;
    query(options: capSQLiteOptions): Promise<capSQLiteResult>;
    isDBExists(options: capSQLiteOptions): Promise<capSQLiteResult>;
    deleteDatabase(options: capSQLiteOptions): Promise<capSQLiteResult>;
    isJsonValid(options: capSQLiteOptions): Promise<capSQLiteResult>;
    importFromJson(options: capSQLiteOptions): Promise<capSQLiteResult>;
    exportToJson(options: capSQLiteOptions): Promise<capSQLiteResult>;
    createSyncTable(): Promise<capSQLiteResult>;
    setSyncDate(options: capSQLiteOptions): Promise<capSQLiteResult>;
}
declare const CapacitorSQLiteElectron: CapacitorSQLitePluginElectron;
export { CapacitorSQLiteElectron };
