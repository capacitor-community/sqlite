<p align="center"><br><img src="https://user-images.githubusercontent.com/236501/85893648-1c92e880-b7a8-11ea-926d-95355b8175c7.png" width="128" height="128" /></p>
<h3 align="center">SQLITE DATABASE</h3>
<p align="center"><strong><code>@capacitor-community/sqlite</code></strong></p>
<br>

<p align="center">
  Capacitor community plugin for Native and Electron SQLite Databases.
   - In Native, databases could be encrypted with `SQLCipher`
   - In Electron, databases could be encrypted with `better-sqlite3-multiple-ciphers`
</p>
<br>
<p align="center">
  <img src="https://img.shields.io/maintenance/yes/2025?style=flat-square" />
  <a href="https://github.com/capacitor-community/sqlite/actions?query=workflow%3A%22CI%22"><img src="https://img.shields.io/github/actions/workflow/status/capacitor-community/sqlite/ci.yml?style=flat-square" /></a>
  <a href="https://www.npmjs.com/package/@capacitor-community/sqlite"><img src="https://img.shields.io/npm/l/@capacitor-community/sqlite?branch=master&style=flat-square" /></a>
<br>
  <a href="https://www.npmjs.com/package/@capacitor-community/sqlite"><img src="https://img.shields.io/npm/dw/@capacitor-community/sqlite?style=flat-square" /></a>
  <a href="https://www.npmjs.com/package/@capacitor-community/sqlite"><img src="https://img.shields.io/npm/v/@capacitor-community/sqlite?style=flat-square" /></a>
<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
<a href="#contributors-"><img src="https://img.shields.io/badge/all%20contributors-45-orange?style=flat-square" /></a>
<!-- ALL-CONTRIBUTORS-BADGE:END -->
</p>


## Maintainers

| Maintainer | GitHub                                    | Social                                        |
| ---------- | ----------------------------------------- | --------------------------------------------- |
| Robin Genz | [robingenz](https://github.com/robingenz) | [@robin_genz](https://twitter.com/robin_genz) |

# Installation

> [!IMPORTANT]  
> This plugin uses the [SQLCipher](https://www.zetetic.net/sqlcipher/) library (even for unencrypted databases), which is subject to the [Encryption Export Regulations](https://developer.apple.com/documentation/security/complying-with-encryption-export-regulations) and may require you to submit a year-end self-classification report to the U.S. government. Read more [here](https://discuss.zetetic.net/t/export-requirements-for-applications-using-sqlcipher/47).

```
npm install --save @capacitor-community/sqlite
npx cap sync
```

```
yarn add @capacitor-community/sqlite
npx cap sync
```

```
pnpm install --save @capacitor-community/sqlite
pnpm install --save jeep-sqlite
pnpm install --save sql.js
npx cap sync
```

then add plugin to main `capacitor.config.ts` file:

```ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jeep.app.ionic7.angular.sqlite',
  appName: 'ionic7-angular-sqlite-starter',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    CapacitorSQLite: {
      iosDatabaseLocation: 'Library/CapacitorDatabase',
      iosIsEncryption: true,
      iosKeychainPrefix: 'angular-sqlite-app-starter',
      iosBiometric: {
        biometricAuth: false,
        biometricTitle : "Biometric login for capacitor sqlite"
      },
      androidIsEncryption: true,
      androidBiometric: {
        biometricAuth : false,
        biometricTitle : "Biometric login for capacitor sqlite",
        biometricSubTitle : "Log in using your biometric"
      },
      electronIsEncryption: true,
      electronWindowsLocation: "C:\\ProgramData\\CapacitorDatabases",
      electronMacLocation: "/Volumes/Development_Lacie/Development/Databases",
      electronLinuxLocation: "Databases"
    }
  }
};
export default config;

```

## More Reading:

 - [Updating to Capacitor 5](https://capacitorjs.com/docs/updating/5-0)
 - [Releases](https://github.com/capacitor-community/sqlite/blob/master/docs/info_releases.md)
 - [Changelog](https://github.com/capacitor-community/sqlite/blob/master/CHANGELOG.md)
 - [Issues](https://github.com/capacitor-community/sqlite/issues)
 - [Capacitor documentation](https://capacitorjs.com/docs/)
 - [Datatypes In SQLite Version 3](https://www.sqlite.org/datatype3.html)
 - [IncrementalUpgradeDatabaseVersion](https://github.com/capacitor-community/sqlite/blob/master/docs/IncrementalUpgradeDatabaseVersion.md)


## Tutorials Blog

 - [JeepQ Capacitor Plugin Tutorials](https://jepiqueau.github.io/)


## Web Quirks

The plugin follows the guidelines from the `Capacitor Team`,

- [Capacitor Browser Support](https://capacitorjs.com/docs/v3/web#browser-support)

Meaning that it will not work in IE11 without additional JavaScript transformations, e.g. with [Babel](https://babeljs.io/).
You'll need the usual capacitor/android/react npm script to build and copy the assets folder.

#### For Angular framework

- Copy manually the file `sql-wasm.wasm` from `node_modules/sql.js/dist/sql-wasm.wasm` to the `src/assets` folder of YOUR_APP 

#### For Vue & React frameworks

- Copy manually the file `sql-wasm.wasm` from `node_modules/sql.js/dist/sql-wasm.wasm` to the `public/assets` folder of YOUR_APP 

## Android Quirks

 - In case you get the following error when building your app in Android Studio:
  `x files found with path 'build-data.properties'.`
  You can add the following code to `app/build.gradle`:
  ```
      packagingOptions {
          exclude 'build-data.properties'
      }
  ```
  See [#301](https://github.com/capacitor-community/sqlite/issues/301) and [SO question](https://stackoverflow.com/questions/63291529/how-to-fix-more-than-one-file-was-found-with-os-independent-path-build-data-pro) for more information.

 - Check/Add the following:
    Gradle JDK version 21
    Android Gradle Plugin Version 8.7.2
    In variables.gradle

      ```
      minSdkVersion = 23
      compileSdkVersion = 35
      targetSdkVersion = 35
      ```
    In AndroidManifest.xml
      ```
          <application
            android:allowBackup="false"
            android:fullBackupContent="false"
            android:dataExtractionRules="@xml/data_extraction_rules"
      ```
    In res/xml create a file `data_extraction_rules.xml` containing:
      ```
      <?xml version="1.0" encoding="utf-8"?>
      <data-extraction-rules>
          <cloud-backup>
            <exclude domain="root" />
            <exclude domain="database" />
            <exclude domain="sharedpref" />
            <exclude domain="external" />
          </cloud-backup>
          <device-transfer>
            <exclude domain="root" />
            <exclude domain="database" />
            <exclude domain="sharedpref" />
            <exclude domain="external" />
          </device-transfer>
      </data-extraction-rules>
      ```
      
## Electron Quirks

- On Electron, go to the Electron folder of YOUR_APPLICATION

```bash
cd electron
npm install --save better-sqlite3-multiple-ciphers
npm install --save electron-json-storage
npm install --save jszip
npm install --save node-fetch@2.6.7
npm install --save crypto
npm install --save crypto-js
npm install --save-dev @types/better-sqlite3
npm install --save-dev @types/electron-json-storage
npm install --save-dev @types/crypto-js
```
- **Important**: `node-fetch` version must be `<=2.6.7`; otherwise [you'll get an error](https://github.com/capacitor-community/sqlite/issues/349 "you'll get an error ERR_REQUIRE_ESM") running the app. 

- **Important**: if you are using `@capacitor-community/electron v5` 
  - you have to stick to Electron@25.8.4 till further notice so do:
```bash
npm install --save-dev electron@25.8.4
npm uninstall --save-dev electron-rebuild
npm install --save-dev @electron/rebuild
npm install --save-dev electron-builder@24.6.4
```
  - in electron folder open the `tsconfig.json` file and add `"skipLibCheck": true,`

  
## IOS Quirks

- on iOS, no further steps needed.


## Supported Methods by Platform

| Name                         | Android | iOS  | Electron | Web  |
| :--------------------------- | :------ | :--- | :------- | :--- |
| createConnection (ReadWrite) | ✅       | ✅    | ✅        | ✅    |
| createConnection (ReadOnly)  | ✅       | ✅    | ✅        | ❌    | since 4.1.0-7    |
| closeConnection (ReadWrite)  | ✅       | ✅    | ✅        | ✅    |
| closeConnection (ReadOnly)   | ✅       | ✅    | ✅        | ❌    | since 4.1.0-7    |
| isConnection (ReadWrite)     | ✅       | ✅    | ✅        | ✅    |
| isConnection (ReadOnly)      | ✅       | ✅    | ✅        | ❌    | since 4.1.0-7    |
| open (non-encrypted DB)      | ✅       | ✅    | ✅        | ✅    |
| open (encrypted DB)          | ✅       | ✅    | ✅        | ❌    |
| close                        | ✅       | ✅    | ✅        | ✅    |
| getUrl                       | ✅       | ✅    | ❌        | ❌    |
| getVersion                   | ✅       | ✅    | ✅        | ✅    |
| execute                      | ✅       | ✅    | ✅        | ✅    |
| executeSet                   | ✅       | ✅    | ✅        | ✅    |
| run                          | ✅       | ✅    | ✅        | ✅    |
| query                        | ✅       | ✅    | ✅        | ✅    |
| deleteDatabase               | ✅       | ✅    | ✅        | ✅    |
| importFromJson               | ✅       | ✅    | ✅        | ✅    |
| exportToJson                 | ✅       | ✅    | ✅        | ✅    |
| deleteExportedRows           | ✅       | ✅    | ✅        | ✅    |
| createSyncTable              | ✅       | ✅    | ✅        | ✅    |
| setSyncDate                  | ✅       | ✅    | ✅        | ✅    |
| getSyncDate                  | ✅       | ✅    | ✅        | ✅    |
| isJsonValid                  | ✅       | ✅    | ✅        | ✅    |
| isDBExists                   | ✅       | ✅    | ✅        | ✅    |
| addUpgradeStatement          | ✅       | ✅    | ✅        | ✅    | Modified 4.1.0-6 |
| copyFromAssets               | ✅       | ✅    | ✅        | ✅    |
| isDBOpen                     | ✅       | ✅    | ✅        | ✅    |
| isDatabase                   | ✅       | ✅    | ✅        | ✅    |
| isTableExists                | ✅       | ✅    | ✅        | ✅    |
| getTableList                 | ✅       | ✅    | ✅        | ✅    |
| getDatabaseList              | ✅       | ✅    | ✅        | ✅    |
| getMigratableDbList          | ✅       | ✅    | ❌        | ❌    |
| addSQLiteSuffix              | ✅       | ✅    | ❌        | ❌    |
| deleteOldDatabases           | ✅       | ✅    | ❌        | ❌    |
| moveDatabasesAndAddSuffix    | ✅       | ✅    | ❌        | ❌    |
| checkConnectionsConsistency  | ✅       | ✅    | ✅        | ✅    |
| isSecretStored               | ✅       | ✅    | ✅        | ❌    |
| setEncryptionSecret          | ✅       | ✅    | ✅        | ❌    |
| changeEncryptionSecret       | ✅       | ✅    | ✅        | ❌    |
| clearEncryptionSecret        | ✅       | ✅    | ✅        | ❌    |
| checkEncryptionSecret        | ✅       | ✅    | ✅        | ❌    |
| initWebStore                 | ❌       | ❌    | ❌        | ✅    |
| saveToStore                  | ❌       | ❌    | ❌        | ✅    |
| getNCDatabasePath            | ✅       | ✅    | ❌        | ❌    |
| createNCConnection           | ✅       | ✅    | ❌        | ❌    |
| closeNCConnection            | ✅       | ✅    | ❌        | ❌    |
| isNCDatabase                 | ✅       | ✅    | ❌        | ❌    |
| transaction                  | ✅       | ✅    | ✅        | ✅    |
| getFromHTTPRequest           | ✅       | ✅    | ✅        | ✅    | since 4.2.0      |
| isDatabaseEncrypted          | ✅       | ✅    | ✅        | ❌    | since 4.6.2-2    |
| isInConfigEncryption         | ✅       | ✅    | ✅        | ❌    | since 4.6.2-2    |
| isInConfigBiometricAuth      | ✅       | ✅    | ❌        | ❌    | since 4.6.2-2    |
| getFromLocalDiskToStore      | ❌       | ❌    | ❌        | ✅    | since 4.6.3      |
| saveToLocalDisk              | ❌       | ❌    | ❌        | ✅    | since 4.6.3      |
| beginTransaction             | ✅       | ✅    | ✅        | ✅    | since 5.0.7      |
| commitTransaction            | ✅       | ✅    | ✅        | ✅    | since 5.0.7      |
| rollbackTransaction          | ✅       | ✅    | ✅        | ✅    | since 5.0.7      |
| isTransactionActive          | ✅       | ✅    | ✅        | ✅    | since 5.0.7      |


## Documentation & APIs

- [API](https://github.com/capacitor-community/sqlite/blob/master/docs/API.md)

- [API Connection Wrapper](https://github.com/capacitor-community/sqlite/blob/master/docs/APIConnection.md)

- [API DB Connection Wrapper](https://github.com/capacitor-community/sqlite/blob/master/docs/APIDBConnection.md)

- [Import-Export Json](https://github.com/capacitor-community/sqlite/blob/master/docs/ImportExportJson.md)

- [Upgrade Database Version](https://github.com/capacitor-community/sqlite/blob/master/docs/UpgradeDatabaseVersion.md)

- [Migrating Cordova Databases](https://github.com/capacitor-community/sqlite/blob/master/docs/MigratingCordovaDatabases.md)

- [Type ORM](https://github.com/capacitor-community/sqlite/blob/master/docs/TypeORM-Usage.md)

- [TypeORM-From-5.6.0](https://github.com/capacitor-community/sqlite/blob/master/docs/TypeORM-Usage-From-5.6.0.md)

- [Web Usage](https://github.com/capacitor-community/sqlite/blob/master/docs/Web-Usage.md)

- [Non Conformed Databases](https://github.com/capacitor-community/sqlite/blob/master/docs/NonConformedDatabases.md)

- [Biometric Authentication](https://github.com/capacitor-community/sqlite/blob/master/docs/Biometric-Authentication.md)

- [Enable SQLite Schema Error Syntax Highlighting](https://github.com/capacitor-community/sqlite/blob/master/docs/SyntaxScanner-For-SQLite-Code.md)

- [Electron Better SQLite3](https://github.com/capacitor-community/sqlite/blob/master/docs/ElectronBetterSQLite3.md)

- [Enable minified build on Android](https://github.com/capacitor-community/sqlite/blob/master/docs/AndroidMinify.md)


## Applications demonstrating the use of the plugin and related documentation

### Ionic/Angular

- [Web ionic7-angular-sqlite-app](https://github.com/jepiqueau/blog-tutorials-apps/tree/main/SQLite/Part-1/ionic7-angular-sqlite-app) Ionic 7 Angular 16 Capacitor 5 SQLite CRUD operations for Web.

- [Native ionic7-angular-sqlite-app](https://github.com/jepiqueau/blog-tutorials-apps/tree/main/SQLite/Part-2/ionic7-angular-sqlite-app) Ionic 7 Angular 16 Capacitor 5 SQLite CRUD operations for iOS, Android and Electron.

- [angular-sqlite-synchronize-app](https://github.com/jepiqueau/angular-sqlite-synchronize-app) (Not Updated)

### Ionic/Angular TypeORM app (Not Updated)

- [ionic-sqlite-typeorm-app](https://github.com/jepiqueau/ionic-sqlite-typeorm-app)

### Ionic/React

- [Web ionic7-react-sqlite-app](https://github.com/jepiqueau/blog-tutorials-apps/tree/main/SQLite/Part-1/ionic7-react-sqlite-app) Ionic7 React18.2.0 Vite4.3.9 Capacitor 5 SQLite CRUD operations for Web.

- [Web ionic7-react-sqlite-app](https://github.com/jepiqueau/blog-tutorials-apps/tree/main/SQLite/Part-2/ionic7-react-sqlite-app) Ionic7 React18.2.0 Vite4.3.9 Capacitor 5 SQLite CRUD operations for iOS, Android and Electron.

### Ionic/React Capacitor SQLite + TypeORM Example App 

- [capacitor-sqlite-react-typeorm-app](https://github.com/cosentino/capacitor-sqlite-react-typeorm-app)

### Ionic/Vue

- [Web ionic7-vue-sqlite-app](https://github.com/jepiqueau/blog-tutorials-apps/tree/main/SQLite/Part-1/ionic7-vue-sqlite-app) Ionic7 Vue3.2.45 Vite4.3.9 Capacitor 5 SQLite CRUD operations for Web.

- [Web ionic7-vue-sqlite-app](https://github.com/jepiqueau/blog-tutorials-apps/tree/main/SQLite/Part-2/ionic7-vue-sqlite-app) Ionic7 Vue3.2.45 Vite4.3.9 Capacitor 5 SQLite CRUD operations for iOS, Android and Electron.

### Vue (Not Updated)

- [vue-sqlite-app](https://github.com/jepiqueau/vue-sqlite-app)


### Vue TypeORM app (Not Updated)

- [vue-typeorm-app](https://github.com/jepiqueau/vue-typeorm-app)

### SolidJS+Vite (Not Updated)

- [solidjs-vite-sqlite-app](https://github.com/jepiqueau/capacitor-solid-sqlite)

### Nuxt3 + Kysely

- [nuxt3-capacitor-sqlite-kysely-example](https://github.com/DawidWetzler/nuxt3-capacitor-sqlite-kysely-example)

### Quasar

- [Web quasar-sqlite-app](https://github.com/jepiqueau/blog-tutorials-apps/tree/main/SQLite/Part-1/quasar-sqlite-app) Quasar2.6.0 Capacitor 5 SQLite CRUD operations for Web.

- [Native quasar-sqlite-app](https://github.com/jepiqueau/blog-tutorials-apps/tree/main/SQLite/Part-2/quasar-sqlite-app) Quasar2.6.0 Capacitor 5 SQLite CRUD operations for iOS, Android and Electron.

### SvelteKit

- [Web/Native vite-sveltekit-capacitor-sqlite](https://github.com/jepiqueau/vite-sveltekit-capacitor-sqlite)

## Dependencies

The iOS and Android codes are using `SQLCipher` allowing for database encryption.
The iOS code is using `ZIPFoundation` for unzipping assets files
The Electron code is using `better-sqlite3-multiple-ciphers` , `electron-json-storage` and `node-fetch`  from 5.0.4.
The Web code is using the Stencil component `jeep-sqlite` based on `sql.js`, `localforage`. and `jszip`  

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<p align="center">
  <a href="https://github.com/jepiqueau" title="jepiqueau"><img src="https://github.com/jepiqueau.png?size=100" width="50" height="50"/></a>
  <a href="https://github.com/paulantoine2" title="paulantoine2"><img src="https://github.com/paulantoine2.png?size=100" width="50" height="50" alt=""/></a>
  <a href="https://github.com/karyfars" title="karyfars"><img src="https://github.com/karyfars.png?size=100" width="50" height="50" /></a>
  <a href="https://github.com/chriswep" title="chriswep"><img src="https://github.com/chriswep.png?size=100" width="50" height="50" /></a>
  <a href="https://github.com/nirajhinge" title="nirajhinge"><img src="https://github.com/nirajhinge.png?size=100" width="50" height="50" /></a>
  <a href="https://github.com/digaus" title="digaus"><img src="https://github.com/digaus.png?size=100" width="50" height="50" /></a>
  <a href="https://github.com/IT-MikeS" title="IT-MikeS"><img src="https://github.com/IT-MikeS.png?size=100" width="50" height="50" /></a>
  <a href="https://github.com/peakcool" title="peakcool"><img src="https://github.com/peakcool.png?size=100" width="50" height="50" /></a>
  <a href="https://github.com/gion-andri" title="gion-andri"><img src="https://github.com/gion-andri.png?size=100" width="50" height="50" /></a>
  <a href="https://github.com/robingenz" title="robingenz"><img src="https://github.com/robingenz.png?size=100" width="50" height="50" /></a>
  <a href="https://github.com/dewald-els" title="dewald-els"><img src="https://github.com/dewald-els.png?size=100" width="50" height="50" /></a>
  <a href="https://github.com/joewoodhouse" title="joewoodhouse"><img src="https://github.com/joewoodhouse.png?size=100" width="50" height="50" /></a>
  <a href="https://github.com/ptasheq" title="ptasheq"><img src="https://github.com/ptasheq.png?size=100" width="50" height="50" /></a>
  <a href="https://github.com/victorybiz" title="victorybiz"><img src="https://github.com/victorybiz.png?size=100" width="50" height="50" /></a>
  <a href="https://github.com/tobiasmuecksch" title="tobiasmuecksch"><img src="https://github.com/tobiasmuecksch.png?size=100" width="50" height="50" /></a>
  <a href="https://github.com/dragermrb" title="dragermrb"><img src="https://github.com/dragermrb.png?size=100" width="50" height="50" /></a>
  <a href="https://github.com/iamcco" title="iamcco"><img src="https://github.com/iamcco.png?size=100" width="50" height="50" /></a>
  <a href="https://github.com/eltociear" title="eltociear"><img src="https://github.com/eltociear.png?size=100" width="50" height="50" /></a>
  <a href="https://github.com/antoniovlx" title="antoniovlx"><img src="https://github.com/antoniovlx.png?size=100" width="50" height="50" /></a>
  <a href="https://github.com/HarelM" title="HarelM"><img src="https://github.com/HarelM.png?size=100" width="50" height="50" /></a>
  <a href="https://github.com/rdlabo" title="rdlabo"><img src="https://github.com/rdlabo.png?size=100" width="50" height="50" /></a>
  <a href="https://github.com/axkristiansen" title="axkristiansen"><img src="https://github.com/axkristiansen.png?size=100" width="50" height="50" /></a>
  <a href="https://github.com/aeinn" title="aeinn"><img src="https://github.com/aeinn.png?size=100" width="50" height="50" /></a>
  <a href="https://github.com/jonz94" title="jonz94"><img src="https://github.com/jonz94.png?size=100" width="50" height="50" /></a>
  <a href="https://github.com/oscarfonts" title="oscarfonts"><img src="https://github.com/oscarfonts.png?size=100" width="50" height="50" /></a>
  <a href="https://github.com/Sirs0ri" title="Sirs0ri"><img src="https://github.com/Sirs0ri.png?size=100" width="50" height="50" /></a>
  <a href="https://github.com/TheNovemberRain" title="TheNovemberRain"><img src="https://github.com/TheNovemberRain.png?size=100" width="50" height="50" /></a>
  <a href="https://github.com/fizdalf" title="fizdalf"><img src="https://github.com/fizdalf.png?size=100" width="50" height="50" /></a>
  <a href="https://github.com/Micha-Richter" title="Micha-Richter"><img src="https://github.com/Micha-Richter.png?size=100" width="50" height="50" /></a>
  <a href="https://github.com/ws-rush" title="ws-rush"><img src="https://github.com/ws-rush.png?size=100" width="50" height="50" /></a>
  <a href="https://github.com/eppineda" title="eppineda"><img src="https://github.com/eppineda.png?size=100" width="50" height="50" /></a>
  <a href="https://github.com/patdx" title="patdx"><img src="https://github.com/patdx.png?size=100" width="50" height="50" /></a>
  <a href="https://github.com/folsze" title="folsze"><img src="https://github.com/folsze.png?size=100" width="50" height="50" /></a>
  <a href="https://github.com/pranav-singhal" title="pranav-singhal"><img src="https://github.com/pranav-singhal.png?size=100" width="50" height="50" /></a>
  <a href="https://github.com/beligatclement" title="beligatclement"><img src="https://github.com/beligatclement.png?size=100" width="50" height="50" /></a>
  <a href="https://github.com/cosentino" title="cosentino"><img src="https://avatars.githubusercontent.com/u/376903?s=48&v=4" width="50" height="50" /></a>
  <a href="https://github.com/Guiqft" title="Guiqft"><img src="https://avatars.githubusercontent.com/u/9392803?v=4" width="50" height="50" /></a>
  <a href="https://github.com/DawidWetzler" title="DawidWetzler"><img src="https://avatars.githubusercontent.com/u/49675685?v=4" width="50" height="50" /></a>
  <a href="https://github.com/mmouterde" title="mmouterde"><img src="https://avatars.githubusercontent.com/u/733538?v=4" width="50" height="50" /></a>
  <a href="https://github.com/msfstef" title="msfstef"><img src="https://avatars.githubusercontent.com/u/12274098?v=4" width="50" height="50" /></a>
  <a href="https://github.com/ChrisHSandN" title="
ChrisHSandN"><img src="https://avatars.githubusercontent.com/u/13466620?v=4" width="50" height="50" /></a>
  <a href="https://github.com/lasher23" title="
lasher23"><img src="https://avatars.githubusercontent.com/u/24244618?v=4" width="50" height="50" /></a>
  <a href="https://github.com/mirsella" title="
mirsella"><img src="https://avatars.githubusercontent.com/u/45905567?v=4" width="50" height="50" /></a>
  <a href="https://github.com/SaintPepsi" title="
SaintPepsi"><img src="https://avatars.githubusercontent.com/u/16056759?v=4" width="50" height="50" /></a>
  <a href="https://github.com/l1ndch" title="
l1ndch"><img src="https://avatars.githubusercontent.com/u/170952278?v=4" width="50" height="50" /></a>
</p>


<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

## Credits

A big thank you to [Jean Pierre Quéau](https://github.com/jepiqueau), who maintained this plugin until version 6.0.0. 
