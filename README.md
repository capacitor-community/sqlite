<p align="center"><br><img src="https://user-images.githubusercontent.com/236501/85893648-1c92e880-b7a8-11ea-926d-95355b8175c7.png" width="128" height="128" /></p>
<h3 align="center">SQLITE DATABASE</h3>
<p align="center"><strong><code>@capacitor-community/sqlite</code></strong></p>
<br>

<p align="center">
  Capacitor community plugin for Native, Electron and Web SQLite Databases.
   - In Native, databases could be encrypted with `SQLCipher`
   - In Electron, databases could be encrypted with `better-sqlite3-multiple-ciphers`
   - In Web, databases run on `@sqlite.org/sqlite-wasm` in a Worker and persist in OPFS; encryption is not available
</p>
<br>
<p align="center">
  <img src="https://img.shields.io/maintenance/yes/2026?style=flat-square" />
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

| Maintainer | Company                             | GitHub                                    | Social                                        |
| ---------- | ----------------------------------- | ----------------------------------------- | --------------------------------------------- |
| Robin Genz | [Capawesome](https://capawesome.io) | [robingenz](https://github.com/robingenz) | [@robin_genz](https://twitter.com/robin_genz) |

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

 - [JeepQ Capacitor Plugin Tutorials](https://jepiqueau.github.io/) (the Web tutorials there describe the previous `jeep-sqlite` setup, which no longer applies)


## Web Quirks

On the Web platform the plugin runs [`@sqlite.org/sqlite-wasm`](https://github.com/sqlite/sqlite-wasm), the official SQLite build, inside a dedicated Worker that it creates itself. There is nothing to install alongside it and nothing to copy into your assets folder: the worker (`dist/web-worker.js`) and the SQLite binary (`dist/sqlite3.wasm`) ship inside the package. Full setup is in [Web Usage](https://github.com/capacitor-community/sqlite/blob/master/docs/Web-Usage.md), which is required reading for the Web platform.

`initWebStore()` is still mandatory and is still called exactly as before, once, before the first connection.

#### Where the data lives

`initWebStore()` picks one of two durability tiers:

| Tier | Storage | When it is used |
| ---- | ------- | --------------- |
| 1 | Real database files in the `Origin Private File System`, through the `opfs-sahpool` VFS. Needs no COOP/COEP headers and no `SharedArrayBuffer`, so it works inside Capacitor WebViews and on ordinary hosting. | Whenever the browser has OPFS sync access handles. |
| 2 | `:memory:` databases whose whole-file image is written to IndexedDB, the model the previous implementation used. | Automatic fallback when it does not. |

`saveToStore()` is a no-op on tier 1, where every committed write is already durable, and performs the real image flush on tier 2 (as do `close` and `closeConnection`). Calling it unconditionally is the portable pattern. The old `<jeep-sqlite>` `autosave` attribute is gone and has no replacement.

#### Browser support

There are two separate floors, and they mean different things:

| Floor | Chromium / Android WebView | Safari / iOS WebKit | Firefox | What happens below it |
| ----- | -------------------------- | ------------------- | ------- | --------------------- |
| Engine (`BigInt`, optional chaining, nullish coalescing) | 80 | 14 | 74 | **The plugin does not load at all.** The failure is a syntax error inside the SQLite build, not a fallback, and no transpiler setting in your app can change it. |
| Durability (OPFS sync access handles) | 108 | 16.4 | 111 | Tier 2 above: everything works, the database is an image in IndexedDB rather than a file. Android WebView reached this in M132, January 2025. |

#### Who actually lands on tier 2

Tier 2 is chosen at `initWebStore()` when the browser lacks OPFS sync access handles:
concretely, `navigator.storage.getDirectory` or
`FileSystemFileHandle.prototype.createSyncAccessHandle` is missing, or the SQLite build's own
API version check rejects. In browser versions that means Safari / iOS WebKit 14 to 16.3,
Chromium 80 to 107, Firefox 74 to 110, and Android System WebView before M132 (January 2025).
Two version-independent cases: Safari private browsing always runs tier 2 (OPFS is unavailable
there on every Safari version), and a store already owned by another tab is an explicit error,
never a silent drop to tier 2.

How much traffic that is: measured against caniuse-lite 1.0.30001806 (StatCounter data,
checked 2026-08), the whole tier 2 version band is about **1.4% of global browser usage**:
Safari / iOS 14-16.3 at ~0.5%, Chromium 80-107 remnants at ~0.9%, Firefox 74-110 at ~0.01%.
Put differently, of the usage that can load this plugin at all, **roughly 98% runs tier 1 and
under 2% lands on tier 2**, and the band shrinks as evergreen browsers update. In-app WebView
versions are not visible to StatCounter, so treat WebViews older than M132 (devices without
Google Play services, or with WebView updates disabled) as a small qualitative extra on top.

Why the tier stays despite the small share: Capacitor 8 itself supports iOS 15.0+ and Android
API 24+ with WebViews as old as Chrome 60, so the platform's official support envelope reaches
below the tier 1 floor, and a Capacitor plugin should not fail where Capacitor does not; and
Safari private browsing is tier 2 forever regardless of version, so the tier is the difference
between an app that works ephemerally in a private tab and one that is simply broken there.

#### Other things worth knowing

- **One tab at a time.** OPFS access handles are single-owner by design, so `initWebStore()` fails with an explicit error if another tab of the same origin already owns the store.
- **Migration is automatic.** The first `initWebStore()` after upgrading imports every database left behind by the previous `jeep-sqlite`/IndexedDB implementation, verifies each one with `PRAGMA integrity_check`, and only then retires the old store. A failure leaves the old data untouched and warns on the console.
- **Tier 2 databases follow you up to tier 1.** When a browser that lacked OPFS gains it, which is the normal upgrade path for the devices that run on tier 2, `initWebStore()` moves the stored images into OPFS and only then removes them.
- **Foreign keys are enforced**, as on every other platform. On a database that participates in sync, a soft delete also applies each constraint's `ON DELETE` action to the children, and to their children.
- **Backgrounding is handled** under Capacitor native: the store is closed and paused before the OS suspends the app, and reopened on return. `pauseWebStore()`, `resumeWebStore()` and `restartWebStore()` are there if you would rather drive it from `App.appStateChange`.
- **Integers above 2^53 are returned as `BigInt`.** The previous web engine silently lost precision on those. `JSON.stringify` refuses to serialise a `BigInt`, so code that stringifies query results may need `exportToJson`, which handles this, or a replacer.
- **No encryption.** There is no SQLCipher build for wasm, so encrypted connections and every secret-related method still reject on Web.
- **Read-only connections work on Web**, on both tiers.

## Web Debugging Tools

Where to look depends on the tier. On tier 1, open DevTools > Application > Storage and browse the Origin Private File System: the databases sit in the `.capacitor-sqlite` directory, though `opfs-sahpool` names the files opaquely, so exporting through the plugin is usually easier than reading them in place. On tier 2, they appear in IndexedDB under `capacitor-sqlite-store` > `databases`, one whole-file image per key.

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
| createConnection (ReadOnly)  | ✅       | ✅    | ✅        | ✅    | since 4.1.0-7, Web since 8.2.0 |
| closeConnection (ReadWrite)  | ✅       | ✅    | ✅        | ✅    |
| closeConnection (ReadOnly)   | ✅       | ✅    | ✅        | ✅    | since 4.1.0-7, Web since 8.2.0 |
| isConnection (ReadWrite)     | ✅       | ✅    | ✅        | ✅    |
| isConnection (ReadOnly)      | ✅       | ✅    | ✅        | ✅    | since 4.1.0-7, Web since 8.2.0 |
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
| saveToStore                  | ❌       | ❌    | ❌        | ✅    | Web: no-op on OPFS, flushes the image on the IndexedDB tier |
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

- [Web Usage](https://github.com/capacitor-community/sqlite/blob/master/docs/Web-Usage.md) (required reading for the Web platform)

- [Non Conformed Databases](https://github.com/capacitor-community/sqlite/blob/master/docs/NonConformedDatabases.md)

- [Biometric Authentication](https://github.com/capacitor-community/sqlite/blob/master/docs/Biometric-Authentication.md)

- [Enable SQLite Schema Error Syntax Highlighting](https://github.com/capacitor-community/sqlite/blob/master/docs/SyntaxScanner-For-SQLite-Code.md)

- [Electron Better SQLite3](https://github.com/capacitor-community/sqlite/blob/master/docs/ElectronBetterSQLite3.md)

- [Enable minified build on Android](https://github.com/capacitor-community/sqlite/blob/master/docs/AndroidMinify.md)


## Applications demonstrating the use of the plugin and related documentation

> The sample apps below predate the current Web engine. Their native code is unaffected, but every
> Web setup step they show (installing `jeep-sqlite`, defining the custom element, copying
> `sql-wasm.wasm`) has been removed from the plugin. Follow
> [Web Usage](https://github.com/capacitor-community/sqlite/blob/master/docs/Web-Usage.md) instead.

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
The Web code is using `@sqlite.org/sqlite-wasm`, the official SQLite wasm build, in a dedicated Worker, with `fflate` for unzipping assets files.  

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
