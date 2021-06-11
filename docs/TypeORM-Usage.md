# Using capacitor-sqlite with TypeORM

*Currently a [PR with a fix for the capacitor driver is still open on the TypeORM repo](https://github.com/typeorm/typeorm/pull/7728) which solves an error on Android when using certain `PRAGMA` requests*

```typescript
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import { createConnection } from 'typeorm';

// when using Capacitor, you might want to close existing connections, 
// otherwise new connections will fail when using dev-live-reload
// see https://github.com/capacitor-community/sqlite/issues/106
this.pSqliteConsistent = CapacitorSQLite.checkConnectionsConsistency({
    dbNames: [], // i.e. "i expect no connections to be open"
}).catch((e) => {
    // the plugin throws an error when closing connections. we can ignore
    // that since it is expected behaviour
    console.log(e);
    return {};
});

// create a SQLite Connection Wrapper
const sqliteConnection = new SQLiteConnection(CapacitorSQLite);

// copy preloaded dbs (optional, not TypeORM related):
// the preloaded dbs must have the `YOUR_DB_NAME.db` format (i.e. including 
// the `.db` suffix, NOT including the internal `SQLITE` suffix from the plugin)
await sqliteConnection.copyFromAssets();

// create the TypeORM connection
const typeOrmConnection = await createConnection({
    type: 'capacitor',
    driver: sqliteConnection, // pass the connection wrapper here
    database: 'YOUR_DB_NAME' // database name without the `.db` suffix
});
```