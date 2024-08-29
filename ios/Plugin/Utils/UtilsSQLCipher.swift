//
//  UtilsSQLCipher.swift
//  Plugin
//
//  Created by  Quéau Jean Pierre on 18/01/2021.
//  Copyright © 2021 Max Lynch. All rights reserved.
//

import Foundation
import SQLCipher

enum UtilsSQLCipherError: Error {
    case openOrCreateDatabase(message: String)
    case bindFailed
    case setForeignKeyConstraintsEnabled(message: String)
    case getForeignKeysStateFailed(message: String)
    case getVersion(message: String)
    case setVersion(message: String)
    case closeDB(message: String)
    case close(message: String)
    case changePassword(message: String)
    case rollbackTransaction(message: String)
    case beginTransaction(message: String)
    case commitTransaction(message: String)
    case execute(message: String)
    case prepareSQL(message: String)
    case deleteSQL(message: String)
    case querySQL(message: String)
    case fetchColumnInfo(message: String)
    case deleteDB(message: String)
    case executeSet(message: String)
    case restoreDB(message: String)
    case deleteBackupDB(message: String)
    case openDBNoPassword(message: String)
    case openDBStoredPassword(message: String)
    case openDBGlobalPassword(message: String)
    case returningWorkAround(message: String)
}
enum State: String {
    case DOESNOTEXIST, UNENCRYPTED, ENCRYPTEDSECRET,
         ENCRYPTEDGLOBALSECRET, UNKNOWN, ERROR

}

// swiftlint:disable file_length
// swiftlint:disable type_body_length
class UtilsSQLCipher {

    // MARK: - getDatabaseState

    class func getDatabaseState(databaseLocation: String,
                                databaseName: String,
                                account: String) -> State {
        do {
            let path: String  = try UtilsFile
                .getFilePath(databaseLocation: databaseLocation,
                             fileName: databaseName)
            if UtilsFile.isFileExist(filePath: path) {
                do {
                    try openDBNoPassword(dBPath: path)
                    return State.UNENCRYPTED
                } catch UtilsSQLCipherError
                            .openDBNoPassword(let message) {
                    if message == "Open" {
                        do {
                            try openDBStoredPassword(dBPath: path,
                                                     account: account)
                            return State.ENCRYPTEDSECRET
                        } catch UtilsSQLCipherError
                                    .openDBStoredPassword(let message) {
                            if message == "Open" {
                                do {
                                    try openDBGlobalPassword(
                                        dBPath: path)
                                    return State.ENCRYPTEDGLOBALSECRET
                                } catch UtilsSQLCipherError
                                            .openDBGlobalPassword(let message) {
                                    if message == "Open" {
                                        return State.UNKNOWN
                                    } else {
                                        return State.ERROR
                                    }
                                }

                            } else {
                                return State.ERROR
                            }
                        }
                    } else {
                        return State.ERROR
                    }
                }
            } else {
                return State.DOESNOTEXIST
            }
        } catch {
            return State.UNKNOWN
        }
    }

    // MARK: - openDBNoPassword

    class func openDBNoPassword(dBPath: String) throws {
        do {
            let oDb: OpaquePointer? = try openOrCreateDatabase(
                filename: dBPath, password: "", readonly: true)

            try close(oDB: oDb)
            return
        } catch UtilsSQLCipherError.openOrCreateDatabase(_) {
            throw UtilsSQLCipherError.openDBNoPassword(message: "Open")
        } catch UtilsSQLCipherError.close(_) {
            throw UtilsSQLCipherError
            .openDBNoPassword(message: "Close")
        }

    }

    // MARK: - openDBStoredPassword

    class func openDBStoredPassword(dBPath: String, account: String)
    throws {
        do {
            let password: String = UtilsSecret
                .getPassphrase(account: account)
            let oDb: OpaquePointer? = try openOrCreateDatabase(
                filename: dBPath, password: password, readonly: true)
            try close(oDB: oDb)
            return
        } catch UtilsSQLCipherError.openOrCreateDatabase(_) {
            throw UtilsSQLCipherError
            .openDBStoredPassword(message: "Open")
        } catch UtilsSQLCipherError.close(_) {
            throw UtilsSQLCipherError
            .openDBStoredPassword(message: "Close")
        }

    }

    // MARK: - openDBGlobalPassword

    class func openDBGlobalPassword(dBPath: String) throws {
        do {
            let globalData: GlobalSQLite = GlobalSQLite()
            let password: String = globalData.secret
            let oDb: OpaquePointer? = try openOrCreateDatabase(
                filename: dBPath, password: password, readonly: true)
            try close(oDB: oDb)
            return
        } catch UtilsSQLCipherError.openOrCreateDatabase(_) {
            throw UtilsSQLCipherError
            .openDBGlobalPassword(message: "Open")
        } catch UtilsSQLCipherError.close(_) {
            throw UtilsSQLCipherError
            .openDBGlobalPassword(message: "Close")
        }

    }

    // MARK: - OpenOrCreateDatabase

    class func openOrCreateDatabase(filename: String,
                                    password: String = "",
                                    readonly: Bool = false
    ) throws -> OpaquePointer? {

        let flags = readonly ? SQLITE_OPEN_READONLY :
            SQLITE_OPEN_CREATE | SQLITE_OPEN_READWRITE
        var mDB: OpaquePointer?
        if sqlite3_open_v2(filename, &mDB, flags |
                            SQLITE_OPEN_FULLMUTEX, nil) == SQLITE_OK {

            if password.count > 0 {
                let keyStatementString = """
                PRAGMA key = '\(password)';
                """
                if sqlite3_exec(mDB, keyStatementString, nil, nil, nil)
                    != SQLITE_OK {
                    let msg: String = "Wrong Secret"
                    throw UtilsSQLCipherError
                    .openOrCreateDatabase(message: msg)
                }
            }
            let retB: Bool = checkDB(mDB: mDB)
            if !retB {
                let msg: String = "Cannot open the DB"
                throw UtilsSQLCipherError
                .openOrCreateDatabase(message: msg)
            }
            return mDB
        } else {
            let message: String = "open_v2 failed"
            throw UtilsSQLCipherError
            .openOrCreateDatabase(message: message)
        }
    }

    // MARK: - CheckDB

    class func checkDB(mDB: OpaquePointer?) -> Bool {
        var ret: Bool = false
        var stmt: String = "SELECT count(*) FROM "
        stmt.append("sqlite_master;")
        if sqlite3_exec(mDB, stmt, nil, nil, nil) == SQLITE_OK {
            ret = true
        }
        return ret
    }

    // MARK: - ChangePassword

    class func changePassword(filename: String, password: String,
                              newpassword: String) throws {
        do {
            // open the db with password
            let oDB: OpaquePointer? = try
                openOrCreateDatabase(filename: filename,
                                     password: password,
                                     readonly: false)
            // change password
            let keyStatementString = """
            PRAGMA rekey = '\(newpassword)';
            """
            let returnCode: Int32 = sqlite3_exec(
                oDB, keyStatementString, nil, nil, nil)
            if returnCode != SQLITE_OK {
                throw UtilsSQLCipherError
                .changePassword(message: "change password")
            }
            // close the db
            try UtilsSQLCipher.close(oDB: oDB)

        } catch UtilsSQLCipherError.openOrCreateDatabase(let message) {
            throw UtilsSQLCipherError
            .changePassword(message: message)
        } catch UtilsSQLCipherError.close(_) {
            throw UtilsSQLCipherError
            .changePassword(message: "close failed")
        }
    }

    // MARK: - SetForeignKeyConstraintsEnabled

    class func setForeignKeyConstraintsEnabled(mDB: Database,
                                               toggle: Bool) throws {
        var msg: String = "Error Set Foreign Key: "
        if !mDB.isDBOpen() {
            msg.append("Database not opened")
            throw UtilsSQLCipherError
            .setForeignKeyConstraintsEnabled(message: msg)
        }
        var key: String = "OFF"
        if toggle {
            key = "ON"
        }
        let sqltr: String = "PRAGMA foreign_keys = \(key);"
        if sqlite3_exec(mDB.mDb, sqltr, nil, nil, nil) != SQLITE_OK {
            msg.append("not successful")
            throw UtilsSQLCipherError
            .setForeignKeyConstraintsEnabled(message: msg)
        }

    }

    // MARK: - GetForeignKeysState

    class func getForeignKeysState(mDB: Database) throws -> Int {
        var msg: String = "Error ForeignKeysState: "
        if !mDB.isDBOpen() {
            msg.append("Database not opened")
            throw UtilsSQLCipherError
            .getForeignKeysStateFailed(message: msg)
        }
        var fkState: Int = 0

        let sqltr: String = "PRAGMA foreign_keys;"
        do {
            var resForKeys =  try UtilsSQLCipher.querySQL(mDB: mDB,
                                                          sql: sqltr,
                                                          values: [])
            if resForKeys.count > 1 {
                resForKeys.removeFirst()
                guard let res: Int64 = resForKeys[0]["foreign_keys"]
                        as? Int64 else {
                    throw UtilsSQLCipherError
                    .getForeignKeysStateFailed(
                        message: "Error get foreign keys failed")
                }
                if res > 0 {
                    fkState =  Int(truncatingIfNeeded: res)

                }
            }
            return fkState
        } catch UtilsSQLCipherError.querySQL(let message) {
            throw UtilsSQLCipherError.getForeignKeysStateFailed(
                message: message)
        }
    }

    // MARK: - GetVersion

    class func getVersion(mDB: Database) throws -> Int {
        var msg: String = "Error Get Version: "
        if !mDB.isDBOpen() {
            msg.append("Database not opened")
            throw UtilsSQLCipherError.getVersion(message: msg)
        }
        var version: Int = 0

        let sqltr: String = "PRAGMA user_version;"
        do {
            var resVersion =  try UtilsSQLCipher.querySQL(mDB: mDB,
                                                          sql: sqltr,
                                                          values: [])
            if resVersion.count > 1 {
                resVersion.removeFirst()
                guard let res: Int64 = resVersion[0]["user_version"]
                        as? Int64 else {
                    throw UtilsSQLCipherError.getVersion(
                        message: "Error get version failed")
                }
                if res > 0 {
                    version =  Int(truncatingIfNeeded: res)

                }
            }
            return version
        } catch UtilsSQLCipherError.querySQL(let message) {
            throw UtilsSQLCipherError.getVersion(
                message: message)
        }
    }

    // MARK: - SetVersion

    class func setVersion(mDB: Database, version: Int) throws {
        var msg: String = "Error Set Version: "
        if !mDB.isDBOpen() {
            msg.append("Database not opened")
            throw UtilsSQLCipherError.setVersion(message: msg)
        }
        let sqltr: String = "PRAGMA user_version = \(version);"
        if sqlite3_exec(mDB.mDb, sqltr, nil, nil, nil) != SQLITE_OK {
            throw UtilsSQLCipherError.setVersion(message: msg)
        }
    }

    // MARK: - CloseDB

    class func closeDB(mDB: Database) throws {
        var msg: String = "Error closeDB: "
        if !mDB.isDBOpen() {
            msg.append("Database not opened")
            throw UtilsSQLCipherError.closeDB(message: msg)
        }
        do {
            try UtilsSQLCipher.close(oDB: mDB.mDb)
        } catch UtilsSQLCipherError.close(let message) {
            throw UtilsSQLCipherError.closeDB(message: message)
        }
    }

    // MARK: - Close

    class func close(oDB: OpaquePointer?) throws {
        var message: String = ""
        let returnCode: Int32 = sqlite3_close_v2(oDB)
        if returnCode != SQLITE_OK {
            let errmsg: String = String(
                cString: sqlite3_errmsg(oDB))
            message = "Error: closing the database rc: " +
                "\(returnCode) message: \(errmsg)"
            throw UtilsSQLCipherError.close(message: message)
        }
    }

    // MARK: - BeginTransaction

    class func beginTransaction(mDB: Database) throws {
        var msg: String = "Error beginTransaction: "
        if !mDB.isDBOpen() {
            msg.append("Database not opened")
            throw UtilsSQLCipherError.beginTransaction(message: msg)
        }
        let sql: String = "BEGIN TRANSACTION;"
        let returnCode = sqlite3_exec(mDB.mDb, sql, nil, nil, nil)
        if returnCode != SQLITE_OK {
            let errmsg: String = String(
                cString: sqlite3_errmsg(mDB.mDb))
            msg.append("failed rc: ")
            msg.append("\(returnCode) message: \(errmsg)")
            throw UtilsSQLCipherError.beginTransaction(
                message: msg)
        }
    }

    // MARK: - RollBackTransaction

    class func rollbackTransaction(mDB: Database) throws {
        var msg: String = "Error rollbackTransaction: "
        if !mDB.isDBOpen() {
            msg.append("Database not opened")
            throw UtilsSQLCipherError.rollbackTransaction(message: msg)
        }
        let sql: String = "ROLLBACK TRANSACTION;"
        let returnCode = sqlite3_exec(mDB.mDb, sql, nil, nil, nil)
        if returnCode != SQLITE_OK {
            let errmsg: String = String(
                cString: sqlite3_errmsg(mDB.mDb))
            msg.append("failed rc: ")
            msg.append("\(returnCode) message: \(errmsg)")
            throw UtilsSQLCipherError.rollbackTransaction(
                message: msg)
        }
    }

    // MARK: - CommitTransaction

    class func commitTransaction(mDB: Database) throws {
        var msg: String = "Error commitTransaction: "
        if !mDB.isDBOpen() {
            msg.append("Database not opened")
            throw UtilsSQLCipherError.commitTransaction(message: msg)
        }
        let sql: String = "COMMIT TRANSACTION;"
        let returnCode = sqlite3_exec(mDB.mDb, sql, nil, nil, nil)
        if returnCode != SQLITE_OK {
            let errmsg: String = String(
                cString: sqlite3_errmsg(mDB.mDb))
            msg.append("failed rc: ")
            msg.append("\(returnCode) message: \(errmsg)")
            throw UtilsSQLCipherError.commitTransaction(
                message: msg)
        }
    }

    // MARK: - PrepareSQL

    // swiftlint:disable function_body_length
    // swiftlint:disable cyclomatic_complexity
    class func prepareSQL(mDB: Database, sql: String, values: [Any],
                          fromJson: Bool, returnMode: String)
    throws -> (Int64, [[String: Any]]) {
        var msg: String = "Error prepareSQL: "
        if !mDB.isDBOpen() {
            msg.append("Database not opened")
            throw UtilsSQLCipherError.prepareSQL(message: msg)
        }
        //        let systemVersion = UIDevice.current.systemVersion
        var runSQLStatement: OpaquePointer?
        var message: String = ""
        var lastId: Int64 = -1
        var sqlStmt = sql
        var names: String = ""
        var result: [[String: Any]] = []
        var retMode: String
        let stmtType = sqlStmt
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .components(separatedBy: " ")
            .first?.capitalized ?? ""

        if #available(iOS 15, *) {
            retMode = returnMode
        } else {
            retMode = returnMode
            if retMode != "no" {
                retMode = "wA\(retMode)"
            }
        }
        if retMode == "no" || retMode.prefix(2) == "wA" {
            let stmtNames = UtilsSQLStatement
                .getStmtAndRetColNames(sqlStmt: sqlStmt,
                                       retMode: retMode)
            sqlStmt = stmtNames["stmt"] ?? sqlStmt
            names = stmtNames["names"] ?? ""
        }
        // Check for DELETE statement
        if !fromJson && stmtType == "DELETE" {
            do {
                sqlStmt = try deleteSQL(mDB: mDB, sql: sqlStmt,
                                        values: values)
            } catch UtilsSQLCipherError.deleteSQL(let message) {
                let msg = "Error: prepareSQL \(message)"
                throw UtilsSQLCipherError.prepareSQL(message: msg)
            }
        }
        var returnCode: Int32 = sqlite3_prepare_v2(
            mDB.mDb, sqlStmt, -1, &runSQLStatement, nil)
        if returnCode == SQLITE_OK {
            if !values.isEmpty {
                //                retMode = "no"
                // do the binding of values
                var idx: Int = 1
                for value in values {
                    do {
                        try UtilsBinding.bind(handle: runSQLStatement,
                                              value: value, idx: idx)
                        idx += 1
                    } catch let error as NSError {
                        message = "Error: prepareSQL bind failed "
                        message.append(error.localizedDescription)
                    }
                    if message.count > 0 { break }
                }
            }
            if retMode == "no" {
                returnCode = sqlite3_step(runSQLStatement)
                if returnCode != SQLITE_DONE {
                    let errmsg: String = String(
                        cString: sqlite3_errmsg(mDB.mDb))
                    message = "Error: prepareSQL step failed rc: "
                    message.append("\(returnCode) message: \(errmsg)")
                }
            } else {
                if retMode.prefix(2) == "wA" {
                    do {
                        result = try UtilsSQLCipher
                            .returningWorkAround(
                                mDB: mDB,
                                runSQLStatement: runSQLStatement,
                                sqlStmt: sqlStmt,
                                names: names, returnMode: retMode)
                    } catch UtilsSQLCipherError
                                .returningWorkAround(let message) {
                        throw UtilsSQLCipherError
                        .prepareSQL(message: message)
                    }
                } else {

                    do {
                        result = try UtilsSQLCipher.fetchColumnInfo(
                            handle: runSQLStatement,
                            returnMode: retMode)
                    } catch UtilsSQLCipherError
                                .fetchColumnInfo(let message) {
                        throw UtilsSQLCipherError
                        .prepareSQL(message: message)
                    }
                }
            }
        } else {
            let errmsg: String = String(
                cString: sqlite3_errmsg(mDB.mDb))
            message = "Error: prepareSQL prepare failed rc: "
            message.append("\(returnCode) message: \(errmsg)")
        }
        returnCode = sqlite3_finalize(runSQLStatement)
        if returnCode != SQLITE_OK {
            let errmsg: String = String(
                cString: sqlite3_errmsg(mDB.mDb))
            message = "Error: prepareSQL finalize failed rc: "
            message.append("\(returnCode) message: \(errmsg)")
        }
        if message.count > 0 {
            throw UtilsSQLCipherError.prepareSQL(message: message)
        } else {
            lastId = Int64(sqlite3_last_insert_rowid(mDB.mDb))
            return (lastId, result)
        }
    }

    // MARK: - returningWorkAround

    class func returningWorkAround(mDB: Database,
                                   runSQLStatement: OpaquePointer?,
                                   sqlStmt: String, names: String,
                                   returnMode: String)
    throws -> [[String: Any]] {
        var result: [[String: Any]] = []
        let initLastId = Int64(sqlite3_last_insert_rowid(mDB.mDb))
        let stmtType = sqlStmt
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .components(separatedBy: " ")
            .first?.capitalized ?? ""

        if stmtType == "DELETE" &&
            names.count > 0 {
            do {
                result = try UtilsDelete
                    .getUpdDelReturnedValues(mDB: mDB,
                                             sqlStmt: sqlStmt,
                                             names: names )
            } catch UtilsDeleteError
                        .getUpdDelReturnedValues(let message) {
                throw UtilsSQLCipherError
                .returningWorkAround(message: message)
            }
        }
        let returnCode: Int32 = sqlite3_step(runSQLStatement)
        if returnCode != SQLITE_DONE {
            let errmsg: String = String(
                cString: sqlite3_errmsg(mDB.mDb))
            var message = "Error: prepareSQL step failed rc: "
            message.append("\(returnCode) message: \(errmsg)")
            throw UtilsSQLCipherError
            .returningWorkAround(message: message)

        }
        if stmtType == "INSERT" {
            let lastId = Int64(sqlite3_last_insert_rowid(mDB.mDb))
            let tableName = UtilsSQLStatement
                .extractTableName(from: sqlStmt)
            if let tblName = tableName {
                var query = "SELECT \(names) FROM \(tblName) " +
                    "WHERE rowid "
                if returnMode == "wAone" {
                    query += "= \(initLastId + 1);"
                } else {
                    query += "BETWEEN \(initLastId + 1) AND \(lastId);"
                }
                do {
                    result = try querySQL(mDB: mDB, sql: query,
                                          values: [])
                } catch UtilsSQLCipherError.querySQL(let message) {
                    throw UtilsSQLCipherError
                    .returningWorkAround(message: message)
                }

            }

        } else if stmtType == "UPDATE" {
            do {
                result = try UtilsDelete
                    .getUpdDelReturnedValues(mDB: mDB,
                                             sqlStmt: sqlStmt,
                                             names: names )
            } catch UtilsDeleteError
                        .getUpdDelReturnedValues(let message) {
                throw UtilsSQLCipherError
                .returningWorkAround(message: message)
            }

        }

        return result
    }

    // swiftlint:enable cyclomatic_complexity
    // swiftlint:enable function_body_length

    // MARK: - deleteSQL

    // swiftlint:disable function_body_length
    class func deleteSQL(mDB: Database, sql: String, values: [Any])
    throws -> String {
        var sqlStmt = sql
        do {
            let isLast: Bool = try UtilsJson.isLastModified(mDB: mDB)
            let isDel: Bool = try UtilsJson.isSqlDeleted(mDB: mDB)
            if isLast && isDel {
                // Replace DELETE by UPDATE
                // set sql_deleted to 1 and the last_modified to
                // timenow
                guard let whereClause =
                        UtilsSQLStatement.extractWhereClause(from: sqlStmt)
                else {
                    let msg: String = "deleteSQL cannot find a " +
                        "WHERE clause"
                    throw UtilsSQLCipherError.deleteSQL(message: msg)
                }
                guard let tableName =
                        UtilsSQLStatement.extractTableName(from: sqlStmt)
                else {
                    let msg: String = "deleteSQL cannot find a " +
                        "WHERE clause"
                    throw UtilsSQLCipherError.deleteSQL(message: msg)
                }
                let colNames = UtilsSQLStatement
                    .extractColumnNames(from: whereClause)
                if colNames.count == 0 {
                    let msg = "Did not find column names in the" +
                        "WHERE Statement"
                    throw UtilsSQLCipherError.deleteSQL(message: msg)
                }
                /*
                 let curTime =         UtilsDelete.getCurrentTimeAsInteger()
                 */
                let setStmt = "sql_deleted = 1"
                // Find REFERENCIES if any and update the sql_deleted
                // column
                let hasToUpdate: Bool = try UtilsDelete
                    .findReferencesAndUpdate(mDB: mDB,
                                             tableName: tableName,
                                             whereStmt: whereClause,
                                             initColNames: colNames,
                                             values: values)
                if hasToUpdate {
                    let whereStmt = whereClause.hasSuffix(";")
                        ? String(whereClause.dropLast())
                        : whereClause
                    sqlStmt = "UPDATE \(tableName) SET \(setStmt) " +
                        "WHERE \(whereStmt) " +
                        "AND sql_deleted = 0;"
                } else {
                    sqlStmt = ""
                }
            }
            return sqlStmt
        } catch UtilsDeleteError.findReferencesAndUpdate(let message) {
            throw UtilsSQLCipherError.deleteSQL(message: message)
        } catch UtilsJsonError.isLastModified(let message) {
            throw UtilsSQLCipherError.deleteSQL(message: message)
        } catch UtilsJsonError.isSqlDeleted(let message) {
            throw UtilsSQLCipherError.deleteSQL(message: message)
        }
    }
    // swiftlint:enable function_body_length

    // MARK: - querySQL

    class func querySQL(mDB: Database, sql: String,
                        values: [Any]) throws -> [[String: Any]] {
        var msg: String = "Error querySQL: "
        if !mDB.isDBOpen() {
            msg.append("Database not opened")
            throw UtilsSQLCipherError.querySQL(message: msg)
        }
        var selectSQLStatement: OpaquePointer?
        var result: [[String: Any]] = []
        var message: String = ""
        var returnCode: Int32 =
            sqlite3_prepare_v2(mDB.mDb, sql, -1, &selectSQLStatement,
                               nil)
        if returnCode == SQLITE_OK {
            if !values.isEmpty {
                // do the binding of values
                message = UtilsBinding.bindValues(
                    handle: selectSQLStatement, values: values)
            }
            if message.count == 0 {
                do {
                    result = try UtilsSQLCipher.fetchColumnInfo(
                        handle: selectSQLStatement, returnMode: "all")
                } catch UtilsSQLCipherError
                            .fetchColumnInfo(let message) {
                    throw UtilsSQLCipherError
                    .querySQL(message: message)
                }
            }
        } else {
            let errmsg: String = String(
                cString: sqlite3_errmsg(mDB.mDb))
            message = "Error: querySQL prepare failed rc: "
            message.append("\(returnCode) message: \(errmsg)")
        }
        returnCode = sqlite3_finalize(selectSQLStatement)
        if returnCode != SQLITE_OK {
            let errmsg: String = String(
                cString: sqlite3_errmsg(mDB.mDb))
            message = "Error: querySQL finalize failed rc: "
            message.append("\(returnCode) message: \(errmsg)")
        }
        if message.count > 0 {
            throw UtilsSQLCipherError.querySQL(message: message)
        } else {
            return result
        }
    }

    // MARK: - FetchColumnInfo

    // swiftlint:disable function_body_length
    // swiftlint:disable cyclomatic_complexity
    class func fetchColumnInfo(handle: OpaquePointer?,
                               returnMode: String)
    throws -> [[String: Any]] {
        var result: [[String: Any]] = []
        var columnCount: Int32 = 0
        var columnNames: [String] = []
        var columnData: [String: Any] = [:]

        while sqlite3_step(handle) == SQLITE_ROW {
            columnCount = sqlite3_column_count(handle)
            var rowData: [String: Any] = [:]
            for index in 0..<columnCount {

                guard let name = sqlite3_column_name(handle, index)
                else {
                    var message = "Error: fetchColumnInfo column_name "
                    message.append("failed")
                    throw UtilsSQLCipherError
                    .fetchColumnInfo(message: message)
                }
                if columnNames.count <= columnCount {
                    columnNames.append(String(cString: name))
                    if columnNames.count == columnCount {
                        columnData["ios_columns"] = columnNames
                        result.append(columnData)
                    }
                }
                switch sqlite3_column_type(handle, Int32(index)) {
                case SQLITE_INTEGER:
                    let val: Int64 = sqlite3_column_int64(handle,
                                                          index)
                    rowData[String(cString: name)] = val
                case SQLITE_FLOAT:
                    let val: Double = sqlite3_column_double(handle,
                                                            index)
                    rowData[String(cString: name)] = val
                case SQLITE_BLOB:
                    if let dataBlob = sqlite3_column_blob(handle,
                                                          index) {
                        let dataBlobLength = sqlite3_column_bytes(
                            handle, index)
                        let data = Data(bytes: dataBlob,
                                        count: Int(dataBlobLength))
                        rowData[String(cString: name)] = data.bytes
                    } else {
                        rowData[String(cString: name)] = NSNull()
                    }

                case SQLITE_TEXT:
                    let buffer = sqlite3_column_text(handle, index)
                    if let mBuffer = buffer {
                        let val = String(cString: mBuffer)
                        rowData[String(cString: name)] = val
                    } else {
                        rowData[String(cString: name)] = NSNull()
                    }
                case SQLITE_NULL:
                    rowData[String(cString: name)] = NSNull()
                case let type:
                    var message = "Error: fetchColumnInfo " +
                        "column_type \(type) "
                    message.append("failed")
                    throw UtilsSQLCipherError
                    .fetchColumnInfo(message: message)
                }
            }
            result.append(rowData)
            if returnMode == "one" {
                break
            }
        }
        return result
    }
    // swiftlint:enable cyclomatic_complexity
    // swiftlint:enable function_body_length

    // MARK: - dbChanges

    class func dbChanges(mDB: OpaquePointer?) -> Int {
        return Int(sqlite3_total_changes(mDB))
    }

    // MARK: - dbLastId

    class func dbLastId(mDB: OpaquePointer?) -> Int64 {
        return Int64(sqlite3_last_insert_rowid(mDB))
    }

    // MARK: - Execute

    // swiftlint:disable function_body_length
    class func execute(mDB: Database, sql: String) throws {
        var msg: String = "Error execute: "
        if !mDB.isDBOpen() {
            msg.append("Database not opened")
            throw UtilsSQLCipherError.execute(message: msg)
        }
        var sqlStmt = sql
        if sql.localizedCaseInsensitiveContains("DELETE FROM") {
            sqlStmt = sqlStmt.replacingOccurrences(of: "\n",
                                                   with: "")
            var stmtArr = sqlStmt.components(separatedBy: ";")
            stmtArr.removeLast()
            var resArr: [String] = []
            for stmt in stmtArr {
                let trimStmt = stmt
                    .trimmingLeadingAndTrailingSpaces().prefix(11)
                    .uppercased()
                if trimStmt == "DELETE FROM" &&
                    stmt.localizedCaseInsensitiveContains("WHERE") {
                    let whereStmt = stmt
                        .trimmingLeadingAndTrailingSpaces()
                    do {
                        let rStmt: String = try deleteSQL(
                            mDB: mDB, sql: whereStmt, values: [])
                        if !rStmt.isEmpty {
                            resArr.append(rStmt)
                        }
                    } catch UtilsSQLCipherError
                                .deleteSQL(let message) {
                        let msg = "Error: execute \(message)"
                        throw UtilsSQLCipherError.execute(message: msg)
                    }
                } else {
                    resArr.append(String(stmt))
                }
            }
            sqlStmt = resArr.joined(separator: ";")
        }
        let curTime = UtilsDelete.getCurrentTimeAsInteger()
        let returnCode: Int32 = sqlite3_exec(mDB.mDb, sqlStmt, nil,
                                             nil, nil)
        if returnCode != SQLITE_OK {
            let errmsg: String = String(
                cString: sqlite3_errmsg(mDB.mDb))
            var msg: String = "Error: execute failed rc: \(returnCode)"
            msg.append(" message: \(errmsg)")
            throw UtilsSQLCipherError.execute(
                message: msg)
        }
        return
    }
    // swiftlint:enable function_body_length

    // MARK: - DeleteDB

    class func deleteDB(databaseLocation: String,
                        databaseName: String) throws {
        do {
            let dir: URL = try UtilsFile
                .getFolderURL(folderPath: databaseLocation)

            let fileURL = dir.appendingPathComponent(databaseName)
            let isFileExists = FileManager.default.fileExists(
                atPath: fileURL.path)
            if isFileExists {
                do {
                    try FileManager.default.removeItem(at: fileURL)
                } catch let error {
                    var msg: String = "Error: deleteDB: "
                    msg.append(" \(error.localizedDescription)")
                    throw UtilsSQLCipherError.deleteDB(
                        message: msg)
                }
            }
        } catch UtilsFileError.getFolderURLFailed(let message) {
            let msg = "Error: deleteDB: \(message)"
            throw UtilsSQLCipherError.deleteDB(message: msg)
        }
    }

    // MARK: - ExecuteSet

    // swiftlint:disable function_body_length
    // swiftlint:disable cyclomatic_complexity
    class func executeSet(mDB: Database, set: [[String: Any]],
                          returnMode: String)
    throws -> (Int64, [[String: Any]]) {
        var msg: String = "Error executeSet: "
        if !mDB.isDBOpen() {
            msg.append("Database not opened")
            throw UtilsSQLCipherError.executeSet(message: msg)
        }
        var lastId: Int64 = -1
        var response: [[String: Any]] = []
        do {
            for dict  in set {
                guard let sql: String = dict["statement"] as? String
                else {
                    throw UtilsSQLCipherError.executeSet(
                        message: "No statement given")
                }
                guard let values: [Any] = dict["values"] as? [Any]
                else {
                    throw UtilsSQLCipherError.executeSet(
                        message: "No values given")
                }
                var respSet: [[String: Any]] = []
                var isArray = false
                if values.count > 0 {
                    isArray = UtilsSQLCipher.parse(mVar: values[0])
                }
                if isArray {
                    if let arrValues = values as? [[Any]] {
                        for vals in arrValues {
                            let resp = try UtilsSQLCipher
                                .prepareSQL(mDB: mDB, sql: sql,
                                            values: vals,
                                            fromJson: false,
                                            returnMode: returnMode)
                            lastId = resp.0
                            respSet = resp.1

                            if  lastId == -1 {
                                let message: String = "lastId < 0"
                                throw UtilsSQLCipherError
                                .executeSet(message: message)
                            }

                            response = addToResponse(response: response,
                                                     respSet: respSet)
                        }
                    }
                } else {
                    let resp = try UtilsSQLCipher
                        .prepareSQL(mDB: mDB, sql: sql, values: values,
                                    fromJson: false, returnMode: returnMode)
                    lastId = resp.0
                    respSet = resp.1
                    if  lastId == -1 {
                        let message: String = "lastId < 0"
                        throw UtilsSQLCipherError.executeSet(
                            message: message)
                    }
                    response = addToResponse(response: response, respSet: respSet)
                }
            }

            return (lastId, response)
        } catch UtilsSQLCipherError.prepareSQL(let message) {
            throw UtilsSQLCipherError.executeSet(
                message: message)
        }
    }
    // swiftlint:enable cyclomatic_complexity
    // swiftlint:enable function_body_length

    class func addToResponse(response: [[String: Any]],
                             respSet: [[String: Any]]) -> [[String: Any]] {
        var retResponse = response
        var mRespSet = respSet
        if !retResponse.isEmpty {
            let keysInArray1 = ["ios_columns"]
            mRespSet = mRespSet.filter({ dict2 in
                guard let dict2Key = dict2.keys.first else {
                    return true // Keep dictionaries without any keys
                }
                return !keysInArray1.contains(dict2Key)
            })
        }
        retResponse.append(contentsOf: mRespSet)

        return retResponse

    }
    // swiftlint:enable function_body_length

    // MARK: - RestoreDB

    class func restoreDB(databaseLocation: String, databaseName: String) throws {
        do {
            let dir: URL = try UtilsFile
                .getFolderURL(folderPath: databaseLocation)

            let fileURL = dir.appendingPathComponent(databaseName)
            let backupURL = dir
                .appendingPathComponent("backup-\(databaseName)")
            let isBackupExists = FileManager.default.fileExists(
                atPath: backupURL.path)
            if isBackupExists {
                let isFileExists = FileManager.default.fileExists(
                    atPath: fileURL.path)
                if isFileExists {
                    do {
                        try FileManager.default.removeItem(at: fileURL)
                        try FileManager
                            .default.copyItem(atPath: backupURL.path,
                                              toPath: fileURL.path)
                        try FileManager.default
                            .removeItem(at: backupURL)
                    } catch {
                        var msg = "Error: restoreDB : \(databaseName)"
                        msg += " \(error)"
                        throw UtilsSQLCipherError.restoreDB(
                            message: msg)
                    }
                } else {
                    var msg = "Error: restoreDB: \(databaseName)"
                    msg += " does not exist"
                    throw UtilsSQLCipherError.restoreDB(
                        message: msg)

                }
            } else {
                var msg = "Error: restoreDB: backup-\(databaseName)"
                msg += " does not exist"
                throw UtilsSQLCipherError.restoreDB(
                    message: msg)
            }
        } catch UtilsFileError.getFolderURLFailed(let message) {
            let msg = "Error: restoreDB: \(message)"
            throw UtilsSQLCipherError.restoreDB(message: msg)
        }
    }

    // MARK: - deleteBackupDB

    class func deleteBackupDB(databaseLocation: String,
                              databaseName: String) throws {

        do {
            let dir: URL = try UtilsFile
                .getFolderURL(folderPath: databaseLocation)
            let backupURL = dir
                .appendingPathComponent("backup-\(databaseName)")
            let isBackupExists = FileManager.default.fileExists(
                atPath: backupURL.path)
            if isBackupExists {
                do {
                    try FileManager.default
                        .removeItem(at: backupURL)
                } catch {
                    var msg = "Error: deleteBackupDB : \(databaseName)"
                    msg += " \(error)"
                    throw UtilsSQLCipherError.deleteBackupDB(
                        message: msg)
                }
            } else {
                var msg = "Error: deleteBackupDB: "
                msg.append("backup-\(databaseName) does not exist")
                throw UtilsSQLCipherError.deleteBackupDB(message: msg)
            }
        } catch UtilsFileError.getFolderURLFailed(let message) {
            let msg = "Error: deleteBackupDB: \(message)"
            throw UtilsSQLCipherError.deleteBackupDB(
                message: msg)
        }

    }

    // MARK: - parse

    class func parse(mVar: Any) -> Bool {
        var ret: Bool = false
        if mVar is NSArray {
            ret = true
        }
        return ret
    }

}
// swiftlint:enable type_body_length
// swiftlint:enable file_length
