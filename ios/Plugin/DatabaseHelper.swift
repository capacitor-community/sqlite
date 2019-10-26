//
//  DatabaseHelper.swift
//  sqlitestorage
//
//  Created by  Quéau Jean Pierre on 14/10/2019.
//  Copyright © 2019  Quéau Jean Pierre. All rights reserved.
//

import Foundation

import SQLite

enum DatabaseHelperError: Error {
    case dbConnection(message:String)
    case execSql(message:String)
    case runSql(message:String)
    case selectSql(message:String)
    case deleteDB(message:String)
}
class DatabaseHelper {
    // define the path for the database
    let path: String = NSSearchPathForDirectoriesInDomains(
        .documentDirectory, .userDomainMask, true
        ).first!
    var databaseName: String

    init(databaseName: String) {
        print("databaseName: \(databaseName) ")
        print("path: \(path)")
        self.databaseName = databaseName
        // connect to the database (create if doesn't exist)
        guard (try? Connection("\(path)/\(databaseName)")) != nil else {
            print("Error: DB connection")
            return;
        }
        print("Database created")
        return;
    }
    
    func getWritableDatabase() throws -> Connection? {
        guard let db = try? Connection("\(path)/\(databaseName)") else { throw DatabaseHelperError.dbConnection(message:"Error: DB connection")}
        return db
    }
    func getReadableDatabase() throws -> Connection? {
        guard let db = try? Connection("\(path)/\(databaseName)", readonly: true) else { throw DatabaseHelperError.dbConnection(message:"Error: DB connection")}
        return db
    }
    func execSQL(sql:String) throws -> Int {
        guard let db: Connection = try getWritableDatabase() else {
            throw DatabaseHelperError.dbConnection(message:"Error: DB connection")
        }
        do {
            try db.execute(sql)
            return db.changes
        } catch let error {
            throw DatabaseHelperError.execSql(message: "Error: execSQL failed: \(error)")
        }
    }
    func runSQL(sql:String,values: Array<Any>) throws -> Int {
        guard let db: Connection = try getWritableDatabase() else {
            throw DatabaseHelperError.dbConnection(message:"Error: DB connection")
        }
        do {
            if !values.isEmpty {
                var bindings: [Binding] = []
                for value in values {
                    bindings.append(value as! Binding)
                }
                let stmt = try db.prepare(sql)
                try stmt.run(bindings)
                return db.changes
            } else {
                try db.run(sql)
                return db.changes
            }
            
        } catch let error {
            throw DatabaseHelperError.runSql(message: "Error: runSQL failed: \(error)")
        }
    }

    func selectSQL(sql:String,values: Array<String>) throws -> Array<[String: Any]> {
        guard let db: Connection = try getReadableDatabase() else {
            throw DatabaseHelperError.dbConnection(message:"Error: DB connection")
        }
        do {
            let stmt:Statement
            if !values.isEmpty {
                var bindings: [Binding] = []
                for value in values {
                    bindings.append(value as Binding)
                }
                stmt = try db.prepare(sql,bindings)

            } else {
                stmt = try db.prepare(sql)
            }
            var result: Array<[String: Any]> = []
            for row in stmt {
                var rowData: [String: Any] = [:]
                for(index,name) in stmt.columnNames.enumerated() {
                    rowData[(name)] = row[index]
                }
                result.append(rowData)
            }
            return result;
        } catch let error {
            throw DatabaseHelperError.selectSql(message: "Error: selectSQL failed: \(error)")
        }
    }
    
    func deleteDB(databaseName:String) throws {
        if let dir = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first{
            let fileURL = dir.appendingPathComponent(databaseName)
            let isFileExists = FileManager.default.fileExists(atPath: fileURL.path)
            if(isFileExists) {
                do {
                    try FileManager.default.removeItem(at: fileURL)
                    print("Database \(databaseName) deleted")
                } catch {
                    throw DatabaseHelperError.deleteDB(message: "Error: deleteDB: \(error)")
                }
            } else {
                throw DatabaseHelperError.deleteDB(message: "Error: deleteDB: Database does not exist")
            }
        }
    }
    
}
