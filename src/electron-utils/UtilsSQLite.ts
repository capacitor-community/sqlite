const sqlite3: any = window['sqlite3' as any];
const fs: any = window['fs' as any];
const path: any = window['path' as any];

export class UtilsSQLite {
    public pathDB: string = "./Databases";
    constructor() {
    }
    public connection(dbName:string,readOnly?:boolean/*,key?:string*/): any {

        const flags = readOnly ? sqlite3.OPEN_READONLY : sqlite3.OPEN_CREATE | sqlite3.OPEN_READWRITE;

        // get the path for the database
        const dbPath = this._getDBPath(dbName);
        let dbOpen: any;

        if(dbPath != null) {
            try {
                dbOpen = new sqlite3.Database(dbPath,flags);
                return dbOpen;
            }
            catch(e) {
                console.log("Error: in UtilsSQLite.connection ",e);
                return null;
            }
        }
    }

    public getWritableDatabase(dbName: string/*, secret: string*/): any {
        const db: any = this.connection(dbName,false/*,secret*/);
        return db;
    }

    public getReadableDatabase(dbName: string/*, secret: string*/): any {
        const db: any = this.connection(dbName,true/*,secret*/);
        return db;
    }
    private _getDBPath(dbName: string):string {
        let retPath:string = null;
        const dbFolder: string = this.pathDB;
        retPath = path.join(dbFolder,dbName)

        try {
            if(!fs.existsSync(dbFolder)) {
                this._mkdirSyncRecursive(dbFolder);
            }
        }
        catch(e) {
            console.log('Error: in getDBPath',e);
        }
        return retPath;
    }
    private _mkdirSyncRecursive(directory:string): void {
        var path = directory.replace(/\/$/, '').split('/');
        for (var i = 1; i <= path.length; i++) {
            var segment = path.slice(0, i).join('/');
            segment.length > 0 && !fs.existsSync(segment) ? fs.mkdirSync(segment) : null ;
        }
        return;
    }

}
