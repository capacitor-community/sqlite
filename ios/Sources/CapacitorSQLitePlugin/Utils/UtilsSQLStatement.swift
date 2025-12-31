//
//  UtilsSQLStatement.swift
//  CapacitorCommunitySqlite
//
//  Created by  Quéau Jean Pierre on 30/07/2023.
//

import Foundation
enum UtilsSQLStatementError: Error {
    case extractForeignKeyInfo(message: String)
    case addPrefixToWhereClause(message: String)
}

struct SQLStatementInfo {
    let isReturning: Bool
    let stmtString: String
    let resultString: String
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
                                      destination: [String], prefix: String)
    throws -> String {
        let columnValuePairs = getColumnValuePairs(from: from, destination: destination, whereClause: whereClause)

        let modifiedPairs = try columnValuePairs.map({ pair in
            return try modifyPair(pair,
                                  from: from,
                                  destination: destination,
                                  prefix: prefix)
        })

        return modifiedPairs.joined(separator: " AND ")
    }

    // MARK: - getColumnValuePairs

    class func getColumnValuePairs(from: [String],
                                   destination: [String],
                                   whereClause: String) -> [String] {
        if whereClause.contains("AND") {
            if #available(iOS 16.0, *) {
                return whereClause.split(separator: "AND").map({ String($0) })
            } else {
                return whereClause.components(separatedBy: "AND")
            }
        } else {
            return [whereClause]
        }
    }
    class func modifyPair(_ pair: String, from: [String],
                          destination: [String], prefix: String) throws -> String {

        let pattern = #"(\w+)\s*(=|IN|BETWEEN|LIKE)\s*(.+)"#

        guard let range = pair.range(of: pattern, options: .regularExpression) else {
            return pair
        }

        let match = String(pair[range])
        let regex = try NSRegularExpression(pattern: pattern)
        let matchRange = NSRange(match.startIndex..., in: match)

        guard let matchResult = regex.firstMatch(in: match, range: matchRange) else {
            let msg = "addPrefixToWhereClause: match result not found"
            throw UtilsSQLStatementError.addPrefixToWhereClause(message: msg)
        }

        guard let columnRange = Range(matchResult.range(at: 1), in: match) else {
            let msg = "addPrefixToWhereClause: columnRange failed"
            throw UtilsSQLStatementError.addPrefixToWhereClause(message: msg)
        }

        guard let operatorRange = Range(matchResult.range(at: 2), in: match) else {
            let msg = "addPrefixToWhereClause:  " +
                "operatorRange failed "
            throw UtilsSQLStatementError
            .addPrefixToWhereClause(message: msg)
        }
        guard let valueRange = Range(matchResult.range(at: 3), in: match) else {
            let msg = "addPrefixToWhereClause:  " +
                "valueRange failed "
            throw UtilsSQLStatementError
            .addPrefixToWhereClause(message: msg)
        }

        let column = String(match[columnRange]).trimmingCharacters(in: .whitespacesAndNewlines)
        let mOperator = String(match[operatorRange]).trimmingCharacters(in: .whitespacesAndNewlines)
        let value = String(match[valueRange]).trimmingCharacters(in: .whitespacesAndNewlines)

        var newColumn = column
        if let index = UtilsSQLStatement
            .findIndexOfStringInArray(column, destination), index != -1 {
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
    /*
     class func addPrefixToWhereClause(_ whereClause: String,
     from: [String],
     destination: [String], prefix: String)
     throws -> String {
     var columnValuePairs: [String]
     if whereClause.contains("AND") {
     if #available(iOS 16.0, *) {
     let subSequenceArray = whereClause.split(separator: "AND")
     columnValuePairs = subSequenceArray.map({ String($0) })
     } else {
     columnValuePairs = whereClause
     .components(separatedBy: "AND")
     }
     } else {
     columnValuePairs = [whereClause]
     }
     let modifiedPairs = try columnValuePairs.map({ pair -> String in
     let pattern = #"(\w+)\s*(=|IN|BETWEEN|LIKE)\s*(.+)"#

     if let range = pair.range(of: pattern, options: .regularExpression) {
     let match = String(pair[range])
     let regex = try NSRegularExpression(pattern: pattern)
     let matchRange = NSRange(match.startIndex..., in: match)

     if let matchResult = regex.firstMatch(in: match, range: matchRange) {

     guard let columnRange = Range(matchResult.range(at: 1), in: match) else {
     let msg = "addPrefixToWhereClause:  " +
     "columnRange failed "
     throw UtilsSQLStatementError
     .addPrefixToWhereClause(message: msg)
     }
     guard let operatorRange = Range(matchResult.range(at: 2), in: match) else {
     let msg = "addPrefixToWhereClause:  " +
     "operatorRange failed "
     throw UtilsSQLStatementError
     .addPrefixToWhereClause(message: msg)
     }
     guard let valueRange = Range(matchResult.range(at: 3), in: match) else {
     let msg = "addPrefixToWhereClause:  " +
     "valueRange failed "
     throw UtilsSQLStatementError
     .addPrefixToWhereClause(message: msg)
     }

     let column = String(match[columnRange]).trimmingCharacters(in: .whitespacesAndNewlines)
     let mOperator = String(match[operatorRange]).trimmingCharacters(in: .whitespacesAndNewlines)
     let value = String(match[valueRange]).trimmingCharacters(in: .whitespacesAndNewlines)

     var newColumn = column
     if let index = UtilsSQLStatement
     .findIndexOfStringInArray(column, destination), index != -1 {
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
     })
     return modifiedPairs.joined(separator: " AND ")

     }
     */
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

    // swiftlint:disable function_body_length
    class func extractForeignKeyInfo(from sqlStatement: String)
    throws ->
    [String: Any] {
        var foreignKeyInfo: [String: Any] = [:]
        // Define the regular expression patterns for extracting the
        // FOREIGN KEY clause and composite primary keys
        let foreignKeyPattern = #"""
            \bFOREIGN\s+KEY\s*\(([^)]+)\)\s+
            REFERENCES\s+(\w+)\s*\(([^)]+)\)\s+
            (ON\s+DELETE\s+(RESTRICT|CASCADE|SET\s+NULL|SET\s+DEFAULT|NO\s+ACTION))?
            """#
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
                        Range(referencedColumnsRange, in: sqlStatement) {
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
    // swiftlint:enable function_body_length

    // MARK: - extractColumnNames

    // swiftlint:disable function_body_length
    class func extractColumnNames(from whereClause: String) -> [String] {
        let keywords: Set<String> = ["AND", "OR", "IN", "VALUES", "LIKE", "BETWEEN", "NOT"]
        let operators: Set<String> = ["=", "<", "<=", ">=", ">", "<>"]

        var columns = [String]()
        var inClause = false
        var inValues = false
        var betweenClause = false
        var andClause = false
        var inPar = false
        var inOper = false
        var inLike = false
        func extractString(from input: String) -> String {
            // Check if the input string starts with "(" or ends with ")"
            if input.hasPrefix("(") {
                let startIndex = input.index(input.startIndex, offsetBy: 1)
                let result = input[startIndex..<input.endIndex]
                return String(result)
            } else if input.hasSuffix(")") {
                let endIndex = input.index(input.endIndex, offsetBy: -1)
                let result = input[input.startIndex..<endIndex]
                return String(result)
            } else {
                return input
            }
        }
        func removeOperatorsAndFollowing(from input: String) -> String {
            let operatorsPattern = "(=|<=|<|>|>=|<>)"
            if let range = input.range(of: operatorsPattern, options: .regularExpression) {
                let result = input.prefix(upTo: range.lowerBound)
                return String(result)
            } else {
                return input // Return the input string unchanged if no operator is found
            }
        }

        /*        func processToken(_ token: String) {
         if token.uppercased() == "IN" {
         inClause = true
         } else if inClause && (token.prefix(7).uppercased() == "(VALUES" ||
         token.prefix(8).uppercased() == "( VALUES") {
         inValues = true
         } else if inValues && (token.suffix(2).uppercased() == "))" ||
         token.suffix(3).uppercased() == ") )") {
         inValues = false
         } else if inClause && !inValues && token.prefix(1) == "(" {
         inPar = true
         } else if inClause && !inValues && token.suffix(1) == ")" {
         inPar = false
         inClause = false
         } else if token.uppercased() == "BETWEEN" {
         betweenClause = true
         } else if betweenClause && token.uppercased() == "AND" {
         andClause = true
         } else if operators.contains(token) {
         inOper = true
         } else if token.uppercased() == "LIKE" {
         inLike = true
         } else if token.range(of: "\\b[a-zA-Z]\\w*\\b", options: .regularExpression) != nil
         && !inClause && (!inValues || !inPar)
         && !betweenClause && !andClause && !inOper && !inLike
         && !keywords.contains(token.uppercased()) {
         var mToken = extractString(from: token)
         mToken = removeOperatorsAndFollowing(from: mToken)
         columns.append(mToken)
         } else if token.range(of: "\\b[a-zA-Z]\\w*\\b", options: .regularExpression) != nil
         && betweenClause && andClause {
         betweenClause = false
         andClause = false
         } else if token.range(of: "\\b[a-zA-Z]\\w*\\b", options: .regularExpression) != nil
         && inOper {
         inOper = false
         } else if token.range(of: "\\b[a-zA-Z]\\w*\\b", options: .regularExpression) != nil
         && inLike {
         inLike = false
         }
         }
         */
        // swiftlint:disable cyclomatic_complexity
        func processToken(_ token: String) {
            if token.uppercased() == "IN" {
                processIn(token)
            } else if inClause && (token.prefix(7).uppercased() == "(VALUES" ||
                                    token.prefix(8).uppercased() == "( VALUES") {
                processInValues(token)
            } else if inValues && (token.suffix(2).uppercased() == "))" ||
                                    token.suffix(3).uppercased() == ") )") {
                processEndInValues(token)
            } else if inClause && !inValues && token.prefix(1) == "(" {
                inPar = true
            } else if inClause && !inValues && token.suffix(1) == ")" {
                processEndInClause()
            } else if token.uppercased() == "BETWEEN" {
                betweenClause = true
            } else if betweenClause && token.uppercased() == "AND" {
                andClause = true
            } else if operators.contains(token) {
                inOper = true
            } else if token.uppercased() == "LIKE" {
                inLike = true
            } else if shouldProcessColumn(token) {
                processColumn(token)
            } else if betweenClause && andClause {
                processEndBetweenAnd()
            } else if inOper {
                processEndInOper()
            } else if inLike {
                processEndInLike()
            }
        }
        // swiftlint:enable cyclomatic_complexity

        func processIn(_ token: String) {
            inClause = true
        }

        func processInValues(_ token: String) {
            inValues = true
        }

        func processEndInValues(_ token: String) {
            inValues = false
        }

        func processEndInClause() {
            inPar = false
            inClause = false
        }

        func shouldProcessColumn(_ token: String) -> Bool {
            token.range(of: "\\b[a-zA-Z]\\w*\\b", options: .regularExpression) != nil
                && !inClause && (!inValues || !inPar)
                && !betweenClause && !andClause && !inOper && !inLike
                && !keywords.contains(token.uppercased())
        }

        func processColumn(_ token: String) {
            var mToken = extractString(from: token)
            mToken = removeOperatorsAndFollowing(from: mToken)
            columns.append(mToken)
        }
        func processEndBetweenAnd() {
            betweenClause = false
            andClause = false
        }

        func processEndInOper() {
            inOper = false
        }

        func processEndInLike() {
            inLike = false
        }
        let tokens = whereClause.components(separatedBy: CharacterSet(charactersIn: " ,"))
        for token in tokens {
            processToken(token)
        }
        return Array(columns)
    }
    // swiftlint:enable function_body_length

    // MARK: - flattenMultilineString

    class func flattenMultilineString(_ input: String) -> String {
        let lines = input
            .components(separatedBy: CharacterSet.newlines)
        return lines.joined(separator: " ")
    }

    // MARK: - isReturning

    class func isReturning(sqlStmt: String) -> SQLStatementInfo {
        let stmtType = getStatementType(sqlStmt)
        let stmt = cleanStatement(sqlStmt)
        switch stmtType {
        case "INSERT":
            return processInsertStatement(sqlStmt, stmt: stmt)
        case "DELETE", "UPDATE":
            return processDeleteOrUpdateStatement(sqlStmt, stmt: stmt)
        default:
            return SQLStatementInfo(isReturning: false, stmtString: sqlStmt, resultString: "")
        }
    }
    class func getStatementType(_ sqlStmt: String) -> String {
        let trimmedStmt = sqlStmt.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmedStmt.components(separatedBy: " ").first?.uppercased() ?? ""
    }

    class func cleanStatement(_ sqlStmt: String) -> String {
        var cleanedStmt = sqlStmt.trimmingCharacters(in: .whitespacesAndNewlines)
        if cleanedStmt.hasSuffix(";") {
            cleanedStmt = String(cleanedStmt.dropLast())
                .trimmingCharacters(in: .whitespacesAndNewlines)
        }
        return cleanedStmt
    }
    class func processInsertStatement(_ sqlStmt: String, stmt: String) -> SQLStatementInfo {
        if let valuesIndex = stmt.range(of: "VALUES", options: .caseInsensitive)?.lowerBound,
           let closingParenthesisIndex = stmt
            .range(of: ")", options: .backwards, range: valuesIndex..<stmt.endIndex)?
            .upperBound {
            var mStmt = stmt
            guard closingParenthesisIndex < mStmt.endIndex else {
                mStmt += ";"
                return SQLStatementInfo(isReturning: false, stmtString: mStmt, resultString: "")
            }

            let intParenthesisValue = mStmt.distance(from: mStmt.startIndex, to: closingParenthesisIndex)
            let substringAfterValues = stmt[closingParenthesisIndex...]
            var resultString = String(substringAfterValues)
                .trimmingCharacters(in: .whitespacesAndNewlines)
            if resultString.count > 0 && !resultString.hasSuffix(";") {
                resultString += ";"
            }

            let substringStartToEndParenthesis = mStmt[...closingParenthesisIndex]
            let stmtString = String(substringStartToEndParenthesis)
                .trimmingCharacters(in: .whitespacesAndNewlines)
                .appending(";")

            if substringAfterValues.lowercased().contains("returning") {
                return SQLStatementInfo(isReturning: true, stmtString: stmtString, resultString: resultString)
            } else {
                return SQLStatementInfo(isReturning: false, stmtString: sqlStmt, resultString: "")
            }
        }
        return SQLStatementInfo(isReturning: false, stmtString: sqlStmt, resultString: "")
    }

    class func processDeleteOrUpdateStatement(_ sqlStmt: String, stmt: String) -> SQLStatementInfo {
        let words = stmt.components(separatedBy: .whitespacesAndNewlines)
        var wordsBeforeReturning: [String] = []
        var returningString: [String] = []

        var isReturningOutsideMessage = false
        for word in words {
            if word.lowercased() == "returning" {
                isReturningOutsideMessage = true
                // Include "RETURNING" and the words after it in returningString
                returningString.append(contentsOf: [word] + UtilsSQLStatement.wordsAfter(word, in: words))
                break
            }
            wordsBeforeReturning.append(word)
        }

        if isReturningOutsideMessage {
            let joinedWords = wordsBeforeReturning.joined(separator: " ") + ";"
            var joinedReturningString = returningString.joined(separator: " ")
            if joinedReturningString.count > 0 &&
                !joinedReturningString.hasSuffix(";") {
                joinedReturningString += ";"
            }
            return SQLStatementInfo(isReturning: true, stmtString: joinedWords, resultString: joinedReturningString)
        } else {
            return SQLStatementInfo(isReturning: false, stmtString: sqlStmt, resultString: "")
        }
    }

    // MARK: - wordsAfter

    class func wordsAfter(_ word: String, in words: [String]) -> [String] {
        guard let index = words.firstIndex(of: word) else {
            return []
        }
        return Array(words.suffix(from: index + 1))
    }

    // MARK: - getStmtAndRetColNames

    class func getStmtAndRetColNames(sqlStmt: String, retMode: String)
    -> [String: String] {
        var retStmtNames: [String: String] = [:]

        let statementInfo = isReturning(sqlStmt: sqlStmt)
        retStmtNames["stmt"] = statementInfo.stmtString
        retStmtNames["names"] = ""
        if statementInfo.isReturning && retMode.prefix(2) == "wA" {
            let lowercaseSuffix = statementInfo.resultString.lowercased()
            if let returningIndex = lowercaseSuffix.range(of: "returning") {
                let substring = statementInfo.resultString[returningIndex.upperBound...]

                let names =
                    "\(substring)".trimmingLeadingAndTrailingSpaces()
                retStmtNames["names"] = getNames(from: names)
            }
        }
        return retStmtNames
    }

    // MARK: - getNames

    class func getNames(from input: String) -> String {
        // Find the index of the first occurrence of ";", "--", or "/*"
        let indexSemicolon = input.firstIndex(of: ";")
        let indexDoubleDash = input.range(of: "--")
        let indexCommentStart = input.range(of: "/*")

        // Find the minimum index among them
        var minIndex = input.endIndex
        if let index = indexSemicolon {
            minIndex = min(minIndex, index)
        }
        if let index = indexDoubleDash?.lowerBound {
            minIndex = min(minIndex, index)
        }
        if let index = indexCommentStart?.lowerBound {
            minIndex = min(minIndex, index)
        }

        // Extract substring up to the minimum index
        let colnames = String(input[..<minIndex]).trimmingCharacters(in: .whitespacesAndNewlines)
        return colnames
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

            if let keysRange = Range(match.range(at: 1), in: whereClause) {
                let keysString = String(whereClause[keysRange])
                let keys = keysString.split(separator: ",").map({
                                                                    String($0.trimmingCharacters(in: .whitespaces)) })
                primaryKeySets.append(keys)
            }
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
