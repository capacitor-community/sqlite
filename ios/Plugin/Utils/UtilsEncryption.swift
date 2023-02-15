//
//  UtilsEncryption.swift
//  Plugin
//
//  Created by  Quéau Jean Pierre on 18/01/2021.
//  Copyright © 2021 Max Lynch. All rights reserved.
//

import Foundation
import SQLCipher

enum UtilsEncryptionError: Error {
    case encryptionFailed(message: String)
}
class UtilsEncryption {

    // MARK: - EncryptDatabase

    // swiftlint:disable function_body_length
    class func encryptDatabase(databaseLocation: String, filePath: String,
                               password: String, version: Int) throws -> Bool {
        var ret: Bool = false
        var oDB: OpaquePointer?
        var eDB: OpaquePointer?
        do {
            if UtilsFile.isFileExist(filePath: filePath) {
                do {
                    let tempPath: String = try UtilsFile
                        .getFilePath(databaseLocation: databaseLocation,
                                     fileName: "temp.db")
                    try UtilsFile.renameFile(filePath: filePath,
                                             toFilePath: tempPath,
                                             databaseLocation: databaseLocation)
                    oDB = try UtilsSQLCipher
                        .openOrCreateDatabase(filename: tempPath,
                                              password: "",
                                              readonly: false)
                    eDB = try UtilsSQLCipher
                        .openOrCreateDatabase(filename: filePath,
                                              password: password,
                                              readonly: false)

                    var stmt: String = "ATTACH DATABASE '\(filePath)' "
                    stmt.append("AS encrypted KEY '\(password)';")
                    stmt.append("SELECT sqlcipher_export('encrypted');")
                    stmt.append("DETACH DATABASE encrypted;")
                    if sqlite3_exec(oDB, stmt, nil, nil, nil) ==
                        SQLITE_OK {
                        try _ = UtilsFile
                            .deleteFile(fileName: "temp.db",
                                        databaseLocation: databaseLocation)
                        // set the version
                        let sqltr: String = "PRAGMA user_version = \(version);"
                        if sqlite3_exec(eDB, sqltr, nil, nil, nil) != SQLITE_OK {
                            throw UtilsEncryptionError
                            .encryptionFailed(message: "set version to \(version) failed")
                        }

                        ret = true
                    }
                    // close the db
                    try UtilsSQLCipher.close(oDB: oDB)

                } catch UtilsFileError.getFilePathFailed {
                    throw UtilsEncryptionError
                    .encryptionFailed(message: "file path failed")
                } catch UtilsFileError.renameFileFailed {
                    throw UtilsEncryptionError
                    .encryptionFailed(message: "file rename failed")
                } catch UtilsSQLCipherError.openOrCreateDatabase(_) {
                    throw UtilsEncryptionError
                    .encryptionFailed(message: "open failed")
                } catch UtilsSQLCipherError.close(_) {
                    throw UtilsEncryptionError
                    .encryptionFailed(message: "close failed")
                } catch let error {
                    print("Error: \(error)")
                    throw UtilsEncryptionError
                    .encryptionFailed(message: "Error: \(error)")
                }
            }
        } catch let error {
            print("Error: \(error)")
            throw UtilsEncryptionError
            .encryptionFailed(message: "Error: \(error)")
        }
        return ret
    }

}
// swiftlint:enable function_body_length
