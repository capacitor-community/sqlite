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
    var path: String = ""
    var mDb: OpaquePointer?
    let globalData: GlobalSQLite = GlobalSQLite()
    let uUpg: UtilsUpgrade = UtilsUpgrade()

    // MARK: - Init
    init(databaseName: String, encrypted: Bool = false,
         mode: String = "no-encryption", version: Int = 1,
         vUpgDict: [Int: [String: Any]] = [:]) throws {
        print("databaseName: \(databaseName) ")
        self.dbVersion = version
        self.encrypted = encrypted
        self.dbName = databaseName
        self.mode = mode
        self.vUpgDict = vUpgDict
        do {
            self.path = try UtilsFile.getFilePath(
                fileName: databaseName)
        } catch UtilsFileError.getFilePathFailed {
            throw DatabaseError.filePath(
                message: "Could not generate the file path")
        }
        print("database path \(self.path)")
    }

    // MARK: - isOpen

    func isDBOpen () -> Bool {
        return isOpen
    }

    // MARK: - Open

    // swiftlint:disable cyclomatic_complexity
    // swiftlint:disable function_body_length
    func open () throws {
        var password: String = ""
        if encrypted && (mode == "secret"
                            || mode == "encryption") {
            password = globalData.secret
        }
        if mode == "newsecret" {
            do {
                try UtilsSQLCipher
                    .changePassword(filename: path,
                                    password: password,
                                    newpassword: globalData.newsecret)
                password = globalData.newsecret

            } catch UtilsSQLCipherError.changePassword(let message) {
                let msg: String = "Failed in changePassword \(message)"
                throw DatabaseError.open(message: msg)

            }
        }
        if mode == "encryption" {
            do {
                let ret: Bool = try UtilsEncryption
                    .encryptDatabase(filePath: path, password: password)
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
                                      readonly: false)
            isOpen = true
            // PRAGMA foreign_keys = ON;
            try UtilsSQLCipher
                .setForeignKeyConstraintsEnabled(mDB: self,
                                                 toggle: true)
            var curVersion: Int = try UtilsSQLCipher
                .getVersion(mDB: self)
            if curVersion == 0 {
                try UtilsSQLCipher.setVersion(mDB: self, version: 1)
                curVersion = try UtilsSQLCipher.getVersion(mDB: self)
            }
            if dbVersion > curVersion {
                _ = try uUpg.onUpgrade(mDB: self, upgDict: vUpgDict,
                                       dbName: dbName,
                                       currentVersion: curVersion,
                                       targetVersion: dbVersion)
                try UtilsSQLCipher.deleteBackupDB(databaseName: dbName)
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
                try UtilsSQLCipher.restoreDB(databaseName: dbName)
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

    // MARK: - ExecuteSQL

    func executeSQL(sql: String) throws -> Int {
        var msg: String = "Failed in executeSQL : "
        var changes: Int = -1
        let initChanges = UtilsSQLCipher.dbChanges(mDB: mDb)

        // Start a transaction
        do {
            try UtilsSQLCipher.beginTransaction(mDB: self)
        } catch UtilsSQLCipherError.beginTransaction(let message) {
            msg.append(" \(message)")
            throw DatabaseError.executeSQL(message: msg)
        }
        // Execute the query
        do {
            try UtilsSQLCipher.execute(mDB: self, sql: sql)
            changes = UtilsSQLCipher.dbChanges(mDB: mDb) - initChanges
        } catch UtilsSQLCipherError
                    .execute(let message) {
            do {
                try UtilsSQLCipher
                    .rollbackTransaction(mDB: self)
            } catch UtilsSQLCipherError
                        .rollbackTransaction(let message) {
                msg.append(" rollback: \(message)")
            }
            msg.append(" \(message)")
            throw DatabaseError.executeSQL(message: msg)
        }
        if changes != -1 {
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

    func execSet(set: [[String: Any]]) throws -> [String: Int64] {
        var msg: String = "Failed in execSet : "
        let initChanges = UtilsSQLCipher.dbChanges(mDB: mDb)
        var changes: Int = -1
        var lastId: Int64 = -1
        var changesDict: [String: Int64] = ["lastId": lastId,
                                            "changes": Int64(changes)]

        // Start a transaction
        do {
            try UtilsSQLCipher.beginTransaction(mDB: self)
        } catch UtilsSQLCipherError.beginTransaction(let message) {
            msg.append(" \(message)")
            throw DatabaseError.execSet(message: msg)
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
            do {
                try UtilsSQLCipher
                    .rollbackTransaction(mDB: self)
            } catch UtilsSQLCipherError
                        .rollbackTransaction(let message) {
                msg.append(" rollback: \(message)")
            }

            msg.append(" \(message)")
            throw DatabaseError.execSet(message: msg )
        }
        if changes > 0 {
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

    func runSQL(sql: String, values: [Any]) throws -> [String: Int64] {
        var msg: String = "Failed in runSQL : "
        var changes: Int = -1
        var lastId: Int64 = -1
        let initChanges = UtilsSQLCipher.dbChanges(mDB: mDb)

        // Start a transaction
        do {
            try UtilsSQLCipher.beginTransaction(mDB: self)
        } catch UtilsSQLCipherError.beginTransaction(let message) {

            msg.append(" \(message)")
            throw DatabaseError.runSQL(message: msg)
        }
        // Execute the query
        do {
            lastId = try UtilsSQLCipher
                .prepareSQL(mDB: self, sql: sql, values: values)
        } catch UtilsSQLCipherError
                    .prepareSQL(let message) {
            do {
                try UtilsSQLCipher
                    .rollbackTransaction(mDB: self)
            } catch UtilsSQLCipherError
                        .rollbackTransaction(let message) {
                msg.append(" rollback: \(message)")
            }
            msg.append(" \(message)")
            print("\(msg)")
            lastId = -1
        }

        if lastId != -1 {
            // commit the transaction
            do {
                try UtilsSQLCipher.commitTransaction(mDB: self)
                changes = UtilsSQLCipher.dbChanges(mDB: mDb) -
                    initChanges
            } catch UtilsSQLCipherError.commitTransaction(let message) {
                msg.append(" \(message)")
                throw DatabaseError.runSQL(message: msg )
            }
        }
        let result: [String: Int64] = ["changes": Int64(changes),
                                       "lastId": lastId]
        return result
    }

    // MARK: - SelectSQL

    func selectSQL(sql: String, values: [String])
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
            .isFileExist(fileName: databaseName)
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
                try UtilsSQLCipher.deleteDB(databaseName: databaseName)
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
        var changes: Int = -1

        // Create the Database Schema
        do {
            changes = try ImportFromJson
                .createDatabaseSchema(mDB: self,
                                      jsonSQLite: jsonSQLite)
            if changes != -1 {
                // Create the Database Data
                changes = try ImportFromJson
                    .createDatabaseData(mDB: self,
                                        jsonSQLite: jsonSQLite)
            }
            return ["changes": changes]
        } catch ImportFromJsonError.createDatabaseSchema(let message) {
            throw DatabaseError.importFromJson(message: message)
        } catch ImportFromJsonError.createDatabaseData(let message) {
            throw DatabaseError.importFromJson(message: message)
        }
    }
}
// swiftlint:enable type_body_length
// swiftlint:enable file_length
