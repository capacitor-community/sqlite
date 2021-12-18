<p align="center"><br><img src="https://user-images.githubusercontent.com/236501/85893648-1c92e880-b7a8-11ea-926d-95355b8175c7.png" width="128" height="128" /></p>
<h2 align="center">Non Conformed Databases DOCUMENTATION</h2>
<p align="center"><strong><code>@capacitor-community/sqlite</code></strong></p>
<p align="center">
  Capacitor community plugin for Native and Electron SQLite Databases. For Native, databases could be encrypted with SQLCipher</p>

The following methods have been developed to allow connections to existing sqlite databases created by other plugins without the `SQLite.db` extension.
Those connections will then access databases in `Read-Only mode`.

## Index

- [`Methods`](#methods)
  - [`Get NC Database Path`](#getncdatabasepath)
  - [`Is NC Database`](#isncdatabase)
  - [`Is NC Connection`](#isncconnection)
  - [`Create NC Connection`](#createncconnection)
  - [`Retrieve NC Connection`](#retrievencconnection)
  - [`Close NC Connection`](#closencconnection)

## Methods


### getNCDatabasePath

This method allows to get the path of the database giving the folder path and the database name.

The folder path can be any folder under 
  - `Applications`, `Library` or `Documents` for iOS
  - `databases` or `files` for Android

```ts
...
  this.sqlitePlugin = CapacitorSQLite;
  this.sqlite = new SQLiteConnection(this.sqlitePlugin);
...
  let directory: string;
  if(this.platform === "ios") directory = "Applications/Files/Databases"
  if(this.platform === "android" ) directory = "files/databases";  
  const databasePath = (await this.sqlite.getNCDatabasePath(directory,"testncdb.db")).path;
```

### isNCDatabase

This method checks if a database path exists prior to create a connection

```ts
...
  const isNCDbExists = (await this.sqlite.isNCDatabase(databasePath)).result;
...
```

### isNCConnection

This method checks if a non-conformed connection exists

```ts
...
  const isConn = (await this.sqlite.isNCConnection(databasePath)).result;
...
```

### createNCConnection

This method create a `Read-Only` connection for a given database path

```ts
...
  db = await this.sqlite.createNCConnection(databasePath, 1);
...
```

### closeeNCConnection

This method close a `Read-Only` connection for a given database path

```ts
...
  db = await this.sqlite.closeNCConnection(databasePath, 1);
...
```

### retrieveNCConnection

This method retrieve a `Read-Only` connection for a given database path

```ts
...
  db = await this.sqlite.retrieveNCConnection(databasePath);
...
```

## Ionic/Angular Example

Have a look at `testncdbs`page component in 
[angular-sqlite-app-starter](https://github.com/jepiqueau/angular-sqlite-app-starter)