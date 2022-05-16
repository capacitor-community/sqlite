//
//  ImportFromJson.swift
//  Plugin
//
//  Created by  Quéau Jean Pierre on 18/01/2021.
//  Copyright © 2021 Max Lynch. All rights reserved.
//

import Foundation
import SQLCipher

// swiftlint:disable type_body_length
// swiftlint:disable file_length
enum ImportFromJsonError: Error {
    case createDatabaseSchema(message: String)
    case createDatabaseData(message: String)
    case createSchema(message: String)
    case createSchemaStatement(message: String)
    case createTableData(message: String)
    case createRowStatement(message: String)
    case createView(message: String)
    case createViews(message: String)
}
class ImportFromJson {

    // MARK: - JsonNotifications - NotifyImportProgressEvent

    class func notifyImportProgressEvent(msg: String) {
        let message = "Import: " + msg
        let vId: [String: Any] = ["progress": message ]
        NotificationCenter.default.post(name: .importJsonProgress, object: nil,
                                        userInfo: vId)
    }

    // MARK: - ImportFromJson - CreateDatabaseSchema

    class func createDatabaseSchema(mDB: Database,
                                    jsonSQLite: JsonSQLite)
    throws -> Int {
        let msg = "importFromJson: "
        var changes: Int = -1
        let version: Int = jsonSQLite.version

        do {
            // Set PRAGMAS
            try UtilsSQLCipher.setVersion(mDB: mDB,
                                          version: version)
            if jsonSQLite.mode == "full" {
                // Drop All Tables, Indexes and Triggers
                try _ = UtilsDrop.dropAll(mDB: mDB)
            }
            // create database schema
            changes = try ImportFromJson
                .createSchema(mDB: mDB,
                              jsonSQLite: jsonSQLite)
            let msg = "Schema creation completed changes: \(changes)"
            notifyImportProgressEvent(msg: msg)
            return changes

        } catch UtilsSQLCipherError.setVersion(let message) {
            throw ImportFromJsonError.createDatabaseSchema(
                message: "\(msg) \(message)")
        } catch UtilsSQLCipherError
                    .setForeignKeyConstraintsEnabled(let message) {
            throw ImportFromJsonError.createDatabaseSchema(
                message: "\(msg) \(message)")
        } catch UtilsDropError.dropAllFailed(let message) {
            throw ImportFromJsonError.createDatabaseSchema(
                message: "\(msg) \(message)")
        } catch ImportFromJsonError.createSchema(let message) {
            throw ImportFromJsonError.createDatabaseSchema(
                message: "\(msg) \(message)")
        }
    }

    // MARK: - ImportFromJson - createSchema

    // swiftlint:disable function_body_length
    class func createSchema(mDB: Database,
                            jsonSQLite: JsonSQLite) throws -> Int {
        var changes: Int = 0
        var initChanges: Int = 0
        do {
            // Start a transaction
            try UtilsSQLCipher.beginTransaction(mDB: mDB)
        } catch UtilsSQLCipherError.beginTransaction(let message) {
            throw ImportFromJsonError.createSchema(message: message)
        }
        // Create a Schema Statements
        let statements = ImportFromJson
            .createSchemaStatement(jsonSQLite: jsonSQLite )
        if statements.count > 0 {
            let joined = statements.joined(separator: "\n")
            let mStmt: String = joined.replacingOccurrences(of: "\'", with: "'")

            do {
                initChanges = UtilsSQLCipher.dbChanges(mDB: mDB.mDb)
                // Execute Schema Statements
                try UtilsSQLCipher.execute(mDB: mDB, sql: mStmt)
                changes = UtilsSQLCipher.dbChanges(mDB: mDB.mDb) -
                    initChanges
                if changes < 0 {
                    do {
                        // Rollback the transaction
                        try UtilsSQLCipher
                            .rollbackTransaction(mDB: mDB)
                    } catch UtilsSQLCipherError
                                .rollbackTransaction(let message) {
                        throw ImportFromJsonError
                        .createSchema(message: message)
                    }
                }
                // Commit the transaction
                try UtilsSQLCipher.commitTransaction(mDB: mDB)

            } catch UtilsSQLCipherError.execute(let message) {
                var msg = message
                do {
                    // Rollback the transaction
                    try UtilsSQLCipher
                        .rollbackTransaction(mDB: mDB)
                    throw ImportFromJsonError
                    .createSchema(message: message)
                } catch UtilsSQLCipherError
                            .rollbackTransaction(let message) {
                    msg.append(" rollback: \(message)")
                    throw ImportFromJsonError
                    .createSchema(message: msg)
                }
            } catch UtilsSQLCipherError.commitTransaction(let message) {
                throw ImportFromJsonError
                .createSchema(message: message)
            }
        } else {
            if jsonSQLite.mode == "partial" {
                changes = 0
                // Commit the transaction
                try UtilsSQLCipher.commitTransaction(mDB: mDB)
            }
        }
        return changes
    }
    // swiftlint:enable function_body_length

    // MARK: - ImportFromJson - createSchemaStatement

    class func createSchemaStatement(jsonSQLite: JsonSQLite)
    -> [String] {
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
            if let mTriggers: [JsonTrigger] =
                jsonSQLite.tables[ipos].triggers {
                if mTriggers.count > 0 {
                    let stmt: [String] =
                        ImportFromJson.createTableTriggers(
                            mTriggers: mTriggers, tableName: tableName)
                    statements.append(contentsOf: stmt)
                }
            }
        }
        return statements
    }

    // MARK: - ImportFromJson - CreateTableSchema

    // swiftlint:disable function_body_length
    // swiftlint:disable cyclomatic_complexity
    class func createTableSchema(mSchema: [JsonColumn],
                                 tableName: String, mode: String)
    -> [String] {
        var statements: [String] = []
        var stmt: String
        var isLastModified: Bool = false
        var isSqlDeleted: Bool = false
        stmt = "CREATE TABLE IF NOT EXISTS "
        stmt.append(tableName)
        stmt.append(" (")
        for jpos in 0..<mSchema.count {
            if let jSchColumn = mSchema[jpos].column {
                if jSchColumn.count > 0 {
                    if jSchColumn == "last_modified" {
                        isLastModified = true
                    }
                    if jSchColumn == "sql_deleted" {
                        isSqlDeleted = true
                    }
                    stmt.append(jSchColumn)
                }
            }
            if let jSchForeignkey = mSchema[jpos].foreignkey {
                if jSchForeignkey.count > 0 {
                    stmt.append("FOREIGN KEY (\( jSchForeignkey))")
                }
            }
            if let jSchConstraint = mSchema[jpos].constraint {
                if jSchConstraint.count > 0 {
                    stmt.append("CONSTRAINT \( jSchConstraint)")
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
        if isLastModified && isSqlDeleted {
            // create trigger last_modified associated with the table
            let triggerName: String = tableName + "_trigger_last_modified"
            stmt = "CREATE TRIGGER IF NOT EXISTS "
            stmt.append(triggerName)
            stmt.append(" AFTER UPDATE ON ")
            stmt.append(tableName)
            stmt.append(" FOR EACH ROW ")
            stmt.append("WHEN NEW.last_modified < OLD.last_modified ")
            stmt.append("BEGIN UPDATE ")
            stmt.append(tableName)
            stmt.append(" SET last_modified = (strftime('%s','now')) ")
            stmt.append("WHERE id=OLD.id; ")
            stmt.append("END;")
            statements.append(stmt)
        }
        return statements
    }
    // swiftlint:enable cyclomatic_complexity
    // swiftlint:enable function_body_length

    // MARK: - ImportFromJson - CreateTableIndexes

    class func createTableIndexes(mIndexes: [JsonIndex],
                                  tableName: String) -> [String] {
        var statements: [String] = []
        for jpos in 0..<mIndexes.count {
            var mUnique: String = ""
            if var mMode = mIndexes[jpos].mode {
                mMode = mMode.uppercased()
                if mMode == "UNIQUE" {
                    mUnique = mMode + " "
                }
            }
            var stmt: String
            stmt = "CREATE "
            stmt.append(mUnique)
            stmt.append("INDEX IF NOT EXISTS ")
            stmt.append(mIndexes[jpos].name)
            stmt.append(" ON ")
            stmt.append(tableName)
            stmt.append(" (")
            stmt.append(mIndexes[jpos].value)
            stmt.append(");")
            statements.append(stmt)
        }
        return statements
    }

    // MARK: - ImportFromJson - CreateTableTriggers

    class func createTableTriggers(mTriggers: [JsonTrigger],
                                   tableName: String) -> [String] {
        var statements: [String] = []

        for jpos in 0..<mTriggers.count {
            var timeevent: String = mTriggers[jpos].timeevent
            if timeevent.uppercased().hasSuffix(" ON") {
                timeevent = String(timeevent.dropLast(3))
            }
            var stmt: String
            stmt = "CREATE TRIGGER IF NOT EXISTS "
            stmt.append(mTriggers[jpos].name)
            stmt.append(" ")
            stmt.append(timeevent)
            stmt.append(" ON ")
            stmt.append("\(tableName) ")
            if let condition = mTriggers[jpos].condition {
                stmt.append("\(condition) ")
            }
            stmt.append("\(mTriggers[jpos].logic);")
            statements.append(stmt)
        }
        return statements
    }

    // MARK: - ImportFromJson - createDatabaseData

    // swiftlint:disable function_body_length
    class func createDatabaseData(mDB: Database,
                                  jsonSQLite: JsonSQLite)
    throws -> Int {
        var changes: Int = -1
        var initChanges: Int = -1
        var isValue: Bool = false

        do {
            initChanges = UtilsSQLCipher.dbChanges(mDB: mDB.mDb)
            // Start a transaction
            try UtilsSQLCipher.beginTransaction(mDB: mDB)
        } catch UtilsSQLCipherError.beginTransaction(let message) {
            throw ImportFromJsonError.createDatabaseData(message: message)
        }
        // Loop on tables to create Data
        for ipos in 0..<jsonSQLite.tables.count {
            if let mValues = jsonSQLite.tables[ipos].values {
                if mValues.count > 0 {
                    isValue = true
                    do {
                        let tableName = jsonSQLite.tables[ipos].name
                        try ImportFromJson.createTableData(
                            mDB: mDB,
                            mode: jsonSQLite.mode,
                            mValues: mValues,
                            tableName: tableName)
                        let msg = "Table \(tableName) data creation completed " +
                            "\(ipos + 1)/\(jsonSQLite.tables.count) ..."
                        notifyImportProgressEvent(msg: msg)

                    } catch ImportFromJsonError
                                .createTableData(let message) {
                        // Rollback Transaction
                        var msg = message
                        do {
                            // Rollback the transaction
                            try UtilsSQLCipher
                                .rollbackTransaction(mDB: mDB)
                            throw ImportFromJsonError
                            .createDatabaseData(message: message)
                        } catch UtilsSQLCipherError
                                    .rollbackTransaction(let message) {
                            msg.append(" rollback: \(message)")
                            throw ImportFromJsonError
                            .createDatabaseData(message: msg)
                        }
                    }
                }
            }
        }
        if !isValue {
            changes = 0
        }
        do {
            // Commit the transaction
            try UtilsSQLCipher.commitTransaction(mDB: mDB)
            changes = UtilsSQLCipher.dbChanges(mDB: mDB.mDb) -
                initChanges
            let msg = "Tables data creation completed changes: \(changes)"
            notifyImportProgressEvent(msg: msg)

        } catch UtilsSQLCipherError.commitTransaction(
                    let message) {
            throw ImportFromJsonError.createDatabaseData(
                message: message)
        }
        return changes
    }
    // swiftlint:enable function_body_length

    // MARK: - ImportFromJson - createTableData

    // swiftlint:disable function_body_length
    class func createTableData(
        mDB: Database, mode: String,
        mValues: [[UncertainValue<String, Int, Double>]],
        tableName: String) throws {
        // Check if table exists
        do {
            let isTab: Bool = try UtilsJson
                .isTableExists(mDB: mDB, tableName: tableName)
            if !isTab {
                let message: String = "createTableData: Table " +
                    tableName + " does not exist"
                throw ImportFromJsonError.createTableData(
                    message: message)
            }
        } catch UtilsJsonError.tableNotExists(let message) {
            throw ImportFromJsonError.createTableData(message: message)
        }
        // Get the Column's Name and Type
        var jsonNamesTypes: JsonNamesTypes =
            JsonNamesTypes(names: [], types: [])
        do {
            jsonNamesTypes = try UtilsJson
                .getTableColumnNamesTypes(mDB: mDB,
                                          tableName: tableName)
        } catch UtilsJsonError.getTableColumnNamesTypes(let message) {
            throw ImportFromJsonError.createTableData(message: message)
        }
        for jpos in 0..<mValues.count {
            // Check row validity
            let row: [UncertainValue<String, Int, Double>] =
                mValues[jpos]
            var isRun: Bool = true

            /* Remove types checking for allowing RDBMS Types
             do {
             try UtilsJson.checkRowValidity(
             mDB: mDB, jsonNamesTypes: jsonNamesTypes,
             row: row, pos: jpos, tableName: tableName)
             } catch UtilsJsonError.checkRowValidity(let message) {
             throw ImportFromJsonError.createTableData(
             message: message)
             }
             */
            // Create INSERT or UPDATE Statements
            do {
                let data: [String: Any] = ["pos": jpos, "mode": mode,
                                           "tableName": tableName]
                let stmt: String = try ImportFromJson
                    .createRowStatement(mDB: mDB, data: data,
                                        row: row,
                                        jsonNamesTypes: jsonNamesTypes)
                var rowValues = UtilsJson.getValuesFromRow(
                    rowValues: row)
                isRun = try UtilsJson.checkUpdate(mDB: mDB, stmt: stmt,
                                                  values: rowValues,
                                                  tableName: tableName,
                                                  names: jsonNamesTypes.names,
                                                  types: jsonNamesTypes.types)

                if isRun {
                    if stmt.prefix(6) == "DELETE" {
                        rowValues = []
                    }
                    let lastId: Int64 = try UtilsSQLCipher.prepareSQL(
                        mDB: mDB, sql: stmt, values: rowValues, fromJson: true)
                    if lastId < 0 {
                        throw ImportFromJsonError.createTableData(
                            message: "lastId < 0")
                    }
                }
            } catch UtilsJsonError.checkUpdate(let message) {
                throw ImportFromJsonError.createTableData(message: message)
            } catch ImportFromJsonError.createRowStatement(let message) {
                throw ImportFromJsonError.createTableData(message: message)
            } catch UtilsSQLCipherError.prepareSQL(let message) {
                throw ImportFromJsonError.createTableData(message: message)
            }
        }
        return
    }
    // swiftlint:enable function_body_length

    // MARK: - ImportFromJson - createRowStatement

    // swiftlint:disable function_body_length
    // swiftlint:disable cyclomatic_complexity
    class func createRowStatement(
        mDB: Database,
        data: [String: Any],
        row: [UncertainValue<String, Int, Double>],
        jsonNamesTypes: JsonNamesTypes) throws -> String {
        var stmt: String = ""
        var retisIdExists: Bool = false
        let message = "createRowStatement: data is missing"
        guard let pos = data["pos"] as? Int else {
            throw ImportFromJsonError.createRowStatement(
                message: message + " pos")
        }
        guard let mode = data["mode"] as? String else {
            throw ImportFromJsonError.createRowStatement(
                message: message + " mode")
        }
        guard let tableName = data["tableName"] as? String else {
            throw ImportFromJsonError.createRowStatement(
                message: message + " tableName")
        }
        do {
            if let rwValue: Any = row[0].value {
                retisIdExists = try UtilsJson.isIdExist(
                    mDB: mDB, tableName: tableName,
                    firstColumnName: jsonNamesTypes.names[0],
                    key: rwValue)
            } else {
                var message: String = "createRowStatement: Table "
                message.append("\(tableName) values row[0] does not ")
                message.append("exist")
                throw ImportFromJsonError.createRowStatement(
                    message: message)
            }

        } catch UtilsJsonError.isIdExists(let message) {
            throw ImportFromJsonError.createRowStatement(
                message: message)
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
            var isUpdate: Bool = true
            let idxDelete: Int = jsonNamesTypes
                .names.firstIndex(where: {$0 == "sql_deleted"}) ?? -1
            if idxDelete >= 0 {
                if let delValue = row[idxDelete].value as? Int {
                    if delValue == 1 {
                        isUpdate = false
                        stmt = "DELETE FROM \(tableName) WHERE "
                        if let rwValue = row[0].value as? String {
                            stmt += "\(jsonNamesTypes.names[0]) = '\(rwValue)';"
                        } else if let rwValue = row[0].value as? Int {
                            stmt += "\(jsonNamesTypes.names[0]) = \(rwValue);"
                        } else {
                            var msg: String = "importFromJson: Table "
                            msg.append("\(tableName) values row[0]does not exist")
                            throw ImportFromJsonError.createRowStatement(
                                message: message)
                        }
                    }
                }
            }
            if isUpdate {
                // Update
                let setString: String = UtilsJson.setNameForUpdate(
                    names: jsonNamesTypes.names)
                if setString.count == 0 {
                    var message: String = "importFromJson: Table "
                    message.append("\(tableName) values row ")
                    message.append("\(pos) not set to String")
                    throw ImportFromJsonError.createRowStatement(
                        message: message)
                }

                stmt = "UPDATE \(tableName)  SET \(setString) WHERE "
                if let rwValue = row[0].value as? String {
                    stmt += "\(jsonNamesTypes.names[0]) = '\(rwValue)';"
                } else if let rwValue = row[0].value as? Int {
                    stmt += "\(jsonNamesTypes.names[0]) = \(rwValue);"
                } else {
                    var msg: String = "importFromJson: Table "
                    msg.append("\(tableName) values row[0]does not exist")
                    throw ImportFromJsonError.createRowStatement(
                        message: message)
                }
            }
        }
        return stmt
    }
    // swiftlint:enable cyclomatic_complexity
    // swiftlint:enable function_body_length

    // MARK: - ImportFromJson - createViews

    // swiftlint:disable function_body_length
    class func createViews(mDB: Database, views: [JsonView]) throws -> Int {
        var changes: Int = 0
        var initChanges: Int = -1
        var isView: Bool = false
        var msg: String = ""

        do {
            initChanges = UtilsSQLCipher.dbChanges(mDB: mDB.mDb)
            // Start a transaction
            try UtilsSQLCipher.beginTransaction(mDB: mDB)
        } catch UtilsSQLCipherError.beginTransaction(let message) {
            throw ImportFromJsonError.createDatabaseData(message: message)
        }
        for view in views {
            if view.name.count > 0 && view.value.count > 0 {
                do {
                    try ImportFromJson.createView(
                        mDB: mDB,
                        view: view)
                    isView = true
                } catch ImportFromJsonError
                            .createView(let message) {
                    msg = message
                }
            } else {
                msg = "no name and value"
                break
            }
        }
        if isView {
            // commit
            do {
                // Commit the transaction
                try UtilsSQLCipher.commitTransaction(mDB: mDB)
                changes = UtilsSQLCipher
                    .dbChanges(mDB: mDB.mDb) - initChanges
            } catch UtilsSQLCipherError.commitTransaction(
                        let message) {
                throw ImportFromJsonError.createDatabaseData(
                    message: message)
            }
        } else {
            if msg.count > 0 {
                // rollback
                do {
                    // Rollback the transaction
                    try UtilsSQLCipher
                        .rollbackTransaction(mDB: mDB)
                    throw ImportFromJsonError
                    .createViews(message: msg)
                } catch UtilsSQLCipherError
                            .rollbackTransaction(let message) {
                    msg.append(" rollback: \(message)")
                    throw ImportFromJsonError
                    .createViews(message: msg)
                }
            } else {
                changes = 0
            }
        }
        return changes

    }
    class func createView(mDB: Database, view: JsonView) throws {
        let stmt = "CREATE VIEW IF NOT EXISTS \(view.name) AS \(view.value);"
        do {
            try UtilsSQLCipher.execute(mDB: mDB, sql: stmt)
        } catch UtilsSQLCipherError.execute(let message) {
            throw ImportFromJsonError
            .createView(message: message)
        }
    }
}
// swiftlint:enable type_body_length
// swiftlint:enable file_length
