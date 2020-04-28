const sqlite3 = window['sqlite3'];
const fs = window['fs'];
const path = window['path'];
export class UtilsSQLite {
    constructor() {
        this.pathDB = "Databases";
    }
    connection(dbName, readOnly /*,key?:string*/) {
        const flags = readOnly ? sqlite3.OPEN_READONLY : sqlite3.OPEN_CREATE | sqlite3.OPEN_READWRITE;
        // get the path for the database
        const dbPath = this._getDBPath(dbName);
        let dbOpen;
        if (dbPath != null) {
            try {
                dbOpen = new sqlite3.Database(dbPath, flags);
                return dbOpen;
            }
            catch (e) {
                console.log("Error: in UtilsSQLite.connection ", e);
                return null;
            }
        }
    }
    getWritableDatabase(dbName /*, secret: string*/) {
        const db = this.connection(dbName, false /*,secret*/);
        return db;
    }
    getReadableDatabase(dbName /*, secret: string*/) {
        const db = this.connection(dbName, true /*,secret*/);
        return db;
    }
    _getDBPath(dbName) {
        let retPath = null;
        const dbFolder = this.pathDB;
        retPath = path.join(dbFolder, dbName);
        try {
            if (!fs.existsSync(dbFolder)) {
                this._mkdirSyncRecursive(dbFolder);
            }
        }
        catch (e) {
            console.log('Error: in getDBPath', e);
        }
        return retPath;
    }
    _mkdirSyncRecursive(directory) {
        var path = directory.replace(/\/$/, '').split('/');
        for (var i = 1; i <= path.length; i++) {
            var segment = path.slice(0, i).join('/');
            segment.length > 0 && !fs.existsSync(segment) ? fs.mkdirSync(segment) : null;
        }
        return;
    }
}
//# sourceMappingURL=UtilsSQLite.js.map