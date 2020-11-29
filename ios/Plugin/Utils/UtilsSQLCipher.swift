//
//  UtilsSQLCipher.swift
//  Plugin
//
//  Created by  Quéau Jean Pierre on 26/11/2020.
//  Copyright © 2020 Max Lynch. All rights reserved.
//

import Foundation
import SQLCipher

//1234567890123456789012345678901234567890123456789012345678901234567890
enum UtilsSQLCipherError: Error {
    case openOrCreateDatabase(message: String)
    case bindFailed
    case setForeignKeyConstraintsEnabled(message: String)
    case getVersion(message: String)
    case setVersion(message: String)
    case closeDB(message: String)
    case close(message: String)
    case changePassword(message: String)
    case beginTransaction(message: String)
    case commitTransaction(message: String)
    case execute(message: String)
    case prepareSQL(message: String)
    case querySQL(message: String)
    case fetchColumnInfo(message: String)
    case deleteDB(message: String)
    case executeSet(message: String)
    case restoreDB(message: String)
    case deleteBackupDB(message: String)
}

// swiftlint:disable file_length
// swiftlint:disable type_body_length
class UtilsSQLCipher {

// MARK: - OpenOrCreateDatabase

    class func openOrCreateDatabase(filename: String,
                                    password: String = "",
                                    readonly: Bool = false
                          ) throws -> OpaquePointer? {

        let flags = readonly ? SQLITE_OPEN_READONLY :
            SQLITE_OPEN_CREATE | SQLITE_OPEN_READWRITE
        var mDB: OpaquePointer?
        if sqlite3_open_v2(filename, &mDB, flags |
                            SQLITE_OPEN_FULLMUTEX, nil) == SQLITE_OK {

           if password.count > 0 {
                let keyStatementString = """
                PRAGMA key = '\(password)';
                """
            let msg: String = "Wrong Secret"
                if sqlite3_exec(mDB, keyStatementString, nil, nil, nil)
                                == SQLITE_OK {
                    var stmt: String = "SELECT count(*) FROM "
                    stmt.append("sqlite_master;")
                    if sqlite3_exec(mDB, stmt, nil, nil, nil) !=
                            SQLITE_OK {
                        throw UtilsSQLCipherError
                                .openOrCreateDatabase(message: msg)
                    }
                } else {
                    throw UtilsSQLCipherError
                            .openOrCreateDatabase(message: msg)
                }
            }

            /* this should work but doe not sqlite3_key_v2 is not known
            if password.count > 0 {
                let nKey:Int32 = Int32(password.count)
                if sqlite3_key_v2(mDB!, filename, password, nKey) == SQLITE_OK {
                    var stmt: String = "SELECT count(*) FROM "
                    stmt.append("sqlite_master;")
                    if sqlite3_exec(mDB, stmt, nil, nil, nil) !=
                            SQLITE_OK {
                        print("Unable to open a database \(filename)")
                        throw UtilsSQLCipherError
                                .openOrCreateDatabase(message: msg)
                    }
                } else  {
                    print("Unable to open a database \(filename)")
                    throw UtilsSQLCipherError
                                .openOrCreateDatabase(message: msg)
                }
            }
            print("Successfully opened database \(filename)")
*/
            return mDB
        } else {
            let message: String = "open_v2 failed"
            throw UtilsSQLCipherError
                            .openOrCreateDatabase(message: message)
        }
    }

    // MARK: - ChangePassword

    class func changePassword(filename: String, password: String,
                              newpassword: String) throws {
        do {
            // open the db with password
            let oDB: OpaquePointer? = try
                openOrCreateDatabase(filename: filename,
                                     password: password,
                                     readonly: false)
            // change password
            let keyStatementString = """
            PRAGMA rekey = '\(newpassword)';
            """
            let returnCode: Int32 = sqlite3_exec(
                        oDB, keyStatementString, nil, nil, nil)
            if returnCode != SQLITE_OK {
                throw UtilsSQLCipherError
                        .changePassword(message: "change password")
            }
            // close the db
            try UtilsSQLCipher.close(oDB: oDB)

        } catch UtilsSQLCipherError.openOrCreateDatabase(let message) {
            throw UtilsSQLCipherError
                    .changePassword(message: message)
        } catch UtilsSQLCipherError.close(_) {
            throw UtilsSQLCipherError
                        .changePassword(message: "close failed")
        }
    }

    // MARK: - SetForeignKeyConstraintsEnabled

    class func setForeignKeyConstraintsEnabled(mDB: Database,
                                               toggle: Bool) throws {
        var msg: String = "Error Set Foreign Key: "
        if !mDB.isDBOpen() {
            msg.append("Database not opened")
            throw UtilsSQLCipherError
                        .setForeignKeyConstraintsEnabled(message: msg)
        }
        var key: String = "OFF"
        if toggle {
            key = "ON"
        }
        let sqltr: String = "PRAGMA foreign_keys = \(key);"
        if sqlite3_exec(mDB.mDb, sqltr, nil, nil, nil) != SQLITE_OK {
            msg.append("not successful")
            throw UtilsSQLCipherError
                        .setForeignKeyConstraintsEnabled(message: msg)
        }

    }

    // MARK: - GetVersion

    class func getVersion(mDB: Database) throws -> Int {
        var msg: String = "Error Get Version: "
        if !mDB.isDBOpen() {
            msg.append("Database not opened")
            throw UtilsSQLCipherError.getVersion(message: msg)
        }
        var version: Int = 0

        let sqltr: String = "PRAGMA user_version;"
        do {
            let resVersion =  try UtilsSQLCipher.querySQL(mDB: mDB,
                                                    sql: sqltr,
                                                    values: [])
            if resVersion.count > 0 {
                guard let res: Int64 = resVersion[0]["user_version"]
                        as? Int64 else {
                    throw UtilsSQLCipherError.getVersion(
                        message: "Error get version failed")
                }
                if res > 0 {
                    version =  Int(truncatingIfNeeded: res)

                }
            }
            return version
        } catch UtilsSQLCipherError.querySQL(let message) {
            throw UtilsUpgradeError.getDatabaseVersionFailed(
                message: message)
        }
    }

    // MARK: - SetVersion

    class func setVersion(mDB: Database, version: Int) throws {
        var msg: String = "Error Set Version: "
        if !mDB.isDBOpen() {
            msg.append("Database not opened")
            throw UtilsSQLCipherError.setVersion(message: msg)
        }
        let sqltr: String = "PRAGMA user_version = \(version);"
        if sqlite3_exec(mDB.mDb, sqltr, nil, nil, nil) != SQLITE_OK {
            throw UtilsSQLCipherError.setVersion(message: msg)
        }
    }

    // MARK: - CloseDB

    class func closeDB(mDB: Database) throws {
        var msg: String = "Error closeDB: "
        if !mDB.isDBOpen() {
            msg.append("Database not opened")
            throw UtilsSQLCipherError.closeDB(message: msg)
        }
        do {
            try UtilsSQLCipher.close(oDB: mDB.mDb)
        } catch UtilsSQLCipherError.close(let message) {
            throw UtilsSQLCipherError.closeDB(message: message)
        }
    }

    // MARK: - Close

    class func close(oDB: OpaquePointer?) throws {
        var message: String = ""
        let returnCode: Int32 = sqlite3_close_v2(oDB)
        if returnCode != SQLITE_OK {
            let errmsg: String = String(
                                    cString: sqlite3_errmsg(oDB))
            message = "Error: closing the database rc: " +
                      "\(returnCode) message: \(errmsg)"
            throw UtilsSQLCipherError.close(message: message)
        }
    }

    // MARK: - BeginTransaction

    class func beginTransaction(mDB: Database) throws {
        var msg: String = "Error beginTransaction: "
        if !mDB.isDBOpen() {
            msg.append("Database not opened")
            throw UtilsSQLCipherError.beginTransaction(message: msg)
        }
        let sql: String = "BEGIN TRANSACTION;"
        let returnCode = sqlite3_exec(mDB.mDb, sql, nil, nil, nil)
        if returnCode != SQLITE_OK {
            let errmsg: String = String(
                                    cString: sqlite3_errmsg(mDB.mDb))
            var msg = "Error: Begin Transaction failed rc: "
            msg.append("\(returnCode) message: \(errmsg)")
            throw UtilsSQLCipherError.beginTransaction(
                message: msg)
        }
    }

    // MARK: - CommitTransaction

    class func commitTransaction(mDB: Database) throws {
        var msg: String = "Error commitTransaction: "
        if !mDB.isDBOpen() {
            msg.append("Database not opened")
            throw UtilsSQLCipherError.commitTransaction(message: msg)
        }
        let sql: String = "COMMIT TRANSACTION;"
        let returnCode = sqlite3_exec(mDB.mDb, sql, nil, nil, nil)
        if returnCode != SQLITE_OK {
            let errmsg: String = String(
                                    cString: sqlite3_errmsg(mDB.mDb))
            var msg = "Error: Commit Transaction failed rc: "
            msg.append("\(returnCode) message: \(errmsg)")
            throw UtilsSQLCipherError.commitTransaction(
                message: msg)
        }
    }

    // MARK: - PrepareSQL

    // swiftlint:disable function_body_length
    class func prepareSQL(mDB: Database,
                          sql: String, values: [Any]) throws -> Int64 {
        var msg: String = "Error prepareSQL: "
        if !mDB.isDBOpen() {
            msg.append("Database not opened")
            throw UtilsSQLCipherError.prepareSQL(message: msg)
        }
        var runSQLStatement: OpaquePointer?
        var message: String = ""
        var lastId: Int64 = -1

        var returnCode: Int32 = sqlite3_prepare_v2(
                            mDB.mDb, sql, -1, &runSQLStatement, nil)
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
                let errmsg: String = String(
                                    cString: sqlite3_errmsg(mDB.mDb))
                message = "Error: prepareSQL step failed rc: "
                message.append("\(returnCode) message: \(errmsg)")
            }
        } else {
            let errmsg: String = String(
                                    cString: sqlite3_errmsg(mDB.mDb))
            message = "Error: prepareSQL prepare failed rc: "
            message.append("\(returnCode) message: \(errmsg)")
        }
        returnCode = sqlite3_finalize(runSQLStatement)
        if returnCode != SQLITE_OK {
            let errmsg: String = String(
                                    cString: sqlite3_errmsg(mDB.mDb))
            message = "Error: prepareSQL finalize failed rc: "
            message.append("\(returnCode) message: \(errmsg)")
        }
        if message.count > 0 {
            throw UtilsSQLCipherError.prepareSQL(message: message)
        } else {
            lastId = Int64(sqlite3_last_insert_rowid(mDB.mDb))
            return lastId
        }
    }
    // swiftlint:enable function_body_length

    // MARK: - querySQL

    class func querySQL(mDB: Database, sql: String,
                        values: [String]) throws -> [[String: Any]] {
        var msg: String = "Error prepareSQL: "
        if !mDB.isDBOpen() {
            msg.append("Database not opened")
            throw UtilsSQLCipherError.querySQL(message: msg)
        }
        var selectSQLStatement: OpaquePointer?
        var result: [[String: Any]] = []
        var message: String = ""
        var returnCode: Int32 =
            sqlite3_prepare_v2(mDB.mDb, sql, -1, &selectSQLStatement,
                               nil)
        if returnCode == SQLITE_OK {
            if !values.isEmpty {
            // do the binding of values
                message = UtilsBinding.bindValues(
                        handle: selectSQLStatement, values: values)
            }
            if message.count == 0 {
                do {
                    result = try UtilsSQLCipher.fetchColumnInfo(
                                        handle: selectSQLStatement)
                } catch UtilsSQLCipherError
                                .fetchColumnInfo(let message) {
                    throw UtilsSQLCipherError.querySQL(message: message)
                }
            }
        } else {
            let errmsg: String = String(
                                    cString: sqlite3_errmsg(mDB.mDb))
            message = "Error: querySQL prepare failed rc: "
            message.append("\(returnCode) message: \(errmsg)")
        }
        returnCode = sqlite3_finalize(selectSQLStatement)
        if returnCode != SQLITE_OK {
            let errmsg: String = String(
                                    cString: sqlite3_errmsg(mDB.mDb))
            message = "Error: querySQL finalize failed rc: "
            message.append("\(returnCode) message: \(errmsg)")
        }
        if message.count > 0 {
            throw UtilsSQLCipherError.querySQL(message: message)
        } else {
            return result
        }
    }

    // MARK: - FetchColumnInfo

    class func fetchColumnInfo(handle: OpaquePointer?)
                                throws -> [[String: Any]] {
        var result: [[String: Any]] = []
        var fetchColumnInfo = true
        var columnCount: Int32 = 0
        var columnNames = [String]()
        var columnTypes = [Int32]()

        while sqlite3_step(handle) == SQLITE_ROW {
            if fetchColumnInfo {
                columnCount = sqlite3_column_count(handle)
                for index in 0..<columnCount {
                    guard let name = sqlite3_column_name(handle, index)
                    else {
                        var message = "Error: querySQL column_name "
                        message.append("failed")
                        throw UtilsSQLCipherError
                        .fetchColumnInfo(message: message)
                    }
                    columnNames.append(String(cString: name))
                    columnTypes.append(UtilsSQLCipher.getColumnType(
                                        index: index, stmt: handle))
                }
                fetchColumnInfo = false
            }

            var rowData: [String: Any] = [:]
            for index in 0..<columnCount {
                let key = columnNames[Int(index)]
                let type = columnTypes[Int(index)]

                if let val = UtilsSQLCipher.getColumnValue(
                    index: index, type: type, stmt: handle) {
                    rowData[key] = val
                }
            }
            result.append(rowData)
        }
        return result
    }

    // MARK: - GetColumnType

    class func getColumnType(index: Int32, stmt: OpaquePointer?)
                                -> Int32 {
        var type: Int32 = 0
        // Column types - http://www.sqlite.org/datatype3.html (section 2.2 table column 1)
        let blobTypes = ["BINARY", "BLOB", "VARBINARY"]
        var textTypes: [String] = ["CHAR", "CHARACTER", "CLOB",
                                   "NATIONAL VARYING CHARACTER",
                                   "NATIVE CHARACTER"]
        let textTypes1: [String] = ["NCHAR", "NVARCHAR", "TEXT",
                                    "VARCHAR", "VARIANT",
                                    "VARYING CHARACTER"]
        textTypes.append(contentsOf: textTypes1)
        let dateTypes = ["DATE", "DATETIME", "TIME", "TIMESTAMP"]
        var intTypes  = ["BIGINT", "BIT", "BOOL", "BOOLEAN", "INT",
                         "INT2", "INT8", "INTEGER", "MEDIUMINT"]
        let intTypes1: [String] = ["SMALLINT", "TINYINT"]
        intTypes.append(contentsOf: intTypes1)
        let nullTypes = ["NULL"]
        let realTypes = ["DECIMAL", "DOUBLE", "DOUBLE PRECISION",
                         "FLOAT", "NUMERIC", "REAL"]
        // Determine type of column -
        // http://www.sqlite.org/c3ref/c_blob.html
        let declaredType = sqlite3_column_decltype(stmt, index)
        if let dclType = declaredType {
            var declaredType = String(cString: dclType).uppercased()
            if let index = declaredType.firstIndex(of: "(" ) {
                declaredType = String(declaredType[..<index])
            }
            if intTypes.contains(declaredType) {
                return SQLITE_INTEGER
            }
            if realTypes.contains(declaredType) {
                return SQLITE_FLOAT
            }
            if textTypes.contains(declaredType) {
                return SQLITE_TEXT
            }
            if blobTypes.contains(declaredType) {
                return SQLITE_BLOB
            }
            if dateTypes.contains(declaredType) {
                return SQLITE_FLOAT
            }
            if nullTypes.contains(declaredType) {
                return SQLITE_NULL
            }
            return SQLITE_NULL
        } else {
            type = sqlite3_column_type(stmt, index)
            return type
        }
    }

    // MARK: - GetColumnValue

    class func getColumnValue(index: Int32, type: Int32,
                              stmt: OpaquePointer?) -> Any? {
        if sqlite3_column_type(stmt, index) == SQLITE_NULL {
            return "NULL"
        } else {
            switch type {
            case SQLITE_INTEGER:
                let val = sqlite3_column_int64(stmt, index)
                return Int64(val)
            case SQLITE_FLOAT:
                let val = sqlite3_column_double(stmt, index)
                return Double(val)
            case SQLITE_BLOB:
                let data = sqlite3_column_blob(stmt, index)
                let size = sqlite3_column_bytes(stmt, index)
                let val = NSData(bytes: data, length: Int(size))
                // Convert to string
                let strVal: String = String(decoding: val,
                                            as: UTF8.self)
                return strVal
            case SQLITE_TEXT:
                let buffer = sqlite3_column_text(stmt, index)
                var val: String
                if let mBuffer = buffer {
                    val = String(cString: mBuffer)
                } else {
                    val = "NULL"
                }
                return val
            case SQLITE_NULL:
                return "NULL"
            default:
                return "NULL"
            }
        }
    }

    // MARK: - dbChanges

    class func dbChanges(mDB: OpaquePointer?) -> Int {
        return Int(sqlite3_total_changes(mDB))
    }

    // MARK: - Execute

    class func execute(mDB: Database, sql: String) throws {
        var msg: String = "Error execute: "
        if !mDB.isDBOpen() {
            msg.append("Database not opened")
            throw UtilsSQLCipherError.execute(message: msg)
        }

        let returnCode: Int32 = sqlite3_exec(mDB.mDb, sql, nil,
                                             nil, nil)
        if returnCode != SQLITE_OK {
            let errmsg: String = String(
                                    cString: sqlite3_errmsg(mDB.mDb))
            var msg: String = "Error: execute failed rc: \(returnCode)"
            msg.append(" message: \(errmsg)")
            throw UtilsSQLCipherError.execute(
                message: msg)
        }
         return
    }

    // MARK: - DeleteDB

    class func deleteDB(databaseName: String) throws {
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
                } catch let error {
                    var msg: String = "Error: deleteDB: "
                    msg.append(" \(error.localizedDescription)")
                    throw UtilsSQLCipherError.deleteDB(
                        message: msg)
                }
            }
        }
    }

    // MARK: - ExecuteSet

    class func executeSet(mDB: Database, set: [[String: Any]])
                                        throws -> Int64 {
        var msg: String = "Error executeSet: "
        if !mDB.isDBOpen() {
            msg.append("Database not opened")
            throw UtilsSQLCipherError.executeSet(message: msg)
        }
       var lastId: Int64 = -1
        do {
            for dict  in set {
                guard let sql: String = dict["statement"] as? String
                else {
                    throw UtilsSQLCipherError.executeSet(
                        message: "No statement given")
                }
                guard let values: [Any] = dict["values"] as? [Any]
                else {
                    throw UtilsSQLCipherError.executeSet(
                        message: "No values given")
                }
                lastId = try UtilsSQLCipher
                        .prepareSQL(mDB: mDB, sql: sql, values: values)
                if  lastId == -1 {
                    let message: String = "failed in prepareSQL"
                    throw UtilsSQLCipherError.executeSet(
                                            message: message)
                }
            }

            return lastId
        } catch UtilsSQLCipherError.prepareSQL(let message) {
            throw UtilsSQLCipherError.executeSet(
                                    message: message)
        }
    }

    // MARK: - RestoreDB

    class func restoreDB(databaseName: String) throws {
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
                        try FileManager
                            .default.copyItem(atPath: backupURL.path,
                                              toPath: fileURL.path)
                        try FileManager.default
                                            .removeItem(at: backupURL)
                        print("Database backup-\(databaseName) deleted")
                    } catch {
                        var msg = "Error: restoreDB : \(databaseName)"
                        msg += " \(error)"
                        throw UtilsSQLCipherError.restoreDB(
                            message: msg)
                    }
                } else {
                    var msg = "Error: restoreDB: \(databaseName)"
                    msg += " does not exist"
                    throw UtilsSQLCipherError.restoreDB(
                        message: msg)

                }
            } else {
                var msg = "Error: restoreDB: backup-\(databaseName)"
                msg += " does not exist"
                throw UtilsSQLCipherError.restoreDB(
                    message: msg)
            }
        } else {
            let msg = "Error: restoreDB: FileManager.default.urls"
            throw UtilsSQLCipherError.restoreDB(
                message: msg)
        }
    }

    // MARK: - deleteBackupDB

    class func deleteBackupDB(databaseName: String) throws {
        if let dir = FileManager.default.urls(
                    for: .documentDirectory,
                    in: .userDomainMask).first {
            let backupURL = dir
                .appendingPathComponent("backup-\(databaseName)")
            let isBackupExists = FileManager.default.fileExists(
                atPath: backupURL.path)
            if isBackupExists {
                do {
                    try FileManager.default
                                        .removeItem(at: backupURL)
                    print("Database backup-\(databaseName) deleted")
                } catch {
                    var msg = "Error: deleteBackupDB : \(databaseName)"
                    msg += " \(error)"
                    throw UtilsSQLCipherError.deleteBackupDB(
                        message: msg)
                }
            } else {
                var msg = "Error: deleteBackupDB: "
                msg.append("backup-\(databaseName) does not exist")
                throw UtilsSQLCipherError.deleteBackupDB(message: msg)
            }
        } else {
            let msg = "Error: deleteBackupDB: FileManager.default.urls"
            throw UtilsSQLCipherError.deleteBackupDB(
                message: msg)
        }

    }

}
// swiftlint:enable type_body_length
// swiftlint:enable file_length
