//
//  JsonSQLite.swift
//  CapacitorSqlite
//
//  Created by  Quéau Jean Pierre on 14/04/2020.
//

import Foundation

public struct JsonSQLite: Codable {
    let database: String
    let version: Int
    let encrypted: Bool
    let mode: String
    let tables: [JsonTable]

    public func show() {
        print("databaseName: \(database) ")
        print("version: \(version) ")
        print("encrypted: \(encrypted) ")
        print("mode: \(mode) ")
        print("Number of Tables: \(tables.count) ")
        for table in tables {
            table.show()
        }
    }
}

public struct JsonTable: Codable {
    let name: String
    var schema: [JsonColumn]?
    var indexes: [JsonIndex]?
    var values: [[UncertainValue<String, Int, Float>]]?

    public func show() {
        print("name: \(name) ")
        if let mSchema = schema {
            print("Number of schema: \(mSchema.count) ")
            for sch in mSchema {
                sch.show()
            }

        }
        if let mIndexes = indexes {
            print("Number of indexes: \(mIndexes.count) ")
            for idx in mIndexes {
                idx.show()
            }
        }
        if let mValues = values {
            print("Number of Values: \(mValues.count) ")
            for val in mValues {
                var row = [] as [Any]
                for vItem in val {
                    if let tvItem = vItem.value {
                        row.append(tvItem)
                    } else {
                        row.append("NULL")
                    }
                }
                print("row: \(row) ")
            }
        }
    }
}

public struct JsonColumn: Codable {
    var column: String?
    let value: String
    var foreignkey: String?

    public func show() {
        if let mColumn = column {
            print("column: \(mColumn) ")
        }
        if let mForeignkey = foreignkey {
            print("foreignkey: \(mForeignkey) ")
        }
        print("value: \(value) ")
    }
}

public struct JsonIndex: Codable {
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
        if uValue == nil {
            vValue = try? container.decode(V.self)
        }
        if tValue == nil && uValue == nil && vValue == nil {
            //Type mismatch
            throw DecodingError.typeMismatch(type(of: self), DecodingError.Context(codingPath: [],
                debugDescription: "The value is not of type \(T.self) not of type \(U.self) not even \(V.self)"))
        }
    }
}

public struct JsonNamesTypes {
    var names: [String]
    var types: [String]
}
