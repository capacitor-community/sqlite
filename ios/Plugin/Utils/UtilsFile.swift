//
//  UtilsFile.swift
//  Plugin
//
//  Created by  Quéau Jean Pierre on 18/01/2021.
//  Copyright © 2021 Max Lynch. All rights reserved.
//

import Foundation
enum UtilsFileError: Error {
    case getFilePathFailed
    case copyFileFailed
    case renameFileFailed
    case deleteFileFailed
    case getAssetsDatabasesPathFailed
    case getDatabasesPathFailed
    case getFileListFailed
    case copyFromAssetToDatabaseFailed
}

class UtilsFile {

    // MARK: - IsFileExist

    class func isDirExist(dirPath: String) -> Bool {
        var isDir: ObjCBool = true
        let fileManager = FileManager.default
        let exists = fileManager.fileExists(atPath: dirPath, isDirectory: &isDir)
        return exists && isDir.boolValue
    }

    // MARK: - IsFileExist

    class func isFileExist(filePath: String) -> Bool {
        var ret: Bool = false
        let fileManager = FileManager.default
        if fileManager.fileExists(atPath: filePath) {
            ret = true
        }
        return ret
    }
    class func isFileExist(fileName: String) -> Bool {
        var ret: Bool = false
        do {
            let filePath: String =
                try UtilsFile.getFilePath(
                    fileName: fileName)
            ret = UtilsFile.isFileExist(filePath: filePath)
            return ret
        } catch UtilsFileError.getFilePathFailed {
            return false
        } catch _ {
            return false
        }
    }

    // MARK: - GetFilePath

    class func getFilePath(fileName: String) throws -> String {
        do {
            let url = try getDatabasesPath()
            return url.appendingPathComponent("\(fileName)").path
        } catch UtilsFileError.getDatabasesPathFailed {
            print("Error: getDatabasesPath Failed")
            throw UtilsFileError.getFilePathFailed
        }
    }

    // MARK: - getDatabasesPath

    class func getDatabasesPath() throws -> URL {
        if let path: String = NSSearchPathForDirectoriesInDomains(
            .documentDirectory, .userDomainMask, true
        ).first {
            return NSURL(fileURLWithPath: path) as URL
        } else {
            print("Error: getDatabasesPath did not find the document folder")
            throw UtilsFileError.getDatabasesPathFailed
        }
    }

    // MARK: - GetAssetsDatabasesPath

    class func getAssetsDatabasesPath() throws -> URL {
        if let appFolder = Bundle.main.resourceURL {
            print("getAssetsDatabasesPath appFolder \(appFolder)")
            return appFolder.appendingPathComponent("public/assets/databases")
        } else {
            print("Error: getAssetsDatabasePath did not find app folder")
            throw UtilsFileError.getAssetsDatabasesPathFailed
        }
    }

    // MARK: - setPathSuffix

    class func setPathSuffix(sDb: String ) -> String {
        var toDb: String = sDb
        if sDb.count > 9 {
            let last9: String = String(sDb.suffix(9))
            let ext: String = ".db"
            if last9 != "SQLite.db" {
                if sDb.hasSuffix(ext) {
                    toDb = sDb.prefix(sDb.count - ext.count) + "SQLite.db"
                }
            }
        }
        return toDb
    }

    // MARK: - GetFileList

    class func getFileList(path: String) throws -> [String] {
        do {
            var dbs: [String] = []
            let filenames = try FileManager.default
                .contentsOfDirectory(atPath: path)
            let ext: String = ".db"
            for file in filenames {
                if file.hasSuffix(ext) {
                    dbs.append(file)
                }
            }
            return dbs
        } catch let error {
            print("Error: \(error)")
            throw UtilsFileError.getFileListFailed
        }
    }

    // MARK: - CopyFromAssetToDatabase

    class func copyFromAssetToDatabase(fromDb: String, toDb: String) throws {
        do {
            let uAsset: URL = try getAssetsDatabasesPath()
                .appendingPathComponent(fromDb)
            let pAsset: String = uAsset.path
            let uDb: URL = try getDatabasesPath()
                .appendingPathComponent(toDb)
            let pDb: String = uDb.path
            let bRet: Bool = try copyFile(pathName: pAsset, toPathName: pDb)
            if bRet {
                return
            } else {
                print("Error: copyFile return false")
                throw UtilsFileError.copyFromAssetToDatabaseFailed
            }
        } catch UtilsFileError.getAssetsDatabasesPathFailed {
            print("Error: getAssetsDatabasesPath Failed")
            throw UtilsFileError.copyFromAssetToDatabaseFailed
        } catch UtilsFileError.getDatabasesPathFailed {
            print("Error: getDatabasesPath Failed")
            throw UtilsFileError.copyFromAssetToDatabaseFailed
        } catch UtilsFileError.copyFileFailed {
            print("Error: copyFile Failed")
            throw UtilsFileError.copyFromAssetToDatabaseFailed
        } catch let error {
            print("Error: \(error)")
            throw UtilsFileError.copyFromAssetToDatabaseFailed
        }

    }

    // MARK: - CopyFile

    class func copyFile(pathName: String, toPathName: String) throws -> Bool {
        if pathName.count > 0 && toPathName.count > 0 {
            let isPath = isFileExist(filePath: pathName)
            if isPath {
                do {
                    if isFileExist(filePath: toPathName) {
                        _ = try deleteFile(filePath: toPathName)
                    }
                    let fileManager = FileManager.default
                    try fileManager.copyItem(atPath: pathName,
                                             toPath: toPathName)
                    return true
                } catch let error {
                    print("Error: \(error)")
                    throw UtilsFileError.copyFileFailed
                }
            } else {
                print("Error: CopyFilePath Failed pathName does not exist")
                throw UtilsFileError.copyFileFailed
            }
        } else {
            print("Error: CopyFilePath Failed paths count = 0")
            throw UtilsFileError.copyFileFailed
        }
    }

    // MARK: - CopyFile

    class func copyFile(fileName: String, toFileName: String)
    throws -> Bool {
        var ret: Bool = false
        do {
            let fromPath: String = try getFilePath(fileName: fileName)
            let toPath: String = try getFilePath(fileName: toFileName)
            ret = try copyFile(pathName: fromPath, toPathName: toPath)
            return ret
        } catch UtilsFileError.getFilePathFailed {
            print("Error: getFilePath Failed")
            throw UtilsFileError.copyFileFailed
        } catch let error {
            print("Error: \(error)")
            throw UtilsFileError.copyFileFailed
        }
    }

    // MARK: - DeleteFile

    class func deleteFile(filePath: String) throws -> Bool {
        var ret: Bool = false
        do {
            if isFileExist(filePath: filePath) {
                let fileManager = FileManager.default
                do {
                    try fileManager.removeItem(atPath: filePath)
                    ret = true
                } catch let error {
                    print("Error: \(error)")
                    throw UtilsFileError.deleteFileFailed
                }
            }
        } catch let error {
            print("Error: \(error)")
            throw UtilsFileError.deleteFileFailed
        }
        return ret
    }

    // MARK: - DeleteFile

    class func deleteFile(fileName: String) throws -> Bool {
        var ret: Bool = false
        do {
            let filePath: String = try getFilePath(fileName: fileName)
            ret = try deleteFile(filePath: filePath)
        } catch let error {
            print("Error: \(error)")
            throw UtilsFileError.deleteFileFailed
        }
        return ret
    }

    // MARK: - RenameFile

    class func renameFile (filePath: String, toFilePath: String)
    throws {
        let fileManager = FileManager.default
        do {
            if isFileExist(filePath: toFilePath) {
                let fileName = URL(
                    fileURLWithPath: toFilePath).lastPathComponent
                try  _ = deleteFile(fileName: fileName)
            }
            try fileManager.moveItem(atPath: filePath,
                                     toPath: toFilePath)
        } catch let error {
            print("Error: \(error)")
            throw UtilsFileError.renameFileFailed
        }
    }
}
