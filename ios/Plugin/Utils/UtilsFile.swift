//
//  UtilsFile.swift
//  CapacitorCommunitySqlite
//
//  Created by  Quéau Jean Pierre on 15/10/2020.
//

import Foundation
enum UtilsFileError: Error {
    case getFilePathFailed
    case copyFileFailed
    case renameFileFailed
    case deleteFileFailed
}

class UtilsFile {

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
        if let path: String = NSSearchPathForDirectoriesInDomains(
            .documentDirectory, .userDomainMask, true
        ).first {
            let url = NSURL(fileURLWithPath: path)
            if let pathComponent =
                        url.appendingPathComponent("\(fileName)") {
                return pathComponent.path
            } else {
                throw UtilsFileError.getFilePathFailed
            }
        } else {
            throw UtilsFileError.getFilePathFailed
        }
    }

    // MARK: - CopyFile

    class func copyFile(fileName: String, toFileName: String)
                                                    throws -> Bool {
        var ret: Bool = false
        do {
            let fromPath: String = try getFilePath(fileName: fileName)
            let toPath: String = try getFilePath(fileName: toFileName)
            if isFileExist(filePath: fromPath) {
                if isFileExist(filePath: toPath) {
                    _ = try deleteFile(fileName: toFileName)
                }
                let fileManager = FileManager.default
                try fileManager.copyItem(atPath: fromPath,
                                         toPath: toPath)
                ret = true
            }
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
                    throw UtilsFileError.deleteFileFailed
                }
            }
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
