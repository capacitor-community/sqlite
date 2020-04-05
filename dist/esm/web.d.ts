import { WebPlugin } from '@capacitor/core';
import { CapacitorSQLitePlugin, capSQLiteOptions, capSQLiteResult } from './definitions';
export declare class CapacitorSQLiteWeb extends WebPlugin implements CapacitorSQLitePlugin {
    private db;
    constructor();
    echo(options: {
        value: string;
    }): Promise<{
        value: string;
    }>;
    open(options: capSQLiteOptions): Promise<capSQLiteResult>;
    close(options: capSQLiteOptions): Promise<capSQLiteResult>;
    execute(options: capSQLiteOptions): Promise<capSQLiteResult>;
    run(options: capSQLiteOptions): Promise<capSQLiteResult>;
    query(options: capSQLiteOptions): Promise<capSQLiteResult>;
    deleteDatabase(options: capSQLiteOptions): Promise<capSQLiteResult>;
}
declare const CapacitorSQLite: CapacitorSQLiteWeb;
export { CapacitorSQLite };
