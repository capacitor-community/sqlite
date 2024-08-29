## CAPACITOR 4 (Master)

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

