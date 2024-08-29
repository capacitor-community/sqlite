//
//  UtilsDownloadFromHTTP.swift
//  CapacitorCommunitySqlite
//
//  Created by  Quéau Jean Pierre on 05/10/2022.
//

import Foundation
import ZIPFoundation

enum UtilsDownloadError: Error {
    case downloadFromHTTPFailed(message: String)
    case fileNotFound(message: String)
    case fileMoveFailed(message: String)
    case fileExtractionFailed(message: String)
    case invalidArchive(message: String)
}

class UtilsDownloadFromHTTP {

    class func download(databaseLocation: String, url: String,
                        completion: @escaping (Result<Bool, UtilsDownloadError>) -> Void) {
        guard let fileDetails = getFileDetails(url: url),
              let fileExtension = fileDetails.extension,
              fileExtension == "db" || fileExtension == "zip" else {
            let msg = "download: Not a .zip or .db url"
            print("\(msg)")
            completion(.failure(UtilsDownloadError.downloadFromHTTPFailed(message: msg)))
            return
        }

        guard let dbUrl = try? UtilsFile.getDatabaseLocationURL(databaseLocation: databaseLocation) else {
            let msg = "databaseLocation failed"
            print("\(msg)")
            completion(.failure(UtilsDownloadError.downloadFromHTTPFailed(message: msg)))
            return
        }

        downloadFile(url: url) { result in
            switch result {
            case .success(let cachedFile):
                if fileExtension == "zip" {
                    handleZipFile(cachedFile: cachedFile, dbUrl: dbUrl, completion: completion)
                } else {
                    handleNonZipFile(cachedFile: cachedFile, dbUrl: dbUrl, completion: completion)
                }
            case .failure:
                let msg = "Failed to download file: "
                completion(.failure(UtilsDownloadError.downloadFromHTTPFailed(message: msg)))
            }
        }
    }

    class func handleZipFile(cachedFile: URL, dbUrl: URL, completion: @escaping (Result<Bool, UtilsDownloadError>) -> Void) {
        extractDBFiles(from: cachedFile) { dbFiles, error in
            if let error = error {
                let msg = "\(error.localizedDescription)"
                completion(.failure(UtilsDownloadError.downloadFromHTTPFailed(message: msg)))
            } else {
                for file in dbFiles {
                    if let moveError = moveAndRenameFile(from: file, to: dbUrl) {
                        let msg = "Failed to move file: \(moveError.localizedDescription)"
                        completion(.failure(UtilsDownloadError.downloadFromHTTPFailed(message: msg)))
                        return
                    }
                }
                completion(.success(true))
            }
        }
    }

    class func handleNonZipFile(cachedFile: URL, dbUrl: URL, completion: @escaping (Result<Bool, UtilsDownloadError>) -> Void) {
        if let moveError = moveAndRenameFile(from: cachedFile, to: dbUrl) {
            let msg = "Failed to move file: \(moveError.localizedDescription)"
            completion(.failure(UtilsDownloadError.downloadFromHTTPFailed(message: msg)))
        } else {
            completion(.success(true))
        }
    }

    class func getFileDetails(url: String) -> (filename: String, extension: String?)? {
        guard let fileURL = URL(string: url) else { return nil }
        let filename = fileURL.lastPathComponent
        let ext = fileURL.pathExtension
        return (filename, ext.isEmpty ? nil : ext)
    }

    class func downloadFile(url: String, completion: @escaping (Result<URL, Error>) -> Void) {
        guard let fileURL = URL(string: url) else { return }

        URLSession.shared.downloadTask(with: fileURL) { (location, _, error) in
            if let location = location {
                let tmpURL = UtilsFile.getTmpURL()
                let suggestedFilename = fileURL.lastPathComponent

                // Construct the destination URL
                let destinationURL = tmpURL.appendingPathComponent(suggestedFilename)

                // Check if the destination file already exists
                if FileManager.default.fileExists(atPath: destinationURL.path) {
                    // Remove the existing file
                    do {
                        try FileManager.default.removeItem(at: destinationURL)
                    } catch {
                        completion(.failure(error))
                        return
                    }
                }

                do {
                    try FileManager.default.moveItem(at: location, to: destinationURL)
                    completion(.success(destinationURL))
                } catch {
                    print("Moving file \(error.localizedDescription)")
                    completion(.failure(error))
                }
            } else if let error = error {
                print("Location file \(error.localizedDescription)")
                completion(.failure(error))
            }

        }.resume()
    }

    class func moveAndRenameFile(from sourceURL: URL, to dbURL: URL) -> Error? {
        let fileManager = FileManager.default

        do {
            let destinationURL = dbURL.appendingPathComponent(sourceURL.lastPathComponent).absoluteURL

            // Ensure the destination directory exists
            try fileManager.createDirectory(at: dbURL, withIntermediateDirectories: true, attributes: nil)
            // Check if the destination file already exists and delete it if necessary
            if fileManager.fileExists(atPath: destinationURL.path) {
                try fileManager.removeItem(at: destinationURL)
            }

            // Move the file to the destination URL
            try fileManager.moveItem(at: sourceURL, to: destinationURL)

            // Rename the file if needed
            let lastPathComponent = destinationURL.lastPathComponent
            if lastPathComponent.hasSuffix(".db") && !lastPathComponent.contains("SQLite") {
                let newLastPathComponent = lastPathComponent.replacingOccurrences(of: ".db", with: "SQLite.db")
                let newDestinationURL = dbURL.appendingPathComponent(newLastPathComponent)
                // Check if the destination file already exists and delete it if necessary
                if fileManager.fileExists(atPath: newDestinationURL.path) {
                    try fileManager.removeItem(at: newDestinationURL)
                }

                try fileManager.moveItem(at: destinationURL, to: newDestinationURL)
            }

            return nil
        } catch {
            return error
        }
    }

    class func extractDBFiles(from zipFile: URL, completion: @escaping ([URL], Error?) -> Void) {
        DispatchQueue.global().async(execute: {
            var dbFiles: [URL] = []

            do {
                let destinationURL = zipFile.deletingLastPathComponent()

                guard let archive = Archive(url: zipFile, accessMode: .read) else {
                    let msg = "Failed in reading Archive"
                    completion([], UtilsDownloadError.invalidArchive(message: msg))
                    return
                }

                for entry in archive where entry.type == .file {
                    let fileURL = destinationURL.appendingPathComponent(entry.path)
                    let fileExtension = URL(fileURLWithPath: entry.path).pathExtension

                    if fileExtension == "db" {
                        _ = try archive.extract(entry, to: fileURL)
                        dbFiles.append(fileURL)
                    }
                }
                // Delete the zip file
                try FileManager.default.removeItem(at: zipFile)

                completion(dbFiles, nil)
            } catch {
                completion([], error)
            }
        })

    }
}
