//
//  Database.swift
//  Plugin
//
//  Created by  Quéau Jean Pierre on 26/11/2020.
//  Copyright © 2020 Max Lynch. All rights reserved.
//

import Foundation

enum DatabaseError: Error {
    case filePath(message: String)
    case open(message: String)
    case close(message: String)
    case getVersion(message: String)
    case executeSQL(message: String)
    case runSQL(message: String)
    case selectSQL(message: String)
    case deleteDB(message: String)
    case execSet(message: String)
    case createSyncTable(message: String)
    case createSyncDate(message: String)
    case getSyncDate(message: String)
    case exportToJson(message: String)
    case importFromJson(message: String)
}
// swiftlint:disable file_length
// swiftlint:disable type_body_length
class Database {
    var isOpen: Bool = false
    var dbName: String
    var dbVersion: Int
    var encrypted: Bool
    var mode: String
    var vUpgDict: [Int: [String: Any]]
    var databaseLocation: String
    var path: String = ""
    var mDb: OpaquePointer?
    let globalData: GlobalSQLite = GlobalSQLite()
    let uUpg: UtilsUpgrade = UtilsUpgrade()
    var readOnly: Bool = false
    var ncDB: Bool = false

    // MARK: - Init
    init(databaseLocation: String, databaseName: String, encrypted: Bool,
         mode: String, version: Int,
         vUpgDict: [Int: [String: Any]] = [:]) throws {
        self.dbVersion = version
        self.encrypted = encrypted
        self.dbName = databaseName
        self.mode = mode
        self.vUpgDict = vUpgDict
        self.databaseLocation = databaseLocation
        if databaseName.contains("/")  &&
            databaseName.suffix(9) != "SQLite.db" {
            self.readOnly = true
            self.path = databaseName
            self.ncDB = true
        } else {
            do {
                self.path = try UtilsFile.getFilePath(
                    databaseLocation: databaseLocation,
                    fileName: databaseName)
            } catch UtilsFileError.getFilePathFailed {
                throw DatabaseError.filePath(
                    message: "Could not generate the file path")
            }
        }
        print("database path \(self.path)")
    }

    // MARK: - isOpen

    func isDBOpen () -> Bool {
        return isOpen
    }

    // MARK: - isNCDB

    func isNCDB () -> Bool {
        return ncDB
    }

    // MARK: - getUrl

    func getUrl () -> String {
        return "file://\(path)"
    }

    // MARK: - Open

    // swiftlint:disable cyclomatic_complexity
    // swiftlint:disable function_body_length
    func open () throws {
        var password: String = ""
        if encrypted && (mode == "secret" || mode == "encryption") {
            password = UtilsSecret.getPassphrase()
        }
        if mode == "encryption" {
            do {
                let ret: Bool = try UtilsEncryption
                    .encryptDatabase(databaseLocation: databaseLocation,
                                     filePath: path, password: password)
                if !ret {
                    let msg: String = "Failed in encryption"
                    throw DatabaseError.open(message: msg)
                }
            } catch UtilsEncryptionError.encryptionFailed(let message) {
                let msg: String = "Failed in encryption \(message)"
                throw DatabaseError.open(message: msg)

            }
        }

        do {
            mDb = try UtilsSQLCipher
                .openOrCreateDatabase(filename: path,
                                      password: password,
                                      readonly: self.readOnly)
            isOpen = true
            // PRAGMA foreign_keys = ON;
            try UtilsSQLCipher
                .setForeignKeyConstraintsEnabled(mDB: self,
                                                 toggle: true)
            if !ncDB {
                var curVersion: Int = try UtilsSQLCipher
                    .getVersion(mDB: self)
                if curVersion == 0 {
                    try UtilsSQLCipher.setVersion(mDB: self, version: 1)
                    curVersion = try UtilsSQLCipher.getVersion(mDB: self)
                }
                if dbVersion > curVersion {
                    if vUpgDict.count > 0 {
                        _ = try uUpg
                            .onUpgrade(mDB: self, upgDict: vUpgDict,
                                       dbName: dbName,
                                       currentVersion: curVersion,
                                       targetVersion: dbVersion,
                                       databaseLocation: databaseLocation)
                        try UtilsSQLCipher
                            .deleteBackupDB(databaseLocation: databaseLocation,
                                            databaseName: dbName)
                    } else {
                        try UtilsSQLCipher.setVersion(mDB: self, version: dbVersion)
                    }
                }
            }
        } catch UtilsSQLCipherError.openOrCreateDatabase(let message) {
            var msg: String = "Failed in "
            msg.append("openOrCreateDatabase \(message)")
            throw DatabaseError.open(message: msg )
        } catch UtilsSQLCipherError
                    .setForeignKeyConstraintsEnabled(let message) {
            try close()
            var msg: String = "Failed in "
            msg.append("setForeignKeyConstraintsEnabled \(message)")
            throw DatabaseError.open(message: msg)
        } catch UtilsSQLCipherError.setVersion(let message) {
            try close()
            let msg: String = "Failed in setVersion \(message)"
            throw DatabaseError.open(message: msg)
        } catch UtilsSQLCipherError.getVersion(let message) {
            try close()
            let msg: String = "Failed in getVersion \(message)"
            throw DatabaseError.open(message: msg)
        } catch UtilsSQLCipherError.deleteBackupDB(let message) {
            try close()
            let msg: String = "Failed in deleteBackupDB \(message)"
            throw DatabaseError.open(message: msg)
        } catch UtilsUpgradeError.onUpgradeFailed(let message) {
            //restore the database
            do {
                try UtilsSQLCipher
                    .restoreDB(databaseLocation: databaseLocation,
                               databaseName: dbName)
                let msg: String = "Failed OnUpgrade \(message)"
                try close()
                throw DatabaseError.open(message: msg)

            } catch UtilsSQLCipherError.restoreDB(let message) {
                let msg: String = "Failed in restoreDB \(message)"
                try close()
                throw DatabaseError.open(message: msg)
            }
        }
        return
    }
    // swiftlint:enable function_body_length
    // swiftlint:enable cyclomatic_complexity

    // MARK: - Close

    func close () throws {
        if isOpen {
            // close the database
            do {
                try UtilsSQLCipher.closeDB(mDB: self)
                isOpen = false
            } catch UtilsSQLCipherError.closeDB(let message) {
                throw DatabaseError.close(
                    message: "Failed in close : \(message)" )
            }
        }
        return
    }

    // MARK: - GetVersion

    func getVersion () throws -> Int {
        if isOpen {
            do {
                let curVersion: Int = try UtilsSQLCipher
                    .getVersion(mDB: self)
                return curVersion
            } catch UtilsSQLCipherError.getVersion(let message) {
                let msg: String = "Failed in getVersion \(message)"
                throw DatabaseError.getVersion(message: msg)
            }
        } else {
            let msg: String = "Failed in getVersion database not opened"
            throw DatabaseError.getVersion(message: msg)
        }
    }

    // MARK: - ExecuteSQL

    func executeSQL(sql: String, transaction: Bool = true) throws -> Int {
        var msg: String = "Failed in executeSQL : "
        var changes: Int = -1
        let initChanges = UtilsSQLCipher.dbChanges(mDB: mDb)

        // Start a transaction
        if transaction {
            do {
                try UtilsSQLCipher.beginTransaction(mDB: self)
            } catch UtilsSQLCipherError.beginTransaction(let message) {
                msg.append(" \(message)")
                throw DatabaseError.executeSQL(message: msg)
            }
        }
        // Execute the query
        do {
            try UtilsSQLCipher.execute(mDB: self, sql: sql)
            changes = UtilsSQLCipher.dbChanges(mDB: mDb) - initChanges

        } catch UtilsSQLCipherError.execute(let message) {
            if transaction {
                do {
                    try UtilsSQLCipher
                        .rollbackTransaction(mDB: self)
                } catch UtilsSQLCipherError
                            .rollbackTransaction(let message) {
                    msg.append(" rollback: \(message)")
                }
            }
            msg.append(" \(message)")
            throw DatabaseError.executeSQL(message: msg)
        }
        if changes != -1 && transaction {
            // commit the transaction
            do {
                try UtilsSQLCipher.commitTransaction(mDB: self)
            } catch UtilsSQLCipherError.commitTransaction(let msg) {
                throw DatabaseError.executeSQL(
                    message: "Failed in executeSQL : \(msg)" )
            }
        }
        return changes
    }

    // MARK: - ExecSet

    func execSet(set: [[String: Any]], transaction: Bool = true) throws -> [String: Int64] {
        var msg: String = "Failed in execSet : "
        let initChanges = UtilsSQLCipher.dbChanges(mDB: mDb)
        var changes: Int = -1
        var lastId: Int64 = -1
        var changesDict: [String: Int64] = ["lastId": lastId,
                                            "changes": Int64(changes)]

        // Start a transaction
        if transaction {
            do {
                try UtilsSQLCipher.beginTransaction(mDB: self)
            } catch UtilsSQLCipherError.beginTransaction(let message) {
                msg.append(" \(message)")
                throw DatabaseError.execSet(message: msg)
            }
        }
        // Execute the query
        do {
            lastId = try UtilsSQLCipher
                .executeSet(mDB: self, set: set)
            changes = UtilsSQLCipher
                .dbChanges(mDB: mDb) - initChanges
            changesDict["changes"] = Int64(changes)
            changesDict["lastId"] = lastId

        } catch UtilsSQLCipherError
                    .executeSet(let message) {
            if transaction {
                do {
                    try UtilsSQLCipher
                        .rollbackTransaction(mDB: self)
                } catch UtilsSQLCipherError
                            .rollbackTransaction(let message) {
                    msg.append(" rollback: \(message)")
                }
            }
            msg.append(" \(message)")
            throw DatabaseError.execSet(message: msg )
        }
        if changes > 0 && transaction {
            // commit the transaction
            do {
                try UtilsSQLCipher.commitTransaction(mDB: self)
            } catch UtilsSQLCipherError.commitTransaction(let msg) {
                throw DatabaseError.execSet(
                    message: msg )
            }
        }
        return changesDict
    }

    // MARK: - RunSQL

    func runSQL(sql: String, values: [Any], transaction: Bool = true) throws -> [String: Int64] {
        var msg: String = "Failed in runSQL : "
        var changes: Int = -1
        var lastId: Int64 = -1
        let initChanges = UtilsSQLCipher.dbChanges(mDB: mDb)

        // Start a transaction
        if transaction {
            do {
                try UtilsSQLCipher.beginTransaction(mDB: self)
            } catch UtilsSQLCipherError.beginTransaction(let message) {

                msg.append(" \(message)")
                throw DatabaseError.runSQL(message: msg)
            }
        }
        // Execute the query
        do {
            lastId = try UtilsSQLCipher
                .prepareSQL(mDB: self, sql: sql, values: values)
        } catch UtilsSQLCipherError.prepareSQL(let message) {
            if transaction {
                do {
                    try UtilsSQLCipher
                        .rollbackTransaction(mDB: self)
                } catch UtilsSQLCipherError
                            .rollbackTransaction(let message) {
                    msg.append(" rollback: \(message)")
                }
            }
            msg.append(" \(message)")
            lastId = -1
        }

        if lastId != -1 {
            if transaction {
                // commit the transaction
                do {
                    try UtilsSQLCipher.commitTransaction(mDB: self)
                } catch UtilsSQLCipherError.commitTransaction(let message) {
                    msg.append(" \(message)")
                    throw DatabaseError.runSQL(message: msg )
                }
            }
            changes = UtilsSQLCipher.dbChanges(mDB: mDb) - initChanges
        }
        let result: [String: Int64] = ["changes": Int64(changes),
                                       "lastId": lastId]
        return result
    }

    // MARK: - SelectSQL

    func selectSQL(sql: String, values: [Any])
    throws -> [[String: Any]] {
        var result: [[String: Any]] = []
        do {
            result = try UtilsSQLCipher.querySQL(mDB: self, sql: sql,
                                                 values: values)
        } catch UtilsSQLCipherError.querySQL(let msg) {
            throw DatabaseError.selectSQL(
                message: "Failed in selectSQL : \(msg)" )
        }
        return result
    }

    // MARK: - DeleteDB

    func deleteDB(databaseName: String) throws -> Bool {
        let isFileExists: Bool = UtilsFile
            .isFileExist(databaseLocation: databaseLocation,
                         fileName: databaseName)
        if isFileExists && !isOpen {
            // open the database
            do {
                try self.open()
            } catch DatabaseError.open( let message ) {
                throw DatabaseError.deleteDB(message: message)
            }
        }
        // close the database
        do {
            try self.close()
        } catch DatabaseError.close( let message ) {
            throw DatabaseError.deleteDB(message: message)
        }
        // delete the database
        if isFileExists {
            do {
                try UtilsSQLCipher.deleteDB(databaseLocation: databaseLocation,
                                            databaseName: databaseName)
            } catch UtilsSQLCipherError.deleteDB(let message ) {
                throw DatabaseError.deleteDB(message: message)
            }
        }
        return true
    }

    // MARK: - createSyncTable

    func createSyncTable() throws -> Int {
        var retObj: Int = -1
        // Open the database for writing
        // check if the table has already been created
        do {
            let isExists: Bool = try UtilsJson.isTableExists(
                mDB: self, tableName: "sync_table")
            if !isExists {
                let date = Date()
                let syncTime: Int = Int(date.timeIntervalSince1970)
                var stmt: String = "CREATE TABLE IF NOT EXISTS "
                stmt.append("sync_table (")
                stmt.append("id INTEGER PRIMARY KEY NOT NULL,")
                stmt.append("sync_date INTEGER);")
                stmt.append("INSERT INTO sync_table (sync_date) ")
                stmt.append("VALUES ('\(syncTime)');")
                retObj = try executeSQL(sql: stmt)
            } else {
                retObj = 0
            }
        } catch UtilsJsonError.tableNotExists(let message) {
            throw DatabaseError.createSyncTable(message: message)
        } catch DatabaseError.executeSQL(let message) {
            throw DatabaseError.createSyncTable(message: message)
        }
        return retObj
    }

    // MARK: - SetSyncDate

    func setSyncDate(syncDate: String ) throws -> Bool {
        var retBool: Bool = false
        do {
            let dateFormatter = DateFormatter()
            dateFormatter.locale = Locale(identifier: "en_US_POSIX")
            dateFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSZ"
            if let date = dateFormatter.date(from: syncDate) {
                let syncTime: Int = Int(date.timeIntervalSince1970)
                var stmt: String = "UPDATE sync_table SET sync_date = "
                stmt.append("\(syncTime) WHERE id = 1;")
                let retRun = try runSQL(sql: stmt, values: [])
                if let lastId: Int64 = retRun["lastId"] {
                    if lastId != -1 {
                        retBool = true
                    }
                }
            } else {
                throw DatabaseError.createSyncDate(message: "wrong syncDate")
            }
        } catch DatabaseError.runSQL(let message) {
            throw DatabaseError.createSyncDate(message: message)
        }
        return retBool
    }

    // MARK: - GetSyncDate

    func getSyncDate( ) throws -> Int64 {
        var syncDate: Int64 = 0
        do {
            syncDate = try ExportToJson.getSyncDate(mDB: self)
        } catch ExportToJsonError.getSyncDate(let message) {
            throw DatabaseError.getSyncDate(message: message)
        }
        return syncDate
    }

    // MARK: - ExportToJson

    func exportToJson(expMode: String) throws -> [String: Any] {
        var retObj: [String: Any] = [:]

        do {
            let data: [String: Any] = [
                "dbName": dbName, "encrypted": self.encrypted,
                "expMode": expMode, "version": dbVersion]
            retObj = try ExportToJson
                .createExportObject(mDB: self, data: data)
        } catch ExportToJsonError.createExportObject(let message) {
            throw DatabaseError.exportToJson(message: message)
        }
        return retObj
    }

    // MARK: - ImportFromJson

    func importFromJson(jsonSQLite: JsonSQLite)
    throws -> [String: Int] {
        var changes: Int = 0

        // Create the Database Schema
        do {
            if jsonSQLite.tables.count > 0 {
                changes = try ImportFromJson
                    .createDatabaseSchema(mDB: self,
                                          jsonSQLite: jsonSQLite)
                if changes != -1 {
                    // Create the Database Data
                    changes += try ImportFromJson
                        .createDatabaseData(mDB: self,
                                            jsonSQLite: jsonSQLite)
                }
            }
            if let mViews = jsonSQLite.views {
                if mViews.count > 0 {
                    changes += try ImportFromJson
                        .createViews(mDB: self, views: mViews)
                }
            }

            return ["changes": changes]
        } catch ImportFromJsonError.createDatabaseSchema(let message) {
            throw DatabaseError.importFromJson(message: message)
        } catch ImportFromJsonError.createDatabaseData(let message) {
            throw DatabaseError.importFromJson(message: message)
        } catch ImportFromJsonError.createViews(let message) {
            throw DatabaseError.importFromJson(message: message)
        }
    }
}
// swiftlint:enable type_body_length
// swiftlint:enable file_length
