//
//  JsonSQLite.swift
//  Plugin
//
//  Created by  Quéau Jean Pierre on 18/01/2021.
//  Copyright © 2021 Max Lynch. All rights reserved.
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
    var values: [[UncertainValue<String, Int, Double>]]?

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
    var constraint: String?

    public func show() {
        if let mColumn = column {
            print("column: \(mColumn) ")
        }
        if let mForeignkey = foreignkey {
            print("foreignkey: \(mForeignkey) ")
        }
        if let mConstraint = constraint {
            print("constraint: \(mConstraint) ")
        }
        print("value: \(value) ")
    }
}

public struct JsonIndex: Codable {
    let name: String
    let value: String
    let mode: String?

    public func show() {
        print("name: \(name) ")
        print("value: \(value) ")
        if let mMode = mode {
            if mMode.count > 0 {
                print("mode: \(mMode) ")
            }
        }
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
            let msg: String = "The value is not of type \(T.self) not of type \(U.self) not even \(V.self)"
            throw DecodingError.typeMismatch(type(of: self), DecodingError.Context(codingPath: [],
                                                                                   debugDescription: msg))
        }
    }
}

public struct JsonNamesTypes {
    var names: [String]
    var types: [String]
}
