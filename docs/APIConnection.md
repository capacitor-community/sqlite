<p align="center"><br><img src="https://user-images.githubusercontent.com/236501/85893648-1c92e880-b7a8-11ea-926d-95355b8175c7.png" width="128" height="128" /></p>
<h2 align="center">API CONNECTION DOCUMENTATION</h2>
<p align="center"><strong><code>@capacitor-community/sqlite</code></strong></p>
<p align="center">
  SQLite Connection Wrapper</p>

## Methods Index

<docgen-index>

* [`initWebStore()`](#initwebstore)
* [`saveToStore(...)`](#savetostore)
* [`getFromLocalDiskToStore(...)`](#getfromlocaldisktostore)
* [`saveToLocalDisk(...)`](#savetolocaldisk)
* [`echo(...)`](#echo)
* [`isSecretStored()`](#issecretstored)
* [`setEncryptionSecret(...)`](#setencryptionsecret)
* [`changeEncryptionSecret(...)`](#changeencryptionsecret)
* [`clearEncryptionSecret()`](#clearencryptionsecret)
* [`checkEncryptionSecret(...)`](#checkencryptionsecret)
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
* [`getFromHTTPRequest(...)`](#getfromhttprequest)
* [`isDatabaseEncrypted(...)`](#isdatabaseencrypted)
* [`isInConfigEncryption()`](#isinconfigencryption)
* [`isInConfigBiometricAuth()`](#isinconfigbiometricauth)
* [`isDatabase(...)`](#isdatabase)
* [`isNCDatabase(...)`](#isncdatabase)
* [`getDatabaseList()`](#getdatabaselist)
* [`getMigratableDbList(...)`](#getmigratabledblist)
* [`addSQLiteSuffix(...)`](#addsqlitesuffix)
* [`deleteOldDatabases(...)`](#deleteolddatabases)
* [`moveDatabasesAndAddSuffix(...)`](#movedatabasesandaddsuffix)
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


### getFromLocalDiskToStore(...)

```typescript
getFromLocalDiskToStore(overwrite: boolean) => Promise<void>
```

Get database from local disk and save it to store

| Param           | Type                 | Description |
| --------------- | -------------------- | ----------- |
| **`overwrite`** | <code>boolean</code> | : boolean   |

**Since:** 4.6.3

--------------------


### saveToLocalDisk(...)

```typescript
saveToLocalDisk(database: string) => Promise<void>
```

Save database to local disk

| Param          | Type                | Description |
| -------------- | ------------------- | ----------- |
| **`database`** | <code>string</code> | : string    |

**Since:** 4.6.3

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


### clearEncryptionSecret()

```typescript
clearEncryptionSecret() => Promise<void>
```

Clear the passphrase in a secure store

**Since:** 3.5.1

--------------------


### checkEncryptionSecret(...)

```typescript
checkEncryptionSecret(passphrase: string) => Promise<capSQLiteResult>
```

Check the passphrase stored in a secure store

| Param            | Type                |
| ---------------- | ------------------- |
| **`passphrase`** | <code>string</code> |

**Returns:** <code>Promise&lt;<a href="#capsqliteresult">capSQLiteResult</a>&gt;</code>

**Since:** 4.6.1

--------------------


### addUpgradeStatement(...)

```typescript
addUpgradeStatement(database: string, toVersion: number, statements: string[]) => Promise<void>
```

Add the upgrade Statement for database version upgrading

| Param            | Type                  |
| ---------------- | --------------------- |
| **`database`**   | <code>string</code>   |
| **`toVersion`**  | <code>number</code>   |
| **`statements`** | <code>string[]</code> |

**Since:** 2.9.0 refactor

--------------------


### createConnection(...)

```typescript
createConnection(database: string, encrypted: boolean, mode: string, version: number, readonly: boolean) => Promise<SQLiteDBConnection>
```

Create a connection to a database

| Param           | Type                 |
| --------------- | -------------------- |
| **`database`**  | <code>string</code>  |
| **`encrypted`** | <code>boolean</code> |
| **`mode`**      | <code>string</code>  |
| **`version`**   | <code>number</code>  |
| **`readonly`**  | <code>boolean</code> |

**Returns:** <code>Promise&lt;SQLiteDBConnection&gt;</code>

**Since:** 2.9.0 refactor

--------------------


### isConnection(...)

```typescript
isConnection(database: string, readonly: boolean) => Promise<capSQLiteResult>
```

Check if a connection exists

| Param          | Type                 |
| -------------- | -------------------- |
| **`database`** | <code>string</code>  |
| **`readonly`** | <code>boolean</code> |

**Returns:** <code>Promise&lt;<a href="#capsqliteresult">capSQLiteResult</a>&gt;</code>

**Since:** 3.0.0-beta.5

--------------------


### retrieveConnection(...)

```typescript
retrieveConnection(database: string, readonly: boolean) => Promise<SQLiteDBConnection>
```

Retrieve an existing database connection

| Param          | Type                 |
| -------------- | -------------------- |
| **`database`** | <code>string</code>  |
| **`readonly`** | <code>boolean</code> |

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
closeConnection(database: string, readonly: boolean) => Promise<void>
```

Close a database connection

| Param          | Type                 |
| -------------- | -------------------- |
| **`database`** | <code>string</code>  |
| **`readonly`** | <code>boolean</code> |

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


### getFromHTTPRequest(...)

```typescript
getFromHTTPRequest(url?: string | undefined, overwrite?: boolean | undefined) => Promise<void>
```

| Param           | Type                 |
| --------------- | -------------------- |
| **`url`**       | <code>string</code>  |
| **`overwrite`** | <code>boolean</code> |

**Since:** 4.1.1

--------------------


### isDatabaseEncrypted(...)

```typescript
isDatabaseEncrypted(database: string) => Promise<capSQLiteResult>
```

Check if a SQLite database is encrypted

| Param          | Type                |
| -------------- | ------------------- |
| **`database`** | <code>string</code> |

**Returns:** <code>Promise&lt;<a href="#capsqliteresult">capSQLiteResult</a>&gt;</code>

**Since:** 4.6.2-2

--------------------


### isInConfigEncryption()

```typescript
isInConfigEncryption() => Promise<capSQLiteResult>
```

Check encryption value in capacitor.config

**Returns:** <code>Promise&lt;<a href="#capsqliteresult">capSQLiteResult</a>&gt;</code>

**Since:** 4.6.2-2

--------------------


### isInConfigBiometricAuth()

```typescript
isInConfigBiometricAuth() => Promise<capSQLiteResult>
```

Check encryption value in capacitor.config

**Returns:** <code>Promise&lt;<a href="#capsqliteresult">capSQLiteResult</a>&gt;</code>

**Since:** 4.6.2-2

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


### moveDatabasesAndAddSuffix(...)

```typescript
moveDatabasesAndAddSuffix(folderPath?: string | undefined, dbNameList?: string[] | undefined) => Promise<void>
```

Moves databases to the location the plugin can read them, and adds sqlite suffix
This resembles calling addSQLiteSuffix and deleteOldDatabases, but it is more performant as it doesn't copy but moves the files

| Param            | Type                  | Description                                                                                                                                                       |
| ---------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`folderPath`** | <code>string</code>   | the origin from where to move the databases                                                                                                                       |
| **`dbNameList`** | <code>string[]</code> | the names of the databases to move, check out the getMigratableDbList to get a list, an empty list will result in copying all the databases with '.db' extension. |

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

| Prop         | Type               | Description                                                                              |
| ------------ | ------------------ | ---------------------------------------------------------------------------------------- |
| **`values`** | <code>any[]</code> | the data values list as an Array iOS the first row is the returned ios_columns name list |

</docgen-api>
