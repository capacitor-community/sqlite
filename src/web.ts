import { WebPlugin } from '@capacitor/core';
import { CapacitorSQLitePlugin, capSQLiteOptions, capSQLiteResult } from './definitions';

export class CapacitorSQLiteWeb extends WebPlugin implements CapacitorSQLitePlugin {

  private db: any;

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
    const sqlite3: any = window['sqlite3' as any];
    if (sqlite3) {
        return new Promise((resolve, reject) => {
          if (!options || !options.database) {
            reject("Must provide a database name");
          } else {
            this.db = new sqlite3.Database(options.database);
            resolve({result: true})

          }
        });
    } else {
      console.log('open', options);
      return Promise.reject("Not implemented");
    }
  }

  async close(options: capSQLiteOptions): Promise<capSQLiteResult> {
    const sqlite3: any = window['sqlite3' as any];
    if (sqlite3) {
      return new Promise((resolve, reject) => {
        if (!options || !options.database) {
          reject("Must provide a database name");
        } else if (!this.db) {
          reject("No Database Open");
        } else {
          this.db.close((err: any) => {
            if (err) {
              reject(err);
            } else {
              resolve({result: true})
            }
          });
        }

      });
    } else {
      console.log('close', options);
      return Promise.reject("Not implemented");
    }
  }
  async execute(options: capSQLiteOptions): Promise<capSQLiteResult> {
    const sqlite3: any = window['sqlite3' as any];
    if (sqlite3) {
      return new Promise((resolve, reject) => {
        if (!options ||!options.statements) {
          reject("Must provide a statements");
        } else  if (!this.db) {
          reject("No Database Open");
        } else {

          this.db.exec(options.statements, (err: any) => {
            if (err) {
              reject(err);
            } else {
              resolve({result: true})
            }
          });
        }

      });
    } else {
      console.log('execute', options);
      return Promise.reject("Not implemented");
    }
  }
  async run(options: capSQLiteOptions): Promise<capSQLiteResult>{
    const sqlite3: any = window['sqlite3' as any];
    if (sqlite3) {
      return new Promise((resolve, reject) => {
        if (!options ||!options.statement) {
          reject("Must provide a statement");
        } else  if (!this.db) {
          reject("No Database Open");
        } else {
          this.db.run(options.statement, options.values, function (err: any) {
              if (err) {
                reject(err);
              } else {
                resolve({result: true, changes: this.changes});
              }
          });
          
        }

      });
    } else {
      console.log('run', options);
      return Promise.reject("Not implemented");
    }  
  }
  async query(options: capSQLiteOptions): Promise<capSQLiteResult>{
    const sqlite3: any = window['sqlite3' as any];
    if (sqlite3) {
      return new Promise((resolve, reject) => {
        if (!options ||!options.statement) {
          reject("Must provide a statement");
        } else  if (!this.db) {
          reject("No Database Open");
        } else {
          this.db.all(options.statement, options.values, (err: any, result: any) => {
            if (err) {
              console.error('query', err);
              reject(err);
            } else {
              resolve({values: result});
            }
          });
        }

      });
    } else {
      console.log('query', options);
      return Promise.reject("Not implemented");
    }  
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
