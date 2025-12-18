//
//  UtilsDelete.swift
//  CapacitorCommunitySqlite
//
//  Created by  Quéau Jean Pierre on 30/07/2023.
//

import Foundation
enum UtilsDeleteError: Error {
    case findReferencesAndUpdate(message: String)
    case getReferences(message: String)
    case getRefs(message: String)
    case getUpdDelReturnedValues(message: String)
    case getFirstPK(message: String)
    case extractColumnNames(message: String)
    case executeUpdateForDelete(message: String)
    case extractForeignKeyInfo(message: String)
    case searchForRelatedItems(message: String)
    case upDateWhereForRestrict(message: String)
    case upDateWhereForCascade(message: String)
}

// swiftlint:disable file_length
// swiftlint:disable type_body_length
class UtilsDelete {

    // MARK: - findReferencesAndUpdate

    // swiftlint:disable function_body_length
    // swiftlint:disable cyclomatic_complexity
    class func findReferencesAndUpdate(mDB: Database, tableName: String,
                                       whereStmt: String,
                                       initColNames: [String],
                                       values: [Any]) throws -> Bool {
        do {
            let retBool: Bool = true
            let result = try getReferences(mDB: mDB,
                                           tableName: tableName)
            let references = result.retRefs
            let tableNameWithRefs = result.tableWithRefs
            if references.count <= 0 {
                return retBool
            }
            if tableName == tableNameWithRefs {
                return retBool
            }
            // Loop through references
            for ref in references {

                // Extract the FOREIGN KEY constraint info
                // from the ref statement
                let foreignKeyInfo = try UtilsSQLStatement
                    .extractForeignKeyInfo(from: ref)
                // get the tableName of the references
                guard let refTable = foreignKeyInfo["tableName"]
                        as? String else {
                    let msg = "findReferencesAndUpdate: no foreignKeyInfo " +
                        "tableName"
                    throw UtilsDeleteError
                    .findReferencesAndUpdate(message: msg)
                }
                if refTable.isEmpty || refTable != tableName {
                    continue
                }
                // get the with ref columnName
                guard let withRefsNames = foreignKeyInfo["forKeys"]
                        as? [String] else {

                    let msg = "findReferencesAndUpdate: no foreignKeyInfo " +
                        "forKeys"
                    throw UtilsDeleteError
                    .findReferencesAndUpdate(message: msg)
                }
                guard let colNames = foreignKeyInfo["refKeys"]
                        as? [String] else {
                    let msg = "findReferencesAndUpdate: no foreignKeyInfo " +
                        "refKeys"
                    throw UtilsDeleteError
                    .findReferencesAndUpdate(message: msg)
                }
                if colNames.count != withRefsNames.count {
                    let msg = "findReferencesAndUpdate: no foreignKeyInfo " +
                        "colNames"
                    throw UtilsDeleteError
                    .findReferencesAndUpdate(message: msg)

                }
                guard let action = foreignKeyInfo["action"]
                        as? String else {
                    let msg = "findReferencesAndUpdate: no action"
                    throw UtilsDeleteError
                    .findReferencesAndUpdate(message: msg)
                }
                if action == "NO_ACTION" {
                    continue
                }

                let updTableName: String = tableNameWithRefs
                let updColNames: [String] = withRefsNames
                var results: (setStmt: String, uWhereStmt: String)
                results.uWhereStmt = ""
                results.setStmt = ""
                if !checkValuesMatch(withRefsNames,
                                     against: initColNames) {
                    // Search for related items in tableName
                    let result: (String, [[String: Any]]) = try UtilsDelete
                        .searchForRelatedItems(mDB: mDB,
                                               updTableName: updTableName,
                                               tableName: tableName,
                                               whStmt: whereStmt,
                                               withRefsNames: withRefsNames,
                                               colNames: colNames,
                                               values: values)
                    let key: String = result.0
                    let relatedItems: [Any] = result.1
                    if relatedItems.count == 0 && key.count <= 0 {
                        continue
                    }

                    // case no match
                    if updTableName != tableName {
                        switch action {
                        case "CASCADE":
                            // updTableName
                            // update all related element
                            // set sql_deleted = 1 and last_modified
                            // tableName
                            // update all by sending return true
                            results = try upDateWhereForCascade(
                                results: result)

                        case "RESTRICT":
                            // find for elements related in updTableName
                            // if some elements
                            // send a message
                            // do not update tableName
                            // return false
                            // If no related elements in updTableName
                            // return true to update tableName
                            results = try upDateWhereForRestrict(
                                results: result)

                        default:
                            // updTableName
                            // update the result_id result_slug to Null
                            // update the last_modified
                            // keep sql_deleted to 0
                            // return true to update tableName
                            results = try upDateWhereForDefault(
                                withRefsNames: withRefsNames,
                                results: result)
                        }
                    }

                } else {
                    let msg = "Not implemented. Please transfer your " +
                        "example to the maintener"
                    throw UtilsDeleteError
                    .findReferencesAndUpdate(message: msg)
                }
                if results.setStmt.count > 0 &&
                    results.uWhereStmt.count > 0 {

                    try executeUpdateForDelete(
                        mDB: mDB,
                        tableName: updTableName,
                        whereStmt: results.uWhereStmt,
                        setStmt: results.setStmt,
                        colNames: updColNames,
                        values: values)
                }
            }
            return retBool
        } catch UtilsDeleteError.upDateWhereForRestrict(let message) {
            throw UtilsDeleteError
            .findReferencesAndUpdate(message: message)
        } catch UtilsSQLStatementError
                    .extractForeignKeyInfo(let message) {
            throw UtilsDeleteError
            .findReferencesAndUpdate(message: message)
        } catch UtilsDeleteError.executeUpdateForDelete(let message) {
            throw UtilsDeleteError
            .findReferencesAndUpdate(message: message)
        } catch UtilsSQLCipherError.prepareSQL(let message) {
            throw UtilsDeleteError
            .findReferencesAndUpdate(message: message)
        } catch UtilsSQLCipherError.querySQL(let message) {
            throw UtilsDeleteError
            .findReferencesAndUpdate(message: message)
        }
    }
    // swiftlint:enable cyclomatic_complexity
    // swiftlint:enable function_body_length

    // MARK: - upDateWhereForDefault

    class func upDateWhereForDefault(withRefsNames: [String],
                                     results: (String, [[String: Any]]))
    throws -> ((setStmt: String, uWhereStmt: String)) {

        var setStmt = ""
        var uWhereStmt = ""
        let key: String = results.0
        let relatedItems = results.1

        var cols: [Any] = []
        for relItem in relatedItems {
            if let mVal = relItem[key] {
                cols.append(mVal)
            }
        }
        // create the set statement
        for name in withRefsNames {
            setStmt += "\(name) = NULL, "
        }
        setStmt += "sql_deleted = 0"

        // create the where statement
        uWhereStmt = "WHERE \(key) IN ("
        for col in cols {
            uWhereStmt += "\(col),"
        }
        if uWhereStmt.hasSuffix(",") {
            uWhereStmt = String(uWhereStmt.dropLast())
        }

        uWhereStmt += ");"

        return(setStmt, uWhereStmt)
    }

    // MARK: - upDateWhereForRestrict

    class func upDateWhereForRestrict(results: (String, [[String: Any]]))
    throws -> ((setStmt: String, uWhereStmt: String)) {

        // Search for related items in tableName
        let setStmt = ""
        let uWhereStmt = ""
        let relatedItems = results.1

        if !relatedItems.isEmpty {
            let msg = "Restrict mode related items exist" +
                " please delete them first"
            throw UtilsDeleteError
            .upDateWhereForRestrict(message: msg)
        }
        return(setStmt, uWhereStmt)
    }

    // MARK: - upDateWhereForCascade

    class func upDateWhereForCascade(results: (String, [[String: Any]]))
    throws -> ((setStmt: String, uWhereStmt: String)) {

        // Search for related items in tableName
        var setStmt = ""
        var uWhereStmt = ""
        let key: String = results.0
        let relatedItems = results.1
        var cols: [Any] = []
        for relItem in relatedItems {
            if let mVal = relItem[key] {
                cols.append(mVal)
            }
        }
        setStmt += "sql_deleted = 1"
        // create the where statement
        uWhereStmt = "WHERE \(key) IN ("
        for col in cols {
            uWhereStmt += "\(col),"
        }
        if uWhereStmt.hasSuffix(",") {
            uWhereStmt = String(uWhereStmt.dropLast())
        }

        uWhereStmt += ");"
        return (setStmt, uWhereStmt)
    }

    // MARK: - searchForRelatedItems

    // swiftlint:disable function_parameter_count
    class func searchForRelatedItems(mDB: Database,
                                     updTableName: String,
                                     tableName: String, whStmt: String,
                                     withRefsNames: [String],
                                     colNames: [String], values: [Any])
    throws -> (String, [[String: Any]]) {
        var relatedItems: [[String: Any]] = []
        var key: String = ""
        let t1Names = withRefsNames.map({ "t1.\($0)" })
        let t2Names = colNames.map({ "t2.\($0)"})

        do {
            var whereClause = try UtilsSQLStatement
                .addPrefixToWhereClause(whStmt, from: colNames,
                                        destination: withRefsNames,
                                        prefix: "t2.")
            if whereClause.hasSuffix(";") {
                whereClause = String(whereClause.dropLast())
            }
            let resultString = zip(t1Names, t2Names)
                .map({ "\($0) = \($1)"})
                .joined(separator: " AND ")
            let sql = "SELECT t1.rowid FROM \(updTableName) t1 " +
                "JOIN \(tableName) t2 ON \(resultString) " +
                "WHERE \(whereClause) AND t1.sql_deleted = 0;"
            var vals = try UtilsSQLCipher.querySQL(mDB: mDB, sql: sql,
                                                   values: values)
            if vals.count > 1 {
                if let mVals = vals[0]["ios_columns"] as? [String] {
                    key = mVals[0]
                    let keyToRemove = "ios_columns"

                    // Remove dictionaries where the keys contain "ios_columns"
                    vals.removeAll { (dict: [String: Any]) in
                        return dict.keys.contains(keyToRemove)
                    }
                    // Append the remaining dictionaries to relatedItems
                    for val in vals {
                        relatedItems.append(val)
                    }
                }
            }
            return (key, relatedItems)
        } catch UtilsSQLStatementError.addPrefixToWhereClause(let message) {
            throw UtilsDeleteError
            .searchForRelatedItems(message: message)
        } catch UtilsSQLCipherError.querySQL(let message) {
            throw UtilsDeleteError
            .searchForRelatedItems(message: message)
        }
    }
    // swiftlint:enable function_parameter_count

    // MARK: - executeUpdateForDelete

    // swiftlint:disable function_parameter_count
    class func executeUpdateForDelete(mDB: Database, tableName: String,
                                      whereStmt: String, setStmt: String,
                                      colNames: [String], values: [Any])
    throws {
        var lastId: Int64 = -1
        // update sql_deleted for this references
        let stmt = "UPDATE \(tableName) SET \(setStmt) \(whereStmt)"
        var selValues: [Any] = []
        if !values.isEmpty {
            var arrVal: [String] =  whereStmt
                .components(separatedBy: "?")
            if arrVal[arrVal.count - 1] == ";" {
                arrVal.removeLast()
            }
            for (jdx, val) in arrVal.enumerated() {
                for updVal in colNames {
                    let indices: [Int] = val.indicesOf(string: updVal)
                    if indices.count > 0 {
                        selValues.append(values[jdx])
                    }
                }
            }
        }

        let resp = try UtilsSQLCipher.prepareSQL(mDB: mDB, sql: stmt,
                                                 values: selValues,
                                                 fromJson: false, returnMode: "no")
        lastId = resp.0
        if lastId == -1 {
            let msg = "UPDATE sql_deleted failed for " +
                "table: \(tableName) "
            throw UtilsDeleteError.executeUpdateForDelete(message: msg)
        }

    }

    // MARK: - getCurrentTimeAsInteger

    class func getCurrentTimeAsInteger() -> Int {
        let currentTime = Date().timeIntervalSince1970
        return Int(currentTime)
    }

    // MARK: - checkValuesMatch

    class func checkValuesMatch(_ array1: [String],
                                against array2: [String]) -> Bool {
        for value in array1 {
            if !array2.contains(value) {
                return false
            }
        }
        return true
    }

    // MARK: - getReferences

    class func getReferences(mDB: Database, tableName: String)
    throws -> (tableWithRefs: String, retRefs: [String]) {
        // find the REFERENCES
        var sqlStmt = "SELECT sql FROM sqlite_master "
        sqlStmt += "WHERE sql LIKE('%FOREIGN KEY%') AND "
        sqlStmt += "sql LIKE('%REFERENCES%') AND "
        sqlStmt += "sql LIKE('%\(tableName)%') AND "
        sqlStmt += "sql LIKE('%ON DELETE%');"
        do {
            var references: [[String: Any]] = try UtilsSQLCipher
                .querySQL(mDB: mDB, sql: sqlStmt, values: [])
            var retRefs = [String]()
            var tableWithRefs: String = ""
            if references.count > 1 {
                references.removeFirst()
                if let refValue = references[0]["sql"] as? String {
                    let result = try getRefs(sqlStatement: refValue)
                    retRefs = result.foreignKeys
                    tableWithRefs = result.tableName
                }
            }
            return (tableWithRefs, retRefs)
        } catch UtilsDeleteError.getRefs(let message) {
            throw UtilsDeleteError
            .getReferences(message: message)
        } catch UtilsSQLCipherError.querySQL(let message) {
            throw UtilsDeleteError
            .getReferences(message: message)
        }
    }

    // MARK: - getRefs

    class func getRefs(sqlStatement: String)
    throws -> (tableName: String, foreignKeys: [String]) {
        var tableName = ""
        var foreignKeys = [String]()
        let statement = UtilsSQLStatement
            .flattenMultilineString(sqlStatement)

        do {
            // Regular expression pattern to match the table name
            let tableNamePattern = #"CREATE\s+TABLE\s+(\w+)\s+\("#
            let tableNameRegex = try NSRegularExpression(
                pattern: tableNamePattern, options: [])
            if let tableNameMatch = tableNameRegex
                .firstMatch(in: statement, options: [],
                            range: NSRange(location: 0,
                                           length: statement.utf16.count)) {
                if let tableNameRange = Range(tableNameMatch.range(at: 1), in: statement) {
                    tableName = String(statement[tableNameRange])
                } else {
                    let msg = "getRefs: Error creating tableNameRange "
                    throw UtilsDeleteError.getRefs(message: msg)
                }
            } else {
                let msg = "getRefs: Error creating tableNameMatch "
                throw UtilsDeleteError.getRefs(message: msg)
            }

            // Regular expression pattern to match the FOREIGN KEY
            // constraints
            // swiftlint:disable line_length
            let foreignKeyPattern = #"FOREIGN\s+KEY\s+\([^)]+\)\s+REFERENCES\s+(\w+)\s*\([^)]+\)\s+ON\s+DELETE\s+(CASCADE|RESTRICT|SET\s+DEFAULT|SET\s+NULL|NO\s+ACTION)"#
            // swiftlint:enable line_length

            let foreignKeyRegex = try NSRegularExpression(
                pattern: foreignKeyPattern, options: [])
            let foreignKeyMatches = foreignKeyRegex
                .matches(in: statement, options: [],
                         range: NSRange(location: 0,
                                        length: statement.utf16.count))
            for foreignKeyMatch in foreignKeyMatches {
                if let foreignKeyRange = Range(
                    foreignKeyMatch.range(at: 0), in: statement) {
                    let foreignKey = String(statement[foreignKeyRange])
                    foreignKeys.append(foreignKey)
                } else {
                    let msg = "getRefs: Error creating foreignKeyRange "
                    throw UtilsDeleteError.getRefs(message: msg)
                }
            }
        } catch {
            let msg = "getRefs: Error creating regular expression: " +
                "\(error)"
            throw UtilsDeleteError.getRefs(message: msg)
        }
        return (tableName, foreignKeys)
    }

    // MARK: - getUpdDelReturnedValues

    class func getUpdDelReturnedValues(mDB: Database,
                                       sqlStmt: String,
                                       names: String )
    throws -> [[String: Any]] {
        var result: [[String: Any]] = []
        let tableName = UtilsSQLStatement
            .extractTableName(from: sqlStmt)
        let whereClause = UtilsSQLStatement
            .extractWhereClause(from: sqlStmt)
        if let tblName = tableName {
            if var wClause = whereClause {
                if wClause.suffix(1) == ";" {
                    wClause = String(wClause.dropLast())
                }
                do {
                    var query: String = "SELECT \(names) FROM " +
                        "\(tblName) WHERE "
                    query += "\(wClause);"
                    result = try UtilsSQLCipher
                        .querySQL(mDB: mDB, sql: query, values: [])
                } catch UtilsSQLCipherError.querySQL(let message) {
                    throw UtilsDeleteError
                    .getUpdDelReturnedValues(message: message)
                }
            }
        }
        return result
    }
}
// swiftlint:enable type_body_length
// swiftlint:enable file_length
