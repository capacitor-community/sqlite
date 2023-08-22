//
//  UtilsSQLStatement.swift
//  CapacitorCommunitySqlite
//
//  Created by  Quéau Jean Pierre on 30/07/2023.
//

import Foundation
enum UtilsSQLStatementError: Error {
    case extractColumnNames(message: String)
    case extractForeignKeyInfo(message: String)
    case addPrefixToWhereClause(message: String)
}

// swiftlint:disable file_length
// swiftlint:disable type_body_length
class UtilsSQLStatement {

    // MARK: - extractTableName

    class func extractTableName(from statement: String) -> String? {
        let pattern =
            "(?:INSERT\\s+INTO|UPDATE|DELETE\\s+FROM)\\s+([^\\s]+)"
        guard let regex = try? NSRegularExpression(pattern: pattern,
                                                   options: []) else {
            return nil }

        let range = NSRange(location: 0, length: statement.count)
        if let match = regex.firstMatch(in: statement, options: [],
                                        range: range) {
            let tableNameRange = match.range(at: 1)
            if let tableNameRange = Range(tableNameRange,
                                          in: statement) {
                let tableName = String(statement[tableNameRange])
                return tableName
            }
        }

        return nil
    }

    // MARK: - extractWhereClause

    class func extractWhereClause(from statement: String) -> String? {
        let pattern = "WHERE(.+?)(?:ORDER\\s+BY|LIMIT|$)"
        guard let regex = try? NSRegularExpression(
                pattern: pattern,
                options: [.caseInsensitive,
                          .dotMatchesLineSeparators]) else {
            return nil

        }

        let range = NSRange(location: 0, length: statement.count)
        if let match = regex.firstMatch(in: statement, options: [],
                                        range: range) {
            let whereClauseRange = match.range(at: 1)
            if let whereClauseRange = Range(whereClauseRange,
                                            in: statement) {
                let whereClause = String(statement[whereClauseRange])
                return whereClause
                    .trimmingCharacters(in: .whitespacesAndNewlines)
            }
        }

        return nil
    }

    // MARK: - addPrefixToWhereClause

    class func addPrefixToWhereClause(_ whereClause: String,
                                        from: [String],
                                        to: [String], prefix: String)
    throws -> String {
        var columnValuePairs: [String]
        if whereClause.contains("AND") {
            if #available(iOS 16.0, *) {
                let subSequenceArray = whereClause.split(separator: "AND")
                columnValuePairs = subSequenceArray.map { String($0) }
            } else {
                columnValuePairs = whereClause
                    .components(separatedBy: "AND")
            }
        } else {
            columnValuePairs = [whereClause]
        }
        let modifiedPairs = try columnValuePairs.map { pair -> String in
            let pattern = #"(\w+)\s*(=|IN|BETWEEN|LIKE)\s*(.+)"#

            if let range = pair.range(of: pattern, options: .regularExpression) {
                let match = String(pair[range])
                let regex = try NSRegularExpression(pattern: pattern)
                let matchRange = NSRange(match.startIndex..., in: match)

                if let matchResult = regex.firstMatch(in: match, range: matchRange) {
                    let columnRange = Range(matchResult.range(at: 1), in: match)!
                    let operatorRange = Range(matchResult.range(at: 2), in: match)!
                    let valueRange = Range(matchResult.range(at: 3), in: match)!

                    let column = String(match[columnRange]).trimmingCharacters(in: .whitespacesAndNewlines)
                    let mOperator = String(match[operatorRange]).trimmingCharacters(in: .whitespacesAndNewlines)
                    let value = String(match[valueRange]).trimmingCharacters(in: .whitespacesAndNewlines)

                    var newColumn = column
                    if let index = UtilsSQLStatement
                        .findIndexOfStringInArray(column, to), index != -1 {
                        guard let mNewColumn = UtilsSQLStatement
                                .getStringAtIndex(from, index) else {
                            let msg = "addPrefixToWhereClause: index " +
                                "mistmatch "
                            throw UtilsSQLStatementError
                            .addPrefixToWhereClause(message: msg)
                        }
                        newColumn = mNewColumn
                    }

                    let modifiedColumn = "\(prefix)\(newColumn)"
                    return "\(modifiedColumn) \(mOperator) \(value)"
                }
            }
            return pair
        }
        return modifiedPairs.joined(separator: " AND ")

    }

    // MARK: - findIndexOfStringInArray

    class func findIndexOfStringInArray(_ target: String, _ array: [String]) -> Int? {
        return array.firstIndex(of: target)
    }

    // MARK: - getStringAtIndex

    class func getStringAtIndex(_ array: [String], _ index: Int) -> String? {
        if index >= 0 && index < array.count {
            return array[index]
        } else {
            return nil
        }
    }
    // MARK: - extractForeignKeyInfo

    // swiftlint:enable type_body_length
    class func extractForeignKeyInfo(from sqlStatement: String)
    throws ->
    [String: Any] {
        var foreignKeyInfo: [String: Any] = [:]
        // Define the regular expression patterns for extracting the
        // FOREIGN KEY clause and composite primary keys
        let foreignKeyPattern = #"\bFOREIGN\s+KEY\s*\(([^)]+)\)\s+REFERENCES\s+(\w+)\s*\(([^)]+)\)\s+(ON\s+DELETE\s+(RESTRICT|CASCADE|SET\s+NULL|SET\s+DEFAULT|NO\s+ACTION))?"#

        // Create a regular expression object
        guard let regex = try? NSRegularExpression(
                pattern: foreignKeyPattern, options: []) else {
            let msg = "extractForeignKeyInfo: creating regular " +
                "expression pattern"
            throw UtilsSQLStatementError
            .extractForeignKeyInfo(message: msg)

        }

        // Find the range of the FOREIGN KEY clause in the SQL
        // statement
        let range = NSRange(location: 0,
                            length: sqlStatement.utf16.count)
        if let match = regex.firstMatch(in: sqlStatement, options: [],
                                        range: range) {
            // Extract the column names for the FOREIGN KEY
            let foreignKeyColumnsRange = match.range(at: 1)
            if let foreignKeyColumnsRangeInString =
                Range(foreignKeyColumnsRange, in: sqlStatement) {
                let foreignKeyColumns =
                    String(sqlStatement[foreignKeyColumnsRangeInString])
                    .components(separatedBy: ", ")

                // Extract the referenced table and columns
                let referencedTableRange = match.range(at: 2)
                let referencedColumnsRange = match.range(at: 3)
                if
                    let referencedTableRangeInString =
                        Range(referencedTableRange, in: sqlStatement),
                    let referencedColumnsRangeInString =
                        Range(referencedColumnsRange, in: sqlStatement)
                {
                    let referencedTable = String(
                        sqlStatement[referencedTableRangeInString])
                    let referencedColumns = String(
                        sqlStatement[referencedColumnsRangeInString])
                        .components(separatedBy: ", ")

                    // Extract the ON DELETE action if available
                    let onDeleteActionRange = match.range(at: 5)
                    if let onDeleteActionRangeInString =
                        Range(onDeleteActionRange, in: sqlStatement) {
                        let onDeleteAction = String(
                            sqlStatement[onDeleteActionRangeInString])
                        foreignKeyInfo["forKeys"] = foreignKeyColumns
                        foreignKeyInfo["tableName"] = referencedTable
                        foreignKeyInfo["refKeys"] = referencedColumns
                        foreignKeyInfo["action"] = onDeleteAction
                        return foreignKeyInfo
                    } else {
                        foreignKeyInfo["forKeys"] = foreignKeyColumns
                        foreignKeyInfo["tableName"] = referencedTable
                        foreignKeyInfo["refKeys"] = referencedColumns
                        foreignKeyInfo["action"] = "NO_ACTION"
                        return foreignKeyInfo
                    }
                } else {
                    let msg = "extractForeignKeyInfo: No match found"
                    throw UtilsSQLStatementError
                    .extractForeignKeyInfo(message: msg)
                }
            }
        } else {
            let msg = "extractForeignKeyInfo: No FOREIGN KEY found"
            throw UtilsSQLStatementError
            .extractForeignKeyInfo(message: msg)
        }
        foreignKeyInfo["forKeys"] = []
        foreignKeyInfo["tableName"] = ""
        foreignKeyInfo["refKeys"] = []
        foreignKeyInfo["action"] = "NO_ACTION"
        return foreignKeyInfo
    }
    // swiftlint:enable type_body_length

    // MARK: - extractColumnNames

    class func extractColumnNames(from whereClause: String) -> [String] {
        let keywords: Set<String> = ["AND", "OR", "IN", "VALUES", "LIKE", "BETWEEN", "NOT"]
        let tokens = whereClause.components(separatedBy: CharacterSet(charactersIn: " ,()"))

        var columns = [String]()
        var inClause = false
        var inValues = false

        for token in tokens {
            if token == "IN" {
                inClause = true
            } else if inClause && token == "(" {
                inValues = true
            } else if inValues && token == ")" {
                inValues = false
            } else if token.range(of: "\\b[a-zA-Z]\\w*\\b", options: .regularExpression) != nil
                        && !inValues && !keywords.contains(token.uppercased()) {
                columns.append(token)
            }
        }

        return Array(Set(columns))
    }

    // MARK: - flattenMultilineString

    class func flattenMultilineString(_ input: String) -> String {
        let lines = input
            .components(separatedBy: CharacterSet.newlines)
        return lines.joined(separator: " ")
    }

    // MARK: - getStmtAndRetColNames

    class func getStmtAndRetColNames(sqlStmt: String, retMode: String)
    -> [String: String] {
        let retWord = "RETURNING"

        var retStmtNames: [String: String] = [:]
        retStmtNames["stmt"] = sqlStmt
        retStmtNames["names"] = ""
        if let range = sqlStmt.uppercased().range(of: retWord) {
            let prefix = sqlStmt.prefix(upTo: range.lowerBound)
            retStmtNames["stmt"] = "\(prefix);"
            retStmtNames["names"] = ""
            if retMode.prefix(2) == "wA" {
                let suffix = sqlStmt.suffix(from: range.upperBound)
                let names =
                    "\(suffix)".trimmingLeadingAndTrailingSpaces()
                if names.suffix(1) == ";" {
                    retStmtNames["names"] = String(names.dropLast())
                }
            }

        }
        return retStmtNames
    }

    // MARK: - extractCombinedPrimaryKey

    class func extractCombinedPrimaryKey(from whereClause: String)
    -> [[String]]? {
        // Regular expression pattern to match the combined primary
        // key comparison with IN operator or without it
        // meaning = operator
        let pattern = #"WHERE\s*\((.+?)\)\s*(?:=|IN)\s*\((.+?)\)"#

        guard let regex = try? NSRegularExpression(pattern: pattern,
                                                   options: []) else {
            print("Invalid regular expression pattern.")
            return nil
        }
        let range = NSRange(location: 0,
                            length: whereClause.utf16.count)
        let matches = regex.matches(in: whereClause, options: [],
                                    range: range)
        var primaryKeySets: [[String]] = []

        for match in matches {

            let keysRange = Range(match.range(at: 1), in: whereClause)!
            let keysString = String(whereClause[keysRange])
            let keys = keysString.split(separator: ",").map {
                String($0.trimmingCharacters(in: .whitespaces)) }
            primaryKeySets.append(keys)
        }
        return primaryKeySets.isEmpty ? nil : primaryKeySets
    }

    // MARK: - getWhereStatementForCombinedPK

    class func getWhereStmtForCombinedPK(whStmt: String,
                                         withRefs: [String],
                                         colNames: [String],
                                         keys: [[String]])
    -> String {
        var retWhere: String = whStmt
        var repKeys: [String] = []
        for grpKeys in keys {
            if grpKeys == withRefs {
                repKeys = colNames
            } else {
                repKeys = withRefs
            }
            for (index, key) in grpKeys.enumerated() {
                retWhere = replaceAllString(originalStr: retWhere,
                                            searchStr: key,
                                            replaceStr: repKeys[index])
            }
        }
        return retWhere
    }

    // MARK: - replaceAllString

    class func replaceAllString(originalStr: String, searchStr: String,
                                replaceStr: String) -> String {
        let modifiedStr = originalStr
            .replacingOccurrences(of: searchStr, with: replaceStr)
        return modifiedStr
    }

    // MARK: - replaceString

    class func replaceString(originalStr: String, searchStr: String,
                             replaceStr: String) -> String {
        var modifiedStr = originalStr
        if let range = originalStr.range(of: searchStr) {
            modifiedStr.replaceSubrange(range, with: replaceStr)
        }
        return modifiedStr
    }

    // MARK: - getWhereStmtForNonCombinedPK

    class func getWhereStmtForNonCombinedPK(whStmt: String,
                                            withRefs: [String],
                                            colNames: [String])
    -> String {
        var whereStmt = ""
        var stmt: String = String(whStmt.stringRange(
                                    fromIdx: 6,
                                    toIdx: whStmt.count))
        for (idx, wRf) in withRefs.enumerated() {
            var colType: String = "withRefsNames"
            var idxs: [Int] = stmt.indicesOf(string: wRf)
            if idxs.count == 0 {
                idxs = stmt.indicesOf(string: colNames[idx])
                colType = "colNames"
            }
            if idxs.count > 0 {
                var valStr: String = ""
                let indicesEqual: [Int] = stmt
                    .indicesOf(string: "=",
                               fromIdx: idxs[0])

                if indicesEqual.count > 0 {
                    let indicesAnd: [Int] = stmt
                        .indicesOf(string: "AND",
                                   fromIdx: indicesEqual[0])
                    if indicesAnd.count > 0 {
                        valStr = String(stmt.stringRange(
                                            fromIdx: indicesEqual[0] + 1,
                                            toIdx: indicesAnd[0] - 1))
                        stmt = String(stmt.stringRange(
                                        fromIdx: indicesAnd[0] + 3,
                                        toIdx: stmt.count))
                    } else {
                        valStr = String(stmt.stringRange(
                                            fromIdx: indicesEqual[0] + 1,
                                            toIdx: stmt.count))
                    }
                    if idx > 0 {
                        whereStmt += " AND "
                    }
                    if colType == "withRefsNames" {
                        whereStmt += colNames[idx] + " = " + valStr
                    } else {
                        whereStmt += withRefs[idx] + " = " + valStr
                    }
                }
            }
        }
        whereStmt = "WHERE " + whereStmt
        return whereStmt
    }

    // MARK: - updateWhere

    class func updateWhere(whStmt: String, withRefs: [String],
                           colNames: [String]) -> String {
        var whereStmt = ""
        if whStmt.count <= 0 {
            return whereStmt
        }
        if whStmt.uppercased().prefix(5) != "WHERE" {
            return whereStmt
        }
        if withRefs.count == colNames.count {
            // get whereStmt for primary combined key
            if let keys: [[String]] = UtilsSQLStatement
                .extractCombinedPrimaryKey(from: whStmt) {
                whereStmt = UtilsSQLStatement
                    .getWhereStmtForCombinedPK(whStmt: whStmt,
                                               withRefs: withRefs,
                                               colNames: colNames,
                                               keys: keys)
            } else {
                // get for non primary combined key
                whereStmt = UtilsSQLStatement
                    .getWhereStmtForNonCombinedPK(whStmt: whStmt,
                                                  withRefs: withRefs,
                                                  colNames: colNames)
            }
        }
        return whereStmt
    }
}
// swiftlint:enable type_body_length
// swiftlint:enable file_length
