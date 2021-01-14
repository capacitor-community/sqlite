<p align="center"><br><img src="https://user-images.githubusercontent.com/236501/85893648-1c92e880-b7a8-11ea-926d-95355b8175c7.png" width="128" height="128" /></p>
<h2 align="center">IONIC/Vue USAGE DOCUMENTATION</h2>
<p align="center"><strong><code>@capacitor-community/sqlite</code></strong></p>
<p align="center">
  In Ionic/Vue Applications, the <code>@capacitor-community/sqlite</code> can be accessed through a Singleton Vue Hook initialized in the <code>main.ts</code> file</p>
<br>

## Vue SQLite Hook

- [`Vue SQLite Hook Definition`](#vue-sqlite-hook-definition)
- [`Vue SQLite Hook Declaration`](#vue-sqlite-hook-declaration)
- [`Vue SQLite Hook Use in Components`](#vue-sqlite-hook-use-in-components)

### Vue SQLite Hook Definition

A Vue hook specific to `@capacitor-community/sqlite` plugin has been developed to access the plugin API

- [vue-sqlite-hook](https://github.com/jepiqueau/vue-sqlite-hook/blob/refactor/README.md)

To install it in your Ionic/Vue App

```bash
    npm i --save-dev @capacitor-community/sqlite@refactor
    npm i --save-dev vue-sqlite-hook/refactor
```

### Vue SQLite Hook Declaration

To use the `vue-sqlite-hook`as a singleton hook, the declaration must be done in the `main.ts` file of your application

```ts
...
import { useSQLite } from 'vue-sqlite-hook/dist';
import { useState } from '@/composables/state';

...
// SQLite Hook
const {echo, getPlatform, createConnection, closeConnection,
  retrieveConnection, retrieveAllConnections, closeAllConnections,
  addUpgradeStatement, importFromJson, isJsonValid,
  copyFromAssets, isAvailable} = useSQLite();
//Existing Connections
const [existConn, setExistConn] = useState(false);
...
const app = createApp(App)
  .use(IonicVue)
  .use(router);
...
// Singleton SQLite Hook
app.config.globalProperties.$sqlite = {echo: echo, getPlatform: getPlatform,
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

//  Existing Connections Store
app.config.globalProperties.$existingConn = {existConn: existConn, setExistConn: setExistConn};
...
router.isReady().then(() => {
  app.mount('#app');
});
```

Now the Singleton SQLite Hook `$sqlite`and Existing Connections Store `$existingConn` can be use in app's components

### Vue SQLite Hook Use in Components

- in a `component` file

```ts
<template>
    <div id="two-dbs-container">
        <div v-if="showSpinner">
            <br>
            <LoadingSpinner />
            <div>
                <span class="spinner">Running tests ...</span>
            </div>
        </div>
        <div v-else id="log">
            <pre>
            <p>{{log}}</p>
            </pre>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, getCurrentInstance } from 'vue';
import { createTablesNoEncryption, importTwoUsers } from '@/utils/utils-db-no-encryption';
import { useState } from '@/composables/state';
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import { deleteDatabase } from '@/utils/utils-delete-db';
import { createSchemaContacts, setContacts } from '@/utils/utils-db-encrypted-set';

export default defineComponent({
    name: 'TwoDbsTest',
    components: {
        LoadingSpinner
    },
    async setup() {
        const [showSpinner, setShowSpinner] = useState(true);
        const [log, setLog] = useState("");
        const app = getCurrentInstance()
        const sqlite = app?.appContext.config.globalProperties.$sqlite;
        const twoDbsTest = async (): Promise<boolean>  => {

            setLog(log.value
                .concat("* Starting testDatabaseTwoDbs *\n"));

            // initialize the connection
            const db = await sqlite
                .createConnection("testNew", false, "no-encryption", 1);
            const db1 = await sqlite
                .createConnection("testSet", true, "secret", 1);

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
            const syncDate = "2020-11-25T08:30:25.000Z";
                ret = await db.setSyncDate(syncDate);
            if(!ret.result) return false;

            // add two users in db
            ret = await db.execute(importTwoUsers);
            if (ret.changes.changes !== 2) {
                return false;
            }
            // select all users in db
            ret = await db.query("SELECT * FROM users;");
            if(ret.values.length !== 2 || ret.values[0].name !== "Whiteley" ||
                                ret.values[1].name !== "Jones") {
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
            ret = await db.query("SELECT * FROM users WHERE company IS NULL;");
            if(ret.values.length !== 2 || ret.values[0].name !== "Whiteley" ||
                                ret.values[1].name !== "Jones") {
                return false;
            }
            // add one user with statement and values
            let sqlcmd =
                "INSERT INTO users (name,email,age) VALUES (?,?,?)";
            let values: Array<any>  = ["Simpson","Simpson@example.com",69];
            ret = await db.run(sqlcmd,values);
            if(ret.changes.lastId !== 3) {
                return false;
            }
            // add one user with statement
            sqlcmd = `INSERT INTO users (name,email,age) VALUES ` +
                            `("Brown","Brown@example.com",15)`;
            ret = await db.run(sqlcmd);
            if(ret.changes.lastId !== 4) {
                return false;
            }

            app?.appContext.config.globalProperties.$existingConn.setExistConn(true);
            setLog(log.value
                .concat("* Ending testDatabaseTwoDbs *\n"));
            return true;
        }
        onMounted(async () => {
            // Running the test
            const retTwoDbs: boolean = await twoDbsTest();
            if(!retTwoDbs) {
                setLog(log.value
                    .concat("* testDatabaseTwoDbsfailed *\n"));
                setLog(log.value
                        .concat("\n* The set of tests failed *\n"));
            } else {
                setLog(log.value
                    .concat("\n* The set of tests was successful *\n"));
            }
            setShowSpinner(false);
        });
        return { log, showSpinner };
    },
});
</script>
```

Where

- `@/utils/utils-db-no-encryption`

```ts
import { capSQLiteSet } from '@capacitor-community/sqlite';
export const createTablesNoEncryption = `
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
export const importTwoUsers = `
    DELETE FROM users;
    INSERT INTO users (name,email,age) VALUES ("Whiteley","Whiteley.com",30);
    INSERT INTO users (name,email,age) VALUES ("Jones","Jones.com",44);
`;
export const importThreeMessages = `
    DELETE FROM messages;
    INSERT INTO messages (userid,title,body) VALUES (1,"test post 1","content test post 1");
    INSERT INTO messages (userid,title,body) VALUES (2,"test post 2","content test post 2");
    INSERT INTO messages (userid,title,body) VALUES (1,"test post 3","content test post 3");
`;
export const dropTablesTablesNoEncryption = `
    PRAGMA foreign_keys = OFF;
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS messages;
    PRAGMA foreign_keys = ON;
`;
export const setUsers: Array<capSQLiteSet> = [
  {
    statement: 'INSERT INTO users (name,email,age) VALUES (?,?,?);',
    values: ['Jackson', 'Jackson@example.com', 18],
  },
  {
    statement: 'INSERT INTO users (name,email,age) VALUES (?,?,?);',
    values: ['Kennedy', 'Kennedy@example.com', 25],
  },
  {
    statement: 'INSERT INTO users (name,email,age) VALUES (?,?,?);',
    values: ['Bush', 'Bush@example.com', 42],
  },
];
```

- `@/utils/utils-db-encrypted-set`

```ts
import { capSQLiteSet } from '@capacitor-community/sqlite';
export const createSchemaContacts = `
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
export const createSchemaMessages = `
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY NOT NULL,
  contactid INTEGER,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  last_modified INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (contactid) REFERENCES contacts(id) ON DELETE SET DEFAULT
);
CREATE INDEX IF NOT EXISTS messages_index_name ON messages (title);
CREATE INDEX IF NOT EXISTS messages_index_last_modified ON messages (last_modified);
`;
export const setMessages: Array<capSQLiteSet> = [
  {
    statement: 'INSERT INTO messages (contactid,title,body) VALUES (?,?,?);',
    values: [1, 'message 1', 'body message1'],
  },
  {
    statement: 'INSERT INTO messages (contactid,title,body) VALUES (?,?,?);',
    values: [2, 'message 2', 'body message2'],
  },
  {
    statement: 'INSERT INTO messages (contactid,title,body) VALUES (?,?,?);',
    values: [1, 'message 3', 'body message3'],
  },
];
```

- `@/utils/utils-delete-db`

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
