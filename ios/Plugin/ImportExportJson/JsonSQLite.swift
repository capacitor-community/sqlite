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
    var overwrite: Bool?
    let encrypted: Bool
    let mode: String
    let tables: [JsonTable]
    var views: [JsonView]?

    public func show() {
        print("databaseName: \(database) ")
        print("version: \(version) ")
        var mOverwrite = false
        if let mOver = overwrite {
            mOverwrite = mOver
        }
        print("overwrite: \(mOverwrite) ")
        print("encrypted: \(encrypted) ")
        print("mode: \(mode) ")
        print("Number of Tables: \(tables.count) ")
        for table in tables {
            table.show()
        }
        if let mViews = views {
            print("Number of Views: \(mViews.count) ")
            for view in mViews {
                view.show()
            }
        }
    }
}

public struct JsonTable: Codable {
    let name: String
    var schema: [JsonColumn]?
    var indexes: [JsonIndex]?
    var triggers: [JsonTrigger]?
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
        if let mTriggers = triggers {
            print("Number of triggers: \(mTriggers.count) ")
            for trg in mTriggers {
                trg.show()
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
                        row.append(NSNull())
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
                print("mode: \(mMode.uppercased()) ")
            }
        }
    }
}
public struct JsonTrigger: Codable {
    var name: String
    let timeevent: String
    var condition: String?
    let logic: String

    public func show() {
        print("name: \(name) ")
        print("timeevent: \(timeevent) ")
        if let mCondition = condition {
            print("condition: \(mCondition) ")
        }
        print("logic: \(logic) ")
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
    }
}
public struct JsonView: Codable {
    let name: String
    let value: String

    public func show() {
        print("name: \(name) ")
        print("value: \(value) ")
    }
}

public struct JsonNamesTypes {
    var names: [String]
    var types: [String]
}
