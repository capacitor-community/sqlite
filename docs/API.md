<p align="center"><br><img src="https://user-images.githubusercontent.com/236501/85893648-1c92e880-b7a8-11ea-926d-95355b8175c7.png" width="128" height="128" /></p>
<h2 align="center">API PLUGIN DOCUMENTATION</h2>
<p align="center"><strong><code>@capacitor-community/sqlite</code></strong></p>
<p align="center">
  Capacitor community plugin for Native and Electron SQLite Databases. For <strong>Native</strong> and <strong>Electron</strong> platforms, databases could be encrypted with SQLCipher</p>

## Plugin Wrappers

To easy the way to use the `@capacitor-community/sqlite` plugin and its ability to be used in conjunction with other plugins (`typeorm`, `spatialite`, ...), two connection wrappers have been associated.

- [API_Connection_Wrapper_Documentation](https://github.com/capacitor-community/sqlite/blob/master/docs/APIConnection.md)

- [API_DB_Connection_Wrapper_Documentation](https://github.com/capacitor-community/sqlite/blob/master/docs/APIDBConnection.md)

## SQLite Commands Within the Plugin

 - SQLite Data Definition Language commands (such as CREATE, ALTER, DROP) should be executed using the `execute` plugin method.

 - SQLite Transaction Control commands (including BEGIN TRANSACTION, COMMIT, ROLLBACK) should also be executed using the `execute` plugin method.

 - SQLite Data Manipulation Language commands (like INSERT, UPDATE, DELETE, REPLACE) should use the `run` plugin method if they involve bind values. They can utilize either the `execute` or `run` plugin methods if no bind values are involved.

 - SQLite Data Query Language commands (SELECT) should be executed using the `query` plugin method.

 - SQLite Special commands (PRAGMA) should be executed using the `execute` plugin method.
 
## Databases Location

The plugin add a suffix "SQLite" and an extension ".db" to the database name given as options in the `capConnectionOptions` or `capSQLiteOptions` ie (fooDB -> fooDBSQLite.db). If the name given contains the extension `.db` it will be removed ie (foo.db) will become internally (fooSQLite.db) after adding the suffix. 

### Android

- **in data/data/YOUR_PACKAGE/databases**

### IOS

- **in the Documents folder of YOUR_APPLICATION**
- **or in the folder specified by the capacitor.config.ts file of YOUR_APPLICATION since 3.3.3-2**
  In that case the databases will not be not visible to iTunes and not backed up to iCloud.
  ```ts
  const config: CapacitorConfig = {
    appId: 'io.ionic.starter',
    appName: 'testreact',
    webDir: 'build',
    bundledWebRuntime: false,
    plugins: {
      CapacitorSQLite: {
        "iosDatabaseLocation": "Library/CapacitorDatabase"
      }
    }
  };
  ```

### Electron

- since **2.4.2-1** the databases location is : **User/Databases/APP_NAME/**

- since **3.4.1** the databases location can be set in `the config.config.ts` as followed:

  - for sharing databases between users:

    ```ts 
    plugins: {
      CapacitorSQLite: {
        electronMacLocation: "/YOUR_DATABASES_PATH",
        electronWindowsLocation: "C:\\ProgramData\\CapacitorDatabases",
        electronLinuxLocation: "/home/CapacitorDatabases"
      }
    }
    ``` 

  - for only the user in its Home folder: **User/Databases/APP_NAME/**

    ``` 
    Plugins: {
      CapacitorSQLite: {
        electronMacLocation: "Databases",
        electronWindowsLocation: "Databases",
        electronLinuxLocation: "Databases"
      }
    }
    ``` 
    You can replace "Databases" by your "YOUR_DATABASES_LOCATION", but it MUST not have any "/" or "\\" characters.

  For existing databases, YOU MUST COPY old databases to the new location
  You MUST remove the Electron folder and add it again. 

### Web

- the database is stored in Web browser INDEXEDDB storage as a `localforage` store under the `jeepSqliteStore` name and `databases` table name.

## Comments within SQL statements

 - see [Comments within SQL](https://www.techonthenet.com/sqlite/comments.php)

 - Some examples 

 ```ts
  const setContacts: Array<capSQLiteSet>  = [
    { statement:"INSERT INTO contacts /* Contact Simpson */ (name,FirstName,email,company,age,MobileNumber) VALUES (?,?,?,?,?,?);",
      values:["Simpson","Tom","Simpson@example.com",,69,"4405060708"]
    },
    { statement:"INSERT INTO contacts /* three more contacts */ (name,FirstName,email,company,age,MobileNumber) VALUES (?,?,?,?,?,?) -- Add Jones, Whiteley and Brown;",
      values:[
        ["Jones","David","Jones@example.com",,42.1,"4404030201"],
        ["Whiteley","Dave","Whiteley@example.com",,45.3,"4405162732"],
        ["Brown","John","Brown@example.com",,35,"4405243853"]
      ]
    },
    { statement:"UPDATE contacts SET age = ? , MobileNumber = ? WHERE id = ? -- Update Jones Contact;",
      values:[51.4,"4404030202",6]
    }
  ];
  const setMessages: Array<capSQLiteSet>  = [
    { statement:`
    /* Define the messages table */
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY NOT NULL,
      contactid INTEGER, -- key to contacts(id)
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      last_modified INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (contactid) REFERENCES contacts(id) ON DELETE SET DEFAULT
    );`,
      values:[]
    },
  ];

  let insertQuery = 'INSERT INTO contacts (name,FirstName,email,company,age,MobileNumber) VALUES (?, ?, ?, ?, ?, ?) -- Add Sue Hellen;';
  let bindValues = ["Hellen","Sue","sue.hellen@example.com",,42,"4406050807"];
  let ret = await db.run(insertQuery, bindValues);
  console.log(`>>> run ret 1: ${JSON.stringify(ret)}`)
  insertQuery = `INSERT INTO contacts /* some contacts */ (name,FirstName,email,company,age,MobileNumber) VALUES 
      ('Doe','John','john.doe@example.com', 'IBM', 30, '4403050926'), -- add Doe
      ('Watson','Dave','dave.watson@example.com','Apple', 30, '4407050932') /* add Watson */,
      ('Smith', 'Jane', 'jane.smith@example.com', 'IBM', 27, '33607556142') /* Add Smith */-- End of add contact;`;
  bindValues = [];
  ret = await db.run(insertQuery, bindValues);
  console.log(`>>> run ret 2: ${JSON.stringify(ret)}`)

  let selectQuery = "SELECT * /* all columns */ FROM contacts WHERE company = 'IBM' -- for company IBM;";

  ret = await db.query(selectQuery);
  console.log(`>>> query "IBM" ret: ${JSON.stringify(ret)}`)

  ret = await db.executeSet(setContacts);
  console.log(`>>> executeSet 1 ret: ${JSON.stringify(ret)}`)

  selectQuery = "SELECT email /* only email */ FROM contacts WHERE company ISNULL -- for company not given;";


  ret = await db.executeSet(setMessages);
  console.log(`>>> executeSet 2 ret: ${JSON.stringify(ret)}`)
```

## Unexpected behaviours

Unexpected or erroneous behaviour users of this library have encountered.

### 1. Running multiple update statements in one statement

<ins>The Problem:</ins>

In https://github.com/capacitor-community/sqlite/issues/393 a user of this library
experienced bugs when running a statement that itself contained multiple update statements.

The statement executed fine on the web version of this library (sql-wasm.wasm).

But on android and IOS only some updates took place, some updates were ignored and did not take effect in the database.

<ins>The Solution:</ins>

When running multiple update statements and experiencing such errors, try running them in separate single statements and await (Promise) each statement to finish running before running the next statement.

Note that in general in SQLite this is not recommended, since it makes your queries take a bit longer.

## Write-Ahead Logging (WAL)

 - Electron, Web platforms only WAL journal_mode is implemented

 - Both WAL and WAL2 journal_mode are implemented

 - Android WAL2 is set by default, so you do not need to set it up

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

* [`initWebStore()`](#initwebstore)
* [`saveToStore(...)`](#savetostore)
* [`getFromLocalDiskToStore(...)`](#getfromlocaldisktostore)
* [`saveToLocalDisk(...)`](#savetolocaldisk)
* [`isSecretStored()`](#issecretstored)
* [`setEncryptionSecret(...)`](#setencryptionsecret)
* [`changeEncryptionSecret(...)`](#changeencryptionsecret)
* [`clearEncryptionSecret()`](#clearencryptionsecret)
* [`checkEncryptionSecret(...)`](#checkencryptionsecret)
* [`createConnection(...)`](#createconnection)
* [`closeConnection(...)`](#closeconnection)
* [`echo(...)`](#echo)
* [`open(...)`](#open)
* [`close(...)`](#close)
* [`beginTransaction(...)`](#begintransaction)
* [`commitTransaction(...)`](#committransaction)
* [`rollbackTransaction(...)`](#rollbacktransaction)
* [`isTransactionActive(...)`](#istransactionactive)
* [`getUrl(...)`](#geturl)
* [`getVersion(...)`](#getversion)
* [`execute(...)`](#execute)
* [`executeSet(...)`](#executeset)
* [`run(...)`](#run)
* [`query(...)`](#query)
* [`isDBExists(...)`](#isdbexists)
* [`isDBOpen(...)`](#isdbopen)
* [`isDatabaseEncrypted(...)`](#isdatabaseencrypted)
* [`isInConfigEncryption()`](#isinconfigencryption)
* [`isInConfigBiometricAuth()`](#isinconfigbiometricauth)
* [`isDatabase(...)`](#isdatabase)
* [`isTableExists(...)`](#istableexists)
* [`deleteDatabase(...)`](#deletedatabase)
* [`isJsonValid(...)`](#isjsonvalid)
* [`importFromJson(...)`](#importfromjson)
* [`exportToJson(...)`](#exporttojson)
* [`createSyncTable(...)`](#createsynctable)
* [`setSyncDate(...)`](#setsyncdate)
* [`getSyncDate(...)`](#getsyncdate)
* [`deleteExportedRows(...)`](#deleteexportedrows)
* [`addUpgradeStatement(...)`](#addupgradestatement)
* [`copyFromAssets(...)`](#copyfromassets)
* [`getFromHTTPRequest(...)`](#getfromhttprequest)
* [`getDatabaseList()`](#getdatabaselist)
* [`getTableList(...)`](#gettablelist)
* [`getMigratableDbList(...)`](#getmigratabledblist)
* [`addSQLiteSuffix(...)`](#addsqlitesuffix)
* [`deleteOldDatabases(...)`](#deleteolddatabases)
* [`moveDatabasesAndAddSuffix(...)`](#movedatabasesandaddsuffix)
* [`checkConnectionsConsistency(...)`](#checkconnectionsconsistency)
* [`getNCDatabasePath(...)`](#getncdatabasepath)
* [`createNCConnection(...)`](#createncconnection)
* [`closeNCConnection(...)`](#closencconnection)
* [`isNCDatabase(...)`](#isncdatabase)
* [Interfaces](#interfaces)

</docgen-index>
* [Listeners](#listeners)

## API Plugin

<docgen-api>
<!--Update the source file JSDoc comments and rerun docgen to update the docs below-->

CapacitorSQLitePlugin Interface

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


### getFromLocalDiskToStore(...)

```typescript
getFromLocalDiskToStore(options: capSQLiteLocalDiskOptions) => Promise<void>
```

Get database from local disk and save it to store

| Param         | Type                                                                            | Description                                                          |
| ------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **`options`** | <code><a href="#capsqlitelocaldiskoptions">capSQLiteLocalDiskOptions</a></code> | : <a href="#capsqlitelocaldiskoptions">capSQLiteLocalDiskOptions</a> |

**Since:** 4.6.3

--------------------


### saveToLocalDisk(...)

```typescript
saveToLocalDisk(options: capSQLiteOptions) => Promise<void>
```

Save database to local disk

| Param         | Type                                                          | Description                                        |
| ------------- | ------------------------------------------------------------- | -------------------------------------------------- |
| **`options`** | <code><a href="#capsqliteoptions">capSQLiteOptions</a></code> | : <a href="#capsqliteoptions">capSQLiteOptions</a> |

**Since:** 4.6.3

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


### clearEncryptionSecret()

```typescript
clearEncryptionSecret() => Promise<void>
```

Clear the passphrase in the secure store

**Since:** 3.5.1

--------------------


### checkEncryptionSecret(...)

```typescript
checkEncryptionSecret(options: capSetSecretOptions) => Promise<capSQLiteResult>
```

Check encryption passphrase

| Param         | Type                                                                |
| ------------- | ------------------------------------------------------------------- |
| **`options`** | <code><a href="#capsetsecretoptions">capSetSecretOptions</a></code> |

**Returns:** <code>Promise&lt;<a href="#capsqliteresult">capSQLiteResult</a>&gt;</code>

**Since:** 4.6.1

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

Opens a SQLite database.
Attention: This re-opens a database if it's already open!

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


### beginTransaction(...)

```typescript
beginTransaction(options: capSQLiteOptions) => Promise<capSQLiteChanges>
```

Begin Database Transaction

| Param         | Type                                                          |
| ------------- | ------------------------------------------------------------- |
| **`options`** | <code><a href="#capsqliteoptions">capSQLiteOptions</a></code> |

**Returns:** <code>Promise&lt;<a href="#capsqlitechanges">capSQLiteChanges</a>&gt;</code>

**Since:** 5.0.7

--------------------


### commitTransaction(...)

```typescript
commitTransaction(options: capSQLiteOptions) => Promise<capSQLiteChanges>
```

Commit Database Transaction

| Param         | Type                                                          |
| ------------- | ------------------------------------------------------------- |
| **`options`** | <code><a href="#capsqliteoptions">capSQLiteOptions</a></code> |

**Returns:** <code>Promise&lt;<a href="#capsqlitechanges">capSQLiteChanges</a>&gt;</code>

**Since:** 5.0.7

--------------------


### rollbackTransaction(...)

```typescript
rollbackTransaction(options: capSQLiteOptions) => Promise<capSQLiteChanges>
```

Rollback Database Transaction

| Param         | Type                                                          |
| ------------- | ------------------------------------------------------------- |
| **`options`** | <code><a href="#capsqliteoptions">capSQLiteOptions</a></code> |

**Returns:** <code>Promise&lt;<a href="#capsqlitechanges">capSQLiteChanges</a>&gt;</code>

**Since:** 5.0.7

--------------------


### isTransactionActive(...)

```typescript
isTransactionActive(options: capSQLiteOptions) => Promise<capSQLiteResult>
```

Is Database Transaction Active

| Param         | Type                                                          |
| ------------- | ------------------------------------------------------------- |
| **`options`** | <code><a href="#capsqliteoptions">capSQLiteOptions</a></code> |

**Returns:** <code>Promise&lt;<a href="#capsqliteresult">capSQLiteResult</a>&gt;</code>

**Since:** 5.0.7

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


### isDatabaseEncrypted(...)

```typescript
isDatabaseEncrypted(options: capSQLiteOptions) => Promise<capSQLiteResult>
```

Check if a SQLite database is encrypted

| Param         | Type                                                          | Description                                        |
| ------------- | ------------------------------------------------------------- | -------------------------------------------------- |
| **`options`** | <code><a href="#capsqliteoptions">capSQLiteOptions</a></code> | : <a href="#capsqliteoptions">capSQLiteOptions</a> |

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


### deleteExportedRows(...)

```typescript
deleteExportedRows(options: capSQLiteOptions) => Promise<void>
```

Remove rows with sql_deleted = 1 after an export

| Param         | Type                                                          |
| ------------- | ------------------------------------------------------------- |
| **`options`** | <code><a href="#capsqliteoptions">capSQLiteOptions</a></code> |

**Since:** 3.4.3-2

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


### getFromHTTPRequest(...)

```typescript
getFromHTTPRequest(options: capSQLiteHTTPOptions) => Promise<void>
```

Get database or zipped database(s) from url

| Param         | Type                                                                  | Description                                                |
| ------------- | --------------------------------------------------------------------- | ---------------------------------------------------------- |
| **`options`** | <code><a href="#capsqlitehttpoptions">capSQLiteHTTPOptions</a></code> | : <a href="#capsqlitehttpoptions">capSQLiteHTTPOptions</a> |

**Since:** 4.1.1

--------------------


### getDatabaseList()

```typescript
getDatabaseList() => Promise<capSQLiteValues>
```

Get the database list

**Returns:** <code>Promise&lt;<a href="#capsqlitevalues">capSQLiteValues</a>&gt;</code>

**Since:** 3.0.0-beta.5

--------------------


### getTableList(...)

```typescript
getTableList(options: capSQLiteOptions) => Promise<capSQLiteValues>
```

Get the database's table list

| Param         | Type                                                          |
| ------------- | ------------------------------------------------------------- |
| **`options`** | <code><a href="#capsqliteoptions">capSQLiteOptions</a></code> |

**Returns:** <code>Promise&lt;<a href="#capsqlitevalues">capSQLiteValues</a>&gt;</code>

**Since:** 3.4.2-3

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


### moveDatabasesAndAddSuffix(...)

```typescript
moveDatabasesAndAddSuffix(options: capSQLitePathOptions) => Promise<void>
```

Moves databases to the location the plugin can read them, and adds sqlite suffix
This resembles calling addSQLiteSuffix and deleteOldDatabases, but it is more performant as it doesn't copy but moves the files

| Param         | Type                                                                  | Description                                                |
| ------------- | --------------------------------------------------------------------- | ---------------------------------------------------------- |
| **`options`** | <code><a href="#capsqlitepathoptions">capSQLitePathOptions</a></code> | : <a href="#capsqlitepathoptions">capSQLitePathOptions</a> |

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


### Interfaces


#### capSQLiteOptions

| Prop           | Type                 | Description                                      |
| -------------- | -------------------- | ------------------------------------------------ |
| **`database`** | <code>string</code>  | The database name                                |
| **`readonly`** | <code>boolean</code> | Set to true (database in read-only mode) / false |


#### capSQLiteLocalDiskOptions

| Prop            | Type                 | Description                                                                                              |
| --------------- | -------------------- | -------------------------------------------------------------------------------------------------------- |
| **`overwrite`** | <code>boolean</code> | Set the overwrite mode for saving the database from local disk to store "true"/"false" default to "true" |


#### capSQLiteResult

| Prop         | Type                 | Description                                   |
| ------------ | -------------------- | --------------------------------------------- |
| **`result`** | <code>boolean</code> | result set to true when successful else false |


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
| **`readonly`**  | <code>boolean</code> | Set to true (database in read-only mode) / false                           |


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
| **`values`**  | <code>any[]</code>  | values when RETURNING                                |


#### capSQLiteUrl

| Prop      | Type                | Description    |
| --------- | ------------------- | -------------- |
| **`url`** | <code>string</code> | a returned url |


#### capVersionResult

| Prop          | Type                | Description     |
| ------------- | ------------------- | --------------- |
| **`version`** | <code>number</code> | Number returned |


#### capSQLiteExecuteOptions

| Prop              | Type                 | Description                                          | Since         |
| ----------------- | -------------------- | ---------------------------------------------------- | ------------- |
| **`database`**    | <code>string</code>  | The database name                                    |               |
| **`statements`**  | <code>string</code>  | The batch of raw SQL statements as string            |               |
| **`transaction`** | <code>boolean</code> | Enable / Disable transactions default Enable (true)  | 3.0.0-beta.10 |
| **`readonly`**    | <code>boolean</code> | ReadOnly / ReadWrite default ReadWrite (false)       | 4.1.0-7       |
| **`isSQL92`**     | <code>boolean</code> | Compatibility SQL92 !!! ELECTRON ONLY default (true) | 5.0.7         |


#### capSQLiteSetOptions

| Prop              | Type                        | Description                                                            | Since         |
| ----------------- | --------------------------- | ---------------------------------------------------------------------- | ------------- |
| **`database`**    | <code>string</code>         | The database name                                                      |               |
| **`set`**         | <code>capSQLiteSet[]</code> | The batch of raw SQL statements as Array of capSQLLiteSet              |               |
| **`transaction`** | <code>boolean</code>        | Enable / Disable transactions default Enable (true)                    | 3.0.0-beta.10 |
| **`readonly`**    | <code>boolean</code>        | ReadOnly / ReadWrite default ReadWrite (false)                         | 4.1.0-7       |
| **`returnMode`**  | <code>string</code>         | return mode default 'no' value 'all' value 'one' for Electron platform | 5.0.5-3       |
| **`isSQL92`**     | <code>boolean</code>        | Compatibility SQL92 !!! ELECTRON ONLY default (true)                   | 5.0.7         |


#### capSQLiteSet

| Prop            | Type                | Description                      |
| --------------- | ------------------- | -------------------------------- |
| **`statement`** | <code>string</code> | A statement                      |
| **`values`**    | <code>any[]</code>  | the data values list as an Array |


#### capSQLiteRunOptions

| Prop              | Type                 | Description                                                            | Since         |
| ----------------- | -------------------- | ---------------------------------------------------------------------- | ------------- |
| **`database`**    | <code>string</code>  | The database name                                                      |               |
| **`statement`**   | <code>string</code>  | A statement                                                            |               |
| **`values`**      | <code>any[]</code>   | A set of values for a statement                                        |               |
| **`transaction`** | <code>boolean</code> | Enable / Disable transactions default Enable (true)                    | 3.0.0-beta.10 |
| **`readonly`**    | <code>boolean</code> | ReadOnly / ReadWrite default ReadWrite (false)                         | 4.1.0-7       |
| **`returnMode`**  | <code>string</code>  | return mode default 'no' value 'all' value 'one' for Electron platform | 5.0.5-3       |
| **`isSQL92`**     | <code>boolean</code> | Compatibility SQL92 !!! ELECTRON ONLY default (true)                   | 5.0.7         |


#### capSQLiteValues

| Prop         | Type               | Description                                                                              |
| ------------ | ------------------ | ---------------------------------------------------------------------------------------- |
| **`values`** | <code>any[]</code> | the data values list as an Array iOS the first row is the returned ios_columns name list |


#### capSQLiteQueryOptions

| Prop            | Type                 | Description                                          | Since         |
| --------------- | -------------------- | ---------------------------------------------------- | ------------- |
| **`database`**  | <code>string</code>  | The database name                                    |               |
| **`statement`** | <code>string</code>  | A statement                                          |               |
| **`values`**    | <code>any[]</code>   | A set of values for a statement Change to any[]      | 3.0.0-beta.11 |
| **`readonly`**  | <code>boolean</code> | ReadOnly / ReadWrite default ReadWrite (false)       | 4.1.0-7       |
| **`isSQL92`**   | <code>boolean</code> | Compatibility SQL92 !!! ELECTRON ONLY default (true) | 5.0.7         |


#### capSQLiteTableOptions

| Prop           | Type                 | Description                                    | Since   |
| -------------- | -------------------- | ---------------------------------------------- | ------- |
| **`database`** | <code>string</code>  | The database name                              |         |
| **`table`**    | <code>string</code>  | The table name                                 |         |
| **`readonly`** | <code>boolean</code> | ReadOnly / ReadWrite default ReadWrite (false) | 4.1.0-7 |


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
| **`overwrite`** | <code>boolean</code>     | Delete the database prior to import (default false)   |
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

| Prop                 | Type                 | Description                                                                                                                  | Since   |
| -------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------- |
| **`database`**       | <code>string</code>  | The database name                                                                                                            |         |
| **`jsonexportmode`** | <code>string</code>  | Set the mode to export JSON Object: "full" or "partial"                                                                      |         |
| **`readonly`**       | <code>boolean</code> | ReadOnly / ReadWrite default ReadWrite (false)                                                                               | 4.1.0-7 |
| **`encrypted`**      | <code>boolean</code> | Encrypted When your database is encrypted Choose the export Json Object Encrypted (true) / Unencrypted (false) default false | 5.0.8   |


#### capSQLiteSyncDateOptions

| Prop           | Type                 | Description                                                    | Since   |
| -------------- | -------------------- | -------------------------------------------------------------- | ------- |
| **`database`** | <code>string</code>  | The database name                                              |         |
| **`syncdate`** | <code>string</code>  | Set the synchronization date Format yyyy-MM-dd'T'HH:mm:ss.SSSZ |         |
| **`readonly`** | <code>boolean</code> | ReadOnly / ReadWrite default ReadWrite (false)                 | 4.1.0-7 |


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

| Prop             | Type                  |
| ---------------- | --------------------- |
| **`toVersion`**  | <code>number</code>   |
| **`statements`** | <code>string[]</code> |


#### capSQLiteFromAssetsOptions

| Prop            | Type                 | Description                                                                      |
| --------------- | -------------------- | -------------------------------------------------------------------------------- |
| **`overwrite`** | <code>boolean</code> | Set the overwrite mode for the copy from assets "true"/"false" default to "true" |


#### capSQLiteHTTPOptions

| Prop            | Type                 | Description                                                                      |
| --------------- | -------------------- | -------------------------------------------------------------------------------- |
| **`url`**       | <code>string</code>  | The url of the database or the zipped database(s)                                |
| **`overwrite`** | <code>boolean</code> | Set the overwrite mode for the copy from assets "true"/"false" default to "true" |


#### capSQLitePathOptions

| Prop             | Type                  | Description                                                                                                              |
| ---------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **`folderPath`** | <code>string</code>   | The folder path of existing databases If not given folder path is "default"                                              |
| **`dbNameList`** | <code>string[]</code> | The database name's list to be copied and/or deleted since 3.2.4-1 If not given all databases in the specify folder path |


#### capAllConnectionsOptions

| Prop            | Type                  | Description                                                      | Since         |
| --------------- | --------------------- | ---------------------------------------------------------------- | ------------- |
| **`dbNames`**   | <code>string[]</code> | the dbName of all connections                                    | 3.0.0-beta.10 |
| **`openModes`** | <code>string[]</code> | the openMode ("RW" read&write, "RO" readonly) of all connections | 4.1.0         |


#### capNCDatabasePathResult

| Prop       | Type                | Description     |
| ---------- | ------------------- | --------------- |
| **`path`** | <code>string</code> | String returned |


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

### Listeners (NOT AVAILABLE FOR ELECTRON PLATFORM)

`Available since 3.0.0-beta.12`

The listeners are attached to the plugin.

| Listener                      | Type                                                |  Description                                     |
| ----------------------------- | --------------------------------------------------- | ----------------------------------------------- |
| **sqliteImportProgressEvent** | [capJsonProgressListener](#capJsonProgressListener) | Emitted at different steps of the `importFromJson` process |
| **sqliteExportProgressEvent** | [capJsonProgressListener](#capJsonProgressListener) | Emitted at different steps of the `exportToJson` process   |

#### capJsonProgressListener 

| Prop           | Type                |Description       |
| -------------- | ------------------- | ---------------- |
| **`progress`** | <code>string</code> | progress message |


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
FOR EACH ROW WHEN NEW.last_modified < OLD.last_modified
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
