//
//  UtilsMigrate.swift
//  CapacitorCommunitySqlite
//
//  Created by  Quéau Jean Pierre on 14/02/2021.
//
import Foundation
enum UtilsMigrateError: Error {
    case addSQLiteSuffix(message: String)
    case deleteOldDatabases(message: String)
    case getFolderURL(message: String)
}

class UtilsMigrate {

    // MARK: - addSQLiteSuffix
    // swiftlint:disable function_body_length
    class func addSQLiteSuffix(folderPath: String, dbList: [String]) throws {
        var fromFile: String = ""
        var toFile: String = ""
        do {
            let databaseURL = try UtilsFile.getDatabasesUrl().absoluteURL
            let dbPathURL: URL = try UtilsMigrate
                .getFolderURL(folderPath: folderPath)
            var isDir = ObjCBool(true)
            if FileManager.default.fileExists(atPath: dbPathURL.relativePath,
                                              isDirectory: &isDir) &&
                isDir.boolValue {
                let mDbList: [String] = try UtilsFile
                    .getFileList(path: dbPathURL.relativePath)
                for file: String in mDbList {
                    if !file.contains("SQLite.db") {
                        fromFile = file
                        if dbList.contains(fromFile) {
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
        } catch UtilsMigrateError.getFolderURL(let message) {
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
    // swiftlint:enable function_body_length

    // MARK: - deleteOldDatabase
    class func deleteOldDatabases(folderPath: String, dbList: [String]) throws {
        do {
            let dbPathURL: URL = try UtilsMigrate
                .getFolderURL(folderPath: folderPath)
            var isDir = ObjCBool(true)
            if FileManager.default.fileExists(atPath: dbPathURL.relativePath,
                                              isDirectory: &isDir) &&
                isDir.boolValue {
                let mDbList: [String] = try UtilsFile
                    .getFileList(path: dbPathURL.relativePath)
                for file: String in mDbList {
                    if !file.contains("SQLite.db") {
                        if dbList.contains(file) {
                            let ret: Bool = try UtilsFile
                                .deleteFile(dbPathURL: dbPathURL, fileName: file)
                            if !ret {
                                throw UtilsMigrateError
                                .deleteOldDatabases(message: "deleteFileFailed")
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
        } catch UtilsMigrateError.getFolderURL(let message) {
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

    // MARK: - getFolderURL
    class func getFolderURL(folderPath: String) throws -> URL {
        do {
            let databaseURL = try UtilsFile.getDatabasesUrl().absoluteURL
            var dbPathURL: URL
            let first = folderPath.split(separator: "/", maxSplits: 1)
            if first[0] == "Applications" {
                dbPathURL = try UtilsFile.getApplicationURL().absoluteURL
            } else if first[0] == "Library" {
                dbPathURL = try UtilsFile.getLibraryURL().absoluteURL
            } else if first[0] == "Documents" || first[0] == "default" {
                dbPathURL = databaseURL
            } else {
                var msg: String = "addSQLiteSuffix command failed :"
                msg.append(" Folder '\(first[0])' not allowed")
                throw UtilsMigrateError.getFolderURL(message: msg)
            }
            if first.count > 1 {
                dbPathURL = dbPathURL
                    .appendingPathComponent(String(first[1])).absoluteURL
            }
            return dbPathURL
        } catch UtilsFileError.getDatabasesURLFailed {
            throw UtilsMigrateError.getFolderURL(message: "getDatabasesURLFailed")
        } catch UtilsFileError.getApplicationURLFailed {
            throw UtilsMigrateError
            .getFolderURL(message: "getApplicationURLFailed")
        } catch let error {
            var msg: String = "getFolderURL command failed :"
            msg.append(" \(error.localizedDescription)")
            throw UtilsMigrateError.getFolderURL(message: msg)
        }
    }

}
