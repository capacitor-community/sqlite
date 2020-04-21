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
    case prepareSql(message:String)
    case selectSql(message:String)
    case querySql(message:String)
    case deleteDB(message:String)
    case close(message:String)
    case tableNotExists(message:String)
    case importFromJson(message:String)
    case isIdExists(message:String)
    case valuesToStringNull(message:String)
    case setToStringNull(message:String)
    case beginTransaction(message:String)
    case endTransaction(message:String)
    case createTableData(message:String)
    case createDatabaseSchema(message:String)
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
    
    // MARK: - Init
    
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
    
    // MARK: - Close
    
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
    
    // MARK: - ExecSQL
    
    func execSQL(sql:String) throws -> Int {
        guard let db: OpaquePointer = try UtilsSQLite.getWritableDatabase(filename: "\(path)/\(databaseName)",
                    secret:secret) else {
            throw DatabaseHelperError.dbConnection(message:"Error: DB connection")
        }
        if sqlite3_exec(db,sql, nil, nil, nil) != SQLITE_OK {
            throw DatabaseHelperError.execSql(message: "Error: execSQL failed")
        }
        let changes: Int = Int(sqlite3_total_changes(db))

        if sqlite3_close_v2(db) != SQLITE_OK {
            throw DatabaseHelperError.execSql(message: "Error: execSQL closing the database")
        }
        return changes
    }
    
    // MARK: - RunSQL
    
    func runSQL(sql:String,values: Array<Any>) throws -> [String:Int] {
        guard let db: OpaquePointer = try UtilsSQLite.getWritableDatabase(filename: "\(path)/\(databaseName)",
                    secret:secret) else {
            throw DatabaseHelperError.dbConnection(message:"Error: DB connection")
        }
        do {
            // Start a transaction

            var sqltr: String = "BEGIN TRANSACTION;"
            if sqlite3_exec(db,sqltr, nil, nil, nil) != SQLITE_OK {
                throw DatabaseHelperError.runSql(message: "Error: Begin Transaction failed")
            }
            let changes: Int = try prepareSQL(db: db,sql: sql,values: values)
            let lastId: Int = Int(sqlite3_last_insert_rowid(db))
            
            sqltr = "COMMIT TRANSACTION;"
            if sqlite3_exec(db,sqltr, nil, nil, nil) != SQLITE_OK {
                throw DatabaseHelperError.runSql(message: "Error: Commit Transaction failed")
            }
            
            if sqlite3_close_v2(db) != SQLITE_OK {
                throw DatabaseHelperError.runSql(message: "Error: runSQL closing the database")
            }
            let result:[String:Int] = ["changes":changes, "lastId":lastId]
            return result
        } catch DatabaseHelperError.prepareSql(let message) {
            throw DatabaseHelperError.runSql(message: message)
        }
    }
    
    // MARK: - PrepareSQL
    
    func prepareSQL(db: OpaquePointer,sql: String,values: Array<Any>) throws -> Int {
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
                        throw DatabaseHelperError.prepareSql(message: "Error: prepareSQL bind failed")
                    }
                }
            }
            if sqlite3_step(runSQLStatement) != SQLITE_DONE {
                throw DatabaseHelperError.prepareSql(message: "Error: prepareSQL step failed")
            }
        } else {
            throw DatabaseHelperError.prepareSql(message: "Error: prepareSQL prepare failed")
        }
        sqlite3_finalize(runSQLStatement)
        
        let changes: Int = Int(sqlite3_changes(db))
        return changes
    }
    // MARK: - SelectSQL
    
    func selectSQL(sql:String,values: Array<String>) throws -> Array<[String: Any]> {
        guard let db: OpaquePointer = try UtilsSQLite.getWritableDatabase(filename: "\(path)/\(databaseName)",
                    secret:secret) else {
            throw DatabaseHelperError.dbConnection(message:"Error: DB connection")
        }
        do {
            let result: Array<[String: Any]> = try querySQL(db: db,sql: sql,values: values)
            if sqlite3_close_v2(db) != SQLITE_OK {
                throw DatabaseHelperError.selectSql(message: "Error: selectSQL closing the database")
            }
            return result;
        } catch DatabaseHelperError.querySql(let message) {
            throw DatabaseHelperError.selectSql(message: message)
        }
    }
    
    // MARK: - QuerySQL
    
    func querySQL(db: OpaquePointer,sql: String,values:Array<String>) throws -> Array<[String: Any]>{
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
                        throw DatabaseHelperError.querySql(message: "Error: querySQL bind failed")
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
            throw DatabaseHelperError.querySql(message: "Error: querySQL prepare failed")
        }
        sqlite3_finalize(selectSQLStatement)
        return result;
    }
    
    // MARK: - DeleteDB
    
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
    // MARK: - ImportFromJson
    
    func importFromJson(jsonSQLite:JsonSQLite) throws -> [String:Int] {
        var success: Bool = true
        var changes: Int = -1
        
        // Create the Database Schema
        do {
            changes = try createDatabaseSchema(jsonSQLite:jsonSQLite)
            if (changes == -1) {
                success = false
            }
        } catch DatabaseHelperError.dbConnection(let message) {
            throw DatabaseHelperError.importFromJson(message: message)
        } catch DatabaseHelperError.createDatabaseSchema(let message) {
            throw DatabaseHelperError.importFromJson(message: message)
        }

        
        // create the table's data
        if(success) {
            
            do {
                changes = try createTableData(jsonSQLite:jsonSQLite)
                if (changes == -1) {
                    success = false
                }
            } catch DatabaseHelperError.dbConnection(let message) {
                throw DatabaseHelperError.importFromJson(message: message)
            } catch DatabaseHelperError.createTableData(let message) {
                throw DatabaseHelperError.importFromJson(message: message)
            }
        }
        if(!success) {
            changes = -1
        }
        return ["changes":changes]
    }

    // MARK: - ImportFromJson - CreateDatabaseSchema
    
    private func createDatabaseSchema(jsonSQLite:JsonSQLite) throws -> Int {
        var success: Bool = true
        var changes: Int = -1
        
        // Create the Database Schema
        var statements: Array<String> = []
        statements.append("BEGIN TRANSACTION;")
        // Loop through Tables
        for i in 0..<jsonSQLite.tables.count {
             if( jsonSQLite.tables[i].schema != nil && jsonSQLite.tables[i].schema!.count > 0) {
                var stmt: String
                if(jsonSQLite.mode == "full") {
                    stmt = "DROP TABLE IF EXISTS "
                    stmt.append(jsonSQLite.tables[i].name)
                    stmt.append(";")
                    statements.append(stmt)
                }

                stmt = "CREATE TABLE IF NOT EXISTS "
                stmt.append(jsonSQLite.tables[i].name)
                stmt.append(" (")
                for j in 0..<jsonSQLite.tables[i].schema!.count {
                    stmt.append(jsonSQLite.tables[i].schema![j].column)
                    stmt.append(" ")
                    stmt.append(jsonSQLite.tables[i].schema![j].value)
                    if (j != jsonSQLite.tables[i].schema!.count - 1) {
                        stmt.append(",")
                    }
                }
                stmt.append(");")
                statements.append(stmt);
            }

            if(jsonSQLite.tables[i].indexes != nil && jsonSQLite.tables[i].indexes!.count > 0) {
                for j in 0..<jsonSQLite.tables[i].indexes!.count {
                    var stmt: String
                    stmt = "CREATE INDEX IF NOT EXISTS "
                    stmt.append(jsonSQLite.tables[i].indexes![j].name)
                        
                    stmt.append(" ON ")
                    stmt.append(jsonSQLite.tables[i].name)
                    stmt.append(" (")
                    stmt.append(jsonSQLite.tables[i].indexes![j].column)
                    stmt.append(");")
                    statements.append(stmt);
                }
            }

        }
        if(statements.count > 1) {
            statements.append("PRAGMA user_version = 1;");
            statements.append("COMMIT TRANSACTION;");
            let joined = statements.joined(separator: "\n")
            do {
                changes = try execSQL(sql: joined)
                if (changes == -1) {
                    success = false
                }
            } catch DatabaseHelperError.execSql(let message) {
                throw DatabaseHelperError.importFromJson(message: message)
            }
        } else {
            success = false
        }
        if(!success) {
            changes = -1
        }
        return changes
    }

    // MARK: - ImportFromJson - createTableData
    
    private func createTableData(jsonSQLite: JsonSQLite) throws -> Int {
        var success: Bool = true
        var changes: Int = -1
        guard let db: OpaquePointer = try UtilsSQLite.getWritableDatabase(filename: "\(path)/\(databaseName)",
                    secret:secret) else {
            throw DatabaseHelperError.dbConnection(message:"Error: DB connection")
        }
        // Start a transaction

        let sql: String = "BEGIN TRANSACTION;"
        if sqlite3_exec(db,sql, nil, nil, nil) != SQLITE_OK {
            throw DatabaseHelperError.createTableData(message: "Error: Begin Transaction failed")
        }
        // Loop on tables to create Data
        for i in 0..<jsonSQLite.tables.count {
        
            if( jsonSQLite.tables[i].values != nil && jsonSQLite.tables[i].values!.count > 0) {
                // Check if table exists
                do {
                    let isTab: Bool = try isTable(db: db, tableName: jsonSQLite.tables[i].name)

                    if(!isTab) {
                        let message: String = "createTableData: Table " +
                        jsonSQLite.tables[i].name + " does not exist"
                        throw DatabaseHelperError.createTableData(message: message)
                    }
                } catch DatabaseHelperError.querySql(let message) {
                    throw DatabaseHelperError.createTableData(message: message)
                }

                // Get the Column's Name and Type
                var jsonNamesTypes: JsonNamesTypes = JsonNamesTypes(names:[],types:[])
                do {
                    jsonNamesTypes = try getTableColumnNamesTypes(db: db,tableName: jsonSQLite.tables[i].name)
                } catch DatabaseHelperError.querySql(let message) {
                   throw DatabaseHelperError.importFromJson(message: message)
                }
                // Loop on Table's Values
                for j in 0..<jsonSQLite.tables[i].values!.count {
                    // Check the row number of columns
                    let row: Array<UncertainValue<String,Int,Float>> = jsonSQLite.tables[i].values![j]

                    if(jsonNamesTypes.names.count != row.count) {
                        let message: String = """
                        importFromJson: Table \(jsonSQLite.tables[i].name) values row \(j
                        ) not correct length
                        """
                        throw DatabaseHelperError.importFromJson(message: message)
                    }
                    // Check the column's type before proceeding
                    let retTypes:Bool = checkColumnTypes (
                        types: jsonNamesTypes.types,values: row);
                    if(!retTypes) {
                        let message: String = """
                        importFromJson: Table \(jsonSQLite.tables[i].name) values row \(j
                        ) not correct types
                        """
                        throw DatabaseHelperError.importFromJson(message: message)
                    }
                    // Create INSERT or UPDATE Statements
                    var retisIdExists: Bool
                    do {
                        retisIdExists = try isIdExist(db: db,tableName:jsonSQLite.tables[i].name,
                        firstColumnName:jsonNamesTypes.names[0],key:row[0].value!)
                        
                    } catch DatabaseHelperError.isIdExists(let message) {
                       throw DatabaseHelperError.importFromJson(message: message)
                    }
                    var stmt: String
                    if(jsonSQLite.mode == "full" || (jsonSQLite.mode == "partial"
                        && !retisIdExists)) {
                        // Insert
                        let nameString: String = jsonNamesTypes.names.joined(separator:",")
                        let questionMarkString: String = createQuestionMarkString(length: jsonNamesTypes.names.count)
                        stmt = "INSERT INTO \(jsonSQLite.tables[i].name) (\(nameString)) VALUES (\(questionMarkString));"
                    } else {
                        // Update
                        let setString: String = setNameForUpdate(names: jsonNamesTypes.names);
                        if(setString.count == 0) {
                            let message: String = """
                            importFromJson: Table  \(jsonSQLite.tables[i].name) values row \(j
                            ) not set to String
                            """
                            throw DatabaseHelperError.importFromJson(message: message)
                        }
                        stmt = "UPDATE \(jsonSQLite.tables[i].name)  SET \(setString) WHERE "
                        stmt += "\(jsonNamesTypes.names[0]) = \(row[0].value!);"
                    }
                    let rowValues = getValuesFromRow(rowValues: row)
                    do {
                        changes = try prepareSQL(db: db,sql: stmt, values: rowValues)
                        if (changes == -1) {
                            success = false
                        }
                    } catch DatabaseHelperError.prepareSql(let message) {
                        throw DatabaseHelperError.importFromJson(message: message)
                    }
                }
            } else {
                success = false
            }
        }
        if(success) {
            let sql: String = "COMMIT TRANSACTION;"
            if sqlite3_exec(db,sql, nil, nil, nil) != SQLITE_OK {
                throw DatabaseHelperError.createTableData(message: "Error: Commit Transaction failed")
            }
        } else {
            changes = -1
        }
        if sqlite3_close_v2(db) != SQLITE_OK {
            throw DatabaseHelperError.createTableData(message: "Error: createTableData closing the database")
        }
        return changes
    }

    // MARK: - ImportFromJson - IsTable
    
    private func isTable(db: OpaquePointer, tableName: String) throws -> Bool {
        var ret: Bool = false
        var query = "SELECT name FROM sqlite_master WHERE type='table' AND name='"
        query.append(tableName)
        query.append("';")
        do {
            let resQuery: Array<Any> = try querySQL(db: db,sql: query,values: []);
            if(resQuery.count > 0) {ret = true}
        } catch DatabaseHelperError.querySql(let message) {
            throw DatabaseHelperError.querySql(message: message)
        }
        return ret
    }
    
    // MARK: - ImportFromJson - GetTableColumnNamesTypes
    
    private func getTableColumnNamesTypes(db: OpaquePointer,tableName: String) throws -> JsonNamesTypes {
        
        var ret: JsonNamesTypes = JsonNamesTypes(names:[],types:[])
        var query: String = "PRAGMA table_info("
        query.append(tableName)
        query.append(");")
        do {
            let resQuery =  try querySQL(db: db,sql:query,values:[]);
            if(resQuery.count > 0) {
                var names: Array<String> = []
                var types: Array<String> = []
                for i in 0..<resQuery.count {
                    names.append(resQuery[i]["name"] as! String)
                    types.append(resQuery[i]["type"] as! String)
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
    
    private func checkColumnTypes (types:Array <String>, values: Array<UncertainValue<String,Int,Float>>) -> Bool {
        var isRetType: Bool = true
        for i in 0..<values.count {
            if String(describing: values[i].value!).uppercased() != "NULL" {
                isRetType = isType(stype: types[i],avalue: values[i])
                if(!isRetType) {break}
            }
        }
        return isRetType
    }
    
    // MARK: - ImportFromJson - IsType
    
    private func isType(stype:String, avalue:UncertainValue<String,Int,Float>) -> Bool {
        var ret: Bool = false
        if stype == "NULL" && type(of: avalue.tValue!) == String.self { ret = true }
        if stype == "TEXT" && type(of: avalue.tValue!) == String.self { ret = true }
        if stype == "INTEGER" && type(of: avalue.uValue!) == Int.self {ret = true }
        if stype == "REAL" && type(of: avalue.vValue!) == Float.self { ret = true }
        if stype == "BLOB" && type(of: avalue.tValue!) == String.self { ret = true }
        return ret
    }
    
    // MARK: - ImportFromJson - IsIdExist
    
    private func isIdExist(db: OpaquePointer,tableName: String,firstColumnName: String,key: Any) throws -> Bool {
        var ret: Bool = false
        var query: String = "SELECT \(firstColumnName) FROM \(tableName) WHERE \(firstColumnName) = "
        if(type(of:key) == String.self) {
            query.append("'\(key)';")
        } else {
            query.append("\(key);")
        }
        do {
            let resQuery =  try querySQL(db: db,sql:query,values:[]);
            if(resQuery.count == 1) {
                ret = true
            }
        } catch DatabaseHelperError.querySql(let message) {
            throw DatabaseHelperError.isIdExists(message: "isIdExists: \(message)")
        }
        return ret
    }
    
    // MARK: - ImportFromJson - CreateQuestionMarkString
    
    private func createQuestionMarkString(length: Int) -> String {
        var retString: String = ""
        for _ in 0..<length {
            retString += "?,"
        }
        retString = String(retString.dropLast())
        return retString
    }
    
    // MARK: - ImportFromJson - GetValuesFromRow
    
    private func getValuesFromRow(rowValues:Array<UncertainValue<String,Int,Float>>) -> Array<Any> {
        var retArray: Array<Any> = []
        for i in 0..<rowValues.count {
            retArray.append(rowValues[i].value!)
        }
        return retArray
    }
        
    // MARK: - ImportFromJson - SetNameForUpdate
    
    private func setNameForUpdate(names: Array<String>) -> String {
        var retString: String = ""
        for i in 0..<names.count {
            retString += "\(names[i]) = ? ,"
        }
        retString = String(retString.dropLast())
        return retString
    }
}
