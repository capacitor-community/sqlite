<p align="center"><br><img src="https://user-images.githubusercontent.com/236501/85893648-1c92e880-b7a8-11ea-926d-95355b8175c7.png" width="128" height="128" /></p>
<h2 align="center">API DOCUMENTATION</h2>
<p align="center"><strong><code>@capacitor-community/sqlite</code></strong></p>
<p align="center">
  Capacitor community plugin for Native and Electron SQLite Databases. For Native, databases could be encrypted with SQLCipher</p>

## Databases Location

The plugin add a suffix "SQLite" and an extension ".db" to the database name given as options in the `open method` ie (fooDBSQLite.db)

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

- in Electron not available

## Methods Index

<docgen-index>

- [`echo(...)`](#echo)
- [`open(...)`](#open)
- [`close(...)`](#close)
- [`execute(...)`](#execute)
- [`executeSet(...)`](#executeset)
- [`run(...)`](#run)
- [`query(...)`](#query)
- [`isDBExists(...)`](#isdbexists)
- [`deleteDatabase(...)`](#deletedatabase)
- [`isJsonValid(...)`](#isjsonvalid)
- [`importFromJson(...)`](#importfromjson)
- [`exportToJson(...)`](#exporttojson)
- [`createSyncTable()`](#createsynctable)
- [`setSyncDate(...)`](#setsyncdate)
- [`addUpgradeStatement(...)`](#addupgradestatement)
- [Interfaces](#interfaces)

</docgen-index>

<docgen-api class="custom-css">
<!--Update the source file JSDoc comments and rerun docgen to update the docs below-->

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

---

### open(...)

```typescript
open(options: capSQLiteOptions) => Promise<capSQLiteResult>
```

Open a SQLite database

| Param         | Type                                                          | Description                                        |
| ------------- | ------------------------------------------------------------- | -------------------------------------------------- |
| **`options`** | <code><a href="#capsqliteoptions">capSQLiteOptions</a></code> | : <a href="#capsqliteoptions">capSQLiteOptions</a> |

**Returns:** <code>Promise&lt;<a href="#capsqliteresult">capSQLiteResult</a>&gt;</code>

**Since:** 0.0.1

---

### close(...)

```typescript
close(options: capSQLiteOptions) => Promise<capSQLiteResult>
```

Close a SQLite database

| Param         | Type                                                          | Description                                        |
| ------------- | ------------------------------------------------------------- | -------------------------------------------------- |
| **`options`** | <code><a href="#capsqliteoptions">capSQLiteOptions</a></code> | : <a href="#capsqliteoptions">capSQLiteOptions</a> |

**Returns:** <code>Promise&lt;<a href="#capsqliteresult">capSQLiteResult</a>&gt;</code>

**Since:** 0.0.1

---

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

---

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

---

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

---

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

---

### isDBExists(...)

```typescript
isDBExists(options: capSQLiteOptions) => Promise<capSQLiteResult>
```

Check is a SQLite database exists

| Param         | Type                                                          | Description                                        |
| ------------- | ------------------------------------------------------------- | -------------------------------------------------- |
| **`options`** | <code><a href="#capsqliteoptions">capSQLiteOptions</a></code> | : <a href="#capsqliteoptions">capSQLiteOptions</a> |

**Returns:** <code>Promise&lt;<a href="#capsqliteresult">capSQLiteResult</a>&gt;</code>

**Since:** 2.0.1-1

---

### deleteDatabase(...)

```typescript
deleteDatabase(options: capSQLiteOptions) => Promise<capSQLiteResult>
```

Delete a SQLite database

| Param         | Type                                                          | Description                                        |
| ------------- | ------------------------------------------------------------- | -------------------------------------------------- |
| **`options`** | <code><a href="#capsqliteoptions">capSQLiteOptions</a></code> | : <a href="#capsqliteoptions">capSQLiteOptions</a> |

**Returns:** <code>Promise&lt;<a href="#capsqliteresult">capSQLiteResult</a>&gt;</code>

**Since:** 0.0.1

---

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

---

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

---

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

---

### createSyncTable()

```typescript
createSyncTable() => Promise<capSQLiteChanges>
```

Create a synchronization table

**Returns:** <code>Promise&lt;<a href="#capsqlitechanges">capSQLiteChanges</a>&gt;</code>

**Since:** 2.0.1-1

---

### setSyncDate(...)

```typescript
setSyncDate(options: capSQLiteSyncDateOptions) => Promise<capSQLiteResult>
```

Set the synchronization date

| Param         | Type                                                                          | Description                                                        |
| ------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **`options`** | <code><a href="#capsqlitesyncdateoptions">capSQLiteSyncDateOptions</a></code> | : <a href="#capsqlitesyncdateoptions">capSQLiteSyncDateOptions</a> |

**Returns:** <code>Promise&lt;<a href="#capsqliteresult">capSQLiteResult</a>&gt;</code>

**Since:** 2.0.1-1

---

### addUpgradeStatement(...)

```typescript
addUpgradeStatement(options: capSQLiteUpgradeOptions) => Promise<capSQLiteResult>
```

Add the upgrade Statement for database version upgrading

| Param         | Type                                                                        | Description                                                      |
| ------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| **`options`** | <code><a href="#capsqliteupgradeoptions">capSQLiteUpgradeOptions</a></code> | : <a href="#capsqliteupgradeoptions">capSQLiteUpgradeOptions</a> |

**Returns:** <code>Promise&lt;<a href="#capsqliteresult">capSQLiteResult</a>&gt;</code>

**Since:** 2.4.2-6 iOS & Electron 2.4.2-7 Android

---

### Interfaces

#### capEchoResult

| Prop        | Type                | Description     |
| ----------- | ------------------- | --------------- |
| **`value`** | <code>string</code> | String returned |

#### capEchoOptions

| Prop        | Type                | Description         |
| ----------- | ------------------- | ------------------- |
| **`value`** | <code>string</code> | String to be echoed |

#### capSQLiteResult

| Prop          | Type                 | Description                                   |
| ------------- | -------------------- | --------------------------------------------- |
| **`result`**  | <code>boolean</code> | result set to true when successful else false |
| **`message`** | <code>string</code>  | a returned message                            |

#### capSQLiteOptions

| Prop            | Type                 | Description                                                                                   |
| --------------- | -------------------- | --------------------------------------------------------------------------------------------- |
| **`database`**  | <code>string</code>  | The database name                                                                             |
| **`version`**   | <code>number</code>  | The database version                                                                          |
| **`encrypted`** | <code>boolean</code> | Set to true (database encryption) / false - Open method only                                  |
| **`mode`**      | <code>string</code>  | Set the mode for database encryption ["encryption", "secret", "newsecret"] - Open method only |

#### capSQLiteChanges

| Prop          | Type                | Description                                          |
| ------------- | ------------------- | ---------------------------------------------------- |
| **`changes`** | <code>any</code>    | the number of changes from an execute or run command |
| **`message`** | <code>string</code> | a returned message                                   |

#### capSQLiteExecuteOptions

| Prop             | Type                | Description                               |
| ---------------- | ------------------- | ----------------------------------------- |
| **`statements`** | <code>string</code> | The batch of raw SQL statements as string |

#### capSQLiteSetOptions

| Prop      | Type                        | Description                                               |
| --------- | --------------------------- | --------------------------------------------------------- |
| **`set`** | <code>capSQLiteSet[]</code> | The batch of raw SQL statements as Array of capSQLLiteSet |

#### capSQLiteSet

| Prop            | Type                | Description                      |
| --------------- | ------------------- | -------------------------------- |
| **`statement`** | <code>string</code> | A statement                      |
| **`values`**    | <code>any[]</code>  | the data values list as an Array |

#### capSQLiteRunOptions

| Prop            | Type                | Description                     |
| --------------- | ------------------- | ------------------------------- |
| **`statement`** | <code>string</code> | A statement                     |
| **`values`**    | <code>any[]</code>  | A set of values for a statement |

#### capSQLiteValues

| Prop          | Type                | Description                      |
| ------------- | ------------------- | -------------------------------- |
| **`values`**  | <code>any[]</code>  | the data values list as an Array |
| **`message`** | <code>string</code> | a returned message               |

#### capSQLiteQueryOptions

| Prop            | Type                  | Description                     |
| --------------- | --------------------- | ------------------------------- |
| **`statement`** | <code>string</code>   | A statement                     |
| **`values`**    | <code>string[]</code> | A set of values for a statement |

#### capSQLiteImportOptions

| Prop             | Type                | Description                   |
| ---------------- | ------------------- | ----------------------------- |
| **`jsonstring`** | <code>string</code> | Set the JSON object to import |

#### capSQLiteJson

| Prop          | Type                                              | Description           |
| ------------- | ------------------------------------------------- | --------------------- |
| **`export`**  | <code><a href="#jsonsqlite">JsonSQLite</a></code> | an export JSON object |
| **`message`** | <code>string</code>                               | a returned message    |

#### JsonSQLite

| Prop            | Type                     | Description                                            |
| --------------- | ------------------------ | ------------------------------------------------------ |
| **`database`**  | <code>string</code>      | The database name                                      |
| **`version`**   | <code>number</code>      | The database version                                   |
| **`encrypted`** | <code>boolean</code>     | Set to true (database encryption) / false              |
| **`mode`**      | <code>string</code>      | \* Set the mode ["full", "partial"]                    |
| **`tables`**    | <code>JsonTable[]</code> | \* Array of Table (<a href="#jsontable">JsonTable</a>) |

#### JsonTable

| Prop          | Type                      | Description                                               |
| ------------- | ------------------------- | --------------------------------------------------------- |
| **`name`**    | <code>string</code>       | The database name                                         |
| **`schema`**  | <code>JsonColumn[]</code> | \* Array of Schema (<a href="#jsoncolumn">JsonColumn</a>) |
| **`indexes`** | <code>JsonIndex[]</code>  | \* Array of Index (<a href="#jsonindex">JsonIndex</a>)    |
| **`values`**  | <code>any[][]</code>      | \* Array of Table data                                    |

#### JsonColumn

| Prop             | Type                | Description                         |
| ---------------- | ------------------- | ----------------------------------- |
| **`column`**     | <code>string</code> | The column name                     |
| **`value`**      | <code>string</code> | The column data (type, unique, ...) |
| **`foreignkey`** | <code>string</code> | The column foreign key constraints  |

#### JsonIndex

| Prop         | Type                | Description                   |
| ------------ | ------------------- | ----------------------------- |
| **`name`**   | <code>string</code> | The index name                |
| **`column`** | <code>string</code> | The column name to be indexed |

#### capSQLiteExportOptions

| Prop                 | Type                | Description                                             |
| -------------------- | ------------------- | ------------------------------------------------------- |
| **`jsonexportmode`** | <code>string</code> | Set the mode to export JSON Object: "full" or "partial" |

#### capSQLiteSyncDateOptions

| Prop           | Type                | Description                                                    |
| -------------- | ------------------- | -------------------------------------------------------------- |
| **`syncdate`** | <code>string</code> | Set the synchronization date Format yyyy-MM-dd'T'HH:mm:ss.SSSZ |

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
