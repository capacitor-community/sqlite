## CAPACITOR 3 (Master)


🚨 Since release 3.2.2-2 ->> 🚨

The executeSet method accepts now no values, see below

```
const setIssue170: Array<capSQLiteSet>  = [
  { statement: "DROP TABLE IF EXISTS issue170", values: [] },
  { statement: "CREATE TABLE issue170 (src VARCHAR(255))", values: [] },
  { statement: "INSERT INTO issue170 (src) values (?)", values: ["google.com"] },
]
```

🚨 Since release 3.2.0-5 ->> 🚨

The Web plugin is now implemented based on the stencil companion `jeep-sqlite@0.0.7` which is using `sql.js@1.5.0` for database queries and `localeforage@1.9.0`for database persistency.

🚨 Since release 3.2.0-3 ->> 🚨

The Electron plugin is now based on `@capacitor-community/electron@4.0.3` thanks to the hard and heavy work from `Mike Summerfeldt IT-MikeS` 👏 🙏

🚨 Since release 3.2.0-2 ->> 🚨
🚨 !!! for Electron developper, the Electron plugin is back !!! 🚨

Based on `sqlite3`, so without encryption
The two listeners `sqliteImportProgressEvent` and `sqliteExportProgressEvent` are not available.

🚨 Since release 3.1.2 ->> 🚨

Thanks to Nirajhinge and Chris, an example of using the TypeORM driver in a Ionic/Vue app has been developed see `https://github.com/jepiqueau/vue-typeorm-app`. 

🚨 Since release 3.0.0-rc.2 ->> 🚨

Thanks to Chris, a driver to TypeORM is now available

🚨 Since release 3.0.0-beta.13 ->> 🚨

  - GlobalSQLite `secret` and  `newsecret` are deprecated

  - The user can now set its own secure secret (passphrase)

    - use `setEncryptionSecret` ONCE to migrate encrypted databases
      from `secret` to `secure stored secret`
    
    - use `changeEncryptionSecret` to change your `secure stored secret`

  - iOS used `KeyChain service` to store the `secret`

  - Android used `Encrypted SharedPreferences` to store the `secret`,
    the minimun sdk should be set to 23 (limitation from Google)

🚨 Since release 3.0.0-beta.13 ->> 🚨

🚨 Since release 3.0.0-beta.11 ->> 🚨

  - Checking of types has been removed in all methods of the plugin
    both iOS & Android. This has been achieved to allow the use of
    others RDBMS types. 
    The type checking is now under the responsability of the developers.

  - NULL values are now returned as null

  - values for the `query` method is now an Array of any.

  - option to disable `transaction` for the `execute`, `executeSet`, `run`.

🚨 Since release 3.0.0-beta.11 <<- 🚨


## REFACTOR (Move to branch 2.9.x)

The `2.9.x` is now 🛑 NOT MAINTAINED ANYMORE 🛑.

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

- a [Ionic/Angular app](https://github.com/jepiqueau/angular-sqlite-app-starter/tree/refactor)

- a [Ionic/React app](https://github.com/jepiqueau/react-sqlite-app-starter/tree/refactor)

- a [Ionic/Vue app](https://github.com/jepiqueau/vue-sqlite-app-starter/tree/refactor)

Other frameworks will be tested later

- Stencil

## @INITIAL 🛑 (Move to branch 2.4.x)

The `2.4.x` is now 🛑 NOT MAINTAINED ANYMORE 🛑.

To install it

```bash
npm i --save @capacitor-community/sqlite@initial
```
The test has been achieved on:

- a [Ionic/Angular app](https://github.com/jepiqueau/angular-sqlite-app-starter/tree/2.4.x)

- a [Ionic/React app](https://github.com/jepiqueau/react-sqlite-app-starter/tree/2.4.x)

- a [Ionic/Vue app](https://github.com/jepiqueau/vue-sqlite-app-starter/tree/2.4.x)

