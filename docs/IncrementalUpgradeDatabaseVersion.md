<p align="center"><br><img src="https://user-images.githubusercontent.com/236501/85893648-1c92e880-b7a8-11ea-926d-95355b8175c7.png" width="128" height="128" /></p>
<h2 align="center">Database Incremental Upgrade DOCUMENTATION</h2>
<p align="center"><strong><code>@capacitor-community/sqlite</code></strong></p>

A new `Database Incremental Upgrade` process has been proposed by Manuel Rodriguez (dragermrb) and implemented in 4.1.0-6

## Goal

 - Transform database upgrade proccess into an incremental process, based on a list of incremental changes on every new database version.
 - Simplify plugin upgrade logic, allowing developers to define upgrade logic.

## Proposal

 - This approach is similar to Laravel and Doctrine migrations.
 - The incremental database upgrade process is based on a list of statements per version, which is executed on the result of the previous version.
 - This list of statements, designed by the developer, can make modifications, insertions, deletions or updates on the current database, without the plugin having to know the common fields between updates, this responsibility lies with the developer.

For example, we can define the following versions:

```js
const version1 = {
  toVersion: 1,
  statements: [
    `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY NOT NULL,
        email TEXT UNIQUE NOT NULL,
        name TEXT
    );`,
    `CREATE TABLE messages (
        id INTEGER PRIMARY KEY NOT NULL,
        userid INTEGER,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        FOREIGN KEY (userid) REFERENCES users(id) ON DELETE SET DEFAULT
    );`,
  ],
};

// This statements are execute over last version database (1), only needs to specify new changes
const version2 = {
  toVersion: 2,
  statements: [`ALTER TABLE users ADD COLUMN age INTEGER;`],
};

// This statements are execute over last version database (2), only needs to specify new changes
const version3 = {
  toVersion: 3,
  statements: [`UPDATE users SET name = 'Guest' WHERE name IS NULL;`],
};
```

In this sample:

Version 1 will create database schema.
Version 2 will add a new field over version 1 database.
Version 3 will update data over version 2.

## Why

Currently, the database upgrade process is very complex. The plugin must make copies of the existing tables, create the new tables and try to understand the fields that are common between versions to copy the data.

This logic means that adding a single field to a table involves making a copy of the rest of the tables, finding the common fields, creating all the tables again, and copying the existing data. So much overhead.

On the other hand, suppose we want to modify a field as double the current value. With the current logic, you would have to redo the entire database and update the desired field with a query in the SET option.

With the proposed approach, the overhead of data transfer is drastically reduced.

## How (code changes)

Summary of code changes

 - Remove fromVersion and set options.
 - Refactor statement:string to statements:string[].
 - Move database file backup outside onUpgrade().
 - Add execute statements inside transaction logic.
 - Remove backup tables, find common columns, copy data and execute sets logic.

## Plugin new openDB process flow (only if currentVersion and targetVersion differs)

 - Backup the current version file backup-YOUR_DB_NAME
 - For each version between currentVersion and targetVersion
 - Starts transaction
 - Execute version statements
 - Commit transaction
 - Update database version
 - If process failed, restore the backup file
 - Delete the backup file

## Upgrade guide

Since this process introduces breaking changes, it is necessary to update the application code as follows:

For each version of the database

 - Remove fromVersion field
 - Rename statement field to statements and convert the string to an array of strings (string[]), each of which is a single statement ending in ;.
 - Convert set array (capSQLiteSet[]) to string array (string[]) and add every item to field statements.
 - Remove set field.

### Sample

#### Original upgrade statements array:

```js 
const upgradeStatements = [
  {
    fromVersion: 1,
    toVersion: 2,
    statement:
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY NOT NULL,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
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
        END;`,
    set: [
      {
        statement: 'INSERT INTO users (name,email,age) VALUES (?,?,?);',
        values: [
          ['Whiteley', 'whiteley@local.host', 30],
          ['Jones', 'jones@local.host', 44],
        ],
      },
    ],
  },
];
```

#### New upgrade statements array:

```js
const upgradeStatements = [
  {
    toVersion: 2,
    statements: [
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY NOT NULL,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        age INTEGER,
        last_modified INTEGER DEFAULT (strftime('%s', 'now'))
      );`,
      `CREATE INDEX IF NOT EXISTS users_index_name ON users (name);`,
      `CREATE INDEX IF NOT EXISTS users_index_last_modified ON users (last_modified);`,
      `CREATE TRIGGER IF NOT EXISTS users_trigger_last_modified
        AFTER UPDATE ON users
        FOR EACH ROW WHEN NEW.last_modified <= OLD.last_modified
        BEGIN
            UPDATE users SET last_modified= (strftime('%s', 'now')) WHERE id=OLD.id;
        END;`,

      // Sets as individual statements with data
      `INSERT INTO users (name,email,age) VALUES ('Whiteley', 'whiteley@local.host', 30);`,
      `INSERT INTO users (name,email,age) VALUES ('Jones', 'jones@local.host', 44);`,
    ],
  },
];
```

#### Diff changes

<p>const upgradeStatements = [</p>
<p>{</p>
<p style="width:fit-content;background:#7d1b1b;">-    fromVersion: 1,</p>
<p>     toVersion: 2,</p>
<p style="width:fit-content;background:#7d1b1b;">-    
statement:</p>
<p style="width:fit-content;background: #489f23;">+    statements: [</p>
<p>`CREATE TABLE IF NOT EXISTS users (</p>
<p style="margin-left: 20px;">id INTEGER PRIMARY KEY NOT NULL,</p>
<p style="margin-left: 20px;">email TEXT UNIQUE NOT NULL,</p>
<p style="margin-left: 20px;">name TEXT,</p>
<p style="margin-left: 20px;">age INTEGER,</p>
<p style="margin-left: 20px;">last_modified INTEGER DEFAULT (strftime('%s', 'now'))</p>
<p style="width:fit-content;background:#7d1b1b;">-      );</p>
<p style="width:fit-content;background:#7d1b1b;">-      CREATE INDEX IF NOT EXISTS users_index_name ON users (name);</p>
<p style="width:fit-content;background:#7d1b1b;">-      CREATE INDEX IF NOT EXISTS users_index_last_modified ON users (last_modified);</p>
<p style="width:fit-content;background:#7d1b1b;">-      CREATE TRIGGER IF NOT EXISTS users_trigger_last_modified</p>
<p style="width:fit-content;margin-left: 20px;background: #7d1b1b;">- FOR EACH ROW WHEN NEW.last_modified < OLD.last_modified</p>

<p style="width:fit-content;background: #489f23;">+      );`,</p>
<p style="width:fit-content;background: #489f23;">+      `CREATE INDEX IF NOT EXISTS users_index_name ON users (name);`,</p>
<p style="width:fit-content;background: #489f23;">+      `CREATE INDEX IF NOT EXISTS users_index_last_modified ON users (last_modified);`,</p>
<p style="width:fit-content;background: #489f23;">+      `CREATE TRIGGER IF NOT EXISTS users_trigger_last_modified</p>
<p style="margin-left: 20px;">AFTER UPDATE ON users</p>
<p style="width:fit-content;margin-left: 20px;background: #489f23;">+ FOR EACH ROW WHEN NEW.last_modified < OLD.last_modified</p>
<p style="margin-left: 20px;">BEGIN</p>
<p style="margin-left: 20px;">UPDATE users SET last_modified= (strftime('%s', 'now')) WHERE id=OLD.id;</p>
 <p style="margin-left: 20px;">END;`</p>
<p style="width:fit-content;background:#7d1b1b;">-    set: [</p>
<p style="width:fit-content;margin-left: 10px;background:#7d1b1b;">-      {</p>
<p style="width:fit-content;margin-left: 20px;background:#7d1b1b;">-        statement: 'INSERT INTO users (name,email,age) VALUES (?,?,?);',</p>
<p style="width:fit-content;margin-left: 20px;background:#7d1b1b;">-        values: [</p>
<p style="width:fit-content;margin-left: 25px;background:#7d1b1b;">-          ['Whiteley', 'whiteley@local.host', 30],</p>
<p style="width:fit-content;margin-left: 25px;background:#7d1b1b;">-          ['Jones', 'jones@local.host', 44],</p>
<p style="width:fit-content;margin-left: 20px;background:#7d1b1b;">-        ],</p>
<p style="width:fit-content;margin-left: 10px;background:#7d1b1b;">-      },</p>
<p style="width:fit-content;background: #489f23;">+</p>
<p style="width:fit-content;background: #489f23;">+      // Sets as individual statements with data</p>
<p style="width:fit-content;background: #489f23;">+      `INSERT INTO users (name,email,age) VALUES ('Whiteley', 'whiteley@local.host', 30);`,</p>
<p style="width:fit-content;background: #489f23;">+      `INSERT INTO users (name,email,age) VALUES ('Jones', 'jones@local.host', 44);`,
     ],
   },
 ];
</p>