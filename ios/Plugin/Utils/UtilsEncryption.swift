//
//  UtilsEncryption.swift
//  CapacitorCommunitySqlite
//
//  Created by  Quéau Jean Pierre on 15/10/2020.
//

import Foundation
import SQLCipher

class UtilsEncryption {

    // MARK: - EncryptDatabase

    class func encryptDatabase(dbHelper: DatabaseHelper,
                               filePath: String, secret: String)
                                throws -> Bool {
        var ret: Bool = false
        var mDB: OpaquePointer?
        do {
            if UtilsFile.isFileExist(filePath: filePath) {
                do {
                    let tempPath: String = try UtilsFile.getFilePath(
                        fileName: "temp.db")
                    try UtilsFile.renameFile(filePath: filePath,
                                   toFilePath: tempPath)
                    try mDB = UtilsConnection.connection(
                        filename: tempPath)
                    try _ = UtilsConnection.connection(
                        filename: filePath, readonly: false,
                        key: secret)
                    var stmt: String = "ATTACH DATABASE '\(filePath)' "
                    stmt.append("AS encrypted KEY '\(secret)';")
                    stmt.append("SELECT sqlcipher_export('encrypted');")
                    stmt.append("DETACH DATABASE encrypted;")
                    if sqlite3_exec(mDB, stmt, nil, nil, nil) ==
                                    SQLITE_OK {
                        try _ = UtilsFile.deleteFile(
                            fileName: "temp.db")
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
        UtilsSQLite.closeDB(mDB: mDB, method: "init")
        return ret
    }

}
