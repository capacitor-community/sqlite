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
            console.log('in execute prior call mDB.exec');
            const ret = yield this.mDb.exec(statements);
            console.log('in execute after call mDB.exec ret ', ret);
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
    deleteDatabase(options) {
        return __awaiter(this, void 0, void 0, function* () {
            let dbName = options.database;
            if (dbName == null) {
                return Promise.reject({ result: false, message: "Must provide a Database Name" });
            }
            dbName = `${options.database}SQLite.db`;
            if (typeof this.mDb === 'undefined' || this.mDb === null)
                this.mDb = new DatabaseSQLiteHelper(dbName);
            const ret = yield this.mDb.deleteDB(dbName);
            this.mDb = null;
            return Promise.resolve({ result: ret });
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
}
const CapacitorSQLiteElectron = new CapacitorSQLitePluginElectron();
export { CapacitorSQLiteElectron };
import { registerWebPlugin } from '@capacitor/core';
registerWebPlugin(CapacitorSQLiteElectron);
//# sourceMappingURL=electron.js.map