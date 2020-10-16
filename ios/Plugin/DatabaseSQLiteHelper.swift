//
//  DatabaseSQLiteHelper.swift
//  Plugin
//
//  Created by  Quéau Jean Pierre on 23/01/2020.
//  Copyright © 2020 Max Lynch. All rights reserved.
//

import Foundation

import SQLCipher

enum DatabaseHelperError: Error {
    case filePath(message: String)
    case dbConnection(message: String)
    case execSql(message: String)
    case execute(message: String)
    case execSet(message: String)
    case executeSet(message: String)
    case runSql(message: String)
    case prepareSql(message: String)
    case selectSql(message: String)
    case querySql(message: String)
    case deleteDB(message: String)
    case restoreDB(message: String)
    case close(message: String)
    case tableNotExists(message: String)
    case importFromJson(message: String)
    case isIdExists(message: String)
    case valuesToStringNull(message: String)
    case setToStringNull(message: String)
    case beginTransaction(message: String)
    case executeCommit(message: String)
    case commitTransaction(message: String)
    case createTableData(message: String)
    case createDatabaseSchema(message: String)
    case createDatabaseData(message: String)
    case createSyncTable(message: String)
    case createSyncDate(message: String)
    case createRowStatement(message: String)
    case createExportObject(message: String)
    case exportToJson(message: String)
    case getSyncDate(message: String)
    case getTablesModified(message: String)
    case createSchema(message: String)
    case createIndexes(message: String)
    case createValues(message: String)
    case createRowValues(message: String)
    case checkRowValidity(message: String)
    case fetchColumnInfo(message: String)
    case validateSchema(message: String)
    case validateIndexes(message: String)
    case getPartialModeData(message: String)
    case getTablesFull(message: String)
    case getTablesPartial(message: String)
    case getTableColumnNamesTypes(message: String)
    case getSchemaIndexes(message: String)
    case getValues(message: String)

}
// swiftlint:disable type_body_length
// swiftlint:disable file_length
class DatabaseHelper {
    var isOpen: Bool = false
    // define the path for the database
    var path: String = ""
    var databaseName: String
    var databaseVersion: Int
    var secret: String
    var newsecret: String
    var encrypted: Bool
    var mode: String
    var versionUpgrades: [String: [Int: [String: Any]]]

    // MARK: - Init
    init(databaseName: String, encrypted: Bool = false,
         mode: String = "no-encryption", secret: String = "",
         newsecret: String = "", databaseVersion: Int = 1,
         versionUpgrades: [String: [Int: [String: Any]]] = [:]) throws {
        print("databaseName: \(databaseName) ")
        self.secret = secret
        self.databaseVersion = databaseVersion
        self.newsecret = newsecret
        self.encrypted = encrypted
        self.databaseName = databaseName
        self.mode = mode
        self.versionUpgrades = versionUpgrades
        do {
            self.path = try UtilsFile.getFilePath(
                                            fileName: databaseName)
        } catch UtilsSQLiteError.filePathFailed {
            throw DatabaseHelperError.filePath(
                        message: "Could not generate the file path")
        }
        print("database path \(self.path)")
        // connect to the database (create if doesn't exist)

        let message: String = UtilsConnection.createConnection(
            dbHelper: self, path: self.path, mode: self.mode,
            encrypted: self.encrypted, secret: self.secret,
            newsecret: self.newsecret, version: self.databaseVersion,
            versionUpgrades: self.versionUpgrades)
        self.isOpen = message.count == 0 ||
                     message == "swap newsecret" ||
                     message == "success encryption" ? true : false

        if message.count > 0 {
            if message.contains("connection:") {
                throw UtilsSQLiteError.wrongNewSecret
            } else if message.contains("wrong secret") {
                throw UtilsSQLiteError.wrongSecret
            } else if message == "swap newsecret" {
                self.secret = self.newsecret
            } else if message == "success encryption" {
                self.encrypted = true
            } else {
                throw UtilsSQLiteError.connectionFailed
            }
        }

    }

    // MARK: - Close

    func close (databaseName: String) throws -> Bool {
        var ret: Bool = false
        var mDB: OpaquePointer?
        do {
            try mDB = UtilsConnection.connection(filename: self.path)
            isOpen = true
            UtilsSQLite.closeDB(mDB: mDB, method: "init")
            isOpen = false
            mDB = nil
            ret = true

        } catch {
            let error: String = "init: Error Database connection failed"
            print(error)
            throw UtilsSQLiteError.connectionFailed
        }

        return ret
    }

    // MARK: - ExecSQL

    func execSQL(sql: String) throws -> Int {
        guard let mDB: OpaquePointer = try
                UtilsConnection.getWritableDatabase(
                filename: self.path, secret: secret) else {
            throw DatabaseHelperError.dbConnection(
                message: "Error: DB connection")
        }
        var changes: Int = 0
        var message: String = ""
        do {
            changes = try execute(mDB: mDB, sql: sql)
        } catch DatabaseHelperError.execute(let msg) {
            message = "Error: execSQL \(msg)"
        }

        UtilsSQLite.closeDB(mDB: mDB, method: "execSQL")
        if message.count > 0 {
            throw DatabaseHelperError.execSql(message: message)
        } else {
            return changes
        }
    }

    // MARK: - Execute

    func execute(mDB: OpaquePointer, sql: String) throws -> Int {
        let returnCode: Int32 = sqlite3_exec(mDB, sql, nil, nil, nil)
        if returnCode != SQLITE_OK {
            let errmsg: String = String(cString: sqlite3_errmsg(mDB))
            var msg: String = "Error: execute failed rc: \(returnCode)"
            msg.append(" message: \(errmsg)")
            throw DatabaseHelperError.execute(
                message: msg)
        }
        let changes: Int = Int(sqlite3_total_changes(mDB))
        return changes
    }

    // MARK: - execSet

    func execSet(set: [[String: Any]]) throws -> [String: Int] {
        guard let mDB: OpaquePointer =
            try UtilsConnection.getWritableDatabase(
                                            filename: self.path,
                                            secret: secret) else {
            var msg: String = "Error: DB connection"
            throw DatabaseHelperError.dbConnection(message: msg)
        }
        var changesDict: [String: Int] = ["lastId": -1, "changes": -1]
        var message: String = ""
        // Start a transaction
        do {
            try UtilsSQLite.beginTransaction(mDB: mDB)
        } catch DatabaseHelperError.beginTransaction(let message) {
            throw DatabaseHelperError
                        .createDatabaseSchema(message: message)
        }
        do {
            changesDict = try executeSet(mDB: mDB, set: set)
        } catch DatabaseHelperError.executeSet(let msg) {
            message = msg
        }
        if let changes = changesDict["changes"] {
            if changes > 0 && message.count == 0 {
                // commit the transaction
                do {
                    try UtilsSQLite.commitTransaction(mDB: mDB)
                } catch DatabaseHelperError
                                    .commitTransaction(let msg) {
                    message = msg
                }
            }
        }
        // close the db
        UtilsSQLite.closeDB(mDB: mDB, method: "executeSet")
        if message.count > 0 {
            throw DatabaseHelperError.executeSet(message: message)
        } else {
            return changesDict
        }
    }

    // MARK: - ExecuteSet

    func executeSet(mDB: OpaquePointer, set: [[String: Any]])
    throws -> [String: Int] {
        var lastId: Int = -1
        var changes: Int = -1
        do {
            for dict  in set {
                guard let sql: String = dict["statement"] as? String
                else {
                    throw DatabaseHelperError.executeSet(
                        message: "Error: ExecuteSet No statement given")
                }
                guard let values: [Any] = dict["values"] as? [Any]
                else {
                    throw DatabaseHelperError.executeSet(
                        message: "Error: ExecuteSet No values given")
                }
                lastId = try prepareSQL(mDB: mDB, sql: sql,
                                                 values: values)
                if  lastId == -1 {
                    var message: String = "Error: ExecuteSet failed "
                    message += "in prepareSQL"
                    throw DatabaseHelperError.executeSet(
                                            message: message)
                }
            }
            changes = Int(sqlite3_total_changes(mDB))
            var retDict: [String: Int] = [:]
            retDict["lastId"] = lastId
            retDict["changes"] = changes
            return retDict
        } catch DatabaseHelperError.prepareSql(let message) {
            throw DatabaseHelperError.executeSet(
                                    message: message)
        }
    }
    // MARK: - RunSQL

    func runSQL(sql: String, values: [Any]) throws -> [String: Int] {
        guard let mDB: OpaquePointer = try
                UtilsConnection.getWritableDatabase(
                    filename: self.path, secret: secret) else {
            var msg: String = "Error: DB connection"
            throw DatabaseHelperError.dbConnection(message: msg)
        }
        var message: String = ""
        var lastId: Int = -1
        var changes: Int = 0
        // Start a transaction
        do {
            try UtilsSQLite.beginTransaction(mDB: mDB)
        } catch DatabaseHelperError.beginTransaction(let message) {
            throw DatabaseHelperError
                        .createDatabaseSchema(message: message)
        }
        do {
            lastId = try prepareSQL(mDB: mDB, sql: sql, values: values)
        } catch DatabaseHelperError.prepareSql(let msg) {
            message = msg
        }
        if lastId != -1 {
            // commit the transaction
            do {
                try UtilsSQLite.commitTransaction(mDB: mDB)
                changes = Int(sqlite3_total_changes(mDB))
            } catch DatabaseHelperError.commitTransaction(let msg) {
                message = msg
            }
        }
        UtilsSQLite.closeDB(mDB: mDB, method: "runSQL")
        if message.count > 0 {
            throw DatabaseHelperError.runSql(message: message)
        } else {
            let result: [String: Int] = ["changes": changes,
                                         "lastId": lastId]
            return result
        }
    }

    // MARK: - PrepareSQL

    func prepareSQL(mDB: OpaquePointer,
                    sql: String, values: [Any]) throws -> Int {
        var runSQLStatement: OpaquePointer?
        var message: String = ""
        var lastId: Int = -1

        var returnCode: Int32 = sqlite3_prepare_v2(
                                mDB, sql, -1, &runSQLStatement, nil)
        if returnCode == SQLITE_OK {
            if !values.isEmpty {
            // do the binding of values
                var idx: Int = 1
                for value in values {
                    do {
                        try UtilsBinding.bind(handle: runSQLStatement,
                                              value: value, idx: idx)
                        idx += 1
                    } catch let error as NSError {
                        message = "Error: prepareSQL bind failed "
                        message.append(error.localizedDescription)
                    }
                    if message.count > 0 { break }
                }
            }
            returnCode = sqlite3_step(runSQLStatement)
            if returnCode != SQLITE_DONE {
                let errmsg: String =
                                String(cString: sqlite3_errmsg(mDB))
                message = "Error: prepareSQL step failed rc: "
                message.append("\(returnCode) message: \(errmsg)")
            }
        } else {
            let errmsg: String = String(cString: sqlite3_errmsg(mDB))
            message = "Error: prepareSQL prepare failed rc: "
            message.append("\(returnCode) message: \(errmsg)")
        }
        returnCode = sqlite3_finalize(runSQLStatement)
        if returnCode != SQLITE_OK {
            let errmsg: String = String(cString: sqlite3_errmsg(mDB))
            message = "Error: prepareSQL finalize failed rc: "
            message.append("\(returnCode) message: \(errmsg)")
        }
        if message.count > 0 {
            throw DatabaseHelperError.prepareSql(message: message)
        } else {
            lastId = Int(sqlite3_last_insert_rowid(mDB))
            return lastId
        }
    }

    // MARK: - SelectSQL

    func selectSQL(sql: String, values: [String])
                                        throws -> [[String: Any]] {
        guard let mDB: OpaquePointer = try
                UtilsConnection.getReadableDatabase(
                                                filename: self.path,
                                                secret: secret) else {
            throw DatabaseHelperError.dbConnection(
                message: "Error: DB connection")
        }
        var result: [[String: Any]] = []
        var message: String = ""
        do {
            result = try querySQL(mDB: mDB, sql: sql, values: values)
        } catch DatabaseHelperError.querySql(let msg) {
            message = msg
        }
        UtilsSQLite.closeDB(mDB: mDB, method: "selectSQL")
        if message.count > 0 {
            throw DatabaseHelperError.selectSql(message: message)
        } else {
            return result
        }
    }

    // MARK: - QuerySQL

    func querySQL(mDB: OpaquePointer, sql: String,
                  values: [String]) throws -> [[String: Any]] {
        var selectSQLStatement: OpaquePointer?
        var result: [[String: Any]] = []
        var message: String = ""
        var returnCode: Int32 =
            sqlite3_prepare_v2(mDB, sql, -1, &selectSQLStatement, nil)
        if returnCode == SQLITE_OK {
            if !values.isEmpty {
            // do the binding of values
                message = UtilsBinding.bindValues(
                        handle: selectSQLStatement, values: values)
            }
            if message.count == 0 {
                do {
                    result = try UtilsSQLite.fetchColumnInfo(
                                        handle: selectSQLStatement)
                } catch DatabaseHelperError
                                .fetchColumnInfo(let message) {
                    throw DatabaseHelperError.querySql(message: message)
                }
            }
        } else {
            let errmsg: String = String(cString: sqlite3_errmsg(mDB))
            message = "Error: querySQL prepare failed rc: "
            message.append("\(returnCode) message: \(errmsg)")
        }
        returnCode = sqlite3_finalize(selectSQLStatement)
        if returnCode != SQLITE_OK {
            let errmsg: String = String(cString: sqlite3_errmsg(mDB))
            message = "Error: querySQL finalize failed rc: "
            message.append("\(returnCode) message: \(errmsg)")
        }
        if message.count > 0 {
            throw DatabaseHelperError.querySql(message: message)
        } else {
            return result
        }
    }

    // MARK: - DeleteDB

    func deleteDB(databaseName: String) throws -> Bool {
        var ret: Bool = false
        if let dir = FileManager.default.urls(
                    for: .documentDirectory,
                    in: .userDomainMask).first {
            let fileURL = dir.appendingPathComponent(databaseName)
            let isFileExists = FileManager.default.fileExists(
                atPath: fileURL.path)
            if isFileExists {
                do {
                    try FileManager.default.removeItem(at: fileURL)
                    print("Database \(databaseName) deleted")
                    isOpen = false
                    ret = true
                } catch {
                    throw DatabaseHelperError.deleteDB(
                                message: "Error: deleteDB: \(error)")
                }
            } else {
                isOpen = false
            }
        }
        return ret
    }

    // MARK: - RestoreDB

    func restoreDB(databaseName: String) throws {
        if let dir = FileManager.default.urls(
                    for: .documentDirectory,
                    in: .userDomainMask).first {
            let fileURL = dir.appendingPathComponent(databaseName)
            let backupURL = dir
                .appendingPathComponent("backup-\(databaseName)")
            let isBackupExists = FileManager.default.fileExists(
                atPath: backupURL.path)
            if isBackupExists {
                let isFileExists = FileManager.default.fileExists(
                    atPath: fileURL.path)
                if isFileExists {
                    do {
                        try FileManager.default.removeItem(at: fileURL)
                        print("Database \(databaseName) deleted")
                    } catch {
                        var msg = "Error: restoreDB: \(databaseName)"
                        msg += " \(error)"
                        throw DatabaseHelperError.restoreDB(
                            message: msg)
                    }
                }
                do {
                    try FileManager.default.copyItem(
                        atPath: backupURL.path, toPath: fileURL.path)
                } catch {
                    var msg = "Error: restoreDB: copyItem"
                    msg += " \(error)"
                    throw DatabaseHelperError.restoreDB(
                        message: msg)
                }
            } else {
                var msg = "Error: restoreDB: backup-\(databaseName)"
                msg += " does not exist"
                throw DatabaseHelperError.restoreDB(
                    message: msg)
            }
        } else {
            let msg = "Error: restoreDB: FileManager.default.urls"
            throw DatabaseHelperError.restoreDB(
                message: msg)
        }
    }

    // MARK: - ImportFromJson

    func importFromJson(jsonSQLite: JsonSQLite)
                                            throws -> [String: Int] {
        var success: Bool = true
        var changes: Int = -1

        // Create the Database Schema
        do {
            changes = try ImportFromJson.createDatabaseSchema(
                            dbHelper: self, jsonSQLite: jsonSQLite,
                            path: self.path, secret: self.secret)
            if changes == -1 {
                success = false
            }
        } catch DatabaseHelperError.dbConnection(let message) {
            throw DatabaseHelperError.importFromJson(message: message)
        } catch DatabaseHelperError.createDatabaseSchema(let message) {
            throw DatabaseHelperError.importFromJson(message: message)
        }

        // create the table's data
        if success {
//            jsonSQLite.show()
            do {
                changes = try ImportFromJson.createDatabaseData(
                            dbHelper: self, jsonSQLite: jsonSQLite,
                            path: self.path, secret: self.secret)
                if changes == -1 {
                    success = false
                }
            } catch DatabaseHelperError.dbConnection(let message) {
                throw DatabaseHelperError.importFromJson(
                                message: message)
            } catch DatabaseHelperError.createDatabaseData(let message) {
                throw DatabaseHelperError.importFromJson(
                                message: message)
            }
        }
        if !success {
            changes = -1
        }
        return ["changes": changes]
    }

    // MARK: - ExportToJson

    func exportToJson(expMode: String) throws -> [String: Any] {
        var retObj: [String: Any] = [:]

        do {
            let data: [String: Any] = [
                "path": self.path, "dbName": self.databaseName,
                "encrypted": self.encrypted, "expMode": expMode,
                "secret": self.secret, "version": self.databaseVersion]
            retObj = try ExportToJson.createExportObject(
                dbHelper: self, data: data)
        } catch DatabaseHelperError.createExportObject(let message) {
           throw DatabaseHelperError.exportToJson(message: message)
        }
        return retObj
    }

    // MARK: - CreateSyncTable

    func createSyncTable() throws -> Int {
        var retObj: Int = -1
        // Open the database for writing
        guard let mDB: OpaquePointer = try
                UtilsConnection.getWritableDatabase(
                        filename: self.path, secret: secret) else {
            throw DatabaseHelperError.dbConnection(
                                    message: "Error: DB connection")
        }
        // check if the table has already been created
        do {
            let isExists: Bool = try UtilsJson.isTableExists(
                dbHelper: self, mDB: mDB, tableName: "sync_table")
            if !isExists {
                let date = Date()
                let syncTime: Int = Int(date.timeIntervalSince1970)
                var stmt: String = "BEGIN TRANSACTION;"
                stmt.append("CREATE TABLE IF NOT EXISTS sync_table (")
                stmt.append("id INTEGER PRIMARY KEY NOT NULL,")
                stmt.append("sync_date INTEGER);")
                stmt.append("INSERT INTO sync_table (sync_date) ")
                stmt.append("VALUES ('\(syncTime)');")
                stmt.append("COMMIT TRANSACTION;")
                retObj = try execute(mDB: mDB, sql: stmt)
            } else {
                retObj = 0
            }
        } catch DatabaseHelperError.tableNotExists(let message) {
            throw DatabaseHelperError.createSyncTable(message: message)
        } catch DatabaseHelperError.prepareSql(let message) {
            throw DatabaseHelperError.createSyncTable(message: message)
        }
        UtilsSQLite.closeDB(mDB: mDB, method: "createSyncTable")
        return retObj
    }

    // MARK: - SetSyncDate

    func setSyncDate(syncDate: String ) throws -> Bool {
        var retBool: Bool = false
        // Open the database for writing
        guard let mDB: OpaquePointer = try
                UtilsConnection.getWritableDatabase(
                        filename: self.path, secret: secret) else {
            throw DatabaseHelperError.dbConnection(
                                    message: "Error: DB connection")
        }
        do {
            let date = Date()
            let syncTime: Int = Int(date.timeIntervalSince1970)
            var stmt: String = "UPDATE sync_table SET sync_date = "
            stmt.append("\(syncTime) WHERE id = 1;")
            let lastId: Int = try prepareSQL(
                                    mDB: mDB, sql: stmt, values: [])
            if lastId != -1 {retBool = true}

        } catch DatabaseHelperError.prepareSql(let message) {
            throw DatabaseHelperError.createSyncDate(message: message)
        }
        UtilsSQLite.closeDB(mDB: mDB, method: "setSyncDate")
        return retBool
    }
}
// swiftlint:enable type_body_length
// swiftlint:enable file_length
