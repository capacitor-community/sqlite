# Capacitor SQLite Plugin
Capacitor SQlite  Plugin is a custom Native Capacitor plugin to create SQLite databases, tables, indexes and store permanently data to it. 
It is then available only for IOS and Android platforms.
Databases can be or not encrypted using SQLCipher module.


### `available since 2.0.0`

  - The run method has been modified to use the transaction(BEGIN & COMMIT) and also to return the lastId
  - Upload of images (as Base64 string)

### `available since 2.0.1-1`

  - exportToJson has been added with two modes "full" or "partial". To use the "partial", it is mandatory to add a "last_modified" field as Integer (Date as a Unix timestamp)
  - createSyncTable has also been added and is required only once, it will create a table to store the synchronization date
  - setSyncDate is allowing the update of the synchronization date

All these new features give you all the bits and pieces to manage in your application the synchronization of SQL databases between a remote server and the mobile device. It can also be used for upgrading the schema of databases by exporting the current database to json, make the schema modifications in the json object and importing it back with the mode "full". 

   [ImportExportJson_Documentation](https://github.com/jepiqueau/capacitor-sqlite/blob/master/ImportExportJson.md)

### `available since 2.1.0-1`

Electron Plugin: the location of the databases could nw be selected: 
  - the previous one **YourApplication/Electron/Databases**
  - under **User/Databases/APP_NAME/** to not loose them when updating the application. This is manage in the index.html file of the application (see below `Running on Electron`).


If an error occurs:

- For all methods, a message containing the error message will be returned

- For execute and run commands, {changes: -1} will be returned in changes
  
- For query command, an empty array will be returned in values


## Methods available

### `open({database:"fooDB"}) => Promise<{result:boolean,message:string}>`

Open a database, 
the plugin add a suffix "SQLite" and an extension ".db" to the name given ie (fooDBSQLite.db)

#### Returns

Type: `Promise<{result:boolean,message:string}>`

### `close({database:"fooDB"}) => Promise<{result:boolean,message:string}>`

Close a database

#### Returns

Type: `Promise<{result:boolean,message:string}>`


### `execute({statements:"fooStatements"}) => Promise<{changes:{changes:number},message:string}>`

Execute a batch of raw SQL statements

#### Returns

Type: `Promise<{changes:{changes:number},message:string}>`

### `run({statement:"fooStatement",values:[]}) => Promise<{changes:{changes:number,lastId:number},message:string}>`

Run a SQL statement

#### Returns

Type: `Promise<{changes:{changes:number,lastId:number},message:string}>`


### `run({statement:"fooStatement VALUES (?,?,?)",values:[1,"foo1","foo2"]}) => Promise<{changes:{changes:number,lastId:number},message:string}>`

Run a SQL statement with given values

#### Returns

Type: `Promise<{changes:{changes:number,lastId:number},message:string}>`

### `query({statement:"fooStatement",values:[]}) => Promise<{values:Array<any>,message:string}>`

Query a SELECT SQL statement

#### Returns

Type: `Promise<{values:Array<any>,message:string}>`


### `query({statement:"fooStatement VALUES (?)",values:["foo1"]}) => Promise<{values:Array<any>,message:string}>`

Query a SELECT SQL statement with given values

#### Returns

Type: `Promise<{values:Array<any>,message:string}>`

### `deleteDatabase({database:"fooDB"}) => Promise<{result:boolean,message:string}>`

Delete a database, require to have open the database first

#### Returns

Type: `Promise<{result:boolean,message:string}>`

### `importFomJson({jsonstring:fooJSONString}) => Promise<{changes:{changes:number},message:string}>`

Import Stringify JSON Object describing a database with Schemas, Indexes and Tables Data

#### Returns

Type: `Promise<{changes:{changes:number},message:string}>`

### `exportToJson({jsonexportmode:fooModeString}) => Promise<{export:any,message:string}>`

Export a JSON Object describing a database with Schemas, Indexes and Tables Data with two modes "full" or "partial"

#### Returns

Type: `Promise<{export:any,message:string}>`

### `createSyncTable() => Promise<{changes:{changes:number},message:string}>`

Create a synchronization table in the database

#### Returns

Type: `Promise<{changes:{changes:number},message:string}>`

### `setSyncDate({syncdate:fooDateString}) => Promise<{result:boolean,message:string}>`

Set a new synchronization date in the database

#### Returns

Type: `Promise<{result:boolean,message:string}>`

### `isJsonValid({jsonstring:fooJSONString}) => Promise<{result:boolean,message:string}>`

Check the validity of a Json Object

#### Returns

Type: `Promise<{result:boolean,message:string}>`

### `isDBExists({database:"fooDB"}) => Promise<{result:boolean,message:string}>`

Check if a database exists

#### Returns

Type: `Promise<{result:boolean,message:string}>`


## Methods available for encrypted database in IOS and Android

### `openStore({database:"fooDB",encrypted:true,mode:"encryption"}) => Promise<{result:boolean,message:string}>`

Encrypt an existing store with a secret key and open the store with given database name.

To define your own "secret" and "newsecret" keys: 
 - in IOS, go to the Pod/Development Pods/capacitor-sqlite/GlobalSQLite.swift file 
 - in Android, go to capacitor-sqlite/java/com.jeep.plugin.capacitor/cdssUtils/GlobalSQLite.java
and update the default values before building your app.

#### Returns

Type: `Promise<{result:boolean,message:string}>`

### `openStore({database:"fooDB",encrypted:true,mode:"secret"}) => Promise<{result:boolean,message:string}>`

Open an encrypted store with given database and table names and secret key.

#### Returns

Type: `Promise<{result:boolean,message:string}>`

### `openStore({database:"fooDB",encrypted:true,mode:"newsecret"}) => Promise<{result:boolean,message:string}>`

Modify the secret key with the newsecret key of an encrypted store and open it with given database and table names and newsecret key.

#### Returns

Type: `Promise<{result:boolean,message:string}>`


## Applications demonstrating the use of the plugin

### Ionic/Angular

  - [angular-sqlite-app-starter](https://github.com/jepiqueau/angular-sqlite-app-starter)

  - [test-angular-jeep-capacitor-plugins](https://github.com/jepiqueau/capacitor-apps/tree/master/IonicAngular/jeep-test-app)

### Ionic/React

  - [react-sqlite-app-starter](https://github.com/jepiqueau/react-sqlite-app-starter)


## Using the Plugin in your App

 - [see capacitor documentation](https://capacitor.ionicframework.com/docs/getting-started/with-ionic)

 - Plugin installation

  ```bash
  npm install --save capacitor-sqlite@latest
  ```
 - In your code
 ```ts
  import { Plugins } from '@capacitor/core';
  import * as CapacitorSQLPlugin from 'capacitor-sqlite';
  const { CapacitorSQLite,Device } = Plugins;

  @Component( ... )
  export class MyPage {
    _sqlite: any;

    ...

    async ngAfterViewInit()() {
      const info = await Device.getInfo();
      if (info.platform === "ios" || info.platform === "android") {
        this._sqlite = CapacitorSQLite;
      } else if(info.platform === "electron") {
        this._sqlite = CapacitorSQLPlugin.CapacitorSQLiteElectron;
      } else {
        this._sqlite = CapacitorSQLPlugin.CapacitorSQLite;
      }

    }

    async testSQLitePlugin() {
        let result:any = await this._sqlite.open({database:"testsqlite"});
        retOpenDB = result.result;
        if(retOpenDB) {
            // Create Tables if not exist
            let sqlcmd: string = `
            BEGIN TRANSACTION;
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY NOT NULL,
                email TEXT UNIQUE NOT NULL,
                name TEXT,
                age INTEGER
            );
            PRAGMA user_version = 1;
            COMMIT TRANSACTION;
            `;
            var retExe: any = await this._sqlite.execute({statements:sqlcmd});
            console.log('retExe ',retExe.changes.changes);
            // Insert some Users
            sqlcmd = `
            BEGIN TRANSACTION;
            DELETE FROM users;
            INSERT INTO users (name,email,age) VALUES ("Whiteley","Whiteley.com",30);
            INSERT INTO users (name,email,age) VALUES ("Jones","Jones.com",44);
            COMMIT TRANSACTION;
            `;
            retExe = await this._sqlite.execute({statements:sqlcmd});
            // will print the changes  2 in that case
            console.log('retExe ',retExe.changes.changes);
            // Select all Users
            sqlcmd = "SELECT * FROM users";
            const retSelect: any = await this._sqlite.query({statement:sqlcmd,values:[]});
            console.log('retSelect.values.length ',retSelect.values.length);
            const row1: any = retSelect.values[0];
            console.log("row1 users ",JSON.stringify(row1))
            const row2: any = retSelect.values[1];
            console.log("row2 users ",JSON.stringify(row2))

            // Insert a new User with SQL and Values

            sqlcmd = "INSERT INTO users (name,email,age) VALUES (?,?,?)";
            let values: Array<any>  = ["Simpson","Simpson@example.com",69];
            var retRun: any = await this._sqlite.run({statement:sqlcmd,values:values});
            console.log('retRun ',retRun.changes.changes,retRun.changes.lastId);

            // Select Users with age > 35
            sqlcmd = "SELECT name,email,age FROM users WHERE age > ?";
            retSelect = await this._sqlite.query({statement:sqlcmd,values:["35"]});
            console.log('retSelect ',retSelect.values.length);
            
        ...
        }
    }
    ...
  }
 ```

### Running on Android

 ```bash
 npx cap update
 npm run build
 npx cap copy
 npx cap open android
 ``` 
 Android Studio will be opened with your project and will sync the files.
 In Android Studio go to the file **MainActivity**

 ```java 
  ...
 import com.jeep.plugin.capacitor.CapacitorSQLite;

  ...

  public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
      super.onCreate(savedInstanceState);

      // Initializes the Bridge
      this.init(savedInstanceState, new ArrayList<Class<? extends Plugin>>() {{
        // Additional plugins you've installed go here
        // Ex: add(TotallyAwesomePlugin.class);
        add(CapacitorSQLite.class);
      }});
    }
  }
 ``` 
### Running on IOS

 Modify the Podfile under the ios folder as follows

 ```
 platform :ios, '11.0'
 use_frameworks!

 # workaround to avoid Xcode 10 caching of Pods that requires
 # Product -> Clean Build Folder after new Cordova plugins installed
 # Requires CocoaPods 1.6 or newer
 install! 'cocoapods', :disable_input_output_paths => true

 def capacitor_pods
  # Automatic Capacitor Pod dependencies, do not delete
  pod 'Capacitor', :path => '../../node_modules/@capacitor/ios'
  pod 'CapacitorCordova', :path => '../../node_modules/@capacitor/ios'
  # Do not delete
 end

 target 'App' do
  capacitor_pods
  # Add your Pods here
 end
 ```

 ```bash
 npx cap update
 npm run build
 npx cap copy
 npx cap open ios
 ```

### Running on Electron

In your application folder add the Electron platform

```bash
npx cap add electron
```

In the Electron folder of your application

```bash
npm install --save sqlite3
npm install --save-dev @types/sqlite3
npm install --save-dev electron-rebuild
```

Modify the Electron package.json file by adding a script "postinstall"

```json
  "scripts": {
    "electron:start": "electron ./",
    "postinstall": "electron-rebuild -f -w sqlite3"
  },
```

Execute the postinstall script

```bash
npm run postinstall
```
Go back in the main folder of your application
Add a script in the index.html file of your application in the body tag

  - case databases under **YourApplication/Electron/**
  ```html
<body>
  <app-root></app-root>
  <script>
    try {
      if (process && typeof (process.versions.electron) === 'string' && process.versions.hasOwnProperty('electron')) {
        const sqlite3 = require('sqlite3');
        const fs = require('fs');
        const path = require('path');
        window.sqlite3 = sqlite3;
        window.fs = fs;
        window.path = path;
      }
    }
    catch {
      console.log("process doesn't exists");
    }
  </script>
</body>
```

  - case databases under **User/Databases/APP_NAME/**
```html
<body>
  <app-root></app-root>
  <script>
    try {
      if (process && typeof (process.versions.electron) === 'string' && process.versions.hasOwnProperty('electron')) {
        const sqlite3 = require('sqlite3');
        const fs = require('fs');
        const path = require('path');
        const homeDir = require('os').homedir();
        window.sqlite3 = sqlite3;
        window.fs = fs;
        window.path = path;
        window.appName = "YOUR_APP_NAME";
        window.homeDir = homeDir;
      }
    }
    catch {
      console.log("process doesn't exists");
    }
  </script>
</body>
```
and then build the application

```bash
 npx cap update
 npm run build
 npx cap copy
 npx cap open electron
```


## Dependencies
The IOS  and Android codes are using SQLCipher allowing for database encryption
The Electron code use sqlite3

