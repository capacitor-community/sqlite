# Using TypeORM with the capacitor driver type

## Some Basics

 - Developers can use the `@capacitor-community/sqlite` plugin to create apps for Web, Electron, iOS, or Android using the same code. Almost any framework can be used to develop these apps:

    - Ionic7/Angular, Ionic7/React, Ionic7/Vue 
    - Pure Angular, React, Vue3
    - SolidJS
    - Quasar
    - Nuxt3 + Kysely
    - Svelte

 - The `typeOrm` package now has a `capacitor` driver type that must be used with the `@capacitor-community/sqlite` capacitor plugin.

 - Apps using the `@capacitor-community/sqlite` capacitor plugin cannot use the `CLI` of the `typeOrm` package. Developers were receiving a message stating that the "jeep-sqlite element is not present in the DOM" when trying to access it. This is a result of the database being created and stored in the DOM.

## New from release 5.6.0 of @capacitor-community/sqlite

 - By incorporating Node.js code into few methods of the `@capacitor-community/sqlite` Web Interface, the `migration:generate` TypeORM CLI becomes accessible even when the DOM is not available, enabling the generation of initial migration files.

 - Before generating subsequent migration files following modifications to the entities, it's necessary to save the DOM database to the local disk.

 - Because of the limitation imposed by the WellKnownDirectory in the `browser-fs-access` package utilized by `jeep-sqlite` for saving the database on the local disk, the `documents` directory has been designated. Therefore, when the file picker form is displayed, you need to navigate to the Documents/CapacitorSQLite/YOUR_APPLICATION_NAME directory to save the database.

## Applications/Tutorials

Applications will come on a regular basis 

 - [Applications Github](https://github.com/jepiqueau/blog-tutorials-apps)
 - [Tutorials site](https://jepiqueau.github.io/)

## Typical TypeOrm App Directory Structure

In the context of an Author DataSource with three entities
 - Author
 - Category
 - Post

the TypeOrm directory structure could be organized as follows, irrespective of the framework used:


![alt text](TypeOrmAppDirectories.png)


## Putting Some Code Into Those Files

### DataSource AuthorDataSource.ts

```ts
import { DataSource , type DataSourceOptions} from 'typeorm';
import sqliteParams from '../sqliteParams';
import * as entities from '../entities/author';
import * as migrations from '../migrations/author';

const dbName = "YOUR_DATABASE_NAME";

const dataSourceConfig: DataSourceOptions = {
  name: 'authorConnection',
  type: 'capacitor',
  driver: sqliteParams.connection,
  database: dbName,
  mode: 'no-encryption',
  entities: entities,
  migrations: migrations, //["../migrations/author/*{.ts,.js}"]
  subscribers: [],
  logging: [/*'query',*/ 'error','schema'],
  synchronize: false,     // !!!You will lose all data in database if set to `true`
  migrationsRun: false  // Required with capacitor type
};
export const dataSourceAuthor = new DataSource(dataSourceConfig);
const authorDataSource = {
  dataSource: dataSourceAuthor,
  dbName: dbName
};

export default authorDataSource;
```

### Entity author.ts

```ts
import {Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn} from 'typeorm';
import {Post} from './post';

@Entity('author')
export class Author {

  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({nullable: true})
  birthday!: string;

  @Column({unique: true})
  email!: string;

  @OneToMany(type => Post, post => post.author)
  posts!: Post[];
  
}
```

### Entity category.ts

```ts
import {Entity, PrimaryGeneratedColumn, Column} from 'typeorm';

@Entity('category')
export class Category {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({unique: true})
    name!: string;

}
```

### Entity post.ts

```ts
import {Entity, Column, PrimaryGeneratedColumn, ManyToOne, ManyToMany,
		JoinTable, type Relation, CreateDateColumn} from 'typeorm';
import {Author} from './author';
import {Category} from './category';

@Entity('post')
export class Post {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column('text')
  text!: string;

  @ManyToMany(type => Category, {
		cascade: ['insert']
	})
	@JoinTable()
	categories!: Category[];

	@ManyToOne(type => Author, author => author.posts, {
		cascade: ['insert']
	})
	author!: Relation<Author>;

}
```

### Entity index.ts

```ts
import { Author } from './author';
import { Category } from './category';
import { Post } from './post';

export { Author, Category, Post };
```

### Migration index.ts

```ts
export {};
```

### Capacitor sqliteParams.ts

```ts
import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
const sqliteConnection: SQLiteConnection = new SQLiteConnection(CapacitorSQLite);
const sqlitePlugin = CapacitorSQLite;
const platform: string = Capacitor.getPlatform();
const sqliteParams = {
    connection: sqliteConnection,
    plugin: sqlitePlugin,
    platform: platform
}
export default sqliteParams;
```

### Utilities utilities.ts

```ts
import { DataSource } from "typeorm";

export const getCountOfElements =  (async (connection: DataSource, entity:any): Promise<number> => {
    // Get the repository for your entity
    const repository = connection.getRepository(entity);
    // Use the count() method to query the count of elements in the table
    const count = await repository.count();
  
    return count;
});
```

## Correcting a Bug in the TypeOrm Capacitor Driver

 - the bug is referenced "PRAGMA must run under query method in Capacitor sqlite #10687" in the typeorm/issues

 - create a `scripts` directory at the root of the App.

 - create a `modify-typeorm.cjs` file under this directory with:

 ```js
    const fs = require('fs');

    const filePath = './node_modules/typeorm/driver/capacitor/CapacitorQueryRunner.js';
    const lineToModify = 61;
    const replacementText = '    else if (["INSERT", "UPDATE", "DELETE"].indexOf(command) !== -1) {';

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return;
        }

        // Split data by line
        const lines = data.split('\n');

        // Modify the specific line
        if (lines.length >= lineToModify) {
            lines[lineToModify - 1] = replacementText; // Line numbers are 1-based
        } else {
            console.error('Line number to modify is out of range.');
            return;
        }

        // Join lines back together
        const modifiedData = lines.join('\n');

        // Write the modified data back to the file
        fs.writeFile(filePath, modifiedData, 'utf8', (err) => {
            if (err) {
                console.error('Error writing file:', err);
                return;
            }
            console.log('File modified successfully.');
        });
    });
 ```

## Modify the Scripts in Package.json File

```json
  "scripts": {
    ...
    "typeorm:migration:generate:initialAuthor": "npx typeorm-ts-node-esm migration:generate src/databases/migrations/author/InitialAuthorPost -d src/databases/datasources/AuthorDataSource.ts",
    "postinstall": "node ./scripts/modify-typeorm.cjs"

  }

```

## Generate the initial migration file

```bash
npm run postinstall
npm run typeorm:migration:generate:initialAuthor
```

 - Now you must have a file like `1708168009284-InitialAuthorPost.ts`under the `migrations/author` directory

 - Open the `index.ts`file under `migrations/author` directory and edit it with

 ```ts 
    import { InitialAuthorPost1708168009284 } from './1708168009284-InitialAuthorPost';
    export {InitialAuthorPost1708168009284};
 ```

Obviously, you must replace `1708168009284` by the prefix you have in front of `-InitialAuthorPost.ts`.

## Initialize the TypeOrm DataSource

Somewhere in the `main.ts` file of your App you must initialize your DataSources

```ts 
... 
import { JeepSqlite } from 'jeep-sqlite/dist/components/jeep-sqlite';
import sqliteParams from './databases/sqliteParams';
import authorDataSource from './databases/datasources/AuthorDataSource';

customElements.define('jeep-sqlite', JeepSqlite);

const initializeDataSources = async () => {
  //check sqlite connections consistency
  await sqliteParams.connection.checkConnectionsConsistency()
  .catch((e) => {
    console.log(e);
    return {};
  });

  // Loop through the DataSources
  for (const mDataSource of [authorDataSource , userDataSource]) {
    // initialize
    await mDataSource.dataSource.initialize();
    if (mDataSource.dataSource.isInitialized) {
      // run the migrations
      await mDataSource.dataSource.runMigrations();
    }
    if( sqliteParams.platform === 'web') {
      await sqliteParams.connection.saveToStore(mDataSource.dbName);
    }                    
  }     
}

if (sqliteParams.platform !== "web") {
  initializeDataSources();
  // Now depending on the Framework render your APP
  ...
} else {
  window.addEventListener('DOMContentLoaded', async () => {
      const jeepEl = document.createElement("jeep-sqlite");
      document.body.appendChild(jeepEl);
      customElements.whenDefined('jeep-sqlite').then(async () => {
        await sqliteParams.connection.initWebStore();
        await initializeDataSources();
        // Now depending on the Framework render your APP
        ...
     })
      .catch ((err) => {
        console.log(`Error: ${err}`);
        throw new Error(`Error: ${err}`)
      });
  });

```






