import { UtilsSQLite } from './UtilsSQLite';
import { JsonSQLite,JsonTable,JsonIndex,JsonColumn,isJsonSQLite,isTable } from './JsonUtils';

const fs: any = window['fs' as any];

export class DatabaseSQLiteHelper {
    public isOpen: boolean = false;
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

        const db = this._utils.connection(this._databaseName,false/*,this._secret*/);
        if(db != null) {
            this.isOpen = true;
            db.close();
        } else {
            this.isOpen = false;
            console.log("openDB: Error Database connection failed");
        }
    }
    public createSyncTable(): Promise<any> {
        return new Promise( async  (resolve) => {
            let retRes = {changes:-1};
            const db = this._utils.connection(this._databaseName,false/*,this._secret*/);
            if (db === null) {
                this.isOpen = false;
                console.log("exec: Error Database connection failed");
                resolve(retRes);
            }
            // check if the table has already been created
            const isExists = await this.isTableExists(db,'sync_table');
            if( !isExists ) {

                const date: number = Math.round((new Date()).getTime()/1000);            
                const stmts = `
                BEGIN TRANSACTION;
                CREATE TABLE IF NOT EXISTS sync_table (
                    id INTEGER PRIMARY KEY NOT NULL,
                    sync_date INTEGER
                    );
                INSERT INTO sync_table (sync_date) VALUES ("${date}");
                COMMIT TRANSACTION;
                `;
                retRes = await this.execute(db,stmts);
            }
            db.close();
            resolve(retRes);
        });
    }
    public setSyncDate(syncDate:string) : Promise<boolean> {
        return new Promise( async  (resolve) => {
            let ret: boolean = false;
            const db = this._utils.connection(this._databaseName,false/*,this._secret*/);
            if (db === null) {
                this.isOpen = false;
                console.log("exec: Error Database connection failed");
                resolve(ret);
            }
            const sDate: number = Math.round((new Date(syncDate)).getTime()/1000);
            const stmt: string = `UPDATE sync_table SET sync_date = ${sDate} WHERE id = 1;`;
            const retRes = await this.execute(db,stmt);
            if (retRes.changes != -1) ret = true;
            db.close();
            resolve(ret);
        });
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
    public exec(statements:string): Promise<any> {
        return new Promise( async (resolve) => {
            let retRes = {changes:-1};
            const db = this._utils.connection(this._databaseName,false/*,this._secret*/);
            if (db === null) {
                this.isOpen = false;
                console.log("exec: Error Database connection failed");
                resolve(retRes);
            }
            retRes = await this.execute(db,statements);
            db.close();
            resolve(retRes);
        });
    }
    private execute(db:any,statements:string): Promise<any> {
        return new Promise(  (resolve) => {
            let retRes = {changes:-1};
            db.serialize(() => {
                db.exec(statements,async (err:Error) => {
                    if(err) {
                        console.log(`exec: Error Execute command failed : ${err.message}`);
                        resolve(retRes);
                    } else {
                        const changes:number =  await this.dbChanges(db);
                        retRes = {changes:changes};
                        resolve(retRes);
                    }
                });
            });
        });
    }
    public run(statement:string,values: Array<any>): Promise<any> {
        return new Promise(  async (resolve) => {
            let lastId: number = -1;
            let retRes: any = {changes:-1,lastId:lastId};
            const db = this._utils.connection(this._databaseName,false/*,this._secret*/);
            if (db === null) {
                this.isOpen = false;
                console.log("run: Error Database connection failed");
                resolve(retRes);
            }
            let retB: boolean = await this.beginTransaction(db);
            if(!retB) {
                db.close();
                resolve(retRes);
            }
            lastId = await this.prepare(db,statement,values);
            if(lastId === -1) {
                console.log("run: Error return lastId= -1");
                db.close();
                resolve(retRes);
            }
            retB = await this.endTransaction(db);
            if(!retB) {
                db.close();
                resolve(retRes);
            }
            const changes = await this.dbChanges(db);
            retRes.changes = changes;
            retRes.lastId = lastId;
            db.close();
            resolve(retRes);
        });
    }    
    private prepare(db:any, statement:string,values: Array<any>): Promise<number> {
        return new Promise(  async (resolve) => {
            let retRes: number = -1;

            if(values && values.length >= 1) {
                db.serialize(() => {
                    const stmt = db.prepare(statement);
                    stmt.run(values,async (err:Error)=> {
                        if(err) {
                            console.log(`prepare: Error Prepare command failed : ${err.message}`);
                            resolve(retRes);    
                        } else {
                            const lastId:number =  await this.getLastId(db);
                            if(lastId != -1) retRes = lastId;
                            stmt.finalize();
                            resolve(retRes);    
                        }
                    });
                });
            } else {
                db.serialize(() => {
                    db.run(statement,async (err:Error)=> {
                        if(err) {
                            console.log(`prepare: Error Prepare command failed : ${err.message}`);
                            resolve(retRes)
                        } else {
                            const lastId:number =  await this.getLastId(db);
                            if(lastId != -1) retRes = lastId;
                            resolve(retRes)
                        }
                    });
                });
            }
        });
    }
    public query(statement:string,values: Array<any>): Promise<Array<any>> {
        return new Promise( async  (resolve) => {
            const db = this._utils.connection(this._databaseName,true/*,this._secret*/);
            if (db === null) {
                this.isOpen = false;
                console.log("query: Error Database connection failed");
                resolve(null);
            }
            const retRows: Array<any> = await this.select(db,statement,values);
            db.close();
            resolve(retRows);
        });
    }

    private select(db: any,statement:string,values: Array<any>): Promise<Array<any>> {
        return new Promise(  (resolve) => {
            let retRows: Array<any> = null;
            if(values && values.length >= 1) {
                db.serialize(() => {
                    db.all(statement,values,(err:Error,rows:Array<any>)=> {
                        if(err) {
                            console.log(`select: Error Query command failed : ${err.message}`);
                            resolve(retRows)
                        } else {
                            retRows = rows;
                            resolve(retRows)
                        }
                    });
                });
            } else {
                db.serialize(() => {
                    db.all(statement,(err:Error,rows:Array<any>)=> {
                        if(err) {
                            console.log(`select: Error Query command failed : ${err.message}`);
                            resolve(retRows)
                        } else {
                            retRows = rows;
                            resolve(retRows)
                        }
                    });
                });
            } 
        });
    }
    public deleteDB(dbName:string): Promise<boolean> {
        return new Promise( (resolve) => {
            let ret: boolean = false;
            const dbPath = this._utils.getDBPath(dbName);
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

    public importJson(jsonData:JsonSQLite): Promise<any> {
        return new Promise( async (resolve) => {
            let changes:number = -1;
            // create the database schema
            changes = await this.createDatabaseSchema(jsonData);
            if (changes != -1) {
                // create the tables data
                changes = await this.createTableData(jsonData);
            }
            resolve({changes: changes});
        });
    }
    public exportJson(mode: string): Promise<any> {
        return new Promise( async (resolve) => {
            let retJson: JsonSQLite = {} as JsonSQLite;
            let success: boolean = false;
            retJson.database = this._databaseName.slice(0,-9);
            retJson.encrypted = false;
            retJson.mode = mode;
            success = await this.createJsonTables(retJson);
            if(success) {
                const isValid = isJsonSQLite(retJson);
                if(isValid) {
                    resolve(retJson);
                } else {
                    resolve({});
                }
            } else {
                resolve({});
            }
        });
    }

    private createDatabaseSchema(jsonData: JsonSQLite): Promise<number> {
        return new Promise( async (resolve) => {
            let changes: number = -1;
            // set PRAGMA
            let pragmas: string = `
            PRAGMA user_version = 1;
            PRAGMA foreign_keys = ON;            
            `
            const pchanges: number = await this.exec(pragmas);

            if(pchanges === -1) resolve(-1);
            // create the database schema
            let statements: Array<string> = [];
            statements.push("BEGIN TRANSACTION;");
            for (let i:number = 0; i < jsonData.tables.length; i++) {
                if(jsonData.tables[i].schema && jsonData.tables[i].schema.length >= 1) {
                    if(jsonData.mode === 'full') statements.push(`DROP TABLE IF EXISTS ${jsonData.tables[i].name};`);
                    statements.push(`CREATE TABLE IF NOT EXISTS ${jsonData.tables[i].name} (`);
                    for (let j:number =0; j < jsonData.tables[i].schema.length; j++) {
                        if(j === jsonData.tables[i].schema.length - 1) {
                            if(jsonData.tables[i].schema[j].column) {
                            statements.push(`${jsonData.tables[i].schema[j].column} ${jsonData.tables[i].schema[j].value}`);
                            } else if(jsonData.tables[i].schema[j].foreignkey) {
                                statements.push(`FOREIGN KEY (${jsonData.tables[i].schema[j].foreignkey}) ${jsonData.tables[i].schema[j].value}`);
                            }
                        } else {
                            if(jsonData.tables[i].schema[j].column) {
                                statements.push(`${jsonData.tables[i].schema[j].column} ${jsonData.tables[i].schema[j].value},`);
                            } else if(jsonData.tables[i].schema[j].foreignkey) {
                                statements.push(`FOREIGN KEY (${jsonData.tables[i].schema[j].foreignkey}) ${jsonData.tables[i].schema[j].value},`);
                            }
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
                statements.push("COMMIT TRANSACTION;");

                const schemaStmt: string = statements.join('\n');
                changes = await this.exec(schemaStmt); 
            }
            resolve(changes);
        });
    }
    private createTableData(jsonData: JsonSQLite): Promise<number> {
        return new Promise( async (resolve) => {
            let success: boolean = true;
            let changes: number = -1;
            let isValue: boolean = false;
            const db = this._utils.connection(this._databaseName,false/*,this._secret*/);
            if (db === null) {
                this.isOpen = false;
                console.log("createTableData: Error Database connection failed");
                resolve(changes);
            }
            let retB: boolean = await this.beginTransaction(db);
            if(!retB) {
                db.close();
                resolve(changes);
            }


            // Create the table's data
            for (let i:number = 0; i < jsonData.tables.length; i++) {
                if(jsonData.tables[i].values && jsonData.tables[i].values.length >= 1) {
                    // Check if the table exists
                    const tableExists = await this.isTableExists(db,jsonData.tables[i].name);
                    if(!tableExists) {
                        console.log(`Error: Table ${jsonData.tables[i].name} does not exist`);
                        success = false;
                        break;
                    } else {
                    // Get the column names and types
                        const tableNamesTypes: any = await this.getTableColumnNamesTypes(db,jsonData.tables[i].name);
                        const tableColumnTypes: Array<string> = tableNamesTypes.types;
                        const tableColumnNames: Array<string> = tableNamesTypes.names;
                        if(tableColumnTypes.length === 0) {
                            console.log(`Error: Table ${jsonData.tables[i].name} info does not exist`);
                            success = false;
                            break;
                        } else {
                            isValue = true;
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
                                const retisIdExists: boolean = await this.isIdExists(db,jsonData.tables[i].name,tableColumnNames[0],
                                                    jsonData.tables[i].values[j][0]);
                                let stmt: string;
                                if(jsonData.mode === 'full' || (jsonData.mode === 'partial' 
                                && !retisIdExists) ) {

                                    // Insert
                                    const nameString:string = tableColumnNames.join();
                                    const questionMarkString = await this.createQuestionMarkString(
                                    tableColumnNames.length);
                                    stmt = `INSERT INTO ${jsonData.tables[i].name} (${nameString}) VALUES (` 
                                    stmt += `${questionMarkString});`;
                                } else {
                                    // Update
                                    const setString: string = await this.setNameForUpdate(tableColumnNames);
                                    if(setString.length === 0) {
                                        console.log(`Error: Table ${jsonData.tables[i].name} values row ${j} not set to String`);
                                        success = false;
                                        break;    
                                    }
                                    stmt = `UPDATE ${jsonData.tables[i].name} SET ${setString} WHERE `
                                    stmt += `${tableColumnNames[0]} = ${jsonData.tables[i].values[j][0]};`;
                                }
                                const lastId: number = await this.prepare(db,stmt,jsonData.tables[i].values[j]);
                                if(lastId === -1) {
                                    console.log("run: Error return lastId= -1");
                                    success = false;
                                    break;    
                                }
                    
                            }
                        }
                    }
                } else {
                    success = false;
                }
            }


            if(success) {
                retB = await this.endTransaction(db);
                if(!retB) {
                    db.close();
                    resolve(changes);
                }
                changes = await this.dbChanges(db);
            } else {
                if(!isValue) changes = 0;
            }
            db.close();
            resolve(changes);        
        });
    }
    private isTableExists(db:any, tableName:string) : Promise<boolean> {
        return new Promise (async (resolve) => {
            // Check if the table exists
            let ret: boolean = false;
            const query: string = `SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}';`;
            const resQuery:Array<any> = await this.select(db,query,[]);
            if(resQuery.length > 0) ret = true;
            resolve(ret);
        });
    }
    private getTableColumnNamesTypes(db:any,tableName:string): Promise<any> {
        return new Promise(async (resolve) => {
            let retTypes: Array<string> = [];
            let retNames: Array<string> = [];
            const query = `PRAGMA table_info(${tableName});`;
            const resQuery:Array<any> = await this.select(db,query,[]);
            if (resQuery.length > 0) {
                for(let i:number = 0; i<resQuery.length; i++) {
                    retNames.push(resQuery[i].name);
                    retTypes.push(resQuery[i].type);
                }
            }
            resolve({names:retNames,types:retTypes});
        });
    }
    private createQuestionMarkString(length: number): Promise<string> {
        return new Promise( (resolve) => {
            var retString: string = ""
            for (let i:number =0; i<length;i++) {
                retString += "?,"
            }
            if(retString.length > 1 )retString = retString.slice(0, -1);
            resolve(retString);
        });
    }
    private setNameForUpdate(names: String[]): Promise<string> {
        return new Promise( (resolve) => {
            var retString: string = ""
            for (let i:number =0; i< names.length;i++) {
                retString += `${names[i]} = ? ,`
            }
            if(retString.length > 1 )retString = retString.slice(0, -1);
            resolve(retString);
        });
    }
    private checkColumnTypes(tableTypes:Array<any>,rowValues:Array<any>) : Promise<boolean> {
        return new Promise(async (resolve) => {
            let isType: boolean = true;
            for (let i:number = 0; i < rowValues.length; i++) {
                if(rowValues[i].toString().toUpperCase() != "NULL") {
                    isType = await this.isType(tableTypes[i],rowValues[i]);
                    if(!isType) break;
                }
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
            if(type === "BLOB" && typeof value === 'string') ret = true;
            resolve(ret);
        });
    }
    private isIdExists(db:any,dbName:string,firstColumnName:string,key:any): Promise<boolean> {
        return new Promise(async (resolve) => {
            let ret: boolean = false;
            const query:string = `SELECT ${firstColumnName} FROM ${dbName} WHERE ${firstColumnName} = ${key};`;
            const resQuery:Array<any> = await this.select(db,query,[]);
            if (resQuery.length === 1) ret = true;
            resolve(ret);
        });
    }
    private dbChanges(db: any ): Promise<number> {
        return new Promise(  (resolve) => {
            const SELECT_CHANGE: string = "SELECT total_changes()";
            let ret: number = -1;
            
            db.get(SELECT_CHANGE, (err:Error, row: any) => {
                // process the row here 
                if(err) {
                    console.log(`"Error: dbChanges failed: " : ${err.message}`);
                    resolve(ret);    
                } else {
                    const key:any = Object.keys(row)[0];
                    const changes:number = row[key];
                    resolve(changes);
                }
            }); 
        });       
    }
    private getLastId(db: any ): Promise<number> {
        return new Promise(  (resolve) => {
            const SELECT_LAST_ID: string = "SELECT last_insert_rowid()";
            let ret: number = -1;
            db.get(SELECT_LAST_ID, (err:Error, row: any) => {
                // process the row here 
                if(err) {
                    console.log(`"Error: getLastId failed: " : ${err.message}`);
                    resolve(ret);    
                } else {
                    const key:any = Object.keys(row)[0];
                    const lastId:number = row[key];
                    resolve(lastId);
                }
            }); 
        });       
    }
    private beginTransaction(db:any): Promise<boolean> {
        return new Promise(  (resolve) => {
            const stmt = "BEGIN TRANSACTION";
            db.exec(stmt,(err:Error) => {
                if(err) {
                    console.log(`exec: Error Begin Transaction failed : ${err.message}`);
                    resolve(false);    
                } else {
                    resolve(true);
                }
            });
        });
    }
    private endTransaction(db:any): Promise<boolean> {
        return new Promise(  (resolve) => {
            const stmt = "COMMIT TRANSACTION";
            db.exec(stmt,(err:Error) => {
                if(err) {
                    console.log(`exec: Error End Transaction failed : ${err.message}`);
                    resolve(false);    
                } else {
                    resolve(true);
                }
            });
        });
    }
    private createJsonTables(retJson: JsonSQLite): Promise<boolean> {
        return new Promise( async (resolve) => {
            let success:boolean = true;
            const databaseName: string = `${retJson.database}SQLite.db`;
            const db = this._utils.connection(databaseName,false/*,this._secret*/);
            if (db === null) {
                this.isOpen = false;
                console.log("createJsonTables: Error Database connection failed");
                resolve(false);
            }
            // get the table's names
            let stmt: string = "SELECT name,sql FROM sqlite_master WHERE type = 'table' ";
            stmt += "AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'sync_table';";
            let tables: Array<any> = await this.select(db,stmt,[]);
            if( tables.length === 0 ) {
                console.log("createJsonTables: Error get table's names failed");
                resolve(false);
            }
            let modTables: any = {};
            let syncDate: number
            if(retJson.mode === "partial") {
                syncDate = await this.getSyncDate(db);
                if(syncDate != -1) {
                    // take the tables which have been modified or created since last sync
                    modTables = await this.getTableModified(db,tables,syncDate);
                } else {
                    console.log("createJsonTables: Error did not find a sync_date");
                    resolve(false);
                }
            }

            let jsonTables: Array<JsonTable> = [];
            for(let i:number = 0;i< tables.length; i++) {
                if(retJson.mode === "partial" && (Object.keys(modTables).length === 0 ||
                    Object.keys(modTables).indexOf(tables[i].name) === -1 ||
                    modTables[tables[i].name] == "No")) {
                    continue;
                }
                let table: JsonTable =  {} as JsonTable;
                let isSchema: boolean = false;
                let isIndexes: boolean = false;
                let isValues: boolean = false;
                table.name = tables[i].name;
                if(retJson.mode === "full" || 
                    (retJson.mode === "partial" && modTables[table.name] === "Create")) {

                    // create the schema
                    let schema: Array<JsonColumn> = [];
                    // take the substring between parenthesis
                
                    let openPar: number = tables[i].sql.indexOf("(");
                    let closePar: number = tables[i].sql.lastIndexOf(")");
                    let sstr: String = tables[i].sql.substring(openPar + 1,closePar);
                    let sch: Array<string> = sstr.replace(/\n/g, "").split(",");
                    for(let j:number = 0;j<sch.length;j++) {
                        const rstr = sch[j].trim();
                        let idx = rstr.indexOf(" ");
                        //find the index of the first 
                        let row: Array<string> = [rstr.slice(0, idx), rstr.slice(idx+1)];
                        if(row.length != 2) resolve(false);
                        if(row[0].toUpperCase() != "FOREIGN") {
                            schema.push({column:row[0],value:row[1]});
                        } else {
                            const oPar:number = rstr.indexOf("(");
                            const cPar:number = rstr.indexOf(")");
                            row = [rstr.slice(oPar+1,cPar),rstr.slice(cPar+2)]
                            if(row.length != 2) resolve(false);
                            schema.push({foreignkey:row[0],value:row[1]});
                        }
                    }
                    table.schema = schema;
                    isSchema = true;
                
                    // create the indexes
                    stmt = "SELECT name,tbl_name,sql FROM sqlite_master WHERE ";
                    stmt += `type = 'index' AND tbl_name = '${table.name}' AND sql NOTNULL;`;
                    const retIndexes: Array<any> = await this.select(db,stmt,[]);
                    if(retIndexes.length > 0) {
                        let indexes: Array<JsonIndex> = [];
                        for(let j:number = 0;j<retIndexes.length;j++) {
                            const keys:Array<string> = Object.keys(retIndexes[j]);
                            if(keys.length === 3) {
                                if(retIndexes[j]["tbl_name"] === table.name) {
                                    const sql: string = retIndexes[j]["sql"];
                                    const oPar: number = sql.lastIndexOf("(");
                                    const cPar: number = sql.lastIndexOf(")");        
                                    indexes.push({name:retIndexes[j]["name"],
                                    column:sql.slice(oPar+1,cPar)});
                                } else {
                                    console.log("createJsonTables: Error indexes table name doesn't match");
                                    success = false;
                                    break;      
                                }
                            } else {
                                console.log('createJsonTables: Error in creating indexes');
                                success = false;
                                break;  
                            }
                        }
                        table.indexes = indexes;
                        isIndexes = true;
                    }
                }

                const tableNamesTypes: any = await this.getTableColumnNamesTypes(db,table.name);
                const rowNames: Array<string> = tableNamesTypes.names
                // create the data
                if(retJson.mode === "full" || 
                (retJson.mode === "partial" && modTables[table.name] === "Create")) {
                    stmt = `SELECT * FROM ${table.name};`;
                } else {
                    stmt = `SELECT * FROM ${table.name} WHERE last_modified > ${syncDate};`;
                }
                const retValues: Array<any> = await this.select(db,stmt,[]);
                let values: Array<Array<any>> = [];
                for(let j:number = 0;j<retValues.length;j++) {
                    let row: Array<any> = [];
                    for( let k:number = 0; k<rowNames.length; k++) {
                        if(retValues[j][rowNames[k]] != null) {
                            row.push(retValues[j][rowNames[k]]);
                        } else {
                            row.push("NULL");                           
                        }
                    }
                    values.push(row);
                }
                table.values = values;
                isValues = true;
                if(Object.keys(table).length < 1 || !isTable(table) || 
                        (!isSchema && !isIndexes && !isValues)) {
                    console.log('createJsonTables: Error table is not a jsonTable');
                    success = false;
                    break;  
                } 
                jsonTables.push(table);
            }
            if(!success) {
                retJson = {} as JsonSQLite;
            } else {
                retJson.tables = jsonTables;
            }
            resolve(success);
        });
    }

    private getTableModified(db: any,tables: Array<any>,syncDate:number): Promise<any> {
        return new Promise( async (resolve) => {
            let retModified: any = {};
            for(let i:number = 0;i< tables.length; i++) {
                let mode: string;
                // get total count of the table
                let stmt: string = `SELECT count(*) FROM ${tables[i].name};`;
                let retQuery: Array<any> = await this.select(db,stmt,[]);
                if(retQuery.length != 1) break;
                const totalCount : number = retQuery[0]["count(*)"];
                // get total count of modified since last sync
                stmt = `SELECT count(*) FROM ${tables[i].name} WHERE last_modified > ${syncDate};`;
                retQuery = await this.select(db,stmt,[]);
                if(retQuery.length != 1) break;
                const totalModifiedCount: number = retQuery[0]["count(*)"];

                if(totalModifiedCount === 0 ) {
                    mode = "No";
                } else if (totalCount === totalModifiedCount) {
                    mode = "Create";
                } else {
                    mode = "Modified";
                }
                const key: string = tables[i].name;
                retModified[key] = mode;
                if(i === tables.length - 1) resolve(retModified);
            } 
            resolve(retModified);                   
        });
    }
    private getSyncDate(db:any): Promise<number> {
        return new Promise( async (resolve) => {
            let ret: number = -1;
            // get the last sync date
            let stmt = `SELECT sync_date FROM sync_table;`
            let retQuery: Array<any> = await this.select(db,stmt,[]);
            if(retQuery.length === 1) {
                const syncDate: number = retQuery[0]["sync_date"];
                if(syncDate > 0) ret = syncDate;
            }
            resolve(ret);
        });
    }
}
