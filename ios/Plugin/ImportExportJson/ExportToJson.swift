//
//  ExportToJson.swift
//  CapacitorCommunitySqlite
//
//  Created by  Quéau Jean Pierre on 30/07/2020.
//

import Foundation
import SQLCipher
// swiftlint:disable type_body_length
// swiftlint:disable file_length
class ExportToJson {

    // MARK: - ExportToJson - CreateExportObject

    // swiftlint:disable function_body_length
    // swiftlint:disable cyclomatic_complexity
    class func createExportObject(dbHelper: DatabaseHelper,
                                  data: [String: Any])
                                            throws -> [String: Any] {
        var retObj: [String: Any] = [:]
        let message = "exportToJson: createExportObject miss data: "
        guard let path = data["path"] as? String else {
            throw DatabaseHelperError.createExportObject(
                message: message + "path")
        }
        guard let expMode = data["expMode"] as? String else {
            throw DatabaseHelperError.createExportObject(
                message: message + "expMode")
        }
        guard let dbName = data["dbName"] as? String else {
            throw DatabaseHelperError.createExportObject(
                message: message + "dbName")
        }
        guard let encrypted = data["encrypted"] as? Bool else {
            throw DatabaseHelperError.createExportObject(
                message: message + "encrypted")
        }
        guard let secret = data["secret"] as? String else {
            throw DatabaseHelperError.createExportObject(
                message: message + "secret")
        }
        guard let dbVersion = data["version"] as? Int else {
            throw DatabaseHelperError.createExportObject(
                message: message + "version")
        }

        guard let mDB: OpaquePointer = try
                UtilsConnection.getReadableDatabase(
                filename: path, secret: secret) else {
            throw DatabaseHelperError.createExportObject(
                message: "Error: DB connection")
        }
        retObj["database"] = dbName.dropLast(9)
        retObj["version"] = dbVersion
        retObj["encrypted"] = encrypted
        retObj["mode"] = expMode
        var tables: [[String: Any]] = []

        // get the table's name
        var query: String = "SELECT name,sql FROM sqlite_master WHERE "
        query.append("type = 'table' AND name NOT LIKE 'sqlite_%' ")
        query.append("AND name NOT LIKE 'sync_table';")
        do {
            let resTables =  try dbHelper.querySQL(
                                    mDB: mDB, sql: query, values: [])
            if resTables.count > 0 {
                switch expMode {
                case "partial" :
                    tables = try
                        ExportToJson.getTablesPartial(
                            dbHelper: dbHelper, mDB: mDB,
                            resTables: resTables)
                case "full":
                    tables = try ExportToJson.getTablesFull(
                        dbHelper: dbHelper, mDB: mDB,
                        resTables: resTables)

                default:
                    throw DatabaseHelperError.createExportObject(
                        message: "expMode \(expMode) not defined")
                }
            }
        } catch DatabaseHelperError.querySql(let message) {
            throw DatabaseHelperError.createExportObject(
                message: "Error get table's names failed : \(message)")
        } catch DatabaseHelperError.getTablesFull(let message) {
            throw DatabaseHelperError.createExportObject(
                message: "Error get tables 'Full' failed : \(message)")
        } catch DatabaseHelperError.getTablesPartial(let message) {
                   throw DatabaseHelperError.createExportObject(
                        message: "Error get tables 'Partial' failed :" +
                        " \(message)")
               }

        retObj["tables"] = tables

        return retObj
    }
    // swiftlint:enable cyclomatic_complexity
    // swiftlint:enable function_body_length

    // MARK: - ExportToJson - GetSchemaIndexes

    class func getSchemaIndexes(dbHelper: DatabaseHelper,
                                mDB: OpaquePointer,
                                stmt: String, table: [String: Any] )
                                            throws -> [String: Any] {
        var retTable: [String: Any] = table
        var isSchema: Bool  = false
        var isIndexes: Bool = false
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
                throw DatabaseHelperError.getSchemaIndexes(
                    message: message)
            }
            let indexes: [[String: String]] = try
                ExportToJson.createIndexes(
                    dbHelper: dbHelper, mDB: mDB, tableName: tableName)
            if indexes.count > 0 {
                isIndexes = try UtilsJson.validateIndexes(
                    indexes: indexes)
                if isIndexes {retTable["indexes"] = indexes}
            }
            let retObj: [String: Any] = ["isSchema": isSchema,
                                         "isIndexes": isIndexes,
                                        "table": retTable]
            return retObj
        } catch DatabaseHelperError.createSchema(let message) {
            throw DatabaseHelperError.getSchemaIndexes(message: message)
        } catch DatabaseHelperError.validateSchema(let message) {
            throw DatabaseHelperError.getSchemaIndexes(message: message)
        } catch DatabaseHelperError.createIndexes(let message) {
            throw DatabaseHelperError.getSchemaIndexes(message: message)
        } catch DatabaseHelperError.validateIndexes(let message) {
            throw DatabaseHelperError.getSchemaIndexes(message: message)
        }
    }

    // MARK: - ExportToJson - GetValues

    class func getValues(dbHelper: DatabaseHelper, mDB: OpaquePointer,
                         stmt: String, table: [String: Any] )
                                            throws -> [String: Any] {
        var retTable: [String: Any] = table
        var isValues: Bool  = false
        do {
            guard let tableName: String = table["name"] as? String
            else {
                var message: String = "Error getSchemaIndexes: did "
                message.append("not find table name")
                throw DatabaseHelperError.getValues(message: message)
            }
            let jsonNamesTypes: JsonNamesTypes =
                try UtilsJson.getTableColumnNamesTypes(
                    dbHelper: dbHelper, mDB: mDB, tableName: tableName)
            let rowNames = jsonNamesTypes.names
            let rowTypes = jsonNamesTypes.types

            // create the table data

            let values: [[Any]] = try
                ExportToJson.createValues(
                    dbHelper: dbHelper, mDB: mDB,
                    query: stmt, names: rowNames, types: rowTypes)
            if values.count > 0 {
                retTable["values"] = values
                isValues = true
            }
            let retObj: [String: Any] = ["isValues": isValues,
                                         "table": retTable]
            return retObj
        } catch DatabaseHelperError
                    .getTableColumnNamesTypes(let message) {
            throw DatabaseHelperError.getValues(message: message)
        } catch DatabaseHelperError.createValues(let message) {
            throw DatabaseHelperError.getValues(message: message)
        }
    }

    // MARK: - ExportToJson - GetTablesFull

    // swiftlint:disable cyclomatic_complexity
    // swiftlint:disable function_body_length
    class func getTablesFull(dbHelper: DatabaseHelper,
                             mDB: OpaquePointer,
                             resTables: [[String: Any]])
                                            throws -> [[String: Any]] {
        var tables: [[String: Any]] = []
        for rTable in resTables {
            guard let tableName: String = rTable["name"] as? String
            else {
                throw DatabaseHelperError.getTablesFull(
                    message: "Error did not find table name")
            }
            guard let sqlStmt: String = rTable["sql"] as? String else {
                throw DatabaseHelperError.getTablesFull(
                    message: "Error did not find sql statement")
            }
            var table: [String: Any] = [:]
            table["name"] = tableName
            var result: [String: Any] = [:]
            do {
                // create schema and indexes
                result = try ExportToJson.getSchemaIndexes(
                    dbHelper: dbHelper, mDB: mDB,
                    stmt: sqlStmt, table: table)
                guard let isSchema: Bool = result["isSchema"] as? Bool
                else {
                    throw DatabaseHelperError.getTablesFull(
                        message: "Error did not find isSchema")
                }
                guard let isIndexes: Bool = result["isIndexes"] as? Bool
                else {
                    throw DatabaseHelperError.getTablesFull(
                        message: "Error did not find isIndexes")
                }
                guard let retTable: [String: Any] =
                        result["table"] as? [String: Any] else {
                    throw DatabaseHelperError.getTablesFull(
                        message: "Error did not find table")
                }
                table = retTable
                // create the table data
                let query: String = "SELECT * FROM \(tableName);"
                result = try ExportToJson.getValues(
                    dbHelper: dbHelper, mDB: mDB,
                    stmt: query, table: table)
                guard let isValues: Bool = result["isValues"] as? Bool
                else {
                    throw DatabaseHelperError.getTablesFull(
                        message: "Error did not find isValues")
                }
                guard let retTable1: [String: Any] = result["table"]
                        as? [String: Any] else {
                    throw DatabaseHelperError.getTablesFull(
                        message: "Error did not find table")
                }
                table = retTable1
                // check the table object validity
                var tableKeys: [String] = []
                tableKeys.append(contentsOf: table.keys)

                if tableKeys.count < 1 ||
                        (!isSchema && !isIndexes && !isValues) {
                    throw DatabaseHelperError.getTablesFull(
                        message: "Error table is not a jsonTable")
                }
                tables.append(table)
            } catch DatabaseHelperError.getSchemaIndexes(let message) {
                throw DatabaseHelperError.getTablesFull(
                    message: message)
            } catch DatabaseHelperError.getValues(let message) {
                throw DatabaseHelperError.getTablesFull(
                    message: message)
            }
        }

        return tables
    }
    // swiftlint:enable function_body_length
    // swiftlint:enable cyclomatic_complexity

    // MARK: - ExportToJson - GetTablesPartial

    // swiftlint:disable function_body_length
    // swiftlint:disable cyclomatic_complexity
    class func getTablesPartial(dbHelper: DatabaseHelper,
                                mDB: OpaquePointer,
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
                ExportToJson.getPartialModeData(
                dbHelper: dbHelper, mDB: mDB, tables: resTables)
            guard let sDate = partialModeData["syncDate"] as? Int64
            else {
                let message: String = "Error cannot find syncDate"
                throw DatabaseHelperError.getTablesPartial(
                    message: message)
            }
            guard let mTables = partialModeData["modTables"] as?
                    [String: String] else {
                let message: String = "Error cannot find modTables"
                throw DatabaseHelperError.getTablesPartial(
                    message: message)
            }
            syncDate = sDate
            modTables = mTables
            modTablesKeys.append(contentsOf: modTables.keys)

            for rTable in resTables {
                guard let tableName: String = rTable["name"] as? String
                else {
                    throw DatabaseHelperError.getTablesPartial(
                        message: "Error did not find table name")
                }
                guard let sqlStmt: String = rTable["sql"] as? String
                else {
                    throw DatabaseHelperError.getTablesPartial(
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
                    result = try ExportToJson.getSchemaIndexes(
                            dbHelper: dbHelper, mDB: mDB,
                            stmt: sqlStmt, table: table)
                    guard let isSch: Bool = result["isSchema"] as? Bool
                    else {
                        throw DatabaseHelperError.getTablesFull(
                            message: "Error did not find isSchema")
                    }
                    guard let isIdxes: Bool = result["isIndexes"] as?
                            Bool else {
                        throw DatabaseHelperError.getTablesFull(
                            message: "Error did not find isIndexes")
                    }
                    guard let retTable: [String: Any] = result["table"]
                            as? [String: Any] else {
                        throw DatabaseHelperError.getTablesFull(
                            message: "Error did not find table")
                    }
                    isSchema = isSch
                    isIndexes = isIdxes
                    table = retTable
                }
                // create table data
                let query: String = modTables[tableName] == "Create"
                    ? "SELECT * FROM \(tableName);"
                    : "SELECT * FROM \(tableName) WHERE last_modified" +
                    " > \(syncDate);"
                result = try ExportToJson.getValues(
                                        dbHelper: dbHelper, mDB: mDB,
                                        stmt: query, table: table)
                guard let isValues: Bool = result["isValues"] as? Bool
                else {
                    throw DatabaseHelperError.getTablesFull(
                        message: "Error did not find isValues")
                }
                guard let retTable1: [String: Any] = result["table"]
                                                as? [String: Any] else {
                    throw DatabaseHelperError.getTablesFull(
                                message: "Error did not find table")
                }
                table = retTable1
                // check the table object validity
                var tableKeys: [String] = []
                tableKeys.append(contentsOf: table.keys)

                if tableKeys.count < 1 ||
                        (!isSchema && !isIndexes && !isValues) {
                    throw DatabaseHelperError.getTablesPartial(
                            message: "Error table is not a jsonTable")
                }
                tables.append(table)
            }
        } catch DatabaseHelperError.getSchemaIndexes(let message) {
            throw DatabaseHelperError.getTablesPartial(message: message)
        } catch DatabaseHelperError.getValues(let message) {
            throw DatabaseHelperError.getTablesPartial(message: message)
        }
        return tables
    }
    // swiftlint:enable cyclomatic_complexity
    // swiftlint:enable function_body_length

    // MARK: - ExportToJson - GetPartialModeData

    class func getPartialModeData(dbHelper: DatabaseHelper,
                                  mDB: OpaquePointer,
                                  tables: [[String: Any]])
                                        throws -> [String: Any] {
        var retData: [String: Any] = [:]
        var syncDate: Int64 = 0
        var modTables: [String: String] = [:]

        // get the sync date if expMode = "partial"
        syncDate = try ExportToJson.getSyncDate(
                                dbHelper: dbHelper, mDB: mDB)
        if syncDate == -1 {
            throw DatabaseHelperError.getPartialModeData(
                message: "Error did not find a sync_date")
        }
        do {
            modTables = try ExportToJson.getTablesModified(
                dbHelper: dbHelper, mDB: mDB, tables: tables,
                syncDate: syncDate)
            retData = ["syncDate": syncDate, "modTables": modTables]
        } catch DatabaseHelperError.getTablesModified(let message) {
            throw DatabaseHelperError.getPartialModeData(
                                                message: message)
        }
        return retData
    }

    // MARK: - ExportToJson - GetSyncDate

    class func getSyncDate(dbHelper: DatabaseHelper,
                           mDB: OpaquePointer) throws -> Int64 {
        var ret: Int64 = -1
        let query: String = "SELECT sync_date FROM sync_table;"
        do {
            let resSyncDate =  try dbHelper.querySQL(
                                mDB: mDB, sql: query, values: [])
            if resSyncDate.count > 0 {
                guard let res: Int64 = resSyncDate[0]["sync_date"] as?
                                        Int64 else {
                    throw DatabaseHelperError.getSyncDate(
                                message: "Error get sync date failed")
                }
                if res > 0 {ret = res}
            }
        } catch DatabaseHelperError.querySql(let message) {
            throw DatabaseHelperError.getSyncDate(
                    message: "Error get sync date failed : \(message)")
        }
        return ret
    }

    // MARK: - ExportToJson - GetTablesModified

    // swiftlint:disable function_body_length
    class func getTablesModified(dbHelper: DatabaseHelper,
                                 mDB: OpaquePointer,
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
                    throw DatabaseHelperError.getTablesModified(
                        message: msg)
                }
                var query: String = "SELECT count(*) FROM "
                query.append("\(tableName);")
                do {
                    var resQuery =  try dbHelper.querySQL(
                                    mDB: mDB, sql: query, values: [])
                    if resQuery.count != 1 {
                        break
                    } else {
                        guard let totalCount: Int64 =
                            resQuery[0]["count(*)"]  as? Int64 else {
                            var msg: String = "Error get modified "
                            msg.append("tables failed: totalCount not")
                            msg.append(" defined")
                            throw DatabaseHelperError
                            .getTablesModified(message: msg)
                        }
                        query = "SELECT count(*) FROM \(tableName) "
                        query.append("WHERE last_modified > ")
                        query.append("\(syncDate);")
                        resQuery =  try dbHelper.querySQL(
                                    mDB: mDB, sql: query, values: [])
                        if resQuery.count != 1 {
                            break
                        } else {
                            guard let totalModifiedCount: Int64 =
                                    (resQuery[0]["count(*)"]  as?
                                                    Int64) else {
                                var msg: String = "Error get modified "
                                msg.append("tables failed:")
                                msg.append("totalModifiedCount not ")
                                msg.append("defined")
                                throw DatabaseHelperError
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
                } catch DatabaseHelperError.querySql(let message) {
                    var msg: String = "Error get modified tables "
                    msg.append("failed : \(message)")
                    throw DatabaseHelperError.getTablesModified(
                        message: msg)
                }
            }
        }
        return retObj
    }
    // swiftlint:enable function_body_length

    // MARK: - ExportToJson - CreateSchema

    // swiftlint:disable function_body_length
    class func createSchema(stmt: String) throws -> [[String: String]] {
        var retSchema: [[String: String]] = []
        // get the sqlStmt between the parenthesis sqlStmt
        if let openPar = stmt.firstIndex(of: "(") {
            if let closePar = stmt.lastIndex(of: ")") {
                let sqlStmt: String = String(
                        stmt[stmt.index(after: openPar)..<closePar])
                let sch: [String] = sqlStmt.components(separatedBy: ",")
                for ipos in 0..<sch.count {
                    let rstr: String = sch[ipos]
                        .trimmingCharacters(in: .whitespacesAndNewlines)
                    var row = rstr.split(separator: " ", maxSplits: 1)
                    if  row.count == 2 {
                        var columns: [String: String] = [:]
                        if String(row[0]).uppercased() != "FOREIGN" {
                            columns["column"] =  String(row[0])
                        } else {
                            guard let oPar = rstr.firstIndex(of: "(")
                                    else {
                                var msg: String = "Create Schema "
                                msg.append("FOREIGN KEYS no '('")
                                throw DatabaseHelperError
                                .createSchema(message: msg)
                            }
                            guard let cPar = rstr.firstIndex(of: ")")
                                    else {
                                var msg: String = "Create Schema "
                                msg.append("FOREIGN KEYS no ')'")
                                throw DatabaseHelperError
                                .createSchema(message: msg)
                            }
                            row[0] = rstr[rstr.index(
                                            after: oPar)..<cPar]
                            row[1] = rstr[rstr.index(
                                    cPar, offsetBy: 2)..<rstr.endIndex]
                            print("row[0] \(row[0]) row[1] \(row[1]) ")
                            columns["foreignkey"] = String(row[0])
                        }
                        columns["value"] = String(row[1])
                        retSchema.append(columns)
                    } else {
                        throw DatabaseHelperError.createSchema(
                            message: "Query result not well formatted")
                    }
                }
            } else {
                throw DatabaseHelperError.createSchema(
                            message: "No ')' in the query result")
            }
        } else {
            throw DatabaseHelperError.createSchema(
                        message: "No '(' in the query result")
        }
        return retSchema
    }
    // swiftlint:enable function_body_length

    // MARK: - ExportToJson - CreateIndexes

    // swiftlint:disable function_body_length
    class func createIndexes(dbHelper: DatabaseHelper,
                             mDB: OpaquePointer,
                             tableName: String)
                                    throws -> [[String: String]] {
        var retIndexes: [[String: String]] = []
        var query = "SELECT name,tbl_name,sql FROM sqlite_master WHERE "
        query.append("type = 'index' AND tbl_name = '\(tableName)' ")
        query.append("AND sql NOTNULL;")
        do {
            let resIndexes =  try dbHelper.querySQL(
                                mDB: mDB, sql: query, values: [])
            if resIndexes.count > 0 {
                for ipos in 0..<resIndexes.count {
                    var row: [String: String] = [:]
                    let keys: [String] = Array(resIndexes[ipos].keys)
                    if keys.count == 3 {
                        guard let tblName =
                                resIndexes[ipos]["tbl_name"] as? String
                                        else {
                            var msg: String = "Error indexes tbl_name "
                            msg.append("not found")
                            throw DatabaseHelperError
                            .createIndexes(message: msg)
                        }
                        if tblName == tableName {
                            guard let sql: String =
                                    resIndexes[ipos]["sql"] as? String
                                        else {
                                var msg: String = "Error indexes sql "
                                msg.append("not found")
                                throw DatabaseHelperError
                                .createIndexes(message: msg)
                            }
                            guard let name = resIndexes[ipos]["name"]
                                    as? String else {
                                var msg: String = "Error indexes name "
                                msg.append("not found")
                                 throw DatabaseHelperError
                                .createIndexes(message: msg)
                            }
                            guard let oPar = sql.lastIndex(of: "(")
                                        else {
                                var msg: String = "Create Indexes no "
                                msg.append("'('")
                                throw DatabaseHelperError
                                .createIndexes(message: msg)
                            }
                            guard let cPar = sql.lastIndex(of: ")")
                                        else {
                                var msg: String = "Create Indexes no "
                                msg.append("')'")
                                throw DatabaseHelperError
                                .createIndexes(message: msg)
                            }
                            row["column"] = String(sql[sql.index(
                                                after: oPar)..<cPar])
                            row["name"] = name
                            retIndexes.append(row)
                        } else {
                            var msg: String = "Error indexes table name"
                            msg.append(" doesn't match")
                            throw DatabaseHelperError
                            .createIndexes(message: msg)
                        }
                    } else {
                        throw DatabaseHelperError.createIndexes(
                            message: "Error No indexes key found ")
                    }
                }
            }
        } catch DatabaseHelperError.querySql(let message) {
            throw DatabaseHelperError.createIndexes(
                message: "Error query indexes failed : \(message)")
        }

        return retIndexes
    }
    // swiftlint:enable function_body_length

    // MARK: - ExportToJson - CreateValues

    class func createValues(dbHelper: DatabaseHelper,
                            mDB: OpaquePointer,
                            query: String, names: [String],
                            types: [String]) throws -> [[Any]] {

        var retValues: [[Any]] = []
        do {
            let resValues =  try dbHelper.querySQL(
                                mDB: mDB, sql: query, values: [])
            if resValues.count > 0 {
                for ipos in 0..<resValues.count {
                    var row: [Any] = []
                    do {
                        row = try ExportToJson.createRowValues(
                            values: resValues, pos: ipos, names: names,
                            types: types)
                    } catch DatabaseHelperError
                                        .createRowValues(let message) {
                        var msg: String = "Error create row values "
                        msg.append("failed : \(message)")
                        throw DatabaseHelperError.createValues(
                            message: msg)
                    }
                    retValues.append(row)
                }
            }
        } catch DatabaseHelperError.querySql(let message) {
            throw DatabaseHelperError.createValues(
                message: "Error query values failed : \(message)")
        }

        return retValues
    }

    // MARK: - ExportToJson - CreateRowValues

    class func createRowValues(values: [[String: Any]], pos: Int,
                               names: [String],
                               types: [String] ) throws -> [Any] {
        var row: [Any] = []
        for jpos in 0..<names.count {
            if types[jpos] == "INTEGER" {
                if values[pos][names[jpos]] is String {
                    guard let val = values[pos][names[jpos]] as? String
                                else {
                        throw DatabaseHelperError.createValues(
                            message: "Error value must be String")
                    }
                    row.append(val)
                } else {
                    guard let val = values[pos][names[jpos]] as? Int64
                                else {
                        throw DatabaseHelperError.createValues(
                            message: "Error value must be String")
                    }
                    row.append(val)
                }
            } else if types[jpos] == "REAL" {
                if values[pos][names[jpos]] is String {
                    guard let val = values[pos][names[jpos]] as? String
                                else {
                        throw DatabaseHelperError.createValues(
                            message: "Error value must be String")
                    }
                    row.append(val)
                } else {
                    guard let val = values[pos][names[jpos]] as? Double
                                else {
                        throw DatabaseHelperError.createValues(
                            message: "Error value must be Double")
                    }
                    row.append(val)
                }
            } else {
                guard let val = values[pos][names[jpos]] as? String
                            else {
                    throw DatabaseHelperError.createValues(
                        message: "Error value must be String")
                }
                row.append(val)
            }
        }
        return row
    }
}
// swiftlint:enable type_body_length
// swiftlint:enable file_length
