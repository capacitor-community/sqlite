<p align="center"><br><img src="https://user-images.githubusercontent.com/236501/85893648-1c92e880-b7a8-11ea-926d-95355b8175c7.png" width="128" height="128" /></p>
<h3 align="center">SQLITE DATABASE</h3>
<p align="center"><strong><code>@capacitor-community/sqlite</code></strong></p>
<br>
<p align="center" style="font-size:50px;color:red"><strong>CAPACITOR 4</strong></p><br>

<p align="center">
  Capacitor community plugin for Native and Electron SQLite Databases. In Native databases could be encrypted with SQLCipher
</p>
<br>
<p align="center">
  <img src="https://img.shields.io/maintenance/yes/2022?style=flat-square" />
  <a href="https://github.com/capacitor-community/sqlite/actions?query=workflow%3A%22CI%22"><img src="https://img.shields.io/github/workflow/status/capacitor-community/sqlite/CI?style=flat-square" /></a>
  <a href="https://www.npmjs.com/package/@capacitor-community/sqlite"><img src="https://img.shields.io/npm/l/@capacitor-community/sqlite?style=flat-square" /></a>
<br>
  <a href="https://www.npmjs.com/package/@capacitor-community/sqlite"><img src="https://img.shields.io/npm/dw/@capacitor-community/sqlite?style=flat-square" /></a>
  <a href="https://www.npmjs.com/package/@capacitor-community/sqlite"><img src="https://img.shields.io/npm/v/@capacitor-community/sqlite?style=flat-square" /></a>
<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
<a href="#contributors-"><img src="https://img.shields.io/badge/all%20contributors-17-orange?style=flat-square" /></a>
<!-- ALL-CONTRIBUTORS-BADGE:END -->
</p>

## Maintainers

| Maintainer        | GitHub                                    | Social |
| ----------------- | ----------------------------------------- | ------ |
| Quéau Jean Pierre | [jepiqueau](https://github.com/jepiqueau) |        |

## CAPACITOR 4 (Master)

For more info on releases:

 - [info_releases](https://github.com/capacitor-community/sqlite/blob/master/info_releases.md)

 - [changelog](https://github.com/capacitor-community/sqlite/blob/master/CHANGELOG.md)

 - [issues](https://github.com/capacitor-community/sqlite/issues)


The test has been achieved on:

- a [Ionic/Angular app](https://github.com/jepiqueau/angular-sqlite-app-starter)

- a [Ionic/React app](https://github.com/jepiqueau/react-sqlite-app-starter)

- a [Ionic/Vue app](https://github.com/jepiqueau/vue-sqlite-app-starter)

- a [React Vite app](https://github.com/jepiqueau/react-vite-sqlite-app)

- a [Vue Vite app](https://github.com/jepiqueau/vuevite-app)

- a [Vue TypeORM app](https://github.com/jepiqueau/vue-typeorm-app)

- a [SolidJS Vite app](https://github.com/jepiqueau/capacitor-solid-sqlite)

## Browser Support

The plugin follows the guidelines from the `Capacitor Team`,

- [Capacitor Browser Support](https://capacitorjs.com/docs/v3/web#browser-support)

meaning that it will not work in IE11 without additional JavaScript transformations, e.g. with [Babel](https://babeljs.io/).

## Installation

```bash
npm install @capacitor-community/sqlite
npm run build
npx cap add android
npx cap add ios
npx cap add @capacitor-community/electron
```

and do when you update 

```bash
npx cap sync
npx cap sync @capacitor-community/electron
```

### Web

#### For Angular framework

- copy manually the file `sql-wasm.wasm` from `node_modules/sql.js/dist/sql-wasm.wasm` to the `src/assets` folder of YOUR_APP 

#### For Vue & React frameworks

- copy manually the file `sql-wasm.wasm` from `node_modules/sql.js/dist/sql-wasm.wasm` to the `public/assets` folder of YOUR_APP 

### IOS

- on iOS, no further steps needed.

### Android

- On Android, no further steps needed.


### Electron

- On Electron, go to the Electron folder of YOUR_APPLICATION

```bash
cd electron
npm install --save sqlite3
npm install --save jszip
npm install --save-dev @types/sqlite3
npm run build
```

## Build & Run

```
npm run build
npx cap copy
npx cap copy web
npx cap copy @capacitor-community/electron
```

### Web
- Angular
```
ionic serve
```
- Vue
```
npm run serve
```
- React
```
npm run start
```

### IOS

```
npx cap open ios
```

### Android

```
npx cap open android
```
In case you get the following error:
`x files found with path 'build-data.properties'.`
You can you add the following code to `app/build.gradle`:
```
    packagingOptions {
        exclude 'build-data.properties'
    }
```
See [#301](https://github.com/capacitor-community/sqlite/issues/301) and [SO](https://stackoverflow.com/questions/63291529/how-to-fix-more-than-one-file-was-found-with-os-independent-path-build-data-pro] for more information.

### Electron

```
npx cap open @capacitor-community/electron
```

## Configuration

No configuration required for this plugin

## Supported methods

| Name                        | Android | iOS | Electron | Web |
| :-------------------------- | :------ | :-- | :------- | :-- |
| createConnection            | ✅      | ✅  | ✅        | ✅  |
| closeConnection             | ✅      | ✅  | ✅        | ✅  |
| isConnection                | ✅      | ✅  | ✅        | ✅  |
| open (non-encrypted DB)     | ✅      | ✅  | ✅        | ✅  |
| open (encrypted DB)         | ✅      | ✅  | ❌        | ❌  |
| close                       | ✅      | ✅  | ✅        | ✅  |
| getUrl                      | ✅      | ✅  | ❌        | ❌  |
| getVersion                  | ✅      | ✅  | ✅        | ✅  |
| execute                     | ✅      | ✅  | ✅        | ✅  |
| executeSet                  | ✅      | ✅  | ✅        | ✅  |
| run                         | ✅      | ✅  | ✅        | ✅  |
| query                       | ✅      | ✅  | ✅        | ✅  |
| deleteDatabase              | ✅      | ✅  | ✅        | ✅  |
| importFromJson              | ✅      | ✅  | ✅        | ✅  |
| exportToJson                | ✅      | ✅  | ✅        | ✅  |
| deleteExportedRows          | ✅      | ✅  | ✅        | ✅  |
| createSyncTable             | ✅      | ✅  | ✅        | ✅  |
| setSyncDate                 | ✅      | ✅  | ✅        | ✅  |
| getSyncDate                 | ✅      | ✅  | ✅        | ✅  |
| isJsonValid                 | ✅      | ✅  | ✅        | ✅  |
| isDBExists                  | ✅      | ✅  | ✅        | ✅  |
| addUpgradeStatement         | ✅      | ✅  | ✅        | ✅  |
| copyFromAssets              | ✅      | ✅  | ✅        | ✅  |
| isDBOpen                    | ✅      | ✅  | ✅        | ✅  |
| isDatabase                  | ✅      | ✅  | ✅        | ✅  |
| isTableExists               | ✅      | ✅  | ✅        | ✅  |
| getTableList                | ✅      | ✅  | ✅        | ✅  |
| getDatabaseList             | ✅      | ✅  | ✅        | ✅  |
| getMigratableDbList         | ✅      | ✅  | ❌        | ❌  |
| addSQLiteSuffix             | ✅      | ✅  | ❌        | ❌  |
| deleteOldDatabases          | ✅      | ✅  | ❌        | ❌  |
| moveDatabasesAndAddSuffix   | ✅      | ✅  | ❌        | ❌  |
| checkConnectionsConsistency | ✅      | ✅  | ✅        | ✅  |
| isSecretStored              | ✅      | ✅  | ❌        | ❌  |
| setEncryptionSecret         | ✅      | ✅  | ❌        | ❌  |
| changeEncryptionSecret      | ✅      | ✅  | ❌        | ❌  |
| clearEncryptionSecret       | ✅      | ✅  | ❌        | ❌  |
| initWebStore                | ❌      | ❌  | ❌        | ✅  |
| saveToStore                 | ❌      | ❌  | ❌        | ✅  |
| getNCDatabasePath           | ✅      | ✅  | ❌        | ❌  |
| createNCConnection          | ✅      | ✅  | ❌        | ❌  |
| closeNCConnection           | ✅      | ✅  | ❌        | ❌  |
| isNCDatabase                | ✅      | ✅  | ❌        | ❌  |
| transaction                 | ✅      | ✅  | ✅        | ✅  |

## Supported SQLite Types

 -[Datatypes In SQLite Version 3](https://www.sqlite.org/datatype3.html)

## Documentation

### API

- [API_Documentation](https://github.com/capacitor-community/sqlite/blob/master/docs/API.md)

- [API_Connection_Wrapper_Documentation](https://github.com/capacitor-community/sqlite/blob/master/docs/APIConnection.md)

- [API_DB_Connection_Wrapper_Documentation](https://github.com/capacitor-community/sqlite/blob/master/docs/APIDBConnection.md)

- [ImportExportJson_Documentation](https://github.com/capacitor-community/sqlite/blob/master/docs/ImportExportJson.md)

- [UpgradeDatabaseVersion_Documentation](https://github.com/capacitor-community/sqlite/blob/master/docs/UpgradeDatabaseVersion.md)

- [MigratingCordovaDatabases_Documentation](https://github.com/capacitor-community/sqlite/blob/master/docs/MigratingCordovaDatabases.md)

- [TypeORM_Documentation](https://github.com/capacitor-community/sqlite/blob/master/docs/TypeORM-Usage.md)

- [Web_Documentation](https://github.com/capacitor-community/sqlite/blob/master/docs/Web-Usage.md)

- [Non_Conformed_Databases_Documentation](https://github.com/capacitor-community/sqlite/blob/master/docs/NonConformedDatabases.md)

- [Biometric_Authentication](https://github.com/capacitor-community/sqlite/blob/master/docs/Biometric-Authentication.md)

### Framework's Usage 

- [Ionic/Angular_Usage_Documentation](https://github.com/capacitor-community/sqlite/blob/master/docs/Ionic-Angular-Usage.md)

- [Ionic/React_Usage_Documentation](https://github.com/capacitor-community/sqlite/blob/master/docs/Ionic-React-Usage.md)

- [Ionic/Vue_Usage_Documentation](https://github.com/capacitor-community/sqlite/blob/master/docs/Ionic-Vue-Usage.md)


## Applications demonstrating the use of the plugin

### Ionic/Angular

- [angular-sqlite-app-starter](https://github.com/jepiqueau/angular-sqlite-app-starter)

- [angular-sqlite-synchronize-app](https://github.com/jepiqueau/angular-sqlite-synchronize-app)

### Ionic/React

- [react-sqlite-app-starter](https://github.com/jepiqueau/react-sqlite-app-starter)

### React+Vite

- [react-vite-sqlite-app](https://github.com/jepiqueau/react-vite-sqlite-app)


### Ionic/Vue

- [vue-sqlite-app-starter](https://github.com/jepiqueau/vue-sqlite-app-starter)

### Vue

- [vue-sqlite-app](https://github.com/jepiqueau/vue-sqlite-app)

### Vue+Vite

- [vue-vite-sqlite-app](https://github.com/jepiqueau/vuevite-app)

### SolidJS+Vite

- [solidjs-vite-sqlite-app](https://github.com/jepiqueau/capacitor-solid-sqlite)


## Usage

- [see capacitor documentation](https://capacitor.ionicframework.com/docs/getting-started/with-ionic)


## Dependencies

The iOS and Android codes are using `SQLCipher` allowing for database encryption.
The iOS codes is using `ZIPFoundation` for unzipping assets files
The Electron code is using `sqlite3`.
The Web code is using the Stencil component `jeep-sqlite` based on `sql.js`, `localforage`. and `jszip`  

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<p align="center">
  <a href="https://github.com/jepiqueau"><img src="https://github.com/jepiqueau.png?size=100" width="50" height="50" /></a>
  <a href="https://github.com/paulantoine2"><img src="https://github.com/paulantoine2.png?size=100" width="50" height="50" /></a>
  <a href="https://github.com/karyfars"><img src="https://github.com/karyfars.png?size=100" width="50" height="50" /></a>
  <a href="https://github.com/chriswep"><img src="https://github.com/chriswep.png?size=100" width="50" height="50" /></a>
  <a href="https://github.com/nirajhinge"><img src="https://github.com/nirajhinge.png?size=100" width="50" height="50" /></a>
  <a href="https://github.com/digaus"><img src="https://github.com/digaus.png?size=100" width="50" height="50" /></a>
  <a href="https://github.com/IT-MikeS"><img src="https://github.com/IT-MikeS.png?size=100" width="50" height="50" /></a>
  <a href="https://github.com/peakcool"><img src="https://github.com/peakcool.png?size=100" width="50" height="50" /></a>
  <a href="https://github.com/gion-andri"><img src="https://github.com/gion-andri.png?size=100" width="50" height="50" /></a>
  <a href="https://github.com/robingenz"><img src="https://github.com/robingenz.png?size=100" width="50" height="50" /></a>
  <a href="https://github.com/dewald-els"><img src="https://github.com/dewald-els.png?size=100" width="50" height="50" /></a>
  <a href="https://github.com/joewoodhouse"><img src="https://github.com/joewoodhouse.png?size=100" width="50" height="50" /></a>
  <a href="https://github.com/ptasheq"><img src="https://github.com/ptasheq.png?size=100" width="50" height="50" /></a>
  <a href="https://github.com/victorybiz"><img src="https://github.com/victorybiz.png?size=100" width="50" height="50" /></a>
  <a href="https://github.com/tobiasmuecksch"><img src="https://github.com/tobiasmuecksch.png?size=100" width="50" height="50" /></a>
  <a href="https://github.com/dragermrb"><img src="https://github.com/dragermrb.png?size=100" width="50" height="50" /></a>
  <a href="https://github.com/iamcco"><img src="https://github.com/iamcco.png?size=100" width="50" height="50" /></a>
  <a href="https://github.com/eltociear"><img src="https://github.com/eltociear.png?size=100" width="50" height="50" /></a>
  <a href="https://github.com/joewoodhouse"><img src="https://github.com/joewoodhouse.png?size=100" width="50" height="50" /></a>
  <a href="https://github.com/antoniovlx"><img src="https://github.com/antoniovlx.png?size=100" width="50" height="50" /></a>
  <a href="https://github.com/HarelM"><img src="https://github.com/HarelM.png?size=100" width="50" height="50" /></a>
  <a href="https://github.com/rdlabo"><img src="https://github.com/rdlabo.png?size=100" width="50" height="50" /></a>
</p>

<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
