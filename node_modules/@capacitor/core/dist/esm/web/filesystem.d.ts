import { WebPlugin } from './index';
import { CopyOptions, CopyResult, FileAppendOptions, FileAppendResult, FileDeleteOptions, FileDeleteResult, FileReadOptions, FileReadResult, FilesystemDirectory, FilesystemPlugin, FileWriteOptions, FileWriteResult, GetUriOptions, GetUriResult, MkdirOptions, MkdirResult, ReaddirOptions, ReaddirResult, RenameOptions, RenameResult, RmdirOptions, RmdirResult, StatOptions, StatResult } from '../core-plugin-definitions';
export declare class FilesystemPluginWeb extends WebPlugin implements FilesystemPlugin {
    DEFAULT_DIRECTORY: FilesystemDirectory;
    DB_VERSION: number;
    DB_NAME: string;
    private _writeCmds;
    private _db;
    static _debug: boolean;
    constructor();
    initDb(): Promise<IDBDatabase>;
    static doUpgrade(event: IDBVersionChangeEvent): void;
    dbRequest(cmd: string, args: any[]): Promise<any>;
    dbIndexRequest(indexName: string, cmd: string, args: [any]): Promise<any>;
    private getPath;
    clear(): Promise<{}>;
    /**
     * Read a file from disk
     * @param options options for the file read
     * @return a promise that resolves with the read file data result
     */
    readFile(options: FileReadOptions): Promise<FileReadResult>;
    /**
     * Write a file to disk in the specified location on device
     * @param options options for the file write
     * @return a promise that resolves with the file write result
     */
    writeFile(options: FileWriteOptions): Promise<FileWriteResult>;
    /**
     * Append to a file on disk in the specified location on device
     * @param options options for the file append
     * @return a promise that resolves with the file write result
     */
    appendFile(options: FileAppendOptions): Promise<FileAppendResult>;
    /**
     * Delete a file from disk
     * @param options options for the file delete
     * @return a promise that resolves with the deleted file data result
     */
    deleteFile(options: FileDeleteOptions): Promise<FileDeleteResult>;
    /**
     * Create a directory.
     * @param options options for the mkdir
     * @return a promise that resolves with the mkdir result
     */
    mkdir(options: MkdirOptions): Promise<MkdirResult>;
    /**
     * Remove a directory
     * @param options the options for the directory remove
     */
    rmdir(options: RmdirOptions): Promise<RmdirResult>;
    /**
     * Return a list of files from the directory (not recursive)
     * @param options the options for the readdir operation
     * @return a promise that resolves with the readdir directory listing result
     */
    readdir(options: ReaddirOptions): Promise<ReaddirResult>;
    /**
     * Return full File URI for a path and directory
     * @param options the options for the stat operation
     * @return a promise that resolves with the file stat result
     */
    getUri(options: GetUriOptions): Promise<GetUriResult>;
    /**
     * Return data about a file
     * @param options the options for the stat operation
     * @return a promise that resolves with the file stat result
     */
    stat(options: StatOptions): Promise<StatResult>;
    /**
     * Rename a file or directory
     * @param options the options for the rename operation
     * @return a promise that resolves with the rename result
     */
    rename(options: RenameOptions): Promise<RenameResult>;
    /**
     * Copy a file or directory
     * @param options the options for the copy operation
     * @return a promise that resolves with the copy result
     */
    copy(options: CopyOptions): Promise<CopyResult>;
    /**
     * Function that can perform a copy or a rename
     * @param options the options for the rename operation
     * @param doRename whether to perform a rename or copy operation
     * @return a promise that resolves with the result
     */
    private _copy;
}
declare const Filesystem: FilesystemPluginWeb;
export { Filesystem };
