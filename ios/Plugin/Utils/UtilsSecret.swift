//
//  UtilsSecret.swift
//  Plugin
//
//  Created by  Quéau Jean Pierre on 04/05/2021.
//  Copyright © 2021 Max Lynch. All rights reserved.
//

import Foundation

enum UtilsSecretError: Error {
    case prefixPassphrase(message: String)
    case setPassphrase(message: String)
    case changePassphrase(message: String)
    case setEncryptionSecret(message: String)
    case changeEncryptionSecret(message: String)
    case clearEncryptionSecret(message: String)
    case checkEncryptionSecret(message: String)
}

let oldAccount: String = "CapacitorSQLitePlugin"

class UtilsSecret {

    // MARK: - IsPassphrase

    class func isPassphrase(account: String) throws -> Bool {

        if !getPassphrase(account: account).isEmpty {
            return true
        }
        if !getPassphrase(account: oldAccount).isEmpty {
            let passphrase = getPassphrase(account: oldAccount)
            do {
                try setPassphrase(account: account, passphrase: passphrase)
                return true
            } catch UtilsSecretError.prefixPassphrase(let message) {
                throw UtilsSecretError.changePassphrase(message: message)
            }
        }
        return false
    }

    // MARK: - GetPassphrase

    class func getPassphrase(account: String) -> String {
        let kcw = KeychainWrapper()
        if let password = try? kcw.getGenericPasswordFor(
            account: account,
            service: "unlockSecret") {
            return password
        }
        return ""
    }

    // MARK: - SetPassphrase

    class func setPassphrase(account: String, passphrase: String) throws {
        let kcw = KeychainWrapper()
        do {
            try kcw.storeGenericPasswordFor(
                account: account,
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

    class func validatePassphrase(account: String, passphrase: String) -> Bool {
        var ret: Bool = false
        let currentPassphrase = getPassphrase(account: account)
        if passphrase == currentPassphrase {
            ret = true
        }
        return ret
    }

    // MARK: - ChangePassphrase

    class func changePassphrase(account: String, oldPassphrase: String,
                                passphrase: String) throws -> Bool {
        guard validatePassphrase(account: account,
                                 passphrase: oldPassphrase) == true else { return false }
        do {
            try setPassphrase(account: account, passphrase: passphrase)
            return true
        } catch UtilsSecretError.setPassphrase(let message) {
            throw UtilsSecretError.changePassphrase(message: message)
        }
    }

    // MARK: - SetEncryptionSecret

    // swiftlint:disable function_body_length
    // swiftlint:disable cyclomatic_complexity
    class func setEncryptionSecret(prefix: String, passphrase: String,
                                   databaseLocation: String) throws {
        do {
            if prefix.isEmpty {
                let msg: String = "keychain prefix must not be empty"
                throw UtilsSecretError.setEncryptionSecret(message: msg)
            }
            if passphrase.isEmpty {
                let msg: String = "passphrase must not be empty"
                throw UtilsSecretError.setEncryptionSecret(message: msg)
            }
            // store encrypted passphrase
            let account = "\(prefix)_\(oldAccount)"
            if !getPassphrase(account: account).isEmpty {
                let msg: String = "passphrase already stored in keychain"
                throw UtilsSecretError.setEncryptionSecret(message: msg)
            }
            try setPassphrase(account: account, passphrase: passphrase)

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
                                          databaseName: file, account: account)
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
    // swiftlint:enable cyclomatic_complexity
    // swiftlint:enable function_body_length

    // MARK: - ChangeEncryptionSecret

    // swiftlint:disable function_body_length
    class func changeEncryptionSecret(prefix: String, passphrase: String,
                                      oldPassphrase: String,
                                      databaseLocation: String) throws {
        do {
            if prefix.isEmpty {
                let msg: String = "Keychain prefix must not " +
                    "be empty"
                throw UtilsSecretError.changeEncryptionSecret(message: msg)
            }
            if passphrase.isEmpty ||  oldPassphrase.isEmpty {
                let msg: String = "Passphrase and/or oldpassphrase must not " +
                    "be empty"
                throw UtilsSecretError.changeEncryptionSecret(message: msg)
            }
            let account = "\(prefix)_\(oldAccount)"
            guard try isPassphrase(account: account) == true else {
                let msg: String = "Encryption secret has not been set"
                throw UtilsSecretError.changeEncryptionSecret(message: msg)
            }
            guard validatePassphrase(account: account,
                                     passphrase: oldPassphrase) == true else {
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
                                          databaseName: file, account: account)
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
            try setPassphrase(account: account, passphrase: passphrase)

        } catch UtilsSecretError.setPassphrase(let message) {
            throw UtilsSecretError.setEncryptionSecret(message: message)
        }

    }
    // swiftlint:enable function_body_length

    // MARK: - ClearEncryptionSecret

    class func clearEncryptionSecret(prefix: String, databaseLocation: String) throws {
        do {
            if prefix.isEmpty {
                let msg: String = "keychain prefix must not be empty"
                throw UtilsSecretError.setEncryptionSecret(message: msg)
            }
            // clear encrypted passphrase
            let account = "\(prefix)_\(oldAccount)"
            if !getPassphrase(account: account).isEmpty {
                try setPassphrase(account: account, passphrase: "")
            }
        } catch UtilsSecretError.setPassphrase(let message) {
            throw UtilsSecretError.clearEncryptionSecret(message: message)
        }

    }

    // MARK: - CheckEncryptionSecret

    class func checkEncryptionSecret(prefix: String, passphrase: String) throws -> NSNumber {
        var ret: NSNumber = 0
        if prefix.isEmpty {
            let msg: String = "keychain prefix must not be empty"
            throw UtilsSecretError.checkEncryptionSecret(message: msg)
        }
        if passphrase.isEmpty {
            let msg: String = "passphrase must not be empty"
            throw UtilsSecretError.checkEncryptionSecret(message: msg)
        }
        // get encrypted passphrase
        let account = "\(prefix)_\(oldAccount)"
        let storedPassPhrase = getPassphrase(account: account)
        if storedPassPhrase.isEmpty {
            let msg: String = "no passphrase stored in keychain"
            throw UtilsSecretError.checkEncryptionSecret(message: msg)
        }
        if storedPassPhrase == passphrase {
            ret = 1
        }
        return ret
    }
}
