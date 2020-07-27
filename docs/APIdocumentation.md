# API Documentation

## Databases Location

### Android

    data/data/YOUR_PACKAGE/databases

### IOS

    in the Document folder of YOUR_APPLICATION

### Electron

the location of the databases could now be selected:

    - the previous one **YourApplication/Electron/Databases**
    - under **User/Databases/APP_NAME/** to not loose them when updating the application. This is manage in the index.html file of the application (see below `Running on Electron`).

## Error Return values

- For all methods, a message containing the error message will be returned

- For execute and run commands, {changes:{changes: -1}} will be returned in changes

- For query command, an empty array will be returned in values

## Methods

### `open({database:"fooDB"}) => Promise<{result:boolean,message:string}>`

Open a database,
the plugin add a suffix "SQLite" and an extension ".db" to the name given ie (fooDBSQLite.db)

#### Returns

Type: `Promise<{result:boolean,message:string}>`

### `close({database:"fooDB"}) => Promise<{result:boolean,message:string}>`

Close a database

#### Returns

Type: `Promise<{result:boolean,message:string}>`

### `execute({statements:"fooStatements"}) => Promise<{changes:{changes:number},message:string}>`

Execute a batch of raw SQL statements given in a string

#### Returns

Type: `Promise<{changes:{changes:number},message:string}>`

### `executeSet({set:[{statement:"fooStatement",values:[1,"foo1","foo2"]}]}) => Promise<{changes:{changes:number},message:string}>`

Execute a set of raw SQL statements given in an Array of
{statement: String , values: Array<Any>}

#### Returns

Type: `Promise<{changes:{changes:number},message:string}>`

### `run({statement:"fooStatement",values:[]}) => Promise<{changes:{changes:number,lastId:number},message:string}>`

Run a SQL statement (single statement)

#### Returns

Type: `Promise<{changes:{changes:number,lastId:number},message:string}>`

### `run({statement:"fooStatement VALUES (?,?,?)",values:[1,"foo1","foo2"]}) => Promise<{changes:{changes:number,lastId:number},message:string}>`

Run a SQL statement with given values (single statement)

#### Returns

Type: `Promise<{changes:{changes:number,lastId:number},message:string}>`

### `query({statement:"fooStatement",values:[]}) => Promise<{values:Array<any>,message:string}>`

Query a SELECT SQL statement (single statement)

#### Returns

Type: `Promise<{values:Array<any>,message:string}>`

### `query({statement:"fooStatement VALUES (?)",values:["foo1"]}) => Promise<{values:Array<any>,message:string}>`

Query a SELECT SQL statement with given values (single statement)

#### Returns

Type: `Promise<{values:Array<any>,message:string}>`

### `deleteDatabase({database:"fooDB"}) => Promise<{result:boolean,message:string}>`

Delete a database, require to have open the database first

#### Returns

Type: `Promise<{result:boolean,message:string}>`

### `importFomJson({jsonstring:fooJSONString}) => Promise<{changes:{changes:number},message:string}>`

Import Stringify JSON Object describing a database with Schemas, Indexes and Tables Data.

**`Mandatory`**

For each tables, the schema must have as first column an id described as

`schema: [ {column:"id", value: "INTEGER PRIMARY KEY NOT NULL"}, ..., ]`

#### Returns

Type: `Promise<{changes:{changes:number},message:string}>`

### `exportToJson({jsonexportmode:fooModeString}) => Promise<{export:any,message:string}>`

Export a JSON Object describing a database with Schemas, Indexes and Tables Data with two modes "full" or "partial"

#### Returns

Type: `Promise<{export:any,message:string}>`

### `createSyncTable() => Promise<{changes:{changes:number},message:string}>`

Create a synchronization table in the database

#### Returns

Type: `Promise<{changes:{changes:number},message:string}>`

### `setSyncDate({syncdate:fooDateString}) => Promise<{result:boolean,message:string}>`

Set a new synchronization date in the database

#### Returns

Type: `Promise<{result:boolean,message:string}>`

### `isJsonValid({jsonstring:fooJSONString}) => Promise<{result:boolean,message:string}>`

Check the validity of a Json Object

#### Returns

Type: `Promise<{result:boolean,message:string}>`

### `isDBExists({database:"fooDB"}) => Promise<{result:boolean,message:string}>`

Check if a database exists

#### Returns

Type: `Promise<{result:boolean,message:string}>`

## Methods available for encrypted database in IOS and Android

### `open({database:"fooDB",encrypted:true,mode:"encryption"}) => Promise<{result:boolean,message:string}>`

Encrypt an existing database with a secret key and open the database with given database name.

To define your own "secret" and "newsecret" keys:

- in IOS, go to the Pod/Development Pods/capacitor-sqlite/GlobalSQLite.swift file
- in Android, go to capacitor-sqlite/java/com.jeep.plugin.capacitor/cdssUtils/GlobalSQLite.java
  and update the default values before building your app.

#### Returns

Type: `Promise<{result:boolean,message:string}>`

### `open({database:"fooDB",encrypted:true,mode:"secret"}) => Promise<{result:boolean,message:string}>`

Open an encrypted database with given database and table names and secret key.

#### Returns

Type: `Promise<{result:boolean,message:string}>`

### `open({database:"fooDB",encrypted:true,mode:"newsecret"}) => Promise<{result:boolean,message:string}>`

Modify the secret key with the newsecret key of an encrypted database and open it with given database and table names and newsecret key.

#### Returns

Type: `Promise<{result:boolean,message:string}>`
