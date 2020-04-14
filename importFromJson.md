# importFromJson method

This method allow to create a database from a JSON Object.
The created database can be encrypted or not based on the value of the name ***encrypted***" of the JSON Object.

The import mode can be selected either **full** or **partial**

When mode ***full*** is choosen, all the existing **tables are dropped** if the database exists and they already exist in that database. 

When mode ***partial*** is choosen, you can perform the following actions on an existing database

 - create new tables with indexes and data,
 - create new indexes to existing tables,
 - inserting new data to existing tables,
 - updating existing data to existing tables.

if in mode ***partial***, you include schema of tables which are already existing, the tables will not be modified.


Internally the ```importFromJson```method is splitted into two SQL Transactions:
    - transaction building the schema (Tables, Indexes)
    - transaction creating the Table's Data (Insert, Update)

## JSON Object

The JSON object is built up using the following types

It is **mandatory** that the first column in your database schema is a primary key of the table. 
This is requested to identify if the value given is an INSERT or an UPDATE SQL command to be executed

```js
export type jsonSQLite = {
  database : string,
  encrypted : boolean,
  mode: string,
  tables : Array<jsonTable>
}
export type jsonTable = {
  name: string,
  schema?: Array<jsonColumn>,
  indexes?: Array<jsonIndex>,
  values?: Array<Array<any>>
}
export type jsonColumn = {
  column: string,
  value: string
}
export type jsonIndex = {
  name: string,
  column: string
}
```

## JSON Template Examples

### Full Mode

```js
const dataToImport: jsonSQLite = {
    database : "db-from-json",
    encrypted : false,
    mode : "full",
    tables :[
        {
            name: "users",
            schema: [
                {column:"id", value: "INTEGER PRIMARY KEY NOT NULL"},
                {column:"email", value:"TEXT UNIQUE NOT NULL"},
                {column:"name", value:"TEXT"},
                {column:"age", value:"INTEGER"}
            ],
            indexes: [
                {name: "index_user_on_name",
                    column: "name"   
                }
            ],
            values: [
                [1,"Whiteley.com","Whiteley",30],
                [2,"Jones.com","Jones",44],
                [3,"Simpson@example.com","Simpson",69],
                [4,"Brown@example.com","Brown",15]
            ]
        },
        {
            name: "messages",
            schema: [
            {column:"id", value: "INTEGER PRIMARY KEY NOT NULL"},
            {column:"title", value:"TEXT NOT NULL"},
            {column:"body", value:"TEXT NOT NULL"}
            ],
            values: [
                [1,"test post 1","content test post 1"],
                [2,"test post 2","content test post 2"]
            ]
        }
    
    ]
};
```

or first the database schema

```js
const dataToImport1: jsonSQLite = {
    database : "db-from-json",
    encrypted : false,
    mode : "full",
    tables :[
        {
            name: "users",
            schema: [
                {column:"id", value: "INTEGER PRIMARY KEY NOT NULL"},
                {column:"email", value:"TEXT UNIQUE NOT NULL"},
                {column:"name", value:"TEXT"},
                {column:"age", value:"INTEGER"}
            ],
            indexes: [
                {name: "index_user_on_name",
                    column: "name"   
                }
            ]
        },
        {
            name: "messages",
            schema: [
            {column:"id", value: "INTEGER PRIMARY KEY NOT NULL"},
            {column:"title", value:"TEXT NOT NULL"},
            {column:"body", value:"TEXT NOT NULL"}
            ]
        }   
    ]
};
```

followed by an import of the Table' Data

```js
const dataToImport2: jsonSQLite = {
    database : "db-from-json",
    encrypted : false,
    mode : "full",
    tables :[
        {
            name: "users",
            values: [
                [1,"Whiteley.com","Whiteley",30],
                [2,"Jones.com","Jones",44],
                [3,"Simpson@example.com","Simpson",69],
                [4,"Brown@example.com","Brown",15]
            ]
        },
        {
            name: "messages",
            values: [
                [1,"test post 1","content test post 1"],
                [2,"test post 2","content test post 2"]
            ]
        }
    
    ]
};
```

### Partial Mode

```js
const partialImport1: any = {
    database : "db-from-json",
    encrypted : false,
    mode : "partial",
    tables :[
        {
            name: "users",
            values: [
                [5,"Addington.com","Addington",22],
                [6,"Bannister.com","Bannister",59],
                [2,"Jones@example.com","Jones",45],

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
                [3,"test post 3","content test post 3"],
                [4,"test post 4","content test post 4"]
            ]
        }

    ]
}; 
```

```js
const partialImport1: any = {
    database : "db-from-json",
    encrypted : false,
    mode : "partial",
    tables :[
        {
            name: "users",
            values: [
                [5,"Addington.com","Addington",22],
                [6,"Bannister.com","Bannister",59],
                [2,"Jones@example.com","Jones",45],

            ]
        },
        {
            name: "fruits",
            schema: [
                {column:"id", value: "INTEGER PRIMARY KEY NOT NULL"},
                {column:"name", value:"TEXT UNIQUE NOT NULL"},
                {column:"weight", value:"INTEGER"}
            ],
            indexes: [
                {name: "index_fruits_on_name",
                column: "name"   
                }
            ],
            values: [
                [1,"orange",200],
                [2,"apple",450],
                [2,"banana",120]
            ]
        }

    ]
}; 
```

