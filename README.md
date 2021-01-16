<p align="center"><br><img src="https://user-images.githubusercontent.com/236501/85893648-1c92e880-b7a8-11ea-926d-95355b8175c7.png" width="128" height="128" /></p>
<h3 align="center">SQLITE DATABASE</h3>
<p align="center"><strong><code>@capacitor-community/sqlite</code></strong></p>
<br>
<p align="center" style="font-size:50px;color:red"><strong>REFACTOR 🚀</strong></p><br>

<p align="center">
  Capacitor community plugin for Native and Electron SQLite Databases. In Native databases could be encrypted with SQLCipher
</p>
<br>
<p align="center">
  <img src="https://img.shields.io/maintenance/yes/2021?style=flat-square" />
  <a href="https://github.com/capacitor-community/sqlite/actions?query=workflow%3A%22CI%22"><img src="https://img.shields.io/github/workflow/status/capacitor-community/sqlite/CI?style=flat-square" /></a>
  <a href="https://www.npmjs.com/package/@capacitor-community/sqlite"><img src="https://img.shields.io/npm/l/@capacitor-community/sqlite?style=flat-square" /></a>
<br>
  <a href="https://www.npmjs.com/package/@capacitor-community/sqlite"><img src="https://img.shields.io/npm/dw/@capacitor-community/sqlite?style=flat-square" /></a>
  <a href="https://www.npmjs.com/package/@capacitor-community/sqlite"><img src="https://img.shields.io/npm/v/@capacitor-community/sqlite/refactor?style=flat-square" /></a>
<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
<a href="#contributors-"><img src="https://img.shields.io/badge/all%20contributors-4-orange?style=flat-square" /></a>
<!-- ALL-CONTRIBUTORS-BADGE:END -->
</p>

## Maintainers

| Maintainer        | GitHub                                    | Social |
| ----------------- | ----------------------------------------- | ------ |
| Quéau Jean Pierre | [jepiqueau](https://github.com/jepiqueau) |        |

## REFACTOR 🚀

The refactor offers now (since `2.9.0-beta.1`) all the features that the previous was offering. It has been a quite heavy process, hoping that the developpers will take benefit from it.

The main reasons for it:

- multiple database connections
- db connector allowing for easy commands `db.open(), db.close, ...`
- improve the response time of the encrypted database by removing the internal open and close database for each sqlite query
- moving to the latest `androidx.sqlite.db.xxx`
- offering encryption for Electron platform by using `@journeyapps/sqlcipher` on MacOs, !!! NOT ON WINDOWS !!!
- cleaning and aligning the code between platforms
- allowing developers to develop `typeorm` or `spatialite` drivers.

This was discussed lengthly in issue#1 and issue#52

Refactor available for `Android`, `iOS` and `Electron` platforms.

The test has been achieved on:

- a [Ionic/Angular app](#ionic/angular)

- a [Ionic/React app](#ionic/react)

- a [Ionic/Vue app](#ionic/vue)

Other frameworks will be tested later

- Stencil

## Browser Support

The plugin follows the guidelines from the `Capacitor Team`,

- [Capacitor Browser Support](https://capacitorjs.com/docs/v3/web#browser-support)

meaning that it will not work in IE11 without additional JavaScript transformations, e.g. with [Babel](https://babeljs.io/).

## Installation

```bash
npm install @capacitor-community/sqlite@refactor
npm run build
npx cap sync
npx cap add android
npx cap add ios
npx cap add @capacitor-community/electron
```

### IOS

- on iOS no further steps needed.

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

```
npm install --save @journeyapps/sqlcipher
```

## Build & Run

```
npm run build
npx cap copy
npx cap copy @capacitor-community/electron
```

### IOS

```
npx cap open ios
```

### Android

```
npx cap open android
```

### Electron

```
npx cap open @capacitor-community/electron
```

## Configuration

No configuration required for this plugin

## Supported methods

| Name                    | Android | iOS | Electron Mac | Electron Windows | Web |
| :---------------------- | :------ | :-- | :----------- | :--------------- | :-- |
| createConnection        | ✅      | ✅  | ✅           | ✅               | ❌  |
| closeConnection         | ✅      | ✅  | ✅           | ✅               | ❌  |
| open (non-encrypted DB) | ✅      | ✅  | ✅           | ✅               | ❌  |
| open (encrypted DB)     | ✅      | ✅  | ✅           | ❌               | ❌  |
| close                   | ✅      | ✅  | ✅           | ✅               | ❌  |
| execute                 | ✅      | ✅  | ✅           | ✅               | ❌  |
| executeSet              | ✅      | ✅  | ✅           | ✅               | ❌  |
| run                     | ✅      | ✅  | ✅           | ✅               | ❌  |
| query                   | ✅      | ✅  | ✅           | ✅               | ❌  |
| deleteDatabase          | ✅      | ✅  | ✅           | ✅               | ❌  |
| importFromJson          | ✅      | ✅  | ✅           | ✅               | ❌  |
| exportToJson            | ✅      | ✅  | ✅           | ✅               | ❌  |
| createSyncTable         | ✅      | ✅  | ✅           | ✅               | ❌  |
| setSyncDate             | ✅      | ✅  | ✅           | ✅               | ❌  |
| getSyncDate             | ✅      | ✅  | ✅           | ✅               | ❌  |
| isJsonValid             | ✅      | ✅  | ✅           | ✅               | ❌  |
| isDBExists              | ✅      | ✅  | ✅           | ✅               | ❌  |
| addUpgradeStatement     | ✅      | ✅  | ✅           | ✅               | ❌  |
| copyFromAssets          | ✅      | ✅  | ✅           | ✅               | ❌  |

## Documentation

[API_Documentation](https://github.com/capacitor-community/sqlite/blob/refactor/docs/API.md)

[API_Connection_Wrapper_Documentation](https://github.com/capacitor-community/sqlite/blob/refactor/docs/APIConnection.md)

[API_DB_Connection_Wrapper_Documentation](https://github.com/capacitor-community/sqlite/blob/refactor/docs/APIDBConnection.md)

[ImportExportJson_Documentation](https://github.com/capacitor-community/sqlite/blob/refactor/docs/ImportExportJson.md)

[UpgradeDatabaseVersion_Documentation](https://github.com/capacitor-community/sqlite/blob/refactor/docs/UpgradeDatabaseVersion.md)

[Ionic/Angular_Usage_Documentation](https://github.com/capacitor-community/sqlite/blob/refactor/docs/Ionic-Angular-Usage.md)

[Ionic/React_Usage_Documentation](https://github.com/capacitor-community/sqlite/blob/refactor/docs/Ionic-React-Usage.md)

[Ionic/Vue_Usage_Documentation](https://github.com/capacitor-community/sqlite/blob/refactor/docs/Ionic-Vue-Usage.md)

## Applications demonstrating the use of the plugin

### Ionic/Angular

- [angular-sqlite-app-refactor](https://github.com/jepiqueau/angular-sqlite-app-refactor)

### Ionic/React

- [react-sqlite-app-refactor](https://github.com/jepiqueau/react-sqlite-app-starter/tree/refactor)

### Ionic/Vue

- [vue-sqlite-app-refactor](https://github.com/jepiqueau/vue-sqlite-app-starter/tree/refactor)

### Vue (to come later)

## Usage

- [see capacitor documentation](https://capacitor.ionicframework.com/docs/getting-started/with-ionic)

- [In your Ionic/Angular App](https://github.com/capacitor-community/sqlite/blob/refactor/docs/Ionic-Angular-Usage.md)

- [In your Ionic/React App](https://github.com/capacitor-community/sqlite/blob/refactor/docs/Ionic-React-Usage.md)

- [In your Ionic/Vue App](https://github.com/capacitor-community/sqlite/blob/refactor/docs/Ionic-Vue-Usage.md)

## Dependencies

The IOS and Android codes are using `SQLCipher` allowing for database encryption
The Electron code use `@journeyapps/sqlcipher` allowing for database encryption

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://github.com/jepiqueau"><img src="https://avatars3.githubusercontent.com/u/16580653?v=4" width="100px;" alt=""/><br /><sub><b>Jean Pierre Quéau</b></sub></a><br /><a href="https://github.com/capacitor-community/sqlite/commits?author=jepiqueau" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/paulantoine2"><img src="https://avatars0.githubusercontent.com/u/22882943?s=64&v=4" width="100px;" alt=""/><br /><sub><b>Paul Antoine</b></sub></a><br /><a href="https://github.com/capacitor-community/sqlite/commits?author=jepiqueau" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/karyfars"><img src="https://avatars2.githubusercontent.com/u/303016?s=60&u=1ce232ae3c22eac7b0b4778e46fe079939c39b40&v=4" width="100px;" alt=""/><br /><sub><b>Karyfars</b></sub></a><br /><a href="https://github.com/capacitor-community/sqlite/commits?author=jepiqueau" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/chriswep"><img src="https://avatars2.githubusercontent.com/u/1055809?s=400&u=e555940f143da8be255743028d6838cb5c020b44&v=4" width="100px;" alt=""/><br /><sub><b>Chriswep</b></sub></a><br /><a href="https://github.com/capacitor-community/sqlite/commits?author=jepiqueau" title="Documentation">📖</a></td>    
  </tr>
</table>

<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
