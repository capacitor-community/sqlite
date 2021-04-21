<p align="center"><br><img src="https://user-images.githubusercontent.com/236501/85893648-1c92e880-b7a8-11ea-926d-95355b8175c7.png" width="128" height="128" /></p>
<h2 align="center">API PLUGIN DOCUMENTATION</h2>
<p align="center"><strong><code>@capacitor-community/sqlite</code></strong></p>
<p align="center">
  Capacitor community plugin for Native and Electron SQLite Databases. For <strong>Native</strong> and <strong>Electron</strong> platforms, databases could be encrypted with SQLCipher</p>

## Plugin Wrappers

To easy the way to use the `@capacitor-community/sqlite` plugin and its ability to be use in conjonction with other plugins (`typeorm`, `spatialite`, ...), two connection wrappers have been associated.

- [API_Connection_Wrapper_Documentation](https://github.com/capacitor-community/sqlite/blob/master/docs/APIConnection.md)

- [API_DB_Connection_Wrapper_Documentation](https://github.com/capacitor-community/sqlite/blob/master/docs/APIDBConnection.md)

## Databases Location

The plugin add a suffix "SQLite" and an extension ".db" to the database name given as options in the `capConnectionOptions` or `capSQLiteOptions` ie (fooDB -> fooDBSQLite.db). If the name given contains the extension `.db` it will be removed ie (foo.db) will become internally (fooSQLite.db) after adding the suffix. 

### Android

- **data/data/YOUR_PACKAGE/databases**

### IOS

- **in the Document folder of YOUR_APPLICATION**

### Electron

- before **2.4.2-1** the location of the databases was selectable:

  - the previous one **YourApplication/Electron/Databases**
  - under **User/Databases/APP_NAME/** to not loose them when updating the application. This was manage in the index.html file of the application.

- since **2.4.2-1** the databases location is : **User/Databases/APP_NAME/**

## Error Return values

- For all methods, a message containing the error message will be returned

- For execute and run commands, {changes:{changes: -1}} will be returned in changes

- For query command, an empty array will be returned in values

## Defining your own secret and newsecret keys (encryption only)

- in IOS, go to the Pod/Development Pods/capacitor-sqlite/GlobalSQLite.swift file

- in Android, go to capacitor-sqlite/java/com.jeep.plugin.capacitor/cdssUtils/GlobalSQLite.java
  and update the default values before building your app.

- in Electron, go to YOUR_APP/electron/plugins/plugin.js-xxxx.js and search for `class GlobalSQLite` and modify the `this.secret`and `this.newsecret` parameters.

## Methods Index

<docgen-index>

* [`createConnection(...)`](#createconnection)
* [`closeConnection(...)`](#closeconnection)
* [`echo(...)`](#echo)
* [`open(...)`](#open)
* [`close(...)`](#close)
* [`execute(...)`](#execute)
* [`executeSet(...)`](#executeset)
* [`run(...)`](#run)
* [`query(...)`](#query)
* [`isDBExists(...)`](#isdbexists)
* [`isDBOpen(...)`](#isdbopen)
* [`isDatabase(...)`](#isdatabase)
* [`isTableExists(...)`](#istableexists)
* [`deleteDatabase(...)`](#deletedatabase)
* [`isJsonValid(...)`](#isjsonvalid)
* [`importFromJson(...)`](#importfromjson)
* [`exportToJson(...)`](#exporttojson)
* [`createSyncTable(...)`](#createsynctable)
* [`setSyncDate(...)`](#setsyncdate)
* [`getSyncDate(...)`](#getsyncdate)
* [`addUpgradeStatement(...)`](#addupgradestatement)
* [`copyFromAssets()`](#copyfromassets)
* [`getDatabaseList()`](#getdatabaselist)
* [`addSQLiteSuffix(...)`](#addsqlitesuffix)
* [`deleteOldDatabases(...)`](#deleteolddatabases)
* [`checkConnectionsConsistency(...)`](#checkconnectionsconsistency)
* [Interfaces](#interfaces)

</docgen-index>

## API Plugin

<docgen-api class="custom-css">
<!--Update the source file JSDoc comments and rerun docgen to update the docs below-->

CapacitorSQLitePlugin Interface

### createConnection(...)

```typescript
createConnection(options: capConnectionOptions) => Promise<void>
```

create a database connection

| Param         | Type                                                                  | Description                                              |
| ------------- | --------------------------------------------------------------------- | -------------------------------------------------------- |
| **`options`** | <code><a href="#capconnectionoptions">capConnectionOptions</a></code> | <a href="#capconnectionoptions">capConnectionOptions</a> |

**Since:** 2.9.0 refactor

--------------------


### closeConnection(...)

```typescript
closeConnection(options: capSQLiteOptions) => Promise<void>
```

close a database connection

| Param         | Type                                                          | Description                                      |
| ------------- | ------------------------------------------------------------- | ------------------------------------------------ |
| **`options`** | <code><a href="#capsqliteoptions">capSQLiteOptions</a></code> | <a href="#capsqliteoptions">capSQLiteOptions</a> |

**Since:** 2.9.0 refactor

--------------------


### echo(...)

```typescript
echo(options: capEchoOptions) => Promise<capEchoResult>
```

Echo a given string

| Param         | Type                                                      | Description                                    |
| ------------- | --------------------------------------------------------- | ---------------------------------------------- |
| **`options`** | <code><a href="#capechooptions">capEchoOptions</a></code> | : <a href="#capechooptions">capEchoOptions</a> |

**Returns:** <code>Promise&lt;<a href="#capechoresult">capEchoResult</a>&gt;</code>

**Since:** 0.0.1

--------------------


### open(...)

```typescript
open(options: capSQLiteOptions) => Promise<void>
```

Open a SQLite database

| Param         | Type                                                          | Description                                        |
| ------------- | ------------------------------------------------------------- | -------------------------------------------------- |
| **`options`** | <code><a href="#capsqliteoptions">capSQLiteOptions</a></code> | : <a href="#capsqliteoptions">capSQLiteOptions</a> |

**Since:** 0.0.1

--------------------


### close(...)

```typescript
close(options: capSQLiteOptions) => Promise<void>
```

Close a SQLite database

| Param         | Type                                                          | Description                                        |
| ------------- | ------------------------------------------------------------- | -------------------------------------------------- |
| **`options`** | <code><a href="#capsqliteoptions">capSQLiteOptions</a></code> | : <a href="#capsqliteoptions">capSQLiteOptions</a> |

**Since:** 0.0.1

--------------------


### execute(...)

```typescript
execute(options: capSQLiteExecuteOptions) => Promise<capSQLiteChanges>
```

Execute a Batch of Raw Statements as String

| Param         | Type                                                                        | Description                                                      |
| ------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| **`options`** | <code><a href="#capsqliteexecuteoptions">capSQLiteExecuteOptions</a></code> | : <a href="#capsqliteexecuteoptions">capSQLiteExecuteOptions</a> |

**Returns:** <code>Promise&lt;<a href="#capsqlitechanges">capSQLiteChanges</a>&gt;</code>

**Since:** 0.0.1

--------------------


### executeSet(...)

```typescript
executeSet(options: capSQLiteSetOptions) => Promise<capSQLiteChanges>
```

Execute a Set of Raw Statements as Array of CapSQLiteSet

| Param         | Type                                                                | Description                                              |
| ------------- | ------------------------------------------------------------------- | -------------------------------------------------------- |
| **`options`** | <code><a href="#capsqlitesetoptions">capSQLiteSetOptions</a></code> | : <a href="#capsqlitesetoptions">capSQLiteSetOptions</a> |

**Returns:** <code>Promise&lt;<a href="#capsqlitechanges">capSQLiteChanges</a>&gt;</code>

**Since:** 2.2.0-2

--------------------


### run(...)

```typescript
run(options: capSQLiteRunOptions) => Promise<capSQLiteChanges>
```

Execute a Single Statement

| Param         | Type                                                                | Description                                              |
| ------------- | ------------------------------------------------------------------- | -------------------------------------------------------- |
| **`options`** | <code><a href="#capsqliterunoptions">capSQLiteRunOptions</a></code> | : <a href="#capsqliterunoptions">capSQLiteRunOptions</a> |

**Returns:** <code>Promise&lt;<a href="#capsqlitechanges">capSQLiteChanges</a>&gt;</code>

**Since:** 0.0.1

--------------------


### query(...)

```typescript
query(options: capSQLiteQueryOptions) => Promise<capSQLiteValues>
```

Query a Single Statement

| Param         | Type                                                                    | Description                                                  |
| ------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------ |
| **`options`** | <code><a href="#capsqlitequeryoptions">capSQLiteQueryOptions</a></code> | : <a href="#capsqlitequeryoptions">capSQLiteQueryOptions</a> |

**Returns:** <code>Promise&lt;<a href="#capsqlitevalues">capSQLiteValues</a>&gt;</code>

**Since:** 0.0.1

--------------------


### isDBExists(...)

```typescript
isDBExists(options: capSQLiteOptions) => Promise<capSQLiteResult>
```

Check if a SQLite database exists with opened connection

| Param         | Type                                                          | Description                                        |
| ------------- | ------------------------------------------------------------- | -------------------------------------------------- |
| **`options`** | <code><a href="#capsqliteoptions">capSQLiteOptions</a></code> | : <a href="#capsqliteoptions">capSQLiteOptions</a> |

**Returns:** <code>Promise&lt;<a href="#capsqliteresult">capSQLiteResult</a>&gt;</code>

**Since:** 2.0.1-1

--------------------


### isDBOpen(...)

```typescript
isDBOpen(options: capSQLiteOptions) => Promise<capSQLiteResult>
```

Check if a SQLite database is opened

| Param         | Type                                                          | Description                                        |
| ------------- | ------------------------------------------------------------- | -------------------------------------------------- |
| **`options`** | <code><a href="#capsqliteoptions">capSQLiteOptions</a></code> | : <a href="#capsqliteoptions">capSQLiteOptions</a> |

**Returns:** <code>Promise&lt;<a href="#capsqliteresult">capSQLiteResult</a>&gt;</code>

**Since:** 3.0.0-beta.5

--------------------


### isDatabase(...)

```typescript
isDatabase(options: capSQLiteOptions) => Promise<capSQLiteResult>
```

Check if a SQLite database exists without connection

| Param         | Type                                                          | Description                                        |
| ------------- | ------------------------------------------------------------- | -------------------------------------------------- |
| **`options`** | <code><a href="#capsqliteoptions">capSQLiteOptions</a></code> | : <a href="#capsqliteoptions">capSQLiteOptions</a> |

**Returns:** <code>Promise&lt;<a href="#capsqliteresult">capSQLiteResult</a>&gt;</code>

**Since:** 3.0.0-beta.5

--------------------


### isTableExists(...)

```typescript
isTableExists(options: capSQLiteTableOptions) => Promise<capSQLiteResult>
```

Check if a table exists in a SQLite database

| Param         | Type                                                                    | Description                                                  |
| ------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------ |
| **`options`** | <code><a href="#capsqlitetableoptions">capSQLiteTableOptions</a></code> | : <a href="#capsqlitetableoptions">capSQLiteTableOptions</a> |

**Returns:** <code>Promise&lt;<a href="#capsqliteresult">capSQLiteResult</a>&gt;</code>

**Since:** 3.0.0-beta.5

--------------------


### deleteDatabase(...)

```typescript
deleteDatabase(options: capSQLiteOptions) => Promise<void>
```

Delete a SQLite database

| Param         | Type                                                          | Description                                        |
| ------------- | ------------------------------------------------------------- | -------------------------------------------------- |
| **`options`** | <code><a href="#capsqliteoptions">capSQLiteOptions</a></code> | : <a href="#capsqliteoptions">capSQLiteOptions</a> |

**Since:** 0.0.1

--------------------


### isJsonValid(...)

```typescript
isJsonValid(options: capSQLiteImportOptions) => Promise<capSQLiteResult>
```

Is Json Object Valid

| Param         | Type                                                                      | Description                                                    |
| ------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **`options`** | <code><a href="#capsqliteimportoptions">capSQLiteImportOptions</a></code> | : <a href="#capsqliteimportoptions">capSQLiteImportOptions</a> |

**Returns:** <code>Promise&lt;<a href="#capsqliteresult">capSQLiteResult</a>&gt;</code>

**Since:** 2.0.1-1

--------------------


### importFromJson(...)

```typescript
importFromJson(options: capSQLiteImportOptions) => Promise<capSQLiteChanges>
```

Import from Json Object

| Param         | Type                                                                      | Description                                                    |
| ------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **`options`** | <code><a href="#capsqliteimportoptions">capSQLiteImportOptions</a></code> | : <a href="#capsqliteimportoptions">capSQLiteImportOptions</a> |

**Returns:** <code>Promise&lt;<a href="#capsqlitechanges">capSQLiteChanges</a>&gt;</code>

**Since:** 2.0.0-3

--------------------


### exportToJson(...)

```typescript
exportToJson(options: capSQLiteExportOptions) => Promise<capSQLiteJson>
```

Export to Json Object

| Param         | Type                                                                      | Description                                                    |
| ------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **`options`** | <code><a href="#capsqliteexportoptions">capSQLiteExportOptions</a></code> | : <a href="#capsqliteexportoptions">capSQLiteExportOptions</a> |

**Returns:** <code>Promise&lt;<a href="#capsqlitejson">capSQLiteJson</a>&gt;</code>

**Since:** 2.0.1-1

--------------------


### createSyncTable(...)

```typescript
createSyncTable(options: capSQLiteOptions) => Promise<capSQLiteChanges>
```

Create a synchronization table

| Param         | Type                                                          | Description                                        |
| ------------- | ------------------------------------------------------------- | -------------------------------------------------- |
| **`options`** | <code><a href="#capsqliteoptions">capSQLiteOptions</a></code> | : <a href="#capsqliteoptions">capSQLiteOptions</a> |

**Returns:** <code>Promise&lt;<a href="#capsqlitechanges">capSQLiteChanges</a>&gt;</code>

**Since:** 2.0.1-1

--------------------


### setSyncDate(...)

```typescript
setSyncDate(options: capSQLiteSyncDateOptions) => Promise<void>
```

Set the synchronization date

| Param         | Type                                                                          | Description                                                        |
| ------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **`options`** | <code><a href="#capsqlitesyncdateoptions">capSQLiteSyncDateOptions</a></code> | : <a href="#capsqlitesyncdateoptions">capSQLiteSyncDateOptions</a> |

**Since:** 2.0.1-1

--------------------


### getSyncDate(...)

```typescript
getSyncDate(options: capSQLiteOptions) => Promise<capSQLiteSyncDate>
```

Get the synchronization date

| Param         | Type                                                          | Description                                        |
| ------------- | ------------------------------------------------------------- | -------------------------------------------------- |
| **`options`** | <code><a href="#capsqliteoptions">capSQLiteOptions</a></code> | : <a href="#capsqliteoptions">capSQLiteOptions</a> |

**Returns:** <code>Promise&lt;<a href="#capsqlitesyncdate">capSQLiteSyncDate</a>&gt;</code>

**Since:** 2.9.0

--------------------


### addUpgradeStatement(...)

```typescript
addUpgradeStatement(options: capSQLiteUpgradeOptions) => Promise<void>
```

Add the upgrade Statement for database version upgrading

| Param         | Type                                                                        | Description                                                      |
| ------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| **`options`** | <code><a href="#capsqliteupgradeoptions">capSQLiteUpgradeOptions</a></code> | : <a href="#capsqliteupgradeoptions">capSQLiteUpgradeOptions</a> |

**Since:** 2.4.2-6 iOS & Electron 2.4.2-7 Android

--------------------


### copyFromAssets()

```typescript
copyFromAssets() => Promise<void>
```

Copy databases from public/assets/databases folder to application databases folder

**Since:** 2.9.0 refactor

--------------------


### getDatabaseList()

```typescript
getDatabaseList() => Promise<capSQLiteValues>
```

Get the database list

**Returns:** <code>Promise&lt;<a href="#capsqlitevalues">capSQLiteValues</a>&gt;</code>

**Since:** 3.0.0-beta.5

--------------------


### addSQLiteSuffix(...)

```typescript
addSQLiteSuffix(options: capSQLitePathOptions) => Promise<void>
```

Add SQLIte Suffix to existing databases

| Param         | Type                                                                  | Description                                                |
| ------------- | --------------------------------------------------------------------- | ---------------------------------------------------------- |
| **`options`** | <code><a href="#capsqlitepathoptions">capSQLitePathOptions</a></code> | : <a href="#capsqlitepathoptions">capSQLitePathOptions</a> |

**Since:** 3.0.0-beta.5

--------------------


### deleteOldDatabases(...)

```typescript
deleteOldDatabases(options: capSQLitePathOptions) => Promise<void>
```

Delete Old Cordova databases

| Param         | Type                                                                  | Description                                                |
| ------------- | --------------------------------------------------------------------- | ---------------------------------------------------------- |
| **`options`** | <code><a href="#capsqlitepathoptions">capSQLitePathOptions</a></code> | : <a href="#capsqlitepathoptions">capSQLitePathOptions</a> |

**Since:** 3.0.0-beta.5

--------------------


### checkConnectionsConsistency(...)

```typescript
checkConnectionsConsistency(options: capAllConnectionsOptions) => Promise<capSQLiteResult>
```

Check Connection Consistency JS &lt;=&gt; Native
return true : consistency, connections are opened
return false : no consistency, connections are closed

| Param         | Type                                                                          | Description                                                        |
| ------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **`options`** | <code><a href="#capallconnectionsoptions">capAllConnectionsOptions</a></code> | : <a href="#capallconnectionsoptions">capAllConnectionsOptions</a> |

**Returns:** <code>Promise&lt;<a href="#capsqliteresult">capSQLiteResult</a>&gt;</code>

**Since:** 3.0.0-beta.11

--------------------


### Interfaces


#### capConnectionOptions

| Prop            | Type                 | Description                                                                |
| --------------- | -------------------- | -------------------------------------------------------------------------- |
| **`database`**  | <code>string</code>  | The database name                                                          |
| **`version`**   | <code>number</code>  | The database version                                                       |
| **`encrypted`** | <code>boolean</code> | Set to true (database encryption) / false                                  |
| **`mode`**      | <code>string</code>  | Set the mode for database encryption ["encryption", "secret", "newsecret"] |


#### capSQLiteOptions

| Prop           | Type                | Description       |
| -------------- | ------------------- | ----------------- |
| **`database`** | <code>string</code> | The database name |


#### capEchoResult

| Prop        | Type                | Description     |
| ----------- | ------------------- | --------------- |
| **`value`** | <code>string</code> | String returned |


#### capEchoOptions

| Prop        | Type                | Description         |
| ----------- | ------------------- | ------------------- |
| **`value`** | <code>string</code> | String to be echoed |


#### capSQLiteChanges

| Prop          | Type                                        | Description                               |
| ------------- | ------------------------------------------- | ----------------------------------------- |
| **`changes`** | <code><a href="#changes">Changes</a></code> | a returned <a href="#changes">Changes</a> |


#### Changes

| Prop          | Type                | Description                                          |
| ------------- | ------------------- | ---------------------------------------------------- |
| **`changes`** | <code>number</code> | the number of changes from an execute or run command |
| **`lastId`**  | <code>number</code> | the lastId created from a run command                |


#### capSQLiteExecuteOptions

| Prop              | Type                 | Description                                         | Since         |
| ----------------- | -------------------- | --------------------------------------------------- | ------------- |
| **`database`**    | <code>string</code>  | The database name                                   |               |
| **`statements`**  | <code>string</code>  | The batch of raw SQL statements as string           |               |
| **`transaction`** | <code>boolean</code> | Enable / Disable transactions default Enable (true) | 3.0.0-beta.10 |


#### capSQLiteSetOptions

| Prop              | Type                        | Description                                               | Since         |
| ----------------- | --------------------------- | --------------------------------------------------------- | ------------- |
| **`database`**    | <code>string</code>         | The database name                                         |               |
| **`set`**         | <code>capSQLiteSet[]</code> | The batch of raw SQL statements as Array of capSQLLiteSet |               |
| **`transaction`** | <code>boolean</code>        | Enable / Disable transactions default Enable (true)       | 3.0.0-beta.10 |


#### capSQLiteSet

| Prop            | Type                | Description                      |
| --------------- | ------------------- | -------------------------------- |
| **`statement`** | <code>string</code> | A statement                      |
| **`values`**    | <code>any[]</code>  | the data values list as an Array |


#### capSQLiteRunOptions

| Prop              | Type                 | Description                                         | Since         |
| ----------------- | -------------------- | --------------------------------------------------- | ------------- |
| **`database`**    | <code>string</code>  | The database name                                   |               |
| **`statement`**   | <code>string</code>  | A statement                                         |               |
| **`values`**      | <code>any[]</code>   | A set of values for a statement                     |               |
| **`transaction`** | <code>boolean</code> | Enable / Disable transactions default Enable (true) | 3.0.0-beta.10 |


#### capSQLiteValues

| Prop         | Type               | Description                      |
| ------------ | ------------------ | -------------------------------- |
| **`values`** | <code>any[]</code> | the data values list as an Array |


#### capSQLiteQueryOptions

| Prop            | Type                | Description                                     | Since         |
| --------------- | ------------------- | ----------------------------------------------- | ------------- |
| **`database`**  | <code>string</code> | The database name                               |               |
| **`statement`** | <code>string</code> | A statement                                     |               |
| **`values`**    | <code>any[]</code>  | A set of values for a statement Change to any[] | 3.0.0-beta.11 |


#### capSQLiteResult

| Prop         | Type                 | Description                                   |
| ------------ | -------------------- | --------------------------------------------- |
| **`result`** | <code>boolean</code> | result set to true when successful else false |


#### capSQLiteTableOptions

| Prop           | Type                | Description       |
| -------------- | ------------------- | ----------------- |
| **`database`** | <code>string</code> | The database name |
| **`table`**    | <code>string</code> | The table name    |


#### capSQLiteImportOptions

| Prop             | Type                | Description                   |
| ---------------- | ------------------- | ----------------------------- |
| **`jsonstring`** | <code>string</code> | Set the JSON object to import |


#### capSQLiteJson

| Prop         | Type                                              | Description           |
| ------------ | ------------------------------------------------- | --------------------- |
| **`export`** | <code><a href="#jsonsqlite">JsonSQLite</a></code> | an export JSON object |


#### JsonSQLite

| Prop            | Type                     | Description                                           |
| --------------- | ------------------------ | ----------------------------------------------------- |
| **`database`**  | <code>string</code>      | The database name                                     |
| **`version`**   | <code>number</code>      | The database version                                  |
| **`encrypted`** | <code>boolean</code>     | Set to true (database encryption) / false             |
| **`mode`**      | <code>string</code>      | * Set the mode ["full", "partial"]                    |
| **`tables`**    | <code>JsonTable[]</code> | * Array of Table (<a href="#jsontable">JsonTable</a>) |


#### JsonTable

| Prop           | Type                       | Description                                                 |
| -------------- | -------------------------- | ----------------------------------------------------------- |
| **`name`**     | <code>string</code>        | The database name                                           |
| **`schema`**   | <code>JsonColumn[]</code>  | * Array of Schema (<a href="#jsoncolumn">JsonColumn</a>)    |
| **`indexes`**  | <code>JsonIndex[]</code>   | * Array of Index (<a href="#jsonindex">JsonIndex</a>)       |
| **`triggers`** | <code>JsonTrigger[]</code> | * Array of Trigger (<a href="#jsontrigger">JsonTrigger</a>) |
| **`values`**   | <code>any[][]</code>       | * Array of Table data                                       |


#### JsonColumn

| Prop             | Type                | Description                         |
| ---------------- | ------------------- | ----------------------------------- |
| **`column`**     | <code>string</code> | The column name                     |
| **`value`**      | <code>string</code> | The column data (type, unique, ...) |
| **`foreignkey`** | <code>string</code> | The column foreign key constraints  |
| **`constraint`** | <code>string</code> | the column constraint               |


#### JsonIndex

| Prop        | Type                | Description                                                                                                             |
| ----------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **`name`**  | <code>string</code> | The index name                                                                                                          |
| **`value`** | <code>string</code> | The value of the index can have the following formats: email email ASC email, MobileNumber email ASC, MobileNumber DESC |
| **`mode`**  | <code>string</code> | the mode (Optional) UNIQUE                                                                                              |


#### JsonTrigger

| Prop            | Type                | Description                  |
| --------------- | ------------------- | ---------------------------- |
| **`name`**      | <code>string</code> | The trigger name             |
| **`timeevent`** | <code>string</code> | The trigger time event fired |
| **`condition`** | <code>string</code> | The trigger condition        |
| **`logic`**     | <code>string</code> | The logic of the trigger     |


#### capSQLiteExportOptions

| Prop                 | Type                | Description                                             |
| -------------------- | ------------------- | ------------------------------------------------------- |
| **`database`**       | <code>string</code> | The database name                                       |
| **`jsonexportmode`** | <code>string</code> | Set the mode to export JSON Object: "full" or "partial" |


#### capSQLiteSyncDateOptions

| Prop           | Type                | Description                                                    |
| -------------- | ------------------- | -------------------------------------------------------------- |
| **`database`** | <code>string</code> | The database name                                              |
| **`syncdate`** | <code>string</code> | Set the synchronization date Format yyyy-MM-dd'T'HH:mm:ss.SSSZ |


#### capSQLiteSyncDate

| Prop           | Type                | Description              |
| -------------- | ------------------- | ------------------------ |
| **`syncDate`** | <code>number</code> | the synchronization date |


#### capSQLiteUpgradeOptions

| Prop           | Type                                   | Description                                                                         |
| -------------- | -------------------------------------- | ----------------------------------------------------------------------------------- |
| **`database`** | <code>string</code>                    | The database name                                                                   |
| **`upgrade`**  | <code>capSQLiteVersionUpgrade[]</code> | The upgrade options for version upgrade Array of length 1 to easiest the iOS plugin |


#### capSQLiteVersionUpgrade

| Prop              | Type                        |
| ----------------- | --------------------------- |
| **`fromVersion`** | <code>number</code>         |
| **`toVersion`**   | <code>number</code>         |
| **`statement`**   | <code>string</code>         |
| **`set`**         | <code>capSQLiteSet[]</code> |


#### capSQLitePathOptions

| Prop             | Type                | Description                           |
| ---------------- | ------------------- | ------------------------------------- |
| **`folderPath`** | <code>string</code> | The folder path of existing databases |


#### capAllConnectionsOptions

| Prop          | Type                  | Description                   | Since         |
| ------------- | --------------------- | ----------------------------- | ------------- |
| **`dbNames`** | <code>string[]</code> | the dbName of all connections | 3.0.0-beta.10 |

</docgen-api>

## Remote Server databases Synchronization Process

The `@capacitor-community/sqlite` plugin provides a toolbox to help developpers to create a synchronization process in their applications.

- [importFromJson()](#importfromjson)
- [exportToJson()](#exporttojson)
- [createSyncTable()](#createsynctable)
- [setSyncDate()](#setsyncdate)

It is **Mandatory** for this process to happen, that each table contains in their schema:

- a first column with an **id** defined as:

- a last column with a name **last_modified**

- a trigger to update the **last_modified** field

as below:

```js
CREATE TABLE IF NOT EXISTS [tableName] (
id INTEGER PRIMARY KEY NOT NULL,
...
last_modified INTEGER DEFAULT (strftime('%s', 'now'))
);

...
...
CREATE TRIGGER users_trigger_last_modified AFTER UPDATE ON [tableName]
FOR EACH ROW WHEN NEW.last_modified <= OLD.last_modified
BEGIN
   UPDATE [tableName] SET last_modified= (strftime('%s', 'now')) WHERE id=OLD.id;
END;
```

Your Application has to manage the synchronization process:

- transfer of the whole databases when Online for the first time using `http requests` and convert the response to Json Object as described in [ImportExportJson_Documentation](https://github.com/capacitor-community/sqlite/blob/master/docs/ImportExportJson.md)

- use the `ìmportFromJson method` with a mode **full**

- work Offline and add tables and/or data to tables

- use the `exportToJson method` with a mode **partial** (meaning exporting everything since the last sync date)

- manage the transfer back to the server

- update the synchronization date locally when the transfer has been completed

- and so on with **partial** `importFromJson` and `exportToJson`
