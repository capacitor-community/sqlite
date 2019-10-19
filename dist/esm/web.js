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
            platforms: ['web']
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
            console.log('open', options);
            return Promise.reject("Not implemented");
        });
    }
    execute(options) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('execute', options);
            return Promise.reject("Not implemented");
        });
    }
    run(options) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('run', options);
            return Promise.reject("Not implemented");
        });
    }
    query(options) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('query', options);
            return Promise.reject("Not implemented");
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