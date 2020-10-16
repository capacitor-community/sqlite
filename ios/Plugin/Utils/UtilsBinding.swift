//
//  UtlisBinding.swift
//  CapacitorCommunitySqlite
//
//  Created by  Quéau Jean Pierre on 31/07/2020.
//

import Foundation
import SQLCipher

let SQLITETRANSIENT = unsafeBitCast(-1, to:
                                        sqlite3_destructor_type.self)

class UtilsBinding {
    class func bindValues( handle: OpaquePointer?, values: [String])
                                                            -> String {
        var message: String = ""
        var idx: Int = 1
        for value in values {
            do {
                if let selStmt = handle {
                    try UtilsBinding.bind(handle: selStmt,
                                          value: value, idx: idx)
                    idx += 1
                } else {
                    message = "Error: querySQL bind failed "
                }
            } catch let error as NSError {
                message = "Error: querySQL bind failed "
                message.append("\(error.localizedDescription)")
            }
            if message.count > 0 { break }
        }
        return message
    }
    class func bind( handle: OpaquePointer?, value: Any?, idx: Int)
                                                            throws {
        if value == nil {
            sqlite3_bind_null(handle, Int32(idx))
        } else if let value = value as? Double {
            sqlite3_bind_double(handle, Int32(idx), value)
        } else if let value = value as? Int64 {
            sqlite3_bind_int64(handle, Int32(idx), value)
        } else if let value = value as? String {
            if value.contains("base64") {
                // case Base64 string as Blob
//                sqlite3_bind_blob(handle, Int32(idx), [value],
//                               Int32(value.count), SQLITETRANSIENT)
                sqlite3_bind_text(handle, Int32(idx), value, -1,
                                                    SQLITETRANSIENT)

            } else if value.uppercased() == "NULL" {
                // case NULL
                sqlite3_bind_null(handle, Int32(idx))
            } else {
                sqlite3_bind_text(handle, Int32(idx), value, -1,
                                                    SQLITETRANSIENT)
            }
        } else if let value = value as? Int {
            sqlite3_bind_int64(handle, Int32(idx), Int64(value))
        } else if let value = value as? Bool {
            var bInt: Int32 = Int32(0)
            if value {bInt = Int32(1)}
            sqlite3_bind_int(handle, Int32(idx), Int32(bInt))
        } else {
            throw UtilsSQLiteError.bindFailed
        }

    }
}
