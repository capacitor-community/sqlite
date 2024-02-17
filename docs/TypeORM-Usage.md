
# Using capacitor-sqlite with TypeORM

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!!!! This documentation is obsolete if you are using Ionic7 and Vite !!!!
!!!! Go To TypeORM-Usage-From-5.6.0
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

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
## Ionic/Vue app

An example of a Ionic/Vue app has been developed https://github.com/jepiqueau/vue-typeorm-app demonstrating the use of TypeORM with migrations and multiple connections. The migration files have been created manually, not using the TypeORM cli ( generate, create ). If one find the way of using the TypeORM cli he or she will be welcome to make a PR to this documentation and make a PR to the application.

### Requirements

In the vue.config.js, if it exists otherwise create a new file, add the following:

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

## Ionic/Angular app

An example of a Ionic/Angular app has been developed https://github.com/jepiqueau/ionic-sqlite-typeorm-app demonstrating the use of TypeORM with migrations. The migration files have been created manually, not using the TypeORM cli ( generate, create ). If one find the way of using the TypeORM cli he or she will be welcome to make a PR to this documentation and make a PR to the application.

### Requirements

 - the `terser-webpack-plugin` has been installed and a `custom.webpack.config.js` file has been added to be able to use the migration.

 ```js
  var webpack = require('webpack');
  var TerserPlugin = require('terser-webpack-plugin')

  console.log('The custom config is used');
  module.exports = {
    optimization: {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            keep_classnames: true,
            keep_fnames: true,
          },
        }),
      ],
    },
    plugins: [
        new webpack.NormalModuleReplacementPlugin(/typeorm$/, function (result) {
            result.request = result.request.replace(/typeorm/, "typeorm/browser");
        })
    ],
  };
 ```

 - the `angular.json` has been modified

    - replacing

    ```json
      "architect": {
        "build": {
          "builder": "@angular-devkit/build-angular:browser",
          "options": {
            "outputPath": "www",
    ```

    - by

    ```json
      "architect": {
        "build": {
          "builder": "@angular-builders/custom-webpack:browser",
          "options": {
            "customWebpackConfig": {
              "path": "./custom.webpack.config.js"
            },
            "allowedCommonJsDependencies": [
              "debug",
              "buffer",
              "sha.js"
            ],
            "outputPath": "www",
    ```

    - and

    ```json
      "serve": {
        "builder": "@angular-devkit/build-angular:dev-server",
        "options": {
          "browserTarget": "app:build"
        },
    ```

    - by

    ```json
      "serve": {
        "builder": "@angular-builders/custom-webpack:dev-server",
        "options": {
          "browserTarget": "app:build"
        },
    ```

## Ionic/React app

An example of a Ionic/React app has been developed https://github.com/cosentino/capacitor-sqlite-react-typeorm-app demonstrating the use of TypeORM with migrations. The migration files have been created manually, not using the TypeORM cli ( generate, create ). If one find the way of using the TypeORM cli he or she will be welcome to make a PR to this documentation and make a PR to the application.

### Requirements

Since Create React App does not allow to tweek the react project compilation as required by TypeORM.
We thus need to replace react-script with a tool such as [CRACO](https://craco.js.org/) and then override the default configurations (note: ejecting CRA is a viable solution).
CRACO will allow us to customize the default CRA Webpack configuration.

#### 1. Install the latest version of the package from npm as a dev dependency

```bash
npm i -D @craco/craco craco-swc
```

#### 2. Create a CRACO configuration file in your project's root directory and configure

Create the files craco.config.js and .swcrc the files in the project root.
The following will tell CRACO to:

- force the minimizer (Terser) settings "keep_classnames" and "keep_fnames" to true
- use SWC instead of Babel as transpiler
- configure SWC parser and tranformer so that uses "legacyDecorator" and "decoratorMetadata"

craco.config.js:

```js
const CracoSwcPlugin = require('craco-swc');

module.exports = {
  plugins: [
    {
      plugin: CracoSwcPlugin, // see .swcrc for SWC configuration (that will replace Babel)
    }, 
    {
      plugin: {
        overrideWebpackConfig: ({ webpackConfig }) => {          
          const terser = webpackConfig?.optimization?.minimizer?.find(x => x.options.minimizer);
          if (terser) {
            terser.options.minimizer.options = {
              ...terser.options.minimizer.options,
              keep_classnames: true,
              keep_fnames: true,
            }
          }
          return webpackConfig;
        }
      }
    }
  ],
};
```

.swcrc:

```json
{
  "$schema": "https://json.schemastore.org/swcrc",
  "jsc": {
    "externalHelpers": true,
    "target": "es5",
    "preserveAllComments": true,
    "parser": {
      "syntax": "typescript",
      "tsx": true,
      "dynamicImport": true,
      "decorators": true
    },
    "transform": {
      "legacyDecorator": true,
      "decoratorMetadata": true
    }
  }
}
```

#### 3. Update build commands to use craco CLI

In particular in the :

- Update existing calls to react-scripts in the scripts section of your package.json to use the craco CLI.
- Override the ionic build​ command to use craco cli (see [https://ionicframework.com/docs/cli/configuration#overriding-the-build]).

```json
"scripts": {
  "start": "npm run copysqlwasm && craco start",
  "build": "npm run copysqlwasm && craco build",  
  "copysqlwasm": "copyfiles -u 3 node_modules/sql.js/dist/sql-wasm.wasm public/assets",
  "ionic:build": "npm run build",
  "ionic:serve": "npm run start"
},
```

#### 4. Add the following to tsconfig.json

```json
  "strictPropertyInitialization": false,
  "experimentalDecorators": true,
  "emitDecoratorMetadata": true,
```

#### 5. Install reflect-metadata package

```bash
npm i reflect-metadata
```

#### 6. import 'reflect-metadata' once, before any typeorm entity import, for example add the following to the ./src/index.tsx

```ts
import "reflect-metadata";
import React from 'react';  
```

