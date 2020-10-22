//
//  UtilsUpgrade.swift
//  CapacitorCommunitySqlite
//
//  Created by  Quéau Jean Pierre on 12/10/2020.
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

// swiftlint:disable file_length
// swiftlint:disable type_body_length
class UtilsUpgrade {
    let utilsDrop: UtilsDrop = UtilsDrop()
    var alterTables: [String: [String]] = [:]
    var commonColumns: [String: [String]] = [:]

    // MARK: - onUpgrade

    // swiftlint:disable cyclomatic_complexity
    // swiftlint:disable function_body_length
    // swiftlint:disable function_parameter_count
    func onUpgrade(dbHelper: DatabaseHelper, mDB: OpaquePointer,
                   versionUpgrades: [String: [Int: [String: Any]]],
                   dbName: String, currentVersion: Int,
                   targetVersion: Int) throws -> Int {

        var changes: Int = -1
        guard let dbVUValues: [Int: [String: Any]] =
                versionUpgrades[dbName] else {
            var message: String = "Error: onUpgrade No upgrade "
            message.append("statement for database \(dbName)")
            throw UtilsUpgradeError.onUpgradeFailed(message: message)
        }
        guard let upgrade: [String: Any] = dbVUValues[currentVersion]
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
            var pragmas: String = "PRAGMA foreign_keys = OFF;"
            changes = try dbHelper.execute(mDB: mDB, sql: pragmas)
            // Here we assume all the tables schema are given in
            // the upgrade statement
            if statement.count > 0 {
                _ = try self.executeStatementProcess(
                                        dbHelper: dbHelper, mDB: mDB,
                                        statement: statement)

                // here we assume that the Set contains only
                //  - the data for new tables as INSERT statements
                //  - the data for new columns in existing tables
                //    as UPDATE statements
                if set.count > 0 {
                    _ = try self.executeSetProcess(
                                        dbHelper: dbHelper, mDB: mDB,
                                        set: set, toVersion: toVersion)
                }
            }
            // Set pragma FOREIGN KEY OFF
            pragmas = "PRAGMA foreign_keys = ON;"
            changes = try dbHelper.execute(mDB: mDB, sql: pragmas)
            return changes
        } catch DatabaseHelperError.execute(let message) {
            throw UtilsUpgradeError.onUpgradeFailed(
                message: message)
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
    func executeSetProcess(
                    dbHelper: DatabaseHelper, mDB: OpaquePointer,
                    set: [[String: Any]], toVersion: Int) throws {
        do {
            // -> load new data
            let changesDict: [String: Int] = try
                dbHelper.executeSet(
                mDB: mDB,
                set: set)
            if let changes = changesDict["changes"] {
                if changes < 0 {
                    var msg: String = "Error: onUpgrade  "
                    msg.append("ExecuteSet changes < 0")
                    throw UtilsUpgradeError.onUpgradeFailed(
                        message: msg)
                }
            }

            // -> update database version
            let changes: Int = try
                self.updateDatabaseVersion(
                    dbHelper: dbHelper,
                    mDB: mDB, newVersion: toVersion)
            if changes < 0 {
                var msg: String = "Error: onUpgrade  "
                msg.append("UpdateDatabaseVersion changes ")
                msg.append("< 0")
                throw UtilsUpgradeError.onUpgradeFailed(
                    message: msg)
            }

            // -> update syncDate if any
            let isExists: Bool = try
                UtilsJson.isTableExists(
                    dbHelper: dbHelper, mDB: mDB,
                    tableName: "sync_table")
            if isExists {
                let date = Date()
                let syncTime: Int =
                    Int(date.timeIntervalSince1970)
                var stmt: String = "UPDATE sync_table SET "
                stmt.append("sync_date = \(syncTime) ")
                stmt.append("WHERE id = 1;")
                let lastId: Int = try dbHelper
                    .prepareSQL(mDB: mDB, sql: stmt, values: [])
                if lastId == -1 {
                    var msg: String = "Error: onUpgrade  "
                    msg.append("Update Sync Date lastId ")
                    msg.append("< 0")
                    throw UtilsUpgradeError.onUpgradeFailed(
                        message: msg)
                }
            }
        } catch UtilsUpgradeError.updateNewTablesDataFailed(
                    let message) {
            throw UtilsUpgradeError.executeSetProcessFailed(
                message: message)
        } catch DatabaseHelperError.executeSet(let message) {
            throw UtilsUpgradeError.executeSetProcessFailed(
                message: message)
        } catch UtilsUpgradeError.updateDatabaseVersionFailed(
                    let message) {
            throw UtilsUpgradeError.executeSetProcessFailed(
                message: message)
        }
    }
    // swiftlint:enable function_body_length

    // MARK: - ExecuteStatementProcess

    func executeStatementProcess(
                        dbHelper: DatabaseHelper,
                        mDB: OpaquePointer, statement: String) throws {
        var changes: Int = -1
        do {
            // -> backup all existing tables  "tableName" in
            //    "temp_tableName"
            _ = try self.backupTables(dbHelper: dbHelper, mDB: mDB)

            // -> Drop all Indexes
            _ = try UtilsDrop.dropIndexes(dbHelper: dbHelper,
                                            mDB: mDB)
            // -> Drop all Triggers
            _ = try UtilsDrop.dropTriggers(dbHelper: dbHelper,
                                            mDB: mDB)

            // -> Create new tables from upgrade.statement
            changes = try dbHelper.execute(
                mDB: mDB,
                sql: statement)
            if changes < 0 {
                throw UtilsUpgradeError.onUpgradeFailed(
                    message: "Create new tables failed")
            }

            // -> Create the list of table's common fields
            try self.findCommonColumns(dbHelper: dbHelper,
                                       mDB: mDB)

            // -> Update the new table's data from old table's data
            _ = try self.updateNewTablesData(
                dbHelper: dbHelper, mDB: mDB)

            // -> Drop _temp_tables
            _ = try UtilsDrop.dropTempTables(
                dbHelper: dbHelper, mDB: mDB,
                alterTables: self.alterTables)

            // -> Do some cleanup
            self.alterTables = [:]
            self.commonColumns = [:]
        } catch UtilsUpgradeError.backupTablesFailed(let message) {
            throw UtilsUpgradeError.executeStatementProcessFailed(
                message: message)
        } catch UtilsDropError.dropIndexesFailed(
                    let message) {
            throw UtilsUpgradeError.executeStatementProcessFailed(
                message: message)
        } catch UtilsDropError.dropTriggersFailed(
                    let message) {
            throw UtilsUpgradeError.executeStatementProcessFailed(
                message: message)
        } catch UtilsUpgradeError.findCommonColumnsFailed(
                    let message) {
            throw UtilsUpgradeError.executeStatementProcessFailed(
                message: message)
        }
    }

    // MARK: - getDatabaseVersion

    func getDatabaseVersion(dbHelper: DatabaseHelper,
                            mDB: OpaquePointer)
                                                throws -> Int {
        var version: Int = 0
        let pragmas: String = "PRAGMA user_version;"
        do {
            let resVersion =  try dbHelper.querySQL(mDB: mDB,
                                                    sql: pragmas,
                                                    values: [])
            if resVersion.count > 0 {
                guard let res: Int64 = resVersion[0]["user_version"]
                        as? Int64 else {
                    throw UtilsUpgradeError.getDatabaseVersionFailed(
                        message: "Error get version failed")
                }
                if res > 0 {version =  Int(truncatingIfNeeded: res)}
            }
            return version
        } catch DatabaseHelperError.execute(let message) {
            throw UtilsUpgradeError.getDatabaseVersionFailed(
                message: message)
        }

    }
    // MARK: - updateDatabaseVersion

    func updateDatabaseVersion(dbHelper: DatabaseHelper,
                               mDB: OpaquePointer, newVersion: Int)
                               throws -> Int {
        var changes: Int = -1
        let pragmas: String = "PRAGMA user_version = \(newVersion);"
        do {
            changes = try dbHelper.execute(mDB: mDB, sql: pragmas)
            return changes
        } catch DatabaseHelperError.execute(let message) {
            throw UtilsUpgradeError.updateDatabaseVersionFailed(
                message: message)
        }

    }

    // MARK: - backupTables

    func backupTables(dbHelper: DatabaseHelper, mDB: OpaquePointer)
                      throws {
        do {
            let tables: [String] = try UtilsDrop
                    .getTablesNames(dbHelper: dbHelper, mDB: mDB)
            for table in tables {
                try backupTable(dbHelper: dbHelper, mDB: mDB,
                                tableName: table)
            }
        } catch UtilsDropError.getTablesNamesFailed(let message) {
            throw UtilsUpgradeError.backupTablesFailed(message: message)
        } catch UtilsUpgradeError.backupTableFailed(let message) {
            throw UtilsUpgradeError.backupTablesFailed(message: message)
        }
    }

    // MARK: - backupTable

    func backupTable(dbHelper: DatabaseHelper, mDB: OpaquePointer,
                     tableName: String) throws {
        var changes: Int = -1
        var columnNames: [String] = []
        // Start a transaction
        do {
            try UtilsSQLite.beginTransaction(mDB: mDB)
        } catch DatabaseHelperError.beginTransaction(let message) {
            throw UtilsUpgradeError.backupTableFailed(message: message)
        }
        do {
            // get the column's name
            columnNames = try getTableColumnNames(
                dbHelper: dbHelper, mDB: mDB, tableName: tableName)
            self.alterTables["\(tableName)"] = columnNames
            // prefix the table with _temp_
            var stmt: String = "ALTER TABLE \(tableName) RENAME "
            stmt.append("TO _temp_\(tableName);")
            changes = try dbHelper.execute(mDB: mDB, sql: stmt)
            if changes == 0 {
                // commit the transaction
                try UtilsSQLite.commitTransaction(mDB: mDB)
            }
        } catch DatabaseHelperError.commitTransaction(let message) {
            throw UtilsUpgradeError.backupTableFailed(message: message)
        } catch DatabaseHelperError.execute(let message) {
            throw UtilsUpgradeError.backupTableFailed(message: message)
        }
    }

    // MARK: - getTableColumnNames

    func getTableColumnNames(dbHelper: DatabaseHelper,
                             mDB: OpaquePointer,
                             tableName: String)
                                                throws -> [String] {
        var retNames: [String] = []
        let query: String = "PRAGMA table_info('\(tableName)');"
        do {
            let resColumns: [[String: Any]] =  try
                    dbHelper.querySQL(mDB: mDB, sql: query, values: [])
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
        } catch DatabaseHelperError.querySql(let message) {
            throw UtilsUpgradeError.getTableColumnNamesFailed(
                message: "Error get column's names failed : \(message)")
        }
    }

    // MARK: - findCommonColumns

    func findCommonColumns(dbHelper: DatabaseHelper,
                           mDB: OpaquePointer) throws {
        var columnNames: [String] = []
        do {
            let tables: [String] = try UtilsDrop
                    .getTablesNames(dbHelper: dbHelper, mDB: mDB)
            for table in tables {
                columnNames = try getTableColumnNames(
                    dbHelper: dbHelper, mDB: mDB, tableName: table)
                if self.alterTables["\(table)"] != nil {
                    if let array1: [String] =
                                        self.alterTables["\(table)"] {
                        self.commonColumns["\(table)"] =
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
    func updateNewTablesData(dbHelper: DatabaseHelper,
                             mDB: OpaquePointer) throws {
        var changes: Int = -1
        // Start a transaction
        do {
            try UtilsSQLite.beginTransaction(mDB: mDB)
        } catch DatabaseHelperError.beginTransaction(let message) {
            throw UtilsUpgradeError.backupTableFailed(message: message)
        }
        do {
            var statements: [String] = []
            let keys: [String] = Array(self.commonColumns.keys)
            for key in keys {
                if let values = self.commonColumns["\(key)"] {
                    let columns: String = values.joined(separator: ",")
                    var stmt: String = "INSERT INTO \(key) "
                    stmt.append("(\(columns)) SELECT ")
                    stmt.append("\(columns) FROM _temp_\(key);")
                    statements.append(stmt)
                }
            }
            if statements.count > 0 {
                let joined = statements.joined(separator: "\n")
                changes = try dbHelper.execute(mDB: mDB, sql: joined)
            }
            if changes > -1 {
                // commit the transaction
                try UtilsSQLite.commitTransaction(mDB: mDB)
            }
        } catch DatabaseHelperError.commitTransaction(let message) {
            throw UtilsUpgradeError.updateNewTablesDataFailed(
                message: message)
        } catch DatabaseHelperError.execute(let message) {
            throw UtilsUpgradeError.updateNewTablesDataFailed(
                message: message)
        }
    }
}
// swiftlint:enable type_body_length
// swiftlint:enable file_length
