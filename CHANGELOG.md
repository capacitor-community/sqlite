# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [7.0.2](https://github.com/capacitor-community/sqlite/compare/v7.0.1...v7.0.2) (2025-10-12)


### Bug Fixes

* **android:** update sqlcipher-android dependency to version 4.10.0 ([#664](https://github.com/capacitor-community/sqlite/issues/664)) ([453b1ba](https://github.com/capacitor-community/sqlite/commit/453b1ba23401e5ecc579ad341b48adac297cbe16))

### [7.0.1](https://github.com/capacitor-community/sqlite/compare/v7.0.0...v7.0.1) (2025-07-02)


### Bug Fixes

* **android:** migrate from `android-database-sqlcipher` to `sqlcipher-android` ([#607](https://github.com/capacitor-community/sqlite/issues/607)) ([43c689b](https://github.com/capacitor-community/sqlite/commit/43c689bd51a94227f3dd8ea5121b0ce34f0989bd))

## [7.0.0](https://github.com/capacitor-community/sqlite/compare/v6.0.2...v7.0.0) (2025-01-31)


### ⚠ BREAKING CHANGES

* update to Capacitor 7 (#620)

### Features

* update to Capacitor 7 ([#620](https://github.com/capacitor-community/sqlite/issues/620)) ([a4ad7ee](https://github.com/capacitor-community/sqlite/commit/a4ad7eef09506e58b59b55e7c05302c991cd46bd))

### [6.0.2](https://github.com/capacitor-community/sqlite/compare/v6.0.1...v6.0.2) (2024-09-15)


### Bug Fixes

* **android:** update `androidx.room:room-compiler` to `2.6.1` ([#588](https://github.com/capacitor-community/sqlite/issues/588)) ([21c435a](https://github.com/capacitor-community/sqlite/commit/21c435aaa71582cfdcc0bf258fc4f8237f3df661))

## 6.0.1 (2024-06-14)

#### Bug Fixes

 - Fix For-in loop requires 'Archive?' to conform to 'Sequence'; did you mean to unwrap optional? issue565

## 6.0.0 (2024-06-12)


## 6.0.0-beta.2 (2024-06-12)

#### Bug Fixes

 - Fix Android Multi Row Statement does not suppress control characters ($) issue#562 

## 6.0.0-beta.1 (2024-06-12)

#### Chore

 - Update to @capacitor/core@6.1.0
 - Update to @capacitor/ios@6.1.0
 - Update to @capacitor/android@6.1.0
 - Update to @capacitor/cli@6.1.0
 - Update to jeep-sqlite@2.7.2

#### Bug Fixes
 
 - Add the fixes of 5.7.3


## 5.7.4 (2024-06-14)

#### Bug Fixes

 - Fix For-in loop requires 'Archive?' to conform to 'Sequence'; did you mean to unwrap optional? issue565

## 5.7.3 (2024-06-09)

#### Bug Fixes

 - Fix TypeError: Cannot read properties of undefined (reading 'lastId') issue#558
 - Fix exportToJson generate unusable export for table created with separate UNIQUE syntax. issue#561
 - Fix Multi Row Statement does not suppress control characters ($) issue#562

## 6.0.0-alpha.1 (2024-05-06)

#### Chore

 - Update to @capacitor/core@6.0.0
 - Update to @capacitor/ios@6.0.0
 - Update to @capacitor/android@6.0.0
 - Update to @capacitor/cli@6.0.0

## 5.7.3-3 (2024-04-28)

#### Bug Fixes

 - Fix ExecuteTransaction with values throws exception for statements performing no actual changes issue#544

 - Fix executeSet not inserting rows issue#547

 - Update TypeORM-Usage-From-5.6.0.md (PR#549 from SaintPepsi)
 
## 5.7.3-2 (2024-04-23)

#### Bug Fixes

 - Fix escape string in multi row statements values via DatabaseUtils issue#537 (PR from lasher23)
 - Fix(readme): missing closing code symbol issue#542 (PR from mirsella)
 - Fix Multiple Row Statement Values case insensitive issue#536
 - Fix delete useless semicolon issue#538 (PR#539 from lasher23)

## 5.7.3-1 (2024-04-22)

#### Chore

 - Update to @capacitor/core@5.7.3
 - Update to @capacitor/ios@5.7.3
 - Update to @capacitor/android@5.7.3
 - Update to @capacitor/cli@5.7.3
 - Update to jeep-sqlite@2.7.0

#### Bug Fixes

 - Fix GetFromHTTPRequest not working issue#534 (Android,iOS, Electron)


## 5.7.2 (2024-04-09)

#### Chore

 - Update to @capacitor/core@5.7.2
 - Update to @capacitor/ios@5.7.2
 - Update to @capacitor/android@5.7.2
 - Update to @capacitor/cli@5.7.2

#### Bug Fixes

 - Fix ionic7-angular-sqlite-app tutorial fails on v5.7.1 issue#533
 
## 5.7.1 (2024-04-03)

#### Chore

 - Update to @capacitor/core@5.7.1
 - Update to @capacitor/ios@5.7.1
 - Update to @capacitor/android@5.7.1
 - Update to @capacitor/cli@5.7.1

#### Bug Fixes

 - Fix Is this plugin still maintained in 2024? issue#529 
 
## 5.7.0 (2024-03-27)

#### Chore

 - Update to @capacitor/core@5.7.0
 - Update to @capacitor/ios@5.7.0
 - Update to @capacitor/android@5.7.0
 - Update to @capacitor/cli@5.7.0
 - Update to jeep-sqlite@2.6.2

#### Added Features

 - Add link to Web/Native vite-sveltekit-capacitor-sqlite in the README.md.


## 5.6.4 (2024-03-27)

#### Added Features

 - Add SQLite Commands Within the Plugin chapter in API.md doc.
 - Modify TypeORM-Usage-From-5.6.0.md
 - Modify addUpgradeStatement parameters of the ISQLiteConnection

#### Bug Fixes

 - Fix Calling run method with BEGIN statement throws StringOutOfBoundIndexException #526 (iOS, Android, Electron)

## 5.6.3 (2024-03-12)

#### Added Features

 - Add SQLite Transactions Documentation SQLiteTransaction.md

#### Bug Fixes

 - Fix Error in executeTransaction

## 5.6.2 (2024-03-07)

#### Added Features

 - Include examples of SQLite comments in the API.md documentation

#### Bug Fixes

 - Fix Error in README.md with install instructions issue#520
 - Fix Unable to run executeSet on SQL with -- comments issue#521

## 5.6.1 (2024-02-29)

#### Bug Fixes

 - Fix SQL query is converted to be compatible with SQL92 regardless of argument value of isSQL92 in query method when values argument is an empty array issue#519

## 5.6.1-4 (2024-02-27)

#### Bug Fixes

 - Fix importFromJson of binary blob not working (iOS, Android, Electron)

## 5.6.1-3 (2024-02-26)

#### Bug Fixes

 - Fix exportToJson not working (iOS) issue#513

## 5.6.1-2 (2024-02-25)

#### Bug Fixes

 - Fix BLOB binding issue in iOS #514

## 5.6.1-1 (2024-02-22)

#### Remove Features

 - Remove the ability to run `migrations:generate` with the TypeOrm Cli as the way it has been implemented works from some Frameworks but not with Angular were developers could not anymore build there apps. see issue#516 Update 5.6.0.

#### Bug Fixes

 - Fix Electron Platform SQL92 false generates invalid SQL query issue#518


## 5.6.0 (2024-02-17)

#### Chore

 - Update to @capacitor/core@5.6.0
 - Update to @capacitor/ios@5.6.0
 - Update to @capacitor/android@5.6.0
 - Update to @capacitor/cli@5.6.0
 - Update to jeep-sqlite@2.5.9

#### Added Features

 - Add the ability to run `migrations:generate` with the TypeOrm Cli
   outside the DOM Element to create the migrations files. Then the migrations are run inside the DOM Element to create and store the database in the DOM Element.
   For this add a script to the package.json file
   ```json
    "scripts": {
      ...

      "typeorm:migration:generate": "npx typeorm-ts-node-esm migration:generate src/PATH_TO_MIGRATIONS/YOUR_MIGRATION_NAME -d src/PATH_TO_YOUR_DATASOURCE"

   ```

 - Add TypeORM-Usage-From-5.6.0.md documentation
 
#### Bug Fixes

 - Fix The jeep-sqlite element is not present in the DOM when trying to generate migration files via TypeOrm CLI issue#508

## 5.5.2 (2024-01-25)

#### Chore

 - Update to jeep-sqlite@2.5.8


#### Bug Fixes

 - Fix exportToJson getSchema PRIMARY
 - Fix allow exportToJson when mode equals "full" and no "sync_table"
 - Fix out of memory since 1.9.0 issue#509 by upgrading sql.js to release 1.10.2

## 5.5.1 (2024-01-22)

#### Bug Fixes

 - Fix exportToJson getSchema Exception issue#504
 - Fix returning is treated as a keyword in a string object discussion#503
 
## 5.5.1-4 (2023-12-30)

#### Bug Fixes

 - iOS Fix getDatabaseList & getMigratableDbList
 - Android Fix getDatabaseList & getMigratableDbList

## 5.5.1-3 (2023-12-29)

#### Bug Fixes

 - Android addSQLiteSuffix or moveDatabasesAndAddSuffix doesn't copy data inside the original database issue#497
 
## 5.5.1-2 (2023-12-21)

#### Chore

 - Update to jeep-sqlite@2.5.5

#### Bug Fixes

 - Android ImportFromJSON handle id as String in deletion statements issue#495  (PR#496 By mmouterde)

## 5.5.1-1 (2023-12-15)

#### Chore

 - Update to @capacitor/core@5.5.1
 - Update to @capacitor/ios@5.5.1
 - Update to @capacitor/android@5.5.1

#### Bug Fixes

 - Fix importFromJson on android fails to build SQL Statement with ' in values. issue#492
 
## 5.5.0 (2023-12-13)

#### Chore

 - Update to @capacitor/core@5.5.0
 - Update to @capacitor/ios@5.5.0
 - Update to @capacitor/android@5.5.0

#### Bug Fixes

 - Deprecate Ionic-Angular-Usage.md
 - Deprecate Ionic-React-Usage.md
 - Deprecate Ionic-Vue-Usage.md
 - Update Application's links in Readme.md
 - importFromJson on android fails to build SQL Statement with ' in values. issue#492
 
## 5.4.2-2 (2023-11-04)

 - Add nuxt3 kysely example PR#484 from DawidWetzler

## 5.4.2-1 (2023-10-17)

#### Chore

 - Update to @capacitor/core@5.4.1
 - Update to @capacitor/ios@5.4.1
 - Update to @capacitor/android@5.4.1

#### Bug Fixes

 - Android: optimize executeSet execution time 
 - Android: optimize importFromJson execution time

## 5.4.1 (2023-10-13)

#### Chore

 - Update to @capacitor/core@5.4.1
 - Update to @capacitor/ios@5.4.1
 - Update to @capacitor/android@5.4.1

#### Bug Fixes

 - Fix Two consecutive beginTransaction+commitTransaction calls results in an error on Android. issue#478

## 5.4.0 (2023-10-05)

#### Chore

 - Update to @capacitor/core@5.4.0
 - Update to @capacitor/ios@5.4.0
 - Update to @capacitor/android@5.4.0

#### Added Features

 - Add Electron decryptDatabase method

#### Bug Fixes

 - Fix Electron setEncryptSecret

## 5.2.5 (2023-09-28)

#### Bug Fixes

 - Fix Android pattern in extractColumnNames

## 5.2.4 (2023-09-28)

#### Bug Fixes

 - Fix Bug: deleteSQL: Did not find column names in the WHERE Statement issue#470 all platforms

## 5.2.3 (2023-09-03)

#### Chore

 - Update to @capacitor/core@5.2.3
 - Update to @capacitor/ios@5.2.3
 - Update to @capacitor/android@5.2.3

#### Bug Fixes

 - Remove console.log in definition.ts

## 5.0.8 (2023-09-01)

#### Added Features

 - Add Tutorials Blog in README.md

#### Bug Fixes

 - Fix Cannot export encrypted database as plain JSON anymore issue#462

## 5.0.7 (2023-08-22)

#### Added Features

 - Add a paramater isSQL92 default to true in execute, executeSet, run and query methods for ELECTRON plugin ONLY. if set to false the statements you were using in sqlite3 based release will be converted to SQL92 statement. As this is time consuming, we will advise you to cereate SQL statement compliant to SQL92.

 - Add new methods `(beginTransaction,commitTransaction,rollbackTransaction,isTransactionActive)`, that let you control the transaction process flow. In that case you MUST set the transition to false in any method you call.

#### Bug Fixes

 - Fix Android DELETE From when FOREIGN KEYS and sql_deleted column issue#445.

 - Fix SQL92 compatibility issue #451

 - Modify `transaction` method to handle the new transaction process flow

 - fix Call stmt.run() for statement without return #457 PR from Guilherme Oliveira

## 5.0.7-2 (2023-08-10)

#### Bug Fixes

 - Fix Electron DELETE From when FOREIGN KEYS and sql_deleted column issue#445. Still to be fixed for Android
 
## 5.0.7-1 (2023-08-09)

#### Bug Fixes

 - Fix iOS & Web(jeep-sqlite@2.4.0) DELETE From when FOREIGN KEYS and sql_deleted column issue#445. Still to be fixed for Android and Electron
 - Add support for Math functions iOS issue#446

## 5.0.6 (2023-07-25)

#### Added Features

 - Export encrypted data when database is encrypted issue#227

## 5.0.5 (2023-07-14)

#### Added Features

 - insert/delete/update with returning discussion#435
 - add Returning.md documentation

## 5.0.5-2 (2023-07-03)

#### Bug Fixes

 - Electron fix encryption of unencrypted databases

## 5.0.5-1 (2023-07-01)

#### Chore

 - Update to @capacitor/core@5.0.5
 - Update to @capacitor/ios@5.0.5
 - Update to @capacitor/android@5.0.5

#### Bug Fixes

 - Electron fix encryption

## 5.0.4 (2023-06-29)

#### Removed Features

 - Electron Plugin: Remove `@journeyapps/sqlcipher` and `sqlite3` packages

#### Added Features

 - Electron Plugin: Add `better-sqlite3-multiple-ciphers` package
 - Electron Plugin: Add `electron-json-storage` package to store the passphrase for database encryption

## 5.0.3 (2023-06-16)

#### Added Features

 - Add method isInConfigEncryption and isDatabaseEncrypted for electron
 - Add electronIsEncryption in capacitor.config.ts
                            = true use @journeyapps/sqlcipher
                            = false use sqlite3

## 5.0.3-1 (2023-06-13)

#### Added Features

 - Add SQLiteBlob.md documentation

#### Bug Fixes

 - fix issue#426 for Android & iOS returning binary array
 - fix Cannot bind buffer in Android issue#428 for Android & iOS


## 5.0.2 (2023-06-07)

#### Bug Fixes

 - fix issue#426 for Android & iOS with base64 string

## 5.0.1 (2023-05-31)

#### Added Features
 - add Ionic react typeorm example PR#423 from Marcello Cosentino
 - add link to Ionic7-angular-sqlite-starter 

#### Bug Fixes

 - fix Readme.md file
 
## 5.0.0 (2023-05-24)

#### Chore

 - Update to @capacitor/core@5.0.4
 - Update to @capacitor/ios@5.0.4
 - Update to @capacitor/android@5.0.4
 
#### Added Features

 - Enable electron database encryption PR#342 from Clément Béligat

#### Bug Fixes

 - Fix Encrypted electron database issue#162
 
## 5.0.0-beta.2 (2023-05-08)

#### Chore

 - Update to @capacitor/core 5.0.0
 - Update to @capacitor/ios 5.0.0
 - Update to @capacitor/android 5.0.0

## 5.0.0-beta.1 (2023-04-12)

#### Bug Fixes

- Fix UtilsJson (Android} 

## 5.0.0-beta.0 (2023-04-08)

#### Chore

 - Update to @capacitor/core@5.0.0-beta.1
 - Update to @capacitor/ios@5.0.0-beta.1
 - Update to @capacitor/android@5.0.0-beta.1

## 4.8.0 (2023-05-24)

#### Added Features

 - Enable electron database encryption PR#342 from Clément Béligat

## 4.8.0-1 (2023-05-11)

#### Chore

 - Update to jeep-sqlite@2.3.4

#### Bug Fixes

 - Fix Database fails to open when browser window minimized issue#402

## 4.8.0-0 (2023-05-08)

#### Chore

 - Update to @capacitor/core 4.8.0
 - Update to @capacitor/ios 4.8.0
 - Update to @capacitor/android 4.8.0

#### Added Features

 - add SyntaxScanner-For-SQLite-Code.md PR#405 issue#400

#### Bug Fixes

 - Fix Ionic-React-Usage.md PR#403
 - Fix Data import where the ID is a UUID and sql_deleted = 1 issue#399

## 4.6.3 (2023-03-19)

#### Chore

 - Update to jeep-sqlite 2.3.1

#### Added Features

 - add getFromLocalDiskToStore and saveToLocalDisk methods (Web platform)
 - add unexpected behaviour docs PR #394 by folsze

## 4.6.3-4 (2023-03-12)

#### Bug Fixes

 - Remove logs in build (Web) issue#392
 
## 4.6.3-3 (2023-03-10)

#### Bug Fixes

- Fix Strip comment lines when using CapacitorSQLite.execute (Android} PR#387 by patdx
- Fix CapacitorSQLite.execute on Android does not support comments issue#386
- Add Comments within SQL statements in API.md

## 4.6.3-2 (2023-03-10)

#### Bug Fixes

 - Update Ionic-React-Usage.md PR#390 by eppineda
 - Fix Foreign Key Support on Web Version (jeep-sqlite) issue#385

## 4.6.3-1 (2023-02-26)

#### Chore

 - Update to @capacitor/core 4.6.3
 - Update to @capacitor/ios 4.6.3
 - Update to @capacitor/android 4.6.3

#### Bug Fixes

 - Update configure plugin section #381 by ws-rush
 - Add link to vite-vue-sqlite-app

## 4.6.2 (2023-02-24)

#### Chore

  - Update to jeep-sqlite@2.0.0 with @stencil/core@3.00
  - Update SQLCipher to 4.5.0 (iOS & Android only)
  - Update to androidx.security:security-crypto:1.1.0-alpha05 (should fix issue#321)

## 4.6.2-3 (2023-02-15)

#### Bug Fixes

 - Keep database version number after encrypting a database (iOS)

 - Encrypted Database isn't Encrypted when no Passphrase stored (iOS, Android) issue#375

## 4.6.2-2 (2023-02-11)

#### Added Features

 - add isDatabaseEncrypted, isInConfigEncryption, isInConfigBiometricAuth methods

## 4.6.2-1 (2023-02-10)

#### Chore

 - Update to @capacitor/core 4.6.2
 - Update to @capacitor/ios 4.6.2
 - Update to @capacitor/android 4.6.2

#### Bug Fixes

 - Failed to parse source map issue#374

## 4.6.1 (2023-02-03)

#### Added Features

 - add checkEncryptionSecret #issue-request#370.
 - add `ionic-angular-sqlite-starter`a new application starter for CRUD operations

#### Bug Fixes

 - fix contributors paragraph ending correctly (PR Micha-Richter)

## 4.6.1-2 (2023-01-15)

#### Bug Fixes

 - fix addUpgradeStatement all platforms

## 4.6.1-1 (2023-01-12)

#### Chore

 - Update to @capacitor/core 4.6.1
 - Update to @capacitor/ios 4.6.1
 - Update to @capacitor/android 4.6.1

#### Bug Fixes

 - fix(docs): use yarn add in favor of deprecated yarn install --save issue#362 (PR from Sirs0ri)
 - fix open readonly encrypted database (Android) issue#364 (PR from TheNovemberRain)
 - fix file deletion for windows (Electron) issue#367 (PR from tobiasmuecksch)
 - improve code in docs issue#368 (PR from fizdalf)


## 4.6.0 (2022-12-23)

#### Chore

 - Update to @capacitor/core 4.6.0
 - Update to @capacitor/ios 4.6.0
 - Update to @capacitor/android 4.6.0

#### Bug Fixes

 - Fix createNCConnection and closeNCConnection in Android

## 4.5.0 (2022-12-08)

#### Chore

 - Update to @capacitor/core 4.5.0
 - Update to @capacitor/ios 4.5.0
 - Update to @capacitor/android 4.5.0
 - Update to jeep-sqlite 1.6.9

#### Bug Fixes

 - Fix sortedKeys in onUpgrade Electron issue#353

## 4.2.2 (2022-10-18)

#### Chore

 - Update to @capacitor/core 4.2.0
 - Update to @capacitor/ios 4.2.0
 - Update to @capacitor/android 4.2.0

#### Bug Fixes

 - Fix Write-Ahead logging 
    - WAL journal_mode implemented for all platforms 
    - WAL2 journal_mode available only for iOS and Android (default)

## 4.2.2-1 (2022-10-13)

🚨 NOT TO BE USED 🚨

#### Bug Fixes

 - trial to fix Electron WAL2 concurrent access 

## 4.2.1 (2022-10-10)

#### Bug Fixes

 - fix Electron Windows file lock error issue#326 (PR from tobiasmuecksch)
 - fix Electron db.close() error reporting issue#329 (PR from tobiasmuecksch)
 - fix README for pnpm installation
 
## 4.2.0 (2022-10-07)

#### Chore

 - Update to @capacitor/core 4.1.0
 - Update to @capacitor/ios 4.1.0
 - Update to @capacitor/android 4.1.0

#### Added Features

 - add getFromHTTPRequest iOS and Android issue#316.

## 4.1.1 (2022-09-21)

#### Added Features

 - add getFromHTTPRequest Electron and Web only issue#316.

#### Bug Fixes

 - fix addUpgradeStatement doesn't create all versions when starting with an empty database issue#320 

## 4.1.0 (2022-09-17)

#### Added Features

 - add readonly mode to connection (Web) through the use of jeep-sqlite. 

#### Bug Fixes

 - Fix checkConnectionsConsistency for mode readwrite and readonly

## 4.1.0-8 (2022-09-14)

#### Added Features

 - add readonly mode to connection (Electron). So one read&write and one readonly connections could be opened on the same database.

## 4.1.0-7 (2022-09-12)

#### Added Features

 - add readonly mode to connection (iOS & Android only). So one read&write and one readonly connections could be opened on the same database.

## 4.1.0-6 (2022-09-07)

#### Added Features

 - Replace addUpgradeStatement with the new database incremental upgrade version. see new doc [IncrementalUpgradeDatabaseVersion](https://capacitorjs.com/docs/IncrementalUpgradeDatabaseVersion.md)

## 4.1.0-5 (2022-08-29)

#### Bug Fixes

 - Fix getAssetsDatabasesPath reading capacitor.config.ts (Electron)
 - Remove console.log statements (Electron)

## 4.1.0-4 (2022-08-29)

#### Bug Fixes

 - Redesign of the README.md

## 4.1.0-3 (2022-08-28)

#### Bug Fixes

 - Fix README.md

## 4.1.0-2 (2022-08-28)

#### Bug Fixes

 - Clean up the README.md

## 4.1.0-1 (2022-08-26)

#### Chore

 - Update to @capacitor/core 4.1.0
 - Update to @capacitor/ios 4.1.0
 - Update to @capacitor/android 4.1.0

#### Bug Fixes

 - Composite primary key - export/import problem
 
## 4.0.1 (2022-08-25)

  - publish as `latest` release in npm

## 4.0.0-1 (2022-08-07)

#### Chore

 - Update to @capacitor/core 4.0.1
 - Update to @capacitor/ios 4.0.1
 - Update to @capacitor/android 4.0.1

#### Bug Fixes

 - Fix After adding the plugin Android compilation fails #301

## 3.7.0 (2022-08-07)

#### Chore

 - Update to @capacitor/core 3.7.0
 - Update to @capacitor/ios 3.7.0
 - Update to @capacitor/android 3.7.0

#### Bug Fixes

 - fix issue#299 (PR joewoodhouse)
 - adding some messages for improving error in electron #304
 - Allow copying databases from the cache folder #303
 - Add move databases #307

## 3.5.2 (2022-08-02)

#### Bug Fixes

 - Problems with DELETE FROM #285

## 3.5.2-dev2 (2022-07-07)

#### Bug Fixes

 - Fix call of setLastExportDate only if sync_table exists

## 3.5.2-dev1 (2022-07-07)

#### Test Features

 - test `jeep-sqlite` with `sql.js@1.7.0`

## 3.5.1 (2022-06-25)

#### Added Features

 - added method `clearEncryptionSecret` to reset a previously saved passphrase in the keychain (issue #283). Thanks to the contributioin of chriswep

#### Bug Fixes

 - Fix #271 for iOS & added support for table name containing dash/hyphen. Thanks to the contributiion of victorybiz

## 3.5.1-2 (2022-05-31)

#### Bug Fixes

 - Fix No error thrown when table does not exist for Electron issue#277

## 3.5.1-1 (2022-05-16)

#### Chore

 - Update to @capacitor/core 3.5.1
 - Update to @capacitor/ios 3.5.1
 - Update to @capacitor/android 3.5.1

#### Bug Fixes

 - DELETE FROM does not work issue#271 (victorybiz)
 
## 3.5.0 (2022-05-09)

#### Chore

 - Update to @capacitor/core 3.5.0
 - Update to @capacitor/ios 3.5.0
 - Update to @capacitor/android 3.5.0

## 3.4.3 (2022-05-07)

#### Added Features

 - Add a link `angular-sqlite-synchronize-app` application demonstrating the import/export JSON object including the new delete feature with the `sql_deleted` column to synchronize local database with remote server database.

 - Modify Contributor list format

#### Bug Fixes

 - fix(executeTransaction): fix definition issue#267

## 3.4.3-3 (2022-05-04)

#### Added Features (Electron)

 - add a `sql_deleted` column on table to manage the synchronization of deleted records. Before the record was deleted when a `DELETE FROM` command was issued, now the record is updated with the `sql_deleted`set to 1 
 - add `deleteExportedRows`method to physically delete the records having the `sql_deleted` set to 1, after a successful synchronization with a remote server database

## 3.4.3-2 (2022-04-21)

#### Added Features Only (Web, iOS, Android)

 - add a `sql_deleted` column on table to manage the synchronization of deleted records. Before the record was deleted when a `DELETE FROM` command was issued, now the record is updated with the `sql_deleted`set to 1 
 - add `deleteExportedRows`method to physically delete the records having the `sql_deleted` set to 1, after a successful synchronization with a remote server database
 - add a [solidjs-vite-sqlite-app](https://github.com/jepiqueau/capacitor-solid-sqlite) application to demonstrate the use of this new feature
 
#### Bug Fixes

 - Delete use case with Local to Server Sync issue#237


## 3.4.3-1 (2022-04-21)

#### Chore

 - Update to @capacitor/core 3.4.3
 - Update to @capacitor/ios 3.4.3
 - Update to @capacitor/android 3.4.3

#### Bug Fixes

 - Fix Upgrade Database Version, another table already exists issue#263
 - Improve Electron code visibility
 - Upgrade TypeORM-Usage.md

## 3.4.2 (2022-04-08)

#### Bug Fixes

 - update _trigger_last_modified (WHEN NEW.last_modified < OLD.last_modified BEGIN )
 - iOS: add TYPE AFFINITY in JSON Object for `importFromJson` and `ExportToJson`
 - do not execute UPDATE in `importFromJson` for `partial` mode when all provided column' values are identical to those in the database
 - Fix TypeError: Cannot convert undefined or null to object during TypeORM DataSource.initialize() issue#249
 - Update `ImportExportJson.md` documentation

## 3.4.2-5 (2022-04-02)

#### Bug Fixes

 - iOS Query returing multiple rows - Array issue#195

## 3.4.2-4 (2022-04-01)

!!!! DO NOT USE IT !!!!

## 3.4.2-3 (2022-03-30)

#### Added Features

 - add `getTableList`method
 - add `overwrite` parameter in JSON object

#### Bug Fixes

 - update documentation Web-Usage.md for Ionic/Angular
 - set Foreign Keys Off before Dropping the tables in import full json issue#245

## 3.4.2-2 (2022-03-25)

#### Bug Fixes

 - Insert Floating point (iOS) issue#239
 
## 3.4.2-1 (2022-03-23)

#### Chore

 - Update to @capacitor/core 3.4.2
 - Update to @capacitor/ios 3.4.2
 - Update to @capacitor/android 3.4.2

#### Bug Fixes

 - No handling of changeEncryptionSecret iOS & Android issue #233

## 3.4.1 (2022-03-17)

#### Added Features

 - add Electron folder databases location in the `capacitor-config.ts`
   for Windows and Linux

## 3.4.1-4 (2022-03-17)

#### Added Features

 - add Electron folder databases location in the `capacitor-config.ts`
   first step MacOS only

### 3.4.1-3 (2022-03-10)

#### Bug Fixes

 - Fix Android the master key android-keystore://_androidx_security_master_key_ exists but is unusable

### 3.4.1-2 (2022-03-10)

#### Bug Fixes

 - Fix ImportExportJson.md regarding the use of last_modified table column
 - Fix createSyncTable when last_modified column not in table's schema

### 3.4.1-1 (2022-03-04)

#### Chore

 - Update to @capacitor/core 3.4.1
 - Update to @capacitor/ios 3.4.1
 - Update to @capacitor/android 3.4.1

#### Added Features

 - add iosIsEncryption, androidIsEncryption in capacitor.config.ts
   iOS KeyChain & Android MasterKey are not defined when these parameters are set to false meaning that databases could not be encrypted

#### Bug Fixes

 - Fix Android issue#224

### 3.4.0 (2022-03-02)

#### Added Features

 - add transaction method to group several sql statements in one transaction

#### Bug Fixes

 - fix How to handle Transactions with this plugin issue#230

### 3.4.0-3 (2022-02-26)

#### Bug Fixes

 - fix Android Sqlite Encryption DB Failed when tested with Immuniweb issue#229

### 3.4.0-2 (2022-02-23)

#### Added Features

 - add biometric authentication to MasterKey (Android)
 - add biometric authentication to Keychain (iOS)
 - add Biometric Authentication documentation

#### Bug Fixes

 - fix variable keychain account for multiple applications using the plugin

### 3.4.0-1 (2022-02-08)

#### Chore

 - Update to @capacitor/core 3.4.0
 - Update to @capacitor/ios 3.4.0
 - Update to @capacitor/android 3.4.0

#### Bug Fixes

 - Fix iOS issue#220
 - Fix Android issue#221

### 3.3.3 (2022-01-18)

#### Bug Fixes

 - fix TypeORM-Usage.md
 - update README.md

### 3.3.3-5 (2022-01-07)

#### Bug Fixes

 - fix getUrl integrate "file://" in the returned url
 - fix create databaselocation in iOS

### 3.3.3-4 (2022-01-06)

#### Added Features

 - add getUrl method Get DB Path iOS & Android 

#### Bug Fixes

 - fix Get DB Path or file URI issue#208

### 3.3.3-3 (2022-01-03)

#### Bug Fixes

 - fix Android Error during database version upgrade issue#209

### 3.3.3-2 (2022-01-03)

#### Added Features

 - iOS Support for databases that are not visible to iTunes and are not backed up by iCloud issue#207

#### Bug Fixes

 - fix README.md
 - fix API.md

### 3.3.3-1 (2021-12-18)

#### Chore

 - Update to @capacitor/core 3.3.3
 - Update to @capacitor/ios 3.3.3
 - Update to @capacitor/android 3.3.3

#### Added Features

 - Open in Read-Only Mode databases without SQLite suffix 
 - getNCDatabasePath, createNCConnection, closeNCConnection, isNCDatabase
 - add NonConformedDatabase.md documentation

#### Bug Fixes

 - fix mode "UNIQUE" not case sensitive in importToJson index issue#203
 - fix support non-conformed database in read-only mode issue#201


### 3.3.2 (2021-12-13)

#### Chore

 - Update to @capacitor/core 3.3.2
 - Update to @capacitor/ios 3.3.2
 - Update to @capacitor/android 3.3.2

#### Bug Fixes

 - fix addSQLiteSuffix skips databases without .db extension issue#200

### 3.3.1 (2021-11-25)

#### Chore

 - Update to @capacitor/core 3.3.1
 - Update to @capacitor/ios 3.3.1
 - Update to @capacitor/android 3.3.1

#### Added Features

- add link to React-Vite and Vue-Vite application

#### Bug Fixes

- fix Plugin failed to register in Android 11 physical device issue#196
- fix Ionic-React-Usage.md
- fix Ionic-Vue-Usage.md
- fix Electron `npm install --save jszip`in README issue#197

### 3.2.5 (2021-11-07)

- stable release

### 3.2.5-2 (2021-11-03)

#### Added Features 

 - add importing zipped files using copyFromAssets method

#### Bug Fixes

 - fix issue#191

### 3.2.5-1 (2021-10-22)

#### Chore

 - Update to @capacitor/core 3.2.5
 - Update to @capacitor/ios 3.2.5
 - Update to @capacitor/android 3.2.5

#### Bug Fixes

 - fix Electron isTable issue#188
 - fix iOS closeAllConnections issue#190

### 3.2.4 (2021-10-15)

#### Bug Fixes

 - fix Electron + TypeORM - Transaction error issue#186

### 3.2.4-2 (2021-10-11)

#### Added Features 

 - add getMigratableDbList requested in issue#182

#### Bug Fixes

 - fix MigratingCordovaDatabases.md

### 3.2.4-1 (2021-10-11)

#### Chore

 - Update to @capacitor/core 3.2.4
 - Update to @capacitor/ios 3.2.4
 - Update to @capacitor/android 3.2.4

#### Added Features 

 - Extend addSQLiteSuffix and deleteOldDatabases by providing a database name's list

#### Bug Fixes

 - fix issue#182

### 3.2.3 (2021-10-09)

#### Bug Fixes

 - Update Web-Usage.md for React and Vue frameworks

### 3.2.3-1 (2021-09-24)

#### Chore

 - Update to @capacitor/core 3.2.3
 - Update to @capacitor/ios 3.2.3
 - Update to @capacitor/android 3.2.3

#### Added Features

 - add initWebStore and saveToStore methods to the web plugin

#### Bug Fixes

 - Update API.md databases location for Web platform
 - Update Ionic-Vue-Usage.md


### 3.2.2 (2021-09-17)

#### Bug Fixes

 - Update API.md databases location for Web platform

### 3.2.2-3 (2021-09-15)

#### Bug Fixes

 - Fix Web Platform, add componentOnReady on constructor

### 3.2.2-2 (2021-09-15)

#### Bug Fixes

 - Fix All Platforms, executeSet breaks with empty array issue#170

### 3.2.2-1 (2021-09-11)

#### Chore

 - Update to @capacitor/core 3.2.2
 - Update to @capacitor/ios 3.2.2
 - Update to @capacitor/android 3.2.2

#### Added Features

 - Add Views in JsonSQLite (issue#167)
 
### 3.2.0 (2021-08-31)

#### Added Features

 - Add getVersion method

### 3.2.0-11 (2021-08-30)

#### Bug Fixes

 - Fix Android importFromJson change in version throwing error mentioned in issue#164
 - Fix iOS importFromJson change in version throwing error mentioned in issue#164
 - Fix Electron importFromJson change in version throwing error mentioned in issue#164
 - Fix Web importFromJson change in version throwing error mentioned in issue#164


### 3.2.0-10 (2021-08-29)

#### Added Features

 - Add Ionic/React App to Web_Usage.md

#### Bug Fixes

 - fix README.md

### 3.2.0-9 (2021-08-29)

#### Bug Fixes

 - Fix Android importFromJson throwing error mentioned in issue#164
 - Fix iOS importFromJson throwing error mentioned in issue#164

### 3.2.0-8 (2021-08-28)

#### Added Features

 - Add Ionic/Vue App to Web_Usage.md

#### Bug Fixes

 - Fix Electron with "electron" in the app name issue#163
 - Fix Electron `assets/databases` under `public` folder for Vue and React frameworks

### 3.2.0-7 (2021-08-27)

#### Bug Fixes

 - Fix web store initialization

### 3.2.0-6 (2021-08-26)

#### Bug Fixes

 - Fix Electron echo method
 
### 3.2.0-5 (2021-08-25)

#### Added Features

 - Add Web plugin part based on `sql.js@1.5.0` and `localeforage@1.9.0`for database persistency.
 - Add Web_Usage.md doc

### 3.2.0-4 (2021-08-25)

#### Bug Fixes

 - android in partial model importFromJson failed of update data: NIQUE constraint failed: xxx.id issue#160

### 3.2.0-3 (2021-08-25)

#### Chore

 - Update to @capacitor-community/electron 4.0.3

### 3.2.0-2 (2021-08-23)

#### Chore

 - Update to @capacitor/core 3.2.0

#### Added Features

 - Add Electron plugin part based on sqlite3 and @capacitor-community/electron 3.1.0

### 3.2.0-1 (2021-08-23)

#### Bug Fixes

 - in checkConnectionsConsistency close all connections when not consistent
 - Support for Android API level 21 issue#132
 - remove temporary fix for Wrong values on insert and query issue#125 fix by Capacitor 3.1.2 

### 3.1.3-3 (2021-07-28)

#### Bug Fixes 

 - remove trial web implementation with sql.js

### 3.1.3-2 (2021-07-27)

#### Bug Fixes 

 - copyFromAssets only takes files with SQLite.db suffix on iOS (contrary to Android) issue#152 

### 3.1.3-1 (2021-07-24)

#### Bug Fixes 

 - put back temporary fix for Wrong values on insert and query issue#125 not fixed by Capacitor 3.1.2 

### 3.1.2 (2021-07-24)

#### Chore

 - Update to Capacitor 3.1.2

#### Bug Fixes 

 - copyFromAssets fails on Android 6 issue#151
 - CapacitorSQLite.toJSON Android #144 fix by Capacitor 3.1.2
 - remove temporary fix for Wrong values on insert and query issue#125 fix by Capacitor 3.1.2 

### 3.1.2-1 (2021-07-14)

#### Bug Fixes 

 - Fix issue#147

### 3.1.1 (2021-07-13)

#### Chore

 - Update to Capacitor 3.1.1

#### Bug Fixes 

 - Remove console.log in SQLiteDBConnection
 - update npm Version in README.md

### 3.0.0 (2021-07-07)

#### Chore

 - Update to Capacitor 3.0.2

#### Bug Fixes 

 - Update README.md
 - Fix Insert Null as Foreign Key Android issue#125
 - Fix SetEncryptionSecret Android issue#141

### 3.0.0-rc.2 (2021-06-13)

#### Added Features

- Thanks to Chris, a driver to TypeORM is now available.
- TypeORM-Usage.md

#### Bug Fixes 

- Double precision type numbers are read as floats Android #issue124

### 3.0.0-rc.1 (2021-06-02)

#### Bug Fixes 

- CapacitorSQLite.isSecretStored()" is not implemented on android #issue123

### 3.0.0-beta.14 (2021-05-29)

#### Chore

 - Update to Capacitor 3.0.0

#### Bug Fixes 

- iOS null or empty column return as string "NULL" #issue119, #issue120
- JS float numbers are rejected in run statements (iOS) #issue121

### 3.0.0-beta.13 (2021-05-06)

#### Chore

 - Update to Capacitor 3.0.0-rc.1

#### Added Features

- Allow users to set secret #issue88
- add isSecretStored, setEncryptionSecret, changeEncryptionSecret methods

#### Bug Fixes 

- ImportFromJson in Partial Mode without schema changes #issue113

### 3.0.0-beta.12 (2021-04-24)

#### Added Features

- Event Listeners for Import and Export Json #issue112

### 3.0.0-beta.11 (2021-04-21)

#### Bug Fixes

- Checking on Types has been removed #issue108
- NULL values are now returned as null #issue109
- values in Query method accepts from now an Array of any #issue110
- fix disable transaction #issue111


### 3.0.0-beta.10 (2021-04-14)

#### Bug Fixes

- Fix Android app crashes when creating connection with wrong secret issue#105
- Fix reload of webview breaks connection handling #issue106
- Fix user provides a name that ends on ".db" #issue107
- Fix add an option to disable transactions #issue111
- add Supported SQLite Types in README.md #issue108

### 3.0.0-beta.9 (2021-04-02)

#### Bug Fixes

 - Fix prepareSQL Android for null value

### 3.0.0-beta.8 (2021-04-02)

#### Bug Fixes

 - Fix ImportFromJson db is Locked issue#101

### 3.0.0-beta.7 (2021-03-20)

#### Added Features

- add `Library` folder to iOS addSQLiteSuffix method
- update MigratingCordovaDatabases.md accordingly

### 3.0.0-beta.6 (2021-03-19)

#### Bug Fixes

 - Fix executeSet on iOS not accept null values issue#89

### 3.0.0-beta.5 (2021-03-18)

#### Chore

 - Update to Capacitor 3.0.0-rc.0

#### Added Features

 - isConnection method
 - isDatabase method
 - getDatabaseList method
 - isTable method
 - addSQLiteSuffix method
 - deleteOldDatabases method
 - isDBOpen
 - MigratingCordovaDatabases.md

#### Bug Fixes

 - Fix Copy db from storage issue#77
 - Fix Is there a way to connect to a db file, that not has the prefix SQLite.db issue#79
 - Fix More precise error message on failing statements issue#82 
 - Fix issue#84 Android
 - Fix executeSet on android not accept null values issue#89
 - Fix issue#97

### 3.0.0-beta.4 (2021-02-01)

#### Bug Fixes

- Fix Data import where the ID is a UUID issue#75
- Fix Can't create my own DB Trigger issue#76

### 3.0.0-beta.3 (2021-01-30)

#### Bug Fixes

- fix issue#71 Compound primary Key when ImportFromJSON
- getSyncDate returns a toISOString() data and not an Unix Epoch
- update documentation

### 3.0.0-beta.2 (2021-01-23)

#### Bug Fixes

- add SQLCipher dependency in CapacitorCommunitySqlite.pod

### 3.0.0-beta.1 (2021-01-23)

#### Bug Fixes

- update API Docs
- update README, CHANGELOG

#### Chore

- update to @capacitor/core@3.0.0-beta.1

#### Added Features

- better Error handling throught try...catch

### 2.9.16 (2021-04-13) REFACTOR

#### Bug Fixes

- Fix Android app crashes when creating connection with wrong secret issue#105

### 2.9.15 (2021-04-01) REFACTOR

#### Bug Fixes

- Fix ImportFromJson db is Locked issue#101

### 2.9.14 (2021-03-19) REFACTOR

#### Chore

- update to @capacitor/core@2.4.7

#### Bug Fixes

- Fix issue#89 Android, iOS
- Fix issue#97

### 2.9.13 (2021-02-24) REFACTOR

#### Bug Fixes

- Fix issue#84 Android

### 2.9.12 (2021-02-15) REFACTOR

#### Bug Fixes

- Fix isDBOpen method Android

### 2.9.11 (2021-02-15) REFACTOR

#### Added Features

- isDBOpen method

### 2.9.10 (2021-02-14) REFACTOR

#### Added Features

- isConnection method
- isDatabase method
- getDatabaseList method
- isTable method
- addSQLiteSuffix method
- deleteOldDatabases method
- MigratingCordovaDatabases.md

#### Bug Fixes

- Fix Copy db from storage issue#77
- Fix Is there a way to connect to a db file, that not has the prefix SQLite.db issue#79
- Fix More precise error message on failing statements issue#82

### 2.9.9 (2021-02-01) REFACTOR

#### Bug Fixes

- Fix Android export 'Partial' triggers

### 2.9.8 (2021-02-01) REFACTOR

#### Bug Fixes

- Fix Data import where the ID is a UUID issue#75
- Fix Can't create my own DB Trigger issue#76

### 2.9.7 (2021-01-30) REFACTOR

#### Bug Fixes

- Fix Compound primary Key when ImportFromJSON issue#71
- Update ImportExportJson

### 2.9.6 (2021-01-24) REFACTOR

#### Chore

- Move to latest tag

#### Bug Fixes

- Fix isIdExists on Electron
- Readme all links to apps and docs


### 2.9.5 (2021-01-20) REFACTOR

#### Bug Fixes

- importFromJson not working with REAL

### 2.9.4 (2021-01-17) REFACTOR

#### Bug Fixes

- Fix 'build-electron' missing before publish
- update CHANGELOG

### 2.9.3 (2021-01-17) REFACTOR

#### Move to Master

#### Bug Fixes

- Fix in definition.ts Since 2.4.9 in 2.9.0
- Fix documentation links from 'refactor' to 'master'
- update README and CHANGELOG

### 2.9.2 (2021-01-16) REFACTOR

#### Bug Fixes

- Fix issue#64 create UNIQUE Indexes with combined columns
- update ImportExport documentation
- update README and CHANGELOG

### 2.9.1 (2021-01-16) REFACTOR

#### Bug Fixes

- Fix issue#63 by removing encryption for Windows
- update README and CHANGELOG

### 2.9.0 (2021-01-14) REFACTOR

#### Chore

- update to @capacitor/core@2.4.6

#### Bug Fixes

- remove Android permissions issue#60
- update usage docs
- update README and CHANGELOG

### 2.9.0-beta.3 (2021-01-05) REFACTOR

#### Bug Fixes

- fix Ionic-React-Usage.md documentation
- fix Ionic-Vue-Usage.md documentation
- update README and CHANGELOG

### 2.9.0-beta.2 (2021-01-04) REFACTOR

#### Chore

- update to @capacitor/core@2.4.5

#### Added Features

- Ionic-React-Usage.md documentation
- Ionic-Vue-Usage.md documentation
- copyFromAssets

#### Bug Fixes

- update README and CHANGELOG

### 2.9.0-beta.1 (2020-12-25) REFACTOR

#### Added Features

- importFromJson (Android, iOS, Electron)
- exportToJson (Android, iOS, Electron)
- isJsonValid (Android, iOS, Electron)
- getSyncDate (Android, iOS, Electron)

#### Bug Fixes

- update README and CHANGELOG

### 2.9.0-alpha.7 (2020-12-14) REFACTOR

#### Bug Fixes

- Update the README and add a link to a Ionic/React app.

### 2.9.0-alpha.6 (2020-12-14) REFACTOR

#### Chore

- update to @capacitor/core@2.4.4

#### Added Features Electron platform

- createConnection
- closeConnection
- open (non-encrypted DB)
- open (encrypted DB)
- close
- execute
- executeSet
- run
- query
- deleteDatabase
- createSyncTable
- setSyncDate
- isDBExists
- addUpgradeStatement

#### Added Features All Platforms

- in capSQLiteSet the values can be an any[] or any[][]

#### Bug Fixes

- Update the README and add a link to a Ionic/React app.
- Update the API documentation

### 2.9.0-alpha.5 (2020-12-02) REFACTOR

#### Added Features

- retrieveConnection (Wrapper Connection)
- retrieveAllConnections (Wrapper Connection)
- closeAllConnections (Wrapper Connection)

#### Bug Fixes

- fix rollback transaction in iOS

### 2.9.0-alpha.4 (2020-11-29) REFACTOR

#### Added Features iOS platform

- createConnection
- closeConnection
- open (non-encrypted DB)
- open (encrypted DB)
- close
- execute
- executeSet
- run
- query
- deleteDatabase
- createSyncTable
- setSyncDate
- isDBExists
- addUpgradeStatement

#### Bug Fixes

- Android addUpgradeStatement backup and restore

### 2.9.0-alpha.3 (2020-11-25) REFACTOR

#### Added Features Android platform only

- add addUpgradeStatement method
- add createSyncTable method
- add setSyncDate method
- update refactor app

#### Bug Fixes

- creating database directory in physical device
- app crash when querying non existing tables or columns

### 2.9.0-alpha.2 (2020-11-23) REFACTOR

#### Chore

- update to @capacitor/core@2.4.3

#### Added Features Android platform only

- add Wrappers documentation (APIConnection && APIDBConnection)
- add `isDBExists`, `deleteDatabase` methods

### 2.9.0-alpha.1 (2020-11-22) REFACTOR

#### Added Features Android platform only

- createConnection method
- closeConnection method
- SQLiteConnection Interface & Class
- SQLiteDBConnection Interface & Class

### 2.4.6 (2021-01-24)

#### Chore

- update to @capacitor/core@2.4.6

- move it from tag latest to tag initial

### 2.4.5 (2021-01-13)

#### Bug Fixes

- Fix README and CHANGELOG

### 2.4.5-3 (2021-01-13)

#### Bug Fixes

- Fix Electron rebuild

### 2.4.5-2 (2021-01-13)

#### Bug Fixes

- Fix Permission request Android issue#60
- Fix README and CHANGELOG
- Fix API.md

### 2.4.5-1 (2021-01-05)

#### Chore

- update to @capacitor/core@2.4.5

#### Bug Fixes

- Fix README and CHANGELOG

### 2.4.4 (2020-12-26)

#### Chore

- update to @capacitor/core@2.4.4

#### Bug Fixes

- Fix README
- Fix setSyncDate (iOS)
- Fix exportToJson (Android)
- Fix lastId to Int64 (iOS)

### 2.4.3 (2020-12-19)

#### Bug Fixes

- Fix issue#59 ExportToJson

### 2.4.3-1 (2020-11-23)

#### Chore

- update to @capacitor/core@2.4.3

#### Bug Fixes

- Fix issue#56 INSERT null value on iOS

### 2.4.2 (2020-11-22)

- Stable release before looking at a refactor for solving issue#1

### 2.4.2-9 (2020-11-12)

#### Added Features

- Add Listener for request permissions (Android)
- Add Vue and Ionic/Vue demonstrating apps

#### Bug Fixes

- Update documentation

### 2.4.2-8 (2020-10-22)

#### Bug Fixes

- Fix iOS plugin open bug

### 2.4.2-7 (2020-10-22)

#### Added Features

- Add addUpgradeStatement for version upgrade (Android)

#### Bug Fixes

- Fix README issue#47

### 2.4.2-6 (2020-10-16)

#### Added Features

- Add addUpgradeStatement for version upgrade (iOS & Electron)
- Add UgradeDatabaseVersion.md documentation

### 2.4.2-5 (2020-10-08)

#### Bug Fixes

- Fix iOS plugin build failed

### 2.4.2-4 (2020-10-07)

#### Bug Fixes

- Fix Android Trigger on multi-lines

### 2.4.2-3 (2020-10-06)

#### Added Features

- Add docgen to generate API documentation

- Add a trigger for last_modified in importFromJson method to update the last-modified field when a data in an another field is updated

#### Bug Fixes

- Split up capSQLiteOptions capSQLiteResult in multiple interfaces issue#4

### 2.4.2-2 (2020-09-29)

#### Bug Fixes

- Fix podspec file name (iOS)

### 2.4.2-1 (2020-09-29)

#### Chores

- Capacitor: update 2.4.2

#### #### Added Features

- The electron plugin is now compatible with @capacitor-community/electron

### 2.4.1-1 (2020-09-22)

#### Bug Fixes

- Fix Better permission request on Android issue#40
- Update APIdocumentation.md, .gitignore & .npmignore
- Fix bug in setSyncDate iOS & electron

### 2.4.0 (2020-08-07)

#### Chores

- Capacitor: update 2.4.0

#### Bug Fixes

- Fix Android sqlite3_close issue#36
- Fix iOS encryption issue

### 2.4.0-beta.2 (2020-08-07)

#### Bug Fixes

- Fix iOS encryption issue

### 2.4.0-beta.1 (2020-08-07)

#### Chores

- Capacitor: update 2.4.0

#### Bug Fixes

- Fix Android sqlite3_close issue#36

### 2.3.0 (2020-08-03)

- Publish from 2.3.0-beta3

### 2.3.0-beta3 (2020-08-03)

#### Bug Fixes

- Rewrite the iOS Plugin to pass through SwiftLint

### 2.3.0-beta.2 (2020-07-28)

#### Bug Fixes

- Fix iOS issues due to the move to capacitor-community

### 2.3.0-2 (2020-07-25)

#### Added Features

- add API documentation
- modify ImportExportJson documentation

#### Bug Fixes

- Fix podspec file name

### 2.3.0-1 (2020-07-24)

#### Ownership

- give the ownership to capacitor-community
- rename the plugin from capacitor-sqlite to sqlite

#### Chores

- Capacitor: update 2.3.0

### 2.2.1-3 (2020-07-15)

#### Bug Fixes

- Fix issue#31 Android query value array types MUST be an Array

### 2.2.1-2 (2020-07-12)

#### Bug Fixes

- Fix issue#29 iOS exportToJson converting zero and empty string values to "NULL"

### 2.2.1-1 (2020-07-08)

#### Chores

- Capacitor: update 2.2.1

#### Bug Fixes

- Fix return changes in IOS plugin when FOREIGN KEY and ON DELETE CASCADE

### 2.2.0 (2020-07-07)

#### Bug Fixes

- Improve the readme

### 2.2.0-4 (2020-07-04)

#### Bug Fixes

- Fix issue#26, issue#27 in IOS plugin If an insert query fails, all subsequent database commands fail

### 2.2.0-3 (2020-06-25)

#### Bug Fixes

- Fix in IOS plugin the changes return in Run method (ON DELETE CASCADE)

### 2.2.0-2 (2020-06-24)

#### Added Features

- add Batch Execution with values (method executeSet)

### 2.2.0-1 (2020-06-16)

#### Chores

- Capacitor: update 2.2.0

### 2.1.0 (2020-06-16)

#### Added Features

- Add Capitalization characters in IOS table column names issue#25
- Add import in two steps table schema & indexes and table data to importFromJson

### 2.1.0-7 (2020-06-01)

#### Bug Fixes

- Fix issue#24

### 2.1.0-6 (2020-05-28)

#### Bug Fixes

- Fix issue#23
- Fix issue#22 index column value

### 2.1.0-5 (2020-05-26)

#### Bug Fixes

- Fix issue#22

### 2.1.0-4 (2020-05-24)

#### Added Features

- add FOREIGN KEY support in importFrom & exportTo Json

#### Bug Fixes

- Fix issue#20
- Fix issue#21

### 2.1.0-3 (2020-05-14)

#### Chores

- SQLCipher: update 4.4.0

#### Bug Fixes

- fix issue#17 Android importFromJson inserting a large amount of data

### 2.1.0-2 (2020-05-13)

#### Bug Fixes

- fix README

### 2.1.0-1 (2020-05-12)

#### Chores

- capacitor: update to capacitor 2.1.0

#### Bug Fixes

- fix issue#16: Electron Databases get deleted with app update

### 2.0.1-3 (2020-05-05)

#### Bug Fixes

- fix issue#15

### 2.0.1-2 (2020-04-30)

#### Bug Fixes

- fix the readme, test-angular-jeep-capacitor-plugins link

### 2.0.1-1 (2020-04-28)

#### Chores

- capacitor: update to capacitor 2.0.1

#### Added Features

- add method IsDBExists to check if a database already exists
- add method IsJsonValid to validate the Json Object before proceeding
- add method exportToJson to download a database full or partial
- add method createSyncTable to create a synchronization table
- add method setSyncDate to store a syncronization date for partial export

#### Bug Fixes

- the delete database for safety issue requires now to open the database first

### 2.0.0 (2020-04-21)

#### Added Features

- add upload of image (base64 string) to the database
- add the management of NULL in the importFromJson method
  a NULL value as to be given with the "NULL" string
- add the lastId returned by the run method
  changes is now a JSON object {changes:number,lastId:number}
- add the transaction (begin and commit) to the run method

#### Bug Fixes

- fix the changes return by the execute method

### 2.0.0-4 (2020-04-15)

#### Added Features

- add importFromJson method to IOS Platform

### 2.0.0-3 (2020-04-14)

#### Added Features

- add importFromJson method to Android Platform
- add importFromJson method to Electron Platform

### 2.0.0-2 (2020-04-10)

#### Bug Fixes

- Fix issue#6 commands return -1 when failure

### 2.0.0-1 (2020-04-09)

#### Chores

- capacitor: update to capacitor 2.0.0
- android: update to androidX

#### Added Features

- add a .gitignore file

### 1.5.3 (2020-04-06)

#### Added Features

- Add Electron Plugin based on sqlite3. Works only for non-encrypted databases

### 1.5.2 (2020-04-01)

#### Chores

- capacitor: update to capacitor 1.5.2

### 1.5.2-1 (2020-03-18)

#### Bug Fixes

- Fix Cursor not close in Android plugin

### 1.5.1 (2020-03-17)

#### Bug Fixes

- fix README link to applications

### 1.5.1-3 (2020-03-17)

#### Bug Fixes

- fix Plugin Name as CapacitorSQLite

### 1.5.1-2 (2020-03-17)

#### Bug Fixes

- fix interface PluginRegistry

### 1.5.1-1 (2020-03-17)

#### Added Features

- Undeprecating the npm package to allow user to load only this capacitor plugin in there applications (advise by the Ionic Capacitor team)

#### Chores

- @capacitor/cli: update to 1.5.1
- @capacitor/core: update to 1.5.1
- @capacitor/ios: update to 1.5.1
- @capacitor/android: update to 1.5.1
