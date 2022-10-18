<p align="center"><br><img src="https://user-images.githubusercontent.com/236501/85893648-1c92e880-b7a8-11ea-926d-95355b8175c7.png" width="128" height="128" /></p>
<h2 align="center">Upgrade Database Version DOCUMENTATION</h2>
<p align="center"><strong><code>@capacitor-community/sqlite</code></strong></p>

The API method `addUpgradeStatement` has been modified to define the new structure of the database as a list of incremental upgrades. Every upgrade is executed over the previous version.

It has to be called prior to open the database with the new version number

ie: assuming `this._SQLiteService` is referring to the sqlite plugin and the current database version is 1

```js
...

let result:any = await this._SQLiteService.addUpgradeStatement(
  "test-sqlite",
  [
    {
      toVersion: 1, // Any number you want as long as it's in ascending order. Version 0 is an empty database
      statements: [
        schemaStmt1,
        schemaStmt2,
        schemaStmt3,
        // ...
      ]
    },
    {
      toVersion: 2, // Any number you want as long as it's in ascending order. Version 0 is an empty database
      statements: [
        schemaStmt4,
        schemaStmt5,
        schemaStmt6,
        // ...
      ]
    },
  ]
);
result = await this._SQLiteService.openDB("my-database", false, "no-encryption", 2);
console.log('openDB result.result ' + result.result);
if(result.result) {
    ...
}
```

## Usage

As input parameters for the `addUpgradeStatement`, one must defined:

- `database`: database name
- `upgrade`: array of upgrades. Each upgrade is defined as:
  - `toVersion`: new database version
  - `statements`: an array of incremental statements describing the changes to the new structure of database version. Only statements to execute over the previus database version.

### Example

Assuming the following version upgrade definition:

```js
// Usually version 1 will create schema
const version1Statements: string[] = [
  `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY NOT NULL,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      company TEXT,
      size FLOAT,
      age INTEGER,
      last_modified INTEGER DEFAULT (strftime('%s', 'now'))
  );`,

  `CREATE INDEX IF NOT EXISTS users_index_name ON users (name);`,

  `CREATE INDEX IF NOT EXISTS users_index_last_modified ON users (last_modified);`,

  `CREATE TRIGGER IF NOT EXISTS users_trigger_last_modified
    AFTER UPDATE ON users
      FOR EACH ROW WHEN NEW.last_modified < OLD.last_modified
        BEGIN
          UPDATE users SET last_modified= (strftime('%s', 'now')) WHERE id=OLD.id;
        END;`,
];

// Next versions can create new tables, alter existing tables, add data, update data, etc
const version2Statements: string[] = [
  `ALTER TABLE users ADD COLUMN country TEXT;`,
];

// call addUpgradeStatement
let result: any = await this._SQLiteService.addUpgradeStatement({
  database: 'my-database',
  upgrade: [
    {
      toVersion: 1,
      statements: version1Statements,
    },
    {
      toVersion: 2,
      statements: version2Statements,
    },
  ],
});
```

Opening a database as follows:

```js
// open the database
result = await this._SQLiteService.openDB("my-database", false, "no-encryption", 2);
if(result.result) {
  console.log("*** Database my-database Opened");
  ...
}
```

The following scenarios may occur:

- Opens a Version 0 database (empty database). Will execute `version1Statements` and `version2Statements` upgrade statements.
- Opens a Version 1 database. Will execute `version2Statements` upgrade statements.
- Opens a Version 2 database. Will not execute any upgrade statements (already on version 2).

## Upgrading Database Version Process

- call the addUpgradeStatement method with the new database schema (must include all the table, indexe, trigger definitions) and the data to be updated (only the new data)

- call the openDB with the new version number

### Plugin openDB process flow

- Backup the current version file backup-YOUR_DB_NAME
- For each version between currentVersion and targetVersion
  - Starts transaction
  - Execute version statements
  - Commit transaction
  - Update database version
- If process failed, restore the backup file
- Delete the backup file
