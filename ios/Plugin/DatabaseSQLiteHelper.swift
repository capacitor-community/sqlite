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
    case importFromJson(message:String)
    case tableNotExists(message:String)
    case isIdExists(message:String)
    case valuesToStringNull(message:String)
    case setToStringNull(message:String)
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
    
    func importFromJson(jsonSQLite:JsonSQLite) throws -> Int {
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

        // create the table's data
        if(success) {
            var statements: Array<String> = []
            statements.append("BEGIN TRANSACTION;")
            for i in 0..<jsonSQLite.tables.count {
    
                if( jsonSQLite.tables[i].values != nil && jsonSQLite.tables[i].values!.count > 0) {
                    // Check if table exists
                    do {
                        let isTab: Bool = try isTable(tableName: jsonSQLite.tables[i].name)

                        if(!isTab) {
                            let message: String = "importFromJson: Table " +
                            jsonSQLite.tables[i].name + " does not exist"
                            throw DatabaseHelperError.tableNotExists(message: message)
                        }
                    } catch DatabaseHelperError.selectSql(let message) {
                        throw DatabaseHelperError.importFromJson(message: message)
                    }

                    // Get the Column's Name and Type
                    var jsonNamesTypes: JsonNamesTypes = JsonNamesTypes(names:[],types:[])
                    do {
                        jsonNamesTypes = try getTableColumnNamesTypes(tableName: jsonSQLite.tables[i].name)
                    } catch DatabaseHelperError.selectSql(let message) {
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
                            retisIdExists = try isIdExists(tableName:jsonSQLite.tables[i].name,
                            firstColumnName:jsonNamesTypes.names[0],key:row[0].value!)
                            
                        } catch DatabaseHelperError.isIdExists(let message) {
                           throw DatabaseHelperError.importFromJson(message: message)
                        }
                        if(jsonSQLite.mode == "full" || (jsonSQLite.mode == "partial"
                            && !retisIdExists)) {
                            // Insert
                            var valuesString: String
                            do {
                                valuesString = try valuesToString(types:jsonNamesTypes.types,rowValues:row)
                                if(valuesString.count == 0) {
                                    let message: String = """
                                    importFromJson: Table  \(jsonSQLite.tables[i].name) values row \(j
                                    ) not convert to String
                                    """
                                    throw DatabaseHelperError.importFromJson(message: message)
                                }
                            } catch DatabaseHelperError.valuesToStringNull(let message) {
                                throw DatabaseHelperError.importFromJson(message: message)
                            }
                            let nameString: String = jsonNamesTypes.names.joined(separator:",")
                            var stmt: String = "INSERT INTO \(jsonSQLite.tables[i].name) (\(nameString)) "
                            stmt += "VALUES (\(valuesString));"
                            statements.append(stmt);
                        } else {
                            // Update
                            var setString: String
                            do {
                                setString = try setToString(types: jsonNamesTypes.types,
                                                        names: jsonNamesTypes.names,rowValues: row);
                                if(setString.count == 0) {
                                    let message: String = """
                                    importFromJson: Table  \(jsonSQLite.tables[i].name) values row \(j
                                    ) not set to String
                                    """
                                    throw DatabaseHelperError.importFromJson(message: message)
                                }

                            } catch DatabaseHelperError.setToStringNull(let message) {
                                throw DatabaseHelperError.importFromJson(message: message)
                            }
                            var stmt: String = "UPDATE \(jsonSQLite.tables[i].name)  SET \(setString) WHERE "
                            stmt += "\(jsonNamesTypes.names[0]) = \(row[0].value!);"
                            
                            statements.append(stmt);

                        }
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
                success = true // to be changed to false after testing
            }

        }
        
        if(!success) {
            changes = -1
        }
        return changes
    }
    
    private func isTable(tableName: String) throws -> Bool {
        var ret: Bool = false
        var query = "SELECT name FROM sqlite_master WHERE type='table' AND name='"
        query.append(tableName)
        query.append("';")
        do {
            let resQuery: Array<Any> = try selectSQL(sql: query,values: []);
            if(resQuery.count > 0) {ret = true}
        } catch DatabaseHelperError.selectSql(let message) {
            throw DatabaseHelperError.selectSql(message: message)
        }
        return ret
    }
    
    private func getTableColumnNamesTypes(tableName: String) throws -> JsonNamesTypes {
        
        var ret: JsonNamesTypes = JsonNamesTypes(names:[],types:[])
        var query: String = "PRAGMA table_info("
        query.append(tableName)
        query.append(");")
        do {
            let resQuery =  try selectSQL(sql:query,values:[]);
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
        } catch DatabaseHelperError.selectSql(let message) {
            throw DatabaseHelperError.selectSql(message: message)
        }

        return ret
    }
    private func checkColumnTypes (types:Array <String>, values: Array<UncertainValue<String,Int,Float>>) -> Bool {
        var isRetType: Bool = true
        for i in 0..<values.count {
            isRetType = isType(stype: types[i],avalue: values[i])
            if(!isRetType) {break}
        }
        return isRetType
    }
    private func isType(stype:String, avalue:UncertainValue<String,Int,Float>) -> Bool {
        var ret: Bool = false
        if(stype == "NULL" && type(of: avalue.tValue!) == String.self) { ret = true }
        if(stype == "TEXT" && type(of: avalue.tValue!) == String.self) { ret = true }
        if(stype == "INTEGER" && type(of: avalue.uValue!) == Int.self) { ret = true }
        if(stype == "REAL" && type(of: avalue.vValue!) == Float.self) { ret = true }
        if(stype == "BLOB" && type(of: avalue.tValue!) == String.self) { ret = true }
        return ret
    }
    private func isIdExists(tableName: String,firstColumnName: String,key: Any) throws -> Bool {
        var ret: Bool = false
        var query: String = "SELECT \(firstColumnName) FROM \(tableName) WHERE \(firstColumnName) = "
        query.append("\(key);")
        do {
            let resQuery =  try selectSQL(sql:query,values:[]);
            if(resQuery.count == 1) {
                ret = true
            }
        } catch DatabaseHelperError.selectSql(let message) {
            throw DatabaseHelperError.isIdExists(message: "isIdExists: \(message)")
        }
        return ret
    }
    private func valuesToString(types: Array<String> ,rowValues: Array<UncertainValue<String,Int,Float>>) throws -> String {
        var retString: String = ""
        for i in 0..<rowValues.count {
            if(types[i] == "TEXT") {
                retString += "'\(rowValues[i].tValue!)',"

             } else if(types[i] == "NULL") {
                if(rowValues[i].tValue!.prefix(4).uppercased() == "NULL") {
                    retString += "NULL,"
                } else {
                    throw DatabaseHelperError.valuesToStringNull(message:"Value should be of type NULL")
                }
                
            } else if(types[i] == "BLOB") {
                let data = Data(base64Encoded: rowValues[i].tValue!, options: .ignoreUnknownCharacters)
                retString += "\(data!),"
            } else {
                if(rowValues[i].tValue != nil && rowValues[i].tValue!.prefix(4).uppercased() == "NULL") {
                    retString += "NULL,"
                } else {
                    retString += "\(rowValues[i].value!),"
                }
            }
        }
        retString = String(retString.dropLast())
        return retString
    }
    private func setToString(types: Array<String> ,names: Array<String>,rowValues: Array<UncertainValue<String,Int,Float>>) throws -> String {
        var retString: String = ""
        for i in 0..<rowValues.count {
            if(types[i] == "TEXT") {
                retString += "\(names[i]) = '\(rowValues[i].tValue!)',"

             } else if(types[i] == "NULL") {
                if(rowValues[i].tValue!.prefix(4).uppercased() == "NULL") {
                    retString += "\(names[i]) = NULL,"
                } else {
                    throw DatabaseHelperError.setToStringNull(message:"Value should be of type NULL")
                }
                
            } else if(types[i] == "BLOB") {
                let data = Data(base64Encoded: rowValues[i].tValue!, options: .ignoreUnknownCharacters)
                retString += "\(names[i]) = \(data!),"
            } else {
                if(rowValues[i].tValue != nil && rowValues[i].tValue!.prefix(4).uppercased() == "NULL") {
                    retString += "\(names[i]) = NULL,"
                } else {
                    retString += "\(names[i]) = \(rowValues[i].value!),"
                }
            }
        }
        retString = String(retString.dropLast())
        return retString
    }
}

