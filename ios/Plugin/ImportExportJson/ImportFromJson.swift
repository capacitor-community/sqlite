//
//  ImportFromJson.swift
//  CapacitorCommunitySqlite
//
//  Created by  Quéau Jean Pierre on 30/07/2020.
//

import Foundation
import SQLCipher

// swiftlint:disable type_body_length
class ImportFromJson {

    // MARK: - ImportFromJson - CreateDatabaseSchema

    // swiftlint:disable cyclomatic_complexity
    // swiftlint:disable function_body_length
    class func createDatabaseSchema(dbHelper: DatabaseHelper,
                                    jsonSQLite: JsonSQLite,
                                    path: String,
                                    secret: String) throws -> Int {
        var changes: Int = -1
        let version: Int = jsonSQLite.version
        var returnCode: Int32
        guard let mDB: OpaquePointer = try
                UtilsConnection.getWritableDatabase(
                            filename: path, secret: secret) else {
            throw DatabaseHelperError.dbConnection(
                                message: "Error: DB connection")
        }

        if jsonSQLite.mode == "full" {
            // Set PRAGMAS
            let pragmas: String = "PRAGMA user_version = \(version);"
            returnCode = sqlite3_exec(mDB, pragmas, nil, nil, nil)
            if returnCode != SQLITE_OK {
                let errmsg: String =
                                String(cString: sqlite3_errmsg(mDB))
                var message: String = "Error: PRAGMA failed rc: "
                message.append("\(returnCode) message: \(errmsg)")
                throw DatabaseHelperError.createDatabaseSchema(
                    message: message)
            }
            // Drop All Tables Indexes Triggers
            try _ = UtilsDrop.dropAll(dbHelper: dbHelper,
                                      path: path, secret: secret)
        }

        // Start a transaction
        do {
            try UtilsSQLite.beginTransaction(mDB: mDB)
        } catch DatabaseHelperError.beginTransaction(let message) {
            throw DatabaseHelperError.createDatabaseSchema(
                                                message: message)
        }
        // Create the Database Schema
        var statements: [String] = []
        // Loop through Tables
        for ipos in 0..<jsonSQLite.tables.count {
            let mode: String = jsonSQLite.mode
            let tableName: String = jsonSQLite.tables[ipos].name
            if let mSchema: [JsonColumn] =
                                jsonSQLite.tables[ipos].schema {
                if mSchema.count > 0 {
                    let stmt: [String] =
                        ImportFromJson.createTableSchema(
                            mSchema: mSchema,
                            tableName: tableName, mode: mode)
                    statements.append(contentsOf: stmt)
                }
            }
            if let mIndexes: [JsonIndex] =
                                    jsonSQLite.tables[ipos].indexes {
                if mIndexes.count > 0 {
                    let stmt: [String] =
                        ImportFromJson.createTableIndexes(
                            mIndexes: mIndexes, tableName: tableName)
                    statements.append(contentsOf: stmt)
                }
            }
        }
        if statements.count > 0 {
            let joined = statements.joined(separator: "\n")
            print("joined \(joined)")
            do {
                changes = try UtilsSQLite.executeCommit(
                    dbHelper: dbHelper, mDB: mDB, sql: joined)
            } catch DatabaseHelperError.executeCommit(let message) {
                throw DatabaseHelperError.importFromJson(
                    message: message)
            }
        } else {
            changes = 0
        }
        UtilsSQLite.closeDB(mDB: mDB, method: "createDatabaseSchema")
        return changes
    }
    // swiftlint:enable function_body_length
    // swiftlint:enable cyclomatic_complexity

    // MARK: - ImportFromJson - CreateTableSchema

    class func createTableSchema(mSchema: [JsonColumn],
                                 tableName: String, mode: String)
                                                        -> [String] {
        var statements: [String] = []
        var stmt: String
        stmt = "CREATE TABLE IF NOT EXISTS "
        stmt.append(tableName)
        stmt.append(" (")
        for jpos in 0..<mSchema.count {
            if let jSchColumn = mSchema[jpos].column {
                if jSchColumn.count > 0 {
                    stmt.append(jSchColumn)
                }
            }
            if let jSchForeignkey = mSchema[jpos].foreignkey {
                if jSchForeignkey.count > 0 {
                    stmt.append("FOREIGN KEY (\( jSchForeignkey))")
                }
            }
            stmt.append(" ")
            stmt.append(mSchema[jpos].value)
            if jpos != mSchema.count - 1 {
                stmt.append(",")
            }
        }
        stmt.append(");")
        statements.append(stmt)
        // create trigger last_modified associated with the table
        let triggerName: String = tableName + "_trigger_last_modified"
        stmt = "CREATE TRIGGER IF NOT EXISTS "
        stmt.append(triggerName)
        stmt.append(" AFTER UPDATE ON ")
        stmt.append(tableName)
        stmt.append(" FOR EACH ROW ")
        stmt.append("WHEN NEW.last_modified <= OLD.last_modified ")
        stmt.append("BEGIN UPDATE ")
        stmt.append(tableName)
        stmt.append(" SET last_modified = (strftime('%s','now')) ")
        stmt.append("WHERE id=OLD.id; ")
        stmt.append("END;")
        statements.append(stmt)
        return statements
    }

    // MARK: - ImportFromJson - CreateTableIndexes

    class func createTableIndexes(mIndexes: [JsonIndex],
                                  tableName: String) -> [String] {
        var statements: [String] = []
        for jpos in 0..<mIndexes.count {
            var stmt: String
            stmt = "CREATE INDEX IF NOT EXISTS "
            stmt.append(mIndexes[jpos].name)
            stmt.append(" ON ")
            stmt.append(tableName)
            stmt.append(" (")
            stmt.append(mIndexes[jpos].column)
            stmt.append(");")
            statements.append(stmt)
        }
        return statements
    }

    // MARK: - ImportFromJson - createDatabaseData

    // swiftlint:disable function_body_length
    class func createDatabaseData(dbHelper: DatabaseHelper,
                                  jsonSQLite: JsonSQLite, path: String,
                                  secret: String) throws -> Int {
        var changes: Int = -1
        var success: Bool = true
        var isValue: Bool = false
        guard let mDB: OpaquePointer = try
                UtilsConnection.getWritableDatabase(
                            filename: path, secret: secret) else {
            throw DatabaseHelperError.dbConnection(
                message: "Error: DB connection")
        }
        // Start a transaction
        do {
            try UtilsSQLite.beginTransaction(mDB: mDB)
        } catch DatabaseHelperError.beginTransaction(let message) {
            throw DatabaseHelperError.createDatabaseData(
                    message: message)
        }
        // Loop on tables to create Data
        for ipos in 0..<jsonSQLite.tables.count {
            if let mValues = jsonSQLite.tables[ipos].values {
                if mValues.count > 0 {
                    isValue = true
                    do {
                        success = try
                            ImportFromJson.createTableData(
                                dbHelper: dbHelper, mDB: mDB,
                                mode: jsonSQLite.mode,
                                mValues: mValues,
                                tableName: jsonSQLite.tables[ipos].name)
                    } catch DatabaseHelperError
                                .createTableData(let message) {
                        throw DatabaseHelperError
                                .createDatabaseData(message: message)
                    }
                }
            }
        }
        if !success {
            changes = -1
        } else {
            if !isValue {
                changes = 0
            } else {
                // commit the transaction
                do {
                    try UtilsSQLite.commitTransaction(mDB: mDB)
                    changes = Int(sqlite3_total_changes(mDB))
                } catch DatabaseHelperError.commitTransaction(
                            let message) {
                    throw DatabaseHelperError.createDatabaseData(
                        message: message)
                }
            }
        }
        UtilsSQLite.closeDB(mDB: mDB, method: "createTableData")
        return changes
    }
    // swiftlint:enable function_body_length

    // MARK: - ImportFromJson - createTableData

    // swiftlint:disable function_body_length
    class func createTableData(
            dbHelper: DatabaseHelper, mDB: OpaquePointer, mode: String,
            mValues: [[UncertainValue<String, Int, Float>]],
            tableName: String) throws -> Bool {
        var success: Bool = false
        // Check if table exists
        do {
            let isTab: Bool = try UtilsJson.isTableExists(
                dbHelper: dbHelper, mDB: mDB, tableName: tableName)
            if !isTab {
                let message: String = "createTableData: Table " +
                tableName + " does not exist"
                throw DatabaseHelperError.createTableData(
                    message: message)
            }
        } catch DatabaseHelperError.tableNotExists(let message) {
            throw DatabaseHelperError.createTableData(message: message)
        }
        // Get the Column's Name and Type
        var jsonNamesTypes: JsonNamesTypes =
                            JsonNamesTypes(names: [], types: [])
        do {
            jsonNamesTypes = try
                UtilsJson.getTableColumnNamesTypes(
                    dbHelper: dbHelper, mDB: mDB, tableName: tableName)
        } catch DatabaseHelperError.querySql(let message) {
           throw DatabaseHelperError.createTableData(message: message)
        }
        for jpos in 0..<mValues.count {
            // Check row validity
            let row: [UncertainValue<String, Int, Float>] =
                                                        mValues[jpos]
            do {
                try UtilsJson.checkRowValidity(
                    dbHelper: dbHelper, jsonNamesTypes: jsonNamesTypes,
                    row: row, pos: jpos, tableName: tableName)
            } catch DatabaseHelperError.checkRowValidity(let message) {
                throw DatabaseHelperError.createTableData(
                    message: message)
            }
            // Create INSERT or UPDATE Statements
            do {
                let data: [String: Any] = ["pos": jpos, "mode": mode,
                                           "tableName": tableName]
                let stmt: String = try createRowStatement(
                    dbHelper: dbHelper, mDB: mDB, data: data,
                    row: row, jsonNamesTypes: jsonNamesTypes)
                let rowValues = UtilsJson.getValuesFromRow(
                                                    rowValues: row)
                let lastId: Int = try dbHelper.prepareSQL(
                    mDB: mDB, sql: stmt, values: rowValues)
                success = lastId != -1 ? true : false
            } catch DatabaseHelperError.createRowStatement(
                        let message) {
                throw DatabaseHelperError.createTableData(
                    message: message)
                } catch DatabaseHelperError.prepareSql(let message) {
                    throw DatabaseHelperError.createTableData(
                        message: message)
                }
        }
        return success
    }
    // swiftlint:enable function_body_length

    // MARK: - ImportFromJson - createRowStatement

    // swiftlint:disable function_body_length
    class func createRowStatement(
                    dbHelper: DatabaseHelper, mDB: OpaquePointer,
                    data: [String: Any],
                    row: [UncertainValue<String, Int, Float>],
                    jsonNamesTypes: JsonNamesTypes) throws -> String {
        var stmt: String = ""
        var retisIdExists: Bool = false
        let message = "importFromJson: createTableData data is missing"
        guard let pos = data["pos"] as? Int else {
            throw DatabaseHelperError.createTableData(message: message)
        }
        guard let mode = data["mode"] as? String else {
            throw DatabaseHelperError.createTableData(message: message)
        }
        guard let tableName = data["tableName"] as? String else {
            throw DatabaseHelperError.createTableData(message: message)
        }
        do {
            if let rwValue: Any = row[0].value {
                retisIdExists = try UtilsJson.isIdExist(
                    dbHelper: dbHelper, mDB: mDB, tableName: tableName,
                firstColumnName: jsonNamesTypes.names[0], key: rwValue)
            } else {
                var message: String = "importFromJson: Table "
                message.append("\(tableName) values row[0] does not ")
                message.append("exist")
                throw DatabaseHelperError.createTableData(
                                            message: message)
            }

        } catch DatabaseHelperError.isIdExists(let message) {
           throw DatabaseHelperError.createTableData(message: message)
        }
        if mode == "full" || (mode == "partial" && !retisIdExists) {
            // Insert
            let nameString: String = jsonNamesTypes
                                        .names.joined(separator: ",")
            let questionMarkString: String =
                UtilsJson.createQuestionMarkString(
                                    length: jsonNamesTypes.names.count)
            stmt = "INSERT INTO \(tableName) (\(nameString)) VALUES "
            stmt.append("(\(questionMarkString));")
        } else {
            // Update
            let setString: String = UtilsJson.setNameForUpdate(
                                        names: jsonNamesTypes.names)
            if setString.count == 0 {
                var message: String = "importFromJson: Table "
                message.append("\(tableName) values row ")
                message.append("\(pos) not set to String")
                throw DatabaseHelperError.createTableData(
                    message: message)
            }
            if let rwValue: Any = row[0].value {
                stmt = "UPDATE \(tableName)  SET \(setString) WHERE " +
                    "\(jsonNamesTypes.names[0]) = \(rwValue);"
            } else {
                var msg: String = "importFromJson: Table "
                msg.append("\(tableName) values row[0]does not exist")
                throw DatabaseHelperError.createTableData(
                                                message: message)
            }
        }
        return stmt
    }
}
// swiftlint:enable type_body_length
