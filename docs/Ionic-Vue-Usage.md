<p align="center"><br><img src="https://user-images.githubusercontent.com/236501/85893648-1c92e880-b7a8-11ea-926d-95355b8175c7.png" width="128" height="128" /></p>
<h2 align="center">IONIC/Vue USAGE DOCUMENTATION</h2>
<p align="center"><strong><code>@capacitor-community/sqlite@next</code></strong></p>
<p align="center" style="font-size:50px;color:red"><strong>CAPACITOR 3 🚧</strong></p><br>
<p align="center">
  In Ionic/Vue Applications, the <code>@capacitor-community/sqlite@next</code> can be accessed through a Singleton Vue Hook initialized in the <code>main.ts</code> file</p>
<br>

## Vue SQLite Hook

- [`Vue SQLite Hook Definition`](#vue-sqlite-hook-definition)
- [`Vue SQLite Hook Declaration for platforms other than Web`](#vue-sqlite-hook-declaration-for-platforms-other-than-web)
- [`Vue SQLite Hook Declaration for platforms including Web`](#vue-sqlite-hook-declaration-for-platforms-including-web)
- [`Vue SQLite Hook Use in Components`](#vue-sqlite-hook-use-in-components)

### Vue SQLite Hook Definition

A Vue hook specific to `@capacitor-community/sqlite` plugin has been developed to access the plugin API

- [vue-sqlite-hook](https://github.com/jepiqueau/vue-sqlite-hook/blob/main/README.md)

To install it in your Ionic/Vue App

```bash
    npm i --save-dev @capacitor-community/sqlite@next
    npm i --save-dev vue-sqlite-hook@next
```

### Vue SQLite Hook Declaration for platforms other than Web

To use the `vue-sqlite-hook`as a singleton hook, the declaration must be done in the `main.ts` file of your application

```ts
...
import { useSQLite } from 'vue-sqlite-hook/dist';
import { useState } from '@/composables/state';

...
//Existing Connections
const [existConn, setExistConn] = useState(false);

// Listeners onProgressImport and Export
const [jsonListeners, setJsonListeners] = useState(false);
const [isModal, setIsModal] = useState(false);
const [message, setMessage] = useState("");

...
const app = createApp(App)
  .use(IonicVue)
  .use(router);
...
// Singleton SQLite Hook

// !!!!! if you do not want to use the progress events !!!!!
// since vue-sqlite-hook 2.1.1
// app.appContext.config.globalProperties.$sqlite = useSQLite()
// before
// app.appContext.config.globalProperties.$sqlite = useSQLite({})
// !!!!!                                               !!!!!
const onProgressImport = async (progress: string) => {
  if(jsonListeners.jsonListeners.value) {
    if(!isModalOpen.isModal.value) isModalOpen.setIsModal(true);
    contentMessage.setMessage(
        contentMessage.message.value.concat(`${progress}\n`));
  }
}
const onProgressExport = async (progress: string) => {
  if(jsonListeners.jsonListeners.value) {
    if(!isModalOpen.isModal.value) isModalOpen.setIsModal(true);
    contentMessage.setMessage(
      contentMessage.message.value.concat(`${progress}\n`));
  }
}

// SQLite Hook definition
app.appContext.config.globalProperties.$sqlite = useSQLite({
  onProgressImport,
  onProgressExport
});

// Listeners onProgressImport and Export
app.config.globalProperties.$isModalOpen = {isModal: isModal, setIsModal: setIsModal};
app.config.globalProperties.$isJsonListeners = {jsonListeners: jsonListeners, setJsonListeners: setJsonListeners};
app.config.globalProperties.$messageContent = {message: message, setMessage: setMessage};

//  Existing Connections
app.config.globalProperties.$existingConn = {existConn: existConn, setExistConn: setExistConn};
...
router.isReady().then(() => {
  app.mount('#app');
});
```

Now the Singleton SQLite Hook `$sqlite`and Existing Connections Store `$existingConn` can be use in app's components

### Vue SQLite Hook Declaration for platforms including Web

As for the Web platform, the `jeep-sqlite` Stencil component is used and requires the DOM:
the declaration of the SQLite Hook has to be moved to the App.vue

So the `main.ts`file 
```js
...
/* SQLite imports */
import { defineCustomElements as jeepSqlite, applyPolyfills } from "jeep-sqlite/loader";
import { useState } from '@/composables/state';

applyPolyfills().then(() => {
    jeepSqlite(window);
});

const app = createApp(App)
  .use(IonicVue)
  .use(router);

/* SQLite Global Variables required if you use onProgressImport/Export Listeners*/
const [jsonListeners, setJsonListeners] = useState(false);
const [isModal, setIsModal] = useState(false);
const [message, setMessage] = useState("");
app.config.globalProperties.$isModalOpen = {isModal: isModal, setIsModal: setIsModal};
app.config.globalProperties.$isJsonListeners = {jsonListeners: jsonListeners, setJsonListeners: setJsonListeners};
app.config.globalProperties.$messageContent = {message: message, setMessage: setMessage};

//  Existing Connections Store
const [existConn, setExistConn] = useState(false);
app.config.globalProperties.$existingConn = {existConn: existConn, setExistConn: setExistConn};
    
router.isReady().then(() => {
  app.mount('#app');
});

```

and the `App.vue`file
```js
<template>
  <ion-app>
    <template v-if="platform === 'web'">
      <jeep-sqlite />
    </template>
    <ion-router-outlet />
  </ion-app>
</template>

<script lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import { defineComponent, getCurrentInstance, onMounted} from 'vue';
import { useSQLite} from 'vue-sqlite-hook/dist';
import { Capacitor } from '@capacitor/core';

export default defineComponent({
  name: 'App',
  components: {
    IonApp,
    IonRouterOutlet,
  },
  setup() {
    const platform = Capacitor.getPlatform();
    const app = getCurrentInstance();
    const isModalOpen = app?.appContext.config.globalProperties.$isModalOpen;
    const contentMessage = app?.appContext.config.globalProperties.$messageContent;
    const jsonListeners = app?.appContext.config.globalProperties.$isJsonListeners;

    onMounted(async () => {
      console.log(' in App on Mounted')

      const ionAppEl = document.querySelector('ion-app');
      if(ionAppEl != null) {
        console.log(`ionAppEl ${JSON.stringify(ionAppEl)}`);
      } else {
        console.log(' ionAppEl is null');
      }
      const onProgressImport = async (progress: string) => {
        if(jsonListeners.jsonListeners.value) {
          if(!isModalOpen.isModal.value) isModalOpen.setIsModal(true);
          contentMessage.setMessage(
              contentMessage.message.value.concat(`${progress}\n`));
        }
      }
      const onProgressExport = async (progress: string) => {
        if(jsonListeners.jsonListeners.value) {
          if(!isModalOpen.isModal.value) isModalOpen.setIsModal(true);
          contentMessage.setMessage(
            contentMessage.message.value.concat(`${progress}\n`));
        }
      }
      if( app != null) { 
        // !!!!! if you do not want to use the progress events !!!!!
        // since vue-sqlite-hook 2.1.1
        // app.appContext.config.globalProperties.$sqlite = useSQLite()
        // before
        // app.appContext.config.globalProperties.$sqlite = useSQLite({})
        // !!!!!                                               !!!!!
        app.appContext.config.globalProperties.$sqlite = useSQLite({
          onProgressImport,
          onProgressExport
        });
        if(platform === "web") {
          await customElements.whenDefined('jeep-sqlite');
          const jeepSqliteEl = document.querySelector('jeep-sqlite');
          if(jeepSqliteEl != null) {
            // Initialize the Web Store since @capacitor-community/sqlite@3.2.3-1
            await app.appContext.config.globalProperties.$sqlite.initWebStore()
            console.log(`$$ jeepSqliteEl ${JSON.stringify(jeepSqliteEl)}`);
          } else {
            console.log('$$ jeepSqliteEl is null');
          }
        }
          console.log('after useSQLite')
      }
    });
    return {platform}
  }
});
</script>

```
Now the Singleton SQLite Hook `$sqlite`and Existing Connections Store `$existingConn` can be use in app's components


### Vue SQLite Hook Use in Components

- in a `component` file

```ts
<template>
    <div id="no-encryption-container">
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
            <div v-if="errMess.length > 0">
                <p>{{errMess}}</p>}
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, getCurrentInstance } from 'vue';
import { createTablesNoEncryption, importTwoUsers,
  dropTablesTablesNoEncryption } from '@/utils/utils-db-no-encryption';
import { useState } from '@/composables/state';
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import { SQLiteDBConnection } from 'vue-sqlite-hook/dist';
import { deleteDatabase } from '@/utils/utils-delete-db';
import { Dialog } from '@capacitor/dialog';

export default defineComponent({
    name: 'NoEncryptionTest',
    components: {
        LoadingSpinner
    },
    async setup() {
        const [showSpinner, setShowSpinner] = useState(true);
        const [log, setLog] = useState("");
        const app = getCurrentInstance()
        const sqlite = app?.appContext.config.globalProperties.$sqlite;
        let errMess = "";
        const showAlert = async (message: string) => {
            await Dialog.alert({
            title: 'Error Dialog',
            message: message,
            });
        };
        const noEncryptionTest = async (): Promise<boolean>  => {
            try {
                setLog(log.value
                    .concat("* Starting testDatabaseNoEncryption *\n"));
                // test the plugin with echo
                let res: any = await sqlite.echo("Hello from echo");
                if(res.value !== "Hello from echo"){
                    errMess = `Echo not returning "Hello from echo"`;
                    return false;
                }
                setLog(log.value.concat("> Echo successful\n"));
                // create a connection for NoEncryption
                let db: SQLiteDBConnection = await sqlite.createConnection("NoEncryption");
                setLog(log.value.concat("> createConnection " +
                                            " 'NoEncryption' successful\n"));
                // check if the databases exist 
                // and delete it for multiple successive tests
                await deleteDatabase(db);         
                // open NoEncryption database
                await db.open();
                setLog(log.value.concat("> open 'NoEncryption' successful\n"));
                // Drop tables if exists
                res = await db.execute(dropTablesTablesNoEncryption);
                if(res.changes.changes !== 0 &&
                            res.changes.changes !== 1){
                    errMess = `Execute dropTablesTablesNoEncryption changes < 0`;
                    return false;
                } 
                setLog(log.value.concat(" Execute1 successful\n"));
                
                // Create tables
                res = await db.execute(createTablesNoEncryption);
                if (res.changes.changes < 0) {
                    errMess = `Execute createTablesNoEncryption changes < 0`;
                    return false;
                }
                setLog(log.value.concat(" Execute2 successful\n"));
                // Insert two users with execute method
                res = await db.execute(importTwoUsers);
                if (res.changes.changes !== 2) {
                    errMess = `Execute importTwoUsers changes != 2`;
                    return false;
                }
                setLog(log.value.concat(" Execute3 successful\n"));
                // Select all Users
                res = await db.query("SELECT * FROM users");
                if(res.values.length !== 2 ||
                res.values[0].name !== "Whiteley" ||
                            res.values[1].name !== "Jones") {
                    errMess = `Query not returning 2 values`;
                    return false;
                }
                setLog(log.value.concat(" Select1 successful\n"));
                // add one user with statement and values              
                let sqlcmd = "INSERT INTO users (name,email,age) VALUES (?,?,?)";
                let values: Array<any>  = ["Simpson","Simpson@example.com",69];
                res = await db.run(sqlcmd,values);
                if(res.changes.changes !== 1 ||
                                res.changes.lastId !== 3) {
                    errMess = `Run lastId != 3`;
                    return false;
                }
                setLog(log.value.concat(" Run1 successful\n"));
                // add one user with statement              
                sqlcmd = `INSERT INTO users (name,email,age) VALUES `+
                                `("Brown","Brown@example.com",15)`;
                res = await db.run(sqlcmd);
                if(res.changes.changes !== 1 ||
                            res.changes.lastId !== 4) {
                    errMess = `Run lastId != 4`;
                    return false;
                }
                setLog(log.value.concat(" Run2 successful\n"));
                // Select all Users
                res = await db.query("SELECT * FROM users");
                if(res.values.length !== 4) {
                    errMess = `Query not returning 4 values`;
                    return false;
                }
                setLog(log.value.concat(" Select2 successful\n"));
                // Select Users with age > 35
                sqlcmd = "SELECT name,email,age FROM users WHERE age > ?";
                values = ["35"];
                res = await db.query(sqlcmd,values);
                if(res.values.length !== 2) {
                    errMess = `Query > 35 not returning 2 values`;
                    return false;
                }
                setLog(log.value
                        .concat(" Select with filter on age successful\n"));
                // Close Connection NoEncryption        
                await sqlite.closeConnection("NoEncryption"); 
                        
                setLog(log.value
                    .concat("* Ending testDatabaseNoEncryption *\n"));
                return true;
            } catch (err) {
                errMess = `${err.message}`;
                return false;
            }
        }
        onMounted(async () => {
            // Running the test
            const retNoEncryption: boolean = await noEncryptionTest();
            setShowSpinner(false);
            if(!retNoEncryption) {
                setLog(log.value
                    .concat("* testDatabaseNoEncryption failed *\n"));
                setLog(log.value
                        .concat("\n* The set of tests failed *\n"));
                await showAlert(errMess);
            } else {
                setLog(log.value
                    .concat("\n* The set of tests was successful *\n"));
            }
        });
        return { log, showSpinner, errMess };
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
    size REAL,
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

export async function deleteDatabase(db: SQLiteDBConnection): Promise<void> {
  try {
    const ret: any = await db.isExists();
    if(ret.result) {
      const dbName = db.getConnectionDBName();
      console.log("$$$ database " + dbName + " before delete");
      await db.delete();
      console.log("$$$ database " + dbName + " after delete " + ret.result);
      return Promise.resolve();
    } else {
      return Promise.resolve();
    }
  } catch (err) {
    return Promise.reject(err);
  }
}
```

