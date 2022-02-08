<p align="center"><br><img src="https://user-images.githubusercontent.com/236501/85893648-1c92e880-b7a8-11ea-926d-95355b8175c7.png" width="128" height="128" /></p>
<h2 align="center">API CONNECTION DOCUMENTATION</h2>
<p align="center"><strong><code>@capacitor-community/sqlite</code></strong></p>
<p align="center">
  SQLite Connection Wrapper</p>

## Methods Index

<docgen-index>

* [`initWebStore()`](#initwebstore)
* [`saveToStore(...)`](#savetostore)
* [`echo(...)`](#echo)
* [`isSecretStored()`](#issecretstored)
* [`setEncryptionSecret(...)`](#setencryptionsecret)
* [`changeEncryptionSecret(...)`](#changeencryptionsecret)
* [`addUpgradeStatement(...)`](#addupgradestatement)
* [`createConnection(...)`](#createconnection)
* [`isConnection(...)`](#isconnection)
* [`retrieveConnection(...)`](#retrieveconnection)
* [`retrieveAllConnections()`](#retrieveallconnections)
* [`closeConnection(...)`](#closeconnection)
* [`closeAllConnections()`](#closeallconnections)
* [`checkConnectionsConsistency()`](#checkconnectionsconsistency)
* [`getNCDatabasePath(...)`](#getncdatabasepath)
* [`createNCConnection(...)`](#createncconnection)
* [`closeNCConnection(...)`](#closencconnection)
* [`isNCConnection(...)`](#isncconnection)
* [`retrieveNCConnection(...)`](#retrievencconnection)
* [`importFromJson(...)`](#importfromjson)
* [`isJsonValid(...)`](#isjsonvalid)
* [`copyFromAssets(...)`](#copyfromassets)
* [`isDatabase(...)`](#isdatabase)
* [`isNCDatabase(...)`](#isncdatabase)
* [`getDatabaseList()`](#getdatabaselist)
* [`getMigratableDbList(...)`](#getmigratabledblist)
* [`addSQLiteSuffix(...)`](#addsqlitesuffix)
* [`deleteOldDatabases(...)`](#deleteolddatabases)
* [`initWebStore()`](#initwebstore)
* [`saveToStore(...)`](#savetostore)
* [`isSecretStored()`](#issecretstored)
* [`setEncryptionSecret(...)`](#setencryptionsecret)
* [`changeEncryptionSecret(...)`](#changeencryptionsecret)
* [`createConnection(...)`](#createconnection)
* [`closeConnection(...)`](#closeconnection)
* [`echo(...)`](#echo)
* [`open(...)`](#open)
* [`close(...)`](#close)
* [`getUrl(...)`](#geturl)
* [`getVersion(...)`](#getversion)
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
* [`copyFromAssets(...)`](#copyfromassets)
* [`getDatabaseList()`](#getdatabaselist)
* [`getMigratableDbList(...)`](#getmigratabledblist)
* [`addSQLiteSuffix(...)`](#addsqlitesuffix)
* [`deleteOldDatabases(...)`](#deleteolddatabases)
* [`checkConnectionsConsistency(...)`](#checkconnectionsconsistency)
* [`getNCDatabasePath(...)`](#getncdatabasepath)
* [`createNCConnection(...)`](#createncconnection)
* [`closeNCConnection(...)`](#closencconnection)
* [`isNCDatabase(...)`](#isncdatabase)
* [`getConnectionDBName()`](#getconnectiondbname)
* [`open()`](#open)
* [`close()`](#close)
* [`getUrl()`](#geturl)
* [`getVersion()`](#getversion)
* [`execute(...)`](#execute)
* [`query(...)`](#query)
* [`run(...)`](#run)
* [`executeSet(...)`](#executeset)
* [`isExists()`](#isexists)
* [`isDBOpen()`](#isdbopen)
* [`isTable(...)`](#istable)
* [`delete()`](#delete)
* [`createSyncTable()`](#createsynctable)
* [`setSyncDate(...)`](#setsyncdate)
* [`getSyncDate()`](#getsyncdate)
* [`exportToJson(...)`](#exporttojson)
* [Interfaces](#interfaces)

</docgen-index>

## API Connection Wrapper

<docgen-api class="custom-css">
<!--Update the source file JSDoc comments and rerun docgen to update the docs below-->

SQLiteConnection Interface

### initWebStore()

```typescript
initWebStore() => Promise<void>
```

Init the web store

**Since:** 3.2.3-1

--------------------


### saveToStore(...)

```typescript
saveToStore(database: string) => Promise<void>
```

Save the datbase to the web store

| Param          | Type                |
| -------------- | ------------------- |
| **`database`** | <code>string</code> |

**Since:** 3.2.3-1

--------------------


### echo(...)

```typescript
echo(value: string) => Promise<capEchoResult>
```

Echo a value

| Param       | Type                |
| ----------- | ------------------- |
| **`value`** | <code>string</code> |

**Returns:** <code>Promise&lt;<a href="#capechoresult">capEchoResult</a>&gt;</code>

**Since:** 2.9.0 refactor

--------------------


### isSecretStored()

```typescript
isSecretStored() => Promise<capSQLiteResult>
```

Check if a secret is stored

**Returns:** <code>Promise&lt;<a href="#capsqliteresult">capSQLiteResult</a>&gt;</code>

**Since:** 3.0.0-beta.13

--------------------


### setEncryptionSecret(...)

```typescript
setEncryptionSecret(passphrase: string) => Promise<void>
```

Set a passphrase in a secure store

| Param            | Type                |
| ---------------- | ------------------- |
| **`passphrase`** | <code>string</code> |

**Since:** 3.0.0-beta.13

--------------------


### changeEncryptionSecret(...)

```typescript
changeEncryptionSecret(passphrase: string, oldpassphrase: string) => Promise<void>
```

Change the passphrase in a secure store

| Param               | Type                |
| ------------------- | ------------------- |
| **`passphrase`**    | <code>string</code> |
| **`oldpassphrase`** | <code>string</code> |

**Since:** 3.0.0-beta.13

--------------------


### addUpgradeStatement(...)

```typescript
addUpgradeStatement(database: string, fromVersion: number, toVersion: number, statement: string, set?: capSQLiteSet[] | undefined) => Promise<void>
```

Add the upgrade Statement for database version upgrading

| Param             | Type                        |
| ----------------- | --------------------------- |
| **`database`**    | <code>string</code>         |
| **`fromVersion`** | <code>number</code>         |
| **`toVersion`**   | <code>number</code>         |
| **`statement`**   | <code>string</code>         |
| **`set`**         | <code>capSQLiteSet[]</code> |

**Since:** 2.9.0 refactor

--------------------


### createConnection(...)

```typescript
createConnection(database: string, encrypted: boolean, mode: string, version: number) => Promise<SQLiteDBConnection>
```

Create a connection to a database

| Param           | Type                 |
| --------------- | -------------------- |
| **`database`**  | <code>string</code>  |
| **`encrypted`** | <code>boolean</code> |
| **`mode`**      | <code>string</code>  |
| **`version`**   | <code>number</code>  |

**Returns:** <code>Promise&lt;SQLiteDBConnection&gt;</code>

**Since:** 2.9.0 refactor

--------------------


### isConnection(...)

```typescript
isConnection(database: string) => Promise<capSQLiteResult>
```

Check if a connection exists

| Param          | Type                |
| -------------- | ------------------- |
| **`database`** | <code>string</code> |

**Returns:** <code>Promise&lt;<a href="#capsqliteresult">capSQLiteResult</a>&gt;</code>

**Since:** 3.0.0-beta.5

--------------------


### retrieveConnection(...)

```typescript
retrieveConnection(database: string) => Promise<SQLiteDBConnection>
```

Retrieve an existing database connection

| Param          | Type                |
| -------------- | ------------------- |
| **`database`** | <code>string</code> |

**Returns:** <code>Promise&lt;SQLiteDBConnection&gt;</code>

**Since:** 2.9.0 refactor

--------------------


### retrieveAllConnections()

```typescript
retrieveAllConnections() => Promise<Map<string, SQLiteDBConnection>>
```

Retrieve all database connections

**Returns:** <code>Promise&lt;<a href="#map">Map</a>&lt;string, SQLiteDBConnection&gt;&gt;</code>

**Since:** 2.9.0 refactor

--------------------


### closeConnection(...)

```typescript
closeConnection(database: string) => Promise<void>
```

Close a database connection

| Param          | Type                |
| -------------- | ------------------- |
| **`database`** | <code>string</code> |

**Since:** 2.9.0 refactor

--------------------


### closeAllConnections()

```typescript
closeAllConnections() => Promise<void>
```

Close all database connections

**Since:** 2.9.0 refactor

--------------------


### checkConnectionsConsistency()

```typescript
checkConnectionsConsistency() => Promise<capSQLiteResult>
```

Check the consistency between Js Connections
and Native Connections
if inconsistency all connections are removed

**Returns:** <code>Promise&lt;<a href="#capsqliteresult">capSQLiteResult</a>&gt;</code>

**Since:** 3.0.0-beta.10

--------------------


### getNCDatabasePath(...)

```typescript
getNCDatabasePath(path: string, database: string) => Promise<capNCDatabasePathResult>
```

get a non-conformed database path

| Param          | Type                |
| -------------- | ------------------- |
| **`path`**     | <code>string</code> |
| **`database`** | <code>string</code> |

**Returns:** <code>Promise&lt;<a href="#capncdatabasepathresult">capNCDatabasePathResult</a>&gt;</code>

**Since:** 3.3.3-1

--------------------


### createNCConnection(...)

```typescript
createNCConnection(databasePath: string, version: number) => Promise<SQLiteDBConnection>
```

Create a non-conformed database connection

| Param              | Type                |
| ------------------ | ------------------- |
| **`databasePath`** | <code>string</code> |
| **`version`**      | <code>number</code> |

**Returns:** <code>Promise&lt;SQLiteDBConnection&gt;</code>

**Since:** 3.3.3-1

--------------------


### closeNCConnection(...)

```typescript
closeNCConnection(databasePath: string) => Promise<void>
```

Close a non-conformed database connection

| Param              | Type                |
| ------------------ | ------------------- |
| **`databasePath`** | <code>string</code> |

**Since:** 3.3.3-1

--------------------


### isNCConnection(...)

```typescript
isNCConnection(databasePath: string) => Promise<capSQLiteResult>
```

Check if a non-conformed databaseconnection exists

| Param              | Type                |
| ------------------ | ------------------- |
| **`databasePath`** | <code>string</code> |

**Returns:** <code>Promise&lt;<a href="#capsqliteresult">capSQLiteResult</a>&gt;</code>

**Since:** 3.3.3-1

--------------------


### retrieveNCConnection(...)

```typescript
retrieveNCConnection(databasePath: string) => Promise<SQLiteDBConnection>
```

Retrieve an existing non-conformed database connection

| Param              | Type                |
| ------------------ | ------------------- |
| **`databasePath`** | <code>string</code> |

**Returns:** <code>Promise&lt;SQLiteDBConnection&gt;</code>

**Since:** 3.3.3-1

--------------------


### importFromJson(...)

```typescript
importFromJson(jsonstring: string) => Promise<capSQLiteChanges>
```

Import a database From a JSON

| Param            | Type                | Description |
| ---------------- | ------------------- | ----------- |
| **`jsonstring`** | <code>string</code> | string      |

**Returns:** <code>Promise&lt;<a href="#capsqlitechanges">capSQLiteChanges</a>&gt;</code>

**Since:** 2.9.0 refactor

--------------------


### isJsonValid(...)

```typescript
isJsonValid(jsonstring: string) => Promise<capSQLiteResult>
```

Check the validity of a JSON Object

| Param            | Type                | Description |
| ---------------- | ------------------- | ----------- |
| **`jsonstring`** | <code>string</code> | string      |

**Returns:** <code>Promise&lt;<a href="#capsqliteresult">capSQLiteResult</a>&gt;</code>

**Since:** 2.9.0 refactor

--------------------


### copyFromAssets(...)

```typescript
copyFromAssets(overwrite?: boolean | undefined) => Promise<void>
```

Copy databases from public/assets/databases folder to application databases folder

| Param           | Type                 | Description   |
| --------------- | -------------------- | ------------- |
| **`overwrite`** | <code>boolean</code> | since 3.2.5-2 |

**Since:** 2.9.0 refactor

--------------------


### isDatabase(...)

```typescript
isDatabase(database: string) => Promise<capSQLiteResult>
```

Check if a database exists

| Param          | Type                |
| -------------- | ------------------- |
| **`database`** | <code>string</code> |

**Returns:** <code>Promise&lt;<a href="#capsqliteresult">capSQLiteResult</a>&gt;</code>

**Since:** 3.0.0-beta.5

--------------------


### isNCDatabase(...)

```typescript
isNCDatabase(databasePath: string) => Promise<capSQLiteResult>
```

Check if a non conformed database exists

| Param              | Type                |
| ------------------ | ------------------- |
| **`databasePath`** | <code>string</code> |

**Returns:** <code>Promise&lt;<a href="#capsqliteresult">capSQLiteResult</a>&gt;</code>

**Since:** 3.3.3-1

--------------------


### getDatabaseList()

```typescript
getDatabaseList() => Promise<capSQLiteValues>
```

Get the database list

**Returns:** <code>Promise&lt;<a href="#capsqlitevalues">capSQLiteValues</a>&gt;</code>

**Since:** 3.0.0-beta.5

--------------------


### getMigratableDbList(...)

```typescript
getMigratableDbList(folderPath: string) => Promise<capSQLiteValues>
```

Get the Migratable database list

| Param            | Type                | Description                                  |
| ---------------- | ------------------- | -------------------------------------------- |
| **`folderPath`** | <code>string</code> | : string // only iOS & Android since 3.2.4-2 |

**Returns:** <code>Promise&lt;<a href="#capsqlitevalues">capSQLiteValues</a>&gt;</code>

**Since:** 3.0.0-beta.5

--------------------


### addSQLiteSuffix(...)

```typescript
addSQLiteSuffix(folderPath?: string | undefined, dbNameList?: string[] | undefined) => Promise<void>
```

Add SQLIte Suffix to existing databases

| Param            | Type                  | Description   |
| ---------------- | --------------------- | ------------- |
| **`folderPath`** | <code>string</code>   |               |
| **`dbNameList`** | <code>string[]</code> | since 3.2.4-1 |

**Since:** 3.0.0-beta.5

--------------------


### deleteOldDatabases(...)

```typescript
deleteOldDatabases(folderPath?: string | undefined, dbNameList?: string[] | undefined) => Promise<void>
```

Delete Old Cordova databases

| Param            | Type                  | Description   |
| ---------------- | --------------------- | ------------- |
| **`folderPath`** | <code>string</code>   |               |
| **`dbNameList`** | <code>string[]</code> | since 3.2.4-1 |

**Since:** 3.0.0-beta.5

--------------------


### initWebStore()

```typescript
initWebStore() => Promise<void>
```

Initialize the web store

**Since:** 3.2.3-1

--------------------


### saveToStore(...)

```typescript
saveToStore(options: capSQLiteOptions) => Promise<void>
```

Save database to  the web store

| Param         | Type                                                          | Description                                        |
| ------------- | ------------------------------------------------------------- | -------------------------------------------------- |
| **`options`** | <code><a href="#capsqliteoptions">capSQLiteOptions</a></code> | : <a href="#capsqliteoptions">capSQLiteOptions</a> |

**Since:** 3.2.3-1

--------------------


### isSecretStored()

```typescript
isSecretStored() => Promise<capSQLiteResult>
```

Check if a passphrase exists in a secure store

**Returns:** <code>Promise&lt;<a href="#capsqliteresult">capSQLiteResult</a>&gt;</code>

**Since:** 3.0.0-beta.13

--------------------


### setEncryptionSecret(...)

```typescript
setEncryptionSecret(options: capSetSecretOptions) => Promise<void>
```

Store a passphrase in a secure store
Update the secret of previous encrypted databases with GlobalSQLite
!!! Only to be used once if you wish to encrypt database !!!

| Param         | Type                                                                | Description                                            |
| ------------- | ------------------------------------------------------------------- | ------------------------------------------------------ |
| **`options`** | <code><a href="#capsetsecretoptions">capSetSecretOptions</a></code> | <a href="#capsetsecretoptions">capSetSecretOptions</a> |

**Since:** 3.0.0-beta.13

--------------------


### changeEncryptionSecret(...)

```typescript
changeEncryptionSecret(options: capChangeSecretOptions) => Promise<void>
```

Change the passphrase in a secure store
Update the secret of previous encrypted databases with passphrase
in secure store

| Param         | Type                                                                      | Description                                                  |
| ------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **`options`** | <code><a href="#capchangesecretoptions">capChangeSecretOptions</a></code> | <a href="#capchangesecretoptions">capChangeSecretOptions</a> |

**Since:** 3.0.0-beta.13

--------------------


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


### getUrl(...)

```typescript
getUrl(options: capSQLiteOptions) => Promise<capSQLiteUrl>
```

GetUrl get the database Url

| Param         | Type                                                          | Description                                        |
| ------------- | ------------------------------------------------------------- | -------------------------------------------------- |
| **`options`** | <code><a href="#capsqliteoptions">capSQLiteOptions</a></code> | : <a href="#capsqliteoptions">capSQLiteOptions</a> |

**Returns:** <code>Promise&lt;<a href="#capsqliteurl">capSQLiteUrl</a>&gt;</code>

**Since:** 3.3.3-4

--------------------


### getVersion(...)

```typescript
getVersion(options: capSQLiteOptions) => Promise<capVersionResult>
```

Get a SQLite database version

| Param         | Type                                                          | Description                                        |
| ------------- | ------------------------------------------------------------- | -------------------------------------------------- |
| **`options`** | <code><a href="#capsqliteoptions">capSQLiteOptions</a></code> | : <a href="#capsqliteoptions">capSQLiteOptions</a> |

**Returns:** <code>Promise&lt;<a href="#capversionresult">capVersionResult</a>&gt;</code>

**Since:** 3.2.0

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


### copyFromAssets(...)

```typescript
copyFromAssets(options: capSQLiteFromAssetsOptions) => Promise<void>
```

Copy databases from public/assets/databases folder to application databases folder

| Param         | Type                                                                              | Description                         |
| ------------- | --------------------------------------------------------------------------------- | ----------------------------------- |
| **`options`** | <code><a href="#capsqlitefromassetsoptions">capSQLiteFromAssetsOptions</a></code> | : capSQLiteFromAssets since 3.2.5-2 |

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


### getMigratableDbList(...)

```typescript
getMigratableDbList(options: capSQLitePathOptions) => Promise<capSQLiteValues>
```

Get the Migratable database list

| Param         | Type                                                                  | Description                                                                                    |
| ------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **`options`** | <code><a href="#capsqlitepathoptions">capSQLitePathOptions</a></code> | : <a href="#capsqlitepathoptions">capSQLitePathOptions</a> // only iOS & Android since 3.2.4-2 |

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


### getNCDatabasePath(...)

```typescript
getNCDatabasePath(options: capNCDatabasePathOptions) => Promise<capNCDatabasePathResult>
```

get a non conformed database path

| Param         | Type                                                                          | Description                                                      |
| ------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| **`options`** | <code><a href="#capncdatabasepathoptions">capNCDatabasePathOptions</a></code> | <a href="#capncdatabasepathoptions">capNCDatabasePathOptions</a> |

**Returns:** <code>Promise&lt;<a href="#capncdatabasepathresult">capNCDatabasePathResult</a>&gt;</code>

**Since:** 3.3.3-1

--------------------


### createNCConnection(...)

```typescript
createNCConnection(options: capNCConnectionOptions) => Promise<void>
```

create a non conformed database connection

| Param         | Type                                                                      | Description                                                  |
| ------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **`options`** | <code><a href="#capncconnectionoptions">capNCConnectionOptions</a></code> | <a href="#capncconnectionoptions">capNCConnectionOptions</a> |

**Since:** 3.3.3-1

--------------------


### closeNCConnection(...)

```typescript
closeNCConnection(options: capNCOptions) => Promise<void>
```

close a non conformed database connection

| Param         | Type                                                  | Description                              |
| ------------- | ----------------------------------------------------- | ---------------------------------------- |
| **`options`** | <code><a href="#capncoptions">capNCOptions</a></code> | <a href="#capncoptions">capNCOptions</a> |

**Since:** 3.3.3-1

--------------------


### isNCDatabase(...)

```typescript
isNCDatabase(options: capNCOptions) => Promise<capSQLiteResult>
```

Check if a non conformed database exists without connection

| Param         | Type                                                  | Description                                |
| ------------- | ----------------------------------------------------- | ------------------------------------------ |
| **`options`** | <code><a href="#capncoptions">capNCOptions</a></code> | : <a href="#capncoptions">capNCOptions</a> |

**Returns:** <code>Promise&lt;<a href="#capsqliteresult">capSQLiteResult</a>&gt;</code>

**Since:** 3.3.3-1

--------------------


### getConnectionDBName()

```typescript
getConnectionDBName() => string
```

Get SQLite DB Connection DB name

**Returns:** <code>string</code>

**Since:** 2.9.0 refactor

--------------------


### open()

```typescript
open() => Promise<void>
```

Open a SQLite DB Connection

**Since:** 2.9.0 refactor

--------------------


### close()

```typescript
close() => Promise<void>
```

Close a SQLite DB Connection

**Since:** 2.9.0 refactor

--------------------


### getUrl()

```typescript
getUrl() => Promise<capSQLiteUrl>
```

Get Database Url

**Returns:** <code>Promise&lt;<a href="#capsqliteurl">capSQLiteUrl</a>&gt;</code>

**Since:** 3.3.3-4

--------------------


### getVersion()

```typescript
getVersion() => Promise<capVersionResult>
```

Get the a SQLite DB Version

**Returns:** <code>Promise&lt;<a href="#capversionresult">capVersionResult</a>&gt;</code>

**Since:** 3.2.0

--------------------


### execute(...)

```typescript
execute(statements: string, transaction?: boolean | undefined) => Promise<capSQLiteChanges>
```

Execute SQLite DB Connection Statements

| Param             | Type                 |
| ----------------- | -------------------- |
| **`statements`**  | <code>string</code>  |
| **`transaction`** | <code>boolean</code> |

**Returns:** <code>Promise&lt;<a href="#capsqlitechanges">capSQLiteChanges</a>&gt;</code>

**Since:** 2.9.0 refactor

--------------------


### query(...)

```typescript
query(statement: string, values?: any[] | undefined) => Promise<capSQLiteValues>
```

Execute SQLite DB Connection Query

| Param           | Type                | Description |
| --------------- | ------------------- | ----------- |
| **`statement`** | <code>string</code> |             |
| **`values`**    | <code>any[]</code>  | (optional)  |

**Returns:** <code>Promise&lt;<a href="#capsqlitevalues">capSQLiteValues</a>&gt;</code>

**Since:** 2.9.0 refactor

--------------------


### run(...)

```typescript
run(statement: string, values?: any[] | undefined, transaction?: boolean | undefined) => Promise<capSQLiteChanges>
```

Execute SQLite DB Connection Raw Statement

| Param             | Type                 | Description |
| ----------------- | -------------------- | ----------- |
| **`statement`**   | <code>string</code>  |             |
| **`values`**      | <code>any[]</code>   | (optional)  |
| **`transaction`** | <code>boolean</code> |             |

**Returns:** <code>Promise&lt;<a href="#capsqlitechanges">capSQLiteChanges</a>&gt;</code>

**Since:** 2.9.0 refactor

--------------------


### executeSet(...)

```typescript
executeSet(set: capSQLiteSet[], transaction?: boolean | undefined) => Promise<capSQLiteChanges>
```

Execute SQLite DB Connection Set

| Param             | Type                        |
| ----------------- | --------------------------- |
| **`set`**         | <code>capSQLiteSet[]</code> |
| **`transaction`** | <code>boolean</code>        |

**Returns:** <code>Promise&lt;<a href="#capsqlitechanges">capSQLiteChanges</a>&gt;</code>

**Since:** 2.9.0 refactor

--------------------


### isExists()

```typescript
isExists() => Promise<capSQLiteResult>
```

Check if a SQLite DB Connection exists

**Returns:** <code>Promise&lt;<a href="#capsqliteresult">capSQLiteResult</a>&gt;</code>

**Since:** 2.9.0 refactor

--------------------


### isDBOpen()

```typescript
isDBOpen() => Promise<capSQLiteResult>
```

Check if a SQLite database is opened

**Returns:** <code>Promise&lt;<a href="#capsqliteresult">capSQLiteResult</a>&gt;</code>

**Since:** 3.0.0-beta.5

--------------------


### isTable(...)

```typescript
isTable(table: string) => Promise<capSQLiteResult>
```

Check if a table exists

| Param       | Type                |
| ----------- | ------------------- |
| **`table`** | <code>string</code> |

**Returns:** <code>Promise&lt;<a href="#capsqliteresult">capSQLiteResult</a>&gt;</code>

**Since:** 3.0.0-beta.5

--------------------


### delete()

```typescript
delete() => Promise<void>
```

Delete a SQLite DB Connection

**Since:** 2.9.0 refactor

--------------------


### createSyncTable()

```typescript
createSyncTable() => Promise<capSQLiteChanges>
```

Create a synchronization table

**Returns:** <code>Promise&lt;<a href="#capsqlitechanges">capSQLiteChanges</a>&gt;</code>

**Since:** 2.9.0 refactor

--------------------


### setSyncDate(...)

```typescript
setSyncDate(syncdate: string) => Promise<void>
```

Set the synchronization date

| Param          | Type                |
| -------------- | ------------------- |
| **`syncdate`** | <code>string</code> |

**Since:** 2.9.0 refactor

--------------------


### getSyncDate()

```typescript
getSyncDate() => Promise<string>
```

Get the synchronization date

**Returns:** <code>Promise&lt;string&gt;</code>

**Since:** 2.9.0 refactor

--------------------


### exportToJson(...)

```typescript
exportToJson(mode: string) => Promise<capSQLiteJson>
```

Export the given database to a JSON Object

| Param      | Type                |
| ---------- | ------------------- |
| **`mode`** | <code>string</code> |

**Returns:** <code>Promise&lt;<a href="#capsqlitejson">capSQLiteJson</a>&gt;</code>

**Since:** 2.9.0 refactor

--------------------


### Interfaces


#### capEchoResult

| Prop        | Type                | Description     |
| ----------- | ------------------- | --------------- |
| **`value`** | <code>string</code> | String returned |


#### capSQLiteResult

| Prop         | Type                 | Description                                   |
| ------------ | -------------------- | --------------------------------------------- |
| **`result`** | <code>boolean</code> | result set to true when successful else false |


#### capSQLiteSet

| Prop            | Type                | Description                      |
| --------------- | ------------------- | -------------------------------- |
| **`statement`** | <code>string</code> | A statement                      |
| **`values`**    | <code>any[]</code>  | the data values list as an Array |


#### Map

| Prop       | Type                |
| ---------- | ------------------- |
| **`size`** | <code>number</code> |

| Method      | Signature                                                                                                      |
| ----------- | -------------------------------------------------------------------------------------------------------------- |
| **clear**   | () =&gt; void                                                                                                  |
| **delete**  | (key: K) =&gt; boolean                                                                                         |
| **forEach** | (callbackfn: (value: V, key: K, map: <a href="#map">Map</a>&lt;K, V&gt;) =&gt; void, thisArg?: any) =&gt; void |
| **get**     | (key: K) =&gt; V \| undefined                                                                                  |
| **has**     | (key: K) =&gt; boolean                                                                                         |
| **set**     | (key: K, value: V) =&gt; this                                                                                  |


#### capNCDatabasePathResult

| Prop       | Type                | Description     |
| ---------- | ------------------- | --------------- |
| **`path`** | <code>string</code> | String returned |


#### capSQLiteChanges

| Prop          | Type                                        | Description                               |
| ------------- | ------------------------------------------- | ----------------------------------------- |
| **`changes`** | <code><a href="#changes">Changes</a></code> | a returned <a href="#changes">Changes</a> |


#### Changes

| Prop          | Type                | Description                                          |
| ------------- | ------------------- | ---------------------------------------------------- |
| **`changes`** | <code>number</code> | the number of changes from an execute or run command |
| **`lastId`**  | <code>number</code> | the lastId created from a run command                |


#### capSQLiteValues

| Prop         | Type               | Description                      |
| ------------ | ------------------ | -------------------------------- |
| **`values`** | <code>any[]</code> | the data values list as an Array |


#### capSQLiteOptions

| Prop           | Type                | Description       |
| -------------- | ------------------- | ----------------- |
| **`database`** | <code>string</code> | The database name |


#### capSetSecretOptions

| Prop             | Type                | Description                            |
| ---------------- | ------------------- | -------------------------------------- |
| **`passphrase`** | <code>string</code> | The passphrase for Encrypted Databases |


#### capChangeSecretOptions

| Prop                | Type                | Description                                |
| ------------------- | ------------------- | ------------------------------------------ |
| **`passphrase`**    | <code>string</code> | The new passphrase for Encrypted Databases |
| **`oldpassphrase`** | <code>string</code> | The old passphrase for Encrypted Databases |


#### capConnectionOptions

| Prop            | Type                 | Description                                                                |
| --------------- | -------------------- | -------------------------------------------------------------------------- |
| **`database`**  | <code>string</code>  | The database name                                                          |
| **`version`**   | <code>number</code>  | The database version                                                       |
| **`encrypted`** | <code>boolean</code> | Set to true (database encryption) / false                                  |
| **`mode`**      | <code>string</code>  | Set the mode for database encryption ["encryption", "secret", "newsecret"] |


#### capEchoOptions

| Prop        | Type                | Description         |
| ----------- | ------------------- | ------------------- |
| **`value`** | <code>string</code> | String to be echoed |


#### capSQLiteUrl

| Prop      | Type                | Description    |
| --------- | ------------------- | -------------- |
| **`url`** | <code>string</code> | a returned url |


#### capVersionResult

| Prop          | Type                | Description     |
| ------------- | ------------------- | --------------- |
| **`version`** | <code>number</code> | Number returned |


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


#### capSQLiteRunOptions

| Prop              | Type                 | Description                                         | Since         |
| ----------------- | -------------------- | --------------------------------------------------- | ------------- |
| **`database`**    | <code>string</code>  | The database name                                   |               |
| **`statement`**   | <code>string</code>  | A statement                                         |               |
| **`values`**      | <code>any[]</code>   | A set of values for a statement                     |               |
| **`transaction`** | <code>boolean</code> | Enable / Disable transactions default Enable (true) | 3.0.0-beta.10 |


#### capSQLiteQueryOptions

| Prop            | Type                | Description                                     | Since         |
| --------------- | ------------------- | ----------------------------------------------- | ------------- |
| **`database`**  | <code>string</code> | The database name                               |               |
| **`statement`** | <code>string</code> | A statement                                     |               |
| **`values`**    | <code>any[]</code>  | A set of values for a statement Change to any[] | 3.0.0-beta.11 |


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
| **`views`**     | <code>JsonView[]</code>  | * Array of View (<a href="#jsonview">JsonView</a>)    |


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


#### JsonView

| Prop        | Type                | Description               |
| ----------- | ------------------- | ------------------------- |
| **`name`**  | <code>string</code> | The view name             |
| **`value`** | <code>string</code> | The view create statement |


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


#### capSQLiteFromAssetsOptions

| Prop            | Type                 | Description                                                                      |
| --------------- | -------------------- | -------------------------------------------------------------------------------- |
| **`overwrite`** | <code>boolean</code> | Set the overwrite mode for the copy from assets "true"/"false" default to "true" |


#### capSQLitePathOptions

| Prop             | Type                  | Description                                                                                                              |
| ---------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **`folderPath`** | <code>string</code>   | The folder path of existing databases If not given folder path is "default"                                              |
| **`dbNameList`** | <code>string[]</code> | The database name's list to be copied and/or deleted since 3.2.4-1 If not given all databases in the specify folder path |


#### capAllConnectionsOptions

| Prop          | Type                  | Description                   | Since         |
| ------------- | --------------------- | ----------------------------- | ------------- |
| **`dbNames`** | <code>string[]</code> | the dbName of all connections | 3.0.0-beta.10 |


#### capNCDatabasePathOptions

| Prop           | Type                | Description       |
| -------------- | ------------------- | ----------------- |
| **`path`**     | <code>string</code> | the database path |
| **`database`** | <code>string</code> | The database name |


#### capNCConnectionOptions

| Prop               | Type                | Description          |
| ------------------ | ------------------- | -------------------- |
| **`databasePath`** | <code>string</code> | The database path    |
| **`version`**      | <code>number</code> | The database version |


#### capNCOptions

| Prop               | Type                | Description       |
| ------------------ | ------------------- | ----------------- |
| **`databasePath`** | <code>string</code> | The database path |

</docgen-api>
