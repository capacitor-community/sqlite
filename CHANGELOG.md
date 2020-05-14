## 2.1.0-3 (2020-05-14)

### Chores

* SQLCipher: update 4.4.0

### Bug Fixes

* fix issue#17 Android importFromJson inserting a large amount of data

## 2.1.0-2 (2020-05-13)

### Bug Fixes

* fix README

## 2.1.0-1 (2020-05-12)

### Chores

* capacitor: update to capacitor 2.1.0

### Bug Fixes

* fix issue#16: Electron Databases get deleted with app update

## 2.0.1-3 (2020-05-05)

### Bug Fixes

* fix issue#15

## 2.0.1-2 (2020-04-30)

### Bug Fixes

* fix the readme, test-angular-jeep-capacitor-plugins link

## 2.0.1-1 (2020-04-28)

### Chores

* capacitor: update to capacitor 2.0.1

### Added Features

* add method IsDBExists to check if a database already exists
* add method IsJsonValid to validate the Json Object before proceeding
* add method exportToJson to download a database full or partial
* add method createSyncTable to create a synchronization table
* add method setSyncDate to store a syncronization date for partial export

### Bug Fixes

* the delete database for safety issue requires now to open the database first


## 2.0.0 (2020-04-21)

### Added Features

* add upload of image (base64 string) to the database
* add the management of NULL in the importFromJson method
  a NULL value as to be given with the "NULL" string
* add the lastId returned by the run method
  changes is now a JSON object {changes:number,lastId:number}
* add the transaction (begin and commit) to the run method

### Bug Fixes

* fix the changes return by the execute method

## 2.0.0-4 (2020-04-15)

### Added Features

* add importFromJson method to IOS Platform

## 2.0.0-3 (2020-04-14)

### Added Features

* add importFromJson method to Android Platform
* add importFromJson method to Electron Platform

## 2.0.0-2 (2020-04-10)

### Bug Fixes

* Fix issue#6 commands return -1 when failure

## 2.0.0-1 (2020-04-09)

### Chores

* capacitor: update to capacitor 2.0.0
* android: update to androidX
 
### Added Features

* add a .gitignore file

## 1.5.3 (2020-04-06)

### Added Features

* Add Electron Plugin based on sqlite3. Works only for non-encrypted databases

## 1.5.2 (2020-04-01)

### Chores

* capacitor: update to capacitor 1.5.2

## 1.5.2-1 (2020-03-18)

### Bug Fixes

* Fix Cursor not close in Android plugin

## 1.5.1 (2020-03-17)

### Bug Fixes

* fix README link to applications

## 1.5.1-3 (2020-03-17)

### Bug Fixes

* fix Plugin Name as CapacitorSQLite

## 1.5.1-2 (2020-03-17)

### Bug Fixes

* fix interface PluginRegistry 

## 1.5.1-1 (2020-03-17)

### Added Features

* Undeprecating the npm package to allow user to load only this capacitor plugin in there applications (advise by the Ionic Capacitor team)

### Chores

* @capacitor/cli: update to 1.5.1 
* @capacitor/core: update to 1.5.1 
* @capacitor/ios: update to 1.5.1 
* @capacitor/android: update to 1.5.1 
 
