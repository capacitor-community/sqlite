//
//  ImportData.swift
//  CapacitorCommunitySqlite
//
//  Created by  Quéau Jean Pierre on 23/07/2023.
//

import Foundation

// swiftlint:disable file_length
public class ImportData {
    var jsonSQLite: [JsonSQLite]
    var jsonDict: [String: Any]

    init(jsonSQLite: JsonSQLite) {
        self.jsonSQLite = [jsonSQLite]
        self.jsonDict = [:]
    }
    init(jsonDict: [String: Any]) {
        self.jsonSQLite = []
        self.jsonDict = jsonDict
    }

    var database: String {
        var mDatabase = ""
        mDatabase = jsonSQLite.count > 0 ? jsonSQLite[0].database : ""
        if !jsonDict.isEmpty {
            if let mDBName = jsonDict["database"] as? String {
                mDatabase = mDBName
            }
        }
        return mDatabase
    }
    var mode: String {
        var mMode = ""
        mMode = jsonSQLite.count > 0 ? jsonSQLite[0].mode : ""
        if !jsonDict.isEmpty {
            if let nMode = jsonDict["mode"] as? String {
                mMode = nMode
            }
        }
        return mMode
    }
    var encrypted: Bool {
        var mEnc = false
        mEnc = jsonSQLite.count > 0 ? jsonSQLite[0].encrypted : false
        if !jsonDict.isEmpty {
            if let nEnc = jsonDict["encrypted"] as? Bool {
                mEnc = nEnc
            }
        }
        return mEnc
    }
    var overwrite: Bool {
        var mOve = false
        if jsonSQLite.count > 0 {
            if let nOve = jsonSQLite[0].overwrite {
                mOve = nOve
            }
        }

        if !jsonDict.isEmpty {
            if let nOve = jsonDict["overwrite"] as? Bool {
                mOve = nOve
            }
        }
        return mOve
    }
    var version: Int {
        var mVer = 1
        mVer = jsonSQLite.count > 0 ? jsonSQLite[0].version : 1
        if !jsonDict.isEmpty {
            if let nVer = jsonDict["version"] as? Int {
                mVer = nVer
            }
        }
        return mVer
    }
    var tables: [ImportTable] {
        var fTab: [ImportTable] = []
        if jsonSQLite.count > 0 {
            let mTables = jsonSQLite[0].tables
            for table in mTables {
                let mTab: ImportTable = ImportTable(jsonTable: [table])
                fTab.append(mTab)
            }
        }
        if !jsonDict.isEmpty {
            if let mTables = jsonDict["tables"] as? [[String: Any]] {
                for table in mTables {
                    let mTab: ImportTable = ImportTable(tableDict: table)
                    fTab.append(mTab)
                }
            }
        }
        return fTab
    }
    var views: [ImportView]? {
        var fView: [ImportView] = []
        if jsonSQLite.count > 0 {
            if let mViews = jsonSQLite[0].views {
                for view in mViews {
                    let mVw: ImportView = ImportView(jsonView: [view])
                    fView.append(mVw)
                }
            }
        }
        if !jsonDict.isEmpty {
            if let mViews = jsonDict["views"] as? [[String: Any]] {
                for view in mViews {
                    let mVw: ImportView = ImportView(viewDict: view)
                    fView.append(mVw)
                }
            }
        }
        return fView
    }
}
public class ImportTable {
    var jsonTable: [JsonTable]
    var tableDict: [String: Any]

    init(jsonTable: [JsonTable]) {
        self.jsonTable = jsonTable
        self.tableDict = [:]
    }
    init(tableDict: [String: Any]) {
        self.jsonTable = []
        self.tableDict = tableDict
    }

    var name: String {
        var mName = ""
        mName = jsonTable.count > 0 ? jsonTable[0].name : ""
        if !tableDict.isEmpty {
            if let nName = tableDict["name"] as? String {
                mName = nName
            }
        }
        return mName
    }

    var schema: [ImportColumn]? {
        var mSchema: [ImportColumn] = []
        if jsonTable.count > 0 {
            if let nSchema = jsonTable[0].schema {
                for schm in nSchema {
                    let nSchm: ImportColumn = ImportColumn(jsonColumn: [schm])
                    mSchema.append(nSchm)
                }
            }

        }
        if !tableDict.isEmpty {
            if let nSchema = tableDict["schema"] as? [[String: Any]] {
                for schm in nSchema {
                    let nSchm: ImportColumn =
                        ImportColumn(columnDict: schm)
                    mSchema.append(nSchm)
                }
            }
        }
        return mSchema
    }
    var indexes: [ImportIndex]? {
        var mIndexes: [ImportIndex] = []
        if jsonTable.count > 0 {
            if let nIndexes = jsonTable[0].indexes {
                for nIdx in nIndexes {
                    let nIndex: ImportIndex = ImportIndex(jsonIndex: [nIdx])
                    mIndexes.append(nIndex)
                }
            }

        }
        if !tableDict.isEmpty {
            if let nIndexes = tableDict["indexes"] as? [[String: Any]] {
                for nIdx in nIndexes {
                    let nIndex: ImportIndex = ImportIndex(indexDict: nIdx)
                    mIndexes.append(nIndex)
                }
            }
        }
        return mIndexes
    }
    var triggers: [ImportTrigger]? {
        var mTrigs: [ImportTrigger] = []
        if jsonTable.count > 0 {
            if let nTrigs = jsonTable[0].triggers {
                for mTrig in nTrigs {
                    let nTrig: ImportTrigger = ImportTrigger(jsonTrigger: [mTrig])
                    mTrigs.append(nTrig)
                }
            }

        }
        if !tableDict.isEmpty {
            if let nTrigs = tableDict["triggers"] as? [[String: Any]] {
                for mTrig in nTrigs {
                    let nTrig: ImportTrigger = ImportTrigger(triggerDict: mTrig)
                    mTrigs.append(nTrig)
                }
            }
        }
        return mTrigs

    }

    var values: [[Any]]? {
        var mValues: [[Any]] = []
        if jsonTable.count > 0 {
            if let nValues = jsonTable[0].values {
                for row in nValues {
                    let nrow = UtilsJson.getValuesFromRow(rowValues: row)
                    mValues.append(nrow)
                }
            }
        }
        if !tableDict.isEmpty {
            if let nValues = tableDict["values"] as? [[Any]] {
                mValues = nValues
            }
        }
        return mValues
    }

}
public class ImportColumn {
    var jsonColumn: [JsonColumn]
    var columnDict: [String: Any]

    init(jsonColumn: [JsonColumn]) {
        self.jsonColumn = jsonColumn
        self.columnDict = [:]
    }
    init(columnDict: [String: Any]) {
        self.jsonColumn = []
        self.columnDict = columnDict
    }
    var column: String? {
        var mCol = ""
        if jsonColumn.count > 0 {
            if let nCol = jsonColumn[0].column {
                mCol = nCol
            }
        }
        if !columnDict.isEmpty {
            if let nCol = columnDict["column"] as? String {
                mCol = nCol
            }
        }
        return mCol
    }
    var value: String {
        var mVal = ""
        mVal = jsonColumn.count > 0 ? jsonColumn[0].value : ""
        if !columnDict.isEmpty {
            if let nVal = columnDict["value"] as? String {
                mVal = nVal
            }
        }
        return mVal
    }
    var foreignkey: String? {
        var mFK = ""
        if jsonColumn.count > 0 {
            if let nFK = jsonColumn[0].foreignkey {
                mFK = nFK
            }
        }
        if !columnDict.isEmpty {
            if let nFK = columnDict["foreignkey"] as? String {
                mFK = nFK
            }
        }
        return mFK
    }
    var constraint: String? {
        var mCon = ""
        if jsonColumn.count > 0 {
            if let nCon = jsonColumn[0].constraint {
                mCon = nCon
            }
        }
        if !columnDict.isEmpty {
            if let nCon = columnDict["constraint"] as? String {
                mCon = nCon
            }
        }
        return mCon
    }
}
public class ImportIndex {
    var jsonIndex: [JsonIndex]
    var indexDict: [String: Any]

    init(jsonIndex: [JsonIndex]) {
        self.jsonIndex = jsonIndex
        self.indexDict = [:]
    }
    init(indexDict: [String: Any]) {
        self.jsonIndex = []
        self.indexDict = indexDict
    }
    var mode: String? {
        var mMode = ""
        if jsonIndex.count > 0 {
            if let nMode = jsonIndex[0].mode {
                mMode = nMode
            }
        }
        if !indexDict.isEmpty {
            if let nMode = indexDict["mode"] as? String {
                mMode = nMode
            }
        }
        return mMode
    }
    var value: String {
        var mVal = ""
        mVal = jsonIndex.count > 0 ? jsonIndex[0].value : ""
        if !indexDict.isEmpty {
            if let nVal = indexDict["value"] as? String {
                mVal = nVal
            }
        }
        return mVal
    }
    var name: String {
        var mName = ""
        mName = jsonIndex.count > 0 ? jsonIndex[0].name : ""
        if !indexDict.isEmpty {
            if let nName = indexDict["name"] as? String {
                mName = nName
            }
        }
        return mName
    }
}
public class ImportTrigger {
    var jsonTrigger: [JsonTrigger]
    var triggerDict: [String: Any]

    init(jsonTrigger: [JsonTrigger]) {
        self.jsonTrigger = jsonTrigger
        self.triggerDict = [:]
    }
    init(triggerDict: [String: Any]) {
        self.jsonTrigger = []
        self.triggerDict = triggerDict
    }
    var name: String {
        var mName = ""
        mName = jsonTrigger.count > 0 ? jsonTrigger[0].name : ""
        if !triggerDict.isEmpty {
            if let nName = triggerDict["name"] as? String {
                mName = nName
            }
        }
        return mName
    }
    var timeevent: String {
        var mTime = ""
        mTime = jsonTrigger.count > 0 ? jsonTrigger[0].timeevent : ""
        if !triggerDict.isEmpty {
            if let nTime = triggerDict["timeevent"] as? String {
                mTime = nTime
            }
        }
        return mTime
    }
    var logic: String {
        var mLog = ""
        mLog = jsonTrigger.count > 0 ? jsonTrigger[0].logic : ""
        if !triggerDict.isEmpty {
            if let nLog = triggerDict["logic"] as? String {
                mLog = nLog
            }
        }
        return mLog
    }
    var condition: String? {
        var mCon = ""
        if jsonTrigger.count > 0 {
            if let nCon = jsonTrigger[0].condition {
                mCon = nCon
            }
        }
        if !triggerDict.isEmpty {
            if let nCon = triggerDict["condition"] as? String {
                mCon = nCon
            }
        }
        return mCon
    }

}

public class ImportView {
    var jsonView: [JsonView]
    var viewDict: [String: Any]

    init(jsonView: [JsonView]) {
        self.jsonView = jsonView
        self.viewDict = [:]
    }
    init(viewDict: [String: Any]) {
        self.jsonView = []
        self.viewDict = viewDict
    }

    var name: String {
        var mName = ""
        mName = jsonView.count > 0 ? jsonView[0].name : ""
        if !viewDict.isEmpty {
            if let nName = viewDict["name"] as? String {
                mName = nName
            }
        }
        return mName
    }
    var value: String {
        var mValue = ""
        mValue = jsonView.count > 0 ? jsonView[0].value : ""
        if !viewDict.isEmpty {
            if let nView = viewDict["value"] as? String {
                mValue = nView
            }
        }
        return mValue
    }

}
// swiftlint:enable file_length
