import { WebPlugin } from '@capacitor/core';
import { CapacitorSQLitePlugin } from './definitions';

export class CapacitorSQLiteWeb extends WebPlugin implements CapacitorSQLitePlugin {
  constructor() {
    super({
      name: 'CapacitorSQLite',
      platforms: ['web']
    });
  }

  async echo(options: { value: string }): Promise<{value: string}> {
    console.log('ECHO', options);
    return options;
  }
  async open(options: { name: string }): Promise<{result: boolean}> {
    console.log('open', options);
    return Promise.reject("Not implemented");
  }
  async execute(options: {statements: string }): Promise<{result: number}> {
    console.log('execute', options);
    return Promise.reject("Not implemented");    
  }
  async run(options: {statement: string, values: Array<Array<any>> }): Promise<{result: number}>{
    console.log('run', options);
    return Promise.reject("Not implemented");    
  }
  async query(options: {statement: string}): Promise<{result: Array<any>}>{
    console.log('query', options);
    return Promise.reject("Not implemented");    
  }
  async deleteDatabase(options: { name: string }): Promise<{result: boolean}>{
    console.log('deleteDatabase', options);
    return Promise.reject("Not implemented");    
  }

}

const CapacitorSQLite = new CapacitorSQLiteWeb();

export { CapacitorSQLite };

import { registerWebPlugin } from '@capacitor/core';
registerWebPlugin(CapacitorSQLite);
