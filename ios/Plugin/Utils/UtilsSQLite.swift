//
//  UtilsSQLite.swift
//  Plugin
//
//  Created by  Quéau Jean Pierre on 24/01/2020.
//  Copyright © 2020 Max Lynch. All rights reserved.
//

import Foundation
import SQLCipher

enum UtilsSQLiteError: Error {
    case connectionFailed
    case wrongSecret
    case wrongNewSecret
    case bindFailed
    case deleteFileFailed
    case encryptionFailed
    case filePathFailed
    case renameFileFailed
    case checkVersionFailed(message: String)
    case checkVersionAndBackupFailed(message: String)
}

class UtilsSQLite {

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

    // MARK: - BeginTransaction

    class func beginTransaction(mDB: OpaquePointer) throws {
        let sql: String = "BEGIN TRANSACTION;"
        let returnCode = sqlite3_exec(mDB, sql, nil, nil, nil)
        if returnCode != SQLITE_OK {
            let errmsg: String = String(cString: sqlite3_errmsg(mDB))
            var msg = "Error: Begin Transaction failed rc: "
            msg.append("\(returnCode) message: \(errmsg)")
            throw DatabaseHelperError.beginTransaction(
                message: msg)
        }
    }

    // MARK: - CommitTransaction

    class func commitTransaction(mDB: OpaquePointer) throws {
        let sql: String = "COMMIT TRANSACTION;"
        let returnCode = sqlite3_exec(mDB, sql, nil, nil, nil)
        if returnCode != SQLITE_OK {
            let errmsg: String = String(cString: sqlite3_errmsg(mDB))
            var msg = "Error: Commit Transaction failed rc: "
            msg.append("\(returnCode) message: \(errmsg)")
            throw DatabaseHelperError.commitTransaction(
                message: msg)
        }
    }

    // MARK: - ExecuteCommit

    class func executeCommit(dbHelper: DatabaseHelper,
                             mDB: OpaquePointer, sql: String)
                                    throws -> Int {
        var changes: Int = -1
        do {
            changes = try dbHelper.execute(mDB: mDB, sql: sql)
            if changes != -1 {
                try UtilsSQLite.commitTransaction(mDB: mDB)
            }
        } catch DatabaseHelperError.execute(let message) {
            throw DatabaseHelperError.executeCommit(message: message)
        } catch DatabaseHelperError.commitTransaction(let message) {
            throw DatabaseHelperError.executeCommit(message: message)
        }
        return changes
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
                        throw DatabaseHelperError
                        .fetchColumnInfo(message: message)
                    }
                    columnNames.append(String(cString: name))
                    columnTypes.append(UtilsSQLite.getColumnType(
                                        index: index, stmt: handle))
                }
                fetchColumnInfo = false
            }

            var rowData: [String: Any] = [:]
            for index in 0..<columnCount {
                let key = columnNames[Int(index)]
                let type = columnTypes[Int(index)]

                if let val = self.getColumnValue(
                    index: index, type: type, stmt: handle) {
                    rowData[key] = val
                }
            }
            result.append(rowData)
        }
        return result
    }

    // MARK: - CloseDB

    class func closeDB(mDB: OpaquePointer?, method: String) {
        var message: String = ""
        let returnCode: Int32 = sqlite3_close_v2(mDB)
        if returnCode != SQLITE_OK {
            let errmsg: String = String(cString: sqlite3_errmsg(mDB))
            message = "Error: \(method) closing the database rc: " +
                      "\(returnCode) message: \(errmsg)"
            print(message)
        }
    }

}
