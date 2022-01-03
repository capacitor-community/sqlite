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
    case backupTablesFailed(message: String)
    case backupTableFailed(message: String)
    case getTableColumnNamesFailed(message: String)
    case updateDatabaseVersionFailed(message: String)
    case getDatabaseVersionFailed(message: String)
    case findCommonColumnsFailed(message: String)
    case arrayIntersectionFailed(message: String)
    case updateNewTablesDataFailed(message: String)
    case executeStatementProcessFailed(message: String)
    case executeSetProcessFailed(message: String)
}

// swiftlint:disable type_body_length
class UtilsUpgrade {
    let utilsDrop: UtilsDrop = UtilsDrop()
    var alterTables: [String: [String]] = [:]
    var commonColumns: [String: [String]] = [:]

    // MARK: - onUpgrade

    // swiftlint:disable cyclomatic_complexity
    // swiftlint:disable function_body_length
    // swiftlint:disable function_parameter_count
    func onUpgrade(mDB: Database,
                   upgDict: [Int: [String: Any]],
                   dbName: String, currentVersion: Int,
                   targetVersion: Int,
                   databaseLocation: String) throws -> Int {

        var changes: Int = -1
        guard let upgrade: [String: Any] = upgDict[currentVersion]
        else {
            var message: String = "Error: onUpgrade No upgrade "
            message.append("statement for database \(dbName) ")
            message.append("and version \(currentVersion)")
            throw UtilsUpgradeError.onUpgradeFailed(message: message)
        }
        guard let toVersion = upgrade["toVersion"] as? Int else {
            let msg: String = "Error: onUpgrade toVersion not given"
            throw UtilsUpgradeError.onUpgradeFailed(message: msg)
        }
        guard let statement = upgrade["statement"] as? String else {
            let msg: String = "Error: onUpgrade statement not given"
            throw UtilsUpgradeError.onUpgradeFailed(message: msg)
        }
        var set: [[String: Any]] = [[:]]
        if (upgrade["set"] as? [[String: Any]]) != nil {
            if let set1: [[String: Any]] =
                upgrade["set"] as? [[String: Any]] {
                set = set1
            }
        }
        if targetVersion < toVersion {
            var message: String = "Error: version mistmatch Upgrade "
            message.append("Statement would upgrade to version ")
            message.append("\(toVersion) , but target version is ")
            message.append("\(targetVersion) for database \(dbName) ")
            message.append("and version \(currentVersion)")
            throw UtilsUpgradeError.onUpgradeFailed(message: message)
        }
        do {
            // Set pragma FOREIGN KEY OFF
            try UtilsSQLCipher
                .setForeignKeyConstraintsEnabled(mDB: mDB,
                                                 toggle: false)
            // backup the database
            _ = try UtilsFile.copyFile(fileName: dbName,
                                       toFileName: "backup-\(dbName)",
                                       databaseLocation: databaseLocation)

            let initChanges = UtilsSQLCipher.dbChanges(mDB: mDB.mDb)

            // Here we assume all the tables schema are given in
            // the upgrade statement
            if statement.count > 0 {
                _ = try executeStatementProcess(mDB: mDB,
                                                statement: statement)

                // here we assume that the Set contains only
                //  - the data for new tables as INSERT statements
                //  - the data for new columns in existing tables
                //    as UPDATE statements
                if set.count > 0 {
                    _ = try executeSetProcess(mDB: mDB, set: set,
                                              toVersion: toVersion)
                }
            }
            // Set pragma FOREIGN KEY ON
            try UtilsSQLCipher
                .setForeignKeyConstraintsEnabled(mDB: mDB,
                                                 toggle: true)
            // get the number of changes
            changes = UtilsSQLCipher.dbChanges(mDB: mDB.mDb) -
                initChanges
            return changes
        } catch UtilsFileError.copyFileFailed {
            let msg: String = "Failed in copy file"
            throw UtilsUpgradeError.onUpgradeFailed(message: msg)
        } catch UtilsSQLCipherError
                    .setForeignKeyConstraintsEnabled(let message) {
            var msg: String = "Failed in "
            msg.append("setForeignKeyConstraintsEnabled \(message)")
            throw UtilsUpgradeError.onUpgradeFailed(message: msg)
        } catch UtilsUpgradeError.executeStatementProcessFailed(
                    let message) {
            throw UtilsUpgradeError.onUpgradeFailed(
                message: message)
        } catch UtilsUpgradeError.executeSetProcessFailed(
                    let message) {
            throw UtilsUpgradeError.onUpgradeFailed(
                message: message)
        }
    }
    // swiftlint:enable function_parameter_count
    // swiftlint:enable function_body_length
    // swiftlint:enable cyclomatic_complexity

    // MARK: - ExecuteSetProcess

    // swiftlint:disable function_body_length
    func executeSetProcess(mDB: Database, set: [[String: Any]],
                           toVersion: Int) throws {
        var msg: String = "Error: executeSetProcess  "
        do {
            // -> load new data
            let changesDict: [String: Int64] = try mDB.execSet(set: set)
            if let changes = changesDict["changes"] {
                if changes < 0 {
                    msg.append("changes < 0")
                    throw UtilsUpgradeError.executeSetProcessFailed(
                        message: msg)
                }
            }

            // -> update database version
            try UtilsSQLCipher.setVersion(mDB: mDB, version: toVersion)

            // -> update syncDate if any
            let isExists: Bool = try
                UtilsJson.isTableExists(mDB: mDB,
                                        tableName: "sync_table")
            if isExists {
                let date = Date()
                let syncTime: Int =
                    Int(date.timeIntervalSince1970)
                var stmt: String = "UPDATE sync_table SET "
                stmt.append("sync_date = \(syncTime) ")
                stmt.append("WHERE id = 1;")
                let retRun: [String: Int64] = try mDB.runSQL(
                    sql: stmt, values: [])
                guard let lastId: Int64 = retRun["lastId"] else {
                    msg.append("Update Sync Date lastId not returned")
                    throw UtilsUpgradeError.executeSetProcessFailed(
                        message: msg)
                }
                if lastId == -1 {
                    msg.append("Update Sync Date lastId < 0")
                    throw UtilsUpgradeError.executeSetProcessFailed(
                        message: msg)
                }
            }
        } catch DatabaseError.execSet(let message) {
            throw UtilsUpgradeError.executeSetProcessFailed(
                message: message)
        } catch UtilsSQLCipherError.setVersion(let message) {
            throw UtilsUpgradeError.executeSetProcessFailed(
                message: message)
        } catch UtilsJsonError.tableNotExists(let message) {
            throw UtilsUpgradeError.executeSetProcessFailed(
                message: message)
        } catch DatabaseError.runSQL(let message) {
            throw UtilsUpgradeError.executeSetProcessFailed(
                message: message)
        }
    }
    // swiftlint:enable function_body_length

    // MARK: - ExecuteStatementProcess

    func executeStatementProcess(mDB: Database, statement: String)
    throws {
        var changes: Int = -1
        do {
            // -> backup all existing tables  "tableName" in
            //    "temp_tableName"
            _ = try backupTables(mDB: mDB)

            // -> Drop all Indexes
            _ = try UtilsDrop.dropIndexes(mDB: mDB)
            // -> Drop all Triggers
            _ = try UtilsDrop.dropTriggers(mDB: mDB)

            // -> Create new tables from upgrade.statement
            changes = try mDB.executeSQL(sql: statement)
            if changes < 0 {
                throw UtilsUpgradeError.executeStatementProcessFailed(
                    message: "Create new tables failed")
            }

            // -> Create the list of table's common fields
            try findCommonColumns(mDB: mDB)

            // -> Update the new table's data from old table's data
            _ = try updateNewTablesData(mDB: mDB)

            // -> Drop _temp_tables
            _ = try UtilsDrop
                .dropTempTables(mDB: mDB,
                                alterTables: self.alterTables)
            // -> Do some cleanup
            self.alterTables = [:]
            self.commonColumns = [:]
        } catch UtilsUpgradeError.backupTablesFailed(let message) {
            throw UtilsUpgradeError.executeStatementProcessFailed(
                message: message)
        } catch UtilsDropError.dropIndexesFailed(let message) {
            throw UtilsUpgradeError.executeStatementProcessFailed(
                message: message)
        } catch UtilsDropError.dropTriggersFailed(let message) {
            throw UtilsUpgradeError.executeStatementProcessFailed(
                message: message)
        } catch DatabaseError.executeSQL(let message) {
            throw UtilsUpgradeError.executeStatementProcessFailed(
                message: message)
        } catch UtilsUpgradeError.findCommonColumnsFailed(
                    let message) {
            throw UtilsUpgradeError.executeStatementProcessFailed(
                message: message)
        } catch UtilsUpgradeError.updateNewTablesDataFailed(
                    let message) {
            throw UtilsUpgradeError.executeStatementProcessFailed(
                message: message)
        } catch UtilsDropError.dropTempTablesFailed(let message) {
            throw UtilsUpgradeError.executeStatementProcessFailed(
                message: message)
        }

    }

    // MARK: - backupTables

    func backupTables(mDB: Database) throws {
        do {
            let tables: [String] = try UtilsDrop
                .getTablesNames(mDB: mDB)
            for table in tables {
                try backupTable(mDB: mDB, tableName: table)
            }
        } catch UtilsDropError.getTablesNamesFailed(let message) {
            throw UtilsUpgradeError.backupTablesFailed(message: message)
        } catch UtilsUpgradeError.backupTableFailed(let message) {
            throw UtilsUpgradeError.backupTablesFailed(message: message)
        }
    }

    // MARK: - backupTable

    func backupTable(mDB: Database, tableName: String) throws {
        var msg: String = "Error: backupTable  "
        var columnNames: [String] = []
        do {
            // get the column's name
            columnNames = try getTableColumnNames(mDB: mDB,
                                                  tableName: tableName)
            alterTables["\(tableName)"] = columnNames
            // prefix the table with _temp_
            var stmt: String = "ALTER TABLE \(tableName) RENAME "
            stmt.append("TO _temp_\(tableName);")
            let retRun: [String: Int64] = try mDB.runSQL(
                sql: stmt, values: [])
            guard let changes: Int64 = retRun["changes"] else {
                msg.append("changes not returned")
                throw UtilsUpgradeError.backupTableFailed(
                    message: msg)
            }
            if changes < 0 {
                msg.append("changes < 0")
                throw UtilsUpgradeError.backupTableFailed(
                    message: msg)
            }

        } catch UtilsUpgradeError
                    .getTableColumnNamesFailed(let message) {
            throw UtilsUpgradeError.backupTableFailed(message: message)
        } catch DatabaseError.runSQL(let message) {
            throw UtilsUpgradeError.backupTableFailed(message: message)
        }
    }

    // MARK: - getTableColumnNames

    func getTableColumnNames(mDB: Database, tableName: String)
    throws -> [String] {
        var retNames: [String] = []
        let query: String = "PRAGMA table_info('\(tableName)');"
        do {
            let resColumns: [[String: Any]] =  try
                mDB.selectSQL(sql: query, values: [])
            if resColumns.count > 0 {
                for rColumn in resColumns {
                    guard let columnName: String = rColumn["name"] as?
                            String else {
                        throw
                        UtilsUpgradeError.getTableColumnNamesFailed(
                            message: "Error did not find column name")
                    }
                    retNames.append(columnName)
                }
            }
            return retNames
        } catch DatabaseError.selectSQL(let message) {
            throw UtilsUpgradeError.getTableColumnNamesFailed(
                message: "Error get column's names failed : \(message)")
        }
    }

    // MARK: - findCommonColumns

    func findCommonColumns(mDB: Database) throws {
        var columnNames: [String] = []
        do {
            let tables: [String] = try UtilsDrop
                .getTablesNames(mDB: mDB)
            for table in tables {
                columnNames = try getTableColumnNames(mDB: mDB,
                                                      tableName: table)
                if alterTables["\(table)"] != nil {
                    if let array1: [String] = alterTables["\(table)"] {
                        commonColumns["\(table)"] =
                            arrayIntersection(array1: array1,
                                              array2: columnNames)
                    }
                }
            }
        } catch UtilsDropError.getTablesNamesFailed(let message) {
            throw UtilsUpgradeError.findCommonColumnsFailed(
                message: message)
        } catch UtilsUpgradeError.getTableColumnNamesFailed(
                    let message) {
            throw UtilsUpgradeError.findCommonColumnsFailed(
                message: message)
        }
    }
    func arrayIntersection( array1: [String], array2: [String])
    -> [String] {
        let array1Set = Set(array1)
        let array2Set = Set(array2)
        return Array(array1Set.intersection(array2Set))
    }
    func updateNewTablesData(mDB: Database) throws {
        var msg: String = "Error: updateNewTablesData  "
        var changes: Int = -1
        do {
            var statements: [String] = []
            let keys: [String] = Array(commonColumns.keys)
            for key in keys {
                if let values = commonColumns["\(key)"] {
                    let columns: String = values.joined(separator: ",")
                    var stmt: String = "INSERT INTO \(key) "
                    stmt.append("(\(columns)) SELECT ")
                    stmt.append("\(columns) FROM _temp_\(key);")
                    statements.append(stmt)
                }
            }
            if statements.count > 0 {
                let joined = statements.joined(separator: "\n")
                changes = try mDB.executeSQL(sql: joined)
                if changes < 0 {
                    msg.append("changes < 0")
                    throw UtilsUpgradeError.updateNewTablesDataFailed(
                        message: msg)
                }
            }
        } catch DatabaseError.executeSQL(let message) {
            throw UtilsUpgradeError.updateNewTablesDataFailed(
                message: message)
        }
    }
}
// swiftlint:enable type_body_length
