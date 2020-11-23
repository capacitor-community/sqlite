<p align="center"><br><img src="https://user-images.githubusercontent.com/236501/85893648-1c92e880-b7a8-11ea-926d-95355b8175c7.png" width="128" height="128" /></p>
<h3 align="center">SQLITE DATABASE</h3>
<p align="center"><strong><code>@capacitor-community/sqlite</code></strong></p>
<p align="center">
  Capacitor community plugin for Native and Electron SQLite Databases. In Native databases could be encrypted with SQLCipher
</p>

<p align="center">
  <img src="https://img.shields.io/maintenance/yes/2020?style=flat-square" />
  <a href="https://github.com/capacitor-community/sqlite/actions?query=workflow%3A%22CI%22"><img src="https://img.shields.io/github/workflow/status/capacitor-community/sqlite/CI?style=flat-square" /></a>
  <a href="https://www.npmjs.com/package/@capacitor-community/sqlite"><img src="https://img.shields.io/npm/l/@capacitor-community/sqlite?style=flat-square" /></a>
<br>
  <a href="https://www.npmjs.com/package/@capacitor-community/sqlite"><img src="https://img.shields.io/npm/dw/@capacitor-community/sqlite?style=flat-square" /></a>
  <a href="https://www.npmjs.com/package/@capacitor-community/sqlite"><img src="https://img.shields.io/npm/v/@capacitor-community/sqlite?style=flat-square" /></a>
<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
<a href="#contributors-"><img src="https://img.shields.io/badge/all%20contributors-1-orange?style=flat-square" /></a>
<!-- ALL-CONTRIBUTORS-BADGE:END -->
</p>

## Maintainers

| Maintainer        | GitHub                                    | Social |
| ----------------- | ----------------------------------------- | ------ |
| Quéau Jean Pierre | [jepiqueau](https://github.com/jepiqueau) |        |

## REFACTOR

The refactor will be a quite long process.

The aim of the refactor will be to allow

- for multiple database connections
- for a db connector allowing for easy commands `db.open(), db.close, ...`
- improve the response time of the encrypted database by removing the internal open and close database for each sqlite query
- moving to the latest `androidx.sqlite.db.xxx`

This was discussed lengthly in issue#1and issue#52

The first alpha release of the refactor will address the `android` platform only.

The test will be achieved on a Ionic/Angular app. For the other frameworks, it will require an update of the `react-sqlite-hook`and the `vue-sqlite-hook`.

## Installation

```bash
npm install @capacitor-community/sqlite@refactor
npx cap sync
npx cap add android
```

### Android

- On Android, register the plugin in your main activity:

```java
import com.getcapacitor.community.database.sqlite.CapacitorSQLite;

public class MainActivity extends BridgeActivity {

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    // Initializes the Bridge
    this.init(
        savedInstanceState,
        new ArrayList<Class<? extends Plugin>>() {

          {
            // Additional plugins you've installed go here
            // Ex: add(TotallyAwesomePlugin.class);
            add(CapacitorSQLite.class);
          }
        }
      );
  }
}

```

## Configuration

No configuration required for this plugin

## Supported methods

| Name                    | Android | iOS | Electron | Web |
| :---------------------- | :------ | :-- | :------- | :-- |
| createConnection        | ✅      | ❌  | ❌       | ❌  |
| closeConnection         | ✅      | ❌  | ❌       | ❌  |
| open (non-encrypted DB) | ✅      | ❌  | ❌       | ❌  |
| open (encrypted DB)     | ✅      | ❌  | ❌       | ❌  |
| close                   | ✅      | ❌  | ❌       | ❌  |
| execute                 | ✅      | ❌  | ❌       | ❌  |
| executeSet              | ✅      | ❌  | ❌       | ❌  |
| run                     | ✅      | ❌  | ❌       | ❌  |
| query                   | ✅      | ❌  | ❌       | ❌  |
| deleteDatabase          | ✅      | ❌  | ❌       | ❌  |
| importFromJson          | ❌      | ❌  | ❌       | ❌  |
| exportToJson            | ❌      | ❌  | ❌       | ❌  |
| createSyncTable         | ❌      | ❌  | ❌       | ❌  |
| setSyncDate             | ❌      | ❌  | ❌       | ❌  |
| isJsonValid             | ❌      | ❌  | ❌       | ❌  |
| isDBExists              | ✅      | ❌  | ❌       | ❌  |
| addUpgradeStatement     | ❌      | ❌  | ❌       | ❌  |

## Documentation (to be updated)

[API_Documentation](https://github.com/capacitor-community/sqlite/blob/refactor/docs/API.md)

[API_Connection_Wrapper_Documentation](https://github.com/capacitor-community/sqlite/blob/refactor/docs/APIConnection.md)

[API_DB_Connection_Wrapper_Documentation](https://github.com/capacitor-community/sqlite/blob/refactor/docs/APIDBConnection.md)

[ImportExportJson_Documentation](https://github.com/capacitor-community/sqlite/blob/master/docs/ImportExportJson.md)

[UpgradeDatabaseVersion_Documentation](https://github.com/capacitor-community/sqlite/blob/master/docs/UpgradeDatabaseVersion.md)

## Applications demonstrating the use of the plugin

### Ionic/Angular

- [angular-sqlite-app-refactor](https://github.com/jepiqueau/angular-sqlite-app-refactor)

### Ionic/React (to come later)

### Ionic/Vue (to come later)

### Vue (to come later)

## Usage

- [see capacitor documentation](https://capacitor.ionicframework.com/docs/getting-started/with-ionic)

- In your Ionic/Angular App

define a service **app/services/sqlite.service.ts**

```ts
import { Injectable } from '@angular/core';

import { Plugins, Capacitor } from '@capacitor/core';
import '@capacitor-community/sqlite';
import {
  SQLiteDBConnection,
  SQLiteConnection,
  capEchoResult,
  capSQLiteResult,
} from '@capacitor-community/sqlite';
const { CapacitorSQLite } = Plugins;

@Injectable({
  providedIn: 'root',
})
export class SQLiteService {
  handlerPermissions: any;
  sqlite: SQLiteConnection;
  isService: boolean = false;
  platform: string;

  constructor() {}
  /**
   * Plugin Initialization
   */
  initializePlugin(): Promise<boolean> {
    return new Promise(resolve => {
      this.platform = Capacitor.platform;
      console.log('*** platform ' + this.platform);
      const sqlitePlugin: any = CapacitorSQLite;
      if (this.platform === 'android') {
        this.handlerPermissions = sqlitePlugin.addListener(
          'androidPermissionsRequest',
          async (data: any) => {
            if (data.permissionGranted === 1) {
              this.handlerPermissions.remove();
              this.sqlite = new SQLiteConnection(sqlitePlugin);
              resolve(true);
            } else {
              console.log('Permission not granted');
              this.handlerPermissions.remove();
              this.sqlite = null;
              resolve(false);
            }
          },
        );
        try {
          sqlitePlugin.requestPermissions();
        } catch (e) {
          console.log('Error requesting permissions ' + JSON.stringify(e));
          resolve(false);
        }
      } else {
        this.sqlite = new SQLiteConnection(sqlitePlugin);
        resolve(true);
      }
    });
  }
  async echo(value: string): Promise<capEchoResult> {
    if (this.sqlite != null) {
      return await this.sqlite.echo(value);
    } else {
      return null;
    }
  }
  async createConnection(
    database: string,
    encrypted: boolean,
    mode: string,
    version: number,
  ): Promise<SQLiteDBConnection | null> {
    if (this.sqlite != null) {
      const db: SQLiteDBConnection = await this.sqlite.createConnection(
        database,
        encrypted,
        mode,
        version,
      );
      if (db != null) {
        return db;
      } else {
        return null;
      }
    } else {
      return null;
    }
  }
  async closeConnection(database: string): Promise<capSQLiteResult> {
    if (this.sqlite != null) {
      return await this.sqlite.closeConnection(database);
    } else {
      return null;
    }
  }
}
```

Then implement a component (for example the **app/home/home.page.ts** )

```ts
import { Component, AfterViewInit } from '@angular/core';
import { SQLiteService } from '../services/sqlite.service';
import { createSchema, twoUsers } from '../utils/no-encryption-utils';
import {
  createSchemaContacts,
  setContacts,
} from '../utils/encrypted-set-utils';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements AfterViewInit {
  sqlite: any;
  platform: string;
  handlerPermissions: any;
  initPlugin: boolean = false;

  constructor(private _sqlite: SQLiteService) {}

  async ngAfterViewInit() {
    // Initialize the CapacitorSQLite plugin
    this.initPlugin = await this._sqlite.initializePlugin();
    const result: boolean = await this.runTest();
    if (result) {
      document.querySelector('.sql-allsuccess').classList.remove('display');
      console.log('$$$ runTest was successful');
    } else {
      document.querySelector('.sql-allfailure').classList.remove('display');
      console.log('$$$ runTest failed');
    }
  }

  async runTest(): Promise<boolean> {
    let result: any = await this._sqlite.echo('Hello World');
    console.log(' from Echo ' + result.value);
    // initialize the connection
    const db = await this._sqlite.createConnection(
      'testNew',
      false,
      'no-encryption',
      1,
    );
    const db1 = await this._sqlite.createConnection(
      'testSet',
      true,
      'secret',
      1,
    );
    // open db
    let ret: any = await db.open();
    if (!ret.result) {
      return false;
    }
    // create tables in db
    ret = await db.execute(createSchema);
    console.log('$$$ ret.changes.changes in db ' + ret.changes.changes);
    if (ret.changes.changes < 0) {
      return false;
    }
    // add two users in db
    ret = await db.execute(twoUsers);
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
    // open db1
    ret = await db1.open();
    if (!ret.result) {
      return false;
    }
    // create tables in db1
    ret = await db1.execute(createSchemaContacts);
    console.log('$$$ ret.changes.changes in db1' + ret.changes.changes);
    if (ret.changes.changes < 0) {
      return false;
    }
    // load setContacts in db1
    ret = await db1.executeSet(setContacts);
    console.log('$$$ ret.changes.changes in db2' + ret.changes.changes);
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
    console.log();
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

    ret = await this._sqlite.closeConnection('testNew');
    if (!ret.result) {
      return false;
    }
    ret = await this._sqlite.closeConnection('testSet');
    if (!ret.result) {
      return false;
    } else {
      return true;
    }
  }
}
```

## Dependencies

The IOS and Android codes are using SQLCipher allowing for database encryption
The Electron code use sqlite3

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://github.com/jepiqueau"><img src="https://avatars3.githubusercontent.com/u/16580653?v=4" width="100px;" alt=""/><br /><sub><b>Jean Pierre Quéau</b></sub></a><br /><a href="https://github.com/capacitor-community/sqlite/commits?author=jepiqueau" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/paulantoine2"><img src="https://avatars0.githubusercontent.com/u/22882943?s=64&v=4" width="100px;" alt=""/><br /><sub><b>Paul Antoine</b></sub></a><br /><a href="https://github.com/capacitor-community/sqlite/commits?author=jepiqueau" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/paulantoine2"><img src="https://avatars2.githubusercontent.com/u/303016?s=60&u=1ce232ae3c22eac7b0b4778e46fe079939c39b40&v=4" width="100px;" alt=""/><br /><sub><b>Karyfars</b></sub></a><br /><a href="https://github.com/capacitor-community/sqlite/commits?author=jepiqueau" title="Code">💻</a></td>
  </tr>
</table>

<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
