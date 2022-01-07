## 3.3.3-5 (2022-01-07)

### Bug Fixes

 - fix getUrl integrate "file://" in the returned url
 - fix create databaselocation in iOS

## 3.3.3-4 (2022-01-06)

### Added Features

 - add getUrl method Get DB Path iOS & Android 

### Bug Fixes

 - fix Get DB Path or file URI issue#208

## 3.3.3-3 (2022-01-03)

### Bug Fixes

 - fix Android Error during database version upgrade issue#209

## 3.3.3-2 (2022-01-03)

### Added Features

 - iOS Support for databases that are not visible to iTunes and are not backed up by iCloud issue#207

### Bug Fixes

 - fix README.md
 - fix API.md

## 3.3.3-1 (2021-12-18)

### Chore

 - Update to @capacitor/core 3.3.3
 - Update to @capacitor/ios 3.3.3
 - Update to @capacitor/android 3.3.3

### Added Features

 - Open in Read-Only Mode databases without SQLite suffix 
 - getNCDatabasePath, createNCConnection, closeNCConnection, isNCDatabase
 - add NonConformedDatabase.md documentation

### Bug Fixes

 - fix mode "UNIQUE" not case sensitive in importToJson index issue#203
 - fix support non-conformed database in read-only mode issue#201


## 3.3.2 (2021-12-13)

### Chore

 - Update to @capacitor/core 3.3.2
 - Update to @capacitor/ios 3.3.2
 - Update to @capacitor/android 3.3.2

### Bug Fixes

 - fix addSQLiteSuffix skips databases without .db extension issue#200

## 3.3.1 (2021-11-25)

### Chore

 - Update to @capacitor/core 3.3.1
 - Update to @capacitor/ios 3.3.1
 - Update to @capacitor/android 3.3.1

### Added Features

- add link to React-Vite and Vue-Vite application

### Bug Fixes

- fix Plugin failed to register in Android 11 physical device issue#196
- fix Ionic-React-Usage.md
- fix Ionic-Vue-Usage.md
- fix Electron `npm install --save jszip`in README issue#197

## 3.2.5 (2021-11-07)

- stable release

## 3.2.5-2 (2021-11-03)

### Added Features 

 - add importing zipped files using copyFromAssets method

### Bug Fixes

 - fix issue#191

## 3.2.5-1 (2021-10-22)

### Chore

 - Update to @capacitor/core 3.2.5
 - Update to @capacitor/ios 3.2.5
 - Update to @capacitor/android 3.2.5

### Bug Fixes

 - fix Electron isTable issue#188
 - fix iOS closeAllConnections issue#190

## 3.2.4 (2021-10-15)

### Bug Fixes

 - fix Electron + TypeORM - Transaction error issue#186

## 3.2.4-2 (2021-10-11)

### Added Features 

 - add getMigratableDbList requested in issue#182

### Bug Fixes

 - fix MigratingCordovaDatabases.md

## 3.2.4-1 (2021-10-11)

### Chore

 - Update to @capacitor/core 3.2.4
 - Update to @capacitor/ios 3.2.4
 - Update to @capacitor/android 3.2.4

### Added Features 

 - Extend addSQLiteSuffix and deleteOldDatabases by providing a database name's list

### Bug Fixes

 - fix issue#182

## 3.2.3 (2021-10-09)

### Bug Fixes

 - Update Web-Usage.md for React and Vue frameworks

## 3.2.3-1 (2021-09-24)

### Chore

 - Update to @capacitor/core 3.2.3
 - Update to @capacitor/ios 3.2.3
 - Update to @capacitor/android 3.2.3

### Added Features

 - add initWebStore and saveToStore methods to the web plugin

### Bug Fixes

 - Update API.md databases location for Web platform
 - Update Ionic-Vue-Usage.md


## 3.2.2 (2021-09-17)

### Bug Fixes

 - Update API.md databases location for Web platform

## 3.2.2-3 (2021-09-15)

### Bug Fixes

 - Fix Web Platform, add componentOnReady on constructor

## 3.2.2-2 (2021-09-15)

### Bug Fixes

 - Fix All Platforms, executeSet breaks with empty array issue#170

## 3.2.2-1 (2021-09-11)

### Chore

 - Update to @capacitor/core 3.2.2
 - Update to @capacitor/ios 3.2.2
 - Update to @capacitor/android 3.2.2

### Added Features

 - Add Views in JsonSQLite (issue#167)
 
## 3.2.0 (2021-08-31)

### Added Features

 - Add getVersion method

## 3.2.0-11 (2021-08-30)

### Bug Fixes

 - Fix Android importFromJson change in version throwing error mentioned in issue#164
 - Fix iOS importFromJson change in version throwing error mentioned in issue#164
 - Fix Electron importFromJson change in version throwing error mentioned in issue#164
 - Fix Web importFromJson change in version throwing error mentioned in issue#164


## 3.2.0-10 (2021-08-29)

### Added Features

 - Add Ionic/React App to Web_Usage.md

### Bug Fixes

 - fix README.md

## 3.2.0-9 (2021-08-29)

### Bug Fixes

 - Fix Android importFromJson throwing error mentioned in issue#164
 - Fix iOS importFromJson throwing error mentioned in issue#164

## 3.2.0-8 (2021-08-28)

### Added Features

 - Add Ionic/Vue App to Web_Usage.md

### Bug Fixes

 - Fix Electron with "electron" in the app name issue#163
 - Fix Electron `assets/databases` under `public` folder for Vue and React frameworks

## 3.2.0-7 (2021-08-27)

### Bug Fixes

 - Fix web store initialization

## 3.2.0-6 (2021-08-26)

### Bug Fixes

 - Fix Electron echo method
 
## 3.2.0-5 (2021-08-25)

### Added Features

 - Add Web plugin part based on `sql.js@1.5.0` and `localeforage@1.9.0`for database persistency.
 - Add Web_Usage.md doc

## 3.2.0-4 (2021-08-25)

### Bug Fixes

 - android in partial model importFromJson failed of update data: NIQUE constraint failed: xxx.id issue#160

## 3.2.0-3 (2021-08-25)

### Chore

 - Update to @capacitor-community/electron 4.0.3

## 3.2.0-2 (2021-08-23)

### Chore

 - Update to @capacitor/core 3.2.0

### Added Features

 - Add Electron plugin part based on sqlite3 and @capacitor-community/electron 3.1.0

## 3.2.0-1 (2021-08-23)

### Bug Fixes

 - in checkConnectionsConsistency close all connections when not consistent
 - Support for Android API level 21 issue#132
 - remove temporary fix for Wrong values on insert and query issue#125 fix by Capacitor 3.1.2 

## 3.1.3-3 (2021-07-28)

### Bug Fixes 

 - remove trial web implementation with sql.js

## 3.1.3-2 (2021-07-27)

### Bug Fixes 

 - copyFromAssets only takes files with SQLite.db suffix on iOS (contrary to Android) issue#152 

## 3.1.3-1 (2021-07-24)

### Bug Fixes 

 - put back temporary fix for Wrong values on insert and query issue#125 not fixed by Capacitor 3.1.2 

## 3.1.2 (2021-07-24)

### Chore

 - Update to Capacitor 3.1.2

### Bug Fixes 

 - copyFromAssets fails on Android 6 issue#151
 - CapacitorSQLite.toJSON Android #144 fix by Capacitor 3.1.2
 - remove temporary fix for Wrong values on insert and query issue#125 fix by Capacitor 3.1.2 

## 3.1.2-1 (2021-07-14)

### Bug Fixes 

 - Fix issue#147

## 3.1.1 (2021-07-13)

### Chore

 - Update to Capacitor 3.1.1

### Bug Fixes 

 - Remove console.log in SQLiteDBConnection
 - update npm Version in README.md

## 3.0.0 (2021-07-07)

### Chore

 - Update to Capacitor 3.0.2

### Bug Fixes 

 - Update README.md
 - Fix Insert Null as Foreign Key Android issue#125
 - Fix SetEncryptionSecret Android issue#141

## 3.0.0-rc.2 (2021-06-13)

### Added Features

- Thanks to Chris, a driver to TypeORM is now available.
- TypeORM-Usage.md

### Bug Fixes 

- Double precision type numbers are read as floats Android #issue124

## 3.0.0-rc.1 (2021-06-02)

### Bug Fixes 

- CapacitorSQLite.isSecretStored()" is not implemented on android #issue123

## 3.0.0-beta.14 (2021-05-29)

### Chore

 - Update to Capacitor 3.0.0

### Bug Fixes 

- iOS null or empty column return as string "NULL" #issue119, #issue120
- JS float numbers are rejected in run statements (iOS) #issue121

## 3.0.0-beta.13 (2021-05-06)

### Chore

 - Update to Capacitor 3.0.0-rc.1

### Added Features

- Allow users to set secret #issue88
- add isSecretStored, setEncryptionSecret, changeEncryptionSecret methods

### Bug Fixes 

- ImportFromJson in Partial Mode without schema changes #issue113

## 3.0.0-beta.12 (2021-04-24)

### Added Features

- Event Listeners for Import and Export Json #issue112

## 3.0.0-beta.11 (2021-04-21)

### Bug Fixes

- Checking on Types has been removed #issue108
- NULL values are now returned as null #issue109
- values in Query method accepts from now an Array of any #issue110
- fix disable transaction #issue111


## 3.0.0-beta.10 (2021-04-14)

### Bug Fixes

- Fix Android app crashes when creating connection with wrong secret issue#105
- Fix reload of webview breaks connection handling #issue106
- Fix user provides a name that ends on ".db" #issue107
- Fix add an option to disable transactions #issue111
- add Supported SQLite Types in README.md #issue108

## 3.0.0-beta.9 (2021-04-02)

### Bug Fixes

 - Fix prepareSQL Android for null value

## 3.0.0-beta.8 (2021-04-02)

### Bug Fixes

 - Fix ImportFromJson db is Locked issue#101

## 3.0.0-beta.7 (2021-03-20)

### Added Features

- add `Library` folder to iOS addSQLiteSuffix method
- update MigratingCordovaDatabases.md accordingly

## 3.0.0-beta.6 (2021-03-19)

### Bug Fixes

 - Fix executeSet on iOS not accept null values issue#89

## 3.0.0-beta.5 (2021-03-18)

### Chore

 - Update to Capacitor 3.0.0-rc.0

### Added Features

 - isConnection method
 - isDatabase method
 - getDatabaseList method
 - isTable method
 - addSQLiteSuffix method
 - deleteOldDatabases method
 - isDBOpen
 - MigratingCordovaDatabases.md

### Bug Fixes

 - Fix Copy db from storage issue#77
 - Fix Is there a way to connect to a db file, that not has the prefix SQLite.db issue#79
 - Fix More precise error message on failing statements issue#82 
 - Fix issue#84 Android
 - Fix executeSet on android not accept null values issue#89
 - Fix issue#97

## 3.0.0-beta.4 (2021-02-01)

### Bug Fixes

- Fix Data import where the ID is a UUID issue#75
- Fix Can't create my own DB Trigger issue#76

## 3.0.0-beta.3 (2021-01-30)

### Bug Fixes

- fix issue#71 Compound primary Key when ImportFromJSON
- getSyncDate returns a toISOString() data and not an Unix Epoch
- update documentation

## 3.0.0-beta.2 (2021-01-23)

### Bug Fixes

- add SQLCipher dependency in CapacitorCommunitySqlite.pod

## 3.0.0-beta.1 (2021-01-23)

### Bug Fixes

- update API Docs
- update README, CHANGELOG

### Chore

- update to @capacitor/core@3.0.0-beta.1

### Added Features

- better Error handling throught try...catch

## 2.9.16 (2021-04-13) REFACTOR

### Bug Fixes

- Fix Android app crashes when creating connection with wrong secret issue#105

## 2.9.15 (2021-04-01) REFACTOR

### Bug Fixes

- Fix ImportFromJson db is Locked issue#101

## 2.9.14 (2021-03-19) REFACTOR

### Chore

- update to @capacitor/core@2.4.7

### Bug Fixes

- Fix issue#89 Android, iOS
- Fix issue#97

## 2.9.13 (2021-02-24) REFACTOR

### Bug Fixes

- Fix issue#84 Android

## 2.9.12 (2021-02-15) REFACTOR

### Bug Fixes

- Fix isDBOpen method Android

## 2.9.11 (2021-02-15) REFACTOR

### Added Features

- isDBOpen method

## 2.9.10 (2021-02-14) REFACTOR

### Added Features

- isConnection method
- isDatabase method
- getDatabaseList method
- isTable method
- addSQLiteSuffix method
- deleteOldDatabases method
- MigratingCordovaDatabases.md

### Bug Fixes

- Fix Copy db from storage issue#77
- Fix Is there a way to connect to a db file, that not has the prefix SQLite.db issue#79
- Fix More precise error message on failing statements issue#82

## 2.9.9 (2021-02-01) REFACTOR

### Bug Fixes

- Fix Android export 'Partial' triggers

## 2.9.8 (2021-02-01) REFACTOR

### Bug Fixes

- Fix Data import where the ID is a UUID issue#75
- Fix Can't create my own DB Trigger issue#76

## 2.9.7 (2021-01-30) REFACTOR

### Bug Fixes

- Fix Compound primary Key when ImportFromJSON issue#71
- Update ImportExportJson

## 2.9.6 (2021-01-24) REFACTOR

### Chore

- Move to latest tag

### Bug Fixes

- Fix isIdExists on Electron
- Readme all links to apps and docs


## 2.9.5 (2021-01-20) REFACTOR

### Bug Fixes

- importFromJson not working with REAL

## 2.9.4 (2021-01-17) REFACTOR

### Bug Fixes

- Fix 'build-electron' missing before publish
- update CHANGELOG

## 2.9.3 (2021-01-17) REFACTOR

### Move to Master

### Bug Fixes

- Fix in definition.ts Since 2.4.9 in 2.9.0
- Fix documentation links from 'refactor' to 'master'
- update README and CHANGELOG

## 2.9.2 (2021-01-16) REFACTOR

### Bug Fixes

- Fix issue#64 create UNIQUE Indexes with combined columns
- update ImportExport documentation
- update README and CHANGELOG

## 2.9.1 (2021-01-16) REFACTOR

### Bug Fixes

- Fix issue#63 by removing encryption for Windows
- update README and CHANGELOG

## 2.9.0 (2021-01-14) REFACTOR

### Chore

- update to @capacitor/core@2.4.6

### Bug Fixes

- remove Android permissions issue#60
- update usage docs
- update README and CHANGELOG

## 2.9.0-beta.3 (2021-01-05) REFACTOR

### Bug Fixes

- fix Ionic-React-Usage.md documentation
- fix Ionic-Vue-Usage.md documentation
- update README and CHANGELOG

## 2.9.0-beta.2 (2021-01-04) REFACTOR

### Chore

- update to @capacitor/core@2.4.5

### Added Features

- Ionic-React-Usage.md documentation
- Ionic-Vue-Usage.md documentation
- copyFromAssets

### Bug Fixes

- update README and CHANGELOG

## 2.9.0-beta.1 (2020-12-25) REFACTOR

### Added Features

- importFromJson (Android, iOS, Electron)
- exportToJson (Android, iOS, Electron)
- isJsonValid (Android, iOS, Electron)
- getSyncDate (Android, iOS, Electron)

### Bug Fixes

- update README and CHANGELOG

## 2.9.0-alpha.7 (2020-12-14) REFACTOR

### Bug Fixes

- Update the README and add a link to a Ionic/React app.

## 2.9.0-alpha.6 (2020-12-14) REFACTOR

### Chore

- update to @capacitor/core@2.4.4

### Added Features Electron platform

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

### Added Features All Platforms

- in capSQLiteSet the values can be an any[] or any[][]

### Bug Fixes

- Update the README and add a link to a Ionic/React app.
- Update the API documentation

## 2.9.0-alpha.5 (2020-12-02) REFACTOR

### Added Features

- retrieveConnection (Wrapper Connection)
- retrieveAllConnections (Wrapper Connection)
- closeAllConnections (Wrapper Connection)

### Bug Fixes

- fix rollback transaction in iOS

## 2.9.0-alpha.4 (2020-11-29) REFACTOR

### Added Features iOS platform

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

### Bug Fixes

- Android addUpgradeStatement backup and restore

## 2.9.0-alpha.3 (2020-11-25) REFACTOR

### Added Features Android platform only

- add addUpgradeStatement method
- add createSyncTable method
- add setSyncDate method
- update refactor app

### Bug Fixes

- creating database directory in physical device
- app crash when querying non existing tables or columns

## 2.9.0-alpha.2 (2020-11-23) REFACTOR

### Chore

- update to @capacitor/core@2.4.3

### Added Features Android platform only

- add Wrappers documentation (APIConnection && APIDBConnection)
- add `isDBExists`, `deleteDatabase` methods

## 2.9.0-alpha.1 (2020-11-22) REFACTOR

### Added Features Android platform only

- createConnection method
- closeConnection method
- SQLiteConnection Interface & Class
- SQLiteDBConnection Interface & Class

## 2.4.6 (2021-01-24)

### Chore

- update to @capacitor/core@2.4.6

- move it from tag latest to tag initial

## 2.4.5 (2021-01-13)

### Bug Fixes

- Fix README and CHANGELOG

## 2.4.5-3 (2021-01-13)

### Bug Fixes

- Fix Electron rebuild

## 2.4.5-2 (2021-01-13)

### Bug Fixes

- Fix Permission request Android issue#60
- Fix README and CHANGELOG
- Fix API.md

## 2.4.5-1 (2021-01-05)

### Chore

- update to @capacitor/core@2.4.5

### Bug Fixes

- Fix README and CHANGELOG

## 2.4.4 (2020-12-26)

### Chore

- update to @capacitor/core@2.4.4

### Bug Fixes

- Fix README
- Fix setSyncDate (iOS)
- Fix exportToJson (Android)
- Fix lastId to Int64 (iOS)

## 2.4.3 (2020-12-19)

### Bug Fixes

- Fix issue#59 ExportToJson

## 2.4.3-1 (2020-11-23)

### Chore

- update to @capacitor/core@2.4.3

### Bug Fixes

- Fix issue#56 INSERT null value on iOS

## 2.4.2 (2020-11-22)

- Stable release before looking at a refactor for solving issue#1

## 2.4.2-9 (2020-11-12)

### Added Features

- Add Listener for request permissions (Android)
- Add Vue and Ionic/Vue demonstrating apps

### Bug Fixes

- Update documentation

## 2.4.2-8 (2020-10-22)

### Bug Fixes

- Fix iOS plugin open bug

## 2.4.2-7 (2020-10-22)

### Added Features

- Add addUpgradeStatement for version upgrade (Android)

### Bug Fixes

- Fix README issue#47

## 2.4.2-6 (2020-10-16)

### Added Features

- Add addUpgradeStatement for version upgrade (iOS & Electron)
- Add UgradeDatabaseVersion.md documentation

## 2.4.2-5 (2020-10-08)

### Bug Fixes

- Fix iOS plugin build failed

## 2.4.2-4 (2020-10-07)

### Bug Fixes

- Fix Android Trigger on multi-lines

## 2.4.2-3 (2020-10-06)

### Added Features

- Add docgen to generate API documentation

- Add a trigger for last_modified in importFromJson method to update the last-modified field when a data in an another field is updated

### Bug Fixes

- Split up capSQLiteOptions capSQLiteResult in multiple interfaces issue#4

## 2.4.2-2 (2020-09-29)

### Bug Fixes

- Fix podspec file name (iOS)

## 2.4.2-1 (2020-09-29)

### Chores

- Capacitor: update 2.4.2

### ### Added Features

- The electron plugin is now compatible with @capacitor-community/electron

## 2.4.1-1 (2020-09-22)

### Bug Fixes

- Fix Better permission request on Android issue#40
- Update APIdocumentation.md, .gitignore & .npmignore
- Fix bug in setSyncDate iOS & electron

## 2.4.0 (2020-08-07)

### Chores

- Capacitor: update 2.4.0

### Bug Fixes

- Fix Android sqlite3_close issue#36
- Fix iOS encryption issue

## 2.4.0-beta.2 (2020-08-07)

### Bug Fixes

- Fix iOS encryption issue

## 2.4.0-beta.1 (2020-08-07)

### Chores

- Capacitor: update 2.4.0

### Bug Fixes

- Fix Android sqlite3_close issue#36

## 2.3.0 (2020-08-03)

- Publish from 2.3.0-beta3

## 2.3.0-beta3 (2020-08-03)

### Bug Fixes

- Rewrite the iOS Plugin to pass through SwiftLint

## 2.3.0-beta.2 (2020-07-28)

### Bug Fixes

- Fix iOS issues due to the move to capacitor-community

## 2.3.0-2 (2020-07-25)

### Added Features

- add API documentation
- modify ImportExportJson documentation

### Bug Fixes

- Fix podspec file name

## 2.3.0-1 (2020-07-24)

### Ownership

- give the ownership to capacitor-community
- rename the plugin from capacitor-sqlite to sqlite

### Chores

- Capacitor: update 2.3.0

## 2.2.1-3 (2020-07-15)

### Bug Fixes

- Fix issue#31 Android query value array types MUST be an Array

## 2.2.1-2 (2020-07-12)

### Bug Fixes

- Fix issue#29 iOS exportToJson converting zero and empty string values to "NULL"

## 2.2.1-1 (2020-07-08)

### Chores

- Capacitor: update 2.2.1

### Bug Fixes

- Fix return changes in IOS plugin when FOREIGN KEY and ON DELETE CASCADE

## 2.2.0 (2020-07-07)

### Bug Fixes

- Improve the readme

## 2.2.0-4 (2020-07-04)

### Bug Fixes

- Fix issue#26, issue#27 in IOS plugin If an insert query fails, all subsequent database commands fail

## 2.2.0-3 (2020-06-25)

### Bug Fixes

- Fix in IOS plugin the changes return in Run method (ON DELETE CASCADE)

## 2.2.0-2 (2020-06-24)

### Added Features

- add Batch Execution with values (method executeSet)

## 2.2.0-1 (2020-06-16)

### Chores

- Capacitor: update 2.2.0

## 2.1.0 (2020-06-16)

### Added Features

- Add Capitalization characters in IOS table column names issue#25
- Add import in two steps table schema & indexes and table data to importFromJson

## 2.1.0-7 (2020-06-01)

### Bug Fixes

- Fix issue#24

## 2.1.0-6 (2020-05-28)

### Bug Fixes

- Fix issue#23
- Fix issue#22 index column value

## 2.1.0-5 (2020-05-26)

### Bug Fixes

- Fix issue#22

## 2.1.0-4 (2020-05-24)

### Added Features

- add FOREIGN KEY support in importFrom & exportTo Json

### Bug Fixes

- Fix issue#20
- Fix issue#21

## 2.1.0-3 (2020-05-14)

### Chores

- SQLCipher: update 4.4.0

### Bug Fixes

- fix issue#17 Android importFromJson inserting a large amount of data

## 2.1.0-2 (2020-05-13)

### Bug Fixes

- fix README

## 2.1.0-1 (2020-05-12)

### Chores

- capacitor: update to capacitor 2.1.0

### Bug Fixes

- fix issue#16: Electron Databases get deleted with app update

## 2.0.1-3 (2020-05-05)

### Bug Fixes

- fix issue#15

## 2.0.1-2 (2020-04-30)

### Bug Fixes

- fix the readme, test-angular-jeep-capacitor-plugins link

## 2.0.1-1 (2020-04-28)

### Chores

- capacitor: update to capacitor 2.0.1

### Added Features

- add method IsDBExists to check if a database already exists
- add method IsJsonValid to validate the Json Object before proceeding
- add method exportToJson to download a database full or partial
- add method createSyncTable to create a synchronization table
- add method setSyncDate to store a syncronization date for partial export

### Bug Fixes

- the delete database for safety issue requires now to open the database first

## 2.0.0 (2020-04-21)

### Added Features

- add upload of image (base64 string) to the database
- add the management of NULL in the importFromJson method
  a NULL value as to be given with the "NULL" string
- add the lastId returned by the run method
  changes is now a JSON object {changes:number,lastId:number}
- add the transaction (begin and commit) to the run method

### Bug Fixes

- fix the changes return by the execute method

## 2.0.0-4 (2020-04-15)

### Added Features

- add importFromJson method to IOS Platform

## 2.0.0-3 (2020-04-14)

### Added Features

- add importFromJson method to Android Platform
- add importFromJson method to Electron Platform

## 2.0.0-2 (2020-04-10)

### Bug Fixes

- Fix issue#6 commands return -1 when failure

## 2.0.0-1 (2020-04-09)

### Chores

- capacitor: update to capacitor 2.0.0
- android: update to androidX

### Added Features

- add a .gitignore file

## 1.5.3 (2020-04-06)

### Added Features

- Add Electron Plugin based on sqlite3. Works only for non-encrypted databases

## 1.5.2 (2020-04-01)

### Chores

- capacitor: update to capacitor 1.5.2

## 1.5.2-1 (2020-03-18)

### Bug Fixes

- Fix Cursor not close in Android plugin

## 1.5.1 (2020-03-17)

### Bug Fixes

- fix README link to applications

## 1.5.1-3 (2020-03-17)

### Bug Fixes

- fix Plugin Name as CapacitorSQLite

## 1.5.1-2 (2020-03-17)

### Bug Fixes

- fix interface PluginRegistry

## 1.5.1-1 (2020-03-17)

### Added Features

- Undeprecating the npm package to allow user to load only this capacitor plugin in there applications (advise by the Ionic Capacitor team)

### Chores

- @capacitor/cli: update to 1.5.1
- @capacitor/core: update to 1.5.1
- @capacitor/ios: update to 1.5.1
- @capacitor/android: update to 1.5.1
