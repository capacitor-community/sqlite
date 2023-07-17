<p align="center"><br><img src="https://user-images.githubusercontent.com/236501/85893648-1c92e880-b7a8-11ea-926d-95355b8175c7.png" width="128" height="128" /></p>
<h2 align="center">SQLite RETURNING DOCUMENTATION</h2>
<p align="center"><strong><code>@capacitor-community/sqlite</code></strong></p>
<p align="center">
  Capacitor community plugin for Native and Electron SQLite Databases. For <strong>Native</strong> and <strong>Electron</strong> platforms, databases could be encrypted with SQLCipher</p>
<p align="left">
  <strong>RETURNING</strong> has been implemented for <strong>INSERT, DELETE and UPDATE. </strong> <br>
  This implementation concerns the two methods <strong>RUN and EXECUTESET</strong> <br>
  <strong>capSQLiteChanges</strong> has been amended by adding a values field, {changes: {changes:number, lastId: number, values:any[]}}<br>
  Three returned modes are available 
  <ul>
   <ui> - 'all' returns in values  all the modifications</ui><br>
   <ui> - 'one' returns in values  the first modification</ui><br>
   <ui> - 'no'  default do not return any modifications</ui><br>
  </ul>
</p>

## Example for RUN method

```ts
const createSchemaTest: string = `
  CREATE TABLE IF NOT EXISTS test (
    id INTEGER PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL
  );
  `;

// Create the connection
const db = await this.sqliteService.createConnection("test", false,
                                               "no-encryption", 1);
// Open the database
await db.open();

// Create the database schema
const res: any = await db.execute(createSchemaTest);
console.log(`>>> res: ${JSON.stringify(res)}`);
// mode 'no' INSERT
const resI0:any = await db.run("INSERT INTO test (name,email) VALUES ('Ackerman','ackerman@example.com') , ('Jefferson','jefferson@example.com');",[],true,'no');
console.log(`>>> resI0: ${JSON.stringify(resI0)}`);
// mode 'all' INSERT
const resI:any = await db.run("INSERT INTO test (name,email) VALUES ('Jeepq','jeepq@example.com') , ('Brown','brown@example.com') RETURNING *;",[],true,'all');
console.log(`>>> resI: ${JSON.stringify(resI)}`);
// mode 'one' INSERT
const resI1:any = await db.run("INSERT INTO test (name,email) VALUES ('Jones','jones@example.com') , ('Davison','davison@example.com') RETURNING email;",[],true,'one');
console.log(`>>> resI1: ${JSON.stringify(resI1)}`);
// mode 'no' INSERT
const resI2:any = await db.run("INSERT INTO test (name,email) VALUES ('White','white@example.com') , ('Johnson','Johnson@example.com') RETURNING name;",[],true,'no');
console.log(`>>> resI2: ${JSON.stringify(resI2)}`);
// mode 'all' INSERT with values
const resI3:any = await db.run("INSERT INTO test (name,email) VALUES (?,?) , (?,?) RETURNING name;",['Dupond','dupond@example.com','Toto','toto@example.com'],true,'all');
console.log(`>>> resI3: ${JSON.stringify(resI3)}`);
// mode 'one' UPDATE
const resU1:any = await db.run("UPDATE test SET email='jeepq.@company.com' WHERE name='Jeepq' RETURNING id,email;",[],true,'one');
console.log(`>>> resU1: ${JSON.stringify(resU1)}`);
// mode 'all' DELETE
const resD1:any = await db.run("DELETE FROM test WHERE id IN (2,4,6) RETURNING id,name;",[],true,'all');
console.log(`>>> resD1: ${JSON.stringify(resD1)}`);
// Query the database
const resQ1: any = await db.query('SELECT * FROM test;');
console.log(`>>> resQ1: ${JSON.stringify(resQ1)}`);
// Close the connection
await this.sqliteService.closeConnection("test");
console.log(`after closeConnection`);

```

## Example for EXECUTESET method

```ts
const createSchemaTest: string = `
  CREATE TABLE IF NOT EXISTS test (
    id INTEGER PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL
  );
  `;

// Create the connection
const db = await this.sqliteService.createConnection("test", false,
                                               "no-encryption", 1);
// Open the database
await db.open();

// Create the database schema
const res: any = await db.execute(createSchemaTest);
console.log(`>>> res: ${JSON.stringify(res)}`);
// Create some Sets of users
// Mode 'all'
let setUsers = [
  { statement:"INSERT INTO test (name,email) VALUES ('Simpson','simpson@example.com'), ('Devil', 'devil@example.com') RETURNING *;",
    values:[
    ]
  },
  { statement:"INSERT INTO test (name,email) VALUES ('Dowson','dowson@example.com'), ('Castel', 'castel@example.com') RETURNING name;",
    values:[
    ]
  },
  { statement:"INSERT INTO test (name,email) VALUES (?,?) RETURNING *;",
    values:[
      ['Jackson','jackson@example.com'],
      ['Kennedy','kennedy@example.com']
    ]
  },
  { statement:"UPDATE test SET email = 'jackson@company.com' WHERE name = 'Jackson' RETURNING *;",
    values:[
    ]
  },
  { statement:"DELETE FROM test WHERE id IN (1,3,9) RETURNING *;",
    values:[
    ]
  }
];
const resS1 = await db.executeSet(setUsers, false, 'all');
console.log(`>>> resS1: ${JSON.stringify(resS1)}`);

// Mode 'one'
setUsers = [
  { statement:"INSERT INTO test (name,email) VALUES ('Valley','valley@example.com'), ('Botta', 'Botta@example.com') RETURNING name;",
    values:[
    ]
  }
];
const resS2 = await db.executeSet(setUsers, false, 'one');
console.log(`>>> resS2: ${JSON.stringify(resS2)}`);

//Mode 'no'
setUsers = [
  { statement:"INSERT INTO test (name,email) VALUES ('Fisher','fisher@example.com'), ('Summerfield', 'summerfield@example.com') RETURNING *;",
    values:[
    ]
  }
];
const resS3 = await db.executeSet(setUsers, false, 'no');
console.log(`>>> resS3: ${JSON.stringify(resS3)}`);
// Query the database
const resQ2: any = await db.query('SELECT * FROM test;');
console.log(`>>> resQ2: ${JSON.stringify(resQ2)}`);
// Close the connection
await this.sqliteService.closeConnection("test");
console.log(`after closeConnection`);


```

