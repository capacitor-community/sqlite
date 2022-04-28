//
//  UtilsDrop.swift
//  Plugin
//
//  Created by  Quéau Jean Pierre on 18/01/2021.
//  Copyright © 2021 Max Lynch. All rights reserved.
//

import Foundation
import SQLCipher

enum UtilsDropError: Error {
    case getTablesNamesFailed(message: String)
    case getViewsNamesFailed(message: String)
    case getIndexesNamesFailed(message: String)
    case getTriggersNamesFailed(message: String)
    case dropTablesFailed(message: String)
    case dropViewsFailed(message: String)
    case dropIndexesFailed(message: String)
    case dropTriggersFailed(message: String)
    case dropAllFailed(message: String)
    case dropTempTablesFailed(message: String)
}
class UtilsDrop {

    // MARK: - getTablesNames

    class func getTablesNames(mDB: Database) throws -> [String] {
        var names: [String] = []
        var query: String = "SELECT name FROM sqlite_master WHERE "
        query.append("type='table' AND name NOT LIKE 'sync_table' ")
        query.append("AND name NOT LIKE '_temp_%' ")
        query.append("AND name NOT LIKE 'sqlite_%' ")
        query.append("ORDER BY rootpage DESC;")
        do {
            var resQuery = try mDB.selectSQL(sql: query, values: [])
            if resQuery.count > 0 {
                resQuery.removeFirst()
                for ipos in 0..<resQuery.count {
                    if let mName = resQuery[ipos]["name"] as? String {
                        names.append("\(mName)")
                    }
                }
            }
            return names
        } catch DatabaseError.selectSQL(let message) {
            throw UtilsDropError.getTablesNamesFailed(message: message)
        }
    }

    // MARK: - dropTables

    class func dropTables(mDB: Database)
    throws -> Int {
        var changes: Int = 0
        do {
            let tables: [String] = try getTablesNames(mDB: mDB)
            var statements: [String] = []
            for table in tables {
                var stmt: String = "DROP TABLE IF EXISTS "
                stmt.append(table)
                stmt.append(";")
                statements.append(stmt)
            }
            if statements.count > 0 {
                let joined = statements.joined(separator: "\n")
                changes = try mDB.executeSQL(sql: joined)
            }
            return changes
        } catch UtilsDropError.getTablesNamesFailed(let message) {
            throw UtilsDropError.dropTablesFailed(message: message)
        } catch DatabaseError.executeSQL(let message) {
            throw UtilsDropError.dropTablesFailed(message: message)
        }
    }

    // MARK: - getViewsNames

    class func getViewsNames(mDB: Database) throws -> [String] {
        var names: [String] = []
        var query: String = "SELECT name FROM sqlite_master WHERE "
        query.append("type='view' AND name NOT LIKE 'sqlite_%' ")
        query.append("ORDER BY rootpage DESC;")
        do {
            var resQuery = try mDB.selectSQL(sql: query, values: [])
            if resQuery.count > 0 {
                resQuery.removeFirst()
                for ipos in 0..<resQuery.count {
                    if let mName = resQuery[ipos]["name"] as? String {
                        names.append("\(mName)")
                    }
                }
            }
            return names
        } catch DatabaseError.selectSQL(let message) {
            throw UtilsDropError.getViewsNamesFailed(message: message)
        }
    }

    // MARK: - dropViews

    class func dropViews(mDB: Database)
    throws -> Int {
        var changes: Int = 0
        do {
            let views: [String] = try getViewsNames(mDB: mDB)
            var statements: [String] = []
            for view in views {
                var stmt: String = "DROP VIEW IF EXISTS "
                stmt.append(view)
                stmt.append(";")
                statements.append(stmt)
            }
            if statements.count > 0 {
                let joined = statements.joined(separator: "\n")
                changes = try mDB.executeSQL(sql: joined)
            }
            return changes
        } catch UtilsDropError.getViewsNamesFailed(let message) {
            throw UtilsDropError.dropViewsFailed(message: message)
        } catch DatabaseError.executeSQL(let message) {
            throw UtilsDropError.dropViewsFailed(message: message)
        }
    }

    // MARK: - getIndexesNames

    class func getIndexesNames(mDB: Database) throws -> [String] {
        var indexes: [String] = []
        var query: String = "SELECT name FROM sqlite_master WHERE "
        query.append("type='index' AND name NOT LIKE 'sqlite_%';")
        do {
            var resQuery = try mDB.selectSQL(sql: query, values: [])
            if resQuery.count > 0 {
                resQuery.removeFirst()
                for ipos in 0..<resQuery.count {
                    if let mName = resQuery[ipos]["name"] as? String {
                        indexes.append("\(mName)")
                    }
                }
            }
            return indexes
        } catch DatabaseError.selectSQL(let message) {
            throw UtilsDropError
            .getIndexesNamesFailed(message: message)
        }
    }

    // MARK: - dropIndexes

    class func dropIndexes(mDB: Database) throws -> Int {
        var changes: Int = 0
        do {
            let indexes: [String] = try getIndexesNames(mDB: mDB)
            var statements: [String] = []
            for index in indexes {
                var stmt: String = "DROP INDEX IF EXISTS "
                stmt.append(index)
                stmt.append(";")
                statements.append(stmt)
            }
            if statements.count > 0 {
                let joined = statements.joined(separator: "\n")
                changes = try mDB.executeSQL(sql: joined)
            }
            return changes
        } catch UtilsDropError.getIndexesNamesFailed(let message) {
            throw UtilsDropError.dropIndexesFailed(message: message)
        } catch DatabaseError.executeSQL(let message) {
            throw UtilsDropError.dropIndexesFailed(message: message)
        }
    }

    // MARK: - getTriggersNames
    class func getTriggersNames(mDB: Database) throws -> [String] {
        var triggers: [String] = []
        var query: String = "SELECT name FROM sqlite_master WHERE "
        query.append("type='trigger';")
        do {
            var resQuery = try mDB.selectSQL(sql: query, values: [])
            if resQuery.count > 0 {
                resQuery.removeFirst()
                for ipos in 0..<resQuery.count {
                    if let mName = resQuery[ipos]["name"] as? String {
                        triggers.append("\(mName)")
                    }
                }
            }
            return triggers
        } catch DatabaseError.selectSQL(let message) {
            throw UtilsDropError
            .getTriggersNamesFailed(message: message)
        }
    }
    //1234567890123456789012345678901234567890123456789012345678901234567890
    // MARK: - dropTriggers

    class func dropTriggers(mDB: Database) throws -> Int {
        var changes: Int = 0
        do {
            let triggers: [String] = try self.getTriggersNames(mDB: mDB)
            var statements: [String] = []
            for trigger in triggers {
                var stmt: String = "DROP TRIGGER IF EXISTS "
                stmt.append(trigger)
                stmt.append(";")
                statements.append(stmt)
            }
            if statements.count > 0 {
                let joined = statements.joined(separator: "\n")
                changes = try mDB.executeSQL(sql: joined)
            }
            return changes
        } catch UtilsDropError.getTriggersNamesFailed(let message) {
            throw UtilsDropError.dropIndexesFailed(message: message)
        } catch DatabaseError.executeSQL(let message) {
            throw UtilsDropError.dropTriggersFailed(message: message)
        }
    }

    // MARK: - dropAll

    class func dropAll(mDB: Database) throws -> Int {
        var changes: Int = 0
        let initChanges = UtilsSQLCipher.dbChanges(mDB: mDB.mDb)

        do {
            var retChanges: Int = try self.dropTables(mDB: mDB)
            retChanges = try self.dropIndexes(mDB: mDB)
            changes += retChanges
            retChanges = try self.dropTriggers(mDB: mDB)
            changes += retChanges
            retChanges = try self.dropViews(mDB: mDB)
            if changes >= 0 {
                _ = try UtilsSQLCipher.prepareSQL(mDB: mDB, sql: "VACUUM;",
                                                  values: [], fromJson: false)
                changes = UtilsSQLCipher.dbChanges(mDB: mDB.mDb) -
                    initChanges
            }

        } catch UtilsDropError.dropTablesFailed(let message) {
            throw UtilsDropError.dropAllFailed(message: message)
        } catch UtilsDropError.dropIndexesFailed(let message) {
            throw UtilsDropError.dropAllFailed(message: message)
        } catch UtilsDropError.dropTriggersFailed(let message) {
            throw UtilsDropError.dropAllFailed(message: message)
        } catch UtilsDropError.dropViewsFailed(let message) {
            throw UtilsDropError.dropAllFailed(message: message)
        } catch UtilsSQLCipherError.prepareSQL(let message) {
            throw UtilsDropError.dropAllFailed(message: message)
        }
        return changes
    }

    // MARK: - dropTempTables

    class func dropTempTables(mDB: Database,
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
                changes = try mDB.executeSQL(sql: joined)
            }
            if changes < 0 {
                print("No _temp_ Tables dropped")
            }
        } catch DatabaseError.executeSQL(let message) {
            throw UtilsDropError.dropTempTablesFailed(
                message: message)
        }
    }
}
