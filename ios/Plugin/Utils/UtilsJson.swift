//
//  UtilsJson.swift
//  CapacitorCommunitySqlite
//
//  Created by  Quéau Jean Pierre on 30/07/2020.
//

import Foundation

enum UtilsJsonError: Error {
    case tableNotExists(message: String)
    case viewNotExists(message: String)
    case getTableColumnNamesTypes(message: String)
    case isIdExists(message: String)
    case checkRowValidity(message: String)
    case validateSchema(message: String)
    case validateIndexes(message: String)
    case validateTriggers(message: String)
    case validateViews(message: String)
    case isLastModified(message: String)
    case isSqlDeleted(message: String)
    case checkUpdate(message: String)
    case checkValues(message: String)}

// swiftlint:disable file_length
// swiftlint:disable type_body_length
class UtilsJson {

    // MARK: - ImportFromJson - IsTableExists

    class func isTableExists(mDB: Database, tableName: String)
    throws -> Bool {
        var msg: String = "Error isTableExists: "
        if !mDB.isDBOpen() {
            msg.append("Database not opened")
            throw UtilsJsonError.tableNotExists(message: msg)
        }
        var ret: Bool = false
        var query = "SELECT name FROM sqlite_master WHERE type='table'"
        query.append(" AND name='")
        query.append(tableName)
        query.append("';")
        do {
            var resQuery: [Any] = try UtilsSQLCipher
                .querySQL(mDB: mDB, sql: query, values: [])
            if resQuery.count > 0 {
                resQuery.removeFirst()
                if resQuery.count == 1 {
                    ret = true
                }
            }
        } catch UtilsSQLCipherError.querySQL(let message) {
            throw UtilsJsonError.tableNotExists(message: message)
        }
        return ret
    }

    // MARK: - ImportFromJson - IsLastModified

    class func isLastModified(mDB: Database) throws -> Bool {
        var msg: String = "Error LastModified: "
        if !mDB.isDBOpen() {
            msg.append("Database not opened")
            throw UtilsJsonError.isLastModified(message: msg)
        }
        var ret: Bool = false
        do {
            let tableList: [String] = try UtilsDrop.getTablesNames(mDB: mDB)
            for table in tableList {
                let namesTypes: JsonNamesTypes = try getTableColumnNamesTypes(mDB: mDB,
                                                                              tableName: table)
                if namesTypes.names.contains("last_modified") {
                    ret = true
                    break
                }
            }
        } catch UtilsJsonError.getTableColumnNamesTypes(let message) {
            throw UtilsJsonError.isLastModified(message: message)
        } catch UtilsDropError.getTablesNamesFailed(let message) {
            throw UtilsJsonError.isLastModified(message: message)
        }
        return ret
    }

    // MARK: - ImportFromJson - IsSqlDeleted

    class func isSqlDeleted(mDB: Database) throws -> Bool {
        var msg: String = "Error SqlDeleted: "
        if !mDB.isDBOpen() {
            msg.append("Database not opened")
            throw UtilsJsonError.isSqlDeleted(message: msg)
        }
        var ret: Bool = false
        do {
            let tableList: [String] = try UtilsDrop.getTablesNames(mDB: mDB)
            for table in tableList {
                let namesTypes: JsonNamesTypes = try getTableColumnNamesTypes(mDB: mDB,
                                                                              tableName: table)
                if namesTypes.names.contains("sql_deleted") {
                    ret = true
                    break
                }
            }
        } catch UtilsJsonError.getTableColumnNamesTypes(let message) {
            throw UtilsJsonError.isSqlDeleted(message: message)
        } catch UtilsDropError.getTablesNamesFailed(let message) {
            throw UtilsJsonError.isSqlDeleted(message: message)
        }
        return ret
    }

    // MARK: - ImportFromJson - IsViewExists

    class func isViewExists(mDB: Database, viewName: String)
    throws -> Bool {
        var msg: String = "Error isViewExists: "
        if !mDB.isDBOpen() {
            msg.append("Database not opened")
            throw UtilsJsonError.viewNotExists(message: msg)
        }
        var ret: Bool = false
        var query = "SELECT name FROM sqlite_master WHERE type='view'"
        query.append(" AND name='")
        query.append(viewName)
        query.append("';")
        do {
            var resQuery: [Any] = try UtilsSQLCipher
                .querySQL(mDB: mDB, sql: query, values: [])
            if resQuery.count > 0 {
                resQuery.removeFirst()
                if resQuery.count == 1 {
                    ret = true
                }
            }
        } catch UtilsSQLCipherError.querySQL(let message) {
            throw UtilsJsonError.viewNotExists(message: message)
        }
        return ret
    }

    // MARK: - ImportFromJson - GetTableColumnNamesTypes

    class func getTableColumnNamesTypes(mDB: Database,
                                        tableName: String)
    throws -> JsonNamesTypes {
        var ret: JsonNamesTypes = JsonNamesTypes(names: [], types: [])
        var msg: String = "Error: getTableColumnNamesTypes "
        var query: String = "PRAGMA table_info('"
        query.append(tableName)
        query.append("');")
        do {
            var resQuery =  try mDB.selectSQL(sql: query, values: [])
            if resQuery.count > 0 {
                resQuery.removeFirst()
                var names: [String] = []
                var types: [String] = []
                for ipos in 0..<resQuery.count {
                    if let mName = resQuery[ipos]["name"] as? String {
                        names.append("\(mName)")
                    } else {
                        msg.append("no name")
                        throw UtilsJsonError.getTableColumnNamesTypes(
                            message: msg)
                    }
                    if let mType = resQuery[ipos]["type"] as? String {
                        types.append("\(mType)")
                    } else {
                        msg.append("no type")
                        throw UtilsJsonError.getTableColumnNamesTypes(
                            message: msg)
                    }
                }
                ret.names.append(contentsOf: names)
                ret.types.append(contentsOf: types)
            }
        } catch DatabaseError.selectSQL(let message) {
            msg.append("\(message)")
            throw UtilsJsonError.getTableColumnNamesTypes(message: msg)
        }
        return ret
    }

    // MARK: - ImportFromJson - CheckColumnTypes

    class func checkColumnTypes (
        mDB: Database, types: [String],
        values: [UncertainValue<String, Int, Double>]) -> Bool {
        var isRetType: Bool = true
        for ipos in 0..<values.count {
            isRetType = UtilsJson.isType(
                stype: types[ipos], avalue: values[ipos])
            if !isRetType {break}
        }
        return isRetType
    }

    // MARK: - ImportFromJson - IsType

    class func isType(stype: String,
                      avalue: UncertainValue<String, Int, Double>)
    -> Bool {
        var ret: Bool = false
        // swiftlint:disable force_unwrapping
        if stype == "NULL" /*&& type(of: avalue.value!) == String.self*/ {
            ret = true }
        if stype == "TEXT" && type(of: avalue.value!) == String.self {
            ret = true }
        if stype == "INTEGER" && type(of: avalue.value!) == Int.self {
            ret = true }
        if stype == "REAL" && (type(of: avalue.value!) == Double.self ||
                                type(of: avalue.value!) == Int.self) {
            ret = true }
        if stype == "BLOB" && type(of: avalue.value!) == String.self {
            ret = true }

        // swiftlint:enable force_unwrapping
        return ret
    }

    // MARK: - ImportFromJson - IsIdExist

    class func isIdExist(mDB: Database, tableName: String,
                         firstColumnName: String,
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
            var resQuery =  try mDB.selectSQL(sql: query, values: [])
            if resQuery.count > 1 {
                resQuery.removeFirst()
                if resQuery.count == 1 {
                    ret = true
                }
            }
        } catch DatabaseError.selectSQL(let message) {
            throw UtilsJsonError.isIdExists(
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
        rowValues: [ UncertainValue<String, Int, Double>]) -> [Any] {
        var retArray: [Any] = []
        for ipos in 0..<rowValues.count {
            let value = rowValues[ipos].value
            retArray.append(value ?? NSNull())
        }
        return retArray
    }

    // MARK: - ImportFromJson - CheckUpdate

    // swiftlint:disable function_parameter_count
    class func checkUpdate(mDB: Database, stmt: String, values: [Any],
                           tableName: String, names: [String],
                           types: [String]) throws -> Bool {
        var isRun: Bool = true
        if stmt.prefix(6) == "UPDATE" {
            var query: String = "SELECT * FROM \(tableName) WHERE \(names[0]) = "
            if type(of: values[0]) == String.self {
                query.append("'\(values[0])';")
            } else {
                query.append("\(values[0]);")
            }

            do {
                // create the table data
                let resValues: [[Any]] = try ExportToJson
                    .createValues(mDB: mDB, query: query, names: names,
                                  types: types)
                if resValues.count > 0 {
                    isRun = try checkValues(values: values, nValues: resValues[0])
                    return isRun
                } else {
                    let msg = "CheckUpdate statement returns nothing"
                    throw UtilsJsonError.checkUpdate(message: msg)
                }
            } catch ExportToJsonError.createValues(let message) {
                throw UtilsJsonError.checkUpdate(message: message)
            } catch UtilsJsonError.checkValues(let message) {
                throw UtilsJsonError.checkUpdate(message: message)
            }
        }
        return isRun
    }
    // swiftlint:enable function_parameter_count

    // MARK: - ImportFromJson - CheckValues

    class func checkValues(values: [Any], nValues: [Any]) throws -> Bool {
        if values.count > 0 && nValues.count > 0
            && values.count == nValues.count {
            let valuesWithIndex = values.enumerated()
            for (index, mValue) in valuesWithIndex {
                let rValue = nValues[index]
                if type(of: rValue) == Double.self {
                    if let dValue =  rValue as? Double {
                        if let dValues = mValue as? Double {
                            if !dValue.isEqual(to: dValues) {
                                return true
                            }
                        }
                    }
                } else if rValue as AnyObject !== values[index] as AnyObject {
                    return true
                }
            }
            return false
        } else {
            let msg = "CheckValues Both arrays not the same length"
            throw UtilsJsonError.checkValues(message: msg)
        }

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
        mDB: Database, jsonNamesTypes: JsonNamesTypes,
        row: [UncertainValue<String, Int, Double>], pos: Int,
        tableName: String) throws {
        if jsonNamesTypes.names.count != row.count {
            let message: String = """
            importFromJson: Table \(tableName) values row \(pos
            ) not correct length
            """
            throw UtilsJsonError.checkRowValidity(message: message)
        }
        // Check the column's type before proceeding
        let retTypes: Bool = UtilsJson
            .checkColumnTypes(mDB: mDB,
                              types: jsonNamesTypes.types, values: row)
        if !retTypes {
            var message: String = "importFromJson: Table \(tableName) "
            message.append("values row \(pos) not correct types")
            throw UtilsJsonError.checkRowValidity(message: message)
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
                throw UtilsJsonError.validateSchema(
                    message: message)
            }
            if eSchemaString.count > 0 {
                isSchema = true
            }
        } catch {
            throw UtilsJsonError.validateSchema(
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
                throw UtilsJsonError.validateIndexes(
                    message: message)
            }
            if eIndexesString.count > 0 {
                isIndexes = true
            }
        } catch {
            throw UtilsJsonError.validateIndexes(
                message: "Error in encoding indexes")
        }
        return isIndexes
    }

    // MARK: - ExportToJson - validateTriggers

    class func validateTriggers(triggers: [[String: String]])
    throws -> Bool {

        var isTriggers = false
        do {
            let eTriggers = try JSONEncoder().encode(triggers)
            guard let eTriggersString: String =
                    String(data: eTriggers, encoding: .utf8) else {
                var message: String = "Error in converting "
                message.append("eTriggers to String")
                throw UtilsJsonError.validateTriggers(
                    message: message)
            }
            if eTriggersString.count > 0 {
                isTriggers = true
            }
        } catch {
            throw UtilsJsonError.validateTriggers(
                message: "Error in encoding triggers")
        }
        return isTriggers
    }

    // MARK: - ExportToJson - validateIndexes

    class func validateViews(views: [[String: String]])
    throws -> Bool {

        var isViews = false
        do {
            let eViews = try JSONEncoder().encode(views)
            guard let eViewsString: String =
                    String(data: eViews, encoding: .utf8) else {
                var message: String = "Error in converting "
                message.append("eViews to String")
                throw UtilsJsonError.validateViews(
                    message: message)
            }
            if eViewsString.count > 0 {
                isViews = true
            }
        } catch {
            throw UtilsJsonError.validateViews(
                message: "Error in encoding views")
        }
        return isViews
    }

}
// swiftlint:enable type_body_length
// swiftlint:enable file_length
