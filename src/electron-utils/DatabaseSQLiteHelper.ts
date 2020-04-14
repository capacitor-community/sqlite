import { UtilsSQLite } from './UtilsSQLite';
import { jsonSQLite } from './JsonUtils';

const fs: any = window['fs' as any];
const path: any = window['path' as any];

export class DatabaseSQLiteHelper {
    public isOpen: boolean = false;
    private _db: any;
    private _databaseName: string;
//    private _encrypted: boolean;
//    private _mode: string;
//    private _secret: string = "";
//    private _newsecret: string;
    private _utils: UtilsSQLite;

    constructor(dbName:string /*, encrypted:boolean = false, mode:string = "no-encryption",
        secret:string = "",newsecret:string=""*/) {
        this._utils = new UtilsSQLite();
        this._databaseName = dbName;
//        this._encrypted = encrypted;
//        this._mode = mode;
//        this._secret = secret;
//        this._newsecret = newsecret;
        this._openDB();
    }
    private _openDB() {
        this._db = this._utils.connection(this._databaseName,false/*,this._secret*/);
        if(this._db !== null) {
            this.isOpen = true;
        } else {
            this.isOpen = false;
            console.log("openDB: Error Database connection failed");
        }
    }
    public close(databaseName:string): Promise<boolean> {
        return new Promise(  (resolve) => {
            const db = this._utils.connection(databaseName,false/*,this._secret*/);
            if (db === null) {
                this.isOpen = false;
                console.log("close: Error Database connection failed");
                resolve(false);
            }
            this.isOpen = true;
            db.close((err:Error) => {
                if(err) {
                    console.log("close: Error closing the database")
                    resolve(false);
                } else {
                    this.isOpen = false;
                    resolve(true);
                }
            });
        });
    }
    public exec(statements:string): Promise<number> {
        return new Promise(  (resolve) => {
            const db = this._utils.connection(this._databaseName,false/*,this._secret*/);
            if (db === null) {
                this.isOpen = false;
                console.log("exec: Error Database connection failed");
                resolve(-1);
            }
            db.exec(statements,(err:Error)=> {
                if(err) {
                    console.log(`exec: Error Execute command failed : ${err.message}`);
                    db.close();
                    resolve(-1);    
                } else {
                    db.close();
                    resolve(1);
                }
            });
        });
    }
    public run(statement:string,values: Array<any>): Promise<number> {
        return new Promise(  (resolve) => {
            const db = this._utils.connection(this._databaseName,false/*,this._secret*/);
            if (db === null) {
                this.isOpen = false;
                console.log("run: Error Database connection failed");
                resolve(-1);
            }
            if(values && values.length >= 1) {
                db.run(statement,values,(err:Error)=> {
                    if(err) {
                        console.log(`run: Error Run command failed : ${err.message}`);
                        db.close();
                        resolve(-1);    
                    } else {
                        db.close();
                        resolve(1);
                    }
                });
            } else {
                db.run(statement,(err:Error)=> {
                    if(err) {
                        console.log(`run: Error Run command failed : ${err.message}`);
                        db.close();
                        resolve(-1);    
                    } else {
                        db.close();
                        resolve(1);
                    }
                });
            }
        });
    }
    public query(statement:string,values: Array<any>): Promise<Array<any>> {
        return new Promise(  (resolve) => {
            const db = this._utils.connection(this._databaseName,true/*,this._secret*/);
            if (db === null) {
                this.isOpen = false;
                console.log("query: Error Database connection failed");
                resolve(null);
            }
            if(values && values.length >= 1) {
                db.all(statement,values,(err:Error,rows:Array<any>)=> {
                    if(err) {
                        console.log(`query: Error Query command failed : ${err.message}`);
                        db.close();
                        resolve(null);    
                    } else {
                        db.close();
                        resolve(rows);
                    }
                });
            } else {
                db.all(statement,(err:Error,rows:Array<any>)=> {
                    if(err) {
                        console.log(`query: Error Query command failed : ${err.message}`);
                        db.close();
                        resolve(null);    
                    } else {
                        db.close();
                        resolve(rows);
                    }
                });
            } 
        });
    }
    public deleteDB(dbName:string): Promise<boolean> {
        return new Promise( (resolve) => {
            let ret: boolean = false;
            const dbPath = path.join(this._utils.pathDB,dbName);
            try {
                fs.unlinkSync(dbPath);
                //file removed
                ret = true;
              } catch(e) {
                console.log("Error: in deleteDB");
              }
            resolve(ret); 
        });
    }
    public importJson(jsonData:jsonSQLite): Promise<number> {
        return new Promise( async (resolve) => {
            let success: boolean = true;

            // create the database schema
            let statements: Array<string> = [];
            statements.push("BEGIN TRANSACTION;");
            for (let i:number = 0; i < jsonData.tables.length; i++) {
                if(jsonData.tables[i].schema && jsonData.tables[i].schema.length >= 1) {
                    if(jsonData.mode === 'full') statements.push(`DROP TABLE IF EXISTS ${jsonData.tables[i].name};`);
                    statements.push(`CREATE TABLE IF NOT EXISTS ${jsonData.tables[i].name} (`);
                    for (let j:number =0; j < jsonData.tables[i].schema.length; j++) {
                        if(j === jsonData.tables[i].schema.length - 1) {
                            statements.push(`${jsonData.tables[i].schema[j].column} ${jsonData.tables[i].schema[j].value}`);
                        } else {
                            statements.push(`${jsonData.tables[i].schema[j].column} ${jsonData.tables[i].schema[j].value},`);
                        }
                    }
                    statements.push(");");
                }
                if(jsonData.tables[i].indexes && jsonData.tables[i].indexes.length >= 1) {
                    for (let j:number =0; j < jsonData.tables[i].indexes.length; j++) {
                        statements.push(`CREATE INDEX IF NOT EXISTS ${jsonData.tables[i].indexes[j].name} ON ${jsonData.tables[i].name} (${jsonData.tables[i].indexes[j].column});`);
                    }
                }
            }
            if(statements.length > 1) {
                statements.push("PRAGMA user_version = 1;");
                statements.push("COMMIT TRANSACTION;");
                const schemaStmt: string = statements.join('\n');
                const changes = await this.exec(schemaStmt); 
                if (changes === -1) success = false; 
            }
            if(success) {
                // Create the table's data
                let statements: Array<string> = [];
                statements.push("BEGIN TRANSACTION;");
                for (let i:number = 0; i < jsonData.tables.length; i++) {
                    if(jsonData.tables[i].values && jsonData.tables[i].values.length >= 1) {
                        // Check if the table exists
                        const tableExists = await this.isTable(jsonData.tables[i].name);
                        if(!tableExists) {
                            console.log(`Error: Table ${jsonData.tables[i].name} does not exist`);
                            success = false;
                            break;
                        } else {
                        // Get the column names and types
                            const tableNamesTypes: any = await this.getTableColumnNamesTypes(jsonData.tables[i].name);
                            const tableColumnTypes: Array<string> = tableNamesTypes.types;
                            const tableColumnNames: Array<string> = tableNamesTypes.names;
                            if(tableColumnTypes.length === 0) {
                                console.log(`Error: Table ${jsonData.tables[i].name} info does not exist`);
                                success = false;
                                break;
                            } else {
                                // Loop on Table Values
                                for (let j:number =0; j < jsonData.tables[i].values.length; j++) {
                                    // Check the row number of columns
                                    if(jsonData.tables[i].values[j].length != tableColumnTypes.length) {
                                        console.log(`Error: Table ${jsonData.tables[i].name} values row ${j} not correct length`);
                                        success = false;
                                        break;    
                                    }
                                    // Check the column's type before proceeding
                                    const isColumnTypes: boolean = await this.checkColumnTypes(tableColumnTypes,jsonData.tables[i].values[j]);
                                    if(!isColumnTypes) {
                                        console.log(`Error: Table ${jsonData.tables[i].name} values row ${j} not correct types`);
                                        success = false;
                                        break;    
                                    }
                                    if(jsonData.mode === 'full' || (jsonData.mode === 'partial' 
                                    && !(await this.isIdExists(jsonData.tables[i].name,tableColumnNames[0],jsonData.tables[i].values[j][0]))) ) {
                                        const valueString: string = await this.valuesToString(tableColumnTypes,jsonData.tables[i].values[j]);
                                        if(valueString.length === 0) {
                                            console.log(`Error: Table ${jsonData.tables[i].name} values row ${j} not convert to string`);
                                            success = false;
                                            break;    
                                        }
                                        statements.push(`INSERT INTO ${jsonData.tables[i].name} (${tableColumnNames.toString()}) VALUES (${valueString});`);
                                    } else {
                                        // update
                                        const setString: string = await this.setToString(tableColumnTypes,tableColumnNames,jsonData.tables[i].values[j]);
                                        statements.push(`UPDATE ${jsonData.tables[i].name} SET ${setString} WHERE ${tableColumnNames[0]} = ${jsonData.tables[i].values[j][0]};`);
                                    }
                                }
                            }
                        }
                    } else {
                        success = false;
                    }
                }
                if(success && statements.length > 1) {
                    statements.push("COMMIT TRANSACTION;");
                    const dataStmt: string = statements.join('\n');
                    const changes = await this.exec(dataStmt);
                    if(changes === -1) success = false;
                }
            } 
            if(!success) {
                resolve(-1); 
            } else {
                resolve(1);
            }
        });
    }
    private isTable(tableName:string) : Promise<boolean> {
        return new Promise (async (resolve) => {
            // Check if the table exists
            let ret: boolean = false;
            const query: string = `SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}';`;
            const resQuery:Array<any> = await this.query(query,[]);
            if(resQuery.length > 0) ret = true;
            resolve(ret);
        });
    }
    private getTableColumnNamesTypes(tableName:string): Promise<any> {
        return new Promise(async (resolve) => {
            let retTypes: Array<string> = [];
            let retNames: Array<string> = [];
            const query = `PRAGMA table_info(${tableName});`;
            const resQuery:Array<any> = await this.query(query,[]);
            if (resQuery.length > 0) {
                for(let i:number = 0; i<resQuery.length; i++) {
                    retNames.push(resQuery[i].name);
                    retTypes.push(resQuery[i].type);
                }
            }
            resolve({names:retNames,types:retTypes});
        });
    }
    private valuesToString(tableTypes:Array<any>,rowValues:Array<any>) : Promise<string> {
        return new Promise(async (resolve) => {
            let retString: string = "";
            for (let i:number = 0; i < rowValues.length; i++) {
                    if(tableTypes[i] === "TEXT") {
                        retString += `"${rowValues[i]}",`;
                    } else {
                        retString += `${rowValues[i]},`;
                    }
            }
            if(retString.length > 1 )retString = retString.slice(0, -1);
            resolve(retString);
        });
    }

    private checkColumnTypes(tableTypes:Array<any>,rowValues:Array<any>) : Promise<boolean> {
        return new Promise(async (resolve) => {
            let isType: boolean = true;
            for (let i:number = 0; i < rowValues.length; i++) {
                isType = await this.isType(tableTypes[i],rowValues[i]);
                if(!isType) break;
            }
            resolve(isType);
        });
    }
    private isType(type:string, value: any): Promise<boolean> {
        return new Promise((resolve) => {
            let ret: boolean = false;
            if(type === "NULL" && typeof value === 'object') ret = true;
            if(type === "TEXT" && typeof value === 'string') ret = true;
            if(type === "INTEGER" && typeof value === 'number') ret = true;
            if(type === "REAL" && typeof value === 'number') ret = true;
            if(type === "BLOB" && typeof value === 'object') ret = true;
            resolve(ret);
        });
    }
    private isIdExists(dbName:string,firstColumnName:string,key:any): Promise<boolean> {
        return new Promise(async (resolve) => {
            let ret: boolean = false;
            const query:string = `SELECT ${firstColumnName} FROM ${dbName} WHERE ${firstColumnName} = ${key};`;
            const resQuery:Array<any> = await this.query(query,[]);
            if (resQuery.length === 1) ret = true;
            resolve(ret);
        });
    }
    private setToString(tableTypes:Array<any>, names:Array<string>, values:Array<any>): Promise<string> {
        return new Promise(async (resolve) => {
            let retString: string = "";
            for (let i:number = 0; i < names.length; i++) {
                if(tableTypes[i] === "TEXT") {
                    retString += `${names[i]} = "${values[i]}",`;
                } else {
                    retString += `${names[i]} = ${values[i]},`;
                }
            }
            if(retString.length > 1 )retString = retString.slice(0, -1);
            resolve(retString);
        });
    }
}
