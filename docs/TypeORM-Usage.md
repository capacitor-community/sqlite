# Using capacitor-sqlite with TypeORM

```typescript
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import { DataSource } from 'typeorm';

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
// For more information see https://typeorm.io/data-source#creating-a-new-datasource
const AppDataSource = new DataSource({
    type: 'capacitor',
    driver: sqliteConnection, // pass the connection wrapper here
    database: 'YOUR_DB_NAME' // database name without the `.db` suffix
});

AppDataSource.initialize()
    .then(() => {
        console.log("Data Source has been initialized!")
    })
    .catch((err) => {
        console.error("Error during Data Source initialization", err)
    });
    
```

An example of a Ionic/Vue app has been developed `https://github.com/jepiqueau/vue-typeorm-app` demonstrating the use of TypeORM migrations and multiple connections. it will be enhanced in the future.
It requires to add in or create a `vue.config.js` file the following

```js
module.exports = {
	chainWebpack: config => {
		if (process.env.NODE_ENV === 'production') {
			config.optimization.minimizer('terser').tap((args) => {
				// see https://cli.vuejs.org/guide/webpack.html#chaining-advanced
				// https://cli.vuejs.org/migrating-from-v3/#vue-cli-service
				//   => chainWebpack for a chain override example
				// https://github.com/terser/terser#minify-options for terser options
				const terserOptions = args[0].terserOptions
				// Avoid to mangle entities (leads to query errors)
				terserOptions["keep_classnames"] = true
				terserOptions["keep_fnames"] = true
				// console.log(JSON.stringify(args[0], null, 2))
				return args
			})
		}
	},
}
```

