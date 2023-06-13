import Foundation
import Capacitor

enum CapacitorSQLiteError: Error {
    case failed(message: String)
}
// swiftlint:disable file_length
// swiftlint:disable type_body_length
@objc public class CapacitorSQLite: NSObject {
    private var config: SqliteConfig
    private var dbDict: [String: Database] = [:]
    private var databaseLocation: String = "Documents"
    private let retHandler: ReturnHandler = ReturnHandler()
    private var initMessage: String = ""
    private var isInit: Bool = false
    private var isEncryption: Bool = true
    private var isBiometricAuth: Bool = false
    private var biometricTitle: String = ""
    private var bioIdAuth: BiometricIDAuthentication =
        BiometricIDAuthentication()
    private var authMessage: String = ""
    private var internalBiometricObserver: Any?
    private var intBioMessage: String = ""
    private var call: CAPPluginCall?
    private var account: String = oldAccount
    private var prefixKeychain: String = ""

    // swiftlint:disable function_body_length
    // swiftlint:disable cyclomatic_complexity
    // swiftlint:disable no_space_in_method_call
    init(config: SqliteConfig) {
        self.config = config
        super.init()

        if let isEncrypt = config.iosIsEncryption {
            if isEncrypt == 0 {
                isEncryption = false
            }
        }
        if isEncryption {
            if let kcPrefix: String = config.iosKeychainPrefix {
                account = "\(kcPrefix)_\(oldAccount)"
                prefixKeychain = kcPrefix
            }
            if let isBioAuth = config.biometricAuth {
                if isBioAuth == 1 {
                    if let bTitle = config.biometricTitle {
                        biometricTitle = bTitle
                        bioIdAuth.biometricTitle = bTitle
                    }
                    do {
                        let bioType: BiometricType = try
                            bioIdAuth.biometricType()
                        if bioType == BiometricType.faceID ||
                            bioType == BiometricType.touchID {
                            isBiometricAuth = true
                            isInit = true
                            bioIdAuth.authenticateUser { [weak self] message in
                                if let message = message {
                                    self?.notifyBiometricEvents(name: .biometricEvent,
                                                                result: false,
                                                                msg: message)
                                } else {
                                    self?.notifyBiometricEvents(name: .biometricEvent,
                                                                result: true,
                                                                msg: "")
                                }
                            }
                        } else {
                            self.notifyBiometricEvents(name: .biometricEvent,
                                                       result: false,
                                                       msg: "Biometric not set-up")
                        }
                    } catch BiometricIDAuthenticationError
                                .biometricType(let message) {
                        initMessage =  message
                    } catch let error {
                        initMessage = "Init Plugin failed :"
                        initMessage.append(" \(error.localizedDescription)")
                    }
                }
            }
        }
        if let dbLocation = config.iosDatabaseLocation {
            self.databaseLocation = dbLocation
            // create the databaseLocation directory
            do {
                try UtilsFile.createDatabaseLocation(location: dbLocation)
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
    }
    // swiftlint:enable no_space_in_method_call
    // swiftlint:enable cyclomatic_complexity
    // swiftlint:enable function_body_length

    // MARK: - Echo

    @objc public func echo(_ value: String) -> String {
        return value
    }

    // MARK: - IsSecretStored

    @objc public func isSecretStored()  throws -> NSNumber {
        if isInit {
            if isEncryption {
                do {
                    let isSecretExists: Bool = try UtilsSecret.isPassphrase(
                        account: account)
                    if isSecretExists {
                        return 1
                    } else {
                        return 0
                    }
                } catch UtilsSecretError.prefixPassphrase(let message) {
                    throw CapacitorSQLiteError.failed(message: message)
                }
            } else {
                throw CapacitorSQLiteError.failed(message: "No Encryption set in capacitor.config")
            }
        } else {
            throw CapacitorSQLiteError.failed(message: initMessage)
        }
    }

    // MARK: - SetEncryptionSecret

    @objc public func setEncryptionSecret(passphrase: String) throws {
        if isInit {
            if isEncryption {
                do {
                    // close all connections
                    try closeAllConnections()
                    // set encryption secret
                    try UtilsSecret
                        .setEncryptionSecret(prefix: prefixKeychain,
                                             passphrase: passphrase,
                                             databaseLocation: databaseLocation)
                    return
                } catch UtilsSecretError.setEncryptionSecret(let message) {
                    throw CapacitorSQLiteError.failed(message: message)
                } catch let error {
                    throw CapacitorSQLiteError.failed(message: "\(error)")
                }
            } else {
                throw CapacitorSQLiteError.failed(message: "No Encryption set in capacitor.config")
            }
        } else {
            throw CapacitorSQLiteError.failed(message: initMessage)
        }
    }

    // MARK: - ChangeEncryptionSecret

    // swiftlint:disable function_body_length
    // swiftlint:disable no_space_in_method_call
    @objc public func changeEncryptionSecret(call: CAPPluginCall, passphrase: String,
                                             oldPassphrase: String) throws {
        if isInit {
            if isEncryption {
                self.call = call
                let retHandler: ReturnHandler = ReturnHandler()
                do {
                    // close all connections
                    try closeAllConnections()
                    if isBiometricAuth {
                        let dbLocation = databaseLocation
                        let mPrefixKeychain = prefixKeychain
                        bioIdAuth.authenticateUser { [weak self] message in
                            if let message = message {
                                self?.intBioMessage = message
                                return
                            } else {
                                do {
                                    try UtilsSecret.changeEncryptionSecret(
                                        prefix: mPrefixKeychain,
                                        passphrase: passphrase,
                                        oldPassphrase: oldPassphrase,
                                        databaseLocation: dbLocation)
                                    retHandler.rResult(call: call)
                                    return
                                } catch UtilsSecretError.changeEncryptionSecret(let message) {
                                    let msg = "ChangeEncryptionSecret: \(message)"
                                    retHandler.rResult(call: call, message: msg)
                                    return
                                } catch let error {
                                    retHandler.rResult(
                                        call: call,
                                        message: "ChangeEncryptionSecret: \(error.localizedDescription)")
                                    return
                                }
                            }
                        }
                    } else {
                        // set encryption secret
                        try UtilsSecret
                            .changeEncryptionSecret(prefix: prefixKeychain,
                                                    passphrase: passphrase,
                                                    oldPassphrase: oldPassphrase,
                                                    databaseLocation: databaseLocation)
                        retHandler.rResult(call: call)
                        return
                    }
                } catch UtilsSecretError.changeEncryptionSecret(let message) {
                    let msg = "ChangeEncryptionSecret: \(message)"
                    retHandler.rResult(call: call, message: msg)
                    return
                } catch let error {
                    retHandler.rResult(
                        call: call,
                        message: "ChangeEncryptionSecret: \(error.localizedDescription)")
                    return
                }
            } else {
                throw CapacitorSQLiteError.failed(message: "No Encryption set in capacitor.config")
            }
        } else {
            throw CapacitorSQLiteError.failed(message: initMessage)
        }

    }
    // swiftlint:enable no_space_in_method_call
    // swiftlint:enable function_body_length

    // MARK: - ClearEncryptionSecret

    @objc public func clearEncryptionSecret() throws {
        if isInit {
            if isEncryption {
                do {
                    // close all connections
                    try closeAllConnections()
                    // set encryption secret
                    try UtilsSecret
                        .clearEncryptionSecret(prefix: prefixKeychain,
                                               databaseLocation: databaseLocation)
                    return
                } catch UtilsSecretError.clearEncryptionSecret(let message) {
                    throw CapacitorSQLiteError.failed(message: message)
                } catch let error {
                    throw CapacitorSQLiteError.failed(message: "\(error)")
                }
            } else {
                throw CapacitorSQLiteError.failed(message: "No Encryption set in capacitor.config")
            }
        } else {
            throw CapacitorSQLiteError.failed(message: initMessage)
        }
    }

    // MARK: - CheckEncryptionSecret

    @objc public func checkEncryptionSecret(passphrase: String) throws ->  NSNumber {
        if isInit {
            if isEncryption {
                do {
                    // close all connections
                    try closeAllConnections()
                    // check encryption secret
                    let res: NSNumber = try UtilsSecret
                        .checkEncryptionSecret(prefix: prefixKeychain,
                                               passphrase: passphrase)
                    return res
                } catch UtilsSecretError.checkEncryptionSecret(let message) {
                    throw CapacitorSQLiteError.failed(message: message)
                } catch let error {
                    throw CapacitorSQLiteError.failed(message: "\(error)")
                }
            } else {
                throw CapacitorSQLiteError.failed(message: "No Encryption set in capacitor.config")
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
            let connName: String = "RO_\(databasePath)"
            let conn = dbDict[connName]
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
                    encrypted: false, isEncryption: isEncryption, account: account,
                    mode: "no-encryption", version: version, readonly: true,
                    vUpgDict: [:])
                dbDict[connName] = mDb
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
            let connName: String = "RO_\(dbName)"
            guard let mDb: Database = dbDict[connName] else {
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
            dbDict.removeValue(forKey: connName)
            return
        } else {
            throw CapacitorSQLiteError.failed(message: initMessage)
        }
    }

    // MARK: - CreateConnection

    // swiftlint:disable function_parameter_count
    @objc public func createConnection(_ dbName: String,
                                       encrypted: Bool,
                                       mode: String,
                                       version: Int,
                                       vUpgDict: [Int: [String: Any]],
                                       readonly: Bool) throws {
        if isInit {
            let mDbName = CapacitorSQLite.getDatabaseName(dbName: dbName)
            // check if the connection already exists
            let connName: String = readonly ? "RO_\(mDbName)" : "RW_\(mDbName)"
            let conn = dbDict[connName]
            if conn != nil {
                let msg = "Connection \(mDbName) already exists"
                throw CapacitorSQLiteError.failed(message: msg)
            }
            if encrypted && !isEncryption {
                let msg = "Database cannot be encrypted as 'No Encryption' set in capacitor.config"
                throw CapacitorSQLiteError.failed(message: msg)
            }
            do {
                let mDb: Database = try Database(
                    databaseLocation: databaseLocation,
                    databaseName: "\(mDbName)SQLite.db",
                    encrypted: encrypted, isEncryption: isEncryption, account: account,
                    mode: mode, version: version, readonly: readonly,
                    vUpgDict: vUpgDict)

                dbDict[connName] = mDb
                return
            } catch let error {
                throw CapacitorSQLiteError.failed(message: "\(error)")
            }
        } else {
            throw CapacitorSQLiteError.failed(message: initMessage)
        }
    }
    // swiftlint:enable function_parameter_count

    // MARK: - Open

    @objc public func open(_ dbName: String, readonly: Bool) throws {
        if isInit {
            let mDbName = CapacitorSQLite.getDatabaseName(dbName: dbName)
            let connName: String = readonly ? "RO_\(mDbName)" : "RW_\(mDbName)"
            guard let mDb: Database = dbDict[connName] else {
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

    @objc public func close(_ dbName: String, readonly: Bool) throws {
        if isInit {
            let mDbName = CapacitorSQLite.getDatabaseName(dbName: dbName)
            let connName: String = readonly ? "RO_\(mDbName)" : "RW_\(mDbName)"
            guard let mDb: Database = dbDict[connName] else {
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

    @objc public func getUrl(_ dbName: String, readonly: Bool) throws -> String {
        if isInit {
            let mDbName = CapacitorSQLite.getDatabaseName(dbName: dbName)
            let connName: String = readonly ? "RO_\(mDbName)" : "RW_\(mDbName)"
            guard let mDb: Database = dbDict[connName] else {
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

    @objc public func getVersion(_ dbName: String, readonly: Bool)
    throws ->  NSNumber {
        if isInit {
            let mDbName = CapacitorSQLite.getDatabaseName(dbName: dbName)
            let connName: String = readonly ? "RO_\(mDbName)" : "RW_\(mDbName)"
            guard let mDb: Database = dbDict[connName] else {
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

    // MARK: - GetFromHTTPRequest

    @objc public func getFromHTTPRequest(_ call: CAPPluginCall, url: String) throws {
        if isInit {

            UtilsDownloadFromHTTP.download(databaseLocation: databaseLocation,
                                           url: url) { ( result) in
                switch result {
                case .success(_):
                    self.retHandler.rResult(call: call)
                    return
                case .failure(let error):

                    if error == .downloadFromHTTPFailed {
                        let msg = "Download from HTTP failed"
                        self.retHandler.rResult(call: call, message: msg)
                        return
                    }

                }

            }
        } else {
            throw CapacitorSQLiteError.failed(message: initMessage)
        }
    }

    // MARK: - Close Connection

    @objc public func closeConnection(_ dbName: String, readonly: Bool) throws {
        if isInit {
            let mDbName = CapacitorSQLite.getDatabaseName(dbName: dbName)
            let connName: String = readonly ? "RO_\(mDbName)" : "RW_\(mDbName)"
            guard let mDb: Database = dbDict[connName] else {
                return
            }
            if mDb.isDBOpen() {
                do {
                    try mDb.close()
                } catch DatabaseError.close(let message) {
                    throw CapacitorSQLiteError.failed(message: message)
                }
            }
            dbDict.removeValue(forKey: connName)
            return
        } else {
            throw CapacitorSQLiteError.failed(message: initMessage)
        }
    }

    // MARK: - CheckConnectionsConsistency

    @objc public func checkConnectionsConsistency(_ dbNames: [String],
                                                  openModes: [String])
    throws ->  NSNumber {
        if isInit {
            var keys: [String] = Array(self.dbDict.keys)
            var idx: Int = 0
            var conns: [String] = []
            for name in dbNames {
                conns.append("\(openModes[idx])_\(name)")
                idx += 1
            }
            do {
                if conns.count == 0 {
                    try closeAllConnections()
                    return 0
                }
                if keys.count < conns.count {
                    // not solvable inconsistency
                    try closeAllConnections()
                    return 0
                }
                if keys.count > conns.count {
                    for key in keys {
                        if !conns.contains(key) {
                            self.dbDict.removeValue(forKey: key)
                        }
                    }
                }
                keys = Array(self.dbDict.keys)
                if keys.count == conns.count {
                    let set1 = Set(keys)
                    let set2 = Set(conns)
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

    // MARK: - IsDatabaseEncrypted

    @objc public func isDatabaseEncrypted(_ dbName: String) throws -> NSNumber {
        if isInit {
            let mDbName = CapacitorSQLite.getDatabaseName(dbName: dbName)
            let isFileExists: Bool = UtilsFile
                .isFileExist(databaseLocation: databaseLocation,
                             fileName: mDbName + "SQLite.db")
            if isFileExists {
                let state: State = UtilsSQLCipher
                    .getDatabaseState(databaseLocation: databaseLocation,
                                      databaseName: mDbName + "SQLite.db",
                                      account: account)
                if state.rawValue == "ENCRYPTEDGLOBALSECRET" || state.rawValue == "ENCRYPTEDSECRET" {
                    return 1
                }
                if state.rawValue == "UNENCRYPTED" {
                    return 0
                }
                throw CapacitorSQLiteError.failed(message: "Database unknown")
            } else {
                throw CapacitorSQLiteError.failed(message: "Database does not exist")
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

    @objc public func isTableExists(_ dbName: String, tableName: String,
                                    readonly: Bool) throws -> NSNumber {
        if isInit {
            let mDbName = CapacitorSQLite.getDatabaseName(dbName: dbName)
            let connName: String = readonly ? "RO_\(mDbName)" : "RW_\(mDbName)"
            guard let mDb: Database = dbDict[connName] else {
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
                              transaction: Bool, readonly: Bool)
    throws -> [String: Any] {
        if isInit {
            let mDbName = CapacitorSQLite.getDatabaseName(dbName: dbName)
            let connName: String = "RW_\(mDbName)"
            guard let mDb: Database = dbDict[connName] else {
                let msg = "Connection to \(mDbName) not available"
                throw CapacitorSQLiteError.failed(message: msg)
            }
            if readonly {
                let msg = "not allowed in read-only mode"
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
                          transaction: Bool, readonly: Bool)
    throws -> [String: Any] {
        if isInit {
            let mDbName = CapacitorSQLite.getDatabaseName(dbName: dbName)
            let connName: String = "RW_\(mDbName)"
            guard let mDb: Database = dbDict[connName] else {
                let msg = "Connection to \(mDbName) not available"
                throw CapacitorSQLiteError.failed(message: msg)
            }
            if readonly {
                let msg = "not allowed in read-only mode"
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

    // swiftlint:disable function_body_length
    // swiftlint:disable cyclomatic_complexity
    @objc func run(_ dbName: String, statement: String, values: [Any],
                   transaction: Bool, readonly: Bool)
    throws -> [String: Any] {
        if isInit {
            let mDbName = CapacitorSQLite.getDatabaseName(dbName: dbName)
            let connName: String = "RW_\(mDbName)"
            guard let mDb: Database = dbDict[connName] else {
                let msg = "Connection to \(mDbName) not available"
                throw CapacitorSQLiteError.failed(message: msg)
            }
            if readonly {
                let msg = "not allowed in read-only mode"
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
                            } else if let obj = value as? [String: Any] {
                                if var keys = Array(obj.keys) as? [String] {
                                    if #available(iOS 15.0, *) {
                                        keys.sort(using: .localizedStandard)
                                        var valuesArr: [UInt8] = []
                                        for key in keys {
                                            if let mVal = obj[key] {
                                                if let iVal = mVal as? Int {
                                                    valuesArr.append(UInt8(iVal))
                                                } else {
                                                    let msg: String = "Error in reading buffer"
                                                    throw CapacitorSQLiteError.failed(message: msg)
                                                }
                                            } else {
                                                let msg: String = "Error in reading buffer"
                                                throw CapacitorSQLiteError.failed(message: msg)
                                            }
                                        }
                                        val.append(valuesArr)
                                    } else {
                                        let msg: String = "Error buffer sorted not implemented"
                                        throw CapacitorSQLiteError.failed(message: msg)

                                    }
                                }
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
    // swiftlint:enable function_body_length

    // MARK: - Query

    @objc func query(_ dbName: String, statement: String,
                     values: [Any], readonly: Bool) throws -> [[String: Any]] {
        if isInit {
            let mDbName = CapacitorSQLite.getDatabaseName(dbName: dbName)
            let connName: String = readonly ? "RO_\(mDbName)" : "RW_\(mDbName)"
            guard let mDb: Database = dbDict[connName] else {
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

    @objc func isDBExists(_ dbName: String, readonly: Bool) throws -> NSNumber {
        if isInit {
            let mDbName = CapacitorSQLite.getDatabaseName(dbName: dbName)
            let connName: String = readonly ? "RO_\(mDbName)" : "RW_\(mDbName)"
            guard let _: Database = dbDict[connName] else {
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

    @objc func isDBOpen(_ dbName: String, readonly: Bool) throws -> NSNumber {
        if isInit {
            let mDbName = CapacitorSQLite.getDatabaseName(dbName: dbName)
            let connName: String = readonly ? "RO_\(mDbName)" : "RW_\(mDbName)"
            guard let mDb: Database = dbDict[connName] else {
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

    // swiftlint:disable function_body_length
    // swiftlint:disable cyclomatic_complexity
    @objc func deleteDatabase(_ dbName: String, readonly: Bool) throws {
        if isInit {
            let mDbName = CapacitorSQLite.getDatabaseName(dbName: dbName)
            let connName: String = "RW_\(mDbName)"
            guard let mDb: Database = dbDict[connName] else {
                let msg = "Connection to \(mDbName) not available"
                throw CapacitorSQLiteError.failed(message: msg)
            }
            if readonly {
                let msg = "not allowed in read-only mode"
                throw CapacitorSQLiteError.failed(message: msg)
            }
            do {
                if !mDb.isDBOpen() {
                    // check the state of the DB
                    let state: State = UtilsSQLCipher.getDatabaseState(databaseLocation: databaseLocation, databaseName: "\(mDbName)SQLite.db", account: account)
                    if !isEncryption &&  (state.rawValue == "ENCRYPTEDGLOBALSECRET" ||
                                            state.rawValue == "ENCRYPTEDSECRET") {
                        var msg = "Cannot delete an Encrypted database with "
                        msg += "No Encryption set in capacitor.config"
                        throw CapacitorSQLiteError.failed(message: msg)
                    } else if state.rawValue == "UNENCRYPTED" {
                        do {
                            try UtilsSQLCipher.deleteDB(databaseLocation: databaseLocation,
                                                        databaseName: "\(mDbName)SQLite.db")
                            return
                        } catch UtilsSQLCipherError.deleteDB(let message ) {
                            throw CapacitorSQLiteError.failed(message: message)
                        }

                    } else {
                        try mDb.open()
                    }
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
    // swiftlint:enable cyclomatic_complexity
    // swiftlint:enable function_body_length

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
    // swiftlint:disable cyclomatic_complexity
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
                var overwrite: Bool = false
                if let mOverwrite = jsonSQLite[0].overwrite {
                    overwrite = mOverwrite
                }
                let mode: String = jsonSQLite[0].mode
                let inMode: String = encrypted ? "secret"
                    : "no-encryption"
                let version: Int = jsonSQLite[0].version
                var dbName: String = CapacitorSQLite.getDatabaseName(
                    dbName: jsonSQLite[0].database
                )
                dbName.append("SQLite.db")
                // open the database
                do {
                    mDb = try Database(
                        databaseLocation: databaseLocation, databaseName: dbName,
                        encrypted: encrypted, isEncryption: isEncryption,
                        account: account,
                        mode: inMode, version: version, readonly: false,
                        vUpgDict: [:])
                    if overwrite && mode == "full" {
                        let isExists = UtilsFile
                            .isFileExist(databaseLocation: databaseLocation,
                                         fileName: dbName)
                        if isExists {
                            _ = try UtilsFile
                                .deleteFile(fileName: dbName,
                                            databaseLocation: databaseLocation)
                        }
                    }
                    try mDb.open()
                } catch UtilsFileError.deleteFileFailed {
                    let message = "Delete Database failed"
                    throw CapacitorSQLiteError.failed(message: message)
                } catch DatabaseError.open(let message) {
                    throw CapacitorSQLiteError.failed(message: message)
                } catch let error {
                    let msg: String = "\(error)"
                    throw CapacitorSQLiteError.failed(message: msg)
                }
                // check if the database as some tables
                do {
                    let tableList: [String] = try mDb.getTableNames()
                    if mode == "full" && tableList.count > 0 {
                        let curVersion = try mDb.getVersion()
                        if version < curVersion {
                            var msg: String = "ImportFromJson: Cannot import a "
                            msg += "version lower than \(curVersion)"
                            throw CapacitorSQLiteError.failed(message: msg)
                        }
                        if curVersion == version {
                            var res: [String: Int] = [:]
                            res["changes"] = 0
                            return res
                        }
                    }

                } catch DatabaseError.getTableNames(let message) {
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
    // swiftlint:enable cyclomatic_complexity
    // swiftlint:enable function_body_length

    // MARK: - exportToJson

    @objc func exportToJson(_ dbName: String, expMode: String, readonly: Bool)
    throws -> [String: Any] {
        if isInit {
            let mDbName = CapacitorSQLite.getDatabaseName(dbName: dbName)
            let connName: String = readonly ? "RO_\(mDbName)" : "RW_\(mDbName)"
            guard let mDb: Database = dbDict[connName] else {
                let msg = "Connection to \(mDbName) not available"
                throw CapacitorSQLiteError.failed(message: msg)
            }
            if mDb.isDBOpen() {

                do {
                    let res: [String: Any] = try
                        mDb.exportToJson(expMode: expMode)
                    if res.count == 0 {
                        var msg: String = "return Object is empty "
                        msg.append("No data to synchronize")
                        throw CapacitorSQLiteError.failed(message: msg)

                    } else if res.count == 5 || res.count == 6 ||
                                res.count == 7 {
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

    // MARK: - deleteExportedRows

    @objc func deleteExportedRows(_ dbName: String, readonly: Bool) throws {
        if isInit {
            let mDbName = CapacitorSQLite.getDatabaseName(dbName: dbName)
            let connName: String = "RW_\(mDbName)"
            guard let mDb: Database = dbDict[connName] else {
                let msg = "Connection to \(mDbName) not available"
                throw CapacitorSQLiteError.failed(message: msg)
            }
            if readonly {
                let msg = "not allowed in read-only mode"
                throw CapacitorSQLiteError.failed(message: msg)
            }
            if mDb.isDBOpen() {
                do {
                    try mDb.deleteExportedRows()
                } catch DatabaseError.deleteExportedRows(let message) {
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

    @objc func createSyncTable(_ dbName: String, readonly: Bool) throws -> NSNumber {
        if isInit {
            let mDbName = CapacitorSQLite.getDatabaseName(dbName: dbName)
            let connName: String = "RW_\(mDbName)"
            guard let mDb: Database = dbDict[connName] else {
                let msg = "Connection to \(mDbName) not available"
                throw CapacitorSQLiteError.failed(message: msg)
            }
            if readonly {
                let msg = "not allowed in read-only mode"
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

    @objc func setSyncDate(_ dbName: String, syncDate: String, readonly: Bool)
    throws {
        if isInit {
            let mDbName = CapacitorSQLite.getDatabaseName(dbName: dbName)
            let connName: String = "RW_\(mDbName)"
            guard let mDb: Database = dbDict[connName] else {
                let msg = "Connection to \(mDbName) not available"
                throw CapacitorSQLiteError.failed(message: msg)
            }
            if readonly {
                let msg = "not allowed in read-only mode"
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

    @objc func getSyncDate(_ dbName: String, readonly: Bool) throws -> NSNumber {
        if isInit {
            let mDbName = CapacitorSQLite.getDatabaseName(dbName: dbName)
            let connName: String = readonly ? "RO_\(mDbName)" : "RW_\(mDbName)"
            guard let mDb: Database = dbDict[connName] else {
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
            var upgVersionDict: [Int: [String: Any]] = [:]
            for dict in upgrade {
                let keys = dict.keys
                if !(keys.contains("toVersion")) || !(keys.contains("statements")) {
                    var msg: String = "upgrade must have keys in "
                    msg.append("{toVersion,statements}")
                    throw CapacitorSQLiteError.failed(message: msg)
                }
                for (key, value) in dict {
                    upgDict[key] = value
                }
                guard let toVersion = upgDict["toVersion"] as? Int else {
                    let msg: String = "toVersion key must be an Int"
                    throw CapacitorSQLiteError.failed(message: msg)
                }
                upgVersionDict[toVersion] =  upgDict
            }
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
                let assetsDbURL: URL = try
                    UtilsFile.getAssetsDatabasesPath()
                let aPath: String = assetsDbURL.path
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
                        _ = try UtilsFile.unzipToDatabase(
                            fromURL: assetsDbURL,
                            databaseLocation: databaseLocation,
                            zip: zip,
                            overwrite: overwrite)
                    }
                    return
                } else {
                    let msg: String = "assets database path does not exist"
                    throw CapacitorSQLiteError.failed(message: msg)
                }
            } catch UtilsFileError.copyFromAssetToDatabaseFailed(let message) {
                throw CapacitorSQLiteError.failed(message: message)
            } catch UtilsFileError.unzipToDatabaseFailed(let message) {
                throw CapacitorSQLiteError.failed(message: message)
            } catch let error {
                let msg: String = "\(error)"
                throw CapacitorSQLiteError.failed(message: msg)
            }
        } else {
            throw CapacitorSQLiteError.failed(message: initMessage)
        }
    }

    // MARK: - getTableList

    @objc func getTableList(_ dbName: String, readonly: Bool)
    throws -> [String] {
        if isInit {
            let mDbName = CapacitorSQLite.getDatabaseName(dbName: dbName)
            let connName: String = readonly ? "RO_\(mDbName)" : "RW_\(mDbName)"
            guard let mDb: Database = dbDict[connName] else {
                let msg = "Connection to \(mDbName) not available"
                throw CapacitorSQLiteError.failed(message: msg)
            }
            if mDb.isDBOpen() {
                do {
                    let res: [String] = try mDb.getTableNames()
                    return res
                } catch DatabaseError.getTableNames(let message) {
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

    // MARK: - moveDatabasesAndAddSuffix

    @objc func moveDatabasesAndAddSuffix(_ folderPath: String, dbList: [String]) throws {
        if isInit {
            do {
                try UtilsMigrate
                    .moveDatabasesAndAddSuffix(databaseLocation: databaseLocation,
                                               folderPath: folderPath,
                                               dbList: dbList)
                return
            } catch UtilsMigrateError.moveDatabasesAndAddSuffix(let message) {
                var msg: String = "moveDatabasesAndAddSuffix:"
                msg.append(" \(message)")
                throw CapacitorSQLiteError.failed(message: msg)

            } catch let error {
                var msg: String = "moveDatabasesAndAddSuffix:"
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

    func notifyBiometricEvents(name: Notification.Name, result: Bool, msg: String) {
        var vId: [String: Any] = [:]
        vId["result"] = result
        if msg.count > 0 {
            vId["message"] = msg
        }
        NotificationCenter.default.post(name: name, object: nil,
                                        userInfo: vId)
    }

}
// swiftlint:enable type_body_length
// swiftlint:enable file_length
