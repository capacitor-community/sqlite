<p align="center"><br><img src="https://user-images.githubusercontent.com/236501/85893648-1c92e880-b7a8-11ea-926d-95355b8175c7.png" width="128" height="128" /></p>
<h2 align="center">Migrating Cordova Databases DOCUMENTATION</h2>
<p align="center"><strong><code>@capacitor-community/sqlite</code></strong></p>
<p align="center">
  Capacitor community plugin for Native and Electron SQLite Databases. For Native, databases could be encrypted with SQLCipher</p>

## Index

- [`Methods`](#methods)
  - [`Add SQLite Suffix`](#addsqlitesuffix)
  - [`Delete Old Databases`](#deleteolddatabases)
  - [`Get Migratable Database List`](#getmigratabledatabaselist)

## Methods

The three methods below give you all the bits and pieces to migrate your Cordova plugin databases to be compliant with the @capacitor-community/sqlite plugin.

### addSQLiteSuffix

This method allow to add the SQLite suffix to the database name and also to bring them into the right location folder.

If you were using the "default" location in the cordova plugin, you just call the addSQLiteSuffix method with no parameters

```ts
result = await this._sqlite.addSQLiteSuffix();
```

this will copy all the databases from the "default" folder and add to them the SQLite suffix ie `foo.db ...` will become `fooSQLite.db ...`

- on iOS the "default" location is `Documents` under the application
- on Android the "default" location is `databases` under the application

If you were using a custom location you have to give the location as parameter, only few custom locations are accessibles depending on the platform.

#### iOS

The accessible locations are under the `Applications`, `Library` or `Documents` folders. ie

- Any folders under `Applications`

```ts
result = await this._sqlite.addSQLiteSuffix("Applications/Files/Databases")
result = await this._sqlite.addSQLiteSuffix("Applications/AppDatabases");
result = await this._sqlite.addSQLiteSuffix("Applications/.../.../...");
...
```
- Any folders under `Library`

```ts
result = await this._sqlite.addSQLiteSuffix("Library/LocalDatabase")
```

- Any folders under `Documents`

```ts
result = await this._sqlite.addSQLiteSuffix("Documents/Files/Databases")
result = await this._sqlite.addSQLiteSuffix("Documents/Databases");
result = await this._sqlite.addSQLiteSuffix("Documents/.../.../...");
...
```

If you specify an array of database names only those databases will be copied and renamed

```ts
result = await this._sqlite.addSQLiteSuffix("Applications/Files/Databases", ["test1.db", "test2.db", ... ]);
...
```
#### Android

The accessible locations are under the `databases` or `files` folders. ie

- Any folders under `databases`

```ts
result = await this._sqlite.addSQLiteSuffix("databases/files/databases")
result = await this._sqlite.addSQLiteSuffix("databases/databases");
result = await this._sqlite.addSQLiteSuffix("databases/.../.../...");
...
```

- Any folders under `files`

```ts
result = await this._sqlite.addSQLiteSuffix("files/databases")
result = await this._sqlite.addSQLiteSuffix("files/.../.../...");
...
```

### deleteOldDatabases

When the addSQLiteSuffix method is completed and all new databases with suffix SQLite have been fully tested, the deleteOldDatabases should be used to remove the Cordova plugin databases. Otherwise the database will be migrated each time the `addSQLiteSuffix` method is called. This would overwrite the previously migrated one again.

If you were using the "default" location in the cordova plugin, you just call the deleteOldDatabases method with no parameters

```ts
result = await this._sqlite.deleteOldDatabases();
```

If you were using a custom location you have to give the location as parameter, only few custom locations are accessibles depending on the platform. Use the same location than the one use for `addSQLiteSuffix` method.

```ts
result = await this._sqlite.deleteOldDatabases(YOUR_PATH_LOCATION);
```
or if you want to specify an array of database names
```ts
result = await this._sqlite.deleteOldDatabases(YOUR_PATH_LOCATION, YOUR_DB_NAME_LIST);
```
if you do not specify an array of database names, all `.db` will be deleted

### getmigratabledatabaselist

Allow to get the database list for a given folder path

```ts
result = await this._sqlite.getMigratableDbList(YOUR_PATH_LOCATION);
console.log(`list: ${result.values});
```
