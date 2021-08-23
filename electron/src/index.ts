//import { app } from "electron";

import type {
  CapacitorSQLitePlugin,
  capConnectionOptions,
  capEchoOptions,
  capEchoResult,
  capSQLiteChanges,
  capSQLiteExecuteOptions,
  capSQLiteExportOptions,
  capSQLiteImportOptions,
  capSQLiteJson,
  capSQLiteOptions,
  capSQLiteQueryOptions,
  capSQLiteResult,
  capSQLiteRunOptions,
  capSQLiteSetOptions,
  capSQLiteSyncDateOptions,
  capSQLiteUpgradeOptions,
  capSQLiteValues,
  /*capSQLiteVersionUpgrade,*/
  capSQLiteSyncDate,
  capSQLiteTableOptions,
  capSQLitePathOptions,
  /*JsonSQLite,*/
  capAllConnectionsOptions,
  capSetSecretOptions,
  capChangeSecretOptions,
} from '../../src/definitions';

// eslint-disable-next-line @typescript-eslint/no-var-requires


export class CapacitorSQLite implements CapacitorSQLitePlugin {
  Os: any = null;
  Path: any = null;
  constructor() {
    this.Os = require('os');
    this.Path = require('path');
  }
  async isSecretStored(): Promise<capSQLiteResult> {
    return Promise.reject('Method not implemented.');
  }
  async setEncryptionSecret(options: capSetSecretOptions): Promise<void> {
    console.log(`${JSON.stringify(options)}`);
    return Promise.reject('Method not implemented.');
  }
  async changeEncryptionSecret(options: capChangeSecretOptions): Promise<void> {
    console.log(`${JSON.stringify(options)}`);
    return Promise.reject('Method not implemented.');
  }
  async createConnection(options: capConnectionOptions): Promise<void> {
    console.log(`${JSON.stringify(options)}`);
    return Promise.reject('Method not implemented.');
  }
  async closeConnection(options: capSQLiteOptions): Promise<void> {
    console.log(`${JSON.stringify(options)}`);
    return Promise.reject('Method not implemented.');
  }
  async echo(options: capEchoOptions): Promise<capEchoResult> {
    console.log(`in Electron Plugin ${JSON.stringify(options)}`);
    const ret: capEchoResult = {} as capEchoResult;
    const appName = this.Os.homedir();

/*    const appPath = app.getAppPath();
    let sep = '/';
    const idx: number = appPath.indexOf('\\');
    if (idx != -1) sep = '\\';
    const mypath = appPath.substring(
      0,
      appPath.indexOf('electron') - 1,
    );
    const appName = mypath.substring(mypath.lastIndexOf(sep) + 1);
 */
    ret.value = "in Electron plugin" + options.value + " " + appName ? options.value : '';
    return Promise.resolve(ret);
  }
  async open(options: capSQLiteOptions): Promise<void> {
    console.log(`${JSON.stringify(options)}`);
    throw new Error('Method not implemented.');
  }
  async close(options: capSQLiteOptions): Promise<void> {
    console.log(`${JSON.stringify(options)}`);
    throw new Error('Method not implemented.');
  }
  async execute(options: capSQLiteExecuteOptions): Promise<capSQLiteChanges> {
    console.log(`${JSON.stringify(options)}`);
    throw new Error('Method not implemented.');
  }
  async executeSet(options: capSQLiteSetOptions): Promise<capSQLiteChanges> {
    console.log(`${JSON.stringify(options)}`);
    throw new Error('Method not implemented.');
  }
  async run(options: capSQLiteRunOptions): Promise<capSQLiteChanges> {
    console.log(`${JSON.stringify(options)}`);
    throw new Error('Method not implemented.');
  }
  async query(options: capSQLiteQueryOptions): Promise<capSQLiteValues> {
    console.log(`${JSON.stringify(options)}`);
    throw new Error('Method not implemented.');
  }
  async isDBExists(options: capSQLiteOptions): Promise<capSQLiteResult> {
    console.log(`${JSON.stringify(options)}`);
    throw new Error('Method not implemented.');
  }
  async isDBOpen(options: capSQLiteOptions): Promise<capSQLiteResult> {
    console.log(`${JSON.stringify(options)}`);
    throw new Error('Method not implemented.');
  }
  async isDatabase(options: capSQLiteOptions): Promise<capSQLiteResult> {
    console.log(`${JSON.stringify(options)}`);
    throw new Error('Method not implemented.');
  }
  async isTableExists(
    options: capSQLiteTableOptions,
  ): Promise<capSQLiteResult> {
    console.log(`${JSON.stringify(options)}`);
    throw new Error('Method not implemented.');
  }
  async deleteDatabase(options: capSQLiteOptions): Promise<void> {
    console.log(`${JSON.stringify(options)}`);
    throw new Error('Method not implemented.');
  }
  async isJsonValid(options: capSQLiteImportOptions): Promise<capSQLiteResult> {
    console.log(`${JSON.stringify(options)}`);
    throw new Error('Method not implemented.');
  }
  async importFromJson(
    options: capSQLiteImportOptions,
  ): Promise<capSQLiteChanges> {
    console.log(`${JSON.stringify(options)}`);
    throw new Error('Method not implemented.');
  }
  async exportToJson(options: capSQLiteExportOptions): Promise<capSQLiteJson> {
    console.log(`${JSON.stringify(options)}`);
    throw new Error('Method not implemented.');
  }
  async createSyncTable(options: capSQLiteOptions): Promise<capSQLiteChanges> {
    console.log(`${JSON.stringify(options)}`);
    throw new Error('Method not implemented.');
  }
  async setSyncDate(options: capSQLiteSyncDateOptions): Promise<void> {
    console.log(`${JSON.stringify(options)}`);
    throw new Error('Method not implemented.');
  }
  async getSyncDate(options: capSQLiteOptions): Promise<capSQLiteSyncDate> {
    console.log(`${JSON.stringify(options)}`);
    throw new Error('Method not implemented.');
  }
  async addUpgradeStatement(options: capSQLiteUpgradeOptions): Promise<void> {
    console.log(`${JSON.stringify(options)}`);
    throw new Error('Method not implemented.');
  }
  async copyFromAssets(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  async getDatabaseList(): Promise<capSQLiteValues> {
    throw new Error('Method not implemented.');
  }
  async addSQLiteSuffix(options: capSQLitePathOptions): Promise<void> {
    console.log(`${JSON.stringify(options)}`);
    throw new Error('Method not implemented.');
  }
  async deleteOldDatabases(options: capSQLitePathOptions): Promise<void> {
    console.log(`${JSON.stringify(options)}`);
    throw new Error('Method not implemented.');
  }
  async checkConnectionsConsistency(
    options: capAllConnectionsOptions,
  ): Promise<capSQLiteResult> {
    console.log(`${JSON.stringify(options)}`);
    throw new Error('Method not implemented.');
  }
}
