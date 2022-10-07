//
//  UtilsUpgrade.swift
//  Plugin
//
//  Created by  Quéau Jean Pierre on 18/01/2021.
//  Copyright © 2021 Max Lynch. All rights reserved.
//

import Foundation
import SQLCipher

enum UtilsUpgradeError: Error {
    case onUpgradeFailed(message: String)
    case updateDatabaseVersionFailed(message: String)
    case executeStatementsProcessFailed(message: String)
}
class UtilsUpgrade {
    // MARK: - onUpgrade

    func onUpgrade(mDB: Database,
                   upgDict: [Int: [String: Any]],
                   currentVersion: Int,
                   targetVersion: Int,
                   databaseLocation: String) throws {
        print("UtilsUpgrade.onUpgrade: from \(currentVersion) to \(targetVersion)")

        for (versionKey, upgrade) in Array(upgDict).sorted(by: {$0.0 < $1.0}) {
            if versionKey > currentVersion && versionKey <= targetVersion {
                print("- UtilsUpgrade.onUpgrade toVersion: \(versionKey)")

                guard let statements = upgrade["statements"] as? [String] else {
                    let msg: String = "Error: onUpgrade statements not given"
                    throw UtilsUpgradeError.onUpgradeFailed(message: msg)
                }

                do {
                    _ = try executeStatementsProcess(mDB: mDB, statements: statements)

                    try UtilsSQLCipher.setVersion(mDB: mDB, version: versionKey)
                } catch UtilsSQLCipherError.setVersion(let message) {
                    throw UtilsUpgradeError.onUpgradeFailed(message: "Error: onUpgrade update version: \(message)")
                } catch UtilsUpgradeError.executeStatementsProcessFailed(let message) {
                    throw UtilsUpgradeError.onUpgradeFailed(message: "Error: onUpgrade executeStatementProcess: \(message)")
                }
            }
        }
    }

    // MARK: - ExecuteStatementProcess

    func executeStatementsProcess(mDB: Database, statements: [String])
    throws {
        do {
            do {
                try UtilsSQLCipher.beginTransaction(mDB: mDB)
            } catch UtilsSQLCipherError.beginTransaction(let message) {
                throw DatabaseError.executeSQL(message: "Error: onUpgrade: \(message)")
            }

            // -> Excecute statements
            for (statement) in statements {
                _ = try mDB.executeSQL(sql: statement, transaction: false)
            }

            do {
                try UtilsSQLCipher.commitTransaction(mDB: mDB)
            } catch UtilsSQLCipherError.commitTransaction(let message) {
                throw DatabaseError.executeSQL(message: "Error: onUpgrade: \(message)")
            }

        } catch DatabaseError.executeSQL(let message) {
            do {
                try UtilsSQLCipher.rollbackTransaction(mDB: mDB)
            } catch UtilsSQLCipherError.rollbackTransaction(let message2) {
                throw DatabaseError.executeSQL(message: "Error: onUpgrade: \(message) \(message2)")
            }

            throw UtilsUpgradeError.executeStatementsProcessFailed(message: message)
        }

    }
}
// swiftlint:enable type_body_length
