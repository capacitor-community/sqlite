//
//  UtilsNCDatabase.swift
//  CapacitorCommunitySqlite
//
//  Created by  Quéau Jean Pierre on 17/12/2021.
//

import Foundation
enum UtilsNCDatabaseError: Error {
    case getNCDatabasePath(message: String)
}

class UtilsNCDatabase {

    // MARK: - getNCDatabasePath

    class func getNCDatabasePath(folderPath: String, database: String) throws -> String {
        do {
            let dbPathURL: URL = try UtilsFile
                .getFolderURL(folderPath: folderPath)
            return dbPathURL.appendingPathComponent("\(database)").path
        } catch UtilsFileError.getFolderURLFailed(let message) {
            throw UtilsNCDatabaseError.getNCDatabasePath(message: message)
        } catch let error {
            var msg: String = "getNCDatabasePath command failed :"
            msg.append(" \(error.localizedDescription)")
            throw UtilsNCDatabaseError.getNCDatabasePath(message: msg)
        }

    }
}
