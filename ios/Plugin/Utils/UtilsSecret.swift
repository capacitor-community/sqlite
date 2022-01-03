//
//  UtilsSecret.swift
//  Plugin
//
//  Created by  Quéau Jean Pierre on 04/05/2021.
//  Copyright © 2021 Max Lynch. All rights reserved.
//

import Foundation

enum UtilsSecretError: Error {
    case setPassphrase(message: String)
    case changePassphrase(message: String)
    case setEncryptionSecret(message: String)
    case  changeEncryptionSecret(message: String)
}

class UtilsSecret {

    // MARK: - IsPassphrase

    class func isPassphrase() -> Bool {
        var ret: Bool = false
        if getPassphrase() != "" {
            ret = true
        }
        return ret
    }

    // MARK: - GetPassphrase

    class func getPassphrase() -> String {
        let kcw = KeychainWrapper()
        if let password = try? kcw.getGenericPasswordFor(
            account: "CapacitorSQLitePlugin",
            service: "unlockSecret") {
            return password
        }
        return ""
    }

    // MARK: - SetPassphrase

    class func setPassphrase(passphrase: String) throws {
        let kcw = KeychainWrapper()
        do {
            try kcw.storeGenericPasswordFor(
                account: "CapacitorSQLitePlugin",
                service: "unlockSecret",
                password: passphrase)
        } catch let error as KeychainWrapperError {
            var msg: String = "SetPassphrase command failed :"
            msg.append(" \(error.localizedDescription)")
            throw UtilsSecretError.setPassphrase(message: msg)

        } catch {
            let msg: String = "SetPassphrase command failed :"
            throw UtilsSecretError.setPassphrase(message: msg)
        }

    }

    // MARK: - ValidatePassphrase

    class func validatePassphrase(_ passphrase: String) -> Bool {
        var ret: Bool = false
        let currentPassphrase = getPassphrase()
        if passphrase == currentPassphrase {
            ret = true
        }
        return ret
    }

    // MARK: - ChangePassphrase

    class func changePassphrase(oldPassphrase: String, passphrase: String) throws -> Bool {
        guard validatePassphrase(oldPassphrase) == true else { return false }
        do {
            try setPassphrase(passphrase: passphrase)
            return true
        } catch UtilsSecretError.setPassphrase(let message) {
            throw UtilsSecretError.changePassphrase(message: message)
        }
    }

    // MARK: - SetEncryptionSecret

    // swiftlint:disable function_body_length
    class func setEncryptionSecret(passphrase: String,
                                   databaseLocation: String) throws {
        do {
            if passphrase.isEmpty {
                let msg: String = "passphrase must not be empty"
                throw UtilsSecretError.setEncryptionSecret(message: msg)
            }
            // store encrypted passphrase
            try setPassphrase(passphrase: passphrase)

            // get the list of databases
            let databaseURL: URL = try UtilsFile.getDatabasesUrl().absoluteURL
            var isDir = ObjCBool(true)
            if FileManager.default.fileExists(atPath: databaseURL.relativePath,
                                              isDirectory: &isDir) && isDir.boolValue {
                let dbList: [String] = try UtilsFile
                    .getFileList(path: databaseURL.relativePath, ext: ".db")
                for file: String in dbList {
                    let state: State = UtilsSQLCipher
                        .getDatabaseState(databaseLocation: databaseLocation,
                                          databaseName: file)
                    if state.rawValue == "ENCRYPTEDGLOBALSECRET" {
                        let globalData: GlobalSQLite = GlobalSQLite()
                        let password: String = globalData.secret

                        let dbPath: String  = try UtilsFile
                            .getFilePath(databaseLocation: databaseLocation,
                                         fileName: file)
                        try UtilsSQLCipher.changePassword(filename: dbPath,
                                                          password: password,
                                                          newpassword: passphrase)
                    } else if state.rawValue == "ERROR" {
                        let msg: String = "Closing \(file) failed"
                        throw UtilsSecretError.setEncryptionSecret(message: msg)
                    } else if state.rawValue == "DOESNOTEXIST"
                                || state.rawValue == "UNKNOWN" {
                        let msg: String = "State for: \(file) not correct"
                        throw UtilsSecretError.setEncryptionSecret(message: msg)
                    }
                }
            } else {
                let msg: String = "No Database folder"
                throw UtilsSecretError.setEncryptionSecret(message: msg)
            }
        } catch UtilsSecretError.setPassphrase(let message) {
            throw UtilsSecretError.setEncryptionSecret(message: message)
        } catch UtilsFileError.getFilePathFailed {
            let msg: String = "Failed when getting a file path"
            throw UtilsSecretError.setEncryptionSecret(message: msg)
        } catch UtilsSQLCipherError.changePassword(let message) {
            throw UtilsSecretError.setEncryptionSecret(message: message)
        }

    }
    // swiftlint:enable function_body_length

    // MARK: - ChangeEncryptionSecret

    // swiftlint:disable function_body_length
    class func changeEncryptionSecret(passphrase: String,
                                      oldPassphrase: String,
                                      databaseLocation: String) throws {
        do {
            if passphrase.isEmpty ||  oldPassphrase.isEmpty {
                let msg: String = "Passphrase and/or oldpassphrase must not " +
                    "be empty"
                throw UtilsSecretError.changeEncryptionSecret(message: msg)
            }
            guard isPassphrase() == true else {
                let msg: String = "Encryption secret has not been set"
                throw UtilsSecretError.changeEncryptionSecret(message: msg)
            }
            guard validatePassphrase(oldPassphrase) == true else {
                let msg: String = "Given oldpassphrase is wrong"
                throw UtilsSecretError.changeEncryptionSecret(message: msg)
            }
            // get the list of databases from the database folder
            let databaseURL: URL = try UtilsFile
                .getFolderURL(folderPath: databaseLocation).absoluteURL
            var isDir = ObjCBool(true)
            if FileManager.default.fileExists(atPath: databaseURL.relativePath,
                                              isDirectory: &isDir) && isDir.boolValue {
                let dbList: [String] = try UtilsFile
                    .getFileList(path: databaseURL.relativePath, ext: ".db")
                for file: String in dbList {
                    let state: State = UtilsSQLCipher
                        .getDatabaseState(databaseLocation: databaseLocation,
                                          databaseName: file)
                    if state.rawValue == "ENCRYPTEDSECRET" {
                        let dbPath: String  = try UtilsFile
                            .getFilePath(databaseLocation: databaseLocation,
                                         fileName: file)
                        try UtilsSQLCipher.changePassword(filename: dbPath,
                                                          password: oldPassphrase,
                                                          newpassword: passphrase)
                    } else if state.rawValue == "ERROR" {
                        let msg: String = "Closing \(file) failed"
                        throw UtilsSecretError.setEncryptionSecret(message: msg)
                    } else if state.rawValue == "DOESNOTEXIST"
                                || state.rawValue == "UNKNOWN"
                                || state.rawValue == "ENCRYPTEDGLOBALSECRET" {
                        let msg: String = "State for: \(file) not correct"
                        throw UtilsSecretError.setEncryptionSecret(message: msg)
                    }

                }

            } else {
                let msg: String = "No Database folder"
                throw UtilsSecretError.setEncryptionSecret(message: msg)
            }

            // store encrypted passphrase
            try setPassphrase(passphrase: passphrase)

        } catch UtilsSecretError.setPassphrase(let message) {
            throw UtilsSecretError.setEncryptionSecret(message: message)
        }

    }
    // swiftlint:enable function_body_length

}
