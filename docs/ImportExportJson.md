<p align="center"><br><img src="https://user-images.githubusercontent.com/236501/85893648-1c92e880-b7a8-11ea-926d-95355b8175c7.png" width="128" height="128" /></p>
<h2 align="center">JSON Import/Export DOCUMENTATION</h2>
<p align="center"><strong><code>@capacitor-community/sqlite</code></strong></p>
<p align="center">
  Capacitor community plugin for Native and Electron SQLite Databases. For Native, databases could be encrypted with SQLCipher</p>

## Index

- [`Methods`](#methods)
  - [`Import From JSON`](#importfromjson)
  - [`Export To JSON`](#exporttojson)
  - [`Is JSON Valid`](#isjsonvalid)
  - [`Create Sync Table`](#createsynctable)
  - [`Set Sync Date`](#setsyncdate)
  - [`Json Object`](#json-object)
  - [`JSON Template Examples`](#json-template-examples)
  - [`Full Mode One Step`](#full-mode-one-step)
  - [`Full Mode Two Steps`](#full-mode-two-steps)
  - [`Partial Mode`](#partial-mode)
  - [`Full Mode with Triggers and UUID`](#full-mode-with-triggers-and-uuid)
  - [`Full Mode with Views`](#full-mode-with-views)
  - [`Partial Mode with Views`](#partial-mode-with-views)
  - [`Full Mode with Composite Foreign Key Constraints`](#full-mode-with-composite-foreign-key-constraints)
  - [`Import with Affinity Names`](#import-with-affinity-names)

## Methods

All the methods below give you all the bits and pieces to manage in your application the synchronization of SQL databases between a remote server and the mobile device. It can also be used for upgrading the schema of databases by exporting the current database to json, make the schema modifications in the json object and importing it back with the mode "full".

🚨 Release 3.4.3-2 Web, iOS & Android only ->> 🚨

The main change is related to the delete table's rows when a synchronization table exists as well as a last_mofidied table's column, allowing for database synchronization of the local database with a remote server database.

- All existing triggers to YOUR_TABLE_NAME_trigger_last_modified must be modified as follows
  ```
  CREATE TRIGGER YOUR_TABLE_NAME_trigger_last_modified
    AFTER UPDATE ON YOUR_TABLE_NAME
    FOR EACH ROW WHEN NEW.last_modified <= OLD.last_modified
    BEGIN
        UPDATE YOUR_TABLE_NAME SET last_modified= (strftime('%s', 'now')) WHERE id=NEW.id;
    END;
  ```
- an new column `sql_deleted` must be added to each of your tables as
  ```
  sql_deleted BOOLEAN DEFAULT 0 CHECK (sql_deleted IN (0, 1))
  ```
  This column will be autommatically set to 1 when you will use a `DELETE FROM ...` sql statement in the `execute`, `run` or `executeSet` methods.

- In the JSON object that you provide to `importFromJson`, all the deleted rows in your remote server database's tables must have the `sql_deleted` column set to 1. This will indicate to the import process to physically delete the corresponding rows in your local database. All the others rows must have the `sql_deleted` column set to 0. 

- In the JSON object outputs by the `exportToJson`, all the deleted rows in your local database have got the `sql_deleted` column set to 1 to help in your synchronization management process with the remote server database. A system `last_exported_date` is automatically saved in the synchronization table at the start of the export process flow.

- On successfull completion of your synchronization management process with the remote server database, you must 
  - Set a new synchronization date (as `(new Date()).toISOString()`) with the `setSyncDate` method.
  - Execute the `deleteExportedRows` method which physically deletes all table's rows having 1 as value for the `sql_deleted` column prior to the `last_exported_date` in your local database.

An example of using this new feature is given in [solidjs-vite-sqlite-app](https://github.com/jepiqueau/capacitor-solid-sqlite). It has been used to test the validity of the implementation.


🚨 Release 3.4.3-2 <<- 🚨


### importFromJson

This method allow to create a database from a JSON Object.
The created database can be encrypted or not based on the value of the name **_encrypted_**" of the JSON Object.

Prior to execute this method, the connection to the database must be closed.

The import mode can be selected either **full** or **partial**

To use the **partial** mode, it is mandatory to add a column **last_modified** to the schema of all tables in your database.

When a table schema is created if a **last_modified** column exists, a trigger **YOURTABLENAME_trigger_last_modified** is automatically added to make sure that the **last_modified** column is updated with the `date` of the modification to allow the synchronization process when exporting back the data to the server.

🚨 Since release 3.4.2 ->> 🚨

The trigger before 3.4.2 was 

`
CREATE TRIGGER IF NOT EXISTS YOURTABLENAME_trigger_last_modified
AFTER UPDATE ON YOURTABLENAME
FOR EACH ROW WHEN NEW.last_modified <= OLD.last_modified
BEGIN
    UPDATE YOURTABLENAME SET last_modified = (strftime('%s', 'now')) WHERE id=OLD.id;
END;
`

and is now and onwards to avoid updating the **last_modified** when no other values have been updated.

YOU MUST DELETE IT AND RE-CREATE IT FOR EACH OF YOUR TABLES AS BELOW: 

`
CREATE TRIGGER IF NOT EXISTS YOURTABLENAME_trigger_last_modified
AFTER UPDATE ON YOURTABLENAME
FOR EACH ROW WHEN NEW.last_modified < OLD.last_modified
BEGIN
    UPDATE YOURTABLENAME SET last_modified = (strftime('%s', 'now')) WHERE id=OLD.id;
END;
`
🚨 Since release 3.4.2 <<- 🚨

When no **last_modified** column added:
 -  **_full_** and **_partial_**  modes are available for import,
 -  only **_full_** mode is available for export

When mode **_full_** is choosen, all the existing **tables and views are dropped** if the database exists and they already exists in that database.

When mode **_partial_** is choosen, you can perform the following actions on an existing database

- create new tables with indexes and data,
- create new indexes to existing tables,
- inserting new data to existing tables,
- updating existing data to existing tables.
- create new views

When mode **_partial_**, if you include views and/or schema of tables already existing, the views and/or tables will not be modified.

Internally the `importFromJson`method is splitted into three SQL Transactions: 
  - transaction building the schema (Tables, Indexes) 
  - transaction creating the Table's Data (Insert, Update)
  - transaction creating the Views

🚨 Since release 3.4.2-3 ->> 🚨

 - **overwrite** boolean parameter has been added to the Json Object (default false) 
   - `true` : delete physically the database whatever the version is.
   - `false`: 
      - re-importing a database with the same `version` number will do nothing, keeping the existing database and will return `changes = 0`
      - re-importing a database with a lower `version` number will throw an error `ImportFromJson: Cannot import a version lower than `

 - During an import in `full` mode the `Foreign Key` constraint has been turn off before dropping the tables and turn back on after

🚨 Since release 3.4.2-3 <<- 🚨
### exportToJson

This method allow to download a database to a Json object.

The export mode can be selected either **full** or **partial**

To use the **partial** mode, it is mandatory to add a field **last_modified** to the schema of all tables in your database.
The export to Json will take all the schema, indexes or data which have been modified **after** the synchronization date.

### isJsonValid

this method allow to check if the Json Object is valid before processing an import or validating the resulting Json Object from an export.

### createSyncTable

Should be use once to create the table where the synchronization date is stored. To create a synchronization table, a column **last_modified** must be present in the database table's schema. 

### setSyncDate

Allow for updating the synchronization date. Only available if the synchronization table has been created.

### getSyncDate

Allow for retreiving the synchronization date. Only available if the synchronization table has been created.

## JSON Object

The JSON object is built up using the following types

It is **mandatory** that the first column in your database schema for all the tables is a primary key.
This is requested to identify if the value given is an INSERT or an UPDATE SQL command to be executed.

```js
export type jsonSQLite = {
  database: string,
  version: number,
  overwrite: boolean,    // since 3.4.2-3
  encrypted: boolean,
  mode: string,
  tables: Array<jsonTable>,
  views?: Array<jsonView>,
};

export type jsonTable = {
  name: string,
  schema?: Array<jsonColumn>,
  indexes?: Array<jsonIndex>,
  values?: Array<Array<any>>,
};
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
Modified in 2.9.7 to allow for CONSTRAINT PRIMARY KEY with combined columns
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
export type jsonColumn = {
  column?: string,
  foreignkey?: string,
  constraint?: string,
  value: string,
};
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
Modified in 2.9.2 to allow for INDEX UNIQUE and with combined columns
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
export type jsonIndex = {
  name: string,
  value: string,
  mode?: string
};
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
Modified in 2.9.8 to allow import/export triggers
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
export type JsonTrigger = {
  name: string,
  timeevent: string,
  condition?: string,
  logic: string,
};
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
Added in 3.2.2-1 to allow for View creation
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
export type jsonView = {
  name: string,
  value: string
};

```
## JSON Template Examples

### Full Mode One Step

```js
const dataToImport: jsonSQLite = {
  database: 'db-from-json',
  version: 1,
  encrypted: false,
  mode: 'full',
  tables: [
    {
      name: 'users',
      schema: [
        { column: 'id', value: 'INTEGER PRIMARY KEY NOT NULL' },
        { column: 'email', value: 'TEXT UNIQUE NOT NULL' },
        { column: 'name', value: 'TEXT' },
        { column: 'age', value: 'INTEGER' },
        {column:"sql_deleted", value:"BOOLEAN DEFAULT 0 CHECK (sql_deleted IN (0, 1))"},
        {column:"last_modified", value:"INTEGER DEFAULT (strftime('%s', 'now'))"}
      ],
      indexes: [
        { name: 'index_user_on_name', value: 'name' },
        { name: 'index_user_on_last_modified', value: 'last_modified DESC' },
        {
          name: 'index_user_on_email_name',
          value: 'email ASC, name',
          mode: 'UNIQUE',
        },
      ],
      values: [
        [1, 'Whiteley.com', 'Whiteley', 30, 0, 1582536810],
        [2, 'Jones.com', 'Jones', 44, 0, 1582812800],
        [3, 'Simpson@example.com', 'Simpson', 69, 0, 1583570630],
        [4, 'Brown@example.com', 'Brown', 15, 0, 1590383895],
      ],
    },
    {
      name: 'messages',
      schema: [
        { column: 'id', value: 'INTEGER PRIMARY KEY NOT NULL' },
        { column: 'userid', value: 'INTEGER' },
        { column: 'title', value: 'TEXT NOT NULL' },
        { column: 'body', value: 'TEXT NOT NULL' },
        {column:"sql_deleted", value:"BOOLEAN DEFAULT 0 CHECK (sql_deleted IN (0, 1))"},
        {column:"last_modified", value:"INTEGER DEFAULT (strftime('%s', 'now'))"},
        {
          foreignkey: 'userid',
          value: 'REFERENCES users(id) ON DELETE CASCADE',
        },
      ],
      indexes: [
        { name: 'index_messages_on_title', value: 'title' },
        {
          name: 'index_messages_on_last_modified',
          value: 'last_modified DESC',
        },
      ],
      values: [
        [1, 1, 'test post 1', 'content test post 1', 0, 1587310030],
        [2, 2, 'test post 2', 'content test post 2', 0, 1590388125],
        [3, 1, 'test post 3', 'content test post 3', 0, 1590383895],
      ],
    },
    {
      name: 'images',
      schema: [
        { column: 'id', value: 'INTEGER PRIMARY KEY NOT NULL' },
        { column: 'name', value: 'TEXT UNIQUE NOT NULL' },
        { column: 'type', value: 'TEXT NOT NULL' },
        { column: 'size', value: 'INTEGER' },
        { column: 'img', value: 'BLOB' },
        {column:"sql_deleted", value:"BOOLEAN DEFAULT 0 CHECK (sql_deleted IN (0, 1))"},
        {column:"last_modified", value:"INTEGER DEFAULT (strftime('%s', 'now'))"}
      ],
      indexes: [
        { name: 'index_images_on_last_modified', value: 'last_modified DESC' },
      ],
      values: [
        [1, 'meowth', 'png', 'NULL', Images[0], 0, 1590388825],
        [2, 'feather', 'png', 'NULL', Images[1], 0, 1590389895],
      ],
    },
  ],
};
```

Images are defined as base64 strings

```
const Images: Array<string> = [
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAkCAYAAAD7PHgWAAAEcElEQVRYR8WYP2hTQRzHfx10aQchi0JcLGpBSBcrlTrpIjoFiy6FDipOHVz8Q0HrUGxdg1N1KBRBackiVoQ6FMVIuzQgpEpdjOiSLUXQIfK9976X37t3l6RNxVuS3Hvv7nPf3+/3vcvraTQaDdlFK4z3yMT8rh7d0Ww97QAzfX12wFq9br4buOk7UpicaQm5F4toCajh9LKnLm23Bex0Ee3k7ArwS/mVvH5elqEzzWmGr0dhDwGGFs3ouMAdA7491y+Dhw5KZuG9UEEA1r6XZfhUPOxgQ0pzPQJIDTi11NtOKOkKkHCcpfDrjQlxaXnGdFE1fAcg2to7sWmgAfVYWCzbPwO06imNHt0Tyd/IyfDlrYRy7kI3fvyUsyvRPbsCxIPIGQ6MAdFWD5RbKnjxZhTSWn0+AqyuS2agEPWNjZhPjrUngBgQkABDQ3hNOJdnmvkXa5UZ6W2CxXBaRoBiLLR2cLgnUSRIbOSLlptVx8LQk7k5iHutah44Pks12+VfApBVh04YsAbV1yR7sslYXU+oSPUK46NWZWPmseJdATLfTJ5UJsxYBNXqoc+EeX7RgpbmRmX1pcjsSq95VkP5AM1czMl63ViS27iNen2QYSUoH+bWVq1WpTh5OAFp1ekbtz7JRVJBPH/+Sk6O5i4YQCxc57Sbq0i1loA2R6hKfDho7rFLqZWzYvXiqCKgSi/6LSC+o7l2ZCIWz5UChHqfH2alvPVVRp/sT4Q7P/1NstmssZ6okNKAyD803+5BICjohjm90qgnAajhcNEHiP7BgQHZqFQkK49FF40uDtyHrZAKEQ6/NWDIoAkcBAQcmpuHoZWG+l1IwlHBjgGp3rP1zchi4kpG3vi+7wQUkMgz5p8tKIwdnzHbhtiatALTRcLvtBnmmc/ANQCuo3JxLGMF6+tmHFUULqgJsUl6Bwy/jXr1elQUWlGnj37JyfQksBhWL/tpM/itK9kHanOQ3rd47bcZxxSIkl97ow67u2Lfouh/+l6EnIvXuU5/TNkMAAjnA7RhUf9RQkWkTRhh9TUCuuO6kUooCMBc/xHzzLG71ZYJjAUhPD6TDUERxoXTC7CRiqOXAIRBZ/J5e3/oXxvhdE6FqpA2g+sslFaA3iLRMmvfYz6l8ixWD/3adF0bwXUNiN87gcP9qfOg72jkepVWkIC6ELQZu5BdAWIwbSl6F9AWQEAXRB8GtOpaxa4BCan3Tp3cemJ3G9R+R/g9DbGenDtLCJQVHIL0AeqKb7fFkaWjdzMIrz4+afdvpWKoslks+Lx9YltufQy/hPICUj1OQAOHR9KGeABwAfk6xOeFOmdrxaI5c6Ktffgjs5/4VzV6QRVUkKcafRMHQh8hQ9udPrm4ChJQw7n3EJYp4D0PPl3YlKtjx+0K3UEAiZ3G9T3fATWRd5UJ8cEBCm3o9D47Fc8CKUCEEw/om/kUD7H4zY2e+Vh8UJb8/fTrDt+BA8/rfZ/j63m9gLSYUHL7Ks99ndZpdYZew3Fub4hbVd3/uvYXfqiMwjPten8AAAAASUVORK5CYII=",
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAU1QTFRFNjtAQEVK////bG9zSk9T/v7+/f39/f3+9vf3O0BETlJWNzxB/Pz8d3t+TFFVzM3O1NXX7u/vUldbRElNs7W3v8HCmZyeRkpPW19j8vLy7u7vvsDC9PT1cHR3Oj9Eo6WnxsjJR0tQOD1Bj5KVgYSHTVFWtri50dLUtLa4YmZqOT5D8vPzRUpOkZOWc3Z64uPjr7Gzuru95+jpX2NnaGxwPkNHp6mrioyPlZeadXh8Q0hNPEBFyszNh4qNc3d6eHx/OD1Cw8XGXGBkfoGEra+xxcbIgoaJu72/m52ggoWIZ2tu8/P0wcLE+vr7kZSXgIOGP0NIvr/BvL6/QUZKP0RJkpWYpKaoqKqtVVldmJqdl5qcZWhstbe5bHB0bnJ1UVVZwsTF5ubnT1RYcHN3oaSm3N3e3NzdQkdLnJ+h9fX1TlNX+Pj47/DwwsPFVFhcEpC44wAAAShJREFUeNq8k0VvxDAQhZOXDS52mRnKzLRlZmZm+v/HxmnUOlFaSz3su4xm/BkGzLn4P+XimOJZyw0FKufelfbfAe89dMmBBdUZ8G1eCJMba69Al+AABOOm/7j0DDGXtQP9bXjYN2tWGQfyA1Yg1kSu95x9GKHiIOBXLcAwUD1JJSBVfUbwGGi2AIvoneK4bCblSS8b0RwwRAPbCHx52kH60K1b9zQUjQKiULbMDbulEjGha/RQQFDE0/ezW8kR3C3kOJXmFcSyrcQR7FDAi55nuGABZkT5hqpk3xughDN7FOHHHd0LLU9qtV7r7uhsuRwt6pEJJFVLN4V5CT+SErpXt81DbHautkpBeHeaqNDRqUA0Uo5GkgXGyI3xDZ/q/wJMsb7/pwADAGqZHDyWkHd1AAAAAElFTkSuQmCC"
];
```

### Full Mode Two Steps

- first the database schema

```js
const dataToImport1: jsonSQLite = {
  database: 'db-from-json',
  version: 1,
  encrypted: false,
  mode: 'full',
  tables: [
    {
      name: 'users',
      schema: [
        { column: 'id', value: 'INTEGER PRIMARY KEY NOT NULL' },
        { column: 'email', value: 'TEXT UNIQUE NOT NULL' },
        { column: 'name', value: 'TEXT' },
        { column: 'age', value: 'INTEGER' },
        {column:"sql_deleted", value:"BOOLEAN DEFAULT 0 CHECK (sql_deleted IN (0, 1))"},
        {column:"last_modified", value:"INTEGER DEFAULT (strftime('%s', 'now'))"}
      ],
      indexes: [
        { name: 'index_user_on_name', value: 'name' },
        { name: 'index_user_on_last_modified', value: 'last_modified DESC' },
        {
          name: 'index_user_on_email_name',
          value: 'email ASC, name',
          mode: 'UNIQUE',
        },
      ],
    },
    {
      name: 'messages',
      schema: [
        { column: 'id', value: 'INTEGER PRIMARY KEY NOT NULL' },
        { column: 'userid', value: 'INTEGER' },
        { column: 'title', value: 'TEXT NOT NULL' },
        { column: 'body', value: 'TEXT NOT NULL' },
        {column:"sql_deleted", value:"BOOLEAN DEFAULT 0 CHECK (sql_deleted IN (0, 1))"},
        {column:"last_modified", value:"INTEGER DEFAULT (strftime('%s', 'now'))"},
        {
          foreignkey: 'userid',
          value: 'REFERENCES users(id) ON DELETE CASCADE',
        },
      ],
      indexes: [
        {
          name: 'index_messages_on_last_modified',
          value: 'last_modified DESC',
        },
      ],
    },
  ],
};
```

- followed by an import of the Table' Data

```js
const dataToImport2: jsonSQLite = {
  database: 'db-from-json',
  version: 1,
  encrypted: false,
  mode: 'full',
  tables: [
    {
      name: 'users',
      values: [
        [1, 'Whiteley.com', 'Whiteley', 30, 0, 1582536810],
        [2, 'Jones.com', 'Jones', 44, 0, 1582812800],
        [3, 'Simpson@example.com', 'Simpson', 69, 0, 1583570630],
        [4, 'Brown@example.com', 'Brown', 15, 0, 1590383895],
      ],
    },
    {
      name: 'messages',
      values: [
        [1, 1, 'test post 1', 'content test post 1', 0, 1587310030],
        [2, 2, 'test post 2', 'content test post 2', 0, 1590388125],
        [3, 1, 'test post 3', 'content test post 3', 0, 1590383895],
      ],
    },
  ],
};
```

### Partial Mode

```js
const partialImport1: any = {
    database : "db-from-json",
    version: 1,
    encrypted : false,
    mode : "partial",
    tables :[
        {
          name: "users",
          values: [
              [5,"Addington.com","Addington",22,0,1601972413],
              [6,"Bannister.com","Bannister",59,0,1601983245],
              [2,"Jones@example.com","Jones",45,0,1601995473],
              [1, 'Whiteley.com', 'Whiteley', 30, 1, 1601995520],
          ]
        },
        {
          name: "messages",
          indexes: [
              {name: "index_messages_on_title", value: "title"}
          ],
          values: [
              [4,2,"test post 4","content test post 4",0,1601983742],
              [5,6,"test post 5","content test post 5",0,1601992872]
              [1,1,'test post 1', 'content test post 1',1,1601995520],
              [3,1,'test post 3', 'content test post 3',1,1601995520],
         ]
        },
        {
          name: 'fruits',
          schema: [
            { column: 'id', value: 'INTEGER PRIMARY KEY NOT NULL' },
            { column: 'name', value: 'TEXT UNIQUE NOT NULL' },
            { column: 'weight', value: 'REAL' },
            {column:"sql_deleted", value:"BOOLEAN DEFAULT 0 CHECK (sql_deleted IN (0, 1))"},
            {column:"last_modified", value:"INTEGER DEFAULT (strftime('%s', 'now'))"}
          ],
          indexes: [
            { name: 'index_fruits_on_name', value: 'name' },
            { name: "index_fruits_on_last_modified",value: "last_modified DESC"},
          ],
          values: [
            [1, 'orange', 200.3,0,1601995573],
            [2, 'apple', 450.0,0,1601995573],
            [2, 'banana', 120.5,0,1601995573],
          ],
        },
        {
          name: 'company',
          schema: [
            { column: 'id', value: 'INTEGER NOT NULL' },
            { column: 'name', value: 'TEXT NOT NULL' },
            { column: 'age', value: 'INTEGER NOT NULL' },
            { column: 'address', value: 'TEXT' },
            { column: 'salary', value: 'REAL'},
            {column:"sql_deleted", value:"BOOLEAN DEFAULT 0 CHECK (sql_deleted IN (0, 1))"},
            {column:"last_modified", value:"INTEGER DEFAULT (strftime('%s', 'now'))"},
            { constraint: 'PK_id_name', value: 'PRIMARY KEY (id,name)'},
          ],
        },
    ],
};
```

### Full Mode with Triggers and UUID

```ts
export const dataToImport59: any = {
  database: 'db-from-json59',
  version: 1,
  encrypted: false,
  mode: 'full',
  tables: [
    {
      name: 'countries',
      schema: [
        { column: 'id', value: 'TEXT PRIMARY KEY NOT NULL' },
        { column: 'name', value: 'TEXT UNIQUE NOT NULL' },
        { column: 'code', value: 'TEXT' },
        { column: 'language', value: 'TEXT' },
        { column: 'phone_code', value: 'TEXT' },
        {column:"sql_deleted", value:"BOOLEAN DEFAULT 0 CHECK (sql_deleted IN (0, 1))"},
        {column:"last_modified", value:"INTEGER DEFAULT (strftime('%s', 'now'))"}
      ],
      indexes: [
        { name: 'index_country_on_name', value: 'name', mode: 'UNIQUE' },
        { name: 'index_country_on_last_modified', value: 'last_modified DESC' },
      ],
      values: [
        ['3', 'Afghanistan', 'AF', 'fa', '93', 0, 1608216034],
        ['6', 'Albania', 'AL', 'sq', '355', 0, 1608216034],
        ['56', 'Algeria', 'DZ', 'ar', '213', 0, 1608216034],
      ],
    },
    {
      name: 'customers',
      schema: [
        { column: 'id', value: 'TEXT PRIMARY KEY NOT NULL' },
        { column: 'first_name', value: 'TEXT NOT NULL' },
        { column: 'last_name', value: 'TEXT NOT NULL' },
        { column: 'gender', value: 'TEXT NOT NULL' },
        { column: 'email', value: 'TEXT UNIQUE NOT NULL' },
        { column: 'phone', value: 'TEXT' },
        { column: 'national_id', value: 'TEXT NOT NULL' },
        { column: 'date_of_birth', value: 'TEXT' },
        { column: 'created_at', value: 'TEXT' },
        { column: 'created_by', value: 'TEXT' },
        { column: 'last_edited', value: 'TEXT' },
        { column: 'organization', value: 'TEXT' },
        { column: 'comment_id', value: 'TEXT' },
        { column: 'country_id', value: 'TEXT NOT NULL' },
        {column:"sql_deleted", value:"BOOLEAN DEFAULT 0 CHECK (sql_deleted IN (0, 1))"},
        {column:"last_modified", value:"INTEGER DEFAULT (strftime('%s', 'now'))"},
        {
          foreignkey: 'country_id',
          value: 'REFERENCES countries(id) ON DELETE CASCADE',
        },
      ],
      indexes: [
        { name: 'index_customers_on_email', value: 'email', mode: 'UNIQUE' },
        {
          name: 'index_customers_on_last_modified',
          value: 'last_modified DESC',
        },
      ],
      triggers: [
        {
          name: 'validate_email_before_insert_customers',
          timeevent: 'BEFORE INSERT',
          logic:
            "BEGIN SELECT CASE WHEN NEW.email NOT LIKE '%_@__%.__%' THEN RAISE (ABORT,'Invalid email address') END; END",
        },
      ],
      values: [
        [
          'ef5c57d5-b885-49a9-9c4d-8b340e4abdbc',
          'William',
          'Jones',
          '1',
          'peterjones@mail.com<peterjones@mail.com>',
          '420305202',
          '1234567',
          '1983-01-04',
          '2020-11-1212:39:02',
          '3',
          '2020-11-19 05:10:10',
          '1',
          'NULL',
          '3',
          0,
          1608216040,
        ],
        [
          'bced3262-5d42-470a-9585-d3fd12c45452',
          'Alexander',
          'Brown',
          '1',
          'alexanderbrown@mail.com<alexanderbrown@mail.com>',
          '420305203',
          '1234572',
          '1990-02-07',
          '2020-12-1210:35:15',
          '1',
          '2020-11-19 05:10:10',
          '2',
          'NULL',
          '6',
          0,
          1608216040,
        ],
      ],
    },
  ],
};
```

### Full Mode with Views

```ts
export const dataToImport167: any = {
  database: "db-issue167",
  version: 1,
  encrypted: false,
  mode: "full",
  tables: [
    {
      name: "departments",
      schema: [
        {column: "id", value: "INTEGER PRIMARY KEY AUTOINCREMENT" },
        {column: "name", value: "TEXT NOT NULL" },
        {column:"sql_deleted", value:"BOOLEAN DEFAULT 0 CHECK (sql_deleted IN (0, 1))"},
        {column:"last_modified", value:"INTEGER DEFAULT (strftime('%s', 'now'))"}
      ],
      indexes: [
        {name: "index_departments_on_last_modified",value: "last_modified DESC"}
      ],
      values: [
        [1,"Admin",0,1608216034],
        [2,"Sales",0,1608216034],
        [3,"Quality Control",0,1608216034],
        [4,"Marketing",0,1608216034],
      ]
    },
    {
      name: "employees",
      schema: [
        {column: "id", value: "INTEGER PRIMARY KEY AUTOINCREMENT" },
        {column: "first_name", value: "TEXT" },
        {column: "last_name", value: "TEXT" },
        {column: "salary", value: "NUMERIC" },
        {column: "dept_id", value: "INTEGER" },
        {column:"sql_deleted", value:"BOOLEAN DEFAULT 0 CHECK (sql_deleted IN (0, 1))"},
        {column:"last_modified", value:"INTEGER DEFAULT (strftime('%s', 'now'))"}
      ],
      indexes: [
        {name: "index_departments_on_last_modified",value: "last_modified DESC"}
      ],
      values: [
        [1,"John","Brown",27500,1,0,1608216034],
        [2,"Sally","Brown",37500,2,0,1608216034],
        [3,'Vinay','Jariwala', 35100,3,0,1608216034],
        [4,'Jagruti','Viras', 9500,2,0,1608216034],
        [5,'Shweta','Rana',12000,3,0,1608216034],
        [6,'sonal','Menpara', 13000,1,0,1608216034],
        [7,'Yamini','Patel', 10000,2,0,1608216034],
        [8,'Khyati','Shah', 50000,3,0,1608216034],
        [9,'Shwets','Jariwala',19400,2,0,1608216034],
        [10,'Kirk','Douglas',36400,4,0,1608216034],
        [11,'Leo','White',45000,4,0,1608216034],
      ],
    }
  ],
  views: [
    {name: "SalesTeam", value: "SELECT id,first_name,last_name from employees WHERE dept_id IN (SELECT id FROM departments where name='Sales')"},
    {name: "AdminTeam", value: "SELECT id,first_name,last_name from employees WHERE dept_id IN (SELECT id FROM departments where name='Admin')"},
  ]
}

```

### Partial Mode with Views

```ts
export const viewsToImport167: any = {
  database: "db-issue167",
  version: 1,
  encrypted: false,
  mode: "partial",
  tables: [],
  views: [
    {name: "QualityControlTeam", value: "SELECT id,first_name,last_name from employees WHERE dept_id IN (SELECT id FROM departments where name='Quality Control')"},
    {name: "MarketingTeam", value: "SELECT id,first_name,last_name from employees WHERE dept_id IN (SELECT id FROM departments where name='Marketing')"},
  ]
}

```

### Full Mode with Composite Foreign Key Constraints

```ts
export const schemaToImport179 = {
    database: 'db-issue179',
    version: 1,
    encrypted: false,
    mode: 'full',
    tables: [
      {
        name: 'album',
        schema: [
          { column: 'albumartist', value: 'TEXT NOT NULL' },
          { column: 'albumname', value: 'TEXT NOT NULL' },
          { column: 'albumcover', value: 'BINARY' },
          {column:"sql_deleted", value:"BOOLEAN DEFAULT 0 CHECK (sql_deleted IN (0, 1))"},
          {column:"last_modified", value:"INTEGER DEFAULT (strftime('%s', 'now'))"}
          { constraint: 'PK_albumartist_albumname', value: 'PRIMARY KEY (albumartist,albumname)'},
        ],
        indexes: [
          { name: 'index_album_on_albumartist_albumname', value: 'albumartist,albumname' },
          { name: 'index_album_on_last_modified', value: 'last_modified DESC' },
        ],
      },
      {
        name: 'song',
        schema: [
          { column: 'songid', value: 'INTEGER PRIMARY KEY NOT NULL' },
          { column: 'songartist', value: 'TEXT NOT NULL' },
          { column: 'songalbum', value: 'TEXT NOT NULL' },
          { column: 'songname', value: 'TEXT NOT NULL' },
          {column:"sql_deleted", value:"BOOLEAN DEFAULT 0 CHECK (sql_deleted IN (0, 1))"},
          {column:"last_modified", value:"INTEGER DEFAULT (strftime('%s', 'now'))"},
          {
            foreignkey: 'songartist,songalbum',
            value: 'REFERENCES album(albumartist,albumname)',
          },
        ],
        indexes: [
            { name: 'index_song_on_songartist_songalbum', value: 'songartist,songalbum' },
            {
            name: 'index_song_on_last_modified',
            value: 'last_modified DESC',
          },
        ],
      },
    ],
  };
```

### Import with Affinity Names

```ts
const dataToImportFull71: any = {
  database : 'db-from-json71',
  version : 1,
  encrypted : false,
  mode : 'full',
  tables :[
      {
          name: 'company',
          schema: [
              {column:'id', value: 'INTEGER'},
              {column:'name', value:'VARCHAR(25) NOT NULL'},
              {column:'age', value:'INT NOT NULL'},
              {column:'country', value:'CHARACTER(20)'},
              {column:'salary', value:'DECIMAL(10,3)'},
              {column:'manager', value:'BOOLEAN DEFAULT 0 CHECK (manager IN (0, 1))'},
              {column:"sql_deleted", value:"BOOLEAN DEFAULT 0 CHECK (sql_deleted IN (0, 1))"},
              {column:"last_modified", value:"INTEGER DEFAULT (strftime('%s', 'now'))"},
              {constraint:'PK_name_country', value:'PRIMARY KEY (name,country)'}
          ],
          values: [
              [1,'Jones',55,'Australia',1250,1,0,1608216034],
              [2,'Lawson',32,'Ireland',2345.60,0,0,1608216034],
              [3,'Bush',44,'USA',1850.10,0,0,1608216034],
          ]
      },
  ]
};
```
