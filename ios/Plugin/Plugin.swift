import Foundation
import Capacitor
import SQLCipher

/**
 * Please read the Capacitor iOS Plugin Development Guide
 * here: https://capacitor.ionicframework.com/docs/plugins/ios
 */

@objc(CapacitorSQLite)
// swiftlint:disable file_length
// swiftlint:disable type_body_length

public class CapacitorSQLite: CAPPlugin {
//    var mDb: DatabaseHelper?
    var globalData: GlobalSQLite = GlobalSQLite()
    let retHandler: ReturnHandler = ReturnHandler()
    var dbDict: [String: Database] = [:]
    var versionUpgrades: [String: [Int: [String: Any]]] = [:]
    let modeList: [String] = ["no-encryption", "encryption",
                              "secret", "newsecret", "wrongsecret"]

    // MARK: - Echo

    @objc func echo(_ call: CAPPluginCall) {
        let value = call.getString("value") ?? ""
        call.success([
            "value": value
        ])
    }

    // MARK: - CreateConnection
//1234567890123456789012345678901234567890123456789012345678901234567890
    @objc func createConnection(_ call: CAPPluginCall) {
        guard let dbName = call.options["database"] as? String else {
            retHandler.rResult(
                call: call, ret: false,
                message: "CreateConnection command failed: " +
                    "Must provide a database name")
          return
        }
        let version: Int = call.getInt("version") ?? 1
        let encrypted: Bool = call.getBool("encrypted") ?? false
        let inMode: String = call.getString("mode") ?? "no-encryption"
        if encrypted && !modeList.contains(inMode) {
            var msg: String = "Open command failed: Error inMode "
            msg.append("must be in ['encryption','secret',")
            msg.append("'newsecret']")
            retHandler.rResult(call: call, ret: false,
                message: msg)
            return
        }
        var upgDict: [Int: [String: Any]] = [:]
        if let cUpgDict = versionUpgrades[dbName] {
            upgDict = cUpgDict
        }
        do {
            let mDb: Database = try Database(
                databaseName: "\(dbName)SQLite.db",
                encrypted: encrypted, mode: inMode, version: version,
                vUpgDict: upgDict)
            dbDict[dbName] = mDb
            retHandler.rResult(call: call, ret: true)
            return
        } catch let error {
            let msg = "CreateConnection command failed: \(error)"
            retHandler.rResult(call: call, ret: false,
                               message: msg)
            return
        }
    }

    // MARK: - Open

    @objc func open(_ call: CAPPluginCall) {
        guard let dbName = call.options["database"] as? String else {
            retHandler.rResult(
                call: call, ret: false,
                message: "Open command failed: " +
                    "Must provide a database name")
          return
        }

        guard let mDb: Database = dbDict[dbName] else {
            retHandler.rResult(
                call: call, ret: false,
                message: "Open command failed: No available " +
                    "connection for \(dbName)")
          return
        }
        do {
            try mDb.open()
            retHandler.rResult(call: call, ret: true)
            return
        } catch DatabaseError.open(let message) {
            let msg: String = "Open command failed: \(message)"
            retHandler.rResult(
            call: call, ret: false, message: msg)
            return
        } catch let error {
            retHandler.rResult(
            call: call, ret: false,
                message: "Open command failed: " + error.localizedDescription)
            return
        }
    }

    // MARK: - Close

    @objc func close(_ call: CAPPluginCall) {
        guard let dbName = call.options["database"] as? String else {
            retHandler.rResult(
                call: call, ret: false,
                message: "Close command failed: " +
                    "Must provide a database name")
          return
        }

        guard let mDb: Database = dbDict[dbName] else {
            retHandler.rResult(
                call: call, ret: false,
                message: "Close command failed: No available " +
                    "connection for \(dbName)")
          return
        }
        do {
            try mDb.close()
            retHandler.rResult(call: call, ret: true)
            return
      } catch let error {
            retHandler.rResult(
            call: call, ret: false,
                message: "Close command failed: " + error.localizedDescription)
            return
        }

    }

    // MARK: - Close Connection

    @objc func closeConnection(_ call: CAPPluginCall) {
        guard let dbName = call.options["database"] as? String else {
            retHandler.rResult(
                call: call, ret: false,
                message: "CloseConnection command failed: " +
                    "Must provide a database name")
          return
        }
        guard let mDb: Database = dbDict[dbName] else {
            retHandler.rResult(
                call: call, ret: false,
                message: "CloseConnection command failed: No available " +
                    "connection for \(dbName)")
          return
        }
        if mDb.isDBOpen() {
            do {
                try mDb.close()
            } catch let error {
                retHandler.rResult(
                call: call, ret: false,
                    message: "CloseConnection command failed: "
                        + "close error " + error.localizedDescription)
                return
            }
        }
        dbDict.removeValue(forKey: dbName)
        retHandler.rResult(call: call, ret: true)
        return

    }

    // MARK: - Execute

    @objc func execute(_ call: CAPPluginCall) {

        guard let dbName = call.options["database"] as? String else {
            retHandler.rChanges(
                call: call, ret: ["changes": -1],
                message: "Execute command failed: " +
                    "Must provide a database name")
            return
        }
        let statements: String = call.getString("statements") ?? ""
        if statements.count == 0 {
            var msg: String = "Execute command failed : Must provide "
            msg.append("raw SQL statements")
            retHandler.rChanges(
                call: call, ret: ["changes": -1],
                message: msg)
            return
        }
        guard let mDb: Database = dbDict[dbName] else {
            retHandler.rChanges(
                call: call, ret: ["changes": -1],
                message: "Execute command failed: No available " +
                    "connection for \(dbName)")
            return
        }

        do {
            let res = try mDb.executeSQL(sql: statements)
            retHandler.rChanges(call: call, ret: ["changes": res])
            return
        } catch DatabaseError.executeSQL(let message) {
            var msg: String = "Execute command failed :"
            msg.append(" \(message)")
            retHandler.rChanges(call: call, ret: ["changes": -1],
                                message: msg)
            return
        } catch let error {
            var msg: String = "Execute command failed :"
            msg.append(" \(error.localizedDescription)")
            retHandler.rChanges(call: call, ret: ["changes": -1],
                                message: msg)
            return
        }
     }

    // MARK: - ExecuteSet

    // swiftlint:disable function_body_length
    @objc func executeSet(_ call: CAPPluginCall) {
        guard let dbName = call.options["database"] as? String else {
            retHandler.rChanges(
                call: call, ret: ["changes": -1],
                message: "ExecuteSet command failed: " +
                    "Must provide a database name")
            return
        }
        guard let set = call.options["set"] as? [[String: Any]] else {
            var msg: String = "ExecuteSet command failed : "
            msg.append("Must provide a set of SQL statements")
            retHandler.rChanges(
                call: call, ret: ["changes": -1], message: msg)
            return

        }
        if set.count == 0 {
            var msg: String = "ExecuteSet command failed : Must "
            msg.append("provide a non-empty set of SQL statements")
            retHandler.rChanges(call: call, ret: ["changes": -1],
                message: msg)
            return
        }
        for dict in set {
            let keys = dict.keys
            if !(keys.contains("statement")) ||
                                     !(keys.contains("values")) {
                var msg: String = "ExecuteSet command failed : "
                msg.append("Must provide a set as Array of ")
                msg.append("{statement,values}")
                retHandler.rChanges(call: call, ret: ["changes": -1],
                    message: msg)
                return
            }
        }

        guard let mDb: Database = dbDict[dbName] else {
            retHandler.rChanges(
                call: call, ret: ["changes": -1],
                message: "Execute command failed: No available " +
                    "connection for \(dbName)")
            return
        }
        do {
            let res = try (mDb.execSet(set: set))
            retHandler.rChanges(call: call, ret: res)
            return

        } catch DatabaseError.execSet(let message) {
            var msg: String = "ExecuteSet command failed : "
            msg.append("\(message)")
            retHandler.rChanges(call: call, ret: ["changes": -1],
                                message: msg)
            return
        } catch let error {
            var msg: String = "ExecuteSet command failed: "
            msg.append("\(error)")
            retHandler.rChanges(call: call, ret: ["changes": -1],
                                message: msg)
            return
        }

    }
    // swiftlint:enable function_body_length

    // MARK: - Run

    // swiftlint:disable cyclomatic_complexity
    // swiftlint:disable function_body_length
    @objc func run(_ call: CAPPluginCall) {
        guard let dbName = call.options["database"] as? String else {
            retHandler.rChanges(
                call: call, ret: ["changes": -1],
                message: "Run command failed: " +
                    "Must provide a database name")
            return
        }
        guard let statement = call
                            .options["statement"] as? String else {
            var msg: String = "Run command failed : "
            msg.append("Must provide a SQL statement")
            retHandler.rChanges(call: call, ret: ["changes": -1],
                                    message: msg)
            return
        }
        guard let values = call.options["values"] as? [Any] else {
            retHandler.rChanges(
                call: call, ret: ["changes": -1],
                message: "Run command failed: " +
                    "Must provide an Array of values")
            return

        }

        guard let mDb: Database = dbDict[dbName] else {
            retHandler.rChanges(
                call: call, ret: ["changes": -1],
                message: "Run command failed: No available " +
                    "connection for \(dbName)")
            return
        }
        do {
            var val: [Any] = []
            if values.count > 0 {
                for value in values {
                    if let obj = value as? String {
                        let str: String =
                                    "\(String(describing: obj))"
                        val.append(str)
                    } else if let obj = value as? Int {
                        val.append(obj)
                    } else if let obj = value as? Float {
                        val.append(obj)
                    } else if value is NSNull {
                        val.append("NULL")
                    } else {
                        var msg: String = "Run command failed : "
                        msg.append("Not a SQL type")
                        retHandler.rChanges(call: call,
                                            ret: ["changes": -1],
                                            message: msg)
                        return
                    }
                }
            }
            let res = try mDb.runSQL(sql: statement, values: val)
            retHandler.rChanges(call: call, ret: res)
            return
        } catch DatabaseError.runSQL(let message) {
            var msg: String = "Run command failed :"
            msg.append(" \(message)")
            retHandler.rResult(call: call, ret: false,
                               message: msg)
            return
        } catch let error {
            var msg: String = "Run command failed :"
            msg.append(" \(error.localizedDescription)")
            retHandler.rChanges(call: call, ret: ["changes": -1],
                                message: msg)
            return
        }
    }
    // swiftlint:enable function_body_length
    // swiftlint:enable cyclomatic_complexity

    // MARK: - Query

    @objc func query(_ call: CAPPluginCall) {
        guard let dbName = call.options["database"] as? String else {
            retHandler.rChanges(
                call: call, ret: ["changes": -1],
                message: "Query command failed: " +
                    "Must provide a database name")
            return
        }

        guard let statement = call
                            .options["statement"] as? String else {
            var msg: String = "Query command failed : "
            msg.append("Must provide a query statement")
            retHandler.rValues(call: call, ret: [], message: msg)
            return
        }
        guard let values = call.options["values"] as? [String] else {
            var msg: String = "Query command failed : "
            msg.append("Must provide an Array of string")
            retHandler.rValues(call: call, ret: [],
                message: msg)
            return

        }
        guard let mDb: Database = dbDict[dbName] else {
            retHandler.rChanges(
                call: call, ret: ["changes": -1],
                message: "Query command failed: No available " +
                    "connection for \(dbName)")
            return
        }

        do {
            let res: [[String: Any]] = try mDb
                    .selectSQL(sql: statement, values: values)
            retHandler.rValues(call: call, ret: res)
            return
        } catch DatabaseError.selectSQL(let message) {
            var msg: String = "Query command failed : "
            msg.append("\(message)")
            retHandler.rValues(call: call, ret: [], message: msg)
            return
        } catch let error {
            var msg: String = "Query command failed : "
            msg.append("\(error)")
            retHandler.rValues(call: call, ret: [], message: msg)
            return
        }
    }

    // MARK: - isDBExists

    @objc func isDBExists(_ call: CAPPluginCall) {
        guard let dbName = call.options["database"] as? String else {
            retHandler.rChanges(
                call: call, ret: ["changes": -1],
                message: "idDBExists command failed: " +
                    "Must provide a database name")
            return
        }
        guard let _: Database = dbDict[dbName] else {
            retHandler.rChanges(
                call: call, ret: ["changes": -1],
                message: "idDBExists command failed: No available " +
                    "connection for \(dbName)")
            return
        }
        let res: Bool = UtilsFile
                    .isFileExist(fileName: "\(dbName)SQLite.db")
        if res {
            retHandler.rResult(call: call, ret: true)
            return
        } else {
            var msg: String = "Database \(dbName)SQLite.db"
            msg.append(" does not exist")
            retHandler.rResult(call: call, ret: false,
                               message: msg)
            return
        }
    }
    // MARK: - DeleteDatabase

    @objc func deleteDatabase(_ call: CAPPluginCall) {
        guard let dbName = call.options["database"] as? String else {
            retHandler.rChanges(
                call: call, ret: ["changes": -1],
                message: "deleteDatabase command failed: " +
                    "Must provide a database name")
            return
        }
        guard let mDb: Database = dbDict[dbName] else {
            retHandler.rChanges(
                call: call, ret: ["changes": -1],
                message: "deleteDatabase command failed: No " +
                    "available connection for \(dbName)")
            return
        }
        do {
            let res: Bool = try mDb.deleteDB(
                            databaseName: "\(dbName)SQLite.db")
            retHandler.rResult(call: call, ret: res)
            return
        } catch DatabaseError.deleteDB(let message) {
            var msg: String = "DeleteDatabase command failed : "
            msg.append("\(message)")
            retHandler.rResult(call: call, ret: false,
                               message: msg)
            return
        } catch let error {
            var msg: String = "DeleteDatabase command failed :"
            msg.append(" \(error.localizedDescription)")
            retHandler.rResult(call: call, ret: false,
                               message: msg)
            return
        }
    }

    // MARK: - IsJsonValid

    @objc func isJsonValid(_ call: CAPPluginCall) {
        let parsingData: String = call.getString("jsonstring") ?? ""
        if parsingData.count == 0 {
            var msg: String = "IsJsonValid command failed : "
            msg.append("Must provide a Stringify Json Object")
            retHandler.rResult(call: call, ret: false,
                                            message: msg)
            return
        }
        if let data = ("["+parsingData+"]").data(using: .utf8) {
            do {
                _ = try JSONDecoder().decode([JsonSQLite].self,
                                             from: data)
                retHandler.rResult(call: call, ret: true)
                return
            } catch let error {
                var msg: String = "IsJsonValid command failed : "
                msg.append("Stringify Json Object not Valid")
                msg.append("\(error.localizedDescription)")
                retHandler.rResult(call: call, ret: false,
                                            message: msg)
                return
            }
        } else {
            var msg: String = "IsJsonValid command failed : "
            msg.append("Stringify Json Object not Valid")
            retHandler.rResult(call: call, ret: false,
                                            message: msg)
            return
        }
    }

    // MARK: - ImportFromJson

    // swiftlint:disable function_body_length
    @objc func importFromJson(_ call: CAPPluginCall) {
        let parsingData: String = call.getString("jsonstring") ?? ""
        if parsingData.count == 0 {
            retHandler.rChanges(call: call, ret: ["changes": -1],
                message: "ImportFromJson command failed : " +
                    "Must provide a Stringify Json Object")
            return
        }
        var mDb: Database
        var msg: String = "ImportFromJson command failed: "
        if let data = ("["+parsingData+"]").data(using: .utf8) {
            do {
                let jsonSQLite = try JSONDecoder()
                            .decode([JsonSQLite].self, from: data)
                let encrypted: Bool = jsonSQLite[0].encrypted ?
                            true : false
                let inMode: String = encrypted ? "secret"
                                               : "no-encryption"
                var dbName: String = jsonSQLite[0].database
                dbName.append("SQLite.db")
                // open the database
                do {
                    mDb = try Database(
                        databaseName: dbName, encrypted: encrypted,
                        mode: inMode, vUpgDict: [:])
                    try mDb.open()
                } catch DatabaseError.open(let message) {
                    msg.append("\(message)")
                    retHandler.rChanges(
                        call: call,
                        ret: ["changes": -1], message: msg)
                    return
                } catch let error {
                    msg.append(" \(error.localizedDescription)")
                    retHandler.rChanges(call: call,
                                        ret: ["changes": -1],
                                        message: msg)
                    return
                }
                // import from Json Object
                do {
                    let res: [String: Int] = try mDb
                        .importFromJson(jsonSQLite: jsonSQLite[0])
                    try mDb.close()
                    if let result = res["changes"] {
                        if result < 0 {
                            msg.append("changes < 0")
                            retHandler.rChanges(call: call,
                                                ret: ["changes": -1],
                                                message: msg )
                            return
                        } else {
                            retHandler.rChanges(call: call,
                                                ret: res)
                        }
                    } else {
                        let msg: String = "changes not found"
                        retHandler.rChanges(call: call,
                                            ret: ["changes": -1],
                                            message: msg )
                    }
                } catch DatabaseError.importFromJson(
                                        let message) {
                    msg.append("\(message)")
                    do {
                        try mDb.close()
                        retHandler.rChanges(
                            call: call,
                            ret: ["changes": -1], message: msg)
                        return
                    } catch DatabaseError.close(let message) {
                        msg.append(" \(message)")
                        retHandler.rChanges(
                            call: call,
                            ret: ["changes": -1], message: msg)
                        return
                    }
                } catch DatabaseError.close(let message) {
                    msg.append("\(message)")
                    retHandler.rChanges(
                        call: call,
                        ret: ["changes": -1], message: msg)
                    return
                }
            } catch let error {
                msg.append("Stringify Json Object not Valid ")
                msg.append("\(error.localizedDescription)")
                retHandler.rChanges(
                    call: call, ret: ["changes": -1], message: msg)
                return
            }
        } else {
            msg.append("Stringify Json Object not Valid ")
            retHandler.rChanges(call: call, ret: ["changes": -1],
                                message: msg)
            return
        }
    }
    // swiftlint:enable function_body_length

    // MARK: - ExportToJson

    // swiftlint:disable function_body_length
    @objc func exportToJson(_ call: CAPPluginCall) {
        guard let dbName = call.options["database"] as? String else {
            retHandler.rChanges(
                call: call, ret: ["changes": -1],
                message: "exportToJson command failed: " +
                    "Must provide a database name")
            return
        }
        let expMode: String = call.getString("jsonexportmode") ?? ""
        if expMode.count == 0 {
            var msg: String = "ExportToJson command failed : "
            msg.append("Must provide an export mode")
            retHandler.rJsonSQLite(call: call, ret: [:],
                                   message: msg)
            return
        }
        if expMode != "full" && expMode != "partial" {
            var msg: String = "ExportToJson command failed : "
            msg.append("Json export mode should be 'full' or 'partial'")
            retHandler.rJsonSQLite(call: call, ret: [:],
                                   message: msg)
            return
        }

        guard let mDb: Database = dbDict[dbName] else {
            retHandler.rChanges(
                call: call, ret: ["changes": -1],
                message: "ExportToJson command failed: No " +
                    "available connection for \(dbName)")
            return
        }

        do {
            let res: [String: Any] = try
                            mDb.exportToJson(expMode: expMode)
                if res.count == 5 {
                   retHandler.rJsonSQLite(call: call, ret: res)
                } else {
                    var msg: String = "ExportToJson command failed"
                    msg.append(" : return Object is not a ")
                    msg.append("JsonSQLite  Object")
                    retHandler.rJsonSQLite(call: call, ret: [:],
                                           message: msg)
                }
        } catch DatabaseError.exportToJson(let message) {
            retHandler.rJsonSQLite(
                call: call, ret: [:],
                message: "ExportToJson command failed : \(message)")
        } catch let error {
            var msg: String = "ExportToJson command failed :"
            msg.append(" \(error.localizedDescription)")
            retHandler.rJsonSQLite(call: call, ret: [:],
                                   message: msg)
            return
        }

    }
    // swiftlint:enable function_body_length

    // MARK: - CreateSyncTable

    @objc func createSyncTable(_ call: CAPPluginCall) {
        guard let dbName = call.options["database"] as? String else {
            retHandler.rChanges(
                call: call, ret: ["changes": -1],
                message: "createSyncTable command failed: " +
                    "Must provide a database name")
            return
        }
        guard let mDb: Database = dbDict[dbName] else {
            retHandler.rChanges(
                call: call, ret: ["changes": -1],
                message: "createSyncTable command failed: No " +
                    "available connection for \(dbName)")
            return
        }

        do {
            let res: Int = try mDb.createSyncTable()
            retHandler.rChanges(call: call, ret: ["changes": res])
            return
        } catch DatabaseError.createSyncTable(let message) {
            var msg: String = "createSyncTable command failed : "
            msg.append("\(message)")
            retHandler.rChanges(call: call, ret: ["changes": -1],
                                message: msg)
            return
        } catch let error {
            var msg: String = "createSyncTable command failed : "
            msg.append("\(error)")
            retHandler.rChanges(call: call, ret: ["changes": -1],
                                message: msg)
            return
        }
    }

    // MARK: - SetSyncDate

    @objc func setSyncDate(_ call: CAPPluginCall) {
        var msg: String = "setSyncDate command failed: "
        guard let dbName = call.options["database"] as? String else {
            retHandler.rResult(
                call: call, ret: false,
                message: msg + "Must provide a database name")
            return
        }
        guard let syncDate = call.options["syncdate"] as? String else {
            retHandler.rResult(
                call: call, ret: false,
                message: msg + "Must provide a synchronization name")
            return
        }
        guard let mDb: Database = dbDict[dbName] else {
            retHandler.rResult(
                call: call, ret: false,
                message: msg + "available connection for \(dbName)")
            return
        }
        do {
            let res: Bool = try mDb
                            .setSyncDate(syncDate: syncDate)
            if res {
                retHandler.rResult(call: call, ret: true)
            } else {
               retHandler.rResult(
                    call: call, ret: false, message: msg)
            }
        } catch DatabaseError.createSyncDate(let message) {
            msg.append("\(message)")
            retHandler.rResult(call: call, ret: false, message: msg)
        } catch let error {
            msg.append("\(error)")
            retHandler.rResult(call: call, ret: false, message: msg)
        }
    }

    // MARK: - SetSyncDate

    @objc func getSyncDate(_ call: CAPPluginCall) {
        var msg: String = "setSyncDate command failed: "
        guard let dbName = call.options["database"] as? String else {
            retHandler.rResult(
                call: call, ret: false,
                message: msg + "Must provide a database name")
            return
        }
        guard let mDb: Database = dbDict[dbName] else {
            retHandler.rResult(
                call: call, ret: false,
                message: msg + "available connection for \(dbName)")
            return
        }
        do {
            let res: Int64 = try mDb.getSyncDate()
            if res > 0 {
                retHandler.rSyncDate(call: call, ret: res)
            } else {
               retHandler.rSyncDate(
                    call: call, ret: 0, message: msg)
            }
        } catch DatabaseError.getSyncDate(let message) {
            msg.append("\(message)")
            retHandler.rSyncDate(call: call, ret: 0, message: msg)
        } catch let error {
            msg.append("\(error)")
            retHandler.rSyncDate(call: call, ret: 0, message: msg)
        }
    }

    // MARK: addUpgradeStatement

    @objc func addUpgradeStatement(_ call: CAPPluginCall) {
        var msg: String = "addUpgradeStatement command failed: "
        guard let dbName = call.options["database"] as? String else {
            msg.append("Must provide a database name")
            retHandler.rResult(call: call, ret: false, message: msg)
            return
        }
        guard let upgrade = call.options["upgrade"] as?
                                                [[String: Any]] else {
            msg.append("Must provide an upgrade statement")
            retHandler.rResult(call: call, ret: false, message: msg)
            return
        }
        var upgDict: [String: Any] = [:]
        for dict in upgrade {
            let keys = dict.keys
            if !(keys.contains("fromVersion")) ||
                !(keys.contains("toVersion")) ||
                !(keys.contains("statement")) {
                msg.append("{fromVersion,toVersion,statement}")
                retHandler.rResult(call: call, ret: false, message: msg)
                return
            }
            for (key, value) in dict {
                upgDict[key] = value
            }
        }
        guard let fromVersion = upgDict["fromVersion"] as? Int else {
            msg.append("fromVersion must be an Int")
            retHandler.rResult(call: call, ret: false, message: msg)
            return
        }
        let upgVersionDict: [Int: [String: Any]] =
                                                [fromVersion: upgDict]
        versionUpgrades = ["\(dbName)": upgVersionDict]
        retHandler.rResult(call: call, ret: true)

    }

}
// swiftlint:enable type_body_length
// swiftlint:enable file_length
