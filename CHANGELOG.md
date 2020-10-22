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
