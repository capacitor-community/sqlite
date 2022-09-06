//
//  ExportToJson.swift
//  Plugin
//
//  Created by  Quéau Jean Pierre on 18/01/2021.
//  Copyright © 2021 Max Lynch. All rights reserved.
//

import Foundation
import SQLCipher

// swiftlint:disable type_body_length
// swiftlint:disable file_length
enum ExportToJsonError: Error {
    case createExportObject(message: String)
    case getTablesFull(message: String)
    case getTablesPartial(message: String)
    case getSchemaIndexes(message: String)
    case getValues(message: String)
    case createIndexes(message: String)
    case createTriggers(message: String)
    case createSchema(message: String)
    case createValues(message: String)
    case getPartialModeData(message: String)
    case getTablesModified(message: String)
    case getSyncDate(message: String)
    case createRowValues(message: String)
    case modEmbeddedParentheses(message: String)
    case getViews(message: String)
    case setLastExportDate(message: String)
    case getLastExportDate(message: String)
    case delExportedRows(message: String)

}
var REALAFFINITY: [String] = ["REAL", "DOUBLE", "DOUBLE PRECISION", "FLOAT"]
var INTEGERAFFINITY: [String] = ["INTEGER", "INT", "TINYINT", "SMALLINT",
                                 "MEDIUMINT", "BIGINT", "UNSIGNED BIG INT",
                                 "INT2", "INT8"]
var TEXTAFFINITY: [String] = ["TEXT", "CHARACTER", "VARCHAR", "VARYING CHARACTER",
                              "NCHAR", "NATIVE CHARACTER", "NVARCHAR", "CLOB"]
var BLOBAFFINITY: [String] = ["BLOB"]
var NUMERICAFFINITY: [String] = ["NUMERIC", "DECIMAL", "BOOLEAN", "DATE",
                                 "DATETIME"]
class ExportToJson {
    // MARK: - JsonNotifications - NotifyExportProgressEvent

    class func notifyExportProgressEvent(msg: String) {
        let message = "Export " + msg
        let vId: [String: Any] = ["progress": message ]
        NotificationCenter.default.post(name: .exportJsonProgress, object: nil,
                                        userInfo: vId)
    }

    // MARK: - ExportToJson - GetLastExportDate

    class func getLastExportDate(mDB: Database) throws -> Int64 {
        var ret: Int64 = -1
        let query: String = "SELECT sync_date FROM sync_table WHERE id = 2;"
        do {
            let isExists: Bool = try UtilsJson.isTableExists(
                mDB: mDB, tableName: "sync_table")
            if isExists {
                var resSyncDate =  try UtilsSQLCipher.querySQL(
                    mDB: mDB, sql: query, values: [])
                if resSyncDate.count > 1 {
                    resSyncDate.removeFirst()
                    guard let res: Int64 = resSyncDate[0]["sync_date"] as?
                            Int64 else {
                        throw ExportToJsonError.getLastExportDate(
                            message: "Error get sync date failed")
                    }
                    if res > 0 {ret = res}
                }
            } else {
                let msg = "No sync_table available"
                throw ExportToJsonError.getLastExportDate(message: msg)
            }
        } catch UtilsJsonError.tableNotExists(let message) {
            throw ExportToJsonError.getLastExportDate(message: message)
        } catch UtilsSQLCipherError.querySQL(let message) {
            throw ExportToJsonError.getLastExportDate(
                message: "Error get last export date failed : \(message)")
        }
        return ret

    }

    // MARK: - ExportToJson - SetLastExportDate

    class func setLastExportDate(mDB: Database, sTime: Int) throws {
        do {
            let isExists: Bool = try UtilsJson.isTableExists(
                mDB: mDB, tableName: "sync_table")
            if !isExists {
                let msg = "No sync_table available"
                throw ExportToJsonError.setLastExportDate(message: msg)
            }
            var stmt: String = ""
            let res = try getLastExportDate(mDB: mDB)
            if res > 0 {
                stmt = "UPDATE sync_table SET sync_date = \(sTime) " +
                    "WHERE id = 2;"
            } else {
                stmt = "INSERT INTO sync_table (sync_date) VALUES (\(sTime));"
            }
            let lastId: Int64 = try UtilsSQLCipher.prepareSQL(
                mDB: mDB, sql: stmt, values: [], fromJson: false)
            if lastId < 0 {
                throw ExportToJsonError.setLastExportDate(
                    message: "lastId < 0")
            }
            return
        } catch UtilsSQLCipherError.prepareSQL(let message) {              throw ExportToJsonError.setLastExportDate(message: message)
        } catch UtilsJsonError.tableNotExists(let message) {
            throw ExportToJsonError.setLastExportDate(message: message)
        } catch ExportToJsonError.getLastExportDate(let message) {
            throw ExportToJsonError.setLastExportDate(message: message)
        }

    }

    // MARK: - ExportToJson - DelExportedRows

    class func delExportedRows(mDB: Database) throws {
        do {
            // check if synchronization table exists
            let isExists: Bool = try UtilsJson.isTableExists(
                mDB: mDB, tableName: "sync_table")
            if !isExists {
                let msg = "No sync_table available"
                throw ExportToJsonError.delExportedRows(message: msg)
            }
            // get the last export date
            let lastExportDate = try getLastExportDate(mDB: mDB)
            if lastExportDate < 0 {
                let msg = "No last exported date available"
                throw ExportToJsonError.delExportedRows(message: msg)
            }

            // get the table' name list
            let tableList: [String] = try mDB.getTableNames()
            if tableList.count == 0 {
                let msg = "No table's names returned"
                throw ExportToJsonError.delExportedRows(message: msg)
            }
            // Loop through the tables
            for table in tableList {
                var lastId: Int64 = -1
                // define the delete statement
                let delStmt = "DELETE FROM \(table) WHERE sql_deleted = 1 " +
                    "AND last_modified < \(lastExportDate);"
                lastId = try UtilsSQLCipher.prepareSQL(mDB: mDB, sql: delStmt,
                                                       values: [],
                                                       fromJson: true)
                if lastId < 0 {
                    let msg = "DelExportedRows: lastId < 0"
                    throw ExportToJsonError.delExportedRows(message: msg)
                }
            }
            return
        } catch UtilsJsonError.tableNotExists(let message) {
            throw ExportToJsonError.delExportedRows(message: message)
        } catch ExportToJsonError.getLastExportDate(let message) {
            throw ExportToJsonError.delExportedRows(message: message)
        } catch DatabaseError.getTableNames(let message) {
            throw ExportToJsonError.delExportedRows(message: message)
        } catch UtilsSQLCipherError.prepareSQL(let message) {
            throw ExportToJsonError.delExportedRows(message: message)
        }
    }

    // MARK: - ExportToJson - CreateExportObject

    // swiftlint:disable function_body_length
    // swiftlint:disable cyclomatic_complexity
    class func createExportObject(mDB: Database,
                                  data: [String: Any])
    throws -> [String: Any] {
        var retObj: [String: Any] = [:]
        let message = "exportToJson: createExportObject miss data: "
        guard let expMode = data["expMode"] as? String else {
            throw ExportToJsonError.createExportObject(
                message: message + "expMode")
        }
        guard let dbName = data["dbName"] as? String else {
            throw ExportToJsonError.createExportObject(
                message: message + "dbName")
        }
        guard let encrypted = data["encrypted"] as? Bool else {
            throw ExportToJsonError.createExportObject(
                message: message + "encrypted")
        }
        guard let dbVersion = data["version"] as? Int else {
            throw ExportToJsonError.createExportObject(
                message: message + "version")
        }
        var views: [[String: String]] = []
        var tables: [[String: Any]] = []
        do {
            // Get the views
            // get the view's name
            var stmtV: String = "SELECT name,sql FROM sqlite_master WHERE "
            stmtV.append("type = 'view' AND name NOT LIKE 'sqlite_%';")
            var resViews =  try UtilsSQLCipher.querySQL(
                mDB: mDB, sql: stmtV, values: [])
            if resViews.count > 1 {
                resViews.removeFirst()
                views = try ExportToJson
                    .getViews(mDB: mDB,
                              resViews: resViews)
            }
            // Get the tables

            // get the table's name
            var query: String = "SELECT name,sql FROM sqlite_master WHERE "
            query.append("type = 'table' AND name NOT LIKE 'sqlite_%' ")
            query.append("AND name NOT LIKE 'sync_table';")
            var resTables =  try UtilsSQLCipher.querySQL(
                mDB: mDB, sql: query, values: [])
            if resTables.count > 1 {
                resTables.removeFirst()
                let isExists: Bool = try UtilsJson.isTableExists(
                    mDB: mDB, tableName: "sync_table")
                if !isExists && expMode == "partial" {
                    throw ExportToJsonError.createExportObject(message: "No sync_table available")
                }

                switch expMode {
                case "partial" :
                    tables = try ExportToJson
                        .getTablesPartial(mDB: mDB,
                                          resTables: resTables)
                case "full":
                    tables = try ExportToJson.getTablesFull(mDB: mDB,
                                                            resTables: resTables)

                default:
                    throw ExportToJsonError.createExportObject(
                        message: "expMode \(expMode) not defined")
                }
            }
        } catch UtilsJsonError.tableNotExists(let message) {
            throw ExportToJsonError.createExportObject(message: message)
        } catch UtilsSQLCipherError.querySQL(let message) {
            throw ExportToJsonError.createExportObject(
                message: "Error get table's names failed : \(message)")
        } catch ExportToJsonError.getViews(let message) {
            throw ExportToJsonError.createExportObject(
                message: "Error get views failed : \(message)")
        } catch ExportToJsonError.getTablesFull(let message) {
            throw ExportToJsonError.createExportObject(
                message: "Error get tables 'Full' failed : \(message)")
        } catch ExportToJsonError.getTablesPartial(let message) {
            throw ExportToJsonError.createExportObject(
                message: "Error get tables 'Partial' failed :" +
                    " \(message)")
        }
        if tables.count > 0 {
            retObj["database"] = dbName.dropLast(9)
            retObj["version"] = dbVersion
            retObj["encrypted"] = encrypted
            retObj["mode"] = expMode
            retObj["tables"] = tables
            if views.count > 0 {
                retObj["views"] = views
            }
        }

        return retObj
    }
    // swiftlint:enable cyclomatic_complexity
    // swiftlint:enable function_body_length

    // MARK: - ExportToJson - GetSchemaIndexes

    // swiftlint:disable function_body_length
    // swiftlint:disable cyclomatic_complexity
    class func getSchemaIndexes(mDB: Database,
                                stmt: String, table: [String: Any] )
    throws -> [String: Any] {
        var retTable: [String: Any] = table
        var isSchema: Bool  = false
        var isIndexes: Bool = false
        var isTriggers: Bool = false
        do {
            // create schema
            let schema: [[String: String]] = try
                ExportToJson.createSchema(stmt: stmt)
            if schema.count > 0 {
                isSchema = try UtilsJson.validateSchema(schema: schema)
                if isSchema {retTable["schema"] = schema}
            }
            // create indexes
            guard let tableName: String = table["name"] as? String
            else {
                var message: String = "Error getSchemaIndexes: did not"
                message.append("find table name")
                throw ExportToJsonError.getSchemaIndexes(
                    message: message)
            }
            let indexes: [[String: String]] = try
                ExportToJson.createIndexes(mDB: mDB,
                                           tableName: tableName)
            if indexes.count > 0 {
                isIndexes = try UtilsJson.validateIndexes(
                    indexes: indexes)
                if isIndexes {retTable["indexes"] = indexes}
            }
            // create triggers
            let triggers: [[String: String]] = try
                ExportToJson.createTriggers(mDB: mDB,
                                            tableName: tableName)
            if triggers.count > 0 {
                isTriggers = try UtilsJson.validateTriggers(
                    triggers: triggers)
                if isTriggers {retTable["triggers"] = triggers}
            }
            let retObj: [String: Any] = ["isSchema": isSchema,
                                         "isIndexes": isIndexes,
                                         "isTriggers": isTriggers,
                                         "table": retTable]
            return retObj
        } catch ExportToJsonError.createSchema(let message) {
            throw ExportToJsonError.getSchemaIndexes(message: message)
        } catch UtilsJsonError.validateSchema(let message) {
            throw ExportToJsonError.getSchemaIndexes(message: message)
        } catch ExportToJsonError.createIndexes(let message) {
            throw ExportToJsonError.getSchemaIndexes(message: message)
        } catch UtilsJsonError.validateIndexes(let message) {
            throw ExportToJsonError.getSchemaIndexes(message: message)
        } catch ExportToJsonError.createTriggers(let message) {
            throw ExportToJsonError.getSchemaIndexes(message: message)
        } catch UtilsJsonError.validateTriggers(let message) {
            throw ExportToJsonError.getSchemaIndexes(message: message)
        }
    }
    // swiftlint:enable cyclomatic_complexity
    // swiftlint:enable function_body_length

    // MARK: - ExportToJson - GetValues

    class func getValues(mDB: Database, stmt: String,
                         table: [String: Any] )
    throws -> [String: Any] {
        var retTable: [String: Any] = table
        var isValues: Bool  = false
        do {
            guard let tableName: String = table["name"] as? String
            else {
                var message: String = "Error getSchemaIndexes: did "
                message.append("not find table name")
                throw ExportToJsonError.getValues(message: message)
            }
            let jsonNamesTypes: JsonNamesTypes = try UtilsJson
                .getTableColumnNamesTypes(mDB: mDB,
                                          tableName: tableName)
            let rowNames = jsonNamesTypes.names
            let rowTypes = jsonNamesTypes.types

            // create the table data
            let values: [[Any]] = try ExportToJson
                .createValues(mDB: mDB, query: stmt, names: rowNames,
                              types: rowTypes)
            if values.count > 0 {
                retTable["values"] = values
                isValues = true
            }
            let retObj: [String: Any] = ["isValues": isValues,
                                         "table": retTable]
            return retObj
        } catch UtilsJsonError.getTableColumnNamesTypes(let message) {
            throw ExportToJsonError.getValues(message: message)
        } catch ExportToJsonError.createValues(let message) {
            throw ExportToJsonError.getValues(message: message)
        }
    }

    // MARK: - ExportToJson - GetViews

    class func getViews(mDB: Database,
                        resViews: [[String: Any]])
    throws -> [[String: String]] {
        var views: [[String: String]] = []
        var iView: Int = 0
        for rView in resViews {
            iView += 1
            guard let viewName: String = rView["name"] as? String
            else {
                throw ExportToJsonError.getViews(
                    message: "Error did not find view name")
            }
            guard let sqlStmt: String = rView["sql"] as? String else {
                throw ExportToJsonError.getViews(
                    message: "Error did not find sql statement")
            }
            var view: [String: String] = [:]
            view["name"] = viewName
            view["value"] = sqlStmt.components(separatedBy: "AS ")[1]
            views.append(view)
        }
        return views
    }

    // MARK: - ExportToJson - GetTablesFull

    // swiftlint:disable cyclomatic_complexity
    // swiftlint:disable function_body_length
    class func getTablesFull(mDB: Database,
                             resTables: [[String: Any]])
    throws -> [[String: Any]] {
        var tables: [[String: Any]] = []
        var iTable: Int = 0
        for rTable in resTables {
            iTable += 1
            guard let tableName: String = rTable["name"] as? String
            else {
                throw ExportToJsonError.getTablesFull(
                    message: "Error did not find table name")
            }
            guard let sqlStmt: String = rTable["sql"] as? String else {
                throw ExportToJsonError.getTablesFull(
                    message: "Error did not find sql statement")
            }
            var table: [String: Any] = [:]
            table["name"] = tableName
            var result: [String: Any] = [:]
            do {
                // create schema and indexes
                result = try ExportToJson
                    .getSchemaIndexes(mDB: mDB,
                                      stmt: sqlStmt, table: table)
                guard let isSchema: Bool = result["isSchema"] as? Bool
                else {
                    throw ExportToJsonError.getTablesFull(
                        message: "Error did not find isSchema")
                }
                // this seems not correct as it can be case without index
                guard let isIndexes: Bool = result["isIndexes"] as? Bool
                else {
                    throw ExportToJsonError.getTablesFull(
                        message: "Error did not find isIndexes")
                }
                guard let retTable: [String: Any] =
                        result["table"] as? [String: Any] else {
                    throw ExportToJsonError.getTablesFull(
                        message: "Error did not find table")
                }
                var msg: String = "Full: Table \(tableName) schema export" +
                    "completed \(iTable)/\(resTables.count) ..."
                notifyExportProgressEvent(msg: msg)

                table = retTable
                // create the table data
                let query: String = "SELECT * FROM \(tableName);"
                result = try ExportToJson
                    .getValues(mDB: mDB, stmt: query,
                               table: table)
                guard let isValues: Bool = result["isValues"] as? Bool
                else {
                    throw ExportToJsonError.getTablesFull(
                        message: "Error did not find isValues")
                }
                guard let retTable1: [String: Any] = result["table"]
                        as? [String: Any] else {
                    throw ExportToJsonError.getTablesFull(
                        message: "Error did not find table")
                }
                table = retTable1
                // check the table object validity
                var tableKeys: [String] = []
                tableKeys.append(contentsOf: table.keys)

                if tableKeys.count <= 1 ||
                    (!isSchema && !isIndexes && !isValues) {
                    throw ExportToJsonError.getTablesFull(
                        message: "Error table \(tableName) is not a jsonTable")
                }
                tables.append(table)
                msg = "Full: Table \(tableName) data export completed " +
                    "\(iTable)/\(resTables.count) ..."
                notifyExportProgressEvent(msg: msg)

            } catch ExportToJsonError.getSchemaIndexes(let message) {
                throw ExportToJsonError.getTablesFull(
                    message: message)
            } catch ExportToJsonError.getValues(let message) {
                throw ExportToJsonError.getTablesFull(
                    message: message)
            }
        }
        let msg = "Full: Table's export completed "
        notifyExportProgressEvent(msg: msg)
        return tables
    }
    // swiftlint:enable function_body_length
    // swiftlint:enable cyclomatic_complexity

    // MARK: - ExportToJson - GetTablesPartial

    // swiftlint:disable function_body_length
    // swiftlint:disable cyclomatic_complexity
    class func getTablesPartial(mDB: Database,
                                resTables: [[String: Any]])
    throws -> [[String: Any]] {
        var tables: [[String: Any]] = []
        var syncDate: Int64 = 0
        var modTables: [String: String] = [:]
        var modTablesKeys: [String] = []
        var result: [String: Any] = [:]
        var isSchema: Bool = false
        var isIndexes: Bool = false
        do {
            // Get the syncDate and the Modified Tables
            let partialModeData: [String: Any] = try
                ExportToJson.getPartialModeData(mDB: mDB,
                                                tables: resTables)
            guard let sDate = partialModeData["syncDate"] as? Int64
            else {
                let message: String = "Error cannot find syncDate"
                throw ExportToJsonError.getTablesPartial(
                    message: message)
            }
            guard let mTables = partialModeData["modTables"] as?
                    [String: String] else {
                let message: String = "Error cannot find modTables"
                throw ExportToJsonError.getTablesPartial(
                    message: message)
            }
            syncDate = sDate
            modTables = mTables
            modTablesKeys.append(contentsOf: modTables.keys)
            var iTable = 0
            for rTable in resTables {
                iTable += 1
                guard let tableName: String = rTable["name"] as? String
                else {
                    throw ExportToJsonError.getTablesPartial(
                        message: "Error did not find table name")
                }
                guard let sqlStmt: String = rTable["sql"] as? String
                else {
                    throw ExportToJsonError.getTablesPartial(
                        message: "Error did not find sql statement")
                }
                if modTablesKeys.count == 0 ||
                    !modTablesKeys.contains(tableName) ||
                    modTables[tableName] == "No" {
                    continue
                }
                var table: [String: Any] = [:]
                table["name"] = tableName
                if modTables[tableName] == "Create" {
                    // create schema and indexes
                    result = try ExportToJson
                        .getSchemaIndexes(mDB: mDB, stmt: sqlStmt,
                                          table: table)
                    guard let isSch: Bool = result["isSchema"] as? Bool
                    else {
                        throw ExportToJsonError.getTablesPartial(
                            message: "Error did not find isSchema")
                    }
                    guard let isIdxes: Bool = result["isIndexes"] as?
                            Bool else {
                        throw ExportToJsonError.getTablesPartial(
                            message: "Error did not find isIndexes")
                    }
                    guard let retTable: [String: Any] = result["table"]
                            as? [String: Any] else {
                        throw ExportToJsonError.getTablesPartial(
                            message: "Error did not find table")
                    }
                    isSchema = isSch
                    isIndexes = isIdxes
                    table = retTable
                }
                var msg: String = "Partial: Table \(tableName) schema export" +
                    "completed \(iTable)/\(resTables.count) ..."
                notifyExportProgressEvent(msg: msg)

                // create table data
                let query: String = modTables[tableName] == "Create"
                    ? "SELECT * FROM \(tableName);"
                    : "SELECT * FROM \(tableName) WHERE last_modified" +
                    " >= \(syncDate);"
                result = try ExportToJson
                    .getValues(mDB: mDB, stmt: query,
                               table: table)
                guard let isValues: Bool = result["isValues"] as? Bool
                else {
                    throw ExportToJsonError.getTablesPartial(
                        message: "Error did not find isValues")
                }
                guard let retTable1: [String: Any] = result["table"]
                        as? [String: Any] else {
                    throw ExportToJsonError.getTablesPartial(
                        message: "Error did not find table")
                }
                table = retTable1
                // check the table object validity
                var tableKeys: [String] = []
                tableKeys.append(contentsOf: table.keys)

                if tableKeys.count >= 1 &&
                    (isSchema || isIndexes || isValues) {
                    tables.append(table)
                    msg = "Partial: Table \(tableName) data export completed " +
                        "\(iTable)/\(resTables.count) ..."
                    notifyExportProgressEvent(msg: msg)
                }

            }
        } catch ExportToJsonError.getSchemaIndexes(let message) {
            throw ExportToJsonError.getTablesPartial(message: message)
        } catch ExportToJsonError.getValues(let message) {
            throw ExportToJsonError.getTablesPartial(message: message)
        }
        let msg = "Partial: Table's export completed "
        notifyExportProgressEvent(msg: msg)

        return tables
    }
    // swiftlint:enable cyclomatic_complexity
    // swiftlint:enable function_body_length

    // MARK: - ExportToJson - GetPartialModeData

    class func getPartialModeData(mDB: Database,
                                  tables: [[String: Any]])
    throws -> [String: Any] {
        var retData: [String: Any] = [:]
        var syncDate: Int64 = 0
        var modTables: [String: String] = [:]

        // get the sync date if expMode = "partial"
        syncDate = try ExportToJson.getSyncDate(mDB: mDB)
        if syncDate == -1 {
            throw ExportToJsonError.getPartialModeData(
                message: "Error did not find a sync_date")
        }
        do {
            // get the tables which have been updated
            // since last synchronization
            modTables = try ExportToJson
                .getTablesModified(mDB: mDB, tables: tables,
                                   syncDate: syncDate)
            retData = ["syncDate": syncDate, "modTables": modTables]
        } catch ExportToJsonError.getTablesModified(let message) {
            throw ExportToJsonError
            .getPartialModeData(message: message)
        }
        return retData
    }

    // MARK: - ExportToJson - GetSyncDate

    class func getSyncDate(mDB: Database) throws -> Int64 {
        var ret: Int64 = -1
        let query: String = "SELECT sync_date FROM sync_table WHERE id = 1;"
        do {
            let isExists: Bool = try UtilsJson.isTableExists(
                mDB: mDB, tableName: "sync_table")
            if isExists {
                var resSyncDate =  try UtilsSQLCipher.querySQL(
                    mDB: mDB, sql: query, values: [])
                if resSyncDate.count > 1 {
                    resSyncDate.removeFirst()
                    guard let res: Int64 = resSyncDate[0]["sync_date"] as?
                            Int64 else {
                        throw ExportToJsonError.getSyncDate(
                            message: "Error get sync date failed")
                    }
                    if res > 0 {ret = res}
                }
            } else {
                throw ExportToJsonError.getSyncDate(
                    message: "Error no sync_table available")
            }
        } catch UtilsJsonError.tableNotExists(let message) {
            throw ExportToJsonError.getSyncDate(message: message)
        } catch UtilsSQLCipherError.querySQL(let message) {
            throw ExportToJsonError.getSyncDate(
                message: "Error get sync date failed : \(message)")
        }
        return ret
    }

    // MARK: - ExportToJson - GetTablesModified

    // swiftlint:disable function_body_length
    // swiftlint:disable cyclomatic_complexity
    class func getTablesModified(mDB: Database,
                                 tables: [[String: Any]],
                                 syncDate: Int64)
    throws -> [String: String] {
        var retObj: [String: String] = [:]
        if tables.count > 0 {
            for ipos in 0..<tables.count {
                var mode: String
                // get total count of the table
                guard let tableName: String = tables[ipos]["name"] as?
                        String else {
                    var msg: String = "Error get modified tables "
                    msg.append("failed: No statement given")
                    throw ExportToJsonError.getTablesModified(
                        message: msg)
                }
                var query: String = "SELECT count(*) AS count FROM "
                query.append("\(tableName);")
                do {
                    var resQuery =  try UtilsSQLCipher.querySQL(
                        mDB: mDB, sql: query, values: [])
                    if resQuery.count > 1 {
                        resQuery.removeFirst()
                    }
                    if resQuery.count != 1 {
                        break
                    } else {
                        guard let totalCount: Int64 =
                                resQuery[0]["count"]  as? Int64 else {
                            var msg: String = "Error get modified "
                            msg.append("tables failed: totalCount not")
                            msg.append(" defined")
                            throw ExportToJsonError
                            .getTablesModified(message: msg)
                        }
                        query = "SELECT count(*) AS count FROM \(tableName) "
                        query.append("WHERE last_modified >= ")
                        query.append("\(syncDate);")
                        resQuery =  try UtilsSQLCipher.querySQL(
                            mDB: mDB, sql: query, values: [])
                        if resQuery.count > 1 {
                            resQuery.removeFirst()
                        }
                        if resQuery.count != 1 {
                            break
                        } else {
                            guard let totalModifiedCount: Int64 =
                                    (resQuery[0]["count"]  as?
                                        Int64) else {
                                var msg: String = "Error get modified "
                                msg.append("tables failed:")
                                msg.append("totalModifiedCount not ")
                                msg.append("defined")
                                throw ExportToJsonError
                                .getTablesModified(message: msg)
                            }
                            if totalModifiedCount == 0 {
                                mode = "No"
                            } else if totalCount == totalModifiedCount {
                                mode = "Create"
                            } else {
                                mode = "Modified"
                            }
                            retObj[tableName] = mode
                        }
                    }
                } catch UtilsSQLCipherError.querySQL(let message) {
                    var msg: String = "Error get modified tables "
                    msg.append("failed : \(message)")
                    throw ExportToJsonError.getTablesModified(
                        message: msg)
                }
            }
        }
        return retObj
    }
    // swiftlint:enable cyclomatic_complexity
    // swiftlint:enable function_body_length

    // MARK: - ExportToJson - ModEmbeddedParentheses

    class func modEmbeddedParentheses(sqlStmt: String) throws -> String {
        let stmt: String = sqlStmt
        let oPars: [Int] = stmt.indicesOf(string: "(")
        let cPars: [Int] = stmt.indicesOf(string: ")")
        if oPars.count != cPars.count {
            let msg: String = "Not same number of " +
                "opening and closing parentheses"
            throw ExportToJsonError.modEmbeddedParentheses(
                message: msg)
        }
        if oPars.count == 0 {
            return stmt
        }

        var resStmt: String = String(stmt.stringRange(fromIdx: 0, toIdx: oPars[0]))
        var ipos = 0
        while ipos < oPars.count {
            var str: String
            if ipos < oPars.count - 1 {
                if oPars[ipos+1] < cPars[ipos] {
                    str = String(stmt.stringRange(fromIdx: oPars[ipos],
                                                  toIdx: cPars[ipos + 1] + 1))
                    ipos += 1
                } else {
                    str = String(stmt.stringRange(fromIdx: oPars[ipos],
                                                  toIdx: cPars[ipos] + 1))
                }
            } else {
                str = String(stmt.stringRange(fromIdx: oPars[ipos],
                                              toIdx: cPars[ipos] + 1))
            }
            let mStmt: String = str.replacingOccurrences(of: ",", with: "§")
            resStmt.append(mStmt)
            if ipos < oPars.count - 1 {
                resStmt.append(String(stmt.stringRange(fromIdx: cPars[ipos] + 1,
                                                       toIdx: oPars[ipos + 1])))
            }
            ipos += 1
        }
        resStmt.append(String(stmt.stringRange(fromIdx: cPars[cPars.count - 1] + 1,
                                               toIdx: stmt.count)))
        return resStmt

    }

    // swiftlint:enable function_body_length

    // MARK: - ExportToJson - CreateSchema

    // swiftlint:disable function_body_length
    // swiftlint:disable cyclomatic_complexity
    class func createSchema(stmt: String) throws -> [[String: String]] {
        var retSchema: [[String: String]] = []
        // get the sqlStmt between the parenthesis sqlStmt
        if let openPar = stmt.firstIndex(of: "(") {
            if let closePar = stmt.lastIndex(of: ")") {
                var sqlStmt: String = String(
                    stmt[stmt.index(after: openPar)..<closePar])
                // check if there is other parenthesis and replace the ',' by '§'
                do {
                    sqlStmt = try modEmbeddedParentheses(sqlStmt: sqlStmt)
                    let sch: [String] = sqlStmt.components(separatedBy: ",")
                    for ipos in 0..<sch.count {
                        let rstr: String = sch[ipos]
                            .trimmingCharacters(in: .whitespacesAndNewlines)
                        var row = rstr.split(separator: " ", maxSplits: 1)
                        if  row.count == 2 {
                            var columns: [String: String] = [:]
                            switch String(row[0]).uppercased() {
                            case "FOREIGN":
                                guard let oPar = rstr.firstIndex(of: "(")
                                else {
                                    var msg: String = "Create Schema "
                                    msg.append("FOREIGN KEYS no '('")
                                    throw ExportToJsonError
                                    .createSchema(message: msg)
                                }
                                guard let cPar = rstr.firstIndex(of: ")")
                                else {
                                    var msg: String = "Create Schema "
                                    msg.append("FOREIGN KEYS no ')'")
                                    throw ExportToJsonError
                                    .createSchema(message: msg)
                                }
                                row[0] = rstr[rstr.index(
                                                after: oPar)..<cPar]
                                row[1] = rstr[rstr.index(cPar,
                                                         offsetBy: 2)..<rstr.endIndex]
                                columns["foreignkey"] = String(row[0])
                                    .replacingOccurrences(of: "§",
                                                          with: ",")
                                    .replacingOccurrences(of: ", ",
                                                          with: ",")
                            case "PRIMARY":
                                guard let oPar = rstr.firstIndex(of: "(")
                                else {
                                    var msg: String = "Create Schema "
                                    msg.append("PRIMARY KEY no '('")
                                    throw ExportToJsonError
                                    .createSchema(message: msg)
                                }
                                guard let cPar = rstr.firstIndex(of: ")")
                                else {
                                    var msg: String = "Create Schema "
                                    msg.append("PRIMARY KEY no ')'")
                                    throw ExportToJsonError
                                    .createSchema(message: msg)
                                }
                                row[0] = rstr[rstr.index(
                                                after: oPar)..<cPar]
                                row[1] = rstr[rstr.index(rstr.startIndex,
                                                         offsetBy: 0)..<rstr.endIndex]
                                columns["constraint"] = "CPK_" + String(row[0])
                                    .replacingOccurrences(of: "§",
                                                          with: "_")
                                    .replacingOccurrences(of: "_ ",
                                                          with: "_")
                            case "CONSTRAINT":
                                let tRow = row[1].split(separator: " ",
                                                        maxSplits: 1)
                                row[0] = tRow[0]
                                columns["constraint"] = String(row[0])
                                row[1] = tRow[1]
                            default:
                                columns["column"] =  String(row[0])
                            }
                            columns["value"] = String(row[1]).replacingOccurrences(of: "§", with: ",")
                            retSchema.append(columns)
                        } else {
                            throw ExportToJsonError.createSchema(
                                message: "Query result not well formatted")
                        }
                    }

                } catch ExportToJsonError.modEmbeddedParentheses(let message) {
                    throw ExportToJsonError.createIndexes(
                        message: "Error modEmbeddedParentheses failed : \(message)")
                }
            } else {
                throw ExportToJsonError.createSchema(
                    message: "No ')' in the query result")
            }
        } else {
            throw ExportToJsonError.createSchema(
                message: "No '(' in the query result")
        }
        return retSchema
    }
    // swiftlint:enable cyclomatic_complexity
    // swiftlint:enable function_body_length

    // MARK: - ExportToJson - CreateIndexes

    // swiftlint:disable function_body_length
    // swiftlint:disable cyclomatic_complexity
    class func createIndexes(mDB: Database, tableName: String)
    throws -> [[String: String]] {
        var retIndexes: [[String: String]] = []
        var query = "SELECT name,tbl_name,sql FROM sqlite_master WHERE "
        query.append("type = 'index' AND tbl_name = '\(tableName)' ")
        query.append("AND sql NOTNULL;")
        do {
            var resIndexes =  try UtilsSQLCipher.querySQL(
                mDB: mDB, sql: query, values: [])
            if resIndexes.count > 1 {
                resIndexes.removeFirst()
                for ipos in 0..<resIndexes.count {
                    var row: [String: String] = [:]
                    let keys: [String] = Array(resIndexes[ipos].keys)
                    if keys.count == 3 {
                        guard let tblName =
                                resIndexes[ipos]["tbl_name"] as? String
                        else {
                            var msg: String = "Error indexes tbl_name "
                            msg.append("not found")
                            throw ExportToJsonError
                            .createIndexes(message: msg)
                        }
                        if tblName == tableName {
                            guard let sql: String =
                                    resIndexes[ipos]["sql"] as? String
                            else {
                                var msg: String = "Error indexes sql "
                                msg.append("not found")
                                throw ExportToJsonError
                                .createIndexes(message: msg)
                            }
                            guard let name = resIndexes[ipos]["name"]
                                    as? String else {
                                var msg: String = "Error indexes name "
                                msg.append("not found")
                                throw ExportToJsonError
                                .createIndexes(message: msg)
                            }
                            guard let oPar = sql.lastIndex(of: "(")
                            else {
                                var msg: String = "Create Indexes no "
                                msg.append("'('")
                                throw ExportToJsonError
                                .createIndexes(message: msg)
                            }
                            guard let cPar = sql.lastIndex(of: ")")
                            else {
                                var msg: String = "Create Indexes no "
                                msg.append("')'")
                                throw ExportToJsonError
                                .createIndexes(message: msg)
                            }
                            if sql.contains("UNIQUE") {
                                row["mode"] = "UNIQUE"
                            }
                            row["value"] = String(sql[sql.index(
                                                        after: oPar)..<cPar])
                            row["name"] = name
                            retIndexes.append(row)
                        } else {
                            var msg: String = "Error indexes table name"
                            msg.append(" doesn't match")
                            throw ExportToJsonError
                            .createIndexes(message: msg)
                        }
                    } else {
                        throw ExportToJsonError.createIndexes(
                            message: "Error No indexes key found ")
                    }
                }
            }
        } catch UtilsSQLCipherError.querySQL(let message) {
            throw ExportToJsonError.createIndexes(
                message: "Error query indexes failed : \(message)")
        }

        return retIndexes
    }
    // swiftlint:enable cyclomatic_complexity
    // swiftlint:enable function_body_length

    // MARK: - ExportToJson - CreateTriggers

    // swiftlint:disable function_body_length
    // swiftlint:disable cyclomatic_complexity

    class func createTriggers(mDB: Database, tableName: String)
    throws -> [[String: String]] {
        var retTriggers: [[String: String]] = []
        var query = "SELECT name,tbl_name,sql FROM sqlite_master WHERE "
        query.append("type = 'trigger' AND tbl_name = '\(tableName)' ")
        query.append("AND sql NOTNULL;")
        do {
            var resTriggers =  try UtilsSQLCipher.querySQL(
                mDB: mDB, sql: query, values: [])
            if resTriggers.count > 1 {
                resTriggers.removeFirst()
                for ipos in 0..<resTriggers.count {
                    var row: [String: String] = [:]
                    let keys: [String] = Array(resTriggers[ipos].keys)
                    if keys.count == 3 {
                        guard let tblName =
                                resTriggers[ipos]["tbl_name"] as? String
                        else {
                            var msg: String = "Error triggers tbl_name "
                            msg.append("not found")
                            throw ExportToJsonError
                            .createTriggers(message: msg)
                        }
                        if tblName == tableName {
                            guard let sql: String =
                                    resTriggers[ipos]["sql"] as? String
                            else {
                                var msg: String = "Error triggers sql "
                                msg.append("not found")
                                throw ExportToJsonError
                                .createTriggers(message: msg)
                            }
                            guard let name = resTriggers[ipos]["name"]
                                    as? String else {
                                var msg: String = "Error triggers name "
                                msg.append("not found")
                                throw ExportToJsonError
                                .createTriggers(message: msg)
                            }
                            var sqlArr: [String] = sql.components(separatedBy: name)
                            if sqlArr.count != 2 {
                                var msg = "Error sql split name does not "
                                msg.append("return 2 values")
                                throw ExportToJsonError
                                .createTriggers(message: msg)
                            }
                            if !sqlArr[1].contains(tableName) {
                                var msg = "sql split does not contains "
                                msg.append("\(tableName)")
                                throw ExportToJsonError
                                .createTriggers(message: msg)
                            }
                            var timeevent: String = sqlArr[1]
                                .components(separatedBy: tableName)[0]
                                .trimmingCharacters(in:
                                                        .whitespacesAndNewlines)
                            var sep: String = "\(timeevent) \(tableName)"
                            sqlArr = sqlArr[1].components(separatedBy: sep)
                            if sqlArr.count != 2 {
                                var msg = "Error sql split tableName does not "
                                msg.append("return 2 values")
                                throw ExportToJsonError
                                .createTriggers(message: msg)
                            }
                            var condition: String = ""
                            var logic: String = ""
                            sep = sqlArr[1]
                                .trimmingCharacters(in: .whitespacesAndNewlines)
                            if !sep.uppercased().hasPrefix("BEGIN") {
                                sqlArr = sep.components(separatedBy: "BEGIN")
                                if sqlArr.count != 2 {
                                    var msg = "Error sql split BEGIN does not "
                                    msg.append("return 2 values")
                                    throw ExportToJsonError
                                    .createTriggers(message: msg)
                                }
                                condition = sqlArr[0]
                                    .trimmingCharacters(in: .whitespacesAndNewlines)
                                logic = "BEGIN\(sqlArr[1])"
                            } else {
                                logic = sep
                            }
                            if timeevent.uppercased().hasSuffix(" ON") {
                                timeevent = String(timeevent.dropLast(3))
                            }

                            row["timeevent"] = timeevent
                            row["name"] = name
                            if condition.count > 0 {
                                row["condition"] = condition
                            }
                            row["logic"] = logic
                            retTriggers.append(row)
                        } else {
                            var msg: String = "Error triggers table name"
                            msg.append(" doesn't match")
                            throw ExportToJsonError
                            .createTriggers(message: msg)
                        }
                    } else {
                        throw ExportToJsonError.createTriggers(
                            message: "Error No triggers key found ")
                    }
                }
            }
        } catch UtilsSQLCipherError.querySQL(let message) {
            throw ExportToJsonError.createTriggers(
                message: "Error query triggers failed : \(message)")
        }

        return retTriggers
    }
    // swiftlint:enable cyclomatic_complexity
    // swiftlint:enable function_body_length

    // MARK: - ExportToJson - CreateValues

    class func createValues(mDB: Database,
                            query: String, names: [String],
                            types: [String]) throws -> [[Any]] {

        var retValues: [[Any]] = []
        do {
            var resValues =  try UtilsSQLCipher.querySQL(
                mDB: mDB, sql: query, values: [])
            if resValues.count > 1 {
                resValues.removeFirst()
                for ipos in 0..<resValues.count {
                    var row: [Any] = []
                    do {
                        row = try ExportToJson.createRowValues(
                            values: resValues, pos: ipos, names: names,
                            types: types)
                    } catch ExportToJsonError
                                .createRowValues(let message) {
                        var msg: String = "Error create row values "
                        msg.append("failed : \(message)")
                        throw ExportToJsonError.createValues(
                            message: msg)
                    }
                    retValues.append(row)
                }
            }
        } catch UtilsSQLCipherError.querySQL(let message) {
            throw ExportToJsonError.createValues(
                message: "Error query values failed : \(message)")
        }

        return retValues
    }

    // MARK: - ExportToJson - CreateRowValues

    // swiftlint:disable function_body_length
    // swiftlint:disable cyclomatic_complexity
    class func createRowValues(values: [[String: Any]], pos: Int,
                               names: [String],
                               types: [String] ) throws -> [Any] {
        var row: [Any] = []
        for jpos in 0..<names.count {
            if values[pos][names[jpos]] is String  && (TEXTAFFINITY
                                                        .contains(types[jpos].components(separatedBy: "(")[0]
                                                                    .uppercased())
                                                        || BLOBAFFINITY.contains(types[jpos].uppercased())
                                                        || NUMERICAFFINITY.contains(types[jpos].uppercased())
            ) {
                guard let val = values[pos][names[jpos]] as? String
                else {
                    throw ExportToJsonError.createValues(
                        message: "Error value must be String")
                }
                row.append(val)
            } else if values[pos][names[jpos]] is NSNull {
                guard let val = values[pos][names[jpos]] as? NSNull
                else {
                    throw ExportToJsonError.createValues(
                        message: "Error value must be NSNull")
                }
                row.append(val)
            } else if values[pos][names[jpos]] is Int64 && (
                        INTEGERAFFINITY.contains(types[jpos].uppercased()) ||
                            NUMERICAFFINITY.contains(types[jpos].uppercased())) {
                guard let val = values[pos][names[jpos]] as? Int64
                else {
                    throw ExportToJsonError.createValues(
                        message: "Error value must be Int64")
                }
                row.append(val)
            } else if values[pos][names[jpos]] is Int64 && (
                        REALAFFINITY.contains(types[jpos].uppercased())  ||
                            NUMERICAFFINITY.contains(types[jpos]
                                                        .components(separatedBy: "(")[0].uppercased())) {
                guard let val = values[pos][names[jpos]] as? Int64
                else {
                    throw ExportToJsonError.createValues(
                        message: "Error value must be double")
                }
                row.append(Double(val))
            } else if values[pos][names[jpos]] is Double && (
                        REALAFFINITY.contains(types[jpos].uppercased()) ||
                            NUMERICAFFINITY.contains(types[jpos]
                                                        .components(separatedBy: "(")[0].uppercased())) {
                guard let val = values[pos][names[jpos]] as? Double
                else {
                    throw ExportToJsonError.createValues(
                        message: "Error value must be double")
                }
                row.append(val)

            } else {
                throw ExportToJsonError.createValues(
                    message: "Error value is not (string, nsnull," +
                        "int64,double")
            }
        }
        return row
    }
    // swiftlint:enable cyclomatic_complexity
    // swiftlint:enable function_body_length

}
// swiftlint:enable type_body_length
// swiftlint:enable file_length
