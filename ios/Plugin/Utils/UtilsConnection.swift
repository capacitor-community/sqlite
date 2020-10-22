//
//  UtilsConnection.swift
//  CapacitorCommunitySqlite
//
//  Created by  Quéau Jean Pierre on 15/10/2020.
//

import Foundation

import SQLCipher

// swiftlint:disable type_body_length
class UtilsConnection {

    // MARK: - CreateConnection

    // swiftlint:disable file_length
    // swiftlint:disable function_parameter_count
    class func createConnection(
        dbHelper: DatabaseHelper, path: String, mode: String,
        encrypted: Bool, secret: String, newsecret: String,
        version: Int,
        versionUpgrades: [String: [Int: [String: Any]]]) -> String {

        var message: String = ""
        if !encrypted && mode == "no-encryption" {
            message = self.createConnectionNoEncryption(
                dbHelper: dbHelper, path: path, version: version,
                versionUpgrades: versionUpgrades)
        } else if encrypted && mode == "secret" && secret.count > 0 {
            message = self.createConnectionEncryptedWithSecret(
                dbHelper: dbHelper, path: path, version: version,
                versionUpgrades: versionUpgrades, secret: secret,
                newsecret: newsecret)
        } else if encrypted && mode == "newsecret" && secret.count > 0
                    && newsecret.count > 0 {
            message = self.createConnectionEncryptedWithNewSecret(
                dbHelper: dbHelper,
                path: path, secret: secret,
                newsecret: newsecret)
        } else if encrypted && mode == "encryption" &&
                                                    secret.count > 0 {
            message = self.makeEncryption(
                dbHelper: dbHelper, path: path,
                secret: secret)
        }
        return message
    }
    // swiftlint:enable function_parameter_count

    // MARK: - CheckVersion

    // swiftlint:disable function_body_length
    // swiftlint:disable function_parameter_count
    class func checkVersion(

        dbHelper: DatabaseHelper, mDB: OpaquePointer, dbName: String,
        version: Int, versionUpgrades: [String: [Int: [String: Any]]],
        utilsUpgrade: UtilsUpgrade) -> String {
        var message: String = ""

        do {
            // check version and backup the database
            let curVersion: Int = try self.checkVersionAndBackup(
                dbHelper: dbHelper, mDB: mDB, dbName: dbName,
                version: version, versionUpgrades: versionUpgrades,
                utilsUpgrade: utilsUpgrade)
            if curVersion > 0 && curVersion != version {
                // version not ok -> upgrade
                _ = try utilsUpgrade.onUpgrade(
                    dbHelper: dbHelper, mDB: mDB,
                    versionUpgrades: versionUpgrades, dbName: dbName,
                    currentVersion: curVersion,
                    targetVersion: version)
            }
        } catch {
            do {
                // failed -> restore the database 
                try dbHelper.restoreDB(databaseName: dbName)
                message = "init: Error Database upgrade version "
                message += "failed"
                message += " \(error.localizedDescription)"
            } catch {
                message = "init: Error Database upgrade version "
                message += "failed in restoring the database"
                message += " \(error.localizedDescription)"
            }
        }
        // Delete the backup file
        do {
            let filePath = try UtilsFile.getFilePath(
                                    fileName: "backup-\(dbName)")
            let isExist = UtilsFile.isFileExist(
                                    filePath: filePath)
            if isExist {
                let retB: Bool = try dbHelper.deleteDB(
                        databaseName: "backup-\(dbName)")
                if !retB {
                    message = "init: Error Database upgrade version "
                    message += "delete backup failed"
                }
            }
        } catch {
            message = "init: Error Database upgrade version failed"
            message += " \(error.localizedDescription)"

        }
        return message
    }
    // swiftlint:enable function_parameter_count
    // swiftlint:enable function_body_length

    // MARK: - CheckVersionAndBackup

    // swiftlint:disable function_parameter_count
    // swiftlint:disable function_body_length
    class func checkVersionAndBackup (
        dbHelper: DatabaseHelper, mDB: OpaquePointer, dbName: String,
        version: Int, versionUpgrades: [String: [Int: [String: Any]]],
        utilsUpgrade: UtilsUpgrade) throws -> Int {

        do {
            var curVersion: Int = try
                utilsUpgrade.getDatabaseVersion(
                    dbHelper: dbHelper, mDB: mDB)
            if curVersion <= 0 {
                let changes: Int = try
                    utilsUpgrade.updateDatabaseVersion(
                    dbHelper: dbHelper, mDB: mDB, newVersion: 1)
                if changes != -1 {
                    curVersion = try
                        utilsUpgrade.getDatabaseVersion(
                            dbHelper: dbHelper, mDB: mDB)
                }
            }
            if curVersion > 0 && curVersion != version {
                if version < curVersion {
                    var msg: String = "Error: checkVersion Database"
                    msg.append(" version \(version) lower than ")
                    msg.append("current version \(curVersion)")
                    throw UtilsSQLiteError
                        .checkVersionAndBackupFailed(message: msg)
                }
                guard let dbVUValues: [Int: [String: Any]] =
                        versionUpgrades[dbName] else {
                    var message: String = "Error: checkVersion No "
                    message.append("upgrade statement for database ")
                    message.append("\(dbName)")
                    throw UtilsSQLiteError.checkVersionAndBackupFailed(
                        message: message)
                }
                guard let upgrade: [String: Any] =
                        dbVUValues[curVersion] else {
                    var message: String = "Error: checkVersion No "
                    message.append("upgrade statement for database ")
                    message.append("\(dbName) ")
                    message.append("and version \(curVersion)")
                    throw UtilsSQLiteError.checkVersionAndBackupFailed(
                        message: message)
                }
                let keys: [String] = Array(upgrade.keys)
                if keys.count <= 0 {
                    var message: String = "Error: checkVersion No "
                    message.append("upgrade statement for database ")
                    message.append("\(dbName) ")
                    message.append("and version \(curVersion)")
                    throw UtilsSQLiteError.checkVersionAndBackupFailed(
                        message: message)
                }
                // backup the current database version

                let retB: Bool = try UtilsFile.copyFile(
                    fileName: dbName, toFileName: "backup-\(dbName)")
                if !retB {
                    var message: String = "Error: checkVersion copyFile "
                    message.append("backup-\(dbName) failed")
                    throw UtilsSQLiteError.checkVersionAndBackupFailed(
                        message: message)
                }
            }
            return curVersion
        } catch UtilsUpgradeError.getDatabaseVersionFailed(
                    let message) {
            throw UtilsSQLiteError.checkVersionFailed(message: message)
        } catch UtilsUpgradeError.updateDatabaseVersionFailed(
                    let message) {
            throw UtilsSQLiteError
                    .checkVersionAndBackupFailed(message: message)
        }
    }
    // swiftlint:enable function_body_length
    // swiftlint:enable function_parameter_count

    // MARK: - CreateConnectionNoEncryption

    class func createConnectionNoEncryption(
            dbHelper: DatabaseHelper, path: String, version: Int,
            versionUpgrades: [String: [Int: [String: Any]]])
                                                     -> String {
        var message: String = ""
        var mDB: OpaquePointer?
        let dbName: String =
            URL(fileURLWithPath: path).lastPathComponent
        let utilsUpgrade: UtilsUpgrade = UtilsUpgrade()
        do {
            try mDB = self.connection(filename: path)
        } catch {
            message = "init: Error Database connection failed"
        }
        if let pdb: OpaquePointer = mDB {

            message = self.checkVersion(
            dbHelper: dbHelper, mDB: pdb, dbName: dbName,
            version: version, versionUpgrades: versionUpgrades,
            utilsUpgrade: utilsUpgrade)
        }
        UtilsSQLite.closeDB(mDB: mDB, method: "init")
        return message
    }

    // MARK: - CreateConnectionEncryptedWithSecret

    // swiftlint:disable function_parameter_count
    class func createConnectionEncryptedWithSecret(
            dbHelper: DatabaseHelper, path: String, version: Int,
            versionUpgrades: [String: [Int: [String: Any]]],
            secret: String, newsecret: String) -> String {
        var message: String = ""
        var mDB: OpaquePointer?
        let dbName: String =
            URL(fileURLWithPath: path).lastPathComponent
        let utilsUpgrade: UtilsUpgrade = UtilsUpgrade()
        do {
            try mDB = self.connection(filename: path,
                                      readonly: false, key: secret)
        } catch {
            // for testing purpose
            if secret == "wrongsecret" {
                message = "init: Error Database connection failed wrong"
                message += " secret"
            } else {
                // test if you can open it with the new secret in case
                // of multiple runs
                do {
                    try mDB = self.connection(
                        filename: path,
                        readonly: false, key: newsecret)
                    message = "swap newsecret"
                } catch {
                    message = "init: Error Database connection failed"
                    message += " wrong secret"
                }
            }
        }
        if let pdb: OpaquePointer = mDB {

            let msg: String = self.checkVersion(
                dbHelper: dbHelper, mDB: pdb, dbName: dbName,
                version: version, versionUpgrades: versionUpgrades,
                utilsUpgrade: utilsUpgrade)
            message.append(msg)
        }

        UtilsSQLite.closeDB(mDB: mDB, method: "init")
        return message
    }
    // swiftlint:enable function_parameter_count

    // MARK: - CreateConnectionEncryptedWithNewSecret

    class func createConnectionEncryptedWithNewSecret(
            dbHelper: DatabaseHelper, path: String,
            secret: String, newsecret: String) -> String {
        var message: String = ""
        var mDB: OpaquePointer?
        do {
            try mDB = self.connection(
                filename: path,
                readonly: false, key: secret)
            let keyStatementString = """
            PRAGMA rekey = '\(newsecret)';
            """
            let returnCode: Int32 = sqlite3_exec(
                mDB, keyStatementString, nil, nil, nil)
            if returnCode != SQLITE_OK {
                message = "connection: Unable to open a connection to"
                message += " database at \(path))"
                return message
            }
            /* this should work but does not sqlite3_rekey_v2 is not known
             if sqlite3_rekey_v2(db!, "\(path)/\(self.dbName)", newsecret, Int32(newsecret.count)) == SQLITE_OK {
             self.isOpen = true
             } else {
             print("Unable to open a connection to database at \(path)/\(self.dbName)")
             throw StorageDatabaseHelperError.wrongNewSecret
             }
             */
            message = "swap newsecret"
        } catch {
            message = "init: Error Database connection failed wrong"
            message.append(" secret")
        }
        UtilsSQLite.closeDB(mDB: mDB, method: "init")
        return message
    }

    // MARK: - MakeEncryption

    class func makeEncryption(dbHelper: DatabaseHelper, path: String,
                              secret: String) -> String {
        var message: String = ""
        var res: Bool = false
        do {
            try res = UtilsEncryption.encryptDatabase(
                dbHelper: dbHelper, filePath: path, secret: secret)
            if res {
                message = "success encryption"
            }
        } catch UtilsSQLiteError.encryptionFailed {
            message = "init: Error Database Encryption failed"
        } catch UtilsSQLiteError.filePathFailed {
            message = "init: Error Database file not found"
        } catch let error {
            message = "init: Encryption \(error)"
        }
        return message
    }

    // MARK: - Connection

    class func connection(filename: String, readonly: Bool = false,
                          key: String = "") throws -> OpaquePointer? {

        let flags = readonly ? SQLITE_OPEN_READONLY :
            SQLITE_OPEN_CREATE | SQLITE_OPEN_READWRITE
        var mDB: OpaquePointer?
        if sqlite3_open_v2(filename, &mDB, flags |
                            SQLITE_OPEN_FULLMUTEX, nil) == SQLITE_OK {
            if key.count > 0 {
                let keyStatementString = """
                PRAGMA key = '\(key)';
                """
                if sqlite3_exec(mDB, keyStatementString, nil, nil, nil)
                                == SQLITE_OK {
                    var stmt: String = "SELECT count(*) FROM "
                    stmt.append("sqlite_master;")
                    if sqlite3_exec(mDB, stmt, nil, nil, nil) !=
                            SQLITE_OK {
                        throw UtilsSQLiteError.wrongSecret
                    }
                } else {
                    throw UtilsSQLiteError.wrongSecret
                }
            }
            /* this should work but doe not sqlite3_key_v2 is not known
             if key.count > 0 {
             let nKey:Int32 = Int32(key.count)
             if sqlite3_key_v2(db!, filename, key, nKey) == SQLITE_OK {
             if (sqlite3_exec(db!, "SELECT count(*) FROM sqlite_master;", nil, nil, nil) != SQLITE_OK) {
             print("Unable to open a connection to database at \(filename)")
             throw StorageDatabaseHelperError.wrongSecret
             }
             } else {
             print("Unable to open a connection to database at \(filename)")
             throw StorageDatabaseHelperError.wrongSecret
             }
             }
             print("Successfully opened connection to database at \(filename)")
             */
            // PRAGMA foreign_keys = ON;
            let sqltr: String = "PRAGMA foreign_keys = ON;"
            if sqlite3_exec(mDB, sqltr, nil, nil, nil) != SQLITE_OK {
                throw UtilsSQLiteError.connectionFailed
            }
            return mDB
        } else {
            throw UtilsSQLiteError.connectionFailed
        }
    }

    // MARK: - GetWritableDatabase

     class func getWritableDatabase(filename: String, secret: String)
                                    throws -> OpaquePointer? {
        guard let mDB = try? self.connection(
                filename: filename,
                readonly: false, key: secret) else {
            throw UtilsSQLiteError.connectionFailed
        }
        return mDB
    }

    // MARK: - GetReadableDatabase

    class func getReadableDatabase(filename: String, secret: String)
                                    throws -> OpaquePointer? {
        guard let mDB = try? self.connection(
                filename: filename,
                readonly: true, key: secret) else {
            throw UtilsSQLiteError.connectionFailed
        }
        return mDB
    }
}
// swiftlint:enable type_body_length
// swiftlint:enable file_length
