# API Documentation

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

<!--DOCGEN_INDEX_START-->

- [echo()](#echo)
- [open()](#open)
- [close()](#close)
- [execute()](#execute)
- [executeSet()](#executeset)
- [run()](#run)
- [query()](#query)
- [isDBExists()](#isdbexists)
- [deleteDatabase()](#deletedatabase)
- [isJsonValid()](#isjsonvalid)
- [importFromJson()](#importfromjson)
- [exportToJson()](#exporttojson)
- [createSyncTable()](#createsynctable)
- [setSyncDate()](#setsyncdate)
- [Interfaces](#interfaces)
<!--DOCGEN_INDEX_END-->

<!--DOCGEN_API_START-->
<!--Update the source file JSDoc comments and rerun docgen to update the docs below-->

## API

### echo

```typescript
echo(options: capEchoOptions) => Promise<capEchoResult>
```

Echo a given string

| Param       | Type                              | Description      |
| ----------- | --------------------------------- | ---------------- |
| **options** | [capEchoOptions](#capechooptions) | The echo options |

**Returns:** Promise&lt;[capEchoResult](#capechoresult)&gt;

**Since:** 0.0.1

---

### open

```typescript
open(options: capSQLiteOptions) => Promise<capSQLiteResult>
```

Open a SQLite database

| Param       | Type                                  |
| ----------- | ------------------------------------- |
| **options** | [capSQLiteOptions](#capsqliteoptions) |

**Returns:** Promise&lt;[capSQLiteResult](#capsqliteresult)&gt;

**Since:** 0.0.1

---

### close

```typescript
close(options: capSQLiteOptions) => Promise<capSQLiteResult>
```

Close a SQLite database

| Param       | Type                                  |
| ----------- | ------------------------------------- |
| **options** | [capSQLiteOptions](#capsqliteoptions) |

**Returns:** Promise&lt;[capSQLiteResult](#capsqliteresult)&gt;

**Since:** 0.0.1

---

### execute

```typescript
execute(options: capSQLiteExecuteOptions) => Promise<capSQLiteChanges>
```

Execute a Batch of Raw Statements as String

| Param       | Type                                                |
| ----------- | --------------------------------------------------- |
| **options** | [capSQLiteExecuteOptions](#capsqliteexecuteoptions) |

**Returns:** Promise&lt;[capSQLiteChanges](#capsqlitechanges)&gt;

**Since:** 0.0.1

---

### executeSet

```typescript
executeSet(options: capSQLiteSetOptions) => Promise<capSQLiteChanges>
```

Execute a Set of Raw Statements as Array of CapSQLiteSet

| Param       | Type                                        |
| ----------- | ------------------------------------------- |
| **options** | [capSQLiteSetOptions](#capsqlitesetoptions) |

**Returns:** Promise&lt;[capSQLiteChanges](#capsqlitechanges)&gt;

**Since:** 2.2.0-2

---

### run

```typescript
run(options: capSQLiteRunOptions) => Promise<capSQLiteChanges>
```

Execute a Single Statement

| Param       | Type                                        |
| ----------- | ------------------------------------------- |
| **options** | [capSQLiteRunOptions](#capsqliterunoptions) |

**Returns:** Promise&lt;[capSQLiteChanges](#capsqlitechanges)&gt;

**Since:** 0.0.1

---

### query

```typescript
query(options: capSQLiteQueryOptions) => Promise<capSQLiteValues>
```

Query a Single Statement

| Param       | Type                                            |
| ----------- | ----------------------------------------------- |
| **options** | [capSQLiteQueryOptions](#capsqlitequeryoptions) |

**Returns:** Promise&lt;[capSQLiteValues](#capsqlitevalues)&gt;

**Since:** 0.0.1

---

### isDBExists

```typescript
isDBExists(options: capSQLiteOptions) => Promise<capSQLiteResult>
```

Check is a SQLite database exists

| Param       | Type                                  |
| ----------- | ------------------------------------- |
| **options** | [capSQLiteOptions](#capsqliteoptions) |

**Returns:** Promise&lt;[capSQLiteResult](#capsqliteresult)&gt;

**Since:** 2.0.1-1

---

### deleteDatabase

```typescript
deleteDatabase(options: capSQLiteOptions) => Promise<capSQLiteResult>
```

Delete a SQLite database

| Param       | Type                                  |
| ----------- | ------------------------------------- |
| **options** | [capSQLiteOptions](#capsqliteoptions) |

**Returns:** Promise&lt;[capSQLiteResult](#capsqliteresult)&gt;

**Since:** 0.0.1

---

### isJsonValid

```typescript
isJsonValid(options: capSQLiteImportOptions) => Promise<capSQLiteResult>
```

Is Json Object Valid

| Param       | Type                                              |
| ----------- | ------------------------------------------------- |
| **options** | [capSQLiteImportOptions](#capsqliteimportoptions) |

**Returns:** Promise&lt;[capSQLiteResult](#capsqliteresult)&gt;

**Since:** 2.0.1-1

---

### importFromJson

```typescript
importFromJson(options: capSQLiteImportOptions) => Promise<capSQLiteChanges>
```

Import from Json Object

| Param       | Type                                              |
| ----------- | ------------------------------------------------- |
| **options** | [capSQLiteImportOptions](#capsqliteimportoptions) |

**Returns:** Promise&lt;[capSQLiteChanges](#capsqlitechanges)&gt;

**Since:** 2.0.0-3

---

### exportToJson

```typescript
exportToJson(options: capSQLiteExportOptions) => Promise<capSQLiteJson>
```

Export to Json Object

| Param       | Type                                              |
| ----------- | ------------------------------------------------- |
| **options** | [capSQLiteExportOptions](#capsqliteexportoptions) |

**Returns:** Promise&lt;[capSQLiteJson](#capsqlitejson)&gt;

**Since:** 2.0.1-1

---

### createSyncTable

```typescript
createSyncTable() => Promise<capSQLiteChanges>
```

Create a synchronization table

**Returns:** Promise&lt;[capSQLiteChanges](#capsqlitechanges)&gt;

**Since:** 2.0.1-1

---

### setSyncDate

```typescript
setSyncDate(options: capSQLiteSyncDateOptions) => Promise<capSQLiteResult>
```

Set the synchronization date

| Param       | Type                                                  |
| ----------- | ----------------------------------------------------- |
| **options** | [capSQLiteSyncDateOptions](#capsqlitesyncdateoptions) |

**Returns:** Promise&lt;[capSQLiteResult](#capsqliteresult)&gt;

**Since:** 2.0.1-1

---

### Interfaces

#### capEchoResult

| Prop      | Type   | Description     |
| --------- | ------ | --------------- |
| **value** | string | String returned |

#### capEchoOptions

| Prop      | Type   | Description         |
| --------- | ------ | ------------------- |
| **value** | string | String to be echoed |

#### capSQLiteResult

| Prop        | Type    | Description                                   |
| ----------- | ------- | --------------------------------------------- |
| **result**  | boolean | result set to true when successful else false |
| **message** | string  | a returned message                            |

#### capSQLiteOptions

| Prop          | Type    | Description                                                                                   |
| ------------- | ------- | --------------------------------------------------------------------------------------------- |
| **database**  | string  | The database name                                                                             |
| **encrypted** | boolean | Set to true (database encryption) / false - Open method only                                  |
| **mode**      | string  | Set the mode for database encryption ["encryption", "secret", "newsecret"] - Open method only |

#### capSQLiteChanges

| Prop        | Type   | Description                                          |
| ----------- | ------ | ---------------------------------------------------- |
| **changes** | any    | the number of changes from an execute or run command |
| **message** | string | a returned message                                   |

#### capSQLiteExecuteOptions

| Prop           | Type   | Description                               |
| -------------- | ------ | ----------------------------------------- |
| **statements** | string | The batch of raw SQL statements as string |

#### capSQLiteSetOptions

| Prop    | Type           | Description                                               |
| ------- | -------------- | --------------------------------------------------------- |
| **set** | capSQLiteSet[] | The batch of raw SQL statements as Array of capSQLLiteSet |

#### capSQLiteSet

| Prop          | Type   | Description                      |
| ------------- | ------ | -------------------------------- |
| **statement** | string | A statement                      |
| **values**    | any[]  | the data values list as an Array |

#### capSQLiteRunOptions

| Prop          | Type   | Description                     |
| ------------- | ------ | ------------------------------- |
| **statement** | string | A statement                     |
| **values**    | any[]  | A set of values for a statement |

#### capSQLiteValues

| Prop        | Type   | Description                      |
| ----------- | ------ | -------------------------------- |
| **values**  | any[]  | the data values list as an Array |
| **message** | string | a returned message               |

#### capSQLiteQueryOptions

| Prop          | Type     | Description                     |
| ------------- | -------- | ------------------------------- |
| **statement** | string   | A statement                     |
| **values**    | string[] | A set of values for a statement |

#### capSQLiteImportOptions

| Prop           | Type   | Description                   |
| -------------- | ------ | ----------------------------- |
| **jsonstring** | string | Set the JSON object to import |

#### capSQLiteJson

| Prop        | Type                      | Description           |
| ----------- | ------------------------- | --------------------- |
| **export**  | [JsonSQLite](#jsonsqlite) | an export JSON object |
| **message** | string                    | a returned message    |

#### JsonSQLite

| Prop          | Type        | Description                               |
| ------------- | ----------- | ----------------------------------------- |
| **database**  | string      | The database name                         |
| **encrypted** | boolean     | Set to true (database encryption) / false |
| **mode**      | string      | \* Set the mode ["full", "partial"]       |
| **tables**    | JsonTable[] | \* Array of Table (JsonTable)             |

#### JsonTable

| Prop        | Type         | Description                     |
| ----------- | ------------ | ------------------------------- |
| **name**    | string       | The database name               |
| **schema**  | JsonColumn[] | \* Array of Schema (JsonColumn) |
| **indexes** | JsonIndex[]  | \* Array of Index (JsonIndex)   |
| **values**  | any[][]      | \* Array of Table data          |

#### JsonColumn

| Prop           | Type   | Description                         |
| -------------- | ------ | ----------------------------------- |
| **column**     | string | The column name                     |
| **value**      | string | The column data (type, unique, ...) |
| **foreignkey** | string | The column foreign key constraints  |

#### JsonIndex

| Prop       | Type   | Description                   |
| ---------- | ------ | ----------------------------- |
| **name**   | string | The index name                |
| **column** | string | The column name to be indexed |

#### capSQLiteExportOptions

| Prop               | Type   | Description                                             |
| ------------------ | ------ | ------------------------------------------------------- |
| **jsonexportmode** | string | Set the mode to export JSON Object: "full" or "partial" |

#### capSQLiteSyncDateOptions

| Prop         | Type   | Description                  |
| ------------ | ------ | ---------------------------- |
| **syncdate** | string | Set the synchronization date |

<!--DOCGEN_API_END-->

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
