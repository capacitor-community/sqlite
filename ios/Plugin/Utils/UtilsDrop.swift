//
//  UtilsDrop.swift
//  CapacitorCommunitySqlite
//
//  Created by  Quéau Jean Pierre on 12/10/2020.
//

import Foundation
import SQLCipher

enum UtilsDropError: Error {
    case getTablesNamesFailed(message: String)
    case getIndexesNamesFailed(message: String)
    case getTriggersNamesFailed(message: String)
    case dropTablesFailed(message: String)
    case dropIndexesFailed(message: String)
    case dropTriggersFailed(message: String)
    case dropAllFailed(message: String)
    case dropTempTablesFailed(message: String)
}
class UtilsDrop {

    // MARK: - getTablesNames

    class func getTablesNames(dbHelper: DatabaseHelper,
                              mDB: OpaquePointer) throws -> [String] {
        var names: [String] = []
        var query: String = "SELECT name FROM sqlite_master WHERE "
        query.append("type='table' AND name NOT LIKE 'sync_table' ")
        query.append("AND name NOT LIKE '_temp_%' ")
        query.append("AND name NOT LIKE 'sqlite_%';")
        do {
            let resQuery = try dbHelper.querySQL(
                            mDB: mDB, sql: query, values: [])
            if resQuery.count > 0 {
                for ipos in 0..<resQuery.count {
                    if let mName = resQuery[ipos]["name"] as? String {
                        names.append("\(mName)")
                    }
                }
            }
            return names
        } catch DatabaseHelperError.querySql(let message) {
            throw UtilsDropError.getTablesNamesFailed(message: message)
        }
    }

    // MARK: - dropTables

    class func dropTables(dbHelper: DatabaseHelper, mDB: OpaquePointer)
                    throws -> Int {
        var changes: Int = 0
        do {
            let tables: [String] = try
                    self.getTablesNames(dbHelper: dbHelper, mDB: mDB)
            var statements: [String] = []
            for table in tables {
                var stmt: String = "DROP TABLE IF EXISTS "
                stmt.append(table)
                stmt.append(";")
                statements.append(stmt)
            }
            if statements.count > 0 {
                let joined = statements.joined(separator: "\n")
                changes = try dbHelper.execute(mDB: mDB, sql: joined)
            }
            return changes
        } catch UtilsDropError.getTablesNamesFailed(let message) {
            throw UtilsDropError.dropTablesFailed(message: message)
        } catch DatabaseHelperError.execute(let message) {
            throw UtilsDropError.dropTablesFailed(message: message)
        }
    }

    // MARK: - getIndexesNames

    class func getIndexesNames(dbHelper: DatabaseHelper,
                               mDB: OpaquePointer) throws -> [String] {
        var indexes: [String] = []
        var query: String = "SELECT name FROM sqlite_master WHERE "
        query.append("type='index' AND name NOT LIKE 'sqlite_%';")
        do {
            let resQuery = try dbHelper.querySQL(
                        mDB: mDB, sql: query, values: [])
            if resQuery.count > 0 {
                for ipos in 0..<resQuery.count {
                    if let mName = resQuery[ipos]["name"] as? String {
                        indexes.append("\(mName)")
                    }
                }
            }
            return indexes
        } catch DatabaseHelperError.querySql(let message) {
            throw UtilsDropError
                            .getIndexesNamesFailed(message: message)
        }
    }

    // MARK: - dropIndexes

    class func dropIndexes(dbHelper: DatabaseHelper, mDB: OpaquePointer)
                    throws -> Int {
        var changes: Int = 0
        do {
            let indexes: [String] = try
                    self.getIndexesNames(dbHelper: dbHelper, mDB: mDB)
            var statements: [String] = []
            for index in indexes {
                var stmt: String = "DROP INDEX IF EXISTS "
                stmt.append(index)
                stmt.append(";")
                statements.append(stmt)
            }
            if statements.count > 0 {
                let joined = statements.joined(separator: "\n")
                changes = try dbHelper.execute(mDB: mDB, sql: joined)
            }
            return changes
        } catch UtilsDropError.getIndexesNamesFailed(let message) {
            throw UtilsDropError.dropIndexesFailed(message: message)
        } catch DatabaseHelperError.execute(let message) {
            throw UtilsDropError.dropIndexesFailed(message: message)
        }
    }

    // MARK: - getTriggersNames
    class func getTriggersNames(dbHelper: DatabaseHelper,
                                mDB: OpaquePointer) throws -> [String] {
        var triggers: [String] = []
        var query: String = "SELECT name FROM sqlite_master WHERE "
        query.append("type='trigger';")
        do {
            let resQuery = try dbHelper.querySQL(
                            mDB: mDB, sql: query, values: [])
            if resQuery.count > 0 {
                for ipos in 0..<resQuery.count {
                    if let mName = resQuery[ipos]["name"] as? String {
                        triggers.append("\(mName)")
                    }
                }
            }
            return triggers
        } catch DatabaseHelperError.querySql(let message) {
            throw UtilsDropError
                            .getTriggersNamesFailed(message: message)
        }
    }

    // MARK: - dropTriggers

    class func dropTriggers(dbHelper: DatabaseHelper, mDB: OpaquePointer)
                    throws -> Int {
        var changes: Int = 0
        do {
            let triggers: [String] = try
                    self.getTriggersNames(dbHelper: dbHelper, mDB: mDB)
            var statements: [String] = []
            for trigger in triggers {
                var stmt: String = "DROP TRIGGER IF EXISTS "
                stmt.append(trigger)
                stmt.append(";")
                statements.append(stmt)
            }
            if statements.count > 0 {
                let joined = statements.joined(separator: "\n")
                changes = try dbHelper.execute(mDB: mDB, sql: joined)
            }
            return changes
        } catch UtilsDropError.getTriggersNamesFailed(let message) {
            throw UtilsDropError.dropIndexesFailed(message: message)
        } catch DatabaseHelperError.execute(let message) {
            throw UtilsDropError.dropTriggersFailed(message: message)
        }
    }

    // MARK: - dropAll

    class func dropAll(dbHelper: DatabaseHelper,
                       path: String, secret: String) throws -> Int {
        guard let mDB: OpaquePointer = try
                UtilsConnection.getWritableDatabase(filename: path,
                    secret: secret) else {
            throw DatabaseHelperError.dbConnection(
                message: "Error: DB connection")
        }
        var changes: Int = 0
        // Start a transaction
        do {
            try UtilsSQLite.beginTransaction(mDB: mDB)
        } catch DatabaseHelperError.beginTransaction(let message) {
            throw DatabaseHelperError.createDatabaseSchema(
                message: message)
        }

        do {
            var retChanges: Int = try self.dropTables(
                                    dbHelper: dbHelper, mDB: mDB)
            print("after dropTables retChanges: \(retChanges)")
            retChanges = try self.dropIndexes(
                dbHelper: dbHelper, mDB: mDB)
            changes += retChanges
            print("after dropIndexes retChanges: \(retChanges)")
            retChanges = try self.dropTriggers(
                dbHelper: dbHelper, mDB: mDB)
            print("after dropTriggers retChanges: \(retChanges)")
            changes += retChanges
            if changes >= 0 {
                // commit the transaction
                try UtilsSQLite.commitTransaction(mDB: mDB)
                _ = try dbHelper.execute(mDB: mDB, sql: "VACUUM;")
                changes = Int(sqlite3_total_changes(mDB))
            }

        } catch UtilsDropError.dropTablesFailed(let message) {
            throw UtilsDropError.dropAllFailed(message: message)
        } catch UtilsDropError.dropIndexesFailed(let message) {
            throw UtilsDropError.dropAllFailed(message: message)
        } catch UtilsDropError.dropTriggersFailed(let message) {
            throw UtilsDropError.dropAllFailed(message: message)
        } catch DatabaseHelperError.execute(let message) {
            throw UtilsDropError.dropAllFailed(message: message)
        } catch DatabaseHelperError.commitTransaction(let message) {
            throw DatabaseHelperError.execSet(message: message)
        }

        // close the db
        UtilsSQLite.closeDB(mDB: mDB, method: "dropAll")
        return changes
    }

    // MARK: - dropTempTables

    class func dropTempTables(dbHelper: DatabaseHelper,
                              mDB: OpaquePointer,
                              alterTables: [String: [String]])
                              throws {
        var changes: Int = -1
        var joined: String = ""
        do {
            let tables: [String] = Array(alterTables.keys)
            var statements: [String] = []
            for table in tables {
                let stmt = "DROP TABLE IF EXISTS _temp_\(table);"
                statements.append(stmt)
            }
            if statements.count > 0 {
                    joined = statements.joined(separator: "\n")
                changes = try dbHelper.execute(mDB: mDB, sql: joined)
            }
            if changes < 0 {
                print("No _temp_ Tables dropped")
            }
        } catch DatabaseHelperError.execute(let message) {
            throw UtilsDropError.dropTempTablesFailed(
                message: message)
        }
    }
}
