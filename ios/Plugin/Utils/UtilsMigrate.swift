//
//  UtilsMigrate.swift
//  CapacitorCommunitySqlite
//
//  Created by  Quéau Jean Pierre on 14/02/2021.
//
import Foundation
enum UtilsMigrateError: Error {
    case addSQLiteSuffix(message: String)
    case getMigratableList(message: String)
    case deleteOldDatabases(message: String)
    case moveDatabasesAndAddSuffix(message: String)
}

class UtilsMigrate {

    // MARK: - getMigratableList

    class func getMigratableList(folderPath: String) throws -> [String] {
        var mDbList: [String] = []
        do {
            let dbPathURL: URL = try UtilsFile
                .getFolderURL(folderPath: folderPath)
            var isDir = ObjCBool(true)
            if FileManager.default.fileExists(atPath: dbPathURL.relativePath,
                                              isDirectory: &isDir) &&
                isDir.boolValue {
                mDbList = try UtilsFile.getFileList(path: dbPathURL.relativePath, ext: nil)

                return mDbList
            } else {
                var msg: String = "getMigratableList command failed :"
                msg.append(" Folder '\(dbPathURL.absoluteString)' not found")
                throw UtilsMigrateError.getMigratableList(message: msg)
            }

        } catch UtilsFileError.getFolderURLFailed {
            throw UtilsMigrateError
            .getMigratableList(message: "getFolderURLFailed")
        } catch UtilsFileError.getFileListFailed {
            throw UtilsMigrateError.getMigratableList(message: "getFileListFailed")
        } catch let error {
            var msg: String = "getMigratableList command failed :"
            msg.append(" \(error.localizedDescription)")
            throw UtilsMigrateError.getMigratableList(message: msg)
        }
    }

    // MARK: - addSQLiteSuffix

    // swiftlint:disable function_body_length
    // swiftlint:disable cyclomatic_complexity
    class func addSQLiteSuffix(databaseLocation: String, folderPath: String,
                               dbList: [String]) throws {
        var fromFile: String = ""
        var toFile: String = ""
        do {
            let databaseURL: URL = try UtilsFile
                .getFolderURL(folderPath: databaseLocation)
            let dbPathURL: URL = try UtilsFile
                .getFolderURL(folderPath: folderPath)
            var isDir = ObjCBool(true)
            if FileManager.default.fileExists(atPath: dbPathURL.relativePath,
                                              isDirectory: &isDir) &&
                isDir.boolValue {
                var mDbList: [String]
                if dbList.count > 0 {
                    mDbList = try UtilsFile
                        .getFileList(path: dbPathURL.relativePath, ext: nil)
                } else {
                    mDbList = try UtilsFile
                        .getFileList(path: dbPathURL.relativePath, ext: "db")
                }
                for file: String in mDbList {
                    if !file.contains("SQLite.db") {
                        fromFile = file
                        if dbList.count > 0 {
                            if dbList.contains(fromFile) {
                                if String(file.suffix(3)) == ".db" {
                                    toFile = file
                                        .replacingOccurrences(of: ".db", with: "SQLite.db")
                                } else {
                                    toFile = file + "SQLite.db"
                                }
                                try UtilsFile
                                    .copyFromNames(dbPathURL: dbPathURL,
                                                   fromFile: fromFile,
                                                   databaseURL: databaseURL,
                                                   toFile: toFile)
                            }
                        } else {
                            toFile = file
                                .replacingOccurrences(of: ".db", with: "SQLite.db")
                            try UtilsFile
                                .copyFromNames(dbPathURL: dbPathURL,
                                               fromFile: fromFile,
                                               databaseURL: databaseURL,
                                               toFile: toFile)
                        }
                    }
                }
                return
            } else {
                var msg: String = "addSQLiteSuffix command failed :"
                msg.append(" Folder '\(dbPathURL.absoluteString)' not found")
                throw UtilsMigrateError.addSQLiteSuffix(message: msg)
            }
        } catch UtilsFileError.getDatabasesURLFailed {
            throw UtilsMigrateError
            .addSQLiteSuffix(message: "getDatabasesURLFailed")
        } catch UtilsFileError.getFolderURLFailed(let message) {
            throw UtilsMigrateError.addSQLiteSuffix(message: message)
        } catch UtilsFileError.getFileListFailed {
            throw UtilsMigrateError.addSQLiteSuffix(message: "getFileListFailed")
        } catch UtilsFileError.copyFromNamesFailed {
            var msg: String = "addSQLiteSuffix command failed :"
            msg.append(" Failed in copy '\(fromFile)' to '\(toFile)'")
            throw UtilsMigrateError.addSQLiteSuffix(message: msg)
        } catch let error {
            var msg: String = "addSQLiteSuffix command failed :"
            msg.append(" \(error.localizedDescription)")
            throw UtilsMigrateError.addSQLiteSuffix(message: msg)
        }
    }
    // swiftlint:enable cyclomatic_complexity
    // swiftlint:enable function_body_length

    // MARK: - deleteOldDatabase

    // swiftlint:disable function_body_length
    // swiftlint:disable cyclomatic_complexity
    class func deleteOldDatabases(folderPath: String, dbList: [String]) throws {
        do {
            let dbPathURL: URL = try UtilsFile
                .getFolderURL(folderPath: folderPath)
            var isDir = ObjCBool(true)
            if FileManager.default.fileExists(atPath: dbPathURL.relativePath,
                                              isDirectory: &isDir) &&
                isDir.boolValue {
                var mDbList: [String]
                if dbList.count > 0 {
                    mDbList = try UtilsFile
                        .getFileList(path: dbPathURL.relativePath, ext: nil)
                } else {
                    mDbList = try UtilsFile
                        .getFileList(path: dbPathURL.relativePath, ext: "db")
                }
                for file: String in mDbList {
                    if !file.contains("SQLite.db") {
                        if dbList.count > 0 {
                            if dbList.contains(file) {
                                let ret: Bool = try UtilsFile
                                    .deleteFile(dbPathURL: dbPathURL, fileName: file)
                                if !ret {
                                    throw UtilsMigrateError
                                    .deleteOldDatabases(message: "deleteFileFailed")
                                }
                            }
                        } else {
                            if file.contains(".db") {
                                let ret: Bool = try UtilsFile
                                    .deleteFile(dbPathURL: dbPathURL, fileName: file)
                                if !ret {
                                    throw UtilsMigrateError
                                    .deleteOldDatabases(message: "deleteFileFailed")
                                }
                            }

                        }
                    }
                }
                return
            } else {
                var msg: String = "addSQLiteSuffix command failed :"
                msg.append(" Folder '\(dbPathURL.absoluteString)' not found")
                throw UtilsMigrateError.addSQLiteSuffix(message: msg)
            }
        } catch UtilsFileError.getDatabasesURLFailed {
            throw UtilsMigrateError
            .addSQLiteSuffix(message: "getDatabasesURLFailed")
        } catch UtilsFileError.getFolderURLFailed(let message) {
            throw UtilsMigrateError.addSQLiteSuffix(message: message)
        } catch UtilsFileError.getFileListFailed {
            throw UtilsMigrateError.addSQLiteSuffix(message: "getFileListFailed")
        } catch UtilsFileError.deleteFileFailed {
            throw UtilsMigrateError.addSQLiteSuffix(message: "deleteFileFailed")
        } catch let error {
            var msg: String = "addSQLiteSuffix command failed :"
            msg.append(" \(error.localizedDescription)")
            throw UtilsMigrateError.addSQLiteSuffix(message: msg)
        }
    }
    // swiftlint:enable cyclomatic_complexity
    // swiftlint:enable function_body_length

    // MARK: - moveDatabasesAndAddSuffix

    // swiftlint:disable function_body_length
    // swiftlint:disable cyclomatic_complexity
    class func moveDatabasesAndAddSuffix(databaseLocation: String, folderPath: String,
                                         dbList: [String]) throws {
        var fromFile: String = ""
        var toFile: String = ""
        do {
            let databaseURL: URL = try UtilsFile
                .getFolderURL(folderPath: databaseLocation)
            let dbPathURL: URL = try UtilsFile
                .getFolderURL(folderPath: folderPath)
            var isDir = ObjCBool(true)
            if FileManager.default.fileExists(atPath: dbPathURL.relativePath,
                                              isDirectory: &isDir) &&
                isDir.boolValue {
                var mDbList: [String]
                if dbList.count > 0 {
                    mDbList = try UtilsFile
                        .getFileList(path: dbPathURL.relativePath, ext: nil)
                } else {
                    mDbList = try UtilsFile
                        .getFileList(path: dbPathURL.relativePath, ext: "db")
                }
                for file: String in mDbList {
                    if !file.contains("SQLite.db") {
                        fromFile = file
                        toFile = ""
                        if dbList.count > 0 {
                            if dbList.contains(fromFile) {
                                if String(file.suffix(3)) == ".db" {
                                    toFile = file
                                        .replacingOccurrences(of: ".db", with: "SQLite.db")
                                } else {
                                    toFile = file + "SQLite.db"
                                }
                            }
                        } else {
                            toFile = file
                                .replacingOccurrences(of: ".db", with: "SQLite.db")
                        }
                        if !toFile.isEmpty {
                            let uFrom: URL = dbPathURL.appendingPathComponent(fromFile)
                            let uTo: URL = databaseURL.appendingPathComponent(toFile)
                            _ = try UtilsFile.moveFile(pathName: uFrom.path, toPathName: uTo.path, overwrite: true)
                        }
                    }
                }
                return
            } else {
                var msg: String = "moveDatabasesAndAddSuffix command failed :"
                msg.append(" Folder '\(dbPathURL.absoluteString)' not found")
                throw UtilsMigrateError.moveDatabasesAndAddSuffix(message: msg)
            }
        } catch UtilsFileError.getDatabasesURLFailed {
            throw UtilsMigrateError
            .moveDatabasesAndAddSuffix(message: "getDatabasesURLFailed")
        } catch UtilsFileError.getFolderURLFailed(let message) {
            throw UtilsMigrateError.moveDatabasesAndAddSuffix(message: message)
        } catch UtilsFileError.getFileListFailed {
            throw UtilsMigrateError.moveDatabasesAndAddSuffix(message: "getFileListFailed")
        } catch let error {
            var msg: String = "moveDatabasesAndAddSuffix command failed :"
            msg.append(" \(error.localizedDescription)")
            throw UtilsMigrateError.moveDatabasesAndAddSuffix(message: msg)
        }
    }
    // swiftlint:enable cyclomatic_complexity
    // swiftlint:enable function_body_length

}
