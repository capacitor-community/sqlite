import Foundation
enum CapacitorSQLiteError: Error {
    case failed(message: String)
}
// swiftlint:disable file_length
// swiftlint:disable type_body_length
@objc public class CapacitorSQLite: NSObject {
    private var dbDict: [String: Database] = [:]

    // MARK: - Echo

    @objc public func echo(_ value: String) -> String {
        return value
    }

    // MARK: - CreateConnection

    @objc public func createConnection(_ dbName: String,
                                       encrypted: Bool,
                                       mode: String,
                                       version: Int,
                                       vUpgDict: [Int: [String: Any]]) throws {
        // check if the connection already exists
        let conn = dbDict[dbName]
        if conn != nil {
            let msg = "Connection \(dbName) already exists"
            throw CapacitorSQLiteError.failed(message: msg)
        }

        do {
            let mDb: Database = try Database(
                databaseName: "\(dbName)SQLite.db",
                encrypted: encrypted, mode: mode, version: version,
                vUpgDict: vUpgDict)
            dbDict[dbName] = mDb
            return
        } catch let error {
            throw CapacitorSQLiteError.failed(message: error.localizedDescription)
        }
    }

    // MARK: - Open

    @objc public func open(_ dbName: String) throws {
        guard let mDb: Database = dbDict[dbName] else {
            let msg = "Connection to \(dbName) not available"
            throw CapacitorSQLiteError.failed(message: msg)
        }
        do {
            try mDb.open()
            return
        } catch DatabaseError.open(let message) {
            throw CapacitorSQLiteError.failed(message: message)
        }
    }

    // MARK: - Close

    @objc public func close(_ dbName: String) throws {

        guard let mDb: Database = dbDict[dbName] else {
            let msg = "Connection to \(dbName) not available"
            throw CapacitorSQLiteError.failed(message: msg)
        }
        do {
            try mDb.close()
            return
        } catch DatabaseError.close(let message) {
            throw CapacitorSQLiteError.failed(message: message)
        }
    }

    // MARK: - Close Connection

    @objc public func closeConnection(_ dbName: String) throws {
        guard let mDb: Database = dbDict[dbName] else {
            let msg = "Connection to \(dbName) not available"
            throw CapacitorSQLiteError.failed(message: msg)
        }
        if mDb.isDBOpen() {
            do {
                try mDb.close()
            } catch DatabaseError.close(let message) {
                throw CapacitorSQLiteError.failed(message: message)
            }
        }
        dbDict.removeValue(forKey: dbName)
        return
    }

    // MARK: - IsDatabase

    @objc public func isDatabase(_ dbName: String) throws -> NSNumber {

        let isFileExists: Bool = UtilsFile
            .isFileExist(fileName: dbName + "SQLite.db")
        if isFileExists {
            return 1
        } else {
            return 0
        }
    }

    // MARK: - IsTableExists

    @objc public func isTableExists(_ dbName: String, tableName: String) throws -> NSNumber {

        guard let mDb: Database = dbDict[dbName] else {
            let msg = "Connection to \(dbName) not available"
            throw CapacitorSQLiteError.failed(message: msg)
        }
        do {
            let isExists: Bool = try
                UtilsJson.isTableExists(mDB: mDb,
                                        tableName: tableName)
            if isExists {
                return 1
            } else {
                return 0
            }
        } catch UtilsJsonError.tableNotExists(let message) {
            var msg: String = "IsTableExists:"
            msg.append(" \(message)")
            throw CapacitorSQLiteError.failed(message: msg)
        } catch let error {
            var msg: String = "IsTableExists:"
            msg.append(" \(error.localizedDescription)")
            throw CapacitorSQLiteError.failed(message: msg)
        }
    }

    // MARK: - Execute

    @objc public func execute(_ dbName: String, statements: String)
    throws -> [String: Any] {
        guard let mDb: Database = dbDict[dbName] else {
            let msg = "Connection to \(dbName) not available"
            throw CapacitorSQLiteError.failed(message: msg)
        }
        if mDb.isDBOpen() {
            do {
                let res = try mDb.executeSQL(sql: statements)
                return ["changes": res]
            } catch DatabaseError.executeSQL(let message) {
                throw CapacitorSQLiteError.failed(message: message)
            } catch let error {
                let msg: String = "\(error.localizedDescription)"
                throw CapacitorSQLiteError.failed(message: msg)
            }
        } else {
            let msg = "Database \(dbName) not opened"
            throw CapacitorSQLiteError.failed(message: msg)
        }
    }

    // MARK: - ExecuteSet

    @objc func executeSet(_ dbName: String, set: [[String: Any]])
    throws -> [String: Any] {
        guard let mDb: Database = dbDict[dbName] else {
            let msg = "Connection to \(dbName) not available"
            throw CapacitorSQLiteError.failed(message: msg)
        }
        if mDb.isDBOpen() {
            do {
                let res = try (mDb.execSet(set: set))
                return res
            } catch DatabaseError.execSet(let message) {
                throw CapacitorSQLiteError.failed(message: message)
            } catch let error {
                let msg: String = "\(error.localizedDescription)"
                throw CapacitorSQLiteError.failed(message: msg)
            }
        } else {
            let msg = "Database \(dbName) not opened"
            throw CapacitorSQLiteError.failed(message: msg)
        }
    }

    // MARK: - Run

    @objc func run(_ dbName: String, statement: String, values: [Any])
    throws -> [String: Any] {
        guard let mDb: Database = dbDict[dbName] else {
            let msg = "Connection to \(dbName) not available"
            throw CapacitorSQLiteError.failed(message: msg)
        }
        if mDb.isDBOpen() {
            do {
                var val: [Any] = []
                if values.count > 0 {
                    for value in values {
                        if let obj = value as? String {
                            let str: String =
                                "\(String(describing: obj))"
                            val.append(str)
                        } else if let obj = value as? Int {
                            val.append(obj)
                        } else if let obj = value as? Float {
                            val.append(obj)
                        } else if value is NSNull {
                            val.append("NULL")
                        } else {
                            let msg: String = "Not a SQL type"
                            throw CapacitorSQLiteError.failed(message: msg)
                        }
                    }
                }
                let res = try mDb.runSQL(sql: statement, values: val)
                return res
            } catch DatabaseError.runSQL(let message) {
                throw CapacitorSQLiteError.failed(message: message)
            } catch let error {
                let msg: String = "\(error.localizedDescription)"
                throw CapacitorSQLiteError.failed(message: msg)
            }
        } else {
            let msg = "Database \(dbName) not opened"
            throw CapacitorSQLiteError.failed(message: msg)
        }
    }

    // MARK: - Query

    @objc func query(_ dbName: String, statement: String,
                     values: [String]) throws -> [[String: Any]] {
        guard let mDb: Database = dbDict[dbName] else {
            let msg = "Connection to \(dbName) not available"
            throw CapacitorSQLiteError.failed(message: msg)
        }
        if mDb.isDBOpen() {
            do {
                let res: [[String: Any]] = try mDb
                    .selectSQL(sql: statement, values: values)
                return res
            } catch DatabaseError.selectSQL(let message) {
                throw CapacitorSQLiteError.failed(message: message)
            } catch let error {
                let msg: String = "\(error.localizedDescription)"
                throw CapacitorSQLiteError.failed(message: msg)
            }
        } else {
            let msg = "Database \(dbName) not opened"
            throw CapacitorSQLiteError.failed(message: msg)
        }
    }

    // MARK: - isDBExists

    @objc func isDBExists(_ dbName: String) throws -> NSNumber {
        guard let _: Database = dbDict[dbName] else {
            let msg = "Connection to \(dbName) not available"
            throw CapacitorSQLiteError.failed(message: msg)
        }
        let res: Bool = UtilsFile
            .isFileExist(fileName: "\(dbName)SQLite.db")
        if res {
            return 1
        } else {
            return 0
        }
    }

    // MARK: - isDBOpen

    @objc func isDBOpen(_ dbName: String) throws -> NSNumber {
        guard let mDb: Database = dbDict[dbName] else {
            let msg = "Connection to \(dbName) not available"
            throw CapacitorSQLiteError.failed(message: msg)
        }
        let isOpen: Bool = mDb.isDBOpen()
        if isOpen {
            return 1
        } else {
            return 0
        }
    }

    // MARK: - deleteDatabase

    @objc func deleteDatabase(_ dbName: String) throws {
        guard let mDb: Database = dbDict[dbName] else {
            let msg = "Connection to \(dbName) not available"
            throw CapacitorSQLiteError.failed(message: msg)
        }

        do {
            if !mDb.isDBOpen() {
                try mDb.open()
            }
            let res: Bool = try mDb.deleteDB(
                databaseName: "\(dbName)SQLite.db")
            if res {
                return
            } else {
                let msg: String = "deleteDB return false"
                throw CapacitorSQLiteError.failed(message: msg)
            }
        } catch DatabaseError.open(let message) {
            throw CapacitorSQLiteError.failed(message: message)
        } catch DatabaseError.deleteDB(let message) {
            throw CapacitorSQLiteError.failed(message: message)
        } catch let error {
            let msg: String = "\(error.localizedDescription)"
            throw CapacitorSQLiteError.failed(message: msg)
        }
    }

    // MARK: - isJsonValid

    @objc func isJsonValid(_ parsingData: String) throws {

        if let data = ("["+parsingData+"]").data(using: .utf8) {
            do {
                _ = try JSONDecoder().decode([JsonSQLite].self,
                                             from: data)
                return
            } catch let error {
                let msg: String = "\(error.localizedDescription)"
                throw CapacitorSQLiteError.failed(message: msg)
            }
        } else {
            let msg: String = "Stringify Json Object not Valid"
            throw CapacitorSQLiteError.failed(message: msg)
        }
    }

    // MARK: - importFromJson

    // swiftlint:disable function_body_length
    @objc func importFromJson(_ parsingData: String)
    throws -> [String: Int] {
        var mDb: Database
        if let data = ("["+parsingData+"]").data(using: .utf8) {
            do {
                let jsonSQLite = try JSONDecoder()
                    .decode([JsonSQLite].self, from: data)
                let encrypted: Bool = jsonSQLite[0].encrypted ?
                    true : false
                let inMode: String = encrypted ? "secret"
                    : "no-encryption"
                var dbName: String = jsonSQLite[0].database
                dbName.append("SQLite.db")
                // open the database
                do {
                    mDb = try Database(
                        databaseName: dbName, encrypted: encrypted,
                        mode: inMode, vUpgDict: [:])
                    try mDb.open()
                } catch DatabaseError.open(let message) {
                    throw CapacitorSQLiteError.failed(message: message)
                } catch let error {
                    let msg: String = "\(error.localizedDescription)"
                    throw CapacitorSQLiteError.failed(message: msg)
                }
                // import from Json Object
                do {
                    let res: [String: Int] = try mDb
                        .importFromJson(jsonSQLite: jsonSQLite[0])
                    try mDb.close()
                    if let result = res["changes"] {
                        if result < 0 {
                            let msg: String = "changes < 0"
                            throw CapacitorSQLiteError
                            .failed(message: msg)
                        } else {
                            return res
                        }
                    } else {
                        let msg: String = "changes not found"
                        throw CapacitorSQLiteError.failed(message: msg)
                    }
                } catch DatabaseError.importFromJson(
                            let message) {
                    var msg = message
                    do {
                        try mDb.close()
                        throw CapacitorSQLiteError.failed(message: msg)
                    } catch DatabaseError.close(let message) {
                        msg.append(" \(message)")
                        throw CapacitorSQLiteError.failed(message: msg)
                    }
                } catch DatabaseError.close(let message) {
                    throw CapacitorSQLiteError.failed(message: message)
                }
            } catch let error {
                var msg: String = "Stringify Json Object not Valid "
                msg.append("\(error.localizedDescription)")
                throw CapacitorSQLiteError.failed(message: msg)
            }
        } else {
            let msg: String = "Stringify Json Object not Valid"
            throw CapacitorSQLiteError.failed(message: msg)
        }
    }
    // swiftlint:enable function_body_length

    // MARK: - exportToJson

    @objc func exportToJson(_ dbName: String, expMode: String)
    throws -> [String: Any] {
        guard let mDb: Database = dbDict[dbName] else {
            let msg = "Connection to \(dbName) not available"
            throw CapacitorSQLiteError.failed(message: msg)
        }
        if mDb.isDBOpen() {

            do {
                let res: [String: Any] = try
                    mDb.exportToJson(expMode: expMode)
                if res.count == 5 {
                    return res
                } else {
                    var msg: String = "return Object is not a "
                    msg.append("JsonSQLite  Object")
                    throw CapacitorSQLiteError.failed(message: msg)
                }
            } catch DatabaseError.exportToJson(let message) {
                throw CapacitorSQLiteError.failed(message: message)
            } catch let error {
                let msg: String = "\(error.localizedDescription)"
                throw CapacitorSQLiteError.failed(message: msg)
            }
        } else {
            let msg = "Database \(dbName) not opened"
            throw CapacitorSQLiteError.failed(message: msg)
        }
    }

    // MARK: - createSyncTable

    @objc func createSyncTable(_ dbName: String) throws -> NSNumber {
        guard let mDb: Database = dbDict[dbName] else {
            let msg = "Connection to \(dbName) not available"
            throw CapacitorSQLiteError.failed(message: msg)
        }
        if mDb.isDBOpen() {
            do {
                let res: Int = try mDb.createSyncTable()
                return res as NSNumber
            } catch DatabaseError.createSyncTable(let message) {
                throw CapacitorSQLiteError.failed(message: message)
            } catch let error {
                let msg: String = "\(error.localizedDescription)"
                throw CapacitorSQLiteError.failed(message: msg)
            }
        } else {
            let msg = "Database \(dbName) not opened"
            throw CapacitorSQLiteError.failed(message: msg)
        }
    }

    // MARK: - setSyncDate

    @objc func setSyncDate(_ dbName: String, syncDate: String)
    throws {
        guard let mDb: Database = dbDict[dbName] else {
            let msg = "Connection to \(dbName) not available"
            throw CapacitorSQLiteError.failed(message: msg)
        }
        if mDb.isDBOpen() {

            do {
                let res: Bool = try mDb
                    .setSyncDate(syncDate: syncDate)
                if res {
                    return
                } else {
                    let msg: String = "return false"
                    throw CapacitorSQLiteError.failed(message: msg)
                }
            } catch DatabaseError.createSyncDate(let message) {
                throw CapacitorSQLiteError.failed(message: message)
            } catch let error {
                let msg: String = "\(error.localizedDescription)"
                throw CapacitorSQLiteError.failed(message: msg)
            }
        } else {
            let msg = "Database \(dbName) not opened"
            throw CapacitorSQLiteError.failed(message: msg)
        }
    }

    // MARK: - getSyncDate

    @objc func getSyncDate(_ dbName: String) throws -> NSNumber {
        guard let mDb: Database = dbDict[dbName] else {
            let msg = "Connection to \(dbName) not available"
            throw CapacitorSQLiteError.failed(message: msg)
        }
        if mDb.isDBOpen() {
            do {
                let res: Int64 = try mDb.getSyncDate()
                if res > 0 {
                    return res as NSNumber
                } else {
                    let msg: String = "return no sync date"
                    throw CapacitorSQLiteError.failed(message: msg)
                }
            } catch DatabaseError.getSyncDate(let message) {
                throw CapacitorSQLiteError.failed(message: message)
            } catch let error {
                let msg: String = "\(error.localizedDescription)"
                throw CapacitorSQLiteError.failed(message: msg)
            }
        } else {
            let msg = "Database \(dbName) not opened"
            throw CapacitorSQLiteError.failed(message: msg)
        }
    }

    // MARK: - addUpgradeStatement

    @objc func addUpgradeStatement(_ dbName: String,
                                   upgrade: [[String: Any]])
    throws -> [Int: [String: Any]] {
        var upgDict: [String: Any] = [:]
        for dict in upgrade {
            let keys = dict.keys
            if !(keys.contains("fromVersion")) ||
                !(keys.contains("toVersion")) ||
                !(keys.contains("statement")) {
                var msg: String = "upgrade must have keys in "
                msg.append("{fromVersion,toVersion,statement}")
                throw CapacitorSQLiteError.failed(message: msg)
            }
            for (key, value) in dict {
                upgDict[key] = value
            }
        }
        guard let fromVersion = upgDict["fromVersion"] as? Int else {
            let msg: String = "fromVersion key must be an Int"
            throw CapacitorSQLiteError.failed(message: msg)
        }
        let upgVersionDict: [Int: [String: Any]] =
            [fromVersion: upgDict]
        return upgVersionDict
    }

    // MARK: - copyFromAssets

    @objc func copyFromAssets() throws {

        // check if the assets/database folder exists
        do {
            let assetsDbPath: URL = try
                UtilsFile.getAssetsDatabasesPath()
            let aPath: String = assetsDbPath.path
            let bRes: Bool = UtilsFile.isDirExist(dirPath: aPath)
            if bRes {
                // get the database files
                let dbList: [String] = try UtilsFile
                    .getFileList(path: aPath)
                // loop through the database files
                for mDb in dbList {
                    // for each check if the suffix SQLite.db is there
                    // or add it
                    let toDb: String = UtilsFile
                        .setPathSuffix(sDb: mDb)
                    // for each copy the file to the Application
                    // database folder
                    _ = try UtilsFile
                        .copyFromAssetToDatabase(fromDb: mDb,
                                                 toDb: toDb)
                }
                return
            } else {
                let msg: String = "assets database path does not exist"
                throw CapacitorSQLiteError.failed(message: msg)
            }
        } catch let error {
            let msg: String = "\(error.localizedDescription)"
            throw CapacitorSQLiteError.failed(message: msg)
        }
    }

    // MARK: - getDatabaseList

    @objc func getDatabaseList() throws -> [String] {
        do {
            let aPath: String = try UtilsFile.getDatabasesPath()
            // get the database files
            let dbList: [String] = try UtilsFile.getFileList(path: aPath)
            return dbList

        } catch let error {
            let msg: String = "\(error.localizedDescription)"
            throw CapacitorSQLiteError.failed(message: msg)
        }

    }

    // MARK: - addSQLiteSuffix

    @objc func addSQLiteSuffix(_ folderPath: String) throws {

        do {
            try UtilsMigrate.addSQLiteSuffix(folderPath: folderPath)
            return
        } catch UtilsMigrateError.addSQLiteSuffix(let message) {
            var msg: String = "addSQLiteSuffix:"
            msg.append(" \(message)")
            throw CapacitorSQLiteError.failed(message: msg)

        } catch let error {
            var msg: String = "addSQLiteSuffix:"
            msg.append(" \(error.localizedDescription)")
            throw CapacitorSQLiteError.failed(message: msg)
        }
    }

    // MARK: - deleteOldDatabases

    @objc func deleteOldDatabases(_ folderPath: String) throws {
        do {
            try UtilsMigrate.deleteOldDatabases(folderPath: folderPath)
            return
        } catch UtilsMigrateError.deleteOldDatabases(let message) {
            var msg: String = "deleteOldDatabases:"
            msg.append(" \(message)")
            throw CapacitorSQLiteError.failed(message: msg)

        } catch let error {
            var msg: String = "deleteOldDatabases:"
            msg.append(" \(error.localizedDescription)")
            throw CapacitorSQLiteError.failed(message: msg)
        }

    }
}
// swiftlint:enable type_body_length
// swiftlint:enable file_length
