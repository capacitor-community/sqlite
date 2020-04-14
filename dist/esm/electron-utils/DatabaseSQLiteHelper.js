var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
    importJson(jsonData) {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            let success = true;
            // create the database schema
            let statements = [];
            statements.push("BEGIN TRANSACTION;");
            for (let i = 0; i < jsonData.tables.length; i++) {
                if (jsonData.tables[i].schema && jsonData.tables[i].schema.length >= 1) {
                    if (jsonData.mode === 'full')
                        statements.push(`DROP TABLE IF EXISTS ${jsonData.tables[i].name};`);
                    statements.push(`CREATE TABLE IF NOT EXISTS ${jsonData.tables[i].name} (`);
                    for (let j = 0; j < jsonData.tables[i].schema.length; j++) {
                        if (j === jsonData.tables[i].schema.length - 1) {
                            statements.push(`${jsonData.tables[i].schema[j].column} ${jsonData.tables[i].schema[j].value}`);
                        }
                        else {
                            statements.push(`${jsonData.tables[i].schema[j].column} ${jsonData.tables[i].schema[j].value},`);
                        }
                    }
                    statements.push(");");
                }
                if (jsonData.tables[i].indexes && jsonData.tables[i].indexes.length >= 1) {
                    for (let j = 0; j < jsonData.tables[i].indexes.length; j++) {
                        statements.push(`CREATE INDEX IF NOT EXISTS ${jsonData.tables[i].indexes[j].name} ON ${jsonData.tables[i].name} (${jsonData.tables[i].indexes[j].column});`);
                    }
                }
            }
            if (statements.length > 1) {
                statements.push("PRAGMA user_version = 1;");
                statements.push("COMMIT TRANSACTION;");
                const schemaStmt = statements.join('\n');
                const changes = yield this.exec(schemaStmt);
                if (changes === -1)
                    success = false;
            }
            if (success) {
                // Create the table's data
                let statements = [];
                statements.push("BEGIN TRANSACTION;");
                for (let i = 0; i < jsonData.tables.length; i++) {
                    if (jsonData.tables[i].values && jsonData.tables[i].values.length >= 1) {
                        // Check if the table exists
                        const tableExists = yield this.isTable(jsonData.tables[i].name);
                        if (!tableExists) {
                            console.log(`Error: Table ${jsonData.tables[i].name} does not exist`);
                            success = false;
                            break;
                        }
                        else {
                            // Get the column names and types
                            const tableNamesTypes = yield this.getTableColumnNamesTypes(jsonData.tables[i].name);
                            const tableColumnTypes = tableNamesTypes.types;
                            const tableColumnNames = tableNamesTypes.names;
                            if (tableColumnTypes.length === 0) {
                                console.log(`Error: Table ${jsonData.tables[i].name} info does not exist`);
                                success = false;
                                break;
                            }
                            else {
                                // Loop on Table Values
                                for (let j = 0; j < jsonData.tables[i].values.length; j++) {
                                    // Check the row number of columns
                                    if (jsonData.tables[i].values[j].length != tableColumnTypes.length) {
                                        console.log(`Error: Table ${jsonData.tables[i].name} values row ${j} not correct length`);
                                        success = false;
                                        break;
                                    }
                                    // Check the column's type before proceeding
                                    const isColumnTypes = yield this.checkColumnTypes(tableColumnTypes, jsonData.tables[i].values[j]);
                                    if (!isColumnTypes) {
                                        console.log(`Error: Table ${jsonData.tables[i].name} values row ${j} not correct types`);
                                        success = false;
                                        break;
                                    }
                                    if (jsonData.mode === 'full' || (jsonData.mode === 'partial'
                                        && !(yield this.isIdExists(jsonData.tables[i].name, tableColumnNames[0], jsonData.tables[i].values[j][0])))) {
                                        const valueString = yield this.valuesToString(tableColumnTypes, jsonData.tables[i].values[j]);
                                        if (valueString.length === 0) {
                                            console.log(`Error: Table ${jsonData.tables[i].name} values row ${j} not convert to string`);
                                            success = false;
                                            break;
                                        }
                                        statements.push(`INSERT INTO ${jsonData.tables[i].name} (${tableColumnNames.toString()}) VALUES (${valueString});`);
                                    }
                                    else {
                                        // update
                                        const setString = yield this.setToString(tableColumnTypes, tableColumnNames, jsonData.tables[i].values[j]);
                                        statements.push(`UPDATE ${jsonData.tables[i].name} SET ${setString} WHERE ${tableColumnNames[0]} = ${jsonData.tables[i].values[j][0]};`);
                                    }
                                }
                            }
                        }
                    }
                    else {
                        success = false;
                    }
                }
                if (success && statements.length > 1) {
                    statements.push("COMMIT TRANSACTION;");
                    const dataStmt = statements.join('\n');
                    const changes = yield this.exec(dataStmt);
                    if (changes === -1)
                        success = false;
                }
            }
            if (!success) {
                resolve(-1);
            }
            else {
                resolve(1);
            }
        }));
    }
    isTable(tableName) {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            // Check if the table exists
            let ret = false;
            const query = `SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}';`;
            const resQuery = yield this.query(query, []);
            if (resQuery.length > 0)
                ret = true;
            resolve(ret);
        }));
    }
    getTableColumnNamesTypes(tableName) {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            let retTypes = [];
            let retNames = [];
            const query = `PRAGMA table_info(${tableName});`;
            const resQuery = yield this.query(query, []);
            if (resQuery.length > 0) {
                for (let i = 0; i < resQuery.length; i++) {
                    retNames.push(resQuery[i].name);
                    retTypes.push(resQuery[i].type);
                }
            }
            resolve({ names: retNames, types: retTypes });
        }));
    }
    valuesToString(tableTypes, rowValues) {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            let retString = "";
            for (let i = 0; i < rowValues.length; i++) {
                if (tableTypes[i] === "TEXT") {
                    retString += `"${rowValues[i]}",`;
                }
                else {
                    retString += `${rowValues[i]},`;
                }
            }
            if (retString.length > 1)
                retString = retString.slice(0, -1);
            resolve(retString);
        }));
    }
    checkColumnTypes(tableTypes, rowValues) {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            let isType = true;
            for (let i = 0; i < rowValues.length; i++) {
                isType = yield this.isType(tableTypes[i], rowValues[i]);
                if (!isType)
                    break;
            }
            resolve(isType);
        }));
    }
    isType(type, value) {
        return new Promise((resolve) => {
            let ret = false;
            if (type === "NULL" && typeof value === 'object')
                ret = true;
            if (type === "TEXT" && typeof value === 'string')
                ret = true;
            if (type === "INTEGER" && typeof value === 'number')
                ret = true;
            if (type === "REAL" && typeof value === 'number')
                ret = true;
            if (type === "BLOB" && typeof value === 'object')
                ret = true;
            resolve(ret);
        });
    }
    isIdExists(dbName, firstColumnName, key) {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            let ret = false;
            const query = `SELECT ${firstColumnName} FROM ${dbName} WHERE ${firstColumnName} = ${key};`;
            const resQuery = yield this.query(query, []);
            if (resQuery.length === 1)
                ret = true;
            resolve(ret);
        }));
    }
    setToString(tableTypes, names, values) {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            let retString = "";
            for (let i = 0; i < names.length; i++) {
                if (tableTypes[i] === "TEXT") {
                    retString += `${names[i]} = "${values[i]}",`;
                }
                else {
                    retString += `${names[i]} = ${values[i]},`;
                }
            }
            if (retString.length > 1)
                retString = retString.slice(0, -1);
            resolve(retString);
        }));
    }
}
//# sourceMappingURL=DatabaseSQLiteHelper.js.map