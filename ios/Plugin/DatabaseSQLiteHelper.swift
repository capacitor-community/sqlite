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
    case execute(message:String)
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
    case createSyncTable(message:String)
    case createSyncDate(message:String)
    case createExportObject(message:String)
    case exportToJson(message:String)
    case getSyncDate(message:String)
    case getTablesModified(message:String)
    case createSchema(message:String)
    case createIndexes(message:String)
    case createValues(message:String)

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
    var mode: String
    
    // MARK: - Init
    
    init(databaseName: String, encrypted:Bool = false, mode: String = "no-encryption", secret:String = "", newsecret:String = "") throws {
        print("databaseName: \(databaseName) ")
        print("path: \(path)")
        self.secret = secret
        self.newsecret = newsecret
        self.encrypted = encrypted
        self.databaseName = databaseName
        self.mode = mode

        // connect to the database (create if doesn't exist)
        
        var db: OpaquePointer?
        if !self.encrypted && self.mode == "no-encryption" {

            do {
                try db = UtilsSQLite.connection(filename: "\(path)/\(self.databaseName)")
                isOpen = true
            } catch {
                let error:String = "init: Error Database connection failed"
                print(error)
                throw UtilsSQLiteError.connectionFailed
            }
        } else if self.encrypted && self.mode == "secret" && self.secret.count > 0 {
            do {
                try db = UtilsSQLite.connection(filename: "\(path)/\(self.databaseName)",readonly: false,key: self.secret)
                self.isOpen = true
            } catch {
                if(self.secret == "wrongsecret") {
                    let error:String = "init: Error Database connection failed wrong secret"
                    print(error)
                    self.isOpen = false
                    throw UtilsSQLiteError.connectionFailed
                } else {
                    // test if you can open it with the new secret in case of multiple runs
                    do {
                        try db = UtilsSQLite.connection(filename: "\(path)/\(self.databaseName)",readonly: false,key: self.newsecret)
                        self.secret = self.newsecret
                        self.isOpen = true

                    } catch {
                        let error:String = "init: Error Database connection failed wrong secret"
                        print(error)
                        self.isOpen = false
                        throw UtilsSQLiteError.connectionFailed
                    }
                }
            }

        } else if self.encrypted && self.mode == "newsecret" && self.secret.count > 0 && self.newsecret.count > 0 {
                do {
                    try db = UtilsSQLite.connection(filename: "\(path)/\(self.databaseName)",readonly: false,key: self.secret)
                    
                    let keyStatementString = """
                    PRAGMA rekey = '\(self.newsecret)';
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
                    self.secret = self.newsecret
                    self.isOpen = true

                } catch {
                    let error:String = "init: Error Database connection failed wrong secret"
                    print(error)
                    throw UtilsSQLiteError.wrongSecret
                }
        } else if self.encrypted && self.mode == "encryption" && self.secret.count > 0 {
            var res: Bool = false
            do {
                try res = UtilsSQLite.encryptDatabase(fileName: self.databaseName,secret:self.secret)
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
        var changes: Int
        do {
            changes = try execute(db: db,sql: sql)
        } catch DatabaseHelperError.execute(let message) {
            throw DatabaseHelperError.execSql(message: "Error: execSQL \(message)")
        }
 
        if sqlite3_close_v2(db) != SQLITE_OK {
            throw DatabaseHelperError.execSql(message: "Error: execSQL closing the database")
        }
        return changes
    }
    
    // MARK: - Execute
    
    func execute(db: OpaquePointer,sql:String) throws -> Int {
        if sqlite3_exec(db,sql, nil, nil, nil) != SQLITE_OK {
            throw DatabaseHelperError.execute(message: "Error: execute failed")
        }
        let changes: Int = Int(sqlite3_total_changes(db))
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
            print("selectSQL: \(result)")
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
                        columnNames.append(String(cString: name))
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
            jsonSQLite.show();
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
    
    // MARK: - ExportToJson
    
    func exportToJson(expMode: String) throws -> [String:Any] {
        var retObj: [String:Any] = [:]
        
        do {
            retObj = try createExportObject(expMode:expMode)
        } catch DatabaseHelperError.createExportObject(let message) {
           throw DatabaseHelperError.exportToJson(message: message)
        }
        return retObj
    }
    
    
    // MARK: - CreateSyncTable
    
    func createSyncTable() throws -> Int {
        var retObj: Int = -1
        // Open the database for writing
        guard let db: OpaquePointer = try UtilsSQLite.getWritableDatabase(filename: "\(path)/\(databaseName)",
                    secret:secret) else {
            throw DatabaseHelperError.dbConnection(message:"Error: DB connection")
        }
        // check if the table has already been created
        do {
            let isExists: Bool = try isTableExists(db: db,tableName: "sync_table");
            if(!isExists) {
                let date = Date()
                let syncTime: Int = Int(date.timeIntervalSince1970)
                let stmt: String = """
                BEGIN TRANSACTION;
                CREATE TABLE IF NOT EXISTS sync_table (
                id INTEGER PRIMARY KEY NOT NULL,
                sync_date INTEGER);
                INSERT INTO sync_table (sync_date) VALUES ('\(syncTime)');
                COMMIT TRANSACTION;
                """
                retObj = try execute(db: db,sql: stmt)
            } else {
                retObj = 0
            }
        } catch DatabaseHelperError.tableNotExists(let message) {
            throw DatabaseHelperError.createSyncTable(message: message)
        } catch DatabaseHelperError.prepareSql(let message) {
            throw DatabaseHelperError.createSyncTable(message: message)
        }
        if sqlite3_close_v2(db) != SQLITE_OK {
            throw DatabaseHelperError.selectSql(message: "Error: createSyncTable closing the database")
        }
        return retObj
    }
    
    // MARK: - SetSyncDate
    
    func setSyncDate(syncDate: String ) throws -> Bool {
        var retBool: Bool = false;
        // Open the database for writing
        guard let db: OpaquePointer = try UtilsSQLite.getWritableDatabase(filename: "\(path)/\(databaseName)",
                    secret:secret) else {
            throw DatabaseHelperError.dbConnection(message:"Error: DB connection")
        }
        do {
//            let dateFormatter : DateFormatter = DateFormatter()
//            dateFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSZ"
            let date = Date()
//            let dateString = dateFormatter.string(from: date)
            let syncTime: Int = Int(date.timeIntervalSince1970)
            let stmt: String = "UPDATE sync_table SET sync_date = \(syncTime) WHERE id = 1;"
            let changes: Int = try prepareSQL(db: db,sql: stmt, values: [])
            if(changes != -1) {retBool = true}

        } catch DatabaseHelperError.prepareSql(let message) {
            throw DatabaseHelperError.createSyncDate(message: message)
        }
        if sqlite3_close_v2(db) != SQLITE_OK {
            throw DatabaseHelperError.selectSql(message: "Error: createSyncTable closing the database")
        }

        return retBool
    }
    
    // MARK: - ImportFromJson - CreateDatabaseSchema
    
    private func createDatabaseSchema(jsonSQLite:JsonSQLite) throws -> Int {
        var success: Bool = true
        var changes: Int = -1
        // Set PRAGMAS
        let pragmas: String = "PRAGMA user_version = 1;\nPRAGMA foreign_keys = ON;"
        do {
            changes = try execSQL(sql: pragmas)
            if (changes == -1) {
                return changes
            }
        } catch DatabaseHelperError.execSql(let message) {
            throw DatabaseHelperError.importFromJson(message: message)
        }
        print("*** PRAGMAS DONE ***")

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
                    if(jsonSQLite.tables[i].schema![j].column != nil) {
                        stmt.append(jsonSQLite.tables[i].schema![j].column!)
                    } else if(jsonSQLite.tables[i].schema![j].foreignkey != nil) {
                        stmt.append("FOREIGN KEY (\( jsonSQLite.tables[i].schema![j].foreignkey!))")
                    }
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
            changes = 0
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
        var isValue: Bool = false;
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
                    let isTab: Bool = try isTableExists(db: db, tableName: jsonSQLite.tables[i].name)

                    if(!isTab) {
                        let message: String = "createTableData: Table " +
                        jsonSQLite.tables[i].name + " does not exist"
                        throw DatabaseHelperError.createTableData(message: message)
                    }
                } catch DatabaseHelperError.tableNotExists(let message) {
                    throw DatabaseHelperError.createTableData(message: message)
                }

                // Get the Column's Name and Type
                var jsonNamesTypes: JsonNamesTypes = JsonNamesTypes(names:[],types:[])
                do {
                    jsonNamesTypes = try getTableColumnNamesTypes(db: db,tableName: jsonSQLite.tables[i].name)
                } catch DatabaseHelperError.querySql(let message) {
                   throw DatabaseHelperError.importFromJson(message: message)
                }
                isValue = true;
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
            }
        }
        if(success && isValue) {
            let sql: String = "COMMIT TRANSACTION;"
            print("**** sql create table value \(sql)")
            if sqlite3_exec(db,sql, nil, nil, nil) != SQLITE_OK {
                throw DatabaseHelperError.createTableData(message: "Error: Commit Transaction failed")
            }
        } else {
            if(!isValue) {
                changes = 0
            } else {
                changes = -1
            }
        }
        if sqlite3_close_v2(db) != SQLITE_OK {
            throw DatabaseHelperError.createTableData(message: "Error: createTableData closing the database")
        }
        return changes
    }

    // MARK: - ImportFromJson - IsTableExists
    
    private func isTableExists(db: OpaquePointer, tableName: String) throws -> Bool {
        var ret: Bool = false
        var query = "SELECT name FROM sqlite_master WHERE type='table' AND name='"
        query.append(tableName)
        query.append("';")
        do {
            let resQuery: Array<Any> = try querySQL(db: db,sql: query,values: []);
            if(resQuery.count > 0) {ret = true}
        } catch DatabaseHelperError.querySql(let message) {
            throw DatabaseHelperError.tableNotExists(message: message)
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
    
    // MARK: - ExportToJson - CreateExportObject
    
    private func createExportObject(expMode: String) throws -> [String:Any] {
        var retObj: [String:Any] = [:]
        guard let db: OpaquePointer = try UtilsSQLite.getReadableDatabase(filename: "\(path)/\(databaseName)",
                    secret:secret) else {
            throw DatabaseHelperError.createExportObject(message:"Error: DB connection")
        }
        retObj["database"] = self.databaseName.dropLast(9)
        retObj["encrypted"] = self.encrypted
        retObj["mode"] = expMode
        var tables: Array<[String: Any]> = []
        var syncDate: Int64 = 0
        // get the table's name
        var query: String = "SELECT name,sql FROM sqlite_master WHERE type = 'table' ";
        query.append("AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'sync_table';");
        do {
            let resTables =  try querySQL(db: db,sql:query,values:[]);
            if(resTables.count > 0) {
                var modTables: [String:String] = [:]
                var modTablesKeys: [String] = []
                // get the sync date if expMode = "partial"
                if(expMode == "partial") {
                    syncDate = try getSyncDate(db: db)
                    if(syncDate == -1 ) {
                        throw DatabaseHelperError.createExportObject(message:"Error did not find a sync_date")
                    }
                    // TODO Get Modified Tables
                    modTables = try getTablesModified(db: db,tables: resTables,syncDate: syncDate);
                    modTablesKeys.append(contentsOf: modTables.keys)

                }
                for i in 0..<resTables.count {

                    let tableName: String = resTables[i]["name"] as! String
                    let sqlStmt: String = resTables[i]["sql"] as! String
                    
                    if(expMode == "partial" && (modTablesKeys.count == 0 ||
                        !modTablesKeys.contains(tableName) ||
                            modTables[tableName] == "No")) {
                        continue;
                    }
                    var table: [String:Any] = [:]
                    table["name"] = tableName
                    var isSchema: Bool  = false;
                    var isIndexes: Bool = false;
                    var isValues: Bool = false;
                    if(expMode == "full" ||
                        (expMode == "partial" && modTables[tableName] == "Create")) {
                        
                        // create schema
                        let schema: Array<[String: String]> = try createSchema(stmt: sqlStmt)
                        if schema.count > 0  {
                            let eSchema = try! JSONEncoder().encode(schema)
                            var eSchemaString: String { return String(data: eSchema, encoding: .utf8)! }
                            if(eSchemaString.count > 0 ) {
                                table["schema"] = schema
                                isSchema = true
                            }
                        }

                        // create indexes
                        let indexes: Array<[String: String]> = try createIndexes(db:db,tableName:tableName)
                        if indexes.count > 0  {
                           let eIndexes = try! JSONEncoder().encode(indexes)
                           var eIndexesString: String { return String(data: eIndexes, encoding: .utf8)! }
                           if(eIndexesString.count > 0 ) {
                               table["indexes"] = indexes
                               isIndexes = true
                           }
                        }
                    }
 
                    let jsonNamesTypes: JsonNamesTypes = try getTableColumnNamesTypes(db: db,tableName: tableName);
                    
                    let rowNames = jsonNamesTypes.names
                    let rowTypes = jsonNamesTypes.types
                    
                    // create the table data
                    var query: String
                    if(expMode == "full" ||
                                    (expMode == "partial" &&
                                    modTables[tableName] == "Create")) {
                        query = "SELECT * FROM \(tableName);";
                    } else {
                        query = "SELECT * FROM \(tableName) WHERE last_modified > \(syncDate);";
                    }

                    let values : Array<Array<Any>> = try createValues(db:db, query:query, names:rowNames, types:rowTypes)
                    if values.count > 0  {
                        table["values"] = values
                        isValues = true
                    }

                    table["values"] = values
                    
                    // check the table object validity
                    var tableKeys: [String] = []
                    tableKeys.append(contentsOf: table.keys)

                    if(tableKeys.count < 1 ||
                            (!isSchema && !isIndexes && !isValues)) {
                        throw DatabaseHelperError.createExportObject(message:"Error table is not a jsonTable")
                    }

                    tables.append(table)
                }
            }
        } catch DatabaseHelperError.querySql(let message) {
            throw DatabaseHelperError.createExportObject(message: "Error get table's names failed : \(message)")
        } catch DatabaseHelperError.getTablesModified(let message) {
            throw DatabaseHelperError.createExportObject(message: "Error get table's modified failed : \(message)")
        } catch DatabaseHelperError.createSchema(let message) {
            throw DatabaseHelperError.createExportObject(message: "Error create schema failed : \(message)")
        } catch DatabaseHelperError.createValues(let message) {
            throw DatabaseHelperError.createExportObject(message: "Error create values failed : \(message)")
        } catch DatabaseHelperError.createIndexes(let message) {
            throw DatabaseHelperError.createExportObject(message: "Error create indexes failed : \(message)")
               }

        retObj["tables"] = tables
        
        return retObj
    }
    
    // MARK: - ExportToJson - GetSyncDate
    
    private func getSyncDate(db: OpaquePointer) throws -> Int64 {
        var ret: Int64 = -1
        let query: String = "SELECT sync_date FROM sync_table;"
        do {
            let resSyncDate =  try querySQL(db: db,sql:query,values:[]);
            if(resSyncDate.count > 0) {
                let res: Int64 = resSyncDate[0]["sync_date"]  as! Int64
                if(res > 0) {ret = res}
            }

        } catch DatabaseHelperError.querySql(let message) {
            throw DatabaseHelperError.getSyncDate(message: "Error get sync date failed : \(message)")
        }
        
        return ret
    }
    
    // MARK: - ExportToJson - GetTablesModified
    
    private func getTablesModified(db:OpaquePointer, tables: [[String:Any]], syncDate: Int64) throws -> [String:String] {
        var retObj: [String:String] = [:]
        if (tables.count > 0) {
            for i in 0..<tables.count {
                var mode: String
                // get total count of the table
                let tableName: String = tables[i]["name"] as! String
                var query: String = "SELECT count(*) FROM " + tableName + ";";
                do {
                    var resQuery =  try querySQL(db: db,sql:query,values:[]);
                    if(resQuery.count != 1) {
                        break;
                    } else {
                        let totalCount: Int = resQuery[0]["count(*)"]  as! Int
                        query = "SELECT count(*) FROM \(tableName) WHERE last_modified > "
                        query.append("\(syncDate);");
                        resQuery =  try querySQL(db: db,sql:query,values:[]);
                        if(resQuery.count != 1) {
                            break;
                        } else {
                            let totalModifiedCount: Int = (resQuery[0]["count(*)"]  as? Int)!
                            if (totalModifiedCount == 0) {
                                mode = "No";
                            } else if (totalCount == totalModifiedCount) {
                                mode = "Create";
                            } else {
                                mode = "Modified";
                            }
                            retObj[tableName] = mode
                        }
                    }
                } catch DatabaseHelperError.querySql(let message) {
                    throw DatabaseHelperError.getTablesModified(message: "Error get modified tables failed : \(message)")
                }
            }
        }
        return retObj
    }
    
    // MARK: - ExportToJson - CreateSchema
    
    private func createSchema(stmt: String) throws -> Array<[String: String]> {
        var retSchema: Array<[String: String]> = []
        // get the sqlStmt between the parenthesis sqlStmt
        if let openPar = stmt.firstIndex(of: "(") {
            if let closePar = stmt.lastIndex(of: ")") {
                let sqlStmt: String = String(stmt[stmt.index(after: openPar)..<closePar])
                let sch: [String] = sqlStmt.components(separatedBy: ",")
                for i in 0..<sch.count {
                    let rstr: String = sch[i].trimmingCharacters(in: .whitespacesAndNewlines)
                    var row = rstr.split(separator: " ",maxSplits: 1)
                    if( row.count == 2) {
                        var columns: [String:String] = [:]
                        if(String(row[0]).uppercased() != "FOREIGN") {
                            columns["column"] =  String(row[0])
                        } else {
                            let oPar = rstr.firstIndex(of: "(")
                            let cPar = rstr.firstIndex(of: ")")
                            row[0] = rstr[rstr.index(after: oPar!)..<cPar!]
                            row[1] = rstr[rstr.index(cPar!,offsetBy:2)..<rstr.endIndex]
                            print("row[0] \(row[0]) row[1] \(row[1]) ")
                            columns["foreignkey"] = String(row[0])
                        }
                        columns["value"] = String(row[1])
                        retSchema.append(columns)
                    } else {
                        throw DatabaseHelperError.createSchema(message: "Query result not well formatted")
                    }
                }
            } else {
                throw DatabaseHelperError.createSchema(message: "No ')' in the query result")
            }
        } else {
            throw DatabaseHelperError.createSchema(message: "No '(' in the query result")
        }
        return retSchema
    }
    
    // MARK: - ExportToJson - CreateIndexes
    
    private func createIndexes(db:OpaquePointer,tableName:String) throws -> Array<[String: String]> {
        var retIndexes: Array<[String: String]> = []
        var query = "SELECT name,tbl_name,sql FROM sqlite_master WHERE ";
        query.append("type = 'index' AND tbl_name = '\(tableName)' AND sql NOTNULL;");
        do {
            let resIndexes =  try querySQL(db: db,sql:query,values:[]);
            if(resIndexes.count > 0) {
                for i in 0..<resIndexes.count {
                    var row: [String:String] = [:]
                    let keys: [String] = Array(resIndexes[i].keys)
                    if(keys.count == 3) {
                        if(resIndexes[i]["tbl_name"] as! String == tableName) {
                            let sql: String = resIndexes[i]["sql"] as! String
                            let oPar = sql.lastIndex(of:"(")
                            let cPar = sql.lastIndex(of:")")
                            row["column"] = String(sql[sql.index(after: oPar!)..<cPar!])
                            row["name"] = (resIndexes[i]["name"] as! String)
                            retIndexes.append(row)
                        } else {
                            throw DatabaseHelperError.createIndexes(message: "Error indexes table name doesn't match ")
                        }
                    } else {
                        throw DatabaseHelperError.createIndexes(message: "Error No indexes key found ")
                    }
                }
            }
        } catch DatabaseHelperError.querySql(let message) {
            throw DatabaseHelperError.createIndexes(message: "Error query indexes failed : \(message)")
        }
    
        return retIndexes
    }
    
    // MARK: - ExportToJson - CreateValues
    
    private func createValues(db:OpaquePointer, query: String, names:Array<String>, types:Array<String>) throws -> Array<Array<Any>> {
        var retValues: Array<Array<Any>> = []
 
        do {
            let resValues =  try querySQL(db: db,sql:query,values:[]);
            if(resValues.count > 0) {
                for i in 0..<resValues.count {
                    var row: Array<Any> = []
                    for j in 0..<names.count {
                        if types[j] == "INTEGER" {
                            if((resValues[i][names[j]] as! Int64) != 0) {
                                row.append(resValues[i][names[j]] as! Int64 )
                            } else {
                                row.append("NULL")
                            }
                        } else if types[j] == "REAL" {
                                if((resValues[i][names[j]] as! Double) != 0) {
                                row.append(resValues[i][names[j]] as! Double )
                            } else {
                                row.append("NULL")
                            }
                        } else {
                            if((resValues[i][names[j]] as! String).count > 1) {
                                row.append(resValues[i][names[j]] as! String )
                            } else {
                                row.append("NULL")
                            }
                        }
                    }
                    retValues.append(row)
                }
            }
        } catch DatabaseHelperError.querySql(let message) {
            throw DatabaseHelperError.createValues(message: "Error query values failed : \(message)")
        }

        return retValues
    }
}
