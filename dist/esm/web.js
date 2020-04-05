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
export class CapacitorSQLiteWeb extends WebPlugin {
    constructor() {
        super({
            name: 'CapacitorSQLite',
            platforms: ['web', 'electron']
        });
    }
    echo(options) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('ECHO', options);
            return options;
        });
    }
    open(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const sqlite3 = window['sqlite3'];
            if (sqlite3) {
                return new Promise((resolve, reject) => {
                    if (!options || !options.database) {
                        reject("Must provide a database name");
                    }
                    else {
                        this.db = new sqlite3.Database(options.database);
                        resolve({ result: true });
                    }
                });
            }
            else {
                console.log('open', options);
                return Promise.reject("Not implemented");
            }
        });
    }
    close(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const sqlite3 = window['sqlite3'];
            if (sqlite3) {
                return new Promise((resolve, reject) => {
                    if (!options || !options.database) {
                        reject("Must provide a database name");
                    }
                    else if (!this.db) {
                        reject("No Database Open");
                    }
                    else {
                        this.db.close((err) => {
                            if (err) {
                                reject(err);
                            }
                            else {
                                resolve({ result: true });
                            }
                        });
                    }
                });
            }
            else {
                console.log('close', options);
                return Promise.reject("Not implemented");
            }
        });
    }
    execute(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const sqlite3 = window['sqlite3'];
            if (sqlite3) {
                return new Promise((resolve, reject) => {
                    if (!options || !options.statements) {
                        reject("Must provide a statements");
                    }
                    else if (!this.db) {
                        reject("No Database Open");
                    }
                    else {
                        this.db.exec(options.statements, (err) => {
                            if (err) {
                                reject(err);
                            }
                            else {
                                resolve({ result: true });
                            }
                        });
                    }
                });
            }
            else {
                console.log('execute', options);
                return Promise.reject("Not implemented");
            }
        });
    }
    run(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const sqlite3 = window['sqlite3'];
            if (sqlite3) {
                return new Promise((resolve, reject) => {
                    if (!options || !options.statement) {
                        reject("Must provide a statement");
                    }
                    else if (!this.db) {
                        reject("No Database Open");
                    }
                    else {
                        this.db.run(options.statement, options.values, function (err) {
                            if (err) {
                                reject(err);
                            }
                            else {
                                resolve({ result: true, changes: this.changes });
                            }
                        });
                    }
                });
            }
            else {
                console.log('run', options);
                return Promise.reject("Not implemented");
            }
        });
    }
    query(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const sqlite3 = window['sqlite3'];
            if (sqlite3) {
                return new Promise((resolve, reject) => {
                    if (!options || !options.statement) {
                        reject("Must provide a statement");
                    }
                    else if (!this.db) {
                        reject("No Database Open");
                    }
                    else {
                        this.db.all(options.statement, options.values, (err, result) => {
                            if (err) {
                                console.error('query', err);
                                reject(err);
                            }
                            else {
                                resolve({ values: result });
                            }
                        });
                    }
                });
            }
            else {
                console.log('query', options);
                return Promise.reject("Not implemented");
            }
        });
    }
    deleteDatabase(options) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('deleteDatabase', options);
            return Promise.reject("Not implemented");
        });
    }
}
const CapacitorSQLite = new CapacitorSQLiteWeb();
export { CapacitorSQLite };
import { registerWebPlugin } from '@capacitor/core';
registerWebPlugin(CapacitorSQLite);
//# sourceMappingURL=web.js.map