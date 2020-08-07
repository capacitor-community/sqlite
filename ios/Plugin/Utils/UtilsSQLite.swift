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
}

let SQLITETRANSIENT = unsafeBitCast(-1, to: sqlite3_destructor_type.self)
// swiftlint:disable file_length
// swiftlint:disable type_body_length
class UtilsSQLite {
    // swiftlint:disable function_parameter_count
    class func createConnection(dbHelper: DatabaseHelper, path: String, mode: String,
                                encrypted: Bool, secret: String, newsecret: String) -> String {
        var message: String = ""
        if !encrypted && mode == "no-encryption" {
            message = UtilsSQLite.createConnectionNoEncryption(dbHelper: dbHelper, path: path)
        } else if encrypted && mode == "secret" && secret.count > 0 {
            message = UtilsSQLite.createConnectionEncryptedWithSecret(dbHelper: dbHelper,
                                                                      path: path, secret: secret,
                                                                      newsecret: newsecret)
        } else if encrypted && mode == "newsecret" && secret.count > 0 && newsecret.count > 0 {
            message = UtilsSQLite.createConnectionEncryptedWithNewSecret(dbHelper: dbHelper,
                                                                         path: path, secret: secret,
                                                                         newsecret: newsecret)
        } else if encrypted && mode == "encryption" && secret.count > 0 {
            message = UtilsSQLite.makeEncryption(dbHelper: dbHelper, path: path,
                                                 secret: secret)
        }
        return message
    }
    // swiftlint:enable function_parameter_count
    class func createConnectionNoEncryption(dbHelper: DatabaseHelper, path: String) -> String {
        var message: String = ""
        var mDB: OpaquePointer?
        do {
            try mDB = UtilsSQLite.connection(filename: path)
        } catch {
            message = "init: Error Database connection failed"
        }
        dbHelper.closeDB(mDB: mDB, method: "init")
        return message
    }
    class func createConnectionEncryptedWithSecret(dbHelper: DatabaseHelper, path: String,
                                                   secret: String, newsecret: String) -> String {
        var message: String = ""
        var mDB: OpaquePointer?
        do {
            try mDB = UtilsSQLite.connection(filename: path,
                                             readonly: false, key: secret)
        } catch {
            // for testing purpose
            if secret == "wrongsecret" {
                message = "init: Error Database connection failed wrong secret"
            } else {
                // test if you can open it with the new secret in case of multiple runs
                do {
                    try mDB = UtilsSQLite.connection(filename: path,
                                                     readonly: false, key: newsecret)
                    message = "swap newsecret"
                } catch {
                    message = "init: Error Database connection failed wrong secret"
                }
            }
        }
        dbHelper.closeDB(mDB: mDB, method: "init")
        return message
    }
    class func createConnectionEncryptedWithNewSecret(dbHelper: DatabaseHelper, path: String,
                                                      secret: String, newsecret: String) -> String {
        var message: String = ""
        var mDB: OpaquePointer?
        do {
            try mDB = UtilsSQLite.connection(filename: path,
                                             readonly: false, key: secret)
            let keyStatementString = """
            PRAGMA rekey = '\(newsecret)';
            """
            let returnCode: Int32 = sqlite3_exec(mDB, keyStatementString, nil, nil, nil)
            if returnCode != SQLITE_OK {
                message = "connection: Unable to open a connection to database at \(path))"
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
            message = "init: Error Database connection failed wrong secret"
        }
        dbHelper.closeDB(mDB: mDB, method: "init")
        return message
    }
    class func makeEncryption(dbHelper: DatabaseHelper, path: String, secret: String) -> String {
        var message: String = ""
        var res: Bool = false
        do {
            try res = UtilsSQLite.encryptDatabase(dbHelper: dbHelper, filePath: path, secret: secret)
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
    class func connection(filename: String, readonly: Bool = false, key: String = "") throws -> OpaquePointer? {
        let flags = readonly ? SQLITE_OPEN_READONLY : SQLITE_OPEN_CREATE | SQLITE_OPEN_READWRITE
        var mDB: OpaquePointer?
        if sqlite3_open_v2(filename, &mDB, flags | SQLITE_OPEN_FULLMUTEX, nil) == SQLITE_OK {
            if key.count > 0 {
                let keyStatementString = """
                PRAGMA key = '\(key)';
                """
                if sqlite3_exec(mDB, keyStatementString, nil, nil, nil) == SQLITE_OK {
                    let stmt: String = "SELECT count(*) FROM sqlite_master;"
                    if sqlite3_exec(mDB, stmt, nil, nil, nil) != SQLITE_OK {
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
    class func getWritableDatabase(filename: String, secret: String) throws -> OpaquePointer? {
        guard let mDB = try? connection(filename: filename, readonly: false, key: secret) else {
            throw UtilsSQLiteError.connectionFailed
        }
        return mDB
    }
    class func getReadableDatabase(filename: String, secret: String) throws -> OpaquePointer? {
        guard let mDB = try? connection(filename: filename, readonly: true, key: secret) else {
            throw UtilsSQLiteError.connectionFailed
        }
        return mDB
    }
    class func getColumnType(index: Int32, stmt: OpaquePointer?) -> Int32 {
        var type: Int32 = 0
        // Column types - http://www.sqlite.org/datatype3.html (section 2.2 table column 1)
        let blobTypes = ["BINARY", "BLOB", "VARBINARY"]
        var textTypes: [String] = ["CHAR", "CHARACTER", "CLOB", "NATIONAL VARYING CHARACTER", "NATIVE CHARACTER"]
        let textTypes1: [String] = ["NCHAR", "NVARCHAR", "TEXT", "VARCHAR", "VARIANT", "VARYING CHARACTER"]
        textTypes.append(contentsOf: textTypes1)
        let dateTypes = ["DATE", "DATETIME", "TIME", "TIMESTAMP"]
        var intTypes  = ["BIGINT", "BIT", "BOOL", "BOOLEAN", "INT", "INT2", "INT8", "INTEGER", "MEDIUMINT"]
        let intTypes1: [String] = ["SMALLINT", "TINYINT"]
        intTypes.append(contentsOf: intTypes1)
        let nullTypes = ["NULL"]
        let realTypes = ["DECIMAL", "DOUBLE", "DOUBLE PRECISION", "FLOAT", "NUMERIC", "REAL"]
        // Determine type of column - http://www.sqlite.org/c3ref/c_blob.html
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
    class func getColumnValue(index: Int32, type: Int32, stmt: OpaquePointer?) -> Any? {
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
                let strVal: String = String(decoding: val, as: UTF8.self)
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
    class func isFileExist(filePath: String) -> Bool {
        var ret: Bool = false
        let fileManager = FileManager.default
        if fileManager.fileExists(atPath: filePath) {
            ret = true
        }
        return ret
    }
    class func getFilePath(fileName: String) throws -> String {
        if let path: String = NSSearchPathForDirectoriesInDomains(
            .documentDirectory, .userDomainMask, true
        ).first {
            let url = NSURL(fileURLWithPath: path)
            if let pathComponent = url.appendingPathComponent("\(fileName)") {
                return pathComponent.path
            } else {
                throw UtilsSQLiteError.filePathFailed
            }
        } else {
            throw UtilsSQLiteError.filePathFailed
        }
    }
    class func deleteFile(fileName: String) throws -> Bool {
        var ret: Bool = false
        do {
            let filePath: String = try getFilePath(fileName: fileName)
            if isFileExist(filePath: filePath) {
                let fileManager = FileManager.default
                do {
                    try fileManager.removeItem(atPath: filePath)
                    ret = true
                } catch let error {
                    print("Error: \(error)")
                    throw UtilsSQLiteError.deleteFileFailed
                }
            }
        } catch let error {
            print("Error: \(error)")
            throw UtilsSQLiteError.filePathFailed
        }
        return ret
    }
    class func renameFile (filePath: String, toFilePath: String) throws {
        let fileManager = FileManager.default
        do {
            if isFileExist(filePath: toFilePath) {
                let fileName = URL(fileURLWithPath: toFilePath).lastPathComponent
                try  _ = deleteFile(fileName: fileName)
            }
            try fileManager.moveItem(atPath: filePath, toPath: toFilePath)
        } catch let error {
            print("Error: \(error)")
            throw UtilsSQLiteError.renameFileFailed
        }
    }
    class func encryptDatabase(dbHelper: DatabaseHelper, filePath: String, secret: String) throws -> Bool {
        var ret: Bool = false
        var mDB: OpaquePointer?
        do {
            if isFileExist(filePath: filePath) {
                do {
                    let tempPath: String = try getFilePath(fileName: "temp.db")
                    try renameFile(filePath: filePath, toFilePath: tempPath)
                    try mDB = UtilsSQLite.connection(filename: tempPath)
                    try _ = UtilsSQLite.connection(filename: filePath, readonly: false, key: secret)
                    let stmt: String = """
                    ATTACH DATABASE '\(filePath)' AS encrypted KEY '\(secret)';
                    SELECT sqlcipher_export('encrypted');
                    DETACH DATABASE encrypted;
                    """
                    if sqlite3_exec(mDB, stmt, nil, nil, nil) == SQLITE_OK {
                        try _ = deleteFile(fileName: "temp.db")
                        ret = true
                    }
                } catch let error {
                    print("Error: \(error)")
                    throw UtilsSQLiteError.encryptionFailed
                }
            }
        } catch let error {
            print("Error: \(error)")
            throw UtilsSQLiteError.filePathFailed
        }
        dbHelper.closeDB(mDB: mDB, method: "init")
        return ret
    }
    class func beginTransaction(mDB: OpaquePointer) throws {
        let sql: String = "BEGIN TRANSACTION;"
        let returnCode = sqlite3_exec(mDB, sql, nil, nil, nil)
        if returnCode != SQLITE_OK {
            let errmsg: String = String(cString: sqlite3_errmsg(mDB))
            throw DatabaseHelperError.beginTransaction(
                message: "Error: Begin Transaction failed rc: \(returnCode) message: \(errmsg)")
        }
    }
    class func commitTransaction(mDB: OpaquePointer) throws {
        let sql: String = "COMMIT TRANSACTION;"
        let returnCode = sqlite3_exec(mDB, sql, nil, nil, nil)
        if returnCode != SQLITE_OK {
            let errmsg: String = String(cString: sqlite3_errmsg(mDB))
            throw DatabaseHelperError.commitTransaction(
                message: "Error: Commit Transaction failed rc: \(returnCode) message: \(errmsg)")
        }
    }
    class func executeCommit(dbHelper: DatabaseHelper, mDB: OpaquePointer, sql: String) throws -> Int {
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
    class func fetchColumnInfo(handle: OpaquePointer?) throws -> [[String: Any]] {
        var result: [[String: Any]] = []
        var fetchColumnInfo = true
        var columnCount: Int32 = 0
        var columnNames = [String]()
        var columnTypes = [Int32]()

        while sqlite3_step(handle) == SQLITE_ROW {
            if fetchColumnInfo {
                columnCount = sqlite3_column_count(handle)

                for index in 0..<columnCount {
                    guard let name = sqlite3_column_name(handle, index) else {
                        let message = "Error: querySQL column_name failed"
                        throw DatabaseHelperError.fetchColumnInfo(message: message)
                    }
                    columnNames.append(String(cString: name))
                    columnTypes.append(UtilsSQLite.getColumnType(index: index, stmt: handle))
                }
                fetchColumnInfo = false
            }

            var rowData: [String: Any] = [:]
            for index in 0..<columnCount {
                let key = columnNames[Int(index)]
                let type = columnTypes[Int(index)]

                if let val = UtilsSQLite.getColumnValue(index: index, type: type, stmt: handle) {
                    rowData[key] = val
                }
            }
            result.append(rowData)
        }
        return result
    }
}
// swiftlint:enable type_body_length
// swiftlint:enable file_length
