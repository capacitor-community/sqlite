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
    case findReferencesAndUpdate(message: String)
    case getReferences(message: String)
    case getRefs(message: String)
    case querySQL(message: String)
    case fetchColumnInfo(message: String)
    case deleteDB(message: String)
    case executeSet(message: String)
    case restoreDB(message: String)
    case deleteBackupDB(message: String)
    case openDBNoPassword(message: String)
    case openDBStoredPassword(message: String)
    case openDBGlobalPassword(message: String)
}
enum State: String {
    case DOESNOTEXIST, UNENCRYPTED, ENCRYPTEDSECRET,
         ENCRYPTEDGLOBALSECRET, UNKNOWN, ERROR

}

// swiftlint:disable file_length
// swiftlint:disable type_body_length
class UtilsSQLCipher {

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
                } catch UtilsSQLCipherError.openDBNoPassword(let message) {
                    if message == "Open" {
                        do {
                            try openDBStoredPassword(dBPath: path, account: account)
                            return State.ENCRYPTEDSECRET
                        } catch UtilsSQLCipherError.openDBStoredPassword(let message) {
                            if message == "Open" {
                                do {
                                    try openDBGlobalPassword(dBPath: path)
                                    return State.ENCRYPTEDGLOBALSECRET
                                } catch UtilsSQLCipherError.openDBGlobalPassword(let message) {
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
    class func openDBNoPassword(dBPath: String) throws {
        do {
            let oDb: OpaquePointer? = try openOrCreateDatabase(
                filename: dBPath, password: "", readonly: true)

            try close(oDB: oDb)
            return
        } catch UtilsSQLCipherError.openOrCreateDatabase(_) {
            throw UtilsSQLCipherError.openDBNoPassword(message: "Open")
        } catch UtilsSQLCipherError.close(_) {
            throw UtilsSQLCipherError.openDBNoPassword(message: "Close")
        }

    }
    class func openDBStoredPassword(dBPath: String, account: String) throws {
        do {
            let password: String = UtilsSecret.getPassphrase(account: account)
            let oDb: OpaquePointer? = try openOrCreateDatabase(
                filename: dBPath, password: password, readonly: true)
            try close(oDB: oDb)
            return
        } catch UtilsSQLCipherError.openOrCreateDatabase(_) {
            throw UtilsSQLCipherError.openDBStoredPassword(message: "Open")
        } catch UtilsSQLCipherError.close(_) {
            throw UtilsSQLCipherError.openDBStoredPassword(message: "Close")
        }

    }
    class func openDBGlobalPassword(dBPath: String) throws {
        do {
            let globalData: GlobalSQLite = GlobalSQLite()
            let password: String = globalData.secret
            let oDb: OpaquePointer? = try openOrCreateDatabase(
                filename: dBPath, password: password, readonly: true)
            try close(oDB: oDb)
            return
        } catch UtilsSQLCipherError.openOrCreateDatabase(_) {
            throw UtilsSQLCipherError.openDBGlobalPassword(message: "Open")
        } catch UtilsSQLCipherError.close(_) {
            throw UtilsSQLCipherError.openDBGlobalPassword(message: "Close")
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
                    throw UtilsSQLCipherError.openOrCreateDatabase(message: msg)
                }
            }
            let retB: Bool = checkDB(mDB: mDB)
            if !retB {
                let msg: String = "Cannot open the DB"
                throw UtilsSQLCipherError.openOrCreateDatabase(message: msg)
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
            throw UtilsSQLCipherError.getForeignKeysStateFailed(message: msg)
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
                    throw UtilsSQLCipherError.getForeignKeysStateFailed(
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
                          fromJson: Bool) throws -> Int64 {
        var msg: String = "Error prepareSQL: "
        if !mDB.isDBOpen() {
            msg.append("Database not opened")
            throw UtilsSQLCipherError.prepareSQL(message: msg)
        }
        var runSQLStatement: OpaquePointer?
        var message: String = ""
        var lastId: Int64 = -1
        var sqlStmt = sql
        // Check for DELETE statement
        if !fromJson && sqlStmt.prefix(6).uppercased() == "DELETE" {
            do {
                sqlStmt = try deleteSQL(mDB: mDB, sql: sql,
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
            returnCode = sqlite3_step(runSQLStatement)
            if returnCode != SQLITE_DONE {
                let errmsg: String = String(
                    cString: sqlite3_errmsg(mDB.mDb))
                message = "Error: prepareSQL step failed rc: "
                message.append("\(returnCode) message: \(errmsg)")
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
            return lastId
        }
    }
    // swiftlint:enable cyclomatic_complexity
    // swiftlint:enable function_body_length

    // MARK: - deleteSQL

    class func deleteSQL(mDB: Database, sql: String, values: [Any]) throws -> String {
        var sqlStmt = sql
        do {
            let isLast: Bool = try UtilsJson.isLastModified(mDB: mDB)
            let isDel: Bool = try UtilsJson.isSqlDeleted(mDB: mDB)
            if isLast && isDel {
                // Replace DELETE by UPDATE and set sql_deleted to 1
                if let range: Range<String.Index> = sql
                    .range(of: "WHERE", options: .caseInsensitive) {
                    let index: Int = sql
                        .distance(from: sql.startIndex, to: range.lowerBound)
                    let preStmt = String(sql.stringRange(fromIdx: 0,
                                                         toIdx: (index - 1)))
                    let clauseStmt = String(sql.stringRange(fromIdx: index,
                                                            toIdx: sql.count))
                    let tableName = (preStmt.deletingPrefix("DELETE FROM"))
                        .trimmingLeadingAndTrailingSpaces()
                    sqlStmt = "UPDATE \(tableName) SET sql_deleted = 1 "
                    sqlStmt += clauseStmt
                    // Find REFERENCIES if any and update the sql_deleted column
                    try findReferencesAndUpdate(mDB: mDB,
                                                tableName: tableName,
                                                whereStmt: clauseStmt,
                                                values: values)
                } else {
                    let msg: String = "deleteSQL cannot find a WHERE clause"
                    throw UtilsSQLCipherError.deleteSQL(message: msg)
                }
            }
            return sqlStmt
        } catch UtilsSQLCipherError.findReferencesAndUpdate(let message) {
            throw UtilsSQLCipherError.deleteSQL(message: message)
        } catch UtilsJsonError.isLastModified(let message) {
            throw UtilsSQLCipherError.deleteSQL(message: message)
        } catch UtilsJsonError.isSqlDeleted(let message) {
            throw UtilsSQLCipherError.deleteSQL(message: message)
        }
    }

    // MARK: - findReferencesAndUpdate

    // swiftlint:disable function_body_length
    // swiftlint:disable cyclomatic_complexity
    class func findReferencesAndUpdate(mDB: Database, tableName: String,
                                       whereStmt: String,
                                       values: [Any]) throws {
        do {
            var references = try getReferences(mDB: mDB,
                                               tableName: tableName)
            if references.count <= 0 {
                return
            }
            guard let tableNameWithRefs = references.last else {
                return
            }
            references.removeLast()
            // Loop through references
            for ref in references {
                // get the tableName of the references
                let refTable: String = getReferencesTableName(value: ref)
                if refTable.count <= 0 {
                    continue
                }
                // get the with ref columnName
                let withRefsNames: [String] = getWithRefsColumnName(value: ref)
                if withRefsNames.count <= 0 {
                    continue
                }
                // get the columnName
                let colNames: [String] = getReferencesColumnName(value: ref)
                if colNames.count <= 0 {
                    continue
                }
                // update the where clause
                let uWhereStmt: String = updateWhere(whStmt: whereStmt,
                                                     withRefs: withRefsNames,
                                                     colNames: colNames)

                if uWhereStmt.count <= 0 {
                    continue
                }
                var updTableName: String = tableNameWithRefs
                var updColNames: [String] = colNames
                if tableNameWithRefs == tableName {
                    updTableName = refTable
                    updColNames = withRefsNames
                }
                //update sql_deleted for this references
                let stmt = "UPDATE \(updTableName) SET sql_deleted = 1 " +
                    uWhereStmt
                var selValues: [Any] = []
                if !values.isEmpty {
                    var arrVal: [String] =  whereStmt.components(separatedBy: "?")
                    if arrVal[arrVal.count - 1] == ";" {
                        arrVal.removeLast()
                    }
                    for (jdx, val) in arrVal.enumerated() {
                        for updVal in updColNames {
                            let indices: [Int] = val.indicesOf(string: updVal)
                            if indices.count > 0 {
                                selValues.append(values[jdx])
                            }
                        }
                    }
                }

                let lastId = try prepareSQL(mDB: mDB, sql: stmt,
                                            values: selValues,
                                            fromJson: false)
                if lastId == -1 {
                    let msg = "UPDATE sql_deleted failed for references " +
                        "table: \(refTable) "
                    throw UtilsSQLCipherError
                    .findReferencesAndUpdate(message: msg)
                }
            }
            return
        } catch UtilsSQLCipherError.prepareSQL(let message) {
            throw UtilsSQLCipherError
            .findReferencesAndUpdate(message: message)
        } catch UtilsSQLCipherError.querySQL(let message) {
            throw UtilsSQLCipherError
            .findReferencesAndUpdate(message: message)
        }

    }
    // swiftlint:enable cyclomatic_complexity
    // swiftlint:enable function_body_length

    // MARK: - getReferences

    class func getReferences(mDB: Database, tableName: String)
    throws -> [String] {
        // find the REFERENCES
        var sqlStmt = "SELECT sql FROM sqlite_master "
        sqlStmt += "WHERE sql LIKE('%FOREIGN KEY%') AND "
        sqlStmt += "sql LIKE('%REFERENCES%') AND "
        sqlStmt += "sql LIKE('%\(tableName)%') AND sql LIKE('%ON DELETE%');"
        do {
            var references: [[String: Any]] = try querySQL(mDB: mDB,
                                                           sql: sqlStmt,
                                                           values: [])
            var retRefs: [String] = []
            if references.count > 1 {
                references.removeFirst()
                if let refValue = references[0]["sql"] as? String {
                    retRefs = try getRefs(str: refValue)
                }
            }
            return retRefs
        } catch UtilsSQLCipherError.getRefs(let message) {
            throw UtilsSQLCipherError
            .getReferences(message: message)
        } catch UtilsSQLCipherError.querySQL(let message) {
            throw UtilsSQLCipherError
            .getReferences(message: message)
        }
    }
    class func getRefs(str: String) throws -> [String] {
        var retRefs: [String] = []
        let indicesFK: [Int] = str.indicesOf(string: "FOREIGN KEY")
        let indicesOD: [Int] = str.indicesOf(string: "ON DELETE")
        if indicesFK.count > 0 && indicesOD.count > 0
            && indicesFK.count != indicesOD.count {
            let msg: String = "Indices of FOREIGN KEY and ON DELETE not equal"
            throw UtilsSQLCipherError.getRefs(message: msg)

        }
        for (idx, iFK) in indicesFK.enumerated() {
            let ref: String = String(str.stringRange(fromIdx: iFK + 11,
                                                     toIdx: indicesOD[idx]))
                .trimmingLeadingAndTrailingSpaces()
            retRefs.append(ref)
        }

        if let range: Range<String.Index> = str
            .range(of: "CREATE TABLE", options: .caseInsensitive) {
            let index: Int = str
                .distance(from: str.startIndex, to: range.lowerBound)
            let stmt = String(str.stringRange(fromIdx: index + 13,
                                              toIdx: str.count))
            if let oPar = stmt.firstIndex(of: "(") {
                let idx: Int = stmt.distance(from: stmt.startIndex, to: oPar)
                let tableName: String = String(stmt.stringRange(fromIdx: 0,
                                                                toIdx: idx))
                    .trimmingLeadingAndTrailingSpaces()
                retRefs.append(tableName)
            }
        }

        return retRefs
    }

    // MARK: - getReferencesTableName

    class func getReferencesTableName(value: String) -> String {

        var tableName: String = ""
        if value.isEmpty {
            return tableName
        }
        let indicesRef: [Int] = value.indicesOf(string: "REFERENCES")
        if indicesRef.count > 0 {
            let val: String = String(value.stringRange(
                                        fromIdx: indicesRef[0] + 10,
                                        toIdx: value.count))
            if let oPar = val.firstIndex(of: "(") {
                let idx: Int = val.distance(from: val.startIndex, to: oPar)
                tableName = String(val.stringRange(fromIdx: 0,
                                                   toIdx: idx))
                    .trimmingLeadingAndTrailingSpaces()
            }
        }
        return tableName
    }

    // MARK: - getWithRefColumnName

    class func getWithRefsColumnName(value: String) -> [String] {

        var colNames: [String] = []
        if value.isEmpty {
            return colNames
        }
        let indicesRef: [Int] = value.indicesOf(string: "REFERENCES")
        if indicesRef.count > 0 {
            let val: String = String(value.stringRange(
                                        fromIdx: 0,
                                        toIdx: indicesRef[0] - 1))
            if let oPar = val.firstIndex(of: "(") {
                let idxOPar: Int = val.distance(from: val.startIndex, to: oPar)
                if let cPar = val.firstIndex(of: ")") {
                    let idxCPar: Int = val.distance(from: val.startIndex,
                                                    to: cPar)

                    let colStr: String = String(val
                                                    .stringRange(fromIdx: idxOPar + 1,
                                                                 toIdx: idxCPar))
                        .trimmingLeadingAndTrailingSpaces()
                    colNames = colStr.split(separator: ",").map(String.init)
                }
            }
        }
        return colNames
    }
    // MARK: - getReferencesColumnName

    class func getReferencesColumnName(value: String) -> [String] {

        var colNames: [String] = []
        if value.isEmpty {
            return colNames
        }
        let indicesRef: [Int] = value.indicesOf(string: "REFERENCES")
        if indicesRef.count > 0 {
            let val: String = String(value.stringRange(
                                        fromIdx: indicesRef[0] + 10,
                                        toIdx: value.count))
            if let oPar = val.firstIndex(of: "(") {
                let idxOPar: Int = val.distance(from: val.startIndex, to: oPar)
                if let cPar = val.firstIndex(of: ")") {
                    let idxCPar: Int = val.distance(from: val.startIndex,
                                                    to: cPar)

                    let colStr: String = String(val
                                                    .stringRange(fromIdx: idxOPar + 1,
                                                                 toIdx: idxCPar))
                        .trimmingLeadingAndTrailingSpaces()
                    colNames = colStr.split(separator: ",").map(String.init)

                }
            }
        }
        return colNames
    }

    // swiftlint:disable function_body_length
    class func updateWhere(whStmt: String, withRefs: [String],
                           colNames: [String]) -> String {
        var whereStmt = ""
        if whStmt.count > 0 {
            let indicesWhere: [Int] = whStmt.indicesOf(string: "WHERE")
            if indicesWhere.count == 0 {
                return whereStmt
            }
            var stmt: String = String(whStmt.stringRange(
                                        fromIdx: indicesWhere[0] + 6,
                                        toIdx: whStmt.count))
            if withRefs.count == colNames.count {
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
            }
        }
        return whereStmt
    }
    // swiftlint:enable function_body_length

    // MARK: - querySQL

    class func querySQL(mDB: Database, sql: String,
                        values: [Any]) throws -> [[String: Any]] {
        var msg: String = "Error prepareSQL: "
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
                        handle: selectSQLStatement)
                } catch UtilsSQLCipherError
                            .fetchColumnInfo(let message) {
                    throw UtilsSQLCipherError.querySQL(message: message)
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
    class func fetchColumnInfo(handle: OpaquePointer?)
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
                    let val: Int64 = sqlite3_column_int64(handle, index)
                    rowData[String(cString: name)] = val
                case SQLITE_FLOAT:
                    let val: Double = sqlite3_column_double(handle, index)
                    rowData[String(cString: name)] = val
                case SQLITE_BLOB:
                    if let dataBlob = sqlite3_column_blob(handle, index) {
                        let dataBlobLength = sqlite3_column_bytes(handle, index)
                        let data = Data(bytes: dataBlob,
                                        count: Int(dataBlobLength))
                        //                        rowData[String(cString: name)] = data.base64EncodedString()
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
                    var message = "Error: fetchColumnInfo column_type \(type) "
                    message.append("failed")
                    throw UtilsSQLCipherError
                    .fetchColumnInfo(message: message)
                }
            }
            result.append(rowData)

        }
        return result
    }
    // swiftlint:enable cyclomatic_complexity
    // swiftlint:enable function_body_length

    // MARK: - dbChanges

    class func dbChanges(mDB: OpaquePointer?) -> Int {
        return Int(sqlite3_total_changes(mDB))
    }

    // MARK: - Execute

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
                    .trimmingLeadingAndTrailingSpaces().prefix(11).uppercased()
                if trimStmt == "DELETE FROM" &&
                    stmt.localizedCaseInsensitiveContains("WHERE") {
                    let whereStmt = stmt.trimmingLeadingAndTrailingSpaces()
                    do {
                        let rStmt: String = try deleteSQL(mDB: mDB, sql: whereStmt, values: [])
                        resArr.append(rStmt)
                    } catch UtilsSQLCipherError.deleteSQL(let message) {
                        let msg = "Error: execute \(message)"
                        throw UtilsSQLCipherError.execute(message: msg)
                    }
                } else {
                    resArr.append(String(stmt))
                }
            }
            sqlStmt = resArr.joined(separator: ";")
        }

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

    // MARK: - DeleteDB

    class func deleteDB(databaseLocation: String, databaseName: String) throws {
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

    class func executeSet(mDB: Database, set: [[String: Any]])
    throws -> Int64 {
        var msg: String = "Error executeSet: "
        if !mDB.isDBOpen() {
            msg.append("Database not opened")
            throw UtilsSQLCipherError.executeSet(message: msg)
        }
        var lastId: Int64 = -1
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
                let isArray = values.count > 0 ? UtilsSQLCipher.parse(mVar: values[0]) : false
                if isArray {
                    if let arrValues = values as? [[Any]] {
                        for vals in arrValues {
                            lastId = try UtilsSQLCipher
                                .prepareSQL(mDB: mDB, sql: sql,
                                            values: vals, fromJson: false)
                            if  lastId == -1 {
                                let message: String = "lastId < 0"
                                throw UtilsSQLCipherError
                                .executeSet(message: message)
                            }
                        }
                    }
                } else {
                    lastId = try UtilsSQLCipher
                        .prepareSQL(mDB: mDB, sql: sql, values: values,
                                    fromJson: false)
                    if  lastId == -1 {
                        let message: String = "lastId < 0"
                        throw UtilsSQLCipherError.executeSet(
                            message: message)
                    }
                }
            }

            return lastId
        } catch UtilsSQLCipherError.prepareSQL(let message) {
            throw UtilsSQLCipherError.executeSet(
                message: message)
        }
    }

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
