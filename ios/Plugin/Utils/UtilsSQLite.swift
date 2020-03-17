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

let SQLITE_TRANSIENT = unsafeBitCast(-1, to: sqlite3_destructor_type.self)


class UtilsSQLite {
    class func connection(filename: String, readonly: Bool = false, key: String = "") throws -> OpaquePointer {
        let flags = readonly ? SQLITE_OPEN_READONLY : SQLITE_OPEN_CREATE | SQLITE_OPEN_READWRITE
        var db: OpaquePointer? = nil
        if sqlite3_open_v2(filename, &db, flags | SQLITE_OPEN_FULLMUTEX, nil) == SQLITE_OK {
            if key.count > 0 {
                let keyStatementString = """
                PRAGMA key = '\(key)';
                """
                if sqlite3_exec(db, keyStatementString, nil,nil,nil) == SQLITE_OK  {
                    if (sqlite3_exec(db!, "SELECT count(*) FROM sqlite_master;", nil, nil, nil) != SQLITE_OK) {
                        print("Unable to open a connection to database at \(filename)")
                        throw UtilsSQLiteError.wrongSecret
                    }
                } else {
                    print("connection: Unable to open a connection to database at \(filename)")
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
            return db!
        } else {
            print("connection: Unable to open a connection to database at \(filename)")
            throw UtilsSQLiteError.connectionFailed
        }
    }
        
    class func getWritableDatabase(filename: String, secret: String) throws -> OpaquePointer? {
        guard let db = try? connection(filename: filename,readonly: false,key: secret) else {
            throw UtilsSQLiteError.connectionFailed
        }
        return db
    }
    class func getReadableDatabase(filename: String, secret: String) throws -> OpaquePointer? {
        guard let db = try? connection(filename:filename, readonly: true,key: secret) else {
            throw UtilsSQLiteError.connectionFailed
        }
        return db
    }
    class func bind( handle: OpaquePointer, value: Any?, idx:Int) throws {

        if value == nil {
            sqlite3_bind_null(handle, Int32(idx))
        } else if let value = value as? Blob {
            sqlite3_bind_blob(handle, Int32(idx), value.bytes, Int32(value.bytes.count), SQLITE_TRANSIENT)
        } else if let value = value as? Double {
            sqlite3_bind_double(handle, Int32(idx), value)
        } else if let value = value as? Int64 {
            sqlite3_bind_int64(handle, Int32(idx), value)
        } else if let value = value as? String {
            sqlite3_bind_text(handle, Int32(idx), value, -1, SQLITE_TRANSIENT)
        } else if let value = value as? Int {
            sqlite3_bind_int(handle,Int32(idx), Int32(value))
         } else if let value = value as? Bool {
            var bInt: Int = 0
            if(value) {bInt = 1}
            sqlite3_bind_int(handle,Int32(idx), Int32(bInt))
        } else {
            throw UtilsSQLiteError.bindFailed
        }

    }
    class func getColumnType(index:Int32, stmt:OpaquePointer) -> Int32 {
        var type:Int32 = 0

        // Column types - http://www.sqlite.org/datatype3.html (section 2.2 table column 1)
        let blobTypes = ["BINARY", "BLOB", "VARBINARY"]
        let textTypes = ["CHAR", "CHARACTER", "CLOB", "NATIONAL VARYING CHARACTER", "NATIVE CHARACTER", "NCHAR", "NVARCHAR", "TEXT", "VARCHAR", "VARIANT", "VARYING CHARACTER"]
        let dateTypes = ["DATE", "DATETIME", "TIME", "TIMESTAMP"]
        let intTypes  = ["BIGINT", "BIT", "BOOL", "BOOLEAN", "INT", "INT2", "INT8", "INTEGER", "MEDIUMINT", "SMALLINT", "TINYINT"]
        let nullTypes = ["NULL"]
        let realTypes = ["DECIMAL", "DOUBLE", "DOUBLE PRECISION", "FLOAT", "NUMERIC", "REAL"]

        // Determine type of column - http://www.sqlite.org/c3ref/c_blob.html
        let declaredType = sqlite3_column_decltype(stmt, index)

        if (declaredType != nil) {
            var declaredType = String(cString:declaredType!).uppercased()

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
        }
        else {
            type = sqlite3_column_type(stmt, index)
            return type
        }
    }

    
    class func getColumnValue(index: Int32, type: Int32, stmt: OpaquePointer) -> Any? {
        switch type {
        case SQLITE_INTEGER:
            let val = sqlite3_column_int(stmt, index)
            return Int(val)
        case SQLITE_FLOAT:
            let val = sqlite3_column_double(stmt, index)
            return Double(val)
        case SQLITE_BLOB:
            let data = sqlite3_column_blob(stmt, index)
            let size = sqlite3_column_bytes(stmt, index)
            let val = NSData(bytes:data, length: Int(size))
            return val
        case SQLITE_TEXT:
            let buffer = sqlite3_column_text(stmt, index)
            let val = String(cString:buffer!)
            return val
        default:
            return nil
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
        let path: String = NSSearchPathForDirectoriesInDomains(
           .documentDirectory, .userDomainMask, true
           ).first!
        let url = NSURL(fileURLWithPath: path)
        if let pathComponent = url.appendingPathComponent("\(fileName)") {
           return pathComponent.path
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
         }
         catch let error {
            print("Error: \(error)")
             throw UtilsSQLiteError.renameFileFailed
         }
    }
       
    class func encryptDatabase(fileName: String, secret: String) throws -> Bool {
        var ret: Bool = false
        var db: OpaquePointer?
        do {
            let filePath: String = try getFilePath(fileName: fileName)
            if isFileExist(filePath: filePath) {
                do {
                    let tempPath: String = try getFilePath(fileName:"temp.db")
                    try renameFile(filePath: filePath, toFilePath: tempPath)

                    try db = UtilsSQLite.connection(filename: tempPath)
                    try _ = UtilsSQLite.connection(filename: filePath,readonly: false,key: secret)
                    let stmt: String = """
                    ATTACH DATABASE '\(filePath)' AS encrypted KEY '\(secret)';
                    SELECT sqlcipher_export('encrypted');
                    DETACH DATABASE encrypted;
                    """
                    if sqlite3_exec(db,stmt, nil, nil, nil) == SQLITE_OK  {
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
        return ret
    }
        
}
