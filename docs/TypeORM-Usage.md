# Using capacitor-sqlite with TypeORM

*Currently a [PR with fix for the capacitor driver is still open on the TypeORM repo](https://github.com/typeorm/typeorm/pull/7728) which solves an error on Android when using certain `PRAGMA` requests*

```typescript
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import { createConnection } from 'typeorm';

// create a SQLite Connection Wrapper
const sqliteConnection = new SQLiteConnection(CapacitorSQLite);

// copy preloaded dbs (optional, not TypeORM related):
// the preloaded dbs must have the `YOUR_DB_NAME.db` format (i.e. including the suffix, 
// NOT including the `SQLITE` suffix from capacitor-sqlite)
await sqliteConnection.copyFromAssets();

// create the TypeORM connection
const typeOrmConnection = await createConnection({
    type: 'capacitor',
    driver: sqliteConnection, // pass the connection wrapper here
    database: 'YOUR_DB_NAME' // database name without the `.db` suffix
});
```