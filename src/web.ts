import { WebPlugin } from '@capacitor/core';
import localForage from 'localforage';
import initSqlJs from 'sql.js';


import type {
  CapacitorSQLitePlugin,
  capEchoOptions,
  capSQLiteOptions,
  capSQLiteExecuteOptions,
  capSQLiteSetOptions,
  capSQLiteRunOptions,
  capSQLiteQueryOptions,
  capSQLiteImportOptions,
  capSQLiteExportOptions,
  capSQLiteSyncDateOptions,
  capSQLiteUpgradeOptions,
  capSQLiteTableOptions,
  capSQLitePathOptions,
  capEchoResult,
  capSQLiteResult,
  capSQLiteChanges,
  capSQLiteValues,
  capSQLiteJson,
  capSQLiteSyncDate,
  capAllConnectionsOptions,
  capSetSecretOptions,
  capChangeSecretOptions,
} from './definitions';
import { getDBFromStore, setInitialDBToStore, setDBToStore/*,
removeDBFromStore, isDBInStore */} from './web-utils/utils-store';


export class CapacitorSQLiteWeb
  extends WebPlugin
  implements CapacitorSQLitePlugin {
    private store!: LocalForage;
    private isStore = false;
    constructor() {
      super();
      this.isStore = this.openStore("jeepSqliteStore","databases");
    }
  async echo(options: capEchoOptions): Promise<capEchoResult> {
    console.log('ECHO in Web plugin', options);
    if(this.isStore) {
      try {
        const SQL = await initSqlJs(/*{
          locateFile: filename => `public/${filename}`
        }*/);
        // retrieve the database if stored on localforage
        const retDB: Uint8Array | null = await getDBFromStore("testSQLite.db", this.store);
        let db = null;
        if(retDB != null) {
          // Open existing database
          db = new SQL.Database(retDB);
          let res = db.exec("SELECT * FROM test");
          console.log(`Select test ${JSON.stringify(res)}`);
          res = db.exec("SELECT * FROM hello");
          console.log(`Select hello ${JSON.stringify(res)}`);
          console.log(">>>> start dropping all tables");
          let dropstr = "PRAGMA writable_schema = 1;";
          dropstr += "delete from sqlite_master where type in ('table', 'index', 'trigger');";
          dropstr += "PRAGMA writable_schema = 0;";
          dropstr += "VACUUM;";
          dropstr += "PRAGMA INTEGRITY_CHECK;";
          db.run(dropstr); // Run the query without returning anything
          console.log(">>>> end dropping all tables");
          res = db.exec("SELECT * from sqlite_master where type in ('table', 'index', 'trigger');");
          console.log(`Select tables ${JSON.stringify(res)}`);
        } else {
          // Create a new database
          console.log("$$$$ i am in creating the db")
          db = new SQL.Database();
          await setInitialDBToStore( "testSQLite.db", this.store);
        }
        // NOTE: You can also use new SQL.Database(data) where
        // data is an Uint8Array representing an SQLite database file

        // Run a query without reading the results
        db.run("CREATE TABLE IF NOT EXISTS test (col1, col2);");
        // Insert two rows: (1,111) and (2,222)
        db.run("INSERT INTO test VALUES (?,?), (?,?)", [1,111,2,222]);

        // Prepare a statement
        const stmt = db.prepare("SELECT * FROM test WHERE col1 BETWEEN $start AND $end");
        stmt.getAsObject({$start:1, $end:1}); // {col1:1, col2:111}

        // Bind new values
        stmt.bind({$start:1, $end:2});
        while(stmt.step()) { //
          const row = stmt.getAsObject();
          console.log(`Here is a row: ${JSON.stringify(row)}`);
        }
        // free the memory used by the statement
        stmt.free();
        // You can not use your statement anymore once it has been freed.
        // But not freeing your statements causes memory leaks. You don't want that.

        // Execute a single SQL string that contains multiple statements
        let sqlstr = "CREATE TABLE IF NOT EXISTS hello (a int, b char);";
        sqlstr += "INSERT INTO hello VALUES (0, 'hello');"
        sqlstr += "INSERT INTO hello VALUES (1, 'world');"
        db.run(sqlstr); // Run the query without returning anything

        const res = db.exec("SELECT * FROM hello");
        console.log(`Select ${JSON.stringify(res)}`);

        // store db to store
        await setDBToStore(db, "testSQLite.db", this.store);
      } catch (err) {
        console.log(`Storage failed: ${err} `);
      }
    } else {
      console.log(`Store not opened `);
    }
    return options;
  }
  async isSecretStored(): Promise<capSQLiteResult> {
    console.log('isSecretStored');
    throw this.unimplemented('Not implemented on web.');
  }
  async setEncryptionSecret(options: capSetSecretOptions): Promise<void> {
    console.log('setEncryptionSecret', options);
    throw this.unimplemented('Not implemented on web.');
  }
  async changeEncryptionSecret(options: capChangeSecretOptions): Promise<void> {
    console.log('changeEncryptionSecret', options);
    throw this.unimplemented('Not implemented on web.');
  }
  async createConnection(options: capSQLiteOptions): Promise<void> {
    console.log('createConnection', options);
    throw this.unimplemented('Not implemented on web.');
  }
  async open(options: capSQLiteOptions): Promise<void> {
    console.log('open', options);
    throw this.unimplemented('Not implemented on web.');
  }
  async closeConnection(options: capSQLiteOptions): Promise<void> {
    console.log('closeConnection', options);
    throw this.unimplemented('Not implemented on web.');
  }
  async checkConnectionsConsistency(
    options: capAllConnectionsOptions,
  ): Promise<capSQLiteResult> {
    console.log('checkConsistency', options);
    throw this.unimplemented('Not implemented on web.');
  }
  async close(options: capSQLiteOptions): Promise<void> {
    console.log('close', options);
    throw this.unimplemented('Not implemented on web.');
  }
  async execute(options: capSQLiteExecuteOptions): Promise<capSQLiteChanges> {
    console.log('execute', options);
    throw this.unimplemented('Not implemented on web.');
  }
  async executeSet(options: capSQLiteSetOptions): Promise<capSQLiteChanges> {
    console.log('execute', options);
    throw this.unimplemented('Not implemented on web.');
  }
  async run(options: capSQLiteRunOptions): Promise<capSQLiteChanges> {
    console.log('run', options);
    throw this.unimplemented('Not implemented on web.');
  }
  async query(options: capSQLiteQueryOptions): Promise<capSQLiteValues> {
    console.log('query', options);
    throw this.unimplemented('Not implemented on web.');
  }
  async isDBExists(options: capSQLiteOptions): Promise<capSQLiteResult> {
    console.log('in Web isDBExists', options);
    throw this.unimplemented('Not implemented on web.');
  }
  async isDBOpen(options: capSQLiteOptions): Promise<capSQLiteResult> {
    console.log('in Web isDBOpen', options);
    throw this.unimplemented('Not implemented on web.');
  }
  async isDatabase(options: capSQLiteOptions): Promise<capSQLiteResult> {
    console.log('in Web isDatabase', options);
    throw this.unimplemented('Not implemented on web.');
  }

  async isTableExists(
    options: capSQLiteTableOptions,
  ): Promise<capSQLiteResult> {
    console.log('in Web isTableExists', options);
    throw this.unimplemented('Not implemented on web.');
  }
  async deleteDatabase(options: capSQLiteOptions): Promise<void> {
    console.log('deleteDatabase', options);
    throw this.unimplemented('Not implemented on web.');
  }
  async isJsonValid(options: capSQLiteImportOptions): Promise<capSQLiteResult> {
    console.log('isJsonValid', options);
    throw this.unimplemented('Not implemented on web.');
  }
  async importFromJson(
    options: capSQLiteImportOptions,
  ): Promise<capSQLiteChanges> {
    console.log('importFromJson', options);
    throw this.unimplemented('Not implemented on web.');
  }
  async exportToJson(options: capSQLiteExportOptions): Promise<capSQLiteJson> {
    console.log('exportToJson', options);
    throw this.unimplemented('Not implemented on web.');
  }
  async createSyncTable(options: capSQLiteOptions): Promise<capSQLiteChanges> {
    console.log('createSyncTable', options);
    throw this.unimplemented('Not implemented on web.');
  }
  async setSyncDate(options: capSQLiteSyncDateOptions): Promise<void> {
    console.log('setSyncDate', options);
    throw this.unimplemented('Not implemented on web.');
  }
  async getSyncDate(options: capSQLiteOptions): Promise<capSQLiteSyncDate> {
    console.log('getSyncDate', options);
    throw this.unimplemented('Not implemented on web.');
  }
  async addUpgradeStatement(options: capSQLiteUpgradeOptions): Promise<void> {
    console.log('addUpgradeStatement', options);
    throw this.unimplemented('Not implemented on web.');
  }
  async copyFromAssets(): Promise<void> {
    console.log('copyFromAssets');
    throw this.unimplemented('Not implemented on web.');
  }
  async getDatabaseList(): Promise<capSQLiteValues> {
    throw this.unimplemented('Not implemented on web.');
  }
  async addSQLiteSuffix(options: capSQLitePathOptions): Promise<void> {
    console.log('addSQLiteSuffix', options);
    throw this.unimplemented('Not implemented on web.');
  }
  async deleteOldDatabases(options: capSQLitePathOptions): Promise<void> {
    console.log('deleteOldDatabases', options);
    throw this.unimplemented('Not implemented on web.');
  }
  private openStore(dbName: string, tableName: string): boolean {
    let ret = false;
    const config: any = this.setConfig(dbName, tableName);
    console.log(`config ${JSON.stringify(config)}`);
    console.log(`LocalForage ${JSON.stringify(localForage)}`);
    this.store = localForage.createInstance(config);
    if (this.store != null) {
      ret = true;
    }
    return ret;
  }

  private setConfig(dbName: string, tableName: string): any {
    const config: any = {
      name: dbName,
      storeName: tableName,
      driver: [localForage.INDEXEDDB],
      version: 1,
    };
    return config;
  }

}
