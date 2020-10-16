//
//  UtilsJson.swift
//  CapacitorCommunitySqlite
//
//  Created by  Quéau Jean Pierre on 30/07/2020.
//

import Foundation
class UtilsJson {

    // MARK: - ImportFromJson - IsTableExists

    class func isTableExists(dbHelper: DatabaseHelper,
                             mDB: OpaquePointer, tableName: String)
                                                throws -> Bool {
        var ret: Bool = false
        var query = "SELECT name FROM sqlite_master WHERE type='table'"
        query.append(" AND name='")
        query.append(tableName)
        query.append("';")
        do {
            let resQuery: [Any] = try dbHelper.querySQL(
                                    mDB: mDB, sql: query, values: [])
            if resQuery.count > 0 {ret = true}
        } catch DatabaseHelperError.querySql(let message) {
            throw DatabaseHelperError.tableNotExists(message: message)
        }
        return ret
    }

    // MARK: - ImportFromJson - GetTableColumnNamesTypes

    class func getTableColumnNamesTypes(dbHelper: DatabaseHelper,
                                        mDB: OpaquePointer,
                                        tableName: String)
                                        throws -> JsonNamesTypes {
        var ret: JsonNamesTypes = JsonNamesTypes(names: [], types: [])
        var query: String = "PRAGMA table_info("
        query.append(tableName)
        query.append(");")
        do {
            let resQuery =  try dbHelper.querySQL(
                                    mDB: mDB, sql: query, values: [])
            if resQuery.count > 0 {
                var names: [String] = []
                var types: [String] = []
                for ipos in 0..<resQuery.count {
                    if let mName = resQuery[ipos]["name"] as? String {
                        names.append("\(mName)")
                    } else {
                        throw DatabaseHelperError.querySql(
                            message: "Error: getTableColumnNamesTypes" +
                                " no name")
                    }
                    if let mType = resQuery[ipos]["type"] as? String {
                        types.append("\(mType)")
                    } else {
                        throw DatabaseHelperError.querySql(
                            message: "Error: getTableColumnNamesTypes" +
                                " no type")
                    }
                }
                ret.names.append(contentsOf: names)
                ret.types.append(contentsOf: types)
            }
        } catch DatabaseHelperError.querySql(let message) {
            throw DatabaseHelperError.querySql(message: message)
        }
        return ret
    }

    // MARK: - ImportFromJson - CheckColumnTypes

    class func checkColumnTypes (
                dbHelper: DatabaseHelper, types: [String],
                values: [UncertainValue<String, Int, Float>]) -> Bool {
        var isRetType: Bool = true
        for ipos in 0..<values.count {
            if let val = values[ipos].value {
                if String(describing: val).uppercased() != "NULL" {
                    isRetType = UtilsJson.isType(
                        stype: types[ipos], avalue: values[ipos])
                    if !isRetType {break}
                }
            } else {
                isRetType = false
                break
            }
        }
        return isRetType
    }

    // MARK: - ImportFromJson - IsType

    class func isType(stype: String,
                      avalue: UncertainValue<String, Int, Float>)
                                                        -> Bool {
        var ret: Bool = false
        // swiftlint:disable force_unwrapping
        if stype == "NULL" && type(of: avalue.tValue!) == String.self {
            ret = true }
        if stype == "TEXT" && type(of: avalue.tValue!) == String.self {
            ret = true }
        if stype == "INTEGER" && type(of: avalue.uValue!) == Int.self {
            ret = true }
        if stype == "REAL" && type(of: avalue.vValue!) == Float.self {
            ret = true }
        if stype == "BLOB" && type(of: avalue.tValue!) == String.self {
            ret = true }

        // swiftlint:enable force_unwrapping
        return ret
    }

    // MARK: - ImportFromJson - IsIdExist

    class func isIdExist(dbHelper: DatabaseHelper, mDB: OpaquePointer,
                         tableName: String, firstColumnName: String,
                         key: Any) throws -> Bool {
        var ret: Bool = false
        var query: String = "SELECT \(firstColumnName) FROM "
        query.append("\(tableName) WHERE \(firstColumnName) = ")
        if type(of: key) == String.self {
            query.append("'\(key)';")
        } else {
            query.append("\(key);")
        }
        do {
            let resQuery =  try dbHelper.querySQL(
                                    mDB: mDB, sql: query, values: [])
            if resQuery.count == 1 {
                ret = true
            }
        } catch DatabaseHelperError.querySql(let message) {
            throw DatabaseHelperError.isIdExists(
                            message: "isIdExists: \(message)")
        }
        return ret
    }

    // MARK: - ImportFromJson - CreateQuestionMarkString

    class func createQuestionMarkString(length: Int) -> String {
        var retString: String = ""
        for _ in 0..<length {
            retString += "?,"
        }
        retString = String(retString.dropLast())
        return retString
    }

    // MARK: - ImportFromJson - GetValuesFromRow

    class func getValuesFromRow(
        rowValues: [ UncertainValue<String, Int, Float>]) -> [Any] {
        var retArray: [Any] = []
        // swiftlint:disable force_unwrapping
        for ipos in 0..<rowValues.count {
            retArray.append(rowValues[ipos].value!)
        }
        // swiftlint:enable force_unwrapping
        return retArray
    }

    // MARK: - ImportFromJson - SetNameForUpdate

    class func setNameForUpdate(names: [String]) -> String {
        var retString: String = ""
        for ipos in 0..<names.count {
            retString += "\(names[ipos]) = ? ,"
        }
        retString = String(retString.dropLast())
        return retString
    }

    // MARK: - ImportFromJson - checkRowValidity

    class func checkRowValidity(
        dbHelper: DatabaseHelper, jsonNamesTypes: JsonNamesTypes,
        row: [UncertainValue<String, Int, Float>], pos: Int,
        tableName: String) throws {
        if jsonNamesTypes.names.count != row.count {
            let message: String = """
            importFromJson: Table \(tableName) values row \(pos
            ) not correct length
            """
            throw DatabaseHelperError.checkRowValidity(message: message)
        }
        // Check the column's type before proceeding
        let retTypes: Bool = UtilsJson.checkColumnTypes(
                    dbHelper: dbHelper,
                    types: jsonNamesTypes.types, values: row)
        if !retTypes {
            var message: String = "importFromJson: Table \(tableName) "
            message.append("values row \(pos) not correct types")
            throw DatabaseHelperError.importFromJson(message: message)
        }
    }

    // MARK: - ExportToJson - validateSchema

    class func validateSchema(schema: [[String: String]])
                                    throws -> Bool {
        var isSchema = false
        do {
            let eSchema = try JSONEncoder().encode(schema)
            guard let eSchemaString: String = String(
                    data: eSchema, encoding: .utf8) else {
                var message: String = "Error in converting eSchema "
                message.append("to String")
                throw DatabaseHelperError.validateSchema(
                    message: message)
            }
            if eSchemaString.count > 0 {
                isSchema = true
            }
        } catch {
            throw DatabaseHelperError.validateSchema(
                message: "Error in encoding schema")
        }
        return isSchema
    }

    // MARK: - ExportToJson - validateIndexes

    class func validateIndexes(indexes: [[String: String]])
                                throws -> Bool {

        var isIndexes = false
        do {
            let eIndexes = try JSONEncoder().encode(indexes)
            guard let eIndexesString: String =
                    String(data: eIndexes, encoding: .utf8) else {
                var message: String = "Error in converting "
                message.append("eIndexes to String")
                throw DatabaseHelperError.validateIndexes(
                    message: message)
            }
            if eIndexesString.count > 0 {
                isIndexes = true
            }
        } catch {
            throw DatabaseHelperError.validateIndexes(
                message: "Error in encoding indexes")
        }
        return isIndexes
    }
}
