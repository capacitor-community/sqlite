## CAPACITOR 8 (Master)

🚨 Release 8.2.0 web only ->> 🚨

  iOS, Android and Electron are unchanged in this release. Everything below concerns the Web
  platform only.

  The Web plugin is now implemented on `@sqlite.org/sqlite-wasm`, the official SQLite wasm build,
  running in a dedicated Worker that ships with the plugin. It replaces `jeep-sqlite`, `sql.js`
  and `localforage`, which are no longer dependencies of anything here.

  There are two durability tiers, chosen automatically by `initWebStore()`:

   - tier 1, databases are real files in the browser's `Origin Private File System` through the
     `opfs-sahpool` VFS. No COOP/COEP headers and no `SharedArrayBuffer` are required, so it works
     inside Capacitor WebViews and on ordinary hosting. Every committed write is durable.
   - tier 2, the automatic fallback for browsers without OPFS sync access handles: databases are
     opened `:memory:` and their whole-file image is written to IndexedDB, which is the model
     jeep-sqlite used everywhere.

  `initWebStore` is still `MANDATORY` and is still called exactly as before. What must go is the
  element bootstrap that used to surround it, first documented in release 3.2.3-1 below. Replace

  ```js
  if(platform === "web") {
    await customElements.whenDefined('jeep-sqlite');
    const jeepSqliteEl = document.querySelector('jeep-sqlite');
    if(jeepSqliteEl != null) {
      await sqlite.initWebStore();
    }
  }
  ```

  with

  ```js
  if(platform === "web") {
    await sqlite.initWebStore();
  }
  ```

  and delete the `jeep-sqlite` dependency, the `defineCustomElements`/`applyPolyfills` import, the
  `<jeep-sqlite>` element from your templates and any script that copied `sql-wasm.wasm` into your
  assets folder. The worker and `sqlite3.wasm` ship inside the package.

  `saveToStore` is also restated: it is a no-op on tier 1, where the data is already on disk, and
  the real flush of the database image to IndexedDB on tier 2. Calling it after a batch of writes
  remains the portable pattern. The `<jeep-sqlite>` `autosave` attribute is gone with the element.

  Existing data is migrated for you. The first `initWebStore()` after upgrading reads the old
  `jeepSqliteStore` IndexedDB store, imports every database into the active tier, verifies each
  one with `PRAGMA integrity_check`, and only then retires the legacy store. If anything fails,
  nothing is deleted and a warning naming the database is written to the console.

  Two things happen for you, once each, at `initWebStore`:

   - Databases left in the IndexedDB fallback store by an older browser are moved into OPFS as
     soon as the browser supports it. Without that an engine update, which is exactly what a
     tier 2 user is waiting for, would leave them looking at an empty store.
   - Databases from the previous `jeep-sqlite` store are imported, as described above.

  Under Capacitor native the store now follows the app in and out of the background: every
  connection is closed and the VFS paused before the OS suspends the app, then reopened on
  return, because WKWebView invalidates OPFS access handles across a suspension. If the gentle
  path cannot run, the worker is restarted and the connections reopened from a fresh one.
  `pauseWebStore()`, `resumeWebStore()` and `restartWebStore()` are available if you would rather
  drive it from `App.appStateChange` yourself.

  Four behaviour changes worth knowing:

   - Foreign keys are enforced. `PRAGMA foreign_keys` is set ON at open, as it already was on
     every other platform of this plugin. A schema that was quietly violating its own constraints
     on the web will start saying so.
   - A soft delete now follows foreign keys. When a database participates in sync, deleting a
     parent applies each referencing constraint's `ON DELETE` action to the children, and to
     their children, so an export no longer tells the server a parent is gone while reporting its
     children live.

   - Read-only connections (`readonly: true`) now work on Web.
   - Integers above 2^53 come back as `BigInt` rather than a silently truncated number.
     `JSON.stringify` throws on those; `exportToJson` writes them as decimal strings.
   - A failed upgrade now restores the pre-upgrade database and rejects, instead of handing back
     a working connection at the old version with no signal that the migration failed.

  Two new limits, both loud rather than silent:

   - Minimum browser versions are Chrome/Android WebView 80, Safari 14, Firefox 74. Below that the
     plugin does not load at all.
   - Only one tab per origin may own the store; a second tab gets an explicit error.

  Encryption is still not supported on Web.

  See [Web Usage](https://github.com/capacitor-community/sqlite/blob/master/docs/Web-Usage.md).

🚨 Release 8.2.0 <<- 🚨

## CAPACITOR 4

🚨 Release 4.0.1 all platforms ->> 🚨

  As no any issues where opened against version 4.0.0-1 using Capacitor 4,
  Developers can now install it as normal

  ```
  npm install @capacitor-community/sqlite@latest
  ```  

🚨 Release 4.0.1 <<- 🚨

🚨 Release 4.0.0-1 all platforms ->> 🚨
  This is a tentative of implementing @Capacitor/core@4.0.1 proposed by rdlabo (Masahiko Sakakibara). 
  For those who want to try it do
  ```
  npm install @capacitor-community/sqlite@next
  ```
  Revert quickly any issue by clearly mentionning V4 in the title of the issue.

  Thanks for your help in testing

🚨 Release 4.0.0-1 <<- 🚨

## CAPACITOR 3 (v3.7.0)

🚨 Release 3.4.3-3 all platforms ->> 🚨

The main change is related to the delete table's rows when a synchronization table exists as well as a last_mofidied table's column, allowing for database synchronization of the local database with a remote server database.

- All existing triggers to YOUR_TABLE_NAME_trigger_last_modified must be modified as follows
  ```
  CREATE TRIGGER YOUR_TABLE_NAME_trigger_last_modified
    AFTER UPDATE ON YOUR_TABLE_NAME
    FOR EACH ROW WHEN NEW.last_modified < OLD.last_modified
    BEGIN
        UPDATE YOUR_TABLE_NAME SET last_modified= (strftime('%s', 'now')) WHERE id=OLD.id;
    END;
  ```
- an new column `sql_deleted` must be added to each of your tables as
  ```
  sql_deleted BOOLEAN DEFAULT 0 CHECK (sql_deleted IN (0, 1))
  ```
  This column will be autommatically set to 1 when you will use a `DELETE FROM ...` sql statement in the `execute`, `run` or `executeSet` methods.

- In the JSON object that you provide to `importFromJson`, all the deleted rows in your remote server database's tables must have the `sql_deleted` column set to 1. This will indicate to the import process to physically delete the corresponding rows in your local database. All the others rows must have the `sql_deleted` column set to 0. 

- In the JSON object outputs by the `exportToJson`, all the deleted rows in your local database have got the `sql_deleted` column set to 1 to help in your synchronization management process with the remote server database. A system `last_exported_date` is automatically saved in the synchronization table at the start of the export process flow.

- On successful completion of your synchronization management process with the remote server database, you must 
  - Set a new synchronization date (as `(new Date()).toISOString()`) with the `setSyncDate` method.
  - Execute the `deleteExportedRows` method which physically deletes all table's rows having 1 as value for the `sql_deleted` column prior to the `last_exported_date` in your local database.

An example of using this new feature is given in [solidjs-vite-sqlite-app](https://github.com/jepiqueau/capacitor-solid-sqlite). It has been used to test the validity of the implementation.


🚨 Release 3.4.3-3 <<- 🚨

🚨 Release 3.4.2-4 ->> 🚨
!!!! DO NOT USE IT !!!!
🚨 Release 3.4.2-4 <<- 🚨

🚨 Since release 3.4.2-3 ->> 🚨

 - **overwrite** boolean parameter has been added to the Json Object (default false) 
   - `true` : delete the physically the database whatever the version is.
   - `false`: 
      - re-importing a database with the same `version` number will do nothing, keeping the existing database and will return `changes = 0`
      - re-importing a database with a lower `version` number will throw an error `ImportFromJson: Cannot import a version lower than `

 - During an import in `full` mode the `Foreign Key` constraint has been turn off before dropping the tables and turn back on after

🚨 Since release 3.4.2-3 <<- 🚨
🚨 Since release 3.4.1 ->> 🚨
  Databases location for Electron can be set in `the config.config.ts` as followed:

  - for sharing databases between users:

    ``` 
    plugins: {
      CapacitorSQLite: {
        electronMacLocation: "/YOUR_DATABASES_PATH",
        electronWindowsLocation: "C:\\ProgramData\\CapacitorDatabases",
        electronLinuxLocation: "/home/CapacitorDatabases"
      }
    }
    ``` 

  - for only the user in its Home folder

    ``` 
    Plugins: {
      CapacitorSQLite: {
        electronMacLocation: "Databases",
        electronWindowsLocation: "Databases",
        electronLinuxLocation: "Databases"
      }
    }
    ``` 

  For existing databases, YOU MUST COPY old databases to the new location
  You MUST remove the Electron folder and add it again with

  ``` 
  npx cap add @capacitor-community/electron
  npm run build 
  cd electron
  npm i --save sqlite3
  npm i --save @types:sqlite3
  npm run rebuild
  cd ..
  npx cap sync @capacitor-community/electron
  npm run build
  npx cap copy @capacitor-community/electron
  npx cap open @capacitor-community/electron
  ``` 
🚨 Since release 3.4.1 <<- 🚨

🚨 Since release 3.4.1-1 ->> 🚨

  - add iosIsEncryption, androidIsEncryption in capacitor.config.ts
    When your application use only `non-encrypted databases` set those parameter to false then iOS KeyChain & Android MasterKey are not defined.
    
🚨 Since release 3.4.1-1 <<- 🚨

🚨 Since release 3.4.0-2 ->> 🚨 

- iOS & Android only
  Adding biometric FaceID/TouchID to secure the pass phrase in the Keychain/SharedPreferences stores. see:
   [Biometric_Authentication](https://github.com/capacitor-community/sqlite/blob/master/docs/Biometric-Authentication.md)

- iOS only
  Fix identical pass phrase stored in the Keychain for differents applications using the plugin by adding an application prefix to the Keychain account.
  Before the account `"CapacitorSQLitePlugin"` was used and was the same for all applications.
  Now by adding `iosKeychainPrefix: 'YOUR_APP_NAME'`in the `capacitor.config.ts` of your application,
  the account will be `"YOUR_APP_NAME_CapacitorSQLitePlugin"`
  If you were having a pass phrase stored, first modify the `capacitor.config.ts` and then run the command `isSecretStored` which will manage the upgrade of the Keychain account. 
🚨 Since release 3.4.0-2 <<- 🚨

🚨 Since release 3.3.3-2 ->> 🚨

  - iOS only
    Support for a database location not visible to iTunes and backed up to iCloud.
    For this you must add to the `const config: CapacitorConfig` of the `capacitor.config.ts` file of your application the following:
    ```ts
      plugins: {
        CapacitorSQLite: {
          "iosDatabaseLocation": "Library/CapacitorDatabase"
        }
      }
    ``` 
    Pre-existing databases from the `Documents` folder will be moved to the new folder `Library/CapacitorDatabase` and your application will work as before.
    If you do not modify the `capacitor.config.ts` file of your application the databases will still reside in the `Documents` folder

🚨 Since release 3.3.3-2 <<- 🚨

🚨 Since release 3.2.5-2 ->> 🚨

  - support zip file in copyFromAssets method
  - add optional `overwrite` parameter (true/false) default to true

🚨 Since release 3.2.5-2 <<- 🚨

🚨 Since release 3.2.3-1 ->> 🚨

The `initWebStore` and `saveToStore` methods have been added to the Web platform.
 - The `initWebStore` has been added to fix the issue#172 and since then is `MANDATORY`
  ```js
  ...
  if(platform === "web") {
    await customElements.whenDefined('jeep-sqlite');
    const jeepSqliteEl = document.querySelector('jeep-sqlite');
    if(jeepSqliteEl != null) {
      await sqliteConnection.initWebStore()
      ...
    }
  }
  ...
  ```
 - the `saveToStore` allows to perform intermediate save of the database in case the browser needs to delete the cache.
 
🚨 Since release 3.2.3-1 <<- 🚨

🚨 Since release 3.2.2-2 ->> 🚨

The executeSet method accepts now no values, see below

```
const setIssue170: Array<capSQLiteSet>  = [
  { statement: "DROP TABLE IF EXISTS issue170", values: [] },
  { statement: "CREATE TABLE issue170 (src VARCHAR(255))", values: [] },
  { statement: "INSERT INTO issue170 (src) values (?)", values: ["google.com"] },
]
```

🚨 Since release 3.2.0-5 ->> 🚨

The Web plugin is now implemented based on the stencil companion `jeep-sqlite@0.0.7` which is using `sql.js@1.5.0` for database queries and `localeforage@1.9.0`for database persistency.

🚨 Since release 3.2.0-3 ->> 🚨

The Electron plugin is now based on `@capacitor-community/electron@4.0.3` thanks to the hard and heavy work from `Mike Summerfeldt IT-MikeS` 👏 🙏

🚨 Since release 3.2.0-2 ->> 🚨
🚨 !!! for Electron developper, the Electron plugin is back !!! 🚨

Based on `sqlite3`, so without encryption
The two listeners `sqliteImportProgressEvent` and `sqliteExportProgressEvent` are not available.

🚨 Since release 3.1.2 ->> 🚨

Thanks to Nirajhinge and Chris, an example of using the TypeORM driver in a Ionic/Vue app has been developed see `https://github.com/jepiqueau/vue-typeorm-app`. 

🚨 Since release 3.0.0-rc.2 ->> 🚨

Thanks to Chris, a driver to TypeORM is now available

🚨 Since release 3.0.0-beta.13 ->> 🚨

  - GlobalSQLite `secret` and  `newsecret` are deprecated

  - The user can now set its own secure secret (passphrase)

    - use `setEncryptionSecret` ONCE to migrate encrypted databases
      from `secret` to `secure stored secret`
    
    - use `changeEncryptionSecret` to change your `secure stored secret`

  - iOS used `KeyChain service` to store the `secret`

  - Android used `Encrypted SharedPreferences` to store the `secret`,
    the minimun sdk should be set to 23 (limitation from Google)

🚨 Since release 3.0.0-beta.13 ->> 🚨

🚨 Since release 3.0.0-beta.11 ->> 🚨

  - Checking of types has been removed in all methods of the plugin
    both iOS & Android. This has been achieved to allow the use of
    others RDBMS types. 
    The type checking is now under the responsability of the developers.

  - NULL values are now returned as null

  - values for the `query` method is now an Array of any.

  - option to disable `transaction` for the `execute`, `executeSet`, `run`.

🚨 Since release 3.0.0-beta.11 <<- 🚨


## REFACTOR (Move to branch 2.9.x)

The `2.9.x` is now 🛑 NOT MAINTAINED ANYMORE 🛑.

The refactor offers now (since `2.9.0-beta.1`) all the features that the previous was offering. It has been a quite heavy process, hoping that the developpers will take benefit from it.

The main reasons for it:

- multiple database connections
- db connector allowing for easy commands `db.open(), db.close, ...`
- improve the response time of the encrypted database by removing the internal open and close database for each sqlite query
- moving to the latest `androidx.sqlite.db.xxx`
- offering encryption for Electron platform by using `@journeyapps/sqlcipher` on MacOs, !!! NOT ON WINDOWS !!!
- cleaning and aligning the code between platforms
- allowing developers to develop `typeorm` or `spatialite` drivers.

This was discussed lengthly in issue#1 and issue#52

Refactor available for `Android`, `iOS` and `Electron` platforms.

The test has been achieved on:

- a [Ionic/Angular app](https://github.com/jepiqueau/angular-sqlite-app-starter/tree/refactor)

- a [Ionic/React app](https://github.com/jepiqueau/react-sqlite-app-starter/tree/refactor)

- a [Ionic/Vue app](https://github.com/jepiqueau/vue-sqlite-app-starter/tree/refactor)

Other frameworks will be tested later

- Stencil

## @INITIAL 🛑 (Move to branch 2.4.x)

The `2.4.x` is now 🛑 NOT MAINTAINED ANYMORE 🛑.

To install it

```bash
npm i --save @capacitor-community/sqlite@initial
```
The test has been achieved on:

- a [Ionic/Angular app](https://github.com/jepiqueau/angular-sqlite-app-starter/tree/2.4.x)

- a [Ionic/React app](https://github.com/jepiqueau/react-sqlite-app-starter/tree/2.4.x)

- a [Ionic/Vue app](https://github.com/jepiqueau/vue-sqlite-app-starter/tree/2.4.x)

