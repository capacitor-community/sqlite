import { UtilsSQLite } from './UtilsSQLite';

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

}
