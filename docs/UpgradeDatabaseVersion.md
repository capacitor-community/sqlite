<p align="center"><br><img src="https://user-images.githubusercontent.com/236501/85893648-1c92e880-b7a8-11ea-926d-95355b8175c7.png" width="128" height="128" /></p>
<h2 align="center">Upgrade Database Version DOCUMENTATION</h2>
<p align="center"><strong><code>@capacitor-community/sqlite</code></strong></p>

An API method has been added `addUpgradeStatement` to define the new structure of the database.

It has to be called prior to open the database with the new version number

ie: assuming `this._SQLiteService` is referring to the sqlite plugin and the current database version is 1

```js
...

let result:any = await this._SQLiteService.addUpgradeStatement("test-sqlite",
[{fromVersion: 1, toVersion: 2, statement: schemaStmt, set: setArray}]);
result = await this._SQLiteService.openDB("test-sqlite",false,"no-encryption",2);
console.log('openDB result.result ' + result.result);
if(result.result) {
    ...
}
```

## Usage

As input parameters for the `addUpgradeStatement`, one must defined: - fromVersion : current database version - toVersion: new database version to be created - statement: a number of statements describing the new structure of database version (including table's definition even for those which doesn't change). - set: set of statements (`INSERT` and `UPDATE`) to upload only new data in the database

### Example

Assuming the Version 1 of the database was created as follows:

```js
let result: any = await this._SQLiteService.openDB('test-updversion');
if (result.result) {
  // create tables
  const sqlcmd: string = `
      BEGIN TRANSACTION;
      CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY NOT NULL,
          email TEXT UNIQUE NOT NULL,
          name TEXT,
          company TEXT,
          size FLOAT,
          age INTEGER,
          last_modified INTEGER DEFAULT (strftime('%s', 'now'))    
      );
      CREATE INDEX IF NOT EXISTS users_index_name ON users (name);
      CREATE INDEX IF NOT EXISTS users_index_last_modified ON users (last_modified);
      CREATE TRIGGER IF NOT EXISTS users_trigger_last_modified
      AFTER UPDATE ON users
      FOR EACH ROW WHEN NEW.last_modified <= OLD.last_modified
      BEGIN
          UPDATE users SET last_modified= (strftime('%s', 'now')) WHERE id=OLD.id;
      END;
      COMMIT TRANSACTION;
    `;
  result = await this._SQLiteService.execute(sqlcmd);
  if (result.changes.changes === 0 || result.changes.changes === 1) {
    // Insert some Users
    const row: Array<Array<any>> = [
      ['Whiteley', 'Whiteley.com', 30],
      ['Jones', 'Jones.com', 44],
    ];
    let sqlcmd: string = `
        BEGIN TRANSACTION;
        DELETE FROM users;
        INSERT INTO users (name,email,age) VALUES ("${row[0][0]}","${row[0][1]}",${row[0][2]});
        INSERT INTO users (name,email,age) VALUES ("${row[1][0]}","${row[1][1]}",${row[1][2]});
        COMMIT TRANSACTION;
        `;
    await this._SQLiteService.execute(sqlcmd);
    // Close the Database
    await this._SQLiteService.close('test-updversion');
  }
} else {
  console.log('*** Error: Database test-updversion not opened');
}
```

Upgrading to Version 2 will be done as below

        WARNING do not need to include these SQL commands

```js
        PRAGMA foreign_keys = OFF;
        BEGIN TRANSACTION;
        COMMIT TRANSACTION;
        PRAGMA foreign_keys = ON;
```

        they are managed by the plugin

```js
const schemaStmt: string = `
    CREATE TABLE users (
      id INTEGER PRIMARY KEY NOT NULL,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      company TEXT,
      country TEXT,
      age INTEGER,
      last_modified INTEGER DEFAULT (strftime('%s', 'now'))
    );
    CREATE TABLE messages (
      id INTEGER PRIMARY KEY NOT NULL,
      userid INTEGER,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      last_modified INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (userid) REFERENCES users(id) ON DELETE SET DEFAULT
    );
    CREATE INDEX users_index_name ON users (name);
    CREATE INDEX users_index_last_modified ON users (last_modified);
    CREATE INDEX messages_index_title ON messages (title);
    CREATE INDEX messages_index_last_modified ON messages (last_modified);
    CREATE TRIGGER users_trigger_last_modified
    AFTER UPDATE ON users
    FOR EACH ROW WHEN NEW.last_modified <= OLD.last_modified
    BEGIN
        UPDATE users SET last_modified= (strftime('%s', 'now')) WHERE id=OLD.id;
    END;
    CREATE TRIGGER messages_trigger_last_modified
    AFTER UPDATE ON messages
    FOR EACH ROW WHEN NEW.last_modified <= OLD.last_modified
    BEGIN
        UPDATE messages SET last_modified= (strftime('%s', 'now')) WHERE id=OLD.id;
    END;
    `
const setArray: Array<any> = [
    { statement:"INSERT INTO messages (userid,title,body) VALUES (?,?,?);",
    values:[1,"test message 1","content test message 1"]
    },
    { statement:"INSERT INTO messages (userid,title,body) VALUES (?,?,?);",
    values:[2,"test message 2","content test message 2"]
    },
    { statement:"INSERT INTO messages (userid,title,body) VALUES (?,?,?);",
    values:[1,"test message 3","content test message 3"]
    },
    { statement:"UPDATE users SET country = ?  WHERE id = ?;",
    values:["United Kingdom",1]
    },
    { statement:"UPDATE users SET country = ?  WHERE id = ?;",
    values:["Australia",2]
    },
]
// call addUpgradeStatement
let result:any = await this._SQLiteService.addUpgradeStatement({
    database: "test-updversion",
    upgrade: [{
        fromVersion: 1,
        toVersion: 2,
        statement: schemaStmt,
        set: setArray
    }]
});
// open the database
result = await this._SQLiteService.openDB("test-updversion",false,"no-encryption",2);
if(result.result) {
console.log("*** Database test-updversion Opened");
    ...
}
```

## Upgrading Database Version Process

- call the addUpgradeStatement method with the new database schema (must include all the table, indexe, trigger definitions) and the data to be updated (only the new data)

- call the openDB with the new version number

### Plugin openDB process flow

-> backup the current version file backup-YOUR_DB_NAME

-> backup all existing tables "tableName" in "temp_tableName"

-> Drop all Indexes

-> Drop all Triggers

-> Create new tables from upgrade.statement

-> Create the list of table's common fields

-> Update the new table's data from old table's data

-> Drop \_temp_tables

-> Do some cleanup

-> Execute the set of new table's data

-> update database version

-> update syncDate if any

-> process failed restore the backup file

-> delete the backup file
