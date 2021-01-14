<p align="center"><br><img src="https://user-images.githubusercontent.com/236501/85893648-1c92e880-b7a8-11ea-926d-95355b8175c7.png" width="128" height="128" /></p>
<h2 align="center">IONIC/REACT USAGE DOCUMENTATION</h2>
<p align="center"><strong><code>@capacitor-community/sqlite</code></strong></p>
<p align="center">
  In Ionic/React Applications, the <code>@capacitor-community/sqlite</code> can be accessed through a Singleton React Hook initialized in the <code>App.tsx</code> component</p>
<br>

## React SQLite Hook

- [`React SQLite Hook Definition`](#react-sqlite-hook-definition)
- [`React SQLite Hook Declaration`](#react-sqlite-hook-declaration)
- [`React SQLite Hook Use in Components`](#react-sqlite-hook-use-in-components)

### React SQLite Hook Definition

A react hook specific to `@capacitor-community/sqlite` plugin has been developed to access the plugin API

- [react-sqlite-hook](https://github.com/jepiqueau/react-sqlite-hook/blob/refactor/README.md)

To install it in your Ionic/React App

```bash
    npm i --save-dev @capacitor-community/sqlite@refactor
    npm i --save-dev react-sqlite-hook/refactor
```

### React SQLite Hook Declaration

To use the `react-sqlite-hook`as a singleton hook, the declaration must be done in the `App.tsx` file of your application

```ts
...
import { useSQLite } from 'react-sqlite-hook/dist';
...
// Singleton SQLite Hook
export let sqlite: any;
// Existing Connections Store
export let existingConn: any;

const App: React.FC = () => {
  const [existConn, setExistConn] = useState(false);
  existingConn = {existConn: existConn, setExistConn: setExistConn};
  const {echo, getPlatform, createConnection, closeConnection,
         retrieveConnection, retrieveAllConnections, closeAllConnections,
         addUpgradeStatement, importFromJson, isJsonValid, copyFromAssets,
         isAvailable} = useSQLite();
  sqlite = {echo: echo, getPlatform: getPlatform,
            createConnection: createConnection,
            closeConnection: closeConnection,
            retrieveConnection: retrieveConnection,
            retrieveAllConnections: retrieveAllConnections,
            closeAllConnections: closeAllConnections,
            addUpgradeStatement: addUpgradeStatement,
            importFromJson: importFromJson,
            isJsonValid: isJsonValid,
            copyFromAssets: copyFromAssets,
            isAvailable:isAvailable};
...
  return (
  <IonApp>
...
  </IonApp>
  )
};

export default App;
```

Now the Singleton SQLite Hook `sqlite`and Existing Connections Store `existingConn` can use in other components

### React SQLite Hook Use in Components

- in a `component` file

```ts
import React, { useState, useEffect } from 'react';
import './Test2dbs.css';
import { IonCard, IonCardContent } from '@ionic/react';

import {
  createTablesNoEncryption,
  importTwoUsers,
} from '../Utils/noEncryptionUtils';
import { createSchemaContacts, setContacts } from '../Utils/encryptedSetUtils';
import { deleteDatabase } from '../Utils/deleteDBUtil';

import { sqlite, existingConn } from '../App';

const Test2dbs: React.FC = () => {
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    const testtwodbs = async (): Promise<Boolean> => {
      setLog(log => log.concat('* Starting testTwoDBS *\n'));

      // initialize the connection
      const db = await sqlite.createConnection(
        'testNew',
        false,
        'no-encryption',
        1,
      );
      const db1 = await sqlite.createConnection('testSet', true, 'secret', 1);

      // check if the databases exist
      // and delete it for multiple successive tests
      let ret: any = await deleteDatabase(db);
      ret = await deleteDatabase(db1);

      // open db testNew
      ret = await db.open();
      if (!ret.result) {
        return false;
      }

      // create tables in db
      ret = await db.execute(createTablesNoEncryption);
      if (ret.changes.changes < 0) {
        return false;
      }

      // create synchronization table
      ret = await db.createSyncTable();
      if (ret.changes.changes < 0) {
        return false;
      }

      // set the synchronization date
      const syncDate: string = '2020-11-25T08:30:25.000Z';
      ret = await db.setSyncDate(syncDate);
      if (!ret.result) return false;

      // add two users in db
      ret = await db.execute(importTwoUsers);
      if (ret.changes.changes !== 2) {
        return false;
      }
      // select all users in db
      ret = await db.query('SELECT * FROM users;');
      if (
        ret.values.length !== 2 ||
        ret.values[0].name !== 'Whiteley' ||
        ret.values[1].name !== 'Jones'
      ) {
        return false;
      }

      // open db testSet
      ret = await db1.open();
      if (!ret.result) {
        return false;
      }
      // create tables in db1
      ret = await db1.execute(createSchemaContacts);
      if (ret.changes.changes < 0) {
        return false;
      }
      // load setContacts in db1
      ret = await db1.executeSet(setContacts);
      if (ret.changes.changes !== 5) {
        return false;
      }

      // select users where company is NULL in db
      ret = await db.query('SELECT * FROM users WHERE company IS NULL;');
      if (
        ret.values.length !== 2 ||
        ret.values[0].name !== 'Whiteley' ||
        ret.values[1].name !== 'Jones'
      ) {
        return false;
      }
      // add one user with statement and values
      let sqlcmd: string = 'INSERT INTO users (name,email,age) VALUES (?,?,?)';
      let values: Array<any> = ['Simpson', 'Simpson@example.com', 69];
      ret = await db.run(sqlcmd, values);
      if (ret.changes.lastId !== 3) {
        return false;
      }
      // add one user with statement
      sqlcmd =
        `INSERT INTO users (name,email,age) VALUES ` +
        `("Brown","Brown@example.com",15)`;
      ret = await db.run(sqlcmd);
      if (ret.changes.lastId !== 4) {
        return false;
      }
      setLog(log => log.concat('* Ending testTwoDBS *\n'));
      existingConn.setExistConn(true);
      return true;
    };
    if (sqlite.isAvailable) {
      testtwodbs().then(res => {
        if (res) {
          setLog(log => log.concat('\n* The set of tests was successful *\n'));
        } else {
          setLog(log => log.concat('\n* The set of tests failed *\n'));
        }
      });
    } else {
      sqlite.getPlatform().then((ret: { platform: string }) => {
        setLog(log =>
          log.concat('\n* Not available for ' + ret.platform + ' platform *\n'),
        );
      });
    }
  }, []);

  return (
    <IonCard className="container-test2dbs">
      <IonCardContent>
        <pre>
          <p>{log}</p>
        </pre>
      </IonCardContent>
    </IonCard>
  );
};

export default Test2dbs;
```

Where

- `../Utils/noEncryptionUtils`

```ts
import { capSQLiteSet } from '@capacitor-community/sqlite';
export const createTablesNoEncryption: string = `
    CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY NOT NULL,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    company TEXT,
    size FLOAT,
    age INTEGER,
    last_modified INTEGER DEFAULT (strftime('%s', 'now'))
    );
    CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY NOT NULL,
    userid INTEGER,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    last_modified INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (userid) REFERENCES users(id) ON DELETE SET DEFAULT
    );
    CREATE INDEX IF NOT EXISTS users_index_name ON users (name);
    CREATE INDEX IF NOT EXISTS users_index_last_modified ON users (last_modified);
    CREATE INDEX IF NOT EXISTS messages_index_last_modified ON messages (last_modified);
    CREATE TRIGGER IF NOT EXISTS users_trigger_last_modified 
    AFTER UPDATE ON users
    FOR EACH ROW WHEN NEW.last_modified <= OLD.last_modified  
    BEGIN  
        UPDATE users SET last_modified= (strftime('%s', 'now')) WHERE id=OLD.id;   
    END;      
    CREATE TRIGGER IF NOT EXISTS messages_trigger_last_modified AFTER UPDATE ON messages
    FOR EACH ROW WHEN NEW.last_modified <= OLD.last_modified  
    BEGIN  
        UPDATE messages SET last_modified= (strftime('%s', 'now')) WHERE id=OLD.id;   
    END;      
    PRAGMA user_version = 1;
`;
export const importTwoUsers: string = `
    DELETE FROM users;
    INSERT INTO users (name,email,age) VALUES ("Whiteley","Whiteley.com",30);
    INSERT INTO users (name,email,age) VALUES ("Jones","Jones.com",44);
`;
```

- `../Utils/encryptedSetUtils`

```ts
import { capSQLiteSet } from '@capacitor-community/sqlite';
export const createSchemaContacts: string = `
CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  FirstName TEXT,
  company TEXT,
  size REAL,
  age INTEGER,
  MobileNumber TEXT
);
CREATE INDEX IF NOT EXISTS contacts_index_name ON contacts (name);
CREATE INDEX IF NOT EXISTS contacts_index_email ON contacts (email);
PRAGMA user_version = 1;
`;
export const setContacts: Array<capSQLiteSet> = [
  {
    statement:
      'INSERT INTO contacts (name,FirstName,email,age,MobileNumber) VALUES (?,?,?,?,?);',
    values: ['Simpson', 'Tom', 'Simpson@example.com', 69, '4405060708'],
  },
  {
    statement:
      'INSERT INTO contacts (name,FirstName,email,age,MobileNumber) VALUES (?,?,?,?,?);',
    values: ['Jones', 'David', 'Jones@example.com', 42, '4404030201'],
  },
  {
    statement:
      'INSERT INTO contacts (name,FirstName,email,age,MobileNumber) VALUES (?,?,?,?,?);',
    values: ['Whiteley', 'Dave', 'Whiteley@example.com', 45, '4405162732'],
  },
  {
    statement:
      'INSERT INTO contacts (name,FirstName,email,age,MobileNumber) VALUES (?,?,?,?,?);',
    values: ['Brown', 'John', 'Brown@example.com', 35, '4405243853'],
  },
  {
    statement: 'UPDATE contacts SET age = ? , MobileNumber = ? WHERE id = ?;',
    values: [51, '4404030202', 2],
  },
];
```

- `../Utils/deleteDBUtil`

```ts
import { SQLiteDBConnection } from '@capacitor-community/sqlite';

export async function deleteDatabase(db: SQLiteDBConnection): Promise<boolean> {
  let ret: any = await db.isExists();
  const dbName = db.getConnectionDBName();
  if (ret) {
    console.log('$$$ database ' + dbName + ' before delete');
    ret = await db.delete();
    console.log('$$$ database ' + dbName + ' after delete ' + ret.result);
  }
  return ret;
}
```
