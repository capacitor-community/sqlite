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

## Methods

All the methods below give you all the bits and pieces to manage in your application the synchronization of SQL databases between a remote server and the mobile device. It can also be used for upgrading the schema of databases by exporting the current database to json, make the schema modifications in the json object and importing it back with the mode "full".

### importFromJson

This method allow to create a database from a JSON Object.
The created database can be encrypted or not based on the value of the name **_encrypted_**" of the JSON Object.

The import mode can be selected either **full** or **partial**

When mode **_full_** is choosen, all the existing **tables are dropped** if the database exists and they already exist in that database.

When mode **_partial_** is choosen, you can perform the following actions on an existing database

- create new tables with indexes and data,
- create new indexes to existing tables,
- inserting new data to existing tables,
- updating existing data to existing tables.

if in mode **_partial_**, you include schema of tables which are already existing, the tables will not be modified.

Internally the `importFromJson`method is splitted into two SQL Transactions: - transaction building the schema (Tables, Indexes) - transaction creating the Table's Data (Insert, Update)

### exportToJson

This method allow to download a database to a Json object.

The export mode can be selected either **full** or **partial**

To use the **partial** mode, it is mandatory to add a field **last_modified** to the schema of all tables in your database.
The export to Json will take all the schema, indexes or data which have been modified **after** the synchronization date.

### isJsonValid

this method allow to check if the Json Object is valid before processing an import or validating the resulting Json Object from an export.

### createSyncTable

Should be use once to create the table where the synchronization date is stored.

### setSyncDate

Allow for updating the synchronization date.

## JSON Object

The JSON object is built up using the following types

It is **mandatory** that the first column in your database schema for all the tables is a primary key.
This is requested to identify if the value given is an INSERT or an UPDATE SQL command to be executed.

```js
export type jsonSQLite = {
  database: string,
  version: number,
  encrypted: boolean,
  mode: string,
  tables: Array<jsonTable>,
};
export type jsonTable = {
  name: string,
  schema?: Array<jsonColumn>,
  indexes?: Array<jsonIndex>,
  values?: Array<Array<any>>,
};
export type jsonColumn = {
  column?: string,
  foreignkey?: string,
  value: string,
};
export type jsonIndex = {
  name: string,
  column: string,
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
        { column: 'last_modified', value: 'INTEGER' },
      ],
      indexes: [
        { name: 'index_user_on_name', column: 'name' },
        { name: 'index_user_on_last_modified', column: 'last_modified' },
      ],
      values: [
        [1, 'Whiteley.com', 'Whiteley', 30, 1582536810],
        [2, 'Jones.com', 'Jones', 44, 1582812800],
        [3, 'Simpson@example.com', 'Simpson', 69, 1583570630],
        [4, 'Brown@example.com', 'Brown', 15, 1590383895],
      ],
    },
    {
      name: 'messages',
      schema: [
        { column: 'id', value: 'INTEGER PRIMARY KEY NOT NULL' },
        { column: 'userid', value: 'INTEGER' },
        { column: 'title', value: 'TEXT NOT NULL' },
        { column: 'body', value: 'TEXT NOT NULL' },
        { column: 'last_modified', value: 'INTEGER' },
        {
          foreignkey: 'userid',
          value: 'REFERENCES users(id) ON DELETE CASCADE',
        },
      ],
      indexes: [
        { name: 'index_messages_on_title', column: 'title' },
        { name: 'index_messages_on_last_modified', column: 'last_modified' },
      ],
      values: [
        [1, 1, 'test post 1', 'content test post 1', 1587310030],
        [2, 2, 'test post 2', 'content test post 2', 1590388125],
        [3, 1, 'test post 3', 'content test post 3', 1590383895],
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
        { column: 'last_modified', value: 'INTEGER' },
      ],
      indexes: [
        { name: 'index_images_on_last_modified', column: 'last_modified' },
      ],
      values: [
        [1, 'meowth', 'png', 'NULL', Images[0], 1590388825],
        [2, 'feather', 'png', 'NULL', Images[1], 1590389895],
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
        { column: 'last_modified', value: 'INTEGER' },
      ],
      indexes: [
        { name: 'index_user_on_name', column: 'name' },
        { name: 'index_user_on_last_modified', column: 'last_modified' },
      ],
    },
    {
      name: 'messages',
      schema: [
        { column: 'id', value: 'INTEGER PRIMARY KEY NOT NULL' },
        { column: 'userid', value: 'INTEGER' },
        { column: 'title', value: 'TEXT NOT NULL' },
        { column: 'body', value: 'TEXT NOT NULL' },
        { column: 'last_modified', value: 'INTEGER' },
        {
          foreignkey: 'userid',
          value: 'REFERENCES users(id) ON DELETE CASCADE',
        },
      ],
      indexes: [
        { name: 'index_messages_on_last_modified', column: 'last_modified' },
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
        [1, 'Whiteley.com', 'Whiteley', 30, 1582536810],
        [2, 'Jones.com', 'Jones', 44, 1582812800],
        [3, 'Simpson@example.com', 'Simpson', 69, 1583570630],
        [4, 'Brown@example.com', 'Brown', 15, 1590383895],
      ],
    },
    {
      name: 'messages',
      values: [
        [1, 1, 'test post 1', 'content test post 1', 1587310030],
        [2, 2, 'test post 2', 'content test post 2', 1590388125],
        [3, 1, 'test post 3', 'content test post 3', 1590383895],
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
              [5,"Addington.com","Addington",22,1601972413],
              [6,"Bannister.com","Bannister",59,1601983245],
              [2,"Jones@example.com","Jones",45,1601995473],
          ]
        },
        {
          name: "messages",
          indexes: [
              {name: "index_messages_on_title",
              column: "title"
              }
          ],
          values: [
              [4,1"test post 4","content test post 4",1601983742],
              [5,6,"test post 5","content test post 5",1601992872]
          ]
        },
        {
          name: 'fruits',
          schema: [
            { column: 'id', value: 'INTEGER PRIMARY KEY NOT NULL' },
            { column: 'name', value: 'TEXT UNIQUE NOT NULL' },
            { column: 'weight', value: 'REAL' },
            { column:"last_modified", value:"INTEGER"},
          ],
          indexes: [
            { name: 'index_fruits_on_name', column: 'name' },
            { name: "index_fruits_on_last_modified",column: "last_modified"},
          ],
          values: [
            [1, 'orange', 200.3,1601995573],
            [2, 'apple', 450.0,1601995573],
            [2, 'banana', 120.5,1601995573],
          ],
        },
    ],
};
```
