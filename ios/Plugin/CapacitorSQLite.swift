import Foundation
enum CapacitorSQLiteError: Error {
    case failed(message: String)
}
// swiftlint:disable file_length
// swiftlint:disable type_body_length
@objc public class CapacitorSQLite: NSObject {
    private var config: SqliteConfig
    private var dbDict: [String: Database] = [:]
    private var databaseLocation: String
    private var initMessage: String = ""
    private var isInit: Bool = false

    init(config: SqliteConfig) {
        self.config = config
        if let isLocation = config.iosDatabaseLocation {
            self.databaseLocation = isLocation
            // create the databaseLocation directory
            do {
                try UtilsFile.createDatabaseLocation(location: isLocation)
                isInit = true
            } catch UtilsFileError.createDatabaseLocationFailed(let message) {
                initMessage =  message
            } catch let error {
                initMessage = "Init Plugin failed :"
                initMessage.append(" \(error.localizedDescription)")
            }

        } else {
            self.databaseLocation = "Documents"
            isInit = true
        }
        super.init()
    }

    // MARK: - Echo

    @objc public func echo(_ value: String) -> String {
        return value
    }

    // MARK: - IsSecretStored

    @objc public func isSecretStored()  throws -> NSNumber {
        if isInit {
            let isSecretExists: Bool = UtilsSecret.isPassphrase()
            if isSecretExists {
                return 1
            } else {
                return 0
            }
        } else {
            throw CapacitorSQLiteError.failed(message: initMessage)
        }
    }

    // MARK: - SetEncryptionSecret

    @objc public func setEncryptionSecret(passphrase: String) throws {
        if isInit {
            do {
                // close all connections
                try closeAllConnections()
                // set encryption secret
                try UtilsSecret
                    .setEncryptionSecret(passphrase: passphrase,
                                         databaseLocation: databaseLocation)
                return
            } catch UtilsSecretError.setEncryptionSecret(let message) {
                throw CapacitorSQLiteError.failed(message: message)
            } catch let error {
                throw CapacitorSQLiteError.failed(message: "\(error)")
            }
        } else {
            throw CapacitorSQLiteError.failed(message: initMessage)
        }
    }

    // MARK: - ChangeEncryptionSecret

    @objc public func changeEncryptionSecret(passphrase: String,
                                             oldPassphrase: String) throws {
        if isInit {
            do {
                // close all connections
                try closeAllConnections()
                // set encryption secret
                try UtilsSecret
                    .changeEncryptionSecret(passphrase: passphrase,
                                            oldPassphrase: oldPassphrase,
                                            databaseLocation: databaseLocation)
                return
            } catch UtilsSecretError.changeEncryptionSecret(let message) {
                throw CapacitorSQLiteError.failed(message: message)
            } catch let error {
                throw CapacitorSQLiteError.failed(message: "\(error)")
            }
        } else {
            throw CapacitorSQLiteError.failed(message: initMessage)
        }

    }
    // MARK: - getNCDatabasePath

    @objc public func getNCDatabasePath(_ folderPath: String, dbName: String ) throws -> String {
        if isInit {
            do {
                let databasePath: String = try UtilsNCDatabase
                    .getNCDatabasePath(folderPath: folderPath,
                                       database: dbName )
                return databasePath
            } catch let error {
                throw CapacitorSQLiteError.failed(message: "\(error)")
            }
        } else {
            throw CapacitorSQLiteError.failed(message: initMessage)
        }
    }

    // MARK: - CreateNCConnection

    @objc public func createNCConnection(_ databasePath: String,
                                         version: Int) throws {
        if isInit {

            // check if the connection already exists
            let conn = dbDict[databasePath]
            if conn != nil {
                let msg = "Connection \(databasePath) already exists"
                throw CapacitorSQLiteError.failed(message: msg)
            }

            do {
                let isFileExists: Bool = UtilsFile
                    .isFileExist(filePath: databasePath)

                if !isFileExists {
                    throw CapacitorSQLiteError.failed(message: "database \(databasePath) does not exist")
                }
                let mDb: Database = try Database(
                    databaseLocation: databaseLocation,
                    databaseName: databasePath,
                    encrypted: false, mode: "no-encryption", version: version,
                    vUpgDict: [:])
                dbDict[databasePath] = mDb
                return
            } catch let error {
                throw CapacitorSQLiteError.failed(message: "\(error)")
            }
        } else {
            throw CapacitorSQLiteError.failed(message: initMessage)
        }
    }

    // MARK: - CloseNCConnection

    @objc public func closeNCConnection(_ dbName: String) throws {
        if isInit {
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
        } else {
            throw CapacitorSQLiteError.failed(message: initMessage)
        }
    }

    // MARK: - CreateConnection

    @objc public func createConnection(_ dbName: String,
                                       encrypted: Bool,
                                       mode: String,
                                       version: Int,
                                       vUpgDict: [Int: [String: Any]]) throws {
        if isInit {
            let mDbName = CapacitorSQLite.getDatabaseName(dbName: dbName)
            // check if the connection already exists
            let conn = dbDict[mDbName]
            if conn != nil {
                let msg = "Connection \(mDbName) already exists"
                throw CapacitorSQLiteError.failed(message: msg)
            }

            do {
                let mDb: Database = try Database(
                    databaseLocation: databaseLocation,
                    databaseName: "\(mDbName)SQLite.db",
                    encrypted: encrypted, mode: mode, version: version,
                    vUpgDict: vUpgDict)
                dbDict[mDbName] = mDb
                return
            } catch let error {
                throw CapacitorSQLiteError.failed(message: "\(error)")
            }
        } else {
            throw CapacitorSQLiteError.failed(message: initMessage)
        }
    }

    // MARK: - Open

    @objc public func open(_ dbName: String) throws {
        if isInit {
            let mDbName = CapacitorSQLite.getDatabaseName(dbName: dbName)
            guard let mDb: Database = dbDict[mDbName] else {
                let msg = "Connection to \(mDbName) not available"
                throw CapacitorSQLiteError.failed(message: msg)
            }
            do {
                try mDb.open()
                return
            } catch DatabaseError.open(let message) {
                throw CapacitorSQLiteError.failed(message: message)
            }
        } else {
            throw CapacitorSQLiteError.failed(message: initMessage)
        }
    }

    // MARK: - Close

    @objc public func close(_ dbName: String) throws {
        if isInit {
            let mDbName = CapacitorSQLite.getDatabaseName(dbName: dbName)
            guard let mDb: Database = dbDict[mDbName] else {
                let msg = "Connection to \(mDbName) not available"
                throw CapacitorSQLiteError.failed(message: msg)
            }
            do {
                try mDb.close()
                return
            } catch DatabaseError.close(let message) {
                throw CapacitorSQLiteError.failed(message: message)
            }
        } else {
            throw CapacitorSQLiteError.failed(message: initMessage)
        }
    }

    // MARK: - getUrl

    @objc public func getUrl(_ dbName: String) throws -> String {
        if isInit {
            let mDbName = CapacitorSQLite.getDatabaseName(dbName: dbName)
            guard let mDb: Database = dbDict[mDbName] else {
                let msg = "Connection to \(mDbName) not available"
                throw CapacitorSQLiteError.failed(message: msg)
            }
            let res: String = mDb.getUrl()
            return res
        } else {
            throw CapacitorSQLiteError.failed(message: initMessage)
        }
    }

    // MARK: - GetVersion

    @objc public func getVersion(_ dbName: String) throws ->  NSNumber {
        if isInit {
            let mDbName = CapacitorSQLite.getDatabaseName(dbName: dbName)
            guard let mDb: Database = dbDict[mDbName] else {
                let msg = "Connection to \(mDbName) not available"
                throw CapacitorSQLiteError.failed(message: msg)
            }
            do {
                let version: Int = try mDb.getVersion()
                return NSNumber(value: version)

            } catch DatabaseError.open(let message) {
                throw CapacitorSQLiteError.failed(message: message)
            }
        } else {
            throw CapacitorSQLiteError.failed(message: initMessage)
        }
    }

    // MARK: - Close Connection

    @objc public func closeConnection(_ dbName: String) throws {
        if isInit {
            let mDbName = CapacitorSQLite.getDatabaseName(dbName: dbName)
            guard let mDb: Database = dbDict[mDbName] else {
                let msg = "Connection to \(mDbName) not available"
                throw CapacitorSQLiteError.failed(message: msg)
            }
            if mDb.isDBOpen() {
                do {
                    try mDb.close()
                } catch DatabaseError.close(let message) {
                    throw CapacitorSQLiteError.failed(message: message)
                }
            }
            dbDict.removeValue(forKey: mDbName)
            return
        } else {
            throw CapacitorSQLiteError.failed(message: initMessage)
        }
    }

    // MARK: - CheckConnectionsConsistency

    @objc public func checkConnectionsConsistency(_ dbNames: [String]) throws ->  NSNumber {
        if isInit {
            var keys: [String] = Array(self.dbDict.keys)
            do {
                if dbNames.count == 0 {
                    try closeAllConnections()
                    return 0
                }
                if keys.count < dbNames.count {
                    // not solvable inconsistency
                    try closeAllConnections()
                    return 0
                }
                if keys.count > dbNames.count {
                    for key in keys {
                        if !dbNames.contains(key) {
                            self.dbDict.removeValue(forKey: key)
                        }
                    }
                }
                keys = Array(self.dbDict.keys)
                if keys.count == dbNames.count {
                    let set1 = Set(keys)
                    let set2 = Set(dbNames)
                    let arr = Array(set1.symmetricDifference(set2))
                    if arr.count == 0 {
                        return 1
                    } else {
                        // not solvable inconsistency
                        try closeAllConnections()
                        return 0
                    }
                } else {
                    try closeAllConnections()
                    return 0
                }
            } catch let error {
                throw CapacitorSQLiteError.failed(message: "\(error)")
            }
        } else {
            throw CapacitorSQLiteError.failed(message: initMessage)
        }
    }

    // MARK: - IsDatabase

    @objc public func isDatabase(_ dbName: String) throws -> NSNumber {
        if isInit {
            let mDbName = CapacitorSQLite.getDatabaseName(dbName: dbName)
            let isFileExists: Bool = UtilsFile
                .isFileExist(databaseLocation: databaseLocation,
                             fileName: mDbName + "SQLite.db")
            if isFileExists {
                return 1
            } else {
                return 0
            }
        } else {
            throw CapacitorSQLiteError.failed(message: initMessage)
        }
    }

    // MARK: - IsNCDatabase

    @objc public func isNCDatabase(_ databasePath: String) throws -> NSNumber {
        if isInit {
            let isFileExists: Bool = UtilsFile
                .isFileExist(filePath: databasePath)
            if isFileExists {
                return 1
            } else {
                return 0
            }
        } else {
            throw CapacitorSQLiteError.failed(message: initMessage)
        }
    }

    // MARK: - IsTableExists

    @objc public func isTableExists(_ dbName: String, tableName: String) throws -> NSNumber {
        if isInit {
            let mDbName = CapacitorSQLite.getDatabaseName(dbName: dbName)
            guard let mDb: Database = dbDict[mDbName] else {
                let msg = "Connection to \(mDbName) not available"
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
                msg.append(" \(error)")
                throw CapacitorSQLiteError.failed(message: msg)
            }
        } else {
            throw CapacitorSQLiteError.failed(message: initMessage)
        }
    }

    // MARK: - Execute

    @objc public func execute(_ dbName: String, statements: String,
                              transaction: Bool)
    throws -> [String: Any] {
        if isInit {
            let mDbName = CapacitorSQLite.getDatabaseName(dbName: dbName)
            guard let mDb: Database = dbDict[mDbName] else {
                let msg = "Connection to \(mDbName) not available"
                throw CapacitorSQLiteError.failed(message: msg)
            }
            if !mDb.isNCDB() && mDb.isDBOpen() {
                do {
                    var stmts = statements
                    // remove carriage returns
                    let isReturn = stmts.indicesOf(string: "\n")
                    if isReturn.count != 0 {
                        let cmds = stmts.split(separator: "\n")
                        var strcmds: [String] = []
                        for cmd in cmds {
                            strcmds.append(String(cmd
                                                    .trimmingCharacters(in: .whitespacesAndNewlines)))
                        }
                        stmts = strcmds.joined(separator: "\n")
                    }
                    let res = try mDb.executeSQL(sql: stmts,
                                                 transaction: transaction)
                    return ["changes": res]
                } catch DatabaseError.executeSQL(let message) {
                    throw CapacitorSQLiteError.failed(message: message)
                } catch let error {
                    let msg: String = "\(error)"
                    throw CapacitorSQLiteError.failed(message: msg)
                }
            } else {
                let msg = "Database \(mDbName) not opened or in read-only"
                throw CapacitorSQLiteError.failed(message: msg)
            }
        } else {
            throw CapacitorSQLiteError.failed(message: initMessage)
        }
    }

    // MARK: - ExecuteSet

    @objc func executeSet(_ dbName: String, set: [[String: Any]],
                          transaction: Bool)
    throws -> [String: Any] {
        if isInit {
            let mDbName = CapacitorSQLite.getDatabaseName(dbName: dbName)
            guard let mDb: Database = dbDict[mDbName] else {
                let msg = "Connection to \(mDbName) not available"
                throw CapacitorSQLiteError.failed(message: msg)
            }
            if !mDb.isNCDB() && mDb.isDBOpen() {
                do {
                    let res = try mDb.execSet(set: set, transaction: transaction)
                    return res
                } catch DatabaseError.execSet(let message) {
                    throw CapacitorSQLiteError.failed(message: message)
                } catch let error {
                    let msg: String = "\(error)"
                    throw CapacitorSQLiteError.failed(message: msg)
                }
            } else {
                let msg = "Database \(mDbName) not opened or in read-only"
                throw CapacitorSQLiteError.failed(message: msg)
            }
        } else {
            throw CapacitorSQLiteError.failed(message: initMessage)
        }
    }

    // MARK: - Run

    // swiftlint:disable cyclomatic_complexity
    @objc func run(_ dbName: String, statement: String, values: [Any],
                   transaction: Bool)
    throws -> [String: Any] {
        if isInit {
            let mDbName = CapacitorSQLite.getDatabaseName(dbName: dbName)
            guard let mDb: Database = dbDict[mDbName] else {
                let msg = "Connection to \(mDbName) not available"
                throw CapacitorSQLiteError.failed(message: msg)
            }
            if !mDb.isNCDB() && mDb.isDBOpen() {
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
                            } else if let obj = value as? Double {
                                val.append(obj)
                            } else if value is NSNull {
                                val.append(value)
                            } else {
                                let msg: String = "Not a SQL type"
                                throw CapacitorSQLiteError.failed(message: msg)
                            }
                        }
                    }
                    let res = try mDb.runSQL(sql: statement, values: val,
                                             transaction: transaction)
                    return res
                } catch DatabaseError.runSQL(let message) {
                    throw CapacitorSQLiteError.failed(message: message)
                } catch let error {
                    let msg: String = "\(error)"
                    throw CapacitorSQLiteError.failed(message: msg)
                }
            } else {
                let msg = "Database \(mDbName) not opened or in read-only"
                throw CapacitorSQLiteError.failed(message: msg)
            }
        } else {
            throw CapacitorSQLiteError.failed(message: initMessage)
        }
    }
    // swiftlint:enable cyclomatic_complexity

    // MARK: - Query

    @objc func query(_ dbName: String, statement: String,
                     values: [Any]) throws -> [[String: Any]] {
        if isInit {
            let mDbName = CapacitorSQLite.getDatabaseName(dbName: dbName)
            guard let mDb: Database = dbDict[mDbName] else {
                let msg = "Connection to \(mDbName) not available"
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
                    let msg: String = "\(error)"
                    throw CapacitorSQLiteError.failed(message: msg)
                }
            } else {
                let msg = "Database \(mDbName) not opened"
                throw CapacitorSQLiteError.failed(message: msg)
            }
        } else {
            throw CapacitorSQLiteError.failed(message: initMessage)
        }
    }

    // MARK: - isDBExists

    @objc func isDBExists(_ dbName: String) throws -> NSNumber {
        if isInit {
            let mDbName = CapacitorSQLite.getDatabaseName(dbName: dbName)
            guard let _: Database = dbDict[mDbName] else {
                let msg = "Connection to \(mDbName) not available"
                throw CapacitorSQLiteError.failed(message: msg)
            }
            let res: Bool = UtilsFile
                .isFileExist(databaseLocation: databaseLocation,
                             fileName: "\(mDbName)SQLite.db")
            if res {
                return 1
            } else {
                return 0
            }
        } else {
            throw CapacitorSQLiteError.failed(message: initMessage)
        }
    }

    // MARK: - isDBOpen

    @objc func isDBOpen(_ dbName: String) throws -> NSNumber {
        if isInit {
            let mDbName = CapacitorSQLite.getDatabaseName(dbName: dbName)
            guard let mDb: Database = dbDict[mDbName] else {
                let msg = "Connection to \(mDbName) not available"
                throw CapacitorSQLiteError.failed(message: msg)
            }
            let isOpen: Bool = mDb.isDBOpen()
            if isOpen {
                return 1
            } else {
                return 0
            }
        } else {
            throw CapacitorSQLiteError.failed(message: initMessage)
        }
    }

    // MARK: - deleteDatabase

    @objc func deleteDatabase(_ dbName: String) throws {
        if isInit {
            let mDbName = CapacitorSQLite.getDatabaseName(dbName: dbName)
            guard let mDb: Database = dbDict[mDbName] else {
                let msg = "Connection to \(mDbName) not available"
                throw CapacitorSQLiteError.failed(message: msg)
            }

            do {
                if !mDb.isDBOpen() {
                    try mDb.open()
                }
                let res: Bool = try mDb.deleteDB(databaseName: "\(mDbName)SQLite.db")
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
                let msg: String = "\(error)"
                throw CapacitorSQLiteError.failed(message: msg)
            }
        } else {
            throw CapacitorSQLiteError.failed(message: initMessage)
        }
    }

    // MARK: - isJsonValid

    @objc func isJsonValid(_ parsingData: String) throws {
        if isInit {
            if let data = ("["+parsingData+"]").data(using: .utf8) {
                do {
                    _ = try JSONDecoder().decode([JsonSQLite].self,
                                                 from: data)
                    return
                } catch let error {
                    let msg: String = "\(error)"
                    throw CapacitorSQLiteError.failed(message: msg)
                }
            } else {
                let msg: String = "Stringify Json Object not Valid"
                throw CapacitorSQLiteError.failed(message: msg)
            }
        } else {
            throw CapacitorSQLiteError.failed(message: initMessage)
        }
    }

    // MARK: - importFromJson

    // swiftlint:disable function_body_length
    @objc func importFromJson(_ parsingData: String)
    throws -> [String: Int] {
        if isInit {
            var mDb: Database
            if let data = ("["+parsingData+"]").data(using: .utf8) {
                var jsonSQLite: [JsonSQLite]
                do {
                    jsonSQLite = try JSONDecoder()
                        .decode([JsonSQLite].self, from: data)
                } catch let error {
                    var msg: String = "Stringify Json Object not Valid "
                    msg.append("\(error)")
                    throw CapacitorSQLiteError.failed(message: msg)
                }
                let encrypted: Bool = jsonSQLite[0].encrypted
                let inMode: String = encrypted ? "secret"
                    : "no-encryption"
                let version: Int = jsonSQLite[0].version
                var dbName: String = CapacitorSQLite.getDatabaseName(dbName: jsonSQLite[0].database)
                dbName.append("SQLite.db")
                // open the database
                do {
                    mDb = try Database(
                        databaseLocation: databaseLocation,
                        databaseName: dbName, encrypted: encrypted,
                        mode: inMode, version: version, vUpgDict: [:])
                    try mDb.open()
                } catch DatabaseError.open(let message) {
                    throw CapacitorSQLiteError.failed(message: message)
                } catch let error {
                    let msg: String = "\(error)"
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
                } catch DatabaseError.importFromJson(let message) {
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
            } else {
                let msg: String = "Stringify Json Object not Valid"
                throw CapacitorSQLiteError.failed(message: msg)
            }
        } else {
            throw CapacitorSQLiteError.failed(message: initMessage)
        }
    }
    // swiftlint:enable function_body_length

    // MARK: - exportToJson

    @objc func exportToJson(_ dbName: String, expMode: String)
    throws -> [String: Any] {
        if isInit {
            let mDbName = CapacitorSQLite.getDatabaseName(dbName: dbName)
            guard let mDb: Database = dbDict[mDbName] else {
                let msg = "Connection to \(mDbName) not available"
                throw CapacitorSQLiteError.failed(message: msg)
            }
            if mDb.isDBOpen() {

                do {
                    let res: [String: Any] = try
                        mDb.exportToJson(expMode: expMode)
                    if res.count == 5 || res.count == 6 {
                        return res
                    } else {
                        var msg: String = "return Object is not a "
                        msg.append("JsonSQLite  Object")
                        throw CapacitorSQLiteError.failed(message: msg)
                    }
                } catch DatabaseError.exportToJson(let message) {
                    throw CapacitorSQLiteError.failed(message: message)
                } catch let error {
                    let msg: String = "\(error)"
                    throw CapacitorSQLiteError.failed(message: msg)
                }
            } else {
                let msg = "Database \(mDbName) not opened"
                throw CapacitorSQLiteError.failed(message: msg)
            }
        } else {
            throw CapacitorSQLiteError.failed(message: initMessage)
        }
    }

    // MARK: - createSyncTable

    @objc func createSyncTable(_ dbName: String) throws -> NSNumber {
        if isInit {
            let mDbName = CapacitorSQLite.getDatabaseName(dbName: dbName)
            guard let mDb: Database = dbDict[mDbName] else {
                let msg = "Connection to \(mDbName) not available"
                throw CapacitorSQLiteError.failed(message: msg)
            }
            if mDb.isDBOpen() {
                do {
                    let res: Int = try mDb.createSyncTable()
                    return res as NSNumber
                } catch DatabaseError.createSyncTable(let message) {
                    throw CapacitorSQLiteError.failed(message: message)
                } catch let error {
                    let msg: String = "\(error)"
                    throw CapacitorSQLiteError.failed(message: msg)
                }
            } else {
                let msg = "Database \(mDbName) not opened"
                throw CapacitorSQLiteError.failed(message: msg)
            }
        } else {
            throw CapacitorSQLiteError.failed(message: initMessage)
        }
    }

    // MARK: - setSyncDate

    @objc func setSyncDate(_ dbName: String, syncDate: String)
    throws {
        if isInit {
            let mDbName = CapacitorSQLite.getDatabaseName(dbName: dbName)
            guard let mDb: Database = dbDict[mDbName] else {
                let msg = "Connection to \(mDbName) not available"
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
                    let msg: String = "\(error)"
                    throw CapacitorSQLiteError.failed(message: msg)
                }
            } else {
                let msg = "Database \(mDbName) not opened"
                throw CapacitorSQLiteError.failed(message: msg)
            }
        } else {
            throw CapacitorSQLiteError.failed(message: initMessage)
        }
    }

    // MARK: - getSyncDate

    @objc func getSyncDate(_ dbName: String) throws -> NSNumber {
        if isInit {
            let mDbName = CapacitorSQLite.getDatabaseName(dbName: dbName)
            guard let mDb: Database = dbDict[mDbName] else {
                let msg = "Connection to \(mDbName) not available"
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
                    let msg: String = "\(error)"
                    throw CapacitorSQLiteError.failed(message: msg)
                }
            } else {
                let msg = "Database \(mDbName) not opened"
                throw CapacitorSQLiteError.failed(message: msg)
            }
        } else {
            throw CapacitorSQLiteError.failed(message: initMessage)
        }
    }

    // MARK: - addUpgradeStatement

    @objc func addUpgradeStatement(_ dbName: String,
                                   upgrade: [[String: Any]])
    throws -> [Int: [String: Any]] {
        if isInit {
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
        } else {
            throw CapacitorSQLiteError.failed(message: initMessage)
        }
    }

    // MARK: - copyFromAssets

    @objc func copyFromAssets(overwrite: Bool) throws {
        if isInit {

            // check if the assets/database folder exists
            do {
                let assetsDbPath: URL = try
                    UtilsFile.getAssetsDatabasesPath()
                let aPath: String = assetsDbPath.path
                let bRes: Bool = UtilsFile.isDirExist(dirPath: aPath)
                if bRes {
                    // get the database files from assets
                    let dbList: [String] = try UtilsFile
                        .getFileList(path: aPath, ext: ".db")
                    // loop through the database files
                    for mDb in dbList {
                        // for each check if the suffix SQLite.db is there
                        // or add it
                        let toDb: String = UtilsFile
                            .setPathSuffix(sDb: mDb)
                        // for each copy the file to the Application
                        // database folder
                        _ = try UtilsFile
                            .copyFromAssetToDatabase(databaseLocation: databaseLocation,
                                                     fromDb: mDb,
                                                     toDb: toDb, overwrite: overwrite)
                    }
                    // get the zip files
                    let zipList: [String] = try UtilsFile
                        .getFileList(path: aPath, ext: ".zip")
                    // loop through the database files
                    for zip in zipList {
                        // for each zip uncompress the file to the Application
                        // database folder
                        _ = try UtilsFile
                            .unzipFromAssetToDatabase(databaseLocation: databaseLocation,
                                                      zip: zip, overwrite: overwrite)
                    }
                    return
                } else {
                    let msg: String = "assets database path does not exist"
                    throw CapacitorSQLiteError.failed(message: msg)
                }
            } catch UtilsFileError.copyFromAssetToDatabaseFailed(let message) {
                throw CapacitorSQLiteError.failed(message: message)
            } catch UtilsFileError.unzipFromAssetToDatabaseFailed(let message) {
                throw CapacitorSQLiteError.failed(message: message)
            } catch let error {
                let msg: String = "\(error)"
                throw CapacitorSQLiteError.failed(message: msg)
            }
        } else {
            throw CapacitorSQLiteError.failed(message: initMessage)
        }
    }

    // MARK: - getDatabaseList

    @objc func getDatabaseList() throws -> [String] {
        if isInit {
            do {
                let aPath: String = try (UtilsFile.getFolderURL(folderPath: databaseLocation)).path
                // get the database files
                let dbList: [String] = try UtilsFile.getFileList(path: aPath, ext: ".db")
                return dbList

            } catch let error {
                let msg: String = "\(error)"
                throw CapacitorSQLiteError.failed(message: msg)
            }
        } else {
            throw CapacitorSQLiteError.failed(message: initMessage)
        }
    }

    // MARK: - getMigratableDbList

    @objc func getMigratableDbList(_ folderPath: String) throws -> [String] {
        if isInit {
            do {
                let dbList: [String] = try UtilsMigrate
                    .getMigratableList(folderPath: folderPath)
                return dbList

            } catch UtilsMigrateError.getMigratableList(let message) {
                var msg: String = "getMigratableList:"
                msg.append(" \(message)")
                throw CapacitorSQLiteError.failed(message: msg)
            } catch let error {
                let msg: String = "\(error)"
                throw CapacitorSQLiteError.failed(message: msg)
            }
        } else {
            throw CapacitorSQLiteError.failed(message: initMessage)
        }
    }

    // MARK: - addSQLiteSuffix

    @objc func addSQLiteSuffix(_ folderPath: String, dbList: [String]) throws {
        if isInit {
            do {
                try UtilsMigrate.addSQLiteSuffix(databaseLocation: databaseLocation,
                                                 folderPath: folderPath,
                                                 dbList: dbList)
                return
            } catch UtilsMigrateError.addSQLiteSuffix(let message) {
                var msg: String = "addSQLiteSuffix:"
                msg.append(" \(message)")
                throw CapacitorSQLiteError.failed(message: msg)

            } catch let error {
                var msg: String = "addSQLiteSuffix:"
                msg.append(" \(error)")
                throw CapacitorSQLiteError.failed(message: msg)
            }
        } else {
            throw CapacitorSQLiteError.failed(message: initMessage)
        }
    }

    // MARK: - deleteOldDatabases

    @objc func deleteOldDatabases(_ folderPath: String, dbList: [String]) throws {
        if isInit {
            do {
                try UtilsMigrate
                    .deleteOldDatabases(folderPath: folderPath, dbList: dbList)
                return
            } catch UtilsMigrateError.deleteOldDatabases(let message) {
                var msg: String = "deleteOldDatabases:"
                msg.append(" \(message)")
                throw CapacitorSQLiteError.failed(message: msg)

            } catch let error {
                var msg: String = "deleteOldDatabases:"
                msg.append(" \(error)")
                throw CapacitorSQLiteError.failed(message: msg)
            }
        } else {
            throw CapacitorSQLiteError.failed(message: initMessage)
        }
    }
    class func getDatabaseName(dbName: String) -> String {
        var retName: String = dbName
        if !retName.contains("/") {
            if retName.suffix(3) == ".db" {
                retName = String(retName.dropLast(3))
            }
        }
        return retName
    }

    func closeAllConnections() throws {
        let keys: [String] = Array(self.dbDict.keys)

        for key in keys {
            guard let mDb: Database = dbDict[key] else {
                let msg = "Connection to \(key) not available"
                throw CapacitorSQLiteError.failed(message: msg)
            }
            if mDb.isDBOpen() {
                do {
                    try mDb.close()
                } catch DatabaseError.close(let message) {
                    throw CapacitorSQLiteError.failed(message: message)
                }
            }
            dbDict.removeValue(forKey: key)
        }
        return
    }
}
// swiftlint:enable type_body_length
// swiftlint:enable file_length
