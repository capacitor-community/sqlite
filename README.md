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

## Installation

```bash
npm install @capacitor-community/sqlite
npx cap sync
npx cap add ios
npx cap add android
npx cap add @capacitor-community/electron
```

### iOS

- On iOS, no further steps are needed.

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

### Electron

- On Electron, go to the Electron folder of YOUR_APPLICATION

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

#### Electron databases location

- There are by default under `User/Databases/APP_NAME/`

Then build YOUR_APPLICATION

```
npm run build
npx cap copy
npx cap copy @capacitor-community/electron
npx cap copy web
npx cap open android
npx cap open ios
npx cap open @capacitor-community/electron
```

## Configuration

No configuration required for this plugin

## Supported methods

| Name                    | Android | iOS | Electron | Web |
| :---------------------- | :------ | :-- | :------- | :-- |
| open (non-encrypted DB) | ✅      | ✅  | ✅       | ❌  |
| open (encrypted DB)     | ✅      | ✅  | ❌       | ❌  |
| close                   | ✅      | ✅  | ✅       | ❌  |
| execute                 | ✅      | ✅  | ✅       | ❌  |
| executeSet              | ✅      | ✅  | ✅       | ❌  |
| run                     | ✅      | ✅  | ✅       | ❌  |
| query                   | ✅      | ✅  | ✅       | ❌  |
| deleteDatabase          | ✅      | ✅  | ✅       | ❌  |
| importFromJson          | ✅      | ✅  | ✅       | ❌  |
| exportToJson            | ✅      | ✅  | ✅       | ❌  |
| createSyncTable         | ✅      | ✅  | ✅       | ❌  |
| setSyncDate             | ✅      | ✅  | ✅       | ❌  |
| isJsonValid             | ✅      | ✅  | ✅       | ❌  |
| isDBExists              | ✅      | ✅  | ✅       | ❌  |
| addUpgradeStatement     | ✅      | ✅  | ✅       | ❌  |

## Documentation

[API_Documentation](https://github.com/capacitor-community/sqlite/blob/master/docs/API.md)

[ImportExportJson_Documentation](https://github.com/capacitor-community/sqlite/blob/master/docs/ImportExportJson.md)

[UpgradeDatabaseVersion_Documentation](https://github.com/capacitor-community/sqlite/blob/master/docs/UpgradeDatabaseVersion.md)

## Applications demonstrating the use of the plugin

### Ionic/Angular

- [angular-sqlite-app-starter](https://github.com/jepiqueau/angular-sqlite-app-starter)

- [test-angular-jeep-capacitor-plugins](https://github.com/jepiqueau/capacitor-apps/tree/master/IonicAngular/jeep-test-app)

### Ionic/React

- [react-sqlite-app-starter](https://github.com/jepiqueau/react-sqlite-app-starter)

## Usage

- [see capacitor documentation](https://capacitor.ionicframework.com/docs/getting-started/with-ionic)

- In your code

```ts
 import { Plugins } from '@capacitor/core';
 import '@capacitor-community/sqlite';
 const { CapacitorSQLite,Device } = Plugins;

 @Component( ... )
 export class MyPage {
   _sqlite: any;
   _platform: string

   ...

   async ngAfterViewInit()() {
     const info = await Device.getInfo();
     this._platform = info.platform;
     this._sqlite = CapacitorSQLite;

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
               FirstName TEXT,
               age INTEGER,
               MobileNumber TEXT
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

           // Execute a Set of raw SQL Statements
           let set: Array<any>  = [
             { statement:"INSERT INTO users (name,FirstName,email,age,MobileNumber) VALUES (?,?,?,?,?);",
               values:["Blackberry","Peter","Blackberry@example.com",69,"4405060708"]
             },
             { statement:"INSERT INTO users (name,FirstName,email,age,MobileNumber) VALUES (?,?,?,?,?);",
               values:["Jones","Helen","HelenJones@example.com",42,"4404030201"]
             },
             { statement:"INSERT INTO users (name,FirstName,email,age,MobileNumber) VALUES (?,?,?,?,?);",
               values:["Davison","Bill","Davison@example.com",45,"4405162732"]
             },
             { statement:"INSERT INTO users (name,FirstName,email,age,MobileNumber) VALUES (?,?,?,?,?);",
               values:["Brown","John","Brown@example.com",35,"4405243853"]
             },
             { statement:"UPDATE users SET age = ? , MobileNumber = ? WHERE id = ?;",
               values:[51,"4404030237",2]
             }
       ];
       result = await this._sqlite.executeSet({set:set});
       console.log("result.changes.changes ",result.changes.changes)
       if(result.changes.changes != 5) resolve(false);


       ...
       }
   }
   ...
 }
```

On android, you must request permissions to read and write in storage :

```ts
export class MyPage {
   _sqlite: any;

   ...

   async ngAfterViewInit()() {
     const info = await Device.getInfo();
     this._sqlite = CapacitorSQLite;

     if (info.platform === "android") {
       try {
          // Show request popup
          await this._sqlite.requestPermissions();
       } catch (e) {
          // Permissions declined
       }

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
