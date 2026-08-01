<p align="center"><br><img src="https://user-images.githubusercontent.com/236501/85893648-1c92e880-b7a8-11ea-926d-95355b8175c7.png" width="128" height="128" /></p>
<h2 align="center">WEB USAGE DOCUMENTATION</h2>
<p align="center"><strong><code>@capacitor-community/sqlite</code></strong></p>
<p align="center">
<br>

## General to all applications

This describes how to use the Web part of `@capacitor-community/sqlite`. It is a real SQLite, fit
for production, not only for development: the plugin runs
[`@sqlite.org/sqlite-wasm`](https://github.com/sqlite/sqlite-wasm), the official SQLite wasm build,
inside a dedicated Worker that it creates and owns. All SQL and all persistence happen in that
worker; the main thread never touches the wasm heap.

```bash
npm i --save @capacitor-community/sqlite@latest
```

That is the whole install. There is no second package for the Web platform: the worker
(`dist/web-worker.js`) and the SQLite binary (`dist/sqlite3.wasm`) ship inside the plugin, and
there is no file to copy into your assets folder.

`initWebStore()` is mandatory on Web and must complete before the first `createConnection`. It
boots the worker, selects the durability tier, and, the very first time it runs after an upgrade,
imports any database left behind by the previous `jeep-sqlite` implementation.

## App Index

* [`Requirements and browser support`](#requirements-and-browser-support)
* [`Durability tiers`](#durability-tiers)
* [`Backgrounding under Capacitor`](#backgrounding-under-capacitor)
* [`Serving the worker and the wasm`](#serving-the-worker-and-the-wasm)
* [`Migrating from jeep-sqlite`](#migrating-from-jeep-sqlite)
* [`Limitations`](#limitations)
* [`Ionic/Angular App`](#ionicangular-app)
* [`Ionic/Vue App`](#ionicvue-app)
* [`Ionic/React App`](#ionicreact-app)
* [`Troubleshooting`](#troubleshooting)

## Requirements and browser support

There are two floors, and they are not the same floor. The first decides whether the plugin runs
at all; the second decides only where your data rests.

| Floor | Chromium / Android WebView | Safari / iOS WebKit | Firefox | Below it |
| ----- | -------------------------- | ------------------- | ------- | -------- |
| **Engine**: `BigInt`, optional chaining, nullish coalescing | 80 | 14 | 74 | **Nothing loads.** The worker fails to parse and `initWebStore()` rejects. |
| **Durability**: OPFS sync access handles | 108 | 16.4 | 111 | Everything works, on tier 2 below. Android WebView reached this in M132, January 2025. |

The engine floor is not a limitation this plugin can lift. `BigInt` is a runtime dependency of
SQLite's int64 support and cannot be polyfilled, and the ES2020 syntax is upstream
`@sqlite.org/sqlite-wasm`'s own, so lowering your app's build target does not help and only breaks
your own code. Anything older than that floor is unsupported on the Web platform and fails loudly
rather than degrading.

No COOP/COEP headers and no `SharedArrayBuffer` are required on either tier, which is what makes
this work unchanged inside Capacitor's `capacitor://` and `https://localhost` WebViews and on
ordinary static hosting.

## Durability tiers

`initWebStore()` probes the browser and settles on one of two tiers for the lifetime of the worker.

**Tier 1, the normal case.** Databases are real files in the browser's Origin Private File System,
reached through SQLite's own `opfs-sahpool` VFS, in a pool directory named `.capacitor-sqlite`.
Every committed write is durable when the method resolves, exactly as on native.

**Tier 2, the automatic fallback** when the browser has no OPFS sync access handles. Databases are
opened `:memory:` and the whole database image is written to IndexedDB, in a database named
`capacitor-sqlite-store` under the object store `databases`. This is the model the previous
`jeep-sqlite` implementation used everywhere.

🚨 On tier 2 the image is written to IndexedDB when one requires
 - a `saveToStore`,
 - a `close`,
 - a `closeConnection`,

and additionally after an `importFromJson` and after a committed explicit transaction.
🚨

`saveToStore()` is a no-op on tier 1 and a real flush on tier 2, so calling it after a batch of
writes is the portable pattern and costs nothing where it is unnecessary. The `<jeep-sqlite>`
element's `autosave` attribute is gone and has no replacement: there is no element to put it on,
and on tier 1 there is nothing for it to do.

Only one browsing context may own the store, because OPFS access handles are single-owner by
design. If another tab of the same origin already holds it, `initWebStore()` rejects with an
explicit error rather than quietly opening an empty database over your data.

**Tier 2 is not a one-way door.** A browser that lacked OPFS sync access handles and later gains
them, which is the normal update path for the devices that land on tier 2, would otherwise select
tier 1 and find an empty pool while the data sat in IndexedDB. Each `initWebStore()` on tier 1
therefore moves any image left in the fallback store into the pool, verifies it, and only then
removes the original. Nothing is deleted until its replacement has been read back, so an
interrupted move resumes on the next start and a browser that drops back to tier 2 still finds
whatever has not moved yet.

## Backgrounding under Capacitor

WKWebView invalidates OPFS access handles when the OS suspends the app, so the store cannot simply
be left open across a background. When the plugin detects a native Capacitor platform it follows
the app itself: on the way out it closes every connection and pauses the VFS, and on the way back
it unpauses and reopens what it closed. A transaction open at that moment cannot survive the
close; it is rolled back and reported on the console rather than silently abandoned.

If the gentle path cannot run, which is what a long suspension can do to a pool behind the
plugin's back, the worker is torn down and a fresh one takes the pool over, then reopens the same
connections. This is the recovery path, and it is why a suspension does not end in a dead store.

Three methods are exported for apps that would rather drive this from `App.appStateChange`, which
is more precise than the visibility signal the plugin uses on its own. They are safe to call in
addition to the automatic wiring, since all three are idempotent:

```ts
await (CapacitorSQLite as any).pauseWebStore();    // close everything, pause the VFS
await (CapacitorSQLite as any).resumeWebStore();   // unpause and reopen, restarting if needed
await (CapacitorSQLite as any).restartWebStore();  // the heavy path on its own
```

On the plain web none of this is wired up: a browser tab going hidden is not a suspension, and
closing every connection on a tab switch would be a bug rather than a protection.

## Serving the worker and the wasm

The plugin builds its worker from `dist/web-worker.js` inside the package, and that worker loads
`dist/sqlite3.wasm` sitting next to it. Whether your bundler follows that on its own depends on
the bundler, because the worker URL is computed at runtime rather than written as a literal
`new URL('...', import.meta.url)`. Serving the two files yourself is two lines and always works,
so prefer it if you would rather not find out:

```ts
import { setSqliteWorkerFactory } from '@capacitor-community/sqlite';

// Copy dist/web-worker.js and dist/sqlite3.wasm from the package into the folder your app serves
// as its web root (public/ for Vite, src/assets/ for Angular, and so on). Keeping them side by
// side is all the wasm needs: the worker resolves it as its own sibling.
setSqliteWorkerFactory(() => new Worker(new URL('web-worker.js', document.baseURI)));
```

Under Capacitor, files in the web root are copied into the native app by `npx cap sync`, so the
same two lines cover iOS and Android.

**Vite needs this.** Measured with Vite 7: the plugin's runtime-computed URL is rewritten to point
at a module of the plugin's own that Vite emits as an asset, `web-worker.js` is never emitted, and
the request 404s. The symptom is an `initWebStore()` rejection quoting
`Unexpected token '<'`, which is the application's HTML answering the worker request.

Two further escape hatches, both additive exports and both to be called before `initWebStore()`:

```ts
import { setSqliteWebOptions, setSqliteWorkerFactory } from '@capacitor-community/sqlite';

// 1. The wasm is served from somewhere else, for instance a CDN or a hashed asset path.
setSqliteWebOptions({ wasmUrl: '/assets/sqlite3.wasm' });

// 2. Your bundler does emit the worker, and you would rather it owned the URL.
setSqliteWorkerFactory(() => new Worker(new URL('./web-worker.js', import.meta.url)));
```

`setSqliteWebOptions` also accepts `assetsPath`, if your prepopulated databases are not served
from `assets/databases/`.

One bundler note: a Vite build also emits `sqlite3-worker1.js` and `sqlite3-opfs-async-proxy.js`,
about 237 KiB together, because `@sqlite.org/sqlite-wasm`'s entry point references them with
`new URL`. This plugin uses neither and never fetches them at runtime; they are dead weight in the
output directory, and you can exclude them in your bundler configuration if the size matters.

## Migrating from jeep-sqlite

Nothing to do. The first `initWebStore()` after upgrading reads the old
`jeepSqliteStore` IndexedDB store, imports every database it finds into the active tier, and
verifies each one with `PRAGMA integrity_check` before retiring the legacy store. It runs once and
then records that it has run.

Two details worth knowing if you are watching the console:

- A leftover `backup-<name>SQLite.db` key, which jeep-sqlite writes before a version upgrade and
  deletes after it, is skipped rather than imported as a database in its own right, and does not
  prevent the old store being retired. That only applies while `<name>SQLite.db` is there too: a
  `backup-` key on its own is the only copy of something and is migrated like any other database.
- A database that already exists under the same name is never written over. That cannot happen on
  a normal upgrade, where nothing has been opened yet, but it can if you ran with
  `skipJeepMigration` and later turned it off. The legacy database is reported as failed and both
  copies are left intact for you to reconcile.
- If any database fails to import or fails its integrity check, nothing is deleted. The legacy
  store is left exactly as it was and a warning naming the database is written to the console, so
  the data is still recoverable by hand. The migration is not retried on the next boot: by then
  the databases that did migrate are live, and re-importing the old images over them would undo
  whatever the app has written since.

The databases keep their names, so no application code changes.

## Limitations

- **No encryption.** There is no SQLCipher build for wasm. `createConnection` with
  `encrypted: true` rejects, as do `setEncryptionSecret`, `changeEncryptionSecret`,
  `clearEncryptionSecret`, `checkEncryptionSecret`, `isSecretStored`, `isDatabaseEncrypted`,
  `isInConfigEncryption` and `isInConfigBiometricAuth`.
- **No WAL.** `opfs-sahpool` has no shared-memory support, so tier 1 stays on the `delete` journal
  and a `PRAGMA journal_mode=WAL` is silently refused. Tier 2 runs on the `memory` journal.
- **Foreign keys are enforced.** `PRAGMA foreign_keys` is ON from the moment a database is opened,
  which matches every other platform of this plugin. If your schema declares constraints it was
  quietly violating on the old web engine, they will now be reported.
- **The soft-delete cascade needs rowids.** On a database that participates in sync, a DELETE is
  recorded rather than performed, so sqlite never runs the `ON DELETE` actions itself and the
  plugin applies them instead. It identifies affected rows by `rowid`, so a `WITHOUT ROWID` table
  on the receiving end of a constraint with an `ON DELETE` action is reported as an error rather
  than skipped. A referencing table that has no `sql_deleted` column is left alone: there is
  nothing to mark, the parent row physically remains, and sqlite runs the real action later when
  `deleteExportedRows` performs the actual delete.
- **Integers above 2^53 come back as `BigInt`.** This is a correctness improvement over the
  previous engine, which silently lost precision, but `JSON.stringify` throws a `TypeError` on a
  `BigInt`. Use `exportToJson`, which encodes out-of-range integers as decimal strings that SQLite
  reads back identically on import, or supply your own replacer.
- **One owning tab per origin**, as described under [Durability tiers](#durability-tiers).
- **Not implemented on Web**: `getUrl`, the Cordova migration helpers (`getMigratableDbList`,
  `addSQLiteSuffix`, `deleteOldDatabases`, `moveDatabasesAndAddSuffix`) and the non-conformed
  database methods (`getNCDatabasePath`, `createNCConnection`, `closeNCConnection`,
  `isNCDatabase`), which are all filesystem-path based and native-only.

Read-only connections (`readonly: true`) are supported on Web, on both tiers.

## Ionic/Angular App

- For databases in the `src/assets/databases` folder if any, you have to create a `databases.json` file which includes only the non-encrypted database's names (on Web that is every database, since encryption is unsupported there)

```json
{
  "databaseList" : [
    "YOUR_DB1.db",
    "YOUR_DB2.db",
    ...
  ]
}
```

- `main.ts` needs no web-specific step. There is no custom element to register, so bootstrap the
  app as you normally would

```js
...
platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));
```

- open the `app.module.ts` file and add

```js
import { NgModule } from '@angular/core';
...
import { SQLiteService } from './services/sqlite.service';
import { DetailService } from './services/detail.service';
...
@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule],
  providers: [
    SQLiteService,
    DetailService,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
  ],
  bootstrap: [AppComponent],
})
```

  `CUSTOM_ELEMENTS_SCHEMA` is no longer needed: it was only there so Angular would tolerate the
  `<jeep-sqlite>` tag in a template.

- `app-component.html` needs no web-specific element either

```html
<ion-app>
  <ion-router-outlet></ion-router-outlet>
</ion-app>
```

- open the `app-component.ts` file and add
```js
import { Component } from '@angular/core';

import { Platform } from '@ionic/angular';
import { SQLiteService } from './services/sqlite.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent {
  private initPlugin: boolean;
  constructor(
    private platform: Platform,
    private sqlite: SQLiteService,
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(async () => {
      this.sqlite.initializePlugin().then(async (ret) => {
        this.initPlugin = ret;
        if( this.sqlite.platform === "web") {
          try {
            await this.sqlite.initWebStore();
          } catch (err) {
            // Two failure modes are worth telling the user apart: a browser below the engine
            // floor, where the plugin cannot run at all, and another tab already owning the
            // store. See the Troubleshooting section.
            console.log(`>>>> initWebStore failed: ${err}`);
          }
        }

        console.log(`>>>> in App  this.initPlugin ${this.initPlugin}`);
      });
    });
  }
}
```
- open or create a `sqlite.service.ts` under the `services`folder

```js
import { Injectable } from '@angular/core';

import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteDBConnection, SQLiteConnection, capSQLiteSet,
         capSQLiteChanges, capSQLiteValues, capEchoResult, capSQLiteResult,
         capNCDatabasePathResult } from '@capacitor-community/sqlite';

@Injectable()

export class SQLiteService {
    sqlite: SQLiteConnection;
    isService: boolean = false;
    platform: string;
    sqlitePlugin: any;
    native: boolean = false;

    constructor() {
    }
    /**
     * Plugin Initialization
     */
    initializePlugin(): Promise<boolean> {
        return new Promise (resolve => {
            this.platform = Capacitor.getPlatform();
            if(this.platform === 'ios' || this.platform === 'android') this.native = true;
            this.sqlitePlugin = CapacitorSQLite;
            this.sqlite = new SQLiteConnection(this.sqlitePlugin);
            this.isService = true;
            resolve(true);
        });
    }
    /**
     * Echo a value
     * @param value 
     */
    async echo(value: string): Promise<capEchoResult> {
        if(this.sqlite != null) {
            try {
                const ret = await this.sqlite.echo(value);
                return Promise.resolve(ret);
            } catch (err) {
                return Promise.reject(new Error(err));
            }
        } else {
            return Promise.reject(new Error("no connection open"));
        }
    }
    async isSecretStored(): Promise<capSQLiteResult> {
        if(!this.native) {
            return Promise.reject(new Error(`Not implemented for ${this.platform} platform`));
        }
        if(this.sqlite != null) {
            try {
                return Promise.resolve(await this.sqlite.isSecretStored());
            } catch (err) {
                return Promise.reject(new Error(err));
            }
        } else {
            return Promise.reject(new Error(`no connection open`));
        }
    }
    async setEncryptionSecret(passphrase: string): Promise<void> {
        if(!this.native) {
            return Promise.reject(new Error(`Not implemented for ${this.platform} platform`));
        }
        if(this.sqlite != null) {
            try {
                return Promise.resolve(await this.sqlite.setEncryptionSecret(passphrase));
            } catch (err) {
                return Promise.reject(new Error(err));
            }
        } else {
            return Promise.reject(new Error(`no connection open`));
        }

    }

    async changeEncryptionSecret(passphrase: string, oldpassphrase: string): Promise<void> {
        if(!this.native) {
            return Promise.reject(new Error(`Not implemented for ${this.platform} platform`));
        }
        if(this.sqlite != null) {
            try {
                return Promise.resolve(await this.sqlite.changeEncryptionSecret(passphrase, oldpassphrase));
            } catch (err) {
                return Promise.reject(new Error(err));
            }
        } else {
            return Promise.reject(new Error(`no connection open`));
        }

    }

    /**
     * addUpgradeStatement
     * @param database
     * @param toVersion
     * @param statements
     */
    async addUpgradeStatement(database:string, toVersion: number, statements: string)
                                        : Promise<void> {
        if(this.sqlite != null) {
            try {
                await this.sqlite.addUpgradeStatement(database, toVersion, statements);
                return Promise.resolve();
            } catch (err) {
                return Promise.reject(new Error(err));
            }
        } else {
            return Promise.reject(new Error(`no connection open for ${database}`));
        }
    }
    /**
     * get a non-conformed database path
     * @param path
     * @param database
     * @returns Promise<capNCDatabasePathResult>
     * @since 3.3.3-1
     */
    async getNCDatabasePath(folderPath: string, database: string): Promise<capNCDatabasePathResult> {
        if(this.sqlite != null) {
            try {
                const res: capNCDatabasePathResult = await this.sqlite.getNCDatabasePath(
                                                        folderPath, database);
                return Promise.resolve(res);
            } catch (err) {
                return Promise.reject(new Error(err));
            }
        } else {
            return Promise.reject(new Error(`no connection open for ${database}`));
        }

    }
    /**
     * Create a non-conformed database connection
     * @param databasePath
     * @param version
     * @returns Promise<SQLiteDBConnection>
     * @since 3.3.3-1
     */
    async createNCConnection(databasePath: string, version: number): Promise<SQLiteDBConnection> {
        if(this.sqlite != null) {
            try {
                const db: SQLiteDBConnection = await this.sqlite.createNCConnection(
                                databasePath, version);
                if (db != null) {
                    return Promise.resolve(db);
                } else {
                    return Promise.reject(new Error(`no db returned is null`));
                }
            } catch (err) {
                return Promise.reject(new Error(err));
            }
        } else {
            return Promise.reject(new Error(`no connection open for ${databasePath}`));
        }
        
    }
    /**
     * Close a non-conformed database connection
     * @param databasePath
     * @returns Promise<void>
     * @since 3.3.3-1
     */
    async closeNCConnection(databasePath: string): Promise<void> {
        if(this.sqlite != null) {
            try {
                await this.sqlite.closeNCConnection(databasePath);
                return Promise.resolve();
            } catch (err) {
                return Promise.reject(new Error(err));
            }
        } else {
            return Promise.reject(new Error(`no connection open for ${databasePath}`));
        }
    }
    /**
     * Check if a non-conformed databaseconnection exists
     * @param databasePath
     * @returns Promise<capSQLiteResult>
     * @since 3.3.3-1
     */
    async isNCConnection(databasePath: string): Promise<capSQLiteResult> {
        if(this.sqlite != null) {
            try {
                return Promise.resolve(await this.sqlite.isNCConnection(databasePath));
            } catch (err) {
                return Promise.reject(new Error(err));
            }
        } else {
            return Promise.reject(new Error(`no connection open`));
        }
            
    }
    /**
     * Retrieve a non-conformed database connection
     * @param databasePath
     * @returns Promise<SQLiteDBConnection>
     * @since 3.3.3-1
     */
     async retrieveNCConnection(databasePath: string): Promise<SQLiteDBConnection> {
        if(this.sqlite != null) {
            try {
                return Promise.resolve(await this.sqlite.retrieveNCConnection(databasePath));
            } catch (err) {
                return Promise.reject(new Error(err));
            }
        } else {
            return Promise.reject(new Error(`no connection open for ${databasePath}`));
        }
    }
    /**
     * Check if a non conformed database exists
     * @param databasePath
     * @returns Promise<capSQLiteResult>
     * @since 3.3.3-1
     */
    async isNCDatabase(databasePath: string): Promise<capSQLiteResult> {
        if(this.sqlite != null) {
            try {
                return Promise.resolve(await this.sqlite.isNCDatabase(databasePath));
            } catch (err) {
                return Promise.reject(new Error(err));
            }
        } else {
            return Promise.reject(new Error(`no connection open`));
        }
    }
    /**
     * Create a connection to a database
     * @param database 
     * @param encrypted 
     * @param mode 
     * @param version 
     * @param readonly read-only connections work on every platform, web included
     */
    async createConnection(database:string, encrypted: boolean,
                           mode: string, version: number, readonly = false
                           ): Promise<SQLiteDBConnection> {
        if(this.sqlite != null) {
            try {
/*                if(encrypted) {
                    if(this.native) {
                        const isSet = await this.sqlite.isSecretStored()
                        if(!isSet.result) {
                            return Promise.reject(new Error(`no secret phrase registered`));
                        }
                    }
                }
*/
               const db: SQLiteDBConnection = await this.sqlite.createConnection(
                                database, encrypted, mode, version, readonly);
                if (db != null) {
                    return Promise.resolve(db);
                } else {
                    return Promise.reject(new Error(`no db returned is null`));
                }
            } catch (err) {
                return Promise.reject(new Error(err));
            }
        } else {
            return Promise.reject(new Error(`no connection open for ${database}`));
        }
    }
    /**
     * Close a connection to a database
     * @param database 
     */
    async closeConnection(database:string): Promise<void> {
        if(this.sqlite != null) {
            try {
                await this.sqlite.closeConnection(database);
                return Promise.resolve();
            } catch (err) {
                return Promise.reject(new Error(err));
            }
        } else {
            return Promise.reject(new Error(`no connection open for ${database}`));
        }
    }
    /**
     * Retrieve an existing connection to a database
     * @param database 
     */
    async retrieveConnection(database:string): 
            Promise<SQLiteDBConnection> {
        if(this.sqlite != null) {
            try {
                return Promise.resolve(await this.sqlite.retrieveConnection(database));
            } catch (err) {
                return Promise.reject(new Error(err));
            }
        } else {
            return Promise.reject(new Error(`no connection open for ${database}`));
        }
    }
    /**
     * Retrieve all existing connections
     */
    async retrieveAllConnections(): 
                    Promise<Map<string, SQLiteDBConnection>> {
        if(this.sqlite != null) {
            try {
                const myConns =  await this.sqlite.retrieveAllConnections();
/*                let keys = [...myConns.keys()];
                keys.forEach( (value) => {
                    console.log("Connection: " + value);
                }); 
*/
                return Promise.resolve(myConns);
            } catch (err) {
                return Promise.reject(new Error(err));
            }
        } else {
            return Promise.reject(new Error(`no connection open`));
        }               
    }
    /**
     * Close all existing connections
     */
    async closeAllConnections(): Promise<void> {
        if(this.sqlite != null) {
            try {
                return Promise.resolve(await this.sqlite.closeAllConnections());
            } catch (err) {
                return Promise.reject(new Error(err));
            }
        } else {
            return Promise.reject(new Error(`no connection open`));
        }
    }
    /**
     * Check if connection exists
     * @param database 
     */
     async isConnection(database: string): Promise<capSQLiteResult> {
        if(this.sqlite != null) {
            try {
                return Promise.resolve(await this.sqlite.isConnection(database));
            } catch (err) {
                return Promise.reject(new Error(err));
            }
        } else {
            return Promise.reject(new Error(`no connection open`));
        }
    }
    /**
     * Check Connections Consistency
     * @returns 
     */
    async checkConnectionsConsistency(): Promise<capSQLiteResult> {
        if(this.sqlite != null) {
            try {
                const res = await this.sqlite.checkConnectionsConsistency();
                return Promise.resolve(res);
            } catch (err) {
                return Promise.reject(new Error(err));
            }
        } else {
            return Promise.reject(new Error(`no connection open`));
        }
    }
    /**
     * Check if database exists
     * @param database 
     */
    async isDatabase(database: string): Promise<capSQLiteResult> {
        if(this.sqlite != null) {
            try {
                return Promise.resolve(await this.sqlite.isDatabase(database));
            } catch (err) {
                return Promise.reject(new Error(err));
            }
        } else {
            return Promise.reject(new Error(`no connection open`));
        }
    }
    /**
     * Get the list of databases
     */    
    async getDatabaseList() : Promise<capSQLiteValues> {
        if(this.sqlite != null) {
            try {
                return Promise.resolve(await this.sqlite.getDatabaseList());
            } catch (err) {
                return Promise.reject(new Error(err));
            }
        } else {
            return Promise.reject(new Error(`no connection open`));
        }
    }
    /**
     * Get Migratable databases List
     */    
    async getMigratableDbList(folderPath?: string): Promise<capSQLiteValues>{
        if(!this.native) {
            return Promise.reject(new Error(`Not implemented for ${this.platform} platform`));
        }
        if(this.sqlite != null) {
            try {
                if(!folderPath || folderPath.length === 0) {
                    return Promise.reject(new Error(`You must provide a folder path`));
                }
                return Promise.resolve(await this.sqlite.getMigratableDbList(folderPath));
            } catch (err) {
                return Promise.reject(new Error(err));
            }
        } else {
            return Promise.reject(new Error(`no connection open`));
        }
    }
    
    /**
     * Add "SQLite" suffix to old database's names
     */    
    async addSQLiteSuffix(folderPath?: string, dbNameList?: string[]): Promise<void>{
        if(!this.native) {
            return Promise.reject(new Error(`Not implemented for ${this.platform} platform`));
        }
        if(this.sqlite != null) {
            try {
                const path: string = folderPath ? folderPath : "default";
                const dbList: string[] = dbNameList ? dbNameList : [];
                return Promise.resolve(await this.sqlite.addSQLiteSuffix(path, dbList));
            } catch (err) {
                return Promise.reject(new Error(err));
            }
        } else {
            return Promise.reject(new Error(`no connection open`));
        }
    }
    /**
     * Delete old databases
     */    
    async deleteOldDatabases(folderPath?: string, dbNameList?: string[]): Promise<void>{
        if(!this.native) {
            return Promise.reject(new Error(`Not implemented for ${this.platform} platform`));
        }
        if(this.sqlite != null) {
            try {
                const path: string = folderPath ? folderPath : "default";
                const dbList: string[] = dbNameList ? dbNameList : [];
                return Promise.resolve(await this.sqlite.deleteOldDatabases(path, dbList));
            } catch (err) {
                return Promise.reject(new Error(err));
            }
        } else {
            return Promise.reject(new Error(`no connection open`));
        }
    }

    /**
     * Import from a Json Object
     * @param jsonstring 
     */
    async importFromJson(jsonstring:string): Promise<capSQLiteChanges> {
        if(this.sqlite != null) {
            try {
                return Promise.resolve(await this.sqlite.importFromJson(jsonstring));
            } catch (err) {
                return Promise.reject(new Error(err));
            }
        } else {
            return Promise.reject(new Error(`no connection open`));
        }
                    
    }

    /**
     * Is Json Object Valid
     * @param jsonstring Check the validity of a given Json Object
     */

    async isJsonValid(jsonstring:string): Promise<capSQLiteResult> {
        if(this.sqlite != null) {
            try {
                return Promise.resolve(await this.sqlite.isJsonValid(jsonstring));
            } catch (err) {
                return Promise.reject(new Error(err));
            }
        } else {
            return Promise.reject(new Error(`no connection open`));
        }

    }

    /**
     * Copy databases from public/assets/databases folder to application databases folder
     */
    async copyFromAssets(overwrite?: boolean): Promise<void> { 
        const mOverwrite: boolean = overwrite != null ? overwrite : true;
        console.log(`&&&& mOverwrite ${mOverwrite}`);
        if (this.sqlite != null) {
            try {
                return Promise.resolve(await this.sqlite.copyFromAssets(mOverwrite));
            } catch (err) {
                return Promise.reject(new Error(err));
            }
        } else {
            return Promise.reject(new Error(`no connection open`));
        }
    }

    /**
     * Initialize the Web store.
     * Mandatory on web and must complete before the first createConnection. It boots the
     * plugin's worker, selects the durability tier, and on its first run imports any database
     * left behind by the previous jeep-sqlite implementation.
     */
     async initWebStore(): Promise<void> {
        if(this.platform !== 'web')  {
            return Promise.reject(new Error(`not implemented for this platform: ${this.platform}`));
        }
        if(this.sqlite != null) {
            try {
                await this.sqlite.initWebStore();
                return Promise.resolve();
            } catch (err) {
                return Promise.reject(new Error(err));
            }
        } else {
            return Promise.reject(new Error(`no connection open`));
        }
    }
    /**
     * Save a database to store.
     * A no-op on tier 1, where OPFS writes are already durable, and the real flush of the
     * database image to IndexedDB on tier 2. Safe and cheap to call unconditionally.
     * @param database 
     */
     async saveToStore(database:string): Promise<void> {
        if(this.platform !== 'web')  {
            return Promise.reject(new Error(`not implemented for this platform: ${this.platform}`));
        }
        if(this.sqlite != null) {
            try {
                await this.sqlite.saveToStore(database);
                return Promise.resolve();
            } catch (err) {
                return Promise.reject(new Error(err));
            }
        } else {
            return Promise.reject(new Error(`no connection open for ${database}`));
        }
    }
    
}
```


- follow the capacitor build process

```bash
npx cap sync
npm run build
npx cap copy web
ionic serve
```

that is it.

## Ionic/Vue App

- Nothing to copy: see [Serving the worker and the wasm](#serving-the-worker-and-the-wasm).

- For databases in the `public/assets/databases` folder if any, you have to create a `databases.json` file which includes only the non-encrypted database's names

```json
{
  "databaseList" : [
    "YOUR_DB1.db",
    "YOUR_DB2.db",
    ...
  ]
}
```

- open the `main.ts` file and add the following 

```js
...
import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { useState } from '@/composables/state';


...
window.addEventListener('DOMContentLoaded', async () => {
  const platform = Capacitor.getPlatform();
  const sqlite: SQLiteConnection = new SQLiteConnection(CapacitorSQLite)

  const app = createApp(App)
    .use(IonicVue)
    .use(router);

  /* SQLite Global Variables*/

  // Only if you want to use the onProgressImport/Export events
  const [jsonListeners, setJsonListeners] = useState(false);
  const [isModal, setIsModal] = useState(false);
  const [message, setMessage] = useState("");
  app.config.globalProperties.$isModalOpen = {isModal: isModal, setIsModal: setIsModal};
  app.config.globalProperties.$isJsonListeners = {jsonListeners: jsonListeners, setJsonListeners: setJsonListeners};
  app.config.globalProperties.$messageContent = {message: message, setMessage: setMessage};

  //  Existing Connections Store
  const [existConn, setExistConn] = useState(false);
  app.config.globalProperties.$existingConn = {existConn: existConn, setExistConn: setExistConn};

  try {
    if(platform === "web") {
      // Initialize the Web store
      await sqlite.initWebStore();
    }
    // here you can initialize some database schema if required

    // example: database creation with standard SQLite statements 
    const ret = await sqlite.checkConnectionsConsistency();
    const isConn = (await sqlite.isConnection("db_tab3")).result;
    let db: SQLiteDBConnection
    if (ret.result && isConn) {
      db = await sqlite.retrieveConnection("db_tab3");
    } else {
      db = await sqlite.createConnection("db_tab3", false, "no-encryption", 1);
    }
    await db.open();
    const query = `
    CREATE TABLE IF NOT EXISTS test (
      id INTEGER PRIMARY KEY NOT NULL,
      name TEXT NOT NULL
    );
    `
    const res = await db.execute(query);
    if(res.changes && res.changes.changes && res.changes.changes < 0) {
      throw new Error(`Error: execute failed`);
    }
    await sqlite.closeConnection("db_tab3");

    // example: database creation from importFromJson 
    const schemaToImport179 = {
        database: 'db-issue179',
        version: 1,
        encrypted: false,
        mode: 'full',
        tables: [
          {
            name: 'album',
            schema: [
                { column: 'albumartist', value: 'TEXT NOT NULL' },
                { column: 'albumname', value: 'TEXT NOT NULL' },
                { column: 'albumcover', value: 'BINARY' },
                { column: 'last_modified', value: 'INTEGER' },
                { constraint: 'PK_albumartist_albumname', value: 'PRIMARY KEY (albumartist,albumname)'},
            ],
            indexes: [
                { name: 'index_album_on_albumartist_albumname', value: 'albumartist,albumname' },
                { name: 'index_album_on_last_modified', value: 'last_modified DESC' },
            ],
          },
          {
            name: 'song',
            schema: [
                { column: 'songid', value: 'INTEGER PRIMARY KEY NOT NULL' },
                { column: 'songartist', value: 'TEXT NOT NULL' },
                { column: 'songalbum', value: 'TEXT NOT NULL' },
                { column: 'songname', value: 'TEXT NOT NULL' },
                { column: 'last_modified', value: 'INTEGER' },
                {
                foreignkey: 'songartist,songalbum',
                value: 'REFERENCES album(albumartist,albumname)',
                },
            ],
            indexes: [
                { name: 'index_song_on_songartist_songalbum', value: 'songartist,songalbum' },
                {
                name: 'index_song_on_last_modified',
                value: 'last_modified DESC',
                },
            ],
          },
        ],
    };
    const result = await sqlite.isJsonValid(JSON.stringify(schemaToImport179));
    if(!result.result) {
      throw new Error(`isJsonValid: "schemaToImport179" is not valid`);
    }
    // full import
    const resJson = await sqlite.importFromJson(JSON.stringify(schemaToImport179));    
    if(resJson.changes && resJson.changes.changes && resJson.changes.changes < 0) {
      throw new Error(`importFromJson: "full" failed`);
    }

    ...

    router.isReady().then(() => {
      app.mount('#app');
    });
  } catch (err) {
    console.log(`Error: ${err}`);
    throw new Error(`Error: ${err}`)
  }
});

```

- open the `App.vue` file

```js
<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import { defineComponent, getCurrentInstance} from 'vue';
import { useSQLite} from 'vue-sqlite-hook/dist';

export default defineComponent({
  name: 'App',
  components: {
    IonApp,
    IonRouterOutlet,
  },
  setup() {
    const app = getCurrentInstance();
    const isModalOpen = app?.appContext.config.globalProperties.$isModalOpen;
    const contentMessage = app?.appContext.config.globalProperties.$messageContent;
    const jsonListeners = app?.appContext.config.globalProperties.$isJsonListeners;
      const onProgressImport = async (progress: string) => {
        if(jsonListeners.jsonListeners.value) {
          if(!isModalOpen.isModal.value) isModalOpen.setIsModal(true);
          contentMessage.setMessage(
              contentMessage.message.value.concat(`${progress}\n`));
        }
      }
      const onProgressExport = async (progress: string) => {
        if(jsonListeners.jsonListeners.value) {
          if(!isModalOpen.isModal.value) isModalOpen.setIsModal(true);
          contentMessage.setMessage(
            contentMessage.message.value.concat(`${progress}\n`));
        }
      }
      if( app != null) { 
        // !!!!! if you do not want to use the progress events !!!!!
        // since vue-sqlite-hook 2.1.1
        // app.appContext.config.globalProperties.$sqlite = useSQLite()
        // before
        // app.appContext.config.globalProperties.$sqlite = useSQLite({})
        // !!!!!                                               !!!!!
        app.appContext.config.globalProperties.$sqlite = useSQLite({
          onProgressImport,
          onProgressExport
        });
      }
    return;
  }
});
</script>
```

- open a component `YOUR_COMPONENT.vue` file

```js
<template>
    <div id="no-encryption-container">
        <div v-if="showSpinner">
            <br>
            <LoadingSpinner />
            <div>
                <span class="spinner">Running tests ...</span>
            </div>
        </div>
        <div v-else id="log">
            <pre>
                <p>{{log}}</p>
            </pre>
            <div v-if="errMess.length > 0">
                <p>{{errMess}}</p>}
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, getCurrentInstance } from 'vue';
import { createTablesNoEncryption, importTwoUsers,
  dropTablesTablesNoEncryption } from '@/utils/utils-db-no-encryption';
import { useState } from '@/composables/state';
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import { SQLiteDBConnection, SQLiteHook } from 'vue-sqlite-hook/dist';
import { deleteDatabase } from '@/utils/utils-delete-db';
import { Dialog } from '@capacitor/dialog';

export default defineComponent({
    name: 'NoEncryptionTest',
    components: {
        LoadingSpinner
    },

    setup() {
        console.log('$$$ Start NoEncryptionTest setup $$$')
        const [showSpinner, setShowSpinner] = useState(true);
        const [log, setLog] = useState("");
        const app = getCurrentInstance()
        const sqlite: SQLiteHook = app?.appContext.config.globalProperties.$sqlite;
        let errMess = "";
        const showAlert = async (message: string) => {
            await Dialog.alert({
            title: 'Error Dialog',
            message: message,
            });
        };
        const noEncryptionTest = async (): Promise<boolean>  => {
            try {
                console.log(' Starting testDatabaseNoEncryption')
                setLog(log.value
                    .concat("* Starting testDatabaseNoEncryption *\n"));
                // test the plugin with echo
                let res: any = await sqlite.echo("Hello from echo");
                if(res.value !== "Hello from echo"){
                    errMess = `Echo not returning "Hello from echo"`;
                    return false;
                }
                console.log(`after echo ${JSON.stringify(res)}`);
                setLog(log.value.concat("> Echo successful\n"));
                // create a connection for NoEncryption
                const db: SQLiteDBConnection = await sqlite.createConnection("NoEncryption");
                setLog(log.value.concat("> createConnection " +
                                            " 'NoEncryption' successful\n"));
                console.log("after createConnection")
                // check if the databases exist 
                // and delete it for multiple successive tests
                await deleteDatabase(db);         
                // open NoEncryption database
                await db.open();
                setLog(log.value.concat("> open 'NoEncryption' successful\n"));
                // Drop tables if exists
                res = await db.execute(dropTablesTablesNoEncryption);
                if(res.changes.changes !== 0 &&
                            res.changes.changes !== 1){
                    errMess = `Execute dropTablesTablesNoEncryption changes < 0`;
                    return false;
                } 
                setLog(log.value.concat(" Execute1 successful\n"));
                
                // Create tables
                res = await db.execute(createTablesNoEncryption);
                if (res.changes.changes < 0) {
                    errMess = `Execute createTablesNoEncryption changes < 0`;
                    return false;
                }
                setLog(log.value.concat(" Execute2 successful\n"));
                // Insert two users with execute method
                res = await db.execute(importTwoUsers);
                if (res.changes.changes !== 2) {
                    errMess = `Execute importTwoUsers changes != 2`;
                    return false;
                }
                setLog(log.value.concat(" Execute3 successful\n"));
                // Select all Users
                res = await db.query("SELECT * FROM users");
                if(res.values.length !== 2 ||
                res.values[0].name !== "Whiteley" ||
                            res.values[1].name !== "Jones") {
                    errMess = `Query not returning 2 values`;
                    return false;
                }
                setLog(log.value.concat(" Select1 successful\n"));
                // add one user with statement and values              
                let sqlcmd = "INSERT INTO users (name,email,age) VALUES (?,?,?)";
                let values: Array<any>  = ["Simpson","Simpson@example.com",69];
                res = await db.run(sqlcmd,values);
                if(res.changes.changes !== 1 ||
                                res.changes.lastId !== 3) {
                    errMess = `Run lastId != 3`;
                    return false;
                }
                setLog(log.value.concat(" Run1 successful\n"));
                // add one user with statement              
                sqlcmd = `INSERT INTO users (name,email,age) VALUES `+
                                `("Brown","Brown@example.com",15)`;
                res = await db.run(sqlcmd);
                if(res.changes.changes !== 1 ||
                            res.changes.lastId !== 4) {
                    errMess = `Run lastId != 4`;
                    return false;
                }
                setLog(log.value.concat(" Run2 successful\n"));
                // Select all Users
                res = await db.query("SELECT * FROM users");
                if(res.values.length !== 4) {
                    errMess = `Query not returning 4 values`;
                    return false;
                }
                setLog(log.value.concat(" Select2 successful\n"));
                // Select Users with age > 35
                sqlcmd = "SELECT name,email,age FROM users WHERE age > ?";
                values = ["35"];
                res = await db.query(sqlcmd,values);
                if(res.values.length !== 2) {
                    errMess = `Query > 35 not returning 2 values`;
                    return false;
                }
                setLog(log.value
                        .concat(" Select with filter on age successful\n"));
                // Close Connection NoEncryption        
                await sqlite.closeConnection("NoEncryption"); 
                        
                setLog(log.value
                    .concat("* Ending testDatabaseNoEncryption *\n"));
                return true;
            } catch (err) {
                errMess = `${err.message}`;
                return false;
            }
        };
        
        onMounted(async () => {
            // Running the test
            console.log('$$$ Start NoEncryptionTest on Mounted $$$')
            const retNoEncryption: boolean = await noEncryptionTest();
            console.log(`retNoEncryption ${retNoEncryption}`);
            setShowSpinner(false);
            if(!retNoEncryption) {
                setLog(log.value
                    .concat("* testDatabaseNoEncryption failed *\n"));
                setLog(log.value
                        .concat("\n* The set of tests failed *\n"));
                await showAlert(errMess);
            } else {
                setLog(log.value
                    .concat("\n* The set of tests was successful *\n"));
            }
            console.log('$$$ End NoEncryptionTest on Mounted $$$')

        });
        console.log('$$$ End NoEncryptionTest setup $$$')

        return { log, showSpinner, errMess };
    },
});
</script>
```

- follow the capacitor build process

```bash
npx cap sync
npm run build
npx cap copy web
npm run serve
```

that is it.

## Ionic/React App

- Nothing to copy: see [Serving the worker and the wasm](#serving-the-worker-and-the-wasm).

- For databases in the `public/assets/databases` folder if any, you have to create a `databases.json` file which includes only the non-encrypted database's names

```json
{
  "databaseList" : [
    "YOUR_DB1.db",
    "YOUR_DB2.db",
    ...
  ]
}
```

- open the `index.tsx` file and add the following 

There is no global JSX augmentation to write any more: with no custom element, TypeScript has
nothing extra to be taught.

```ts
...
import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

window.addEventListener('DOMContentLoaded', async () => {
  const platform = Capacitor.getPlatform();
  const sqlite: SQLiteConnection = new SQLiteConnection(CapacitorSQLite)
  try {
    if(platform === "web") {
      // initialize the web store
      await sqlite.initWebStore();
    }
    // initialize some database schema if needed
    const ret = await sqlite.checkConnectionsConsistency();
    const isConn = (await sqlite.isConnection("db_issue10")).result;
    var db: SQLiteDBConnection
    if (ret.result && isConn) {
      db = await sqlite.retrieveConnection("db_issue10");
    } else {
      db = await sqlite.createConnection("db_issue10", false, "no-encryption", 1);
    }
    await db.open();
    let query = `
    CREATE TABLE IF NOT EXISTS test (
      id INTEGER PRIMARY KEY NOT NULL,
      name TEXT NOT NULL
    );
    `
    const res: any = await db.execute(query);
    await db.close();
     await sqlite.closeConnection("db_issue10");
    
    // launch the React App
    ReactDOM.render(
      <React.StrictMode>
        <App /> 
      </React.StrictMode>,
      document.getElementById('root')
    );

    // If you want your app to work offline and load faster, you can change
    // unregister() to register() below. Note this comes with some pitfalls.
    // Learn more about service workers: https://bit.ly/CRA-PWA
    serviceWorker.unregister();

  } catch (err) {
    console.log(`Error: ${err}`);
    throw new Error(`Error: ${err}`)
  }

});
```

- open the `App.tsx` file 

```ts
import React, { useState, useRef }  from 'react';
import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { ellipse, square, triangle } from 'ionicons/icons';
import Tab1 from './pages/Tab1';
import Tab2 from './pages/Tab2';
import Tab3 from './pages/Tab3';
import { useSQLite } from 'react-sqlite-hook/dist';
import ModalJsonMessages from './components/ModalJsonMessages';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';


// Singleton SQLite Hook
export let sqlite: any;
// Existing Connections Store
export let existingConn: any;
// Is Json Listeners used
export let isJsonListeners: any;

const App: React.FC = () => {
  const [existConn, setExistConn] = useState(false);
  existingConn = {existConn: existConn, setExistConn: setExistConn};
  const [jsonListeners, setJsonListeners] = useState(false);
  isJsonListeners = {jsonListeners: jsonListeners, setJsonListeners: setJsonListeners};
  const [isModal,setIsModal] = useState(false);
  const message = useRef("");
  const onProgressImport = async (progress: string) => {
    if(isJsonListeners.jsonListeners) {
      if(!isModal) setIsModal(true);
      message.current = message.current.concat(`${progress}\n`);
    }
  }
  const onProgressExport = async (progress: string) => {
    if(isJsonListeners.jsonListeners) {
      if(!isModal) setIsModal(true);
      message.current = message.current.concat(`${progress}\n`);
    }
  }
  // !!!!! if you do not want to use the progress events !!!!!
  // since react-sqlite-hook 2.1.0
  // sqlite = useSQLite()
  // before
  // sqlite = useSQLite({})
  // !!!!!                                               !!!!!

  sqlite = useSQLite({
    onProgressImport,
    onProgressExport
  });
  const handleClose = () => {
    setIsModal(false);
    message.current = "";
  }
  
  return (
  <IonApp>
    <IonReactRouter>
        <IonTabs>
          <IonRouterOutlet>
            <Route path="/tab1" component={Tab1} exact={true} />
            <Route path="/tab2" component={Tab2} exact={true} />
            <Route path="/tab3" component={Tab3} />
            <Route path="/" render={() => <Redirect to="/tab1" />} exact={true} />
          </IonRouterOutlet>
          <IonTabBar slot="bottom">
            <IonTabButton tab="tab1" href="/tab1">
              <IonIcon icon={triangle} />
              <IonLabel>Tab 1</IonLabel>
            </IonTabButton>
            <IonTabButton tab="tab2" href="/tab2">
              <IonIcon icon={ellipse} />
              <IonLabel>Tab 2</IonLabel>
            </IonTabButton>
            <IonTabButton tab="tab3" href="/tab3">
              <IonIcon icon={square} />
              <IonLabel>Tab 3</IonLabel>
            </IonTabButton>
          </IonTabBar>
        </IonTabs>
    </IonReactRouter>
    { isModal
      ? <ModalJsonMessages close={handleClose} message={message.current}></ModalJsonMessages>
      : null
    }
  </IonApp>
  )
};

export default App;

```

- open a component `YOUR_COMPONENT.tsx` file

```ts
import React, { useState, useEffect, useRef } from 'react';
import './NoEncryption.css';
import { IonCard,IonCardContent } from '@ionic/react';
import { createTablesNoEncryption, importTwoUsers,
        dropTablesTablesNoEncryption } from '../Utils/noEncryptionUtils';
      
import { sqlite } from '../App';
import { SQLiteDBConnection} from 'react-sqlite-hook/dist';
import { deleteDatabase } from '../Utils/deleteDBUtil';     
import { Dialog } from '@capacitor/dialog';

const NoEncryption: React.FC = () => {
    const [log, setLog] = useState<string[]>([]);
    const errMess = useRef("");
    const showAlert = async (message: string) => {
        await Dialog.alert({
          title: 'Error Dialog',
          message: message,
        });
    };

    useEffect( () => {
        const testDatabaseNoEncryption = async (): Promise<Boolean>  => {
            setLog((log) => log.concat("* Starting testDatabaseNoEncryption *\n"));
            try {
                // test the plugin with echo
                let res: any = await sqlite.echo("Hello from echo");
                if(res.value !== "Hello from echo"){
                    errMess.current = `Echo not returning "Hello from echo"`;
                    return false;
                }
                setLog((log) => log.concat("> Echo successful\n"));
                // create a connection for NoEncryption
                let db: SQLiteDBConnection = await sqlite.createConnection("NoEncryption");
                // check if the databases exist 
                // and delete it for multiple successive tests
                await deleteDatabase(db);         
                // open NoEncryption
                await db.open();
                setLog((log) => log.concat("> open 'NoEncryption' successful\n"));

                // Drop tables if exists
                res = await db.execute(dropTablesTablesNoEncryption);
                if(res.changes.changes !== 0 &&
                            res.changes.changes !== 1){
                    errMess.current = `Execute dropTablesTablesNoEncryption changes < 0`;
                    return false;
                } 
                setLog((log) => log.concat(" Execute1 successful\n"));
                
                // Create tables
                res = await db.execute(createTablesNoEncryption);
                if (res.changes.changes < 0) {
                    errMess.current = `Execute createTablesNoEncryption changes < 0`;
                    return false;
                }
                setLog((log) => log.concat(" Execute2 successful\n"));

                // Insert two users with execute method
                res = await db.execute(importTwoUsers);
                if (res.changes.changes !== 2) {
                    errMess.current = `Execute importTwoUsers changes != 2`;
                    return false;
                }
                setLog((log) => log.concat(" Execute3 successful\n"));

                // Select all Users
                res = await db.query("SELECT * FROM users");
                if(res.values.length !== 2 ||
                res.values[0].name !== "Whiteley" ||
                            res.values[1].name !== "Jones") {
                    errMess.current = `Query not returning 2 values`;
                    return false;
                }
                setLog((log) => log.concat(" Select1 successful\n"));

                // add one user with statement and values              
                let sqlcmd = "INSERT INTO users (name,email,age) VALUES (?,?,?)";
                let values: Array<any>  = ["Simpson","Simpson@example.com",69];
                res = await db.run(sqlcmd,values);
                if(res.changes.changes !== 1 ||
                                res.changes.lastId !== 3) {
                    errMess.current = `Run lastId != 3`;
                    return false;
                }
                setLog((log) => log.concat(" Run1 successful\n"));

                // add one user with statement              
                sqlcmd = `INSERT INTO users (name,email,age) VALUES `+
                                `("Brown","Brown@example.com",15)`;
                res = await db.run(sqlcmd);
                if(res.changes.changes !== 1 ||
                            res.changes.lastId !== 4) {
                    errMess.current = `Run lastId != 4`;
                    return false;
                }
                setLog((log) => log.concat(" Run2 successful\n"));

                // Select all Users
                res = await db.query("SELECT * FROM users");
                if(res.values.length !== 4) {
                    errMess.current = `Query not returning 4 values`;
                    return false;
                }
                setLog((log) => log.concat(" Select2 successful\n"));

                // Select Users with age > 35
                sqlcmd = "SELECT name,email,age FROM users WHERE age > ?";
                values = ["35"];
                res = await db.query(sqlcmd,values);
                if(res.values.length !== 2) {
                    errMess.current = `Query > 35 not returning 2 values`;
                    return false;
                }
                setLog((log) => log
                        .concat(" Select with filter on age successful\n"));

                // Close Connection NoEncryption        
                await sqlite.closeConnection("NoEncryption"); 
                        
                return true;
            } catch (err) {
                errMess.current = `${err.message}`;
                return false;
            }
        }
        if(sqlite.isAvailable) {
            testDatabaseNoEncryption().then(async res => {
                if(res) {    
                    setLog((log) => log
                        .concat("\n* The set of tests was successful *\n"));
                } else {
                    setLog((log) => log
                        .concat("\n* The set of tests failed *\n"));
                    await showAlert(errMess.current);
                }
            });
        } else {
            sqlite.getPlatform().then((ret: { platform: string; })  =>  {
                setLog((log) => log.concat("\n* Not available for " + 
                                    ret.platform + " platform *\n"));
            });         
        }
         
      }, [errMess]);   
    
      
  return (
        <IonCard className="container-noencryption">
            <IonCardContent>
                <pre>
                    <p>{log}</p>
                </pre>
                {errMess.current.length > 0 && <p>{errMess.current}</p>}
            </IonCardContent>
        </IonCard>
  );
};

export default NoEncryption;

```

- follow the capacitor build process

```bash
npx cap sync
npm run build
npx cap copy web
npm run start
```

that is it.
    

    
## Troubleshooting

* **`initWebStore()` rejects with a message about another tab or window.** The store is
  single-owner per origin: OPFS access handles cannot be shared, so a second tab is refused
  rather than being handed an empty database on top of your real data. Close the other tab. In
  development, remember that a stale tab or a detached DevTools window still counts as a tab.

* **`initWebStore()` rejects quoting `Unexpected token '<'`.** The worker URL 404s and the server
  answered with your application's HTML, so this is a bundler problem and not a browser one, on
  any browser. See [Serving the worker and the wasm](#serving-the-worker-and-the-wasm); with Vite
  it is the expected default. The error the plugin raises says the same thing and carries the
  code `WORKER_LOAD_FAILED`.

* **`initWebStore()` rejects with `UNSUPPORTED_ENGINE` and some other `SyntaxError`.**
  The browser is below the engine floor described under
  [Requirements and browser support](#requirements-and-browser-support). This is not something the
  plugin falls back from, and lowering your app's build target will not help: the syntax that
  fails to parse belongs to `@sqlite.org/sqlite-wasm` itself.

* **`sqlite3.wasm` cannot be found (a 404 in the network panel).** The worker looks for it as its
  own sibling. Either put it next to the worker or point at it with
  `setSqliteWebOptions({ wasmUrl })` from
  [Serving the worker and the wasm](#serving-the-worker-and-the-wasm).

* **Data disappears between reloads.** You are almost certainly on tier 2 and never reached a
  flush point. Call `saveToStore(database)` after your writes, or `closeConnection`. To confirm
  which tier you are on, look for the databases: tier 1 puts them in the Origin Private File
  System, tier 2 in IndexedDB under `capacitor-sqlite-store`.

* **`JSON.stringify` throws `TypeError: Do not know how to serialize a BigInt`.** A column holds
  an integer above 2^53. See [Limitations](#limitations).

* **Databases from an older version of the app are missing.** Check the console for a migration
  warning. If the one-time import from `jeep-sqlite` failed, nothing was deleted: the legacy
  IndexedDB store `jeepSqliteStore` is still there and the warning names the database that could
  not be read.
