//
//  DatabaseSQLiteHelper.swift
//  Plugin
//
//  Created by  Quéau Jean Pierre on 23/01/2020.
//  Copyright © 2020 Max Lynch. All rights reserved.
//

import Foundation

import SQLCipher

enum DatabaseHelperError: Error {
    case dbConnection(message:String)
    case execSql(message:String)
    case runSql(message:String)
    case selectSql(message:String)
    case deleteDB(message:String)
    case close(message:String)
}
class DatabaseHelper {
    public var isOpen: Bool = false;
    // define the path for the database
    let path: String = NSSearchPathForDirectoriesInDomains(
        .documentDirectory, .userDomainMask, true
        ).first!
    var databaseName: String
    var secret: String
    var newsecret: String
    var encrypted: Bool

    init(databaseName: String, encrypted:Bool = false, mode: String = "no-encryption", secret:String = "", newsecret:String = "") throws {
        print("databaseName: \(databaseName) ")
        print("path: \(path)")
        self.secret = secret
        self.newsecret = newsecret
        self.encrypted = encrypted
        self.databaseName = databaseName
        // connect to the database (create if doesn't exist)
        
        var db: OpaquePointer?
        if !self.encrypted && mode == "no-encryption" {

            do {
                try db = UtilsSQLite.connection(filename: "\(path)/\(self.databaseName)")
                isOpen = true
            } catch {
                let error:String = "init: Error Database connection failed"
                print(error)
                throw UtilsSQLiteError.connectionFailed
            }
        } else if encrypted && mode == "secret" && secret.count > 0 {
            do {
                try db = UtilsSQLite.connection(filename: "\(path)/\(self.databaseName)",readonly: false,key: secret)
                self.isOpen = true
            } catch {
                let error:String = "init: Error Database connection failed wrong secret"
                print(error)
                self.isOpen = false
                throw UtilsSQLiteError.connectionFailed
            }

        } else if encrypted && mode == "newsecret" && secret.count > 0 && newsecret.count > 0 {
                do {
                    try db = UtilsSQLite.connection(filename: "\(path)/\(self.databaseName)",readonly: false,key: secret)
                    
                    let keyStatementString = """
                    PRAGMA rekey = '\(newsecret)';
                    """
                    if sqlite3_exec(db, keyStatementString, nil,nil,nil) != SQLITE_OK  {
                        print("connection: Unable to open a connection to database at \(path)/\(self.databaseName)")
                        throw UtilsSQLiteError.wrongNewSecret
                    }
                    /* this should work but does not sqlite3_rekey_v2 is not known
                    if sqlite3_rekey_v2(db!, "\(path)/\(self.dbName)", newsecret, Int32(newsecret.count)) == SQLITE_OK {
                        self.isOpen = true
                    } else {
                        print("Unable to open a connection to database at \(path)/\(self.dbName)")
                        throw StorageDatabaseHelperError.wrongNewSecret
                    }
                    */
                    self.secret = newsecret
                    self.isOpen = true

                } catch {
                    let error:String = "init: Error Database connection failed wrong secret"
                    print(error)
                    throw UtilsSQLiteError.wrongSecret
                }
        } else if encrypted && mode == "encryption" && secret.count > 0 {
            var res: Bool = false
            do {
                try res = UtilsSQLite.encryptDatabase(fileName: self.databaseName,secret:secret)
                if res {
                    self.encrypted = true
                    self.isOpen = true
                }
            } catch {
                let error:String = "init: Error Database connection failed wrong secret"
                print(error)
                throw UtilsSQLiteError.encryptionFailed
            }
        }
    }
    func close (databaseName:String) throws -> Bool {
        var ret: Bool = false
        var db: OpaquePointer?
        do {
            try db = UtilsSQLite.connection(filename: "\(path)/\(self.databaseName)")
            isOpen = true
            if sqlite3_close(db) != SQLITE_OK {
                print("error closing database")
                throw DatabaseHelperError.close(message:"Error: DB close")
            }
            isOpen = false
            db = nil
            ret = true
            
        } catch {
            let error:String = "init: Error Database connection failed"
            print(error)
            throw UtilsSQLiteError.connectionFailed
        }

        return ret
    }
    
    func execSQL(sql:String) throws -> Int {
        guard let db: OpaquePointer = try UtilsSQLite.getWritableDatabase(filename: "\(path)/\(databaseName)",
                    secret:secret) else {
            throw DatabaseHelperError.dbConnection(message:"Error: DB connection")
        }
        if sqlite3_exec(db,sql, nil, nil, nil) != SQLITE_OK {
            throw DatabaseHelperError.execSql(message: "Error: execSQL failed")
        }
        return Int(sqlite3_changes(db))
    }
    
    func runSQL(sql:String,values: Array<Any>) throws -> Int {
        guard let db: OpaquePointer = try UtilsSQLite.getWritableDatabase(filename: "\(path)/\(databaseName)",
                    secret:secret) else {
            throw DatabaseHelperError.dbConnection(message:"Error: DB connection")
        }
        var runSQLStatement: OpaquePointer? = nil

        if sqlite3_prepare_v2(db, sql, -1, &runSQLStatement, nil) == SQLITE_OK {
            if !values.isEmpty {
            // do the binding of values
                var idx: Int = 1
                for value in values {
                    do {
                        try UtilsSQLite.bind(handle: runSQLStatement!, value: value, idx: idx)
                        idx = idx + 1
                    } catch {
                        throw DatabaseHelperError.runSql(message: "Error: runSQL bind failed")
                    }
                }
            }
            if sqlite3_step(runSQLStatement) != SQLITE_DONE {
                throw DatabaseHelperError.runSql(message: "Error: runSQL step failed")
            }
        } else {
            throw DatabaseHelperError.runSql(message: "Error: runSQL prepare failed")
        }
        sqlite3_finalize(runSQLStatement)
        return Int(sqlite3_changes(db))

    }

    func selectSQL(sql:String,values: Array<String>) throws -> Array<[String: Any]> {
        guard let db: OpaquePointer = try UtilsSQLite.getWritableDatabase(filename: "\(path)/\(databaseName)",
                    secret:secret) else {
            throw DatabaseHelperError.dbConnection(message:"Error: DB connection")
        }
        var selectSQLStatement: OpaquePointer? = nil
        var result: Array<[String: Any]> = []

        if sqlite3_prepare_v2(db, sql, -1, &selectSQLStatement, nil) == SQLITE_OK {
            if !values.isEmpty {
            // do the binding of values
                var idx: Int = 1
                for value in values {
                    do {
                        try UtilsSQLite.bind(handle: selectSQLStatement!, value: value, idx: idx)
                        idx = idx + 1
                    } catch {
                        throw DatabaseHelperError.selectSql(message: "Error: selecSQL bind failed")
                    }
                }
            }
            var fetchColumnInfo = true
            var columnCount: Int32 = 0
            var columnNames = [String]()
            var columnTypes = [Int32]()

            while (sqlite3_step(selectSQLStatement) == SQLITE_ROW ) {
                if fetchColumnInfo {
                    columnCount = sqlite3_column_count(selectSQLStatement)

                    for index in 0..<columnCount {
                        let name = sqlite3_column_name(selectSQLStatement, index)!
                        columnNames.append(String(cString: name).lowercased())
                        columnTypes.append(UtilsSQLite.getColumnType(index: index, stmt: selectSQLStatement!))
                    }
                    fetchColumnInfo = false
                }

                var rowData: [String: Any] = [:]
                for index in 0..<columnCount {
                    let key = columnNames[Int(index)]
                    let type = columnTypes[Int(index)]

                    if let val = UtilsSQLite.getColumnValue(index: index, type: type, stmt: selectSQLStatement!) {
                        rowData[key] = val
                    }
                 }
                result.append(rowData)
            }

        } else {
            throw DatabaseHelperError.selectSql(message: "Error: selectSQL prepare failed")
        }
        sqlite3_finalize(selectSQLStatement)

        return result;
    }

    func deleteDB(databaseName:String) throws -> Bool {
        var ret: Bool = false
        if let dir = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first{
            let fileURL = dir.appendingPathComponent(databaseName)
            let isFileExists = FileManager.default.fileExists(atPath: fileURL.path)
            if(isFileExists) {
                do {
                    try FileManager.default.removeItem(at: fileURL)
                    print("Database \(databaseName) deleted")
                    isOpen = false
                    ret = true
                } catch {
                    throw DatabaseHelperError.deleteDB(message: "Error: deleteDB: \(error)")
                }
            } else {
                isOpen = false
            }
        }
        return ret
    }
    
}
