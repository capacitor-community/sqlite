import { WebPlugin } from '@capacitor/core';
import { CapacitorSQLitePlugin, capSQLiteOptions, capSQLiteResult } from './definitions';

export class CapacitorSQLiteWeb extends WebPlugin implements CapacitorSQLitePlugin {
  public sqlite3: any;

  constructor() {
    super({
      name: 'CapacitorSQLite',
      platforms: ['web', 'electron']
    });
  }

  async echo(options: { value: string }): Promise<{value: string}> {
    console.log('ECHO', options);
    return options;
  }
  async open(options: capSQLiteOptions): Promise<capSQLiteResult> {
    console.log('open', options);
    const sqlite3: any = this.sqlite3;
    if (sqlite3) {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database('./my.db');
            db.serialize(function () {
                db.run("CREATE TABLE if not exists lorem (info TEXT)");
                var stmt = db.prepare("INSERT INTO lorem VALUES (?)");
                for (var i = 0; i < 10; i++) {
                    stmt.run("Ipsum " + i);
                }
                stmt.finalize();
                db.all("SELECT rowid AS id, info FROM lorem", (err: any, rows: any) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(rows);
                    }
                });
            });
        });
    } else {
      return Promise.reject("Not implemented");

    }
  }
  async close(options: capSQLiteOptions): Promise<capSQLiteResult> {
    console.log('close', options);
    return Promise.reject("Not implemented");
  }
  async execute(options: capSQLiteOptions): Promise<capSQLiteResult> {
    console.log('execute', options);
    return Promise.reject("Not implemented");    
  }
  async run(options: capSQLiteOptions): Promise<capSQLiteResult>{
    console.log('run', options);
    return Promise.reject("Not implemented");    
  }
  async query(options: capSQLiteOptions): Promise<capSQLiteResult>{
    console.log('query', options);
    return Promise.reject("Not implemented");    
  }
  async deleteDatabase(options: capSQLiteOptions): Promise<capSQLiteResult>{
    console.log('deleteDatabase', options);
    return Promise.reject("Not implemented");    
  }

}

const CapacitorSQLite = new CapacitorSQLiteWeb();

export { CapacitorSQLite };

import { registerWebPlugin } from '@capacitor/core';
registerWebPlugin(CapacitorSQLite);
