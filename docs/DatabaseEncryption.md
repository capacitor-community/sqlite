<p align="center"><br><img src="https://user-images.githubusercontent.com/236501/85893648-1c92e880-b7a8-11ea-926d-95355b8175c7.png" width="128" height="128" /></p>
<h2 align="center">SQLite Database Encryption DOCUMENTATION</h2>
<p align="center"><strong><code>@capacitor-community/sqlite</code></strong></p>
<p align="center">
  Capacitor community plugin for Native and Electron SQLite Databases. For <strong>Native</strong> and <strong>Electron</strong> platforms, databases could be encrypted with SQLCipher extension of SQLite</p>
<p align="left">
  <strong>SQLCipher</strong> adds 256 bit AES encryption of database files. <br>
  <strong><code>@capacitor-community/sqlite</code></strong> allows: <br>
  <ul>
    <ui> - Encryption of existing non-encrypted database </ui><br>
    <ui> - Encryption of new database </ui><br>
  </ul>
</p>

## Prerequisite

 <strong>iosIsEncryption</strong> and/or <strong>androidIsEncryption</strong> and/or <strong>electronIsEncryption </strong>must be set to true in the <strong><code>capacitor.config.ts</code></strong> file of the project

 ```ts
const config: CapacitorConfig = {
  ...
    plugins: {
      CapacitorSQLite: {
        ...
        iosIsEncryption: true,
        ...
        androidIsEncryption: true,
        ...
        electronIsEncryption: true,
        ...
      }
    }
  ...
}
 ```


## Encryption of existing non-encrypted database

```ts
import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection} from '@capacitor-community/sqlite';

// Plugin Initialization
const platform = Capacitor.getPlatform();
const sqlitePlugin = CapacitorSQLite;
const sqliteConnection = new SQLiteConnection(sqlitePlugin);

// Open a Database
const openDatabase = async (dbName:string, encrypted: boolean,
                  mode: string, version: number,
                  readonly: boolean): Promise<SQLiteDBConnection> => {
  let db: SQLiteDBConnection;
  // Check connections consistency
  const retCC = (await sqliteConnection.checkConnectionsConsistency()).result;
  // Check if a connection exists for the database dbName
  const isConn = (await sqliteConnection.isConnection(dbName, readonly)).result;
  if(retCC && isConn) {
    // Retrieve the existing connection
    db = await sqliteConnection.retrieveConnection(dbName, readonly);
  } else {
    // Create a new connection
    db = await sqliteConnection
              .createConnection(dbName, encrypted, mode, version, readonly);
  }
  await db.open();
  return db;
} 

// ************************************************
// Create Database No Encryption
// encrypted: false
// mode: "no-encryption"
// ************************************************

// Open testEncryption database not encrypted

const db = await openDatabase("testEncryption",false, "no-encryption",
                              1, false);
const createSchema: string = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY NOT NULL,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    age INTEGER);
`;
// create tables in db
let ret: any = await db.execute(createSchema);
if (ret.changes.changes < 0) {
  console.log("Execute createSchema failed");
}
// Create two users
const twoUsers: string = `
INSERT INTO users (name,email,age) VALUES ("Whiteley","Whiteley.com",30), ("Jones","Jones.com",44);`;
ret = await db.execute(twoUsers);
if (ret.changes.changes !== 2) {
  console.log("Execute twoUsers failed");
}
// Query all users
ret = await db.query("SELECT * FROM users;");
if(ret.values && ret.values.length !== 2 || 
    ret.values![0].name !== "Whiteley" ||
    ret.values![1].name !== "Jones") {
  console.log("Query1 twoUsers failed");
}
// Close the connection
await sqliteConnection.closeConnection("testEncryption", false);

// ************************************************
// Encrypt the existing database
// encrypted: true
// mode: "encryption"
// ************************************************

// Check if platform allow for encryption
const isPlatformEncryption = platform === 'web' ? false : true;
// Check if isEncryption in the capacitor.config.ts
const isEncryptInConfig = (await sqliteConnection.isInConfigEncryption()).result
// Define isEncryption
const isEncryption = isPlatformEncryption && isEncryptInConfig ? true : false;
// 
if(isEncryption) {
  // check if a passphrase has been stored
  const isSetPassphrase = (await sqliteConnection.isSecretStored()).result;
  if(!isSetPassphrase) {
    // Set a Passphrase
    const passphrase = "YOUR_PASSPHRASE";
    await sqliteConnection.setEncryptionSecret(passphrase);
  }

  // Open testEncryption database and encrypt it
  const db = await openDatabase("testEncryption",true, "encryption",
                              1, false);
  // Check if database testEncryption is encrypted
  if((await sqliteConnection.isDatabase("testEncryption")).result)  {
    const isDBEncrypted = (await sqliteConnection.isDatabaseEncrypted("testEncryption")).result;
    if(!isDBEncrypted) {
      console.log('Error database "testEncryption" is not encrypted')
    }
    const ret = await db.query("SELECT * FROM users;");
    if(ret.values && ret.values.length !== 2 || ret.values![0].name !== "Whiteley" ||
                                  ret.values![1].name !== "Jones") {
      console.log("Query2 twoUsers failed");
    }

  }
  // Close the connection
  await sqliteConnection.closeConnection("testEncryption",false);

}
```

## Encryption of a new database

```ts

import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection} from '@capacitor-community/sqlite';

// Plugin Initialization
const platform = Capacitor.getPlatform();
const sqlitePlugin = CapacitorSQLite;
const sqliteConnection = new SQLiteConnection(sqlitePlugin);

// Open a Database
const openDatabase = async (dbName:string, encrypted: boolean,
                  mode: string, version: number,
                  readonly: boolean): Promise<SQLiteDBConnection> => {
  let db: SQLiteDBConnection;
  // Check connections consistency
  const retCC = (await sqliteConnection.checkConnectionsConsistency()).result;
  // Check if a connection exists for the database dbName
  const isConn = (await sqliteConnection.isConnection(dbName, readonly)).result;
  if(retCC && isConn) {
    // Retrieve the existing connection
    db = await sqliteConnection.retrieveConnection(dbName, readonly);
  } else {
    // Create a new connection
    db = await sqliteConnection
              .createConnection(dbName, encrypted, mode, version, readonly);
  }
  await db.open();
  return db;
} 
// ************************************************
// Encrypt the new database
// encrypted: true
// mode: "secret"
// ************************************************

// Check if platform allow for encryption
const isPlatformEncryption = platform === 'web' ? false : true;
// Check if isEncryption in the capacitor.config.ts
const isEncryptInConfig = (await sqliteConnection.isInConfigEncryption()).result
// Define isEncryption
const isEncryption = isPlatformEncryption && isEncryptInConfig ? true : false;
// 
if(isEncryption) {
  // check if a passphrase has been stored
  const isSetPassphrase = (await sqliteConnection.isSecretStored()).result;
  if(!isSetPassphrase) {
    // Set a Passphrase
    const passphrase = "YOUR_PASSPHRASE";
    await sqliteConnection.setEncryptionSecret(passphrase);
  }
  // Open testNewEncryption database
  const db = await openDatabase("testNewEncryption",true, "secret",
                              1, false);
  
  const createSchema: string = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY NOT NULL,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      age INTEGER);
  `;
  // create tables in db
  let ret: any = await db.execute(createSchema);
  if (ret.changes.changes < 0) {
    console.log("Execute createSchema failed");
  }
  // Create two users
  const twoUsers: string = `
  INSERT INTO users (name,email,age) VALUES ("Whiteley","Whiteley.com",30), ("Jones","Jones.com",44);`;
  ret = await db.execute(twoUsers);
  if (ret.changes.changes !== 2) {
    console.log("Execute twoUsers failed");
  }
  // Query all users
  ret = await db.query("SELECT * FROM users;");
  if(ret.values.length !== 2 || ret.values[0].name !== "Whiteley" ||
                                ret.values[1].name !== "Jones") {
    console.log("Query1 twoUsers failed");
  }
  // Close the connection
  await this._sqlite.closeConnection("testNewEncryption", false);

}
```

