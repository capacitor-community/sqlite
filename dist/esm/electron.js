var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { WebPlugin } from '@capacitor/core';
import { DatabaseSQLiteHelper } from './electron-utils/DatabaseSQLiteHelper';
import { isJsonSQLite } from './electron-utils/JsonUtils';
import { UtilsSQLite } from './electron-utils/UtilsSQLite';
const fs = window['fs'];
const path = window['path'];
export class CapacitorSQLitePluginElectron extends WebPlugin {
    constructor() {
        super({
            name: 'CapacitorSQLite',
            platforms: ['electron']
        });
    }
    echo(options) {
        return __awaiter(this, void 0, void 0, function* () {
            return options;
        });
    }
    open(options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof options.database === 'undefined') {
                return Promise.reject({ result: false, message: "Must provide a database name" });
            }
            const dbName = options.database;
            /*
            let encrypted: boolean = options.encrypted ? options.encrypted : false;
            let inMode: string = "no-encryption";
            let secretKey: string = "";
            let newsecretKey: string = "";
            */
            this.mDb = new DatabaseSQLiteHelper(`${dbName}SQLite.db` /*,encrypted,inMode,secretKey,newsecretKey*/);
            if (!this.mDb.isOpen) {
                return Promise.reject({ result: false, message: "Open command failed: Database \(dbName)SQLite.db not opened" });
            }
            return Promise.resolve({ result: true });
        });
    }
    close(options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof options.database === 'undefined') {
                return Promise.reject({ result: false, message: "Close command failed: Must provide a database name" });
            }
            const dbName = options.database;
            const ret = yield this.mDb.close(`${dbName}SQLite.db`);
            if (!ret) {
                return Promise.reject({ status: false, message: "Close command failed" });
            }
            return Promise.resolve({ result: true });
        });
    }
    execute(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const retRes = { changes: -1 };
            if (typeof options.statements === 'undefined') {
                return Promise.reject({ changes: retRes, message: "Execute command failed : Must provide raw SQL statements" });
            }
            const statements = options.statements;
            const ret = yield this.mDb.exec(statements);
            return Promise.resolve({ changes: ret });
        });
    }
    run(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const retRes = { changes: -1 };
            if (typeof options.statement === 'undefined') {
                return Promise.reject({ changes: retRes, message: "Run command failed : Must provide a SQL statement" });
            }
            if (typeof options.values === 'undefined') {
                return Promise.reject({ changes: retRes, message: "Run command failed : Values should be an Array of values" });
            }
            const statement = options.statement;
            const values = options.values;
            let ret;
            if (values.length > 0) {
                ret = yield this.mDb.run(statement, values);
            }
            else {
                ret = yield this.mDb.run(statement, null);
            }
            return Promise.resolve({ changes: ret });
        });
    }
    query(options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof options.statement === 'undefined') {
                return Promise.reject({ changes: -1, message: "Query command failed : Must provide a SQL statement" });
            }
            if (typeof options.values === 'undefined') {
                return Promise.reject({ changes: -1, message: "Query command failed : Values should be an Array of values" });
            }
            const statement = options.statement;
            const values = options.values;
            let ret;
            if (values.length > 0) {
                ret = yield this.mDb.query(statement, values);
            }
            else {
                ret = yield this.mDb.query(statement, []);
            }
            return Promise.resolve({ values: ret });
        });
    }
    isDBExists(options) {
        return __awaiter(this, void 0, void 0, function* () {
            let dbName = options.database;
            if (dbName == null) {
                return Promise.reject({ result: false, message: "Must provide a Database Name" });
            }
            dbName = `${options.database}SQLite.db`;
            const utils = new UtilsSQLite();
            let sep = "/";
            const idx = __dirname.indexOf("\\");
            if (idx != -1)
                sep = "\\";
            const dir = __dirname.substring(0, __dirname.lastIndexOf(sep) + 1);
            const dbPath = path.join(dir, utils.pathDB, dbName);
            console.log("in isDBExists dbPath ", dbPath);
            let message = "";
            let ret = false;
            try {
                if (fs.existsSync(dbPath)) {
                    //file exists
                    ret = true;
                }
            }
            catch (err) {
                ret = false;
                message = err.message;
            }
            finally {
                console.log("in isDBExists ret ", ret);
                if (ret) {
                    return Promise.resolve({ result: ret });
                }
                else {
                    return Promise.resolve({ result: ret, message: message });
                }
            }
        });
    }
    deleteDatabase(options) {
        return __awaiter(this, void 0, void 0, function* () {
            let dbName = options.database;
            if (dbName == null) {
                return Promise.reject({ result: false, message: "Must provide a Database Name" });
            }
            dbName = `${options.database}SQLite.db`;
            if (typeof this.mDb === 'undefined' || this.mDb === null) {
                return Promise.reject({ result: false, message: "The database is not opened" });
            }
            const ret = yield this.mDb.deleteDB(dbName);
            return Promise.resolve({ result: ret });
        });
    }
    isJsonValid(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const jsonStrObj = options.jsonstring;
            if (typeof jsonStrObj != "string" || jsonStrObj == null || jsonStrObj.length === 0) {
                return Promise.reject({ result: false, message: "Must provide a json object" });
            }
            const jsonObj = JSON.parse(jsonStrObj);
            const isValid = isJsonSQLite(jsonObj);
            if (!isValid) {
                return Promise.reject({ result: false, message: "Stringify Json Object not Valid" });
            }
            else {
                return Promise.resolve({ result: true });
            }
        });
    }
    importFromJson(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const retRes = { changes: -1 };
            const jsonStrObj = options.jsonstring;
            if (typeof jsonStrObj != "string" || jsonStrObj == null || jsonStrObj.length === 0) {
                return Promise.reject({ changes: retRes, message: "Must provide a json object" });
            }
            const jsonObj = JSON.parse(jsonStrObj);
            const isValid = isJsonSQLite(jsonObj);
            if (!isValid)
                return Promise.reject({ changes: retRes, message: "Must provide a jsonSQLite object" });
            //      console.log("jsonObj ",jsonObj)
            const dbName = `${jsonObj.database}SQLite.db`;
            this.mDb = new DatabaseSQLiteHelper(dbName);
            const ret = yield this.mDb.importJson(jsonObj);
            this.mDb.close(dbName);
            this.mDb = null;
            return Promise.resolve({ changes: ret });
        });
    }
    exportToJson(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const retRes = {};
            if (typeof options.jsonexportmode === 'undefined') {
                return Promise.reject({ export: retRes, message: "Must provide a json export mode" });
            }
            if (options.jsonexportmode != "full" && options.jsonexportmode != "partial") {
                return Promise.reject({ export: retRes, message: "Json export mode should be 'full' or 'partial'" });
            }
            const exportMode = options.jsonexportmode;
            const ret = yield this.mDb.exportJson(exportMode);
            return Promise.resolve({ export: ret });
        });
    }
    createSyncTable() {
        return __awaiter(this, void 0, void 0, function* () {
            const ret = yield this.mDb.createSyncTable();
            return Promise.resolve({ changes: ret });
        });
    }
    setSyncDate(options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof options.syncdate === 'undefined' || typeof options.syncdate != "string") {
                return Promise.reject({ result: false, message: "Must provide a synchronization date" });
            }
            const syncDate = options.syncdate;
            const ret = yield this.mDb.setSyncDate(syncDate);
            return Promise.resolve({ result: ret });
        });
    }
}
const CapacitorSQLiteElectron = new CapacitorSQLitePluginElectron();
export { CapacitorSQLiteElectron };
import { registerWebPlugin } from '@capacitor/core';
registerWebPlugin(CapacitorSQLiteElectron);
//# sourceMappingURL=electron.js.map