//
//  JsonSQLite.swift
//  CapacitorSqlite
//
//  Created by  Quéau Jean Pierre on 14/04/2020.
//

import Foundation

public struct JsonSQLite: Codable {
    let database: String
    let encrypted: Bool
    let mode: String
    let tables: [JsonTable]
    
    public func show() {
        print("databaseName: \(database) ")
        print("encrypted: \(encrypted) ")
        print("mode: \(mode) ")
        print("Number of Tables: \(tables.count) ")
        for table in tables {
            table.show();
        }
    }
}


struct JsonTable: Codable {
    let name: String
    let schema: [JsonColumn]?
    let indexes: [JsonIndex]?
    let values: [[UncertainValue<String,Int,Float>]]?
 
    public func show() {
        print("name: \(name) ")
        if((schema) != nil) {
            print("Number of schema: \(schema!.count) ")
            for sch in schema! {
                sch.show();
            }
        }
        if((indexes) != nil) {
            print("Number of indexes: \(indexes!.count) ")
            for idx in indexes! {
                idx.show();
            }
        }
        if((values) != nil) {
            print("Number of Values: \(values!.count) ")
            for val in values! {
                var row = [] as [Any]
                for v in val {
                    row.append(v.value!)
                }
                print("row: \(row) ")
            }
        }

    }
}

struct JsonColumn: Codable {
    let column: String
    let value: String
    
    public func show() {
        print("column: \(column) ")
        print("value: \(value) ")
    }
}

struct JsonIndex: Codable {
    let name: String
    let column: String
    
    public func show() {
        print("name: \(name) ")
        print("column: \(column) ")
    }
}

public struct UncertainValue<T: Codable, U: Codable, V: Codable>: Codable {
    public var tValue: T?
    public var uValue: U?
    public var vValue: V?

    public var value: Any? {
        return tValue ?? uValue ?? vValue
    }
    
    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        tValue = try? container.decode(T.self)
        uValue = try? container.decode(U.self)
        if(uValue == nil) {
            vValue = try? container.decode(V.self)
        }
        if tValue == nil && uValue == nil && vValue == nil {
            //Type mismatch
            throw DecodingError.typeMismatch(type(of: self), DecodingError.Context(codingPath: [], debugDescription: "The value is not of type \(T.self) not of type \(U.self) not even \(V.self)"))
        }
    }
}

public struct JsonNamesTypes {
    var names: Array<String>
    var types: Array<String>
}
