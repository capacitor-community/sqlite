import { WebPlugin } from './index';
import { StoragePlugin } from '../core-plugin-definitions';
export declare class StoragePluginWeb extends WebPlugin implements StoragePlugin {
    KEY_PREFIX: string;
    constructor();
    get(options: {
        key: string;
    }): Promise<{
        value: string;
    }>;
    set(options: {
        key: string;
        value: string;
    }): Promise<void>;
    remove(options: {
        key: string;
    }): Promise<void>;
    keys(): Promise<{
        keys: string[];
    }>;
    clear(): Promise<void>;
    makeKey(key: string): string;
    isKey(key: string): boolean;
    getKey(key: string): string;
}
declare const Storage: StoragePluginWeb;
export { Storage };
