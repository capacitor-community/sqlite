import { WebPlugin } from '@capacitor/core';
import { CapacitorSQLitePlugin, capSQLiteOptions, capSQLiteResult } from './definitions';
import { DatabaseSQLiteHelper } from './electron-utils/DatabaseSQLiteHelper';

export class CapacitorSQLitePluginElectron extends WebPlugin implements CapacitorSQLitePlugin {
    mDb:DatabaseSQLiteHelper;
    constructor() {
        super({
        name: 'CapacitorSQLite',
        platforms: ['electron']
        });
    }

    async echo(options: { value: string }): Promise<{value: string}> {
        return options;
    }
    async open(options: capSQLiteOptions): Promise<capSQLiteResult> {
        if(typeof options.database === 'undefined') {
            return Promise.reject({result:false, message:"Must provide a database name"});
        }
        const dbName: string = options.database;
        /*
        let encrypted: boolean = options.encrypted ? options.encrypted : false;
        let inMode: string = "no-encryption";
        let secretKey: string = "";
        let newsecretKey: string = "";
        */
        this.mDb = new DatabaseSQLiteHelper(`${dbName}SQLite.db`/*,encrypted,inMode,secretKey,newsecretKey*/);
        if(!this.mDb.isOpen) {
            return Promise.reject({result:false,message:"Open command failed: Database \(dbName)SQLite.db not opened"});
        }
        return Promise.resolve({result:true});
    }
    async close(options: capSQLiteOptions): Promise<capSQLiteResult> {
        if(typeof options.database === 'undefined') {
            return Promise.reject({result:false, message:"Close command failed: Must provide a database name"});
        }
        const dbName: string = options.database;
        const ret = await this.mDb.close(`${dbName}SQLite.db`);
        if(!ret) {
            return Promise.reject({status:false,message:"Close command failed"});
        } 
        return Promise.resolve({result:true});
    }
  async execute(options: capSQLiteOptions): Promise<capSQLiteResult> {
    if(typeof options.statements === 'undefined') {
      return Promise.reject({changes:-1, message:"Execute command failed : Must provide raw SQL statements"});
    }
    const statements:string = options.statements;
    const ret: number = await this.mDb.exec(statements);    
    return Promise.resolve({changes:ret});    
  }
  async run(options: capSQLiteOptions): Promise<capSQLiteResult>{
    if(typeof options.statement === 'undefined') {
      return Promise.reject({changes:-1, message:"Run command failed : Must provide a SQL statement"});
    }
    if(typeof options.values === 'undefined') {
      return Promise.reject({changes:-1, message:"Run command failed : Values should be an Array of values"});
    }
    const statement: string = options.statement;
    const values:Array<any> = options.values;
    let ret:number;
    if(values.length > 0) {
      ret = await this.mDb.run(statement,values);
    } else {
      ret = await this.mDb.run(statement,null);
    }
    return Promise.resolve({changes:ret});    
  }
  async query(options: capSQLiteOptions): Promise<capSQLiteResult>{
    if(typeof options.statement === 'undefined') {
      return Promise.reject({changes:-1, message:"Query command failed : Must provide a SQL statement"});
    }
    if(typeof options.values === 'undefined') {
      return Promise.reject({changes:-1, message:"Query command failed : Values should be an Array of values"});
    }
    const statement: string = options.statement;
    const values:Array<any> = options.values;
    let ret:Array<any>;
    if(values.length > 0) {
      ret = await this.mDb.query(statement,values);
    } else {
      ret = await this.mDb.query(statement,[]);
    }
    return Promise.resolve({values:ret});    
  }
  async deleteDatabase(options: capSQLiteOptions): Promise<capSQLiteResult>{
    let dbName = options.database
    if (dbName == null) {
      return Promise.reject({result:false,message:"Must provide a Database Name"});
    }
    dbName = `${options.database}SQLite.db`;
    if(typeof this.mDb === 'undefined' || this.mDb === null) this.mDb = new DatabaseSQLiteHelper(dbName);
    const ret = await this.mDb.deleteDB(dbName);
    this.mDb = null;
    return Promise.resolve({result:ret});
  }

}

const CapacitorSQLiteElectron = new CapacitorSQLitePluginElectron();

export { CapacitorSQLiteElectron }; 
import { registerWebPlugin } from '@capacitor/core';
registerWebPlugin(CapacitorSQLiteElectron);
