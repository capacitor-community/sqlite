<p align="center"><br><img src="https://user-images.githubusercontent.com/236501/85893648-1c92e880-b7a8-11ea-926d-95355b8175c7.png" width="128" height="128" /></p>
<h2 align="center">WEB USAGE DOCUMENTATION</h2>
<p align="center"><strong><code>@capacitor-community/sqlite</code></strong></p>
<p align="center">
<br>

## General to all applications

This is the description on how to use the Web part of the @capacitor-community/sqlite for development purpose.

When your developement is fully tested, it will be a good idea to minimize the package size of your native app to remove the `jeep-sqlite` Stencil component and the `sql-wasm.wasm` file from the assets folder.


```bash
npm i --save @capacitor-community/sqlite@latest
npm i --save jeep-sqlite@latest
```

`jeep-sqlite` is a Stencil Component which is using `sql.js` for sql in-memory queries and store the database in the Browser on a `localforage` IndexedDB store named `jeepSqliteStore` and inside a table named `databases`.
The database is stored when once requires a `close` or `closeConnection`.

## App Index

* [`Ionic/Angular App`](#ionic/angular-app)
* [`Ionic/Vue App`](#ionic/vue-app)

## Ionic/Angular App

- copy manually the file `sql-wasm.wasm` from `nodes_modules/sql.js/dist/sql-wasm.wasm` to the `src/assets` folder of YOUR_APP 

- open the `main.ts` file and add the following 

```js
...
import { defineCustomElements as jeepSqlite} from 'jeep-sqlite/loader';
...
jeepSqlite(window);
platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));
```

- open the `app.module.ts` file and add

```js
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
...
import { SQLiteService } from './services/sqlite.service';
import { DetailService } from './services/detail.service';
...
@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule],
  providers: [
    SQLiteService,
    DetailService,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
```

- open the `app-component.html` file and add

```html
<ion-app>
  <ion-router-outlet></ion-router-outlet>
  <jeep-sqlite></jeep-sqlite>
</ion-app>
```

- open the `app-component.ts` file and add
```js
import { Component } from '@angular/core';

import { Platform } from '@ionic/angular';
import { SQLiteService } from './services/sqlite.service';
import { DetailService } from './services/detail.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent {
  private initPlugin: boolean;
  constructor(
    private platform: Platform,
    private sqlite: SQLiteService,
    private detail: DetailService
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(async () => {
      await customElements.whenDefined('jeep-sqlite');
      this.detail.setExistingConnection(false);
      this.detail.setExportJson(false);
      this.sqlite.initializePlugin().then(async (ret) => {
        this.initPlugin = ret;
        console.log(">>>> in App  this.initPlugin " + this.initPlugin)
      });
    });
  }
}
```
- open or create a `sqlite.service.ts` under the `services`folder

```js
import { Injectable } from '@angular/core';

import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteDBConnection, SQLiteConnection, capSQLiteSet,
         capSQLiteChanges, capSQLiteValues, capEchoResult, capSQLiteResult 
        } from '@capacitor-community/sqlite';

@Injectable()

export class SQLiteService {
    sqlite: SQLiteConnection;
    isService: boolean = false;
    platform: string;
    sqlitePlugin: any;
    native: boolean = false;

    constructor() {
    }
    /**
     * Plugin Initialization
     */
    initializePlugin(): Promise<boolean> {
        return new Promise (resolve => {
            this.platform = Capacitor.getPlatform();
            if(this.platform === 'ios' || this.platform === 'android') this.native = true;
            console.log("*** native " + this.native)
            this.sqlitePlugin = CapacitorSQLite;
            this.sqlite = new SQLiteConnection(this.sqlitePlugin);
            this.isService = true;
            console.log("$$$ in service this.isService " + this.isService + " $$$")
            resolve(true);
        });
    }
    /**
     * Echo a value
     * @param value 
     */
    async echo(value: string): Promise<capEchoResult> {
        if(this.sqlite != null) {
            try {
                return await this.sqlite.echo(value);
            } catch (err) {
                return Promise.reject(new Error(err));
            }
        } else {
            return Promise.reject(new Error("no connection open"));
        }
    }
    async isSecretStored(): Promise<capSQLiteResult> {
        if(!this.native) {
            return Promise.reject(new Error(`Not implemented for ${this.platform} platform`));
        }
        if(this.sqlite != null) {
            try {
                return Promise.resolve(await this.sqlite.isSecretStored());
            } catch (err) {
                return Promise.reject(new Error(err));
            }
        } else {
            return Promise.reject(new Error(`no connection open`));
        }
    }
    async setEncryptionSecret(passphrase: string): Promise<void> {
        if(!this.native) {
            return Promise.reject(new Error(`Not implemented for ${this.platform} platform`));
        }
        if(this.sqlite != null) {
            try {
                return Promise.resolve(await this.sqlite.setEncryptionSecret(passphrase));
            } catch (err) {
                return Promise.reject(new Error(err));
            }
        } else {
            return Promise.reject(new Error(`no connection open`));
        }

    }

    async changeEncryptionSecret(passphrase: string, oldpassphrase: string): Promise<void> {
        if(!this.native) {
            return Promise.reject(new Error(`Not implemented for ${this.platform} platform`));
        }
        if(this.sqlite != null) {
            try {
                return Promise.resolve(await this.sqlite.changeEncryptionSecret(passphrase, oldpassphrase));
            } catch (err) {
                return Promise.reject(new Error(err));
            }
        } else {
            return Promise.reject(new Error(`no connection open`));
        }

    }

    /**
     * addUpgradeStatement
     * @param database 
     * @param fromVersion 
     * @param toVersion 
     * @param statement 
     * @param set 
     */
    async addUpgradeStatement(database:string, fromVersion: number,
                              toVersion: number, statement: string,
                              set?: capSQLiteSet[])
                                        : Promise<void> {
        if(this.sqlite != null) {
            try {
                await this.sqlite.addUpgradeStatement(database, fromVersion, toVersion,
                                                      statement, set ? set : []);
                return Promise.resolve();
            } catch (err) {
                return Promise.reject(new Error(err));
            }
        } else {
            return Promise.reject(new Error(`no connection open for ${database}`));
        }                             
    }
    /**
     * Create a connection to a database
     * @param database 
     * @param encrypted 
     * @param mode 
     * @param version 
     */
    async createConnection(database:string, encrypted: boolean,
                           mode: string, version: number
                           ): Promise<SQLiteDBConnection> {
        if(this.sqlite != null) {
            try {
                const db: SQLiteDBConnection = await this.sqlite.createConnection(
                                database, encrypted, mode, version);
                if (db != null) {
                    return Promise.resolve(db);
                } else {
                    return Promise.reject(new Error(`no db returned is null`));
                }
            } catch (err) {
                return Promise.reject(new Error(err));
            }
        } else {
            return Promise.reject(new Error(`no connection open for ${database}`));
        }
    }
    /**
     * Close a connection to a database
     * @param database 
     */
    async closeConnection(database:string): Promise<void> {
        if(this.sqlite != null) {
            try {
                await this.sqlite.closeConnection(database);
                return Promise.resolve();
            } catch (err) {
                return Promise.reject(new Error(err));
            }
        } else {
            return Promise.reject(new Error(`no connection open for ${database}`));
        }
    }
    /**
     * Retrieve an existing connection to a database
     * @param database 
     */
    async retrieveConnection(database:string): 
            Promise<SQLiteDBConnection> {
        if(this.sqlite != null) {
            try {
                return Promise.resolve(await this.sqlite.retrieveConnection(database));
            } catch (err) {
                return Promise.reject(new Error(err));
            }
        } else {
            return Promise.reject(new Error(`no connection open for ${database}`));
        }
    }
    /**
     * Retrieve all existing connections
     */
    async retrieveAllConnections(): 
                    Promise<Map<string, SQLiteDBConnection>> {
        if(this.sqlite != null) {
            try {
                const myConns =  await this.sqlite.retrieveAllConnections();
                /*
                let keys = [...myConns.keys()];
                keys.forEach( (value) => {
                    console.log("Connection: " + value);
                }); 
                */
                return Promise.resolve(myConns);
            } catch (err) {
                return Promise.reject(new Error(err));
            }
        } else {
            return Promise.reject(new Error(`no connection open`));
        }               
    }
    /**
     * Close all existing connections
     */
    async closeAllConnections(): Promise<void> {
        if(this.sqlite != null) {
            try {
                return Promise.resolve(await this.sqlite.closeAllConnections());
            } catch (err) {
                return Promise.reject(new Error(err));
            }
        } else {
            return Promise.reject(new Error(`no connection open`));
        }
    }
    /**
     * Check if connection exists
     * @param database 
     */
     async isConnection(database: string): Promise<capSQLiteResult> {
        if(this.sqlite != null) {
            try {
                return Promise.resolve(await this.sqlite.isConnection(database));
            } catch (err) {
                return Promise.reject(new Error(err));
            }
        } else {
            return Promise.reject(new Error(`no connection open`));
        }
    }
    /**
     * Check Connections Consistency
     * @returns 
     */
    async checkConnectionsConsistency(): Promise<capSQLiteResult> {
        if(this.sqlite != null) {
            try {
                const res = await this.sqlite.checkConnectionsConsistency();
                return Promise.resolve(res);
            } catch (err) {
                return Promise.reject(new Error(err));
            }
        } else {
            return Promise.reject(new Error(`no connection open`));
        }
    }
    /**
     * Check if database exists
     * @param database 
     */
    async isDatabase(database: string): Promise<capSQLiteResult> {
        if(this.sqlite != null) {
            try {
                return Promise.resolve(await this.sqlite.isDatabase(database));
            } catch (err) {
                return Promise.reject(new Error(err));
            }
        } else {
            return Promise.reject(new Error(`no connection open`));
        }
    }
    /**
     * Get the list of databases
     */    
    async getDatabaseList() : Promise<capSQLiteValues> {
        if(this.sqlite != null) {
            try {
                return Promise.resolve(await this.sqlite.getDatabaseList());
            } catch (err) {
                return Promise.reject(new Error(err));
            }
        } else {
            return Promise.reject(new Error(`no connection open`));
        }
    }
    /**
     * Add "SQLite" suffix to old database's names
     */    
    async addSQLiteSuffix(folderPath?: string): Promise<void>{
        if(!this.native) {
            return Promise.reject(new Error(`Not implemented for ${this.platform} platform`));
        }
        if(this.sqlite != null) {
            try {
                const path: string = folderPath ? folderPath : "default";
                return Promise.resolve(await this.sqlite.addSQLiteSuffix(path));
            } catch (err) {
                return Promise.reject(new Error(err));
            }
        } else {
            return Promise.reject(new Error(`no connection open`));
        }
    }
    /**
     * Delete old databases
     */    
    async deleteOldDatabases(folderPath?: string): Promise<void>{
        if(!this.native) {
            return Promise.reject(new Error(`Not implemented for ${this.platform} platform`));
        }
        if(this.sqlite != null) {
            try {
                const path: string = folderPath ? folderPath : "default";
                return Promise.resolve(await this.sqlite.deleteOldDatabases(path));
            } catch (err) {
                return Promise.reject(new Error(err));
            }
        } else {
            return Promise.reject(new Error(`no connection open`));
        }
    }

    /**
     * Import from a Json Object
     * @param jsonstring 
     */
    async importFromJson(jsonstring:string): Promise<capSQLiteChanges> {
        if(this.sqlite != null) {
            try {
                return Promise.resolve(await this.sqlite.importFromJson(jsonstring));
            } catch (err) {
                return Promise.reject(new Error(err));
            }
        } else {
            return Promise.reject(new Error(`no connection open`));
        }
                    
    }

    /**
     * Is Json Object Valid
     * @param jsonstring Check the validity of a given Json Object
     */

    async isJsonValid(jsonstring:string): Promise<capSQLiteResult> {
        if(this.sqlite != null) {
            try {
                return Promise.resolve(await this.sqlite.isJsonValid(jsonstring));
            } catch (err) {
                return Promise.reject(new Error(err));
            }
        } else {
            return Promise.reject(new Error(`no connection open`));
        }

    }

    /**
     * Copy databases from public/assets/databases folder to application databases folder
     */
    async copyFromAssets(): Promise<void> { 
        if (this.sqlite != null) {
            try {
                return Promise.resolve(await this.sqlite.copyFromAssets());
            } catch (err) {
                return Promise.reject(new Error(err));
            }
        } else {
            return Promise.reject(new Error(`no connection open`));
        }
      }
    
}
```

- For database in the `src/assets/databases` folder you have to create a `databases.json` file which includes only the non-encrypted database's names

```json
{
  "databaseList" : [
    "YOUR_DB1.db",
    "YOUR_DB2.db",
    ...
  ]
}
```

- follow the capacitor build process

```bash
npx cap sync
npm run build
npx cap copy web
ionic serve
```

that is it.

## Ionic/Vue App

- copy manually the file `sql-wasm.wasm` from `nodes_modules/sql.js/dist/sql-wasm.wasm` to the `public/assets` folder of YOUR_APP 

- open the `main.ts` file and add the following 

```js
...
import { defineCustomElements as jeepSqlite, applyPolyfills} from 'jeep-sqlite/loader';
import { useState } from '@/composables/state';

...
applyPolyfills().then(() => {
    jeepSqlite(window);
});
const app = createApp(App)
  .use(IonicVue)
  .use(router);

...

/* SQLite Global Variables*/
const [jsonListeners, setJsonListeners] = useState(false);
const [isModal, setIsModal] = useState(false);
const [message, setMessage] = useState("");
app.config.globalProperties.$isModalOpen = {isModal: isModal, setIsModal: setIsModal};
app.config.globalProperties.$isJsonListeners = {jsonListeners: jsonListeners, setJsonListeners: setJsonListeners};
app.config.globalProperties.$messageContent = {message: message, setMessage: setMessage};

... 

router.isReady().then(() => {
  app.mount('#app');
});
```

- open the `App.vue` file

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
        app.appContext.config.globalProperties.$sqlite = useSQLite({
          onProgressImport,
          onProgressExport
        });
        if(platform === "web") {
          await customElements.whenDefined('jeep-sqlite');
        }
      }
    });
    return {platform}
  }
});
</script>
```

- open a component `YOUR_COMPONENT.vue` file

```js
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
import { SQLiteDBConnection, SQLiteHook } from 'vue-sqlite-hook/dist';
import { deleteDatabase } from '@/utils/utils-delete-db';
import { Dialog } from '@capacitor/dialog';

export default defineComponent({
    name: 'NoEncryptionTest',
    components: {
        LoadingSpinner
    },

    setup() {
        console.log('$$$ Start NoEncryptionTest setup $$$')
        const [showSpinner, setShowSpinner] = useState(true);
        const [log, setLog] = useState("");
        const app = getCurrentInstance()
        const sqlite: SQLiteHook = app?.appContext.config.globalProperties.$sqlite;
        let errMess = "";
        const showAlert = async (message: string) => {
            await Dialog.alert({
            title: 'Error Dialog',
            message: message,
            });
        };
        const noEncryptionTest = async (): Promise<boolean>  => {
            try {
                console.log(' Starting testDatabaseNoEncryption')
                setLog(log.value
                    .concat("* Starting testDatabaseNoEncryption *\n"));
                // test the plugin with echo
                let res: any = await sqlite.echo("Hello from echo");
                if(res.value !== "Hello from echo"){
                    errMess = `Echo not returning "Hello from echo"`;
                    return false;
                }
                console.log(`after echo ${JSON.stringify(res)}`);
                setLog(log.value.concat("> Echo successful\n"));
                // create a connection for NoEncryption
                const db: SQLiteDBConnection = await sqlite.createConnection("NoEncryption");
                setLog(log.value.concat("> createConnection " +
                                            " 'NoEncryption' successful\n"));
                console.log("after createConnection")
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
        };
        
        onMounted(async () => {
            // Running the test
            console.log('$$$ Start NoEncryptionTest on Mounted $$$')
            const retNoEncryption: boolean = await noEncryptionTest();
            console.log(`retNoEncryption ${retNoEncryption}`);
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
            console.log('$$$ End NoEncryptionTest on Mounted $$$')

        });
        console.log('$$$ End NoEncryptionTest setup $$$')

        return { log, showSpinner, errMess };
    },
});
</script>
```
