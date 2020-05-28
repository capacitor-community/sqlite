const sqlite3 = window['sqlite3'];
const fs = window['fs'];
const path = window['path'];
const appName = window['appName'];
const homeDir = window['homeDir'];
export class UtilsSQLite {
    constructor() {
        this.pathDB = "Databases";
    }
    connection(dbName, readOnly /*,key?:string*/) {
        const flags = readOnly ? sqlite3.OPEN_READONLY : sqlite3.OPEN_CREATE | sqlite3.OPEN_READWRITE;
        // get the path for the database
        const dbPath = this.getDBPath(dbName);
        let dbOpen = null;
        if (dbPath != null) {
            try {
                dbOpen = new sqlite3.Database(dbPath, flags);
            }
            catch (e) {
                console.log("Error: in UtilsSQLite.connection ", e);
                dbOpen = null;
            }
            finally {
                if (dbOpen != null) {
                    const statements = "PRAGMA foreign_keys = ON;";
                    dbOpen.serialize(() => {
                        dbOpen.exec(statements, (err) => {
                            if (err) {
                                console.log(`exec: Error PRAGMA foreign_keys failed : ${err.message}`);
                                dbOpen = null;
                            }
                        });
                    });
                }
                return dbOpen;
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
    getDBPath(dbName) {
        let retPath = null;
        const dbFolder = this.pathDB;
        if (appName == null) {
            let sep = "/";
            const idx = __dirname.indexOf("\\");
            if (idx != -1)
                sep = "\\";
            const dir = __dirname.substring(0, __dirname.lastIndexOf(sep) + 1);
            retPath = path.join(dir, dbFolder, dbName);
            const retB = this._createFolderIfNotExists(path.join(dir, dbFolder));
            if (!retB)
                retPath = null;
        }
        else {
            retPath = path.join(homeDir, dbFolder, appName, dbName);
            let retB = this._createFolderIfNotExists(path.join(homeDir, dbFolder));
            if (retB) {
                retB = this._createFolderIfNotExists(path.join(homeDir, dbFolder, appName));
                if (!retB)
                    retPath = null;
            }
            else {
                retPath = null;
            }
        }
        return retPath;
    }
    _createFolderIfNotExists(folder) {
        let ret;
        try {
            if (!fs.existsSync(folder)) {
                this._mkdirSyncRecursive(folder);
            }
            ret = true;
        }
        catch (e) {
            console.log('Error: in getDBPath', e);
            ret = false;
        }
        return ret;
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