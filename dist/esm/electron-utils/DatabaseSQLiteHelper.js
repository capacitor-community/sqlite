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
import { isJsonSQLite, isTable } from './JsonUtils';
const fs = window['fs'];
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
        const db = this._utils.connection(this._databaseName, false /*,this._secret*/);
        if (db !== null) {
            this.isOpen = true;
            db.close();
        }
        else {
            this.isOpen = false;
            console.log("openDB: Error Database connection failed");
        }
    }
    createSyncTable() {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            let retRes = { changes: -1 };
            const db = this._utils.connection(this._databaseName, false /*,this._secret*/);
            if (db === null) {
                this.isOpen = false;
                console.log("exec: Error Database connection failed");
                resolve(retRes);
            }
            // check if the table has already been created
            const isExists = yield this.isTableExists(db, 'sync_table');
            if (!isExists) {
                const date = Math.round((new Date()).getTime() / 1000);
                const stmts = `
                BEGIN TRANSACTION;
                CREATE TABLE IF NOT EXISTS sync_table (
                    id INTEGER PRIMARY KEY NOT NULL,
                    sync_date INTEGER
                    );
                INSERT INTO sync_table (sync_date) VALUES ("${date}");
                COMMIT TRANSACTION;
                `;
                retRes = yield this.execute(db, stmts);
            }
            db.close();
            resolve(retRes);
        }));
    }
    setSyncDate(syncDate) {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            let ret = false;
            const db = this._utils.connection(this._databaseName, false /*,this._secret*/);
            if (db === null) {
                this.isOpen = false;
                console.log("exec: Error Database connection failed");
                resolve(ret);
            }
            const sDate = Math.round((new Date(syncDate)).getTime() / 1000);
            const stmt = `UPDATE sync_table SET sync_date = ${sDate} WHERE id = 1;`;
            const retRes = yield this.execute(db, stmt);
            if (retRes.changes != -1)
                ret = true;
            db.close();
            resolve(ret);
        }));
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
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            let retRes = { changes: -1 };
            const db = this._utils.connection(this._databaseName, false /*,this._secret*/);
            if (db === null) {
                this.isOpen = false;
                console.log("exec: Error Database connection failed");
                resolve(retRes);
            }
            retRes = yield this.execute(db, statements);
            db.close();
            resolve(retRes);
        }));
    }
    execute(db, statements) {
        return new Promise((resolve) => {
            let retRes = { changes: -1 };
            db.serialize(() => {
                db.exec(statements, (err) => __awaiter(this, void 0, void 0, function* () {
                    if (err) {
                        console.log(`exec: Error Execute command failed : ${err.message}`);
                        resolve(retRes);
                    }
                    else {
                        const changes = yield this.dbChanges(db);
                        retRes = { changes: changes };
                        resolve(retRes);
                    }
                }));
            });
        });
    }
    run(statement, values) {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            let lastId = -1;
            let retRes = { changes: -1, lastId: lastId };
            const db = this._utils.connection(this._databaseName, false /*,this._secret*/);
            if (db === null) {
                this.isOpen = false;
                console.log("run: Error Database connection failed");
                resolve(retRes);
            }
            let retB = yield this.beginTransaction(db);
            if (!retB) {
                db.close();
                resolve(retRes);
            }
            lastId = yield this.prepare(db, statement, values);
            if (lastId === -1) {
                console.log("run: Error return lastId= -1");
                db.close();
                resolve(retRes);
            }
            retB = yield this.endTransaction(db);
            if (!retB) {
                db.close();
                resolve(retRes);
            }
            const changes = yield this.dbChanges(db);
            retRes.changes = changes;
            retRes.lastId = lastId;
            db.close();
            resolve(retRes);
        }));
    }
    prepare(db, statement, values) {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            let retRes = -1;
            if (values && values.length >= 1) {
                db.serialize(() => {
                    const stmt = db.prepare(statement);
                    stmt.run(values, (err) => __awaiter(this, void 0, void 0, function* () {
                        if (err) {
                            console.log(`prepare: Error Prepare command failed : ${err.message}`);
                            resolve(retRes);
                        }
                        else {
                            const lastId = yield this.getLastId(db);
                            if (lastId != -1)
                                retRes = lastId;
                            stmt.finalize();
                            resolve(retRes);
                        }
                    }));
                });
            }
            else {
                db.serialize(() => {
                    db.run(statement, (err) => __awaiter(this, void 0, void 0, function* () {
                        if (err) {
                            console.log(`prepare: Error Prepare command failed : ${err.message}`);
                            resolve(retRes);
                        }
                        else {
                            const lastId = yield this.getLastId(db);
                            if (lastId != -1)
                                retRes = lastId;
                            resolve(retRes);
                        }
                    }));
                });
            }
        }));
    }
    query(statement, values) {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            const db = this._utils.connection(this._databaseName, true /*,this._secret*/);
            if (db === null) {
                this.isOpen = false;
                console.log("query: Error Database connection failed");
                resolve(null);
            }
            const retRows = yield this.select(db, statement, values);
            db.close();
            resolve(retRows);
        }));
    }
    select(db, statement, values) {
        return new Promise((resolve) => {
            let retRows = null;
            if (values && values.length >= 1) {
                db.serialize(() => {
                    db.all(statement, values, (err, rows) => {
                        if (err) {
                            console.log(`select: Error Query command failed : ${err.message}`);
                            resolve(retRows);
                        }
                        else {
                            retRows = rows;
                            resolve(retRows);
                        }
                    });
                });
            }
            else {
                db.serialize(() => {
                    db.all(statement, (err, rows) => {
                        if (err) {
                            console.log(`select: Error Query command failed : ${err.message}`);
                            resolve(retRows);
                        }
                        else {
                            retRows = rows;
                            resolve(retRows);
                        }
                    });
                });
            }
        });
    }
    deleteDB(dbName) {
        return new Promise((resolve) => {
            let ret = false;
            const dbPath = this._utils.getDBPath(dbName);
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
            let changes = -1;
            // create the database schema
            changes = yield this.createDatabaseSchema(jsonData);
            if (changes != -1) {
                // create the tables data
                changes = yield this.createTableData(jsonData);
            }
            resolve({ changes: changes });
        }));
    }
    exportJson(mode) {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            let retJson = {};
            let success = false;
            retJson.database = this._databaseName.slice(0, -9);
            retJson.encrypted = false;
            retJson.mode = mode;
            success = yield this.createJsonTables(retJson);
            if (success) {
                const isValid = isJsonSQLite(retJson);
                if (isValid) {
                    resolve(retJson);
                }
                else {
                    resolve({});
                }
            }
            else {
                resolve({});
            }
        }));
    }
    createDatabaseSchema(jsonData) {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            let changes = -1;
            // set PRAGMA
            let pragmas = `
            PRAGMA user_version = 1;
            PRAGMA foreign_keys = ON;            
            `;
            const pchanges = yield this.exec(pragmas);
            console.log('*** pchanges ', pchanges);
            if (pchanges === -1)
                resolve(-1);
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
                            if (jsonData.tables[i].schema[j].column) {
                                statements.push(`${jsonData.tables[i].schema[j].column} ${jsonData.tables[i].schema[j].value}`);
                            }
                            else if (jsonData.tables[i].schema[j].foreignkey) {
                                statements.push(`FOREIGN KEY (${jsonData.tables[i].schema[j].foreignkey}) ${jsonData.tables[i].schema[j].value}`);
                            }
                        }
                        else {
                            if (jsonData.tables[i].schema[j].column) {
                                statements.push(`${jsonData.tables[i].schema[j].column} ${jsonData.tables[i].schema[j].value},`);
                            }
                            else if (jsonData.tables[i].schema[j].foreignkey) {
                                statements.push(`FOREIGN KEY (${jsonData.tables[i].schema[j].foreignkey}) ${jsonData.tables[i].schema[j].value},`);
                            }
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
                statements.push("COMMIT TRANSACTION;");
                console.log('**statements ', statements);
                const schemaStmt = statements.join('\n');
                console.log('schemaStmt ', schemaStmt);
                changes = yield this.exec(schemaStmt);
            }
            console.log('in createDatabaseSchema changes ', changes);
            resolve(changes);
        }));
    }
    createTableData(jsonData) {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            let success = true;
            let changes = -1;
            const db = this._utils.connection(this._databaseName, false /*,this._secret*/);
            if (db === null) {
                this.isOpen = false;
                console.log("createTableData: Error Database connection failed");
                resolve(changes);
            }
            let retB = yield this.beginTransaction(db);
            if (!retB) {
                db.close();
                resolve(changes);
            }
            // Create the table's data
            for (let i = 0; i < jsonData.tables.length; i++) {
                if (jsonData.tables[i].values && jsonData.tables[i].values.length >= 1) {
                    // Check if the table exists
                    const tableExists = yield this.isTableExists(db, jsonData.tables[i].name);
                    if (!tableExists) {
                        console.log(`Error: Table ${jsonData.tables[i].name} does not exist`);
                        success = false;
                        break;
                    }
                    else {
                        // Get the column names and types
                        const tableNamesTypes = yield this.getTableColumnNamesTypes(db, jsonData.tables[i].name);
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
                                const retisIdExists = yield this.isIdExists(db, jsonData.tables[i].name, tableColumnNames[0], jsonData.tables[i].values[j][0]);
                                let stmt;
                                if (jsonData.mode === 'full' || (jsonData.mode === 'partial'
                                    && !retisIdExists)) {
                                    // Insert
                                    const nameString = tableColumnNames.join();
                                    const questionMarkString = yield this.createQuestionMarkString(tableColumnNames.length);
                                    stmt = `INSERT INTO ${jsonData.tables[i].name} (${nameString}) VALUES (`;
                                    stmt += `${questionMarkString});`;
                                }
                                else {
                                    // Update
                                    const setString = yield this.setNameForUpdate(tableColumnNames);
                                    if (setString.length === 0) {
                                        console.log(`Error: Table ${jsonData.tables[i].name} values row ${j} not set to String`);
                                        success = false;
                                        break;
                                    }
                                    stmt = `UPDATE ${jsonData.tables[i].name} SET ${setString} WHERE `;
                                    stmt += `${tableColumnNames[0]} = ${jsonData.tables[i].values[j][0]};`;
                                }
                                const lastId = yield this.prepare(db, stmt, jsonData.tables[i].values[j]);
                                if (lastId === -1) {
                                    console.log("run: Error return lastId= -1");
                                    success = false;
                                    break;
                                }
                            }
                        }
                    }
                }
                else {
                    success = false;
                }
            }
            if (success) {
                retB = yield this.endTransaction(db);
                if (!retB) {
                    db.close();
                    console.log('in createTableData not retB changes ', changes);
                    resolve(changes);
                }
                changes = yield this.dbChanges(db);
            }
            db.close();
            console.log('in createTableData changes ', changes);
            resolve(changes);
        }));
    }
    isTableExists(db, tableName) {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            // Check if the table exists
            let ret = false;
            const query = `SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}';`;
            const resQuery = yield this.select(db, query, []);
            if (resQuery.length > 0)
                ret = true;
            resolve(ret);
        }));
    }
    getTableColumnNamesTypes(db, tableName) {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            let retTypes = [];
            let retNames = [];
            const query = `PRAGMA table_info(${tableName});`;
            const resQuery = yield this.select(db, query, []);
            if (resQuery.length > 0) {
                for (let i = 0; i < resQuery.length; i++) {
                    retNames.push(resQuery[i].name);
                    retTypes.push(resQuery[i].type);
                }
            }
            resolve({ names: retNames, types: retTypes });
        }));
    }
    createQuestionMarkString(length) {
        return new Promise((resolve) => {
            var retString = "";
            for (let i = 0; i < length; i++) {
                retString += "?,";
            }
            if (retString.length > 1)
                retString = retString.slice(0, -1);
            resolve(retString);
        });
    }
    setNameForUpdate(names) {
        return new Promise((resolve) => {
            var retString = "";
            for (let i = 0; i < names.length; i++) {
                retString += `${names[i]} = ? ,`;
            }
            if (retString.length > 1)
                retString = retString.slice(0, -1);
            resolve(retString);
        });
    }
    checkColumnTypes(tableTypes, rowValues) {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            let isType = true;
            for (let i = 0; i < rowValues.length; i++) {
                if (rowValues[i].toString().toUpperCase() != "NULL") {
                    isType = yield this.isType(tableTypes[i], rowValues[i]);
                    if (!isType)
                        break;
                }
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
            if (type === "BLOB" && typeof value === 'string')
                ret = true;
            resolve(ret);
        });
    }
    isIdExists(db, dbName, firstColumnName, key) {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            let ret = false;
            const query = `SELECT ${firstColumnName} FROM ${dbName} WHERE ${firstColumnName} = ${key};`;
            const resQuery = yield this.select(db, query, []);
            if (resQuery.length === 1)
                ret = true;
            resolve(ret);
        }));
    }
    dbChanges(db) {
        return new Promise((resolve) => {
            const SELECT_CHANGE = "SELECT total_changes()";
            let ret = -1;
            db.get(SELECT_CHANGE, (err, row) => {
                // process the row here 
                if (err) {
                    console.log(`"Error: dbChanges failed: " : ${err.message}`);
                    resolve(ret);
                }
                else {
                    const key = Object.keys(row)[0];
                    const changes = row[key];
                    resolve(changes);
                }
            });
        });
    }
    getLastId(db) {
        return new Promise((resolve) => {
            const SELECT_LAST_ID = "SELECT last_insert_rowid()";
            let ret = -1;
            db.get(SELECT_LAST_ID, (err, row) => {
                // process the row here 
                if (err) {
                    console.log(`"Error: getLastId failed: " : ${err.message}`);
                    resolve(ret);
                }
                else {
                    const key = Object.keys(row)[0];
                    const lastId = row[key];
                    resolve(lastId);
                }
            });
        });
    }
    beginTransaction(db) {
        return new Promise((resolve) => {
            const stmt = "BEGIN TRANSACTION";
            db.exec(stmt, (err) => {
                if (err) {
                    console.log(`exec: Error Begin Transaction failed : ${err.message}`);
                    resolve(false);
                }
                else {
                    resolve(true);
                }
            });
        });
    }
    endTransaction(db) {
        return new Promise((resolve) => {
            const stmt = "COMMIT TRANSACTION";
            db.exec(stmt, (err) => {
                if (err) {
                    console.log(`exec: Error End Transaction failed : ${err.message}`);
                    resolve(false);
                }
                else {
                    resolve(true);
                }
            });
        });
    }
    createJsonTables(retJson) {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            let success = true;
            const databaseName = `${retJson.database}SQLite.db`;
            const db = this._utils.connection(databaseName, false /*,this._secret*/);
            if (db === null) {
                this.isOpen = false;
                console.log("createJsonTables: Error Database connection failed");
                resolve(false);
            }
            // get the table's names
            let stmt = "SELECT name,sql FROM sqlite_master WHERE type = 'table' ";
            stmt += "AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'sync_table';";
            let tables = yield this.select(db, stmt, []);
            if (tables.length === 0) {
                console.log("createJsonTables: Error get table's names failed");
                resolve(false);
            }
            let modTables = {};
            let syncDate;
            if (retJson.mode === "partial") {
                syncDate = yield this.getSyncDate(db);
                if (syncDate != -1) {
                    // take the tables which have been modified or created since last sync
                    modTables = yield this.getTableModified(db, tables, syncDate);
                }
                else {
                    console.log("createJsonTables: Error did not find a sync_date");
                    resolve(false);
                }
            }
            let jsonTables = [];
            for (let i = 0; i < tables.length; i++) {
                if (retJson.mode === "partial" && (Object.keys(modTables).length === 0 ||
                    Object.keys(modTables).indexOf(tables[i].name) === -1 ||
                    modTables[tables[i].name] == "No")) {
                    continue;
                }
                let table = {};
                let isSchema = false;
                let isIndexes = false;
                let isValues = false;
                table.name = tables[i].name;
                if (retJson.mode === "full" ||
                    (retJson.mode === "partial" && modTables[table.name] === "Create")) {
                    // create the schema
                    let schema = [];
                    // take the substring between parenthesis
                    let openPar = tables[i].sql.indexOf("(");
                    let closePar = tables[i].sql.lastIndexOf(")");
                    let sstr = tables[i].sql.substring(openPar + 1, closePar);
                    let sch = sstr.replace(/\n/g, "").split(",");
                    for (let j = 0; j < sch.length; j++) {
                        const rstr = sch[j].trim();
                        let idx = rstr.indexOf(" ");
                        //find the index of the first 
                        let row = [rstr.slice(0, idx), rstr.slice(idx + 1)];
                        if (row.length != 2)
                            resolve(false);
                        console.log('** row[0] ', row[0]);
                        if (row[0].toUpperCase() != "FOREIGN") {
                            schema.push({ column: row[0], value: row[1] });
                        }
                        else {
                            const oPar = rstr.indexOf("(");
                            const cPar = rstr.indexOf(")");
                            row = [rstr.slice(oPar + 1, cPar), rstr.slice(cPar + 2)];
                            console.log('** Foreign row[0] ', row[0]);
                            if (row.length != 2)
                                resolve(false);
                            schema.push({ foreignkey: row[0], value: row[1] });
                        }
                    }
                    table.schema = schema;
                    isSchema = true;
                    // create the indexes
                    stmt = "SELECT name,tbl_name FROM sqlite_master WHERE ";
                    stmt += `type = 'index' AND tbl_name = '${table.name}' AND sql NOTNULL;`;
                    const retIndexes = yield this.select(db, stmt, []);
                    if (retIndexes.length > 0) {
                        let indexes = [];
                        for (let j = 0; j < retIndexes.length; j++) {
                            indexes.push({ name: retIndexes[j]["tbl_name"],
                                column: retIndexes[j]["name"] });
                        }
                        table.indexes = indexes;
                        isIndexes = true;
                    }
                }
                const tableNamesTypes = yield this.getTableColumnNamesTypes(db, table.name);
                const rowNames = tableNamesTypes.names;
                // create the data
                if (retJson.mode === "full" ||
                    (retJson.mode === "partial" && modTables[table.name] === "Create")) {
                    stmt = `SELECT * FROM ${table.name};`;
                }
                else {
                    stmt = `SELECT * FROM ${table.name} WHERE last_modified > ${syncDate};`;
                }
                const retValues = yield this.select(db, stmt, []);
                let values = [];
                for (let j = 0; j < retValues.length; j++) {
                    let row = [];
                    for (let k = 0; k < rowNames.length; k++) {
                        if (retValues[j][rowNames[k]] != null) {
                            row.push(retValues[j][rowNames[k]]);
                        }
                        else {
                            row.push("NULL");
                        }
                    }
                    values.push(row);
                }
                table.values = values;
                isValues = true;
                if (Object.keys(table).length < 1 || !isTable(table) ||
                    (!isSchema && !isIndexes && !isValues)) {
                    console.log('createJsonTables: Error table is not a jsonTable');
                    success = false;
                    break;
                }
                jsonTables.push(table);
            }
            if (!success) {
                retJson = {};
            }
            else {
                retJson.tables = jsonTables;
            }
            resolve(success);
        }));
    }
    getTableModified(db, tables, syncDate) {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            let retModified = {};
            for (let i = 0; i < tables.length; i++) {
                let mode;
                // get total count of the table
                let stmt = `SELECT count(*) FROM ${tables[i].name};`;
                let retQuery = yield this.select(db, stmt, []);
                if (retQuery.length != 1)
                    break;
                const totalCount = retQuery[0]["count(*)"];
                // get total count of modified since last sync
                stmt = `SELECT count(*) FROM ${tables[i].name} WHERE last_modified > ${syncDate};`;
                retQuery = yield this.select(db, stmt, []);
                if (retQuery.length != 1)
                    break;
                const totalModifiedCount = retQuery[0]["count(*)"];
                if (totalModifiedCount === 0) {
                    mode = "No";
                }
                else if (totalCount === totalModifiedCount) {
                    mode = "Create";
                }
                else {
                    mode = "Modified";
                }
                const key = tables[i].name;
                retModified[key] = mode;
                if (i === tables.length - 1)
                    resolve(retModified);
            }
            resolve(retModified);
        }));
    }
    getSyncDate(db) {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            let ret = -1;
            // get the last sync date
            let stmt = `SELECT sync_date FROM sync_table;`;
            let retQuery = yield this.select(db, stmt, []);
            if (retQuery.length === 1) {
                const syncDate = retQuery[0]["sync_date"];
                if (syncDate > 0)
                    ret = syncDate;
            }
            resolve(ret);
        }));
    }
}
//# sourceMappingURL=DatabaseSQLiteHelper.js.map