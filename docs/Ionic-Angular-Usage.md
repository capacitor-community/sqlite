<p align="center"><br><img src="https://user-images.githubusercontent.com/236501/85893648-1c92e880-b7a8-11ea-926d-95355b8175c7.png" width="128" height="128" /></p>
<h2 align="center">IONIC/ANGULAR USAGE DOCUMENTATION</h2>
<p align="center"><strong><code>@capacitor-community/sqlite</code></strong></p>
<p align="center">
  In Ionic/Angular Applications, the <code>@capacitor-community/sqlite</code> can be accessed through a Singleton Service initialized in the <code>app.component.ts</code></p>
<br>

## Angular Singleton Service

- [`Singleton Service Definition`](#singleton-service-definition)
- [`Singleton Service Declaration`](#singleton-service-declaration)
- [`Singleton Service Initialization`](#singleton-service-initialization)
- [`Singleton Service Injection`](#singleton-service-injection)

### Singleton Service Definition

Define a `singleton` service (**app/services/sqlite.service.ts**) as follows

```ts
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

    constructor() {
    }
    /**
     * Plugin Initialization
     */
    initializePlugin(): Promise<boolean> {
        return new Promise (resolve => {
            this.platform = Capacitor.getPlatform();
            console.log("*** platform " + this.platform)
            const sqlitePlugin: any = CapacitorSQLite;
            this.sqlite = new SQLiteConnection(sqlitePlugin);
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
        console.log("&&&& in echo this.sqlite " + this.sqlite + " &&&&")
        if(this.sqlite != null) {
            return await this.sqlite.echo(value);
        } else {
            return null;
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
                let keys = [...myConns.keys()];
                keys.forEach( (value) => {
                    console.log("Connection: " + value);
                }); 
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
                console.log(`in Service checkConnectionsConsistency`)
                return Promise.resolve(await this.sqlite.checkConnectionsConsistency());
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
    async addSQLiteSuffix(folderPath?: string, dbNameList?: string[]): Promise<void>{
        if(!this.native) {
            return Promise.reject(new Error(`Not implemented for ${this.platform} platform`));
        }
        if(this.sqlite != null) {
            try {
                const path: string = folderPath ? folderPath : "default";
                const dbList: string[] = dbNameList ? dbNameList : [];
                return Promise.resolve(await this.sqlite.addSQLiteSuffix(path, dbList));
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
    async deleteOldDatabases(folderPath?: string, dbNameList?: string[]): Promise<void>{
        if(!this.native) {
            return Promise.reject(new Error(`Not implemented for ${this.platform} platform`));
        }
        if(this.sqlite != null) {
            try {
                const path: string = folderPath ? folderPath : "default";
                const dbList: string[] = dbNameList ? dbNameList : [];
                return Promise.resolve(await this.sqlite.deleteOldDatabases(path, dbList));
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

### Singleton Service Declaration

- in `app.module.ts`

```ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { SQLiteService } from './services/sqlite.service';

@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule],
  providers: [
    StatusBar,
    SplashScreen,
    SQLiteService,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
```

### Singleton Service Initialization

- in `app.component.ts`

```ts
import { Component } from '@angular/core';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { SQLiteService } from './services/sqlite.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  private initPlugin: boolean;
  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private _sqlite: SQLiteService,
    private _detail: DetailService,
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(async () => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();
      this._sqlite.initializePlugin().then(ret => {
        this.initPlugin = ret;
        console.log('>>>> in App  this.initPlugin ' + this.initPlugin);
      });
    });
  }
}
```

### Singleton Service Injection

- in a `component` file

```ts
import { Component, AfterViewInit } from '@angular/core';
import { SQLiteService } from '../services/sqlite.service';
import { createSchema, twoUsers} from '../utils/no-encryption-utils';
import { deleteDatabase } from '../utils/db-utils';

@Component({
  selector: 'app-testencryption',
  templateUrl: 'testencryption.page.html',
  styleUrls: ['testencryption.page.scss']
})
export class TestencryptionPage implements AfterViewInit {
  sqlite: any;
  platform: string;
  handlerPermissions: any;
  initPlugin: boolean = false;

  constructor(private _sqlite: SQLiteService) {}

  async ngAfterViewInit() {
    console.log("%%%% in TestencryptionPage this._sqlite " + this._sqlite)
    try {
      await this.runTest();
      document.querySelector('.sql-allsuccess').classList
      .remove('display');
      console.log("$$$ runTest was successful");
    } catch (err) {
      document.querySelector('.sql-allfailure').classList
      .remove('display');
      console.log(`$$$ runTest failed ${err.message}`);
    }
  }


  async runTest(): Promise<void> {
    try {
      let result: any = await this._sqlite.echo("Hello World");
      console.log(" from Echo " + result.value);

      // ************************************************
      // Create Database No Encryption
      // ************************************************

      // initialize the connection
      let db = await this._sqlite
                  .createConnection("testEncryption", false, "no-encryption", 1);

      // open db testEncryption
      await db.open();

      // create tables in db
      let ret: any = await db.execute(createSchema);
      console.log('$$$ ret.changes.changes in db ' + ret.changes.changes)
      if (ret.changes.changes < 0) {
        return Promise.reject(new Error("Execute createSchema failed"));
      }

      // create synchronization table 
      ret = await db.createSyncTable();
      if (ret.changes.changes < 0) {
        return Promise.reject(new Error("Execute createSyncTable failed"));
      }
      
      // set the synchronization date
      const syncDate: string = "2020-11-25T08:30:25.000Z";
      await db.setSyncDate(syncDate);

      // add two users in db
      ret = await db.execute(twoUsers);
      if (ret.changes.changes !== 2) {
        return Promise.reject(new Error("Execute twoUsers failed"));
      }
      // select all users in db
      ret = await db.query("SELECT * FROM users;");
      if(ret.values.length !== 2 || ret.values[0].name !== "Whiteley" ||
                                    ret.values[1].name !== "Jones") {
        return Promise.reject(new Error("Query1 twoUsers failed"));
      }

      // select users where company is NULL in db
      ret = await db.query("SELECT * FROM users WHERE company IS NULL;");
      if(ret.values.length !== 2 || ret.values[0].name !== "Whiteley" ||
                                    ret.values[1].name !== "Jones") {
        return Promise.reject(new Error("Query2 Users where Company null failed"));
      }
      // add one user with statement and values              
      let sqlcmd: string = 
                  "INSERT INTO users (name,email,age) VALUES (?,?,?)";
      let values: Array<any>  = ["Simpson","Simpson@example.com",69];
      ret = await db.run(sqlcmd,values);
      console.log()
      if(ret.changes.lastId !== 3) {
        return Promise.reject(new Error("Run1 add 1 User failed"));
      }
      // add one user with statement              
      sqlcmd = `INSERT INTO users (name,email,age) VALUES ` + 
                                `("Brown","Brown@example.com",15)`;
      ret = await db.run(sqlcmd);
      if(ret.changes.lastId !== 4) {
        return Promise.reject(new Error("Run2 add 1 User failed"));
      }

      await this._sqlite.closeConnection("testEncryption"); 

      // ************************************************
      // Encrypt the existing database
      // ************************************************

      // initialize the connection
      db = await this._sqlite
                  .createConnection("testEncryption", true, "encryption", 1);

      // open db testEncryption
      await db.open();
      // close the connection
      await this._sqlite.closeConnection("testEncryption"); 
      console.log("closeConnection encrypted ")
      // ************************************************
      // Work with the encrypted  database
      // ************************************************

      // initialize the connection
      db = await this._sqlite
                  .createConnection("testEncryption", true, "secret", 1);

      // open db testEncryption
      await db.open();

      // add one user with statement and values              
      sqlcmd = 
                  "INSERT INTO users (name,email,age) VALUES (?,?,?)";
      values = ["Jackson","Jackson@example.com",32];
      ret = await db.run(sqlcmd,values);
      if(ret.changes.lastId !== 5) {
        return Promise.reject(new Error("Run3 add 1 User failed"));
      }

      // select all users in db
      ret = await db.query("SELECT * FROM users;");
      console.log("query encrypted " + ret.values.length )
      if(ret.values.length !== 5 || ret.values[0].name !== "Whiteley" ||
                                    ret.values[1].name !== "Jones" ||
                                    ret.values[2].name !== "Simpson" ||
                                    ret.values[3].name !== "Brown" ||
                                    ret.values[4].name !== "Jackson") {
        return Promise.reject(new Error("Query3  5 Users failed"));
      }

      // delete it for multiple successive tests
      await deleteDatabase(db);
      
      await this._sqlite.closeConnection("testEncryption"); 

      return Promise.resolve();

    } catch (err) {
      return Promise.reject(err);
    }

  }

}
```

Where `no-encryption-utils.ts` is as follows:

```ts
import { capSQLiteSet } from '@capacitor-community/sqlite';
export const createSchema: string = `
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
CREATE TABLE IF NOT EXISTS images (
  id INTEGER PRIMARY KEY NOT NULL,
  name TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  size INTEGER,
  img BLOB,
  last_modified INTEGER DEFAULT (strftime('%s', 'now'))
);
CREATE TABLE IF NOT EXISTS test56 (
  id INTEGER PRIMARY KEY NOT NULL,
  name TEXT,
  name1 TEXT
);
CREATE INDEX IF NOT EXISTS users_index_name ON users (name);
CREATE INDEX IF NOT EXISTS users_index_last_modified ON users (last_modified);
CREATE INDEX IF NOT EXISTS messages_index_name ON messages (title);
CREATE INDEX IF NOT EXISTS messages_index_last_modified ON messages (last_modified);
CREATE INDEX IF NOT EXISTS images_index_name ON images (name);
CREATE INDEX IF NOT EXISTS images_index_last_modified ON images (last_modified);
CREATE TRIGGER IF NOT EXISTS users_trigger_last_modified
AFTER UPDATE ON users
FOR EACH ROW WHEN NEW.last_modified <= OLD.last_modified
BEGIN
    UPDATE users SET last_modified= (strftime('%s', 'now')) WHERE id=OLD.id;
END;
CREATE TRIGGER IF NOT EXISTS messages_trigger_last_modified
AFTER UPDATE ON messages
FOR EACH ROW WHEN NEW.last_modified <= OLD.last_modified
BEGIN
    UPDATE messages SET last_modified= (strftime('%s', 'now')) WHERE id=OLD.id;
END;
CREATE TRIGGER IF NOT EXISTS images_trigger_last_modified
AFTER UPDATE ON images
FOR EACH ROW WHEN NEW.last_modified <= OLD.last_modified
BEGIN
    UPDATE images SET last_modified= (strftime('%s', 'now')) WHERE id=OLD.id;
END;
PRAGMA user_version = 1;
`;

// Insert some Users
const row: Array<Array<any>> = [
  ['Whiteley', 'Whiteley.com', 30.2],
  ['Jones', 'Jones.com', 44],
];
export const twoUsers: string = `
DELETE FROM users;
INSERT INTO users (name,email,age) VALUES ("${row[0][0]}","${row[0][1]}",${row[0][2]});
INSERT INTO users (name,email,age) VALUES ("${row[1][0]}","${row[1][1]}",${row[1][2]});
`;
```
