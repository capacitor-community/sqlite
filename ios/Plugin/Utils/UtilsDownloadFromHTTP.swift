//
//  UtilsDownloadFromHTTP.swift
//  CapacitorCommunitySqlite
//
//  Created by  Quéau Jean Pierre on 05/10/2022.
//

import Foundation
import ZIPFoundation

enum UtilsDownloadError: Error {
    case downloadFromHTTPFailed
}
class UtilsDownloadFromHTTP {
    // swiftlint:disable cyclomatic_complexity
    // swiftlint:disable function_body_length
    class func download(databaseLocation: String, url: String,
                        completion: @escaping (Result<Bool, UtilsDownloadError>)
                            -> Void) {
        if let mUrl: URL = URL(string: url) {
            let fileName = mUrl.lastPathComponent
            var dbName = fileName
            var isZip = false
            if !fileName.contains("SQLite.db") {
                if String(fileName.suffix(3)) == ".db" {
                    dbName = fileName.replacingOccurrences(
                        of: ".db", with: "SQLite.db")
                }
                if String(fileName.suffix(4)) == ".zip" {
                    isZip = true
                }
            }
            // compute a path to this Url in the cache
            let cacheURL = UtilsFile.getTmpURL()
            let tmp = cacheURL.lastPathComponent
            let fileCacheURL = FileManager.default.temporaryDirectory
                .appendingPathComponent(
                    dbName,
                    isDirectory: false
                )

            let task = URLSession.shared.downloadTask(with: mUrl) {
                (tempURL, response, error) in
                // Early exit on error
                guard let tempURL = tempURL else {
                    let msg = "\(String(describing: error?.localizedDescription))"
                    print("\(msg)")
                    completion(.failure(UtilsDownloadError.downloadFromHTTPFailed))
                    return
                }
                if let httpResponse = response as? HTTPURLResponse {
                    switch httpResponse.statusCode {
                    case 200:
                        do {
                            // Remove any existing document at file
                            if FileManager.default.fileExists(
                                atPath: fileCacheURL.path) {
                                try FileManager.default.removeItem(
                                    atPath: fileCacheURL.path)
                            }

                            // Copy the tempURL to file
                            try FileManager.default.copyItem(
                                at: tempURL,
                                to: fileCacheURL
                            )
                            // Delete the tempUrl file
                            try FileManager.default.removeItem(at: tempURL)
                            let dbURL = try UtilsFile.getDatabaseLocationURL(
                                databaseLocation: databaseLocation)
                            if isZip {
                                // get the zip files
                                let zipList: [String] = try UtilsFile
                                    .getFileList(path: cacheURL.path,
                                                 ext: ".zip")
                                // loop through the database files
                                for zip in zipList {
                                    _ = try UtilsFile.unzipToDatabase(
                                        fromURL: cacheURL,
                                        databaseLocation: tmp,
                                        zip: zip,
                                        overwrite: true)
                                }
                                // Delete the zip file
                                try FileManager.default.removeItem(
                                    at: fileCacheURL)

                            }
                            try UtilsFile.moveAllDBSQLite(
                                fromURL: cacheURL,
                                dirUrl: dbURL)
                            completion(.success(true))
                            return
                        }

                        // Handle potential file system errors
                        catch let error {
                            let msg = "\(error.localizedDescription)"
                            print("\(msg)")
                            completion(.failure(UtilsDownloadError.downloadFromHTTPFailed))
                            return
                        }
                    default:
                        let msg = "Download: GET resquest not successful. http status code \(httpResponse.statusCode)"
                        print("\(msg)")
                        completion(.failure(UtilsDownloadError.downloadFromHTTPFailed))
                        return
                    }
                } else {
                    let msg = "Download: not a valid http response"
                    print("\(msg)")
                    completion(.failure(UtilsDownloadError.downloadFromHTTPFailed))
                    return
                }
            }
            // Start the download
            task.resume()
        }
    }
    // swiftlint:enable cyclomatic_complexity
    // swiftlint:enable function_body_length
}
