import { UtilsSQLite } from './UtilsSQLite';
const fs = window['fs'];
const path = window['path'];
export class DatabaseSQLiteHelper {
    constructor(dbName /*, encrypted:boolean = false, mode:string = "no-encryption",
        secret:string = "",newsecret:string=""*/) {
        this.isOpen = false;
        this._utils = new UtilsSQLite();
        this._databaseName = dbName;
        //        this._encrypted = encrypted;
        //        this._mode = mode;
        //        this._secret = secret;
        //        this._newsecret = newsecret;
        this._openDB();
    }
    _openDB() {
        this._db = this._utils.connection(this._databaseName, false /*,this._secret*/);
        if (this._db !== null) {
            this.isOpen = true;
        }
        else {
            this.isOpen = false;
            console.log("openDB: Error Database connection failed");
        }
    }
    close(databaseName) {
        return new Promise((resolve) => {
            const db = this._utils.connection(databaseName, false /*,this._secret*/);
            if (db === null) {
                this.isOpen = false;
                console.log("close: Error Database connection failed");
                resolve(false);
            }
            this.isOpen = true;
            db.close((err) => {
                if (err) {
                    console.log("close: Error closing the database");
                    resolve(false);
                }
                else {
                    this.isOpen = false;
                    resolve(true);
                }
            });
        });
    }
    exec(statements) {
        return new Promise((resolve) => {
            const db = this._utils.connection(this._databaseName, false /*,this._secret*/);
            if (db === null) {
                this.isOpen = false;
                console.log("exec: Error Database connection failed");
                resolve(-1);
            }
            db.exec(statements, (err) => {
                if (err) {
                    console.log(`exec: Error Execute command failed : ${err.message}`);
                    db.close();
                    resolve(-1);
                }
                else {
                    db.close();
                    resolve(1);
                }
            });
        });
    }
    run(statement, values) {
        return new Promise((resolve) => {
            const db = this._utils.connection(this._databaseName, false /*,this._secret*/);
            if (db === null) {
                this.isOpen = false;
                console.log("run: Error Database connection failed");
                resolve(-1);
            }
            if (values && values.length >= 1) {
                db.run(statement, values, (err) => {
                    if (err) {
                        console.log(`run: Error Run command failed : ${err.message}`);
                        db.close();
                        resolve(-1);
                    }
                    else {
                        db.close();
                        resolve(1);
                    }
                });
            }
            else {
                db.run(statement, (err) => {
                    if (err) {
                        console.log(`run: Error Run command failed : ${err.message}`);
                        db.close();
                        resolve(-1);
                    }
                    else {
                        db.close();
                        resolve(1);
                    }
                });
            }
        });
    }
    query(statement, values) {
        return new Promise((resolve) => {
            const db = this._utils.connection(this._databaseName, true /*,this._secret*/);
            if (db === null) {
                this.isOpen = false;
                console.log("query: Error Database connection failed");
                resolve(null);
            }
            if (values && values.length >= 1) {
                db.all(statement, values, (err, rows) => {
                    if (err) {
                        console.log(`query: Error Query command failed : ${err.message}`);
                        db.close();
                        resolve(null);
                    }
                    else {
                        db.close();
                        resolve(rows);
                    }
                });
            }
            else {
                db.all(statement, (err, rows) => {
                    if (err) {
                        console.log(`query: Error Query command failed : ${err.message}`);
                        db.close();
                        resolve(null);
                    }
                    else {
                        db.close();
                        resolve(rows);
                    }
                });
            }
        });
    }
    deleteDB(dbName) {
        return new Promise((resolve) => {
            let ret = false;
            const dbPath = path.join(this._utils.pathDB, dbName);
            try {
                fs.unlinkSync(dbPath);
                //file removed
                ret = true;
            }
            catch (e) {
                console.log("Error: in deleteDB");
            }
            resolve(ret);
        });
    }
}
//# sourceMappingURL=DatabaseSQLiteHelper.js.map