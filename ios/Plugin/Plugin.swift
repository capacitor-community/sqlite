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
    var mDb: DatabaseHelper?
    var globalData: GlobalSQLite = GlobalSQLite()
    let retHandler: ReturnHandler = ReturnHandler()
    var versionUpgrades: [String: [Int: [String: Any]]] = [:]

    // MARK: - Echo

    @objc func echo(_ call: CAPPluginCall) {
        let value = call.getString("value") ?? ""
        call.success([
            "value": value
        ])
    }

    // MARK: - Open

    // swiftlint:disable function_body_length
    @objc func open(_ call: CAPPluginCall) {
        let dbName: String = call.getString("database") ?? ""
        if dbName.count == 0 {
            retHandler.rResult(
                call: call, ret: false,
                message: "Open command failed: Must provide a " +
                    "database name")
            return
        }
        let dbVersion: Int = call.getInt("version", 1) ?? 1
        let encrypted = call.getBool("encrypted") ?? false
        var inMode: String = ""
        var secretKey: String = ""
        var newsecretKey: String = ""
        if encrypted {
            inMode = call.getString("mode") ?? "no-encryption"
            if inMode != "no-encryption" && inMode != "encryption" &&
                inMode != "secret" && inMode != "newsecret" &&
                inMode != "wrongsecret" {
                var msg: String = "Open command failed: Error inMode "
                msg.append("must be in ['encryption','secret',")
                msg.append("'newsecret']")
                retHandler.rResult(call: call, ret: false,
                    message: msg)
                return
            }
            if inMode == "encryption" || inMode == "secret" {
                secretKey = globalData.secret
                // this is only done for testing multiples runs
                newsecretKey = globalData.newsecret
            } else if inMode == "newsecret" {
                secretKey = globalData.secret
                newsecretKey = globalData.newsecret
            } else if inMode == "wrongsecret" {
                // for test purpose only
                secretKey = "wrongsecret"
                inMode = "secret"
            } else {
                secretKey = ""
                newsecretKey = ""
            }
        } else {
            inMode = "no-encryption"
        }
        do {
           mDb = try DatabaseHelper(
                databaseName: "\(dbName)SQLite.db",
                encrypted: encrypted,
                mode: inMode, secret: secretKey,
                newsecret: newsecretKey,
                databaseVersion: dbVersion,
                versionUpgrades: versionUpgrades)
            call.success([ "result": true ])
        } catch let error {
            retHandler.rResult(call: call, ret: false,
                               message: "Open command failed: \(error)")
        }
    }
    // swiftlint:enable function_body_length

    // MARK: - Close

    @objc func close(_ call: CAPPluginCall) {
        let dbName: String = call.getString("database") ?? ""
        if dbName.count == 0 {
            var msg: String = "Close command failed: Must "
            msg.append("provide a database name")
            retHandler.rResult(call: call, ret: false,
                               message: msg)
            return
        }
        if mDb != nil {
            do {
                let res: Bool = try (mDb?.close(
                        databaseName: "\(dbName)SQLite.db")) ?? false
                call.success([ "result": res ])
            } catch DatabaseHelperError.dbConnection(let message) {
                retHandler.rResult(
                            call: call, ret: false,
                            message: "Close command failed: \(message)")
            } catch DatabaseHelperError.close(let message) {
                retHandler.rResult(
                            call: call, ret: false,
                            message: "Close command failed: \(message)")
            } catch let error {
                retHandler.rResult(
                            call: call, ret: false,
                            message: "Close command failed: \(error)")
            }
        } else {
           retHandler.rResult(
                call: call, ret: false,
                message: "Close command failed: No database connection")
        }
    }

    // MARK: - Execute

    @objc func execute(_ call: CAPPluginCall) {
        let statements: String = call.getString("statements") ?? ""
        if statements.count == 0 {
            var msg: String = "Execute command failed : Must provide "
            msg.append("raw SQL statements")
            retHandler.rChanges(
                call: call, ret: ["changes": -1],
                message: msg)
            return
        }
        if mDb != nil {
            do {
                let res: Int = try (mDb?.execSQL(sql: statements)) ?? -1
                retHandler.rChanges(call: call, ret: ["changes": res])
            } catch DatabaseHelperError.dbConnection(let message) {
                retHandler.rChanges(
                    call: call, ret: ["changes": -1],
                    message: "Execute command failed : \(message)")
                return
            } catch DatabaseHelperError.execSql(let message) {
                retHandler.rChanges(
                    call: call, ret: ["changes": -1],
                    message: "Execute command failed : \(message)")
                return
            } catch let error {
                retHandler.rChanges(
                    call: call, ret: ["changes": -1],
                    message: "Execute command failed : \(error)")
                return
            }

        } else {
            var msg: String = "Execute command failed : No database "
            msg.append("connection")
            retHandler.rChanges(
                call: call, ret: ["changes": -1],
                message: msg)
        }
    }

    // MARK: - ExecuteSet

    // swiftlint:disable function_body_length
    @objc func executeSet(_ call: CAPPluginCall) {
        let set: [[String: Any]] =
                    call.getArray("set", ([String: Any]).self) ?? []
        if set.count == 0 {
            var msg: String = "ExecuteSet command failed : "
            msg.append("Must provide a set of SQL statements")
            retHandler.rChanges(call: call, ret: ["changes": -1],
                message: msg)
            return
        }
        if mDb != nil {
            if set.count == 0 {
                var msg: String = "ExecuteSet command failed : Must "
                msg.append("provide a non-empty set of SQL statements")
                retHandler.rChanges(call: call, ret: ["changes": -1],
                    message: msg)
            }
            for dict in set {
//                let row: NSMutableDictionary = dict as! NSMutableDictionary
//                let keys: [String] = row.allKeys as! [String]
                let keys = dict.keys
                if !(keys.contains("statement")) ||
                                         !(keys.contains("values")) {
                    var msg: String = "ExecuteSet command failed : "
                    msg.append("Must provide a set as Array of ")
                    msg.append("{statement,values}")
                    retHandler.rChanges(call: call, ret: ["changes": -1],
                        message: msg)
                }
            }
            do {
                if let res = try (mDb?.execSet(set: set)) {
                    retHandler.rChanges(call: call, ret: res)
                }
            } catch DatabaseHelperError.dbConnection(let message) {
                var msg: String = "ExecuteSet command failed : "
                msg.append("\(message)")
                retHandler.rChanges(call: call, ret: ["changes": -1],
                                    message: msg)
            } catch DatabaseHelperError.execSql(let message) {
                var msg: String = "ExecuteSet command failed : "
                msg.append("\(message)")
                retHandler.rChanges(call: call, ret: ["changes": -1],
                                    message: msg)
            } catch let error {
                var msg: String = "ExecuteSet command failed : \(error)"
                retHandler.rChanges(call: call, ret: ["changes": -1],
                                    message: msg)
            }

        } else {
            var msg: String = "ExecuteSet command failed : "
            msg.append("No database connection")
            retHandler.rChanges(call: call, ret: ["changes": -1],
                                    message: msg)
        }
    }
    // swiftlint:enable function_body_length

    // MARK: - Run

    // swiftlint:disable cyclomatic_complexity
    // swiftlint:disable function_body_length
    @objc func run(_ call: CAPPluginCall) {
        let statement: String = call.getString("statement") ?? ""
        if statement.count == 0 {
            var msg: String = "Run command failed : "
            msg.append("Must provide a SQL statement")
            retHandler.rChanges(call: call, ret: ["changes": -1],
                                    message: msg)
            return
        }
        let values: [Any] = call.getArray("values", (Any).self) ??
                                                        [-9999999]
        if values.count == 1 && values[0] as? Int == -9999999 {
            var msg: String = "Run command failed : "
            msg.append("Values should be an Array of values")
            retHandler.rChanges(call: call, ret: ["changes": -1],
                                    message: msg)
            return
        }
        if mDb != nil {
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
                        } else {
                            var msg: String = "Run command failed : "
                            msg.append("Not a SQL type")
                            retHandler.rChanges(call: call,
                                                ret: ["changes": -1],
                                                message: msg)
                        }
                    }
                }
                if let res = try (mDb?.runSQL(sql: statement,
                                              values: val)) {
                    retHandler.rChanges(call: call, ret: res)
                }
            } catch DatabaseHelperError.dbConnection(let message) {
                var msg: String = "Run command failed : \(message)"
                retHandler.rChanges(call: call, ret: ["changes": -1],
                                    message: msg)
            } catch DatabaseHelperError.runSql(let message) {
                var msg: String = "Run command failed : \(message)"
                retHandler.rChanges(call: call, ret: ["changes": -1],
                                    message: msg)
            } catch let error {
                var msg: String = "Run command failed : \(error)"
                retHandler.rChanges(call: call, ret: ["changes": -1],
                                    message: msg)
            }
        } else {
            retHandler.rChanges(call: call, ret: ["changes": -1],
                message: "Run command failed : No database connection")
        }
    }
    // swiftlint:enable function_body_length
    // swiftlint:enable cyclomatic_complexity

    // MARK: - Query

    // swiftlint:disable function_body_length
    @objc func query(_ call: CAPPluginCall) {
        let statement: String = call.getString("statement") ?? ""
        if statement.count == 0 {
            var msg: String = "Query command failed : "
            msg.append("Must provide a query statement")
            retHandler.rValues(call: call, ret: [], message: msg)
            return
        }
        let values: [String] = call.getArray("values", (String).self) ??
                                                                ["NULL"]
        if values.count == 1 && values[0] == "NULL" {
            var msg: String = "Query command failed : "
            msg.append("Values should be an Array of string")
            retHandler.rValues(call: call, ret: [],
                message: msg)
            return
        }
        if mDb != nil {
            do {
                if let res: [[String: Any]] =
                    try (mDb?.selectSQL(sql: statement,
                                        values: values)) {
                    retHandler.rValues(call: call, ret: res)
                } else {
                    var msg: String = "Query command failed : "
                    msg.append("Error in selectSQL")
                    retHandler.rValues(call: call, ret: [],
                    message: msg)
                }
            } catch DatabaseHelperError.dbConnection(let message) {
                var msg: String = "Query command failed : "
                msg.append("\(message)")
                retHandler.rValues(call: call, ret: [], message: msg)
            } catch DatabaseHelperError.selectSql(let message) {
                var msg: String = "Query command failed : "
                msg.append("\(message)")
                retHandler.rValues(call: call, ret: [], message: msg)
            } catch let error {
                var msg: String = "Query command failed : "
                msg.append("\(error)")
                retHandler.rValues(call: call, ret: [], message: msg)
            }
        } else {
            var msg: String = "Query command failed : "
            msg.append("No database connection")
            retHandler.rValues(call: call, ret: [], message: msg)
        }
    }
    // swiftlint:enable function_body_length

    // MARK: - isDBExists

    @objc func isDBExists(_ call: CAPPluginCall) {
        let dbName: String = call.getString("database") ?? ""
        if dbName.count == 0 {
            var msg: String = "idDBExists command failed : "
            msg.append("Must provide a database name")
            retHandler.rResult(call: call, ret: false,
                message: msg)
            return
        }
        do {
            let filePath: String =
                try UtilsFile.getFilePath(
                                    fileName: "\(dbName)SQLite.db")
            let res: Bool = UtilsFile.isFileExist(filePath: filePath)
            if res {
                retHandler.rResult(call: call, ret: true)
            } else {
                var msg: String = "Database \(dbName)SQLite.db"
                msg.append(" does not exist")
                retHandler.rResult(call: call, ret: false,
                                   message: msg)
            }
        } catch UtilsSQLiteError.filePathFailed {
            var msg: String = "isDBExists command failed :"
            msg.append(" file path failed")
            retHandler.rResult(call: call, ret: false,
                               message: msg)
        } catch let error {
            retHandler.rResult(call: call, ret: false,
                    message: "isDBExists command failed : \(error)")
        }
    }
    // MARK: - DeleteDatabase

    @objc func deleteDatabase(_ call: CAPPluginCall) {
        let dbName: String = call.getString("database") ?? ""
        if dbName.count == 0 {
            var msg: String = "DeleteDatabase command failed :"
            msg.append(" Must provide a database name")
            retHandler.rResult(call: call, ret: false,
                message: msg)
            return
        }
        if mDb != nil {
            do {
                if let res: Bool = try (mDb?.deleteDB(
                                databaseName: "\(dbName)SQLite.db")) {
                    retHandler.rResult(call: call, ret: res)
                } else {
                    var msg: String = "DeleteDatabase command failed : "
                    msg.append("Database \(dbName)SQLite.db ")
                    msg.append("does not exist")
                    retHandler.rResult(call: call, ret: false,
                                            message: msg)
                }
            } catch DatabaseHelperError.deleteDB(let message) {
                var msg: String = "DeleteDatabase command failed : "
                msg.append("\(message)")
                retHandler.rResult(call: call, ret: false,
                                            message: msg)
            } catch let error {
                retHandler.rResult(call: call, ret: false,
                    message: "DeleteDatabase command failed: \(error)")
            }
        } else {
                var msg: String = "DeleteDatabase command failed : "
                msg.append("The database is not opened")
                retHandler.rResult(call: call, ret: false,
                                            message: msg)
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
            } catch let error {
                var msg: String = "IsJsonValid command failed : "
                msg.append("Stringify Json Object not Valid")
                msg.append("\(error.localizedDescription)")
               retHandler.rResult(call: call, ret: false,
                                            message: msg)
            }
        } else {
            var msg: String = "IsJsonValid command failed : "
            msg.append("Stringify Json Object not Valid")
            retHandler.rResult(call: call, ret: false,
                                            message: msg)
        }
    }
    // MARK: - ImportFromJson
// swiftlint:disable function_body_length
    @objc func importFromJson(_ call: CAPPluginCall) {
        let parsingData: String = call.getString("jsonstring") ?? ""
        if parsingData.count == 0 {
            retHandler.rChanges(call: call, ret: ["changes": -1],
                message: "ImportFromJson command failed : Must provide a Stringify Json Object")
            return
        }
        if let data = ("["+parsingData+"]").data(using: .utf8) {
            do {
                let jsonSQLite = try JSONDecoder()
                            .decode([JsonSQLite].self, from: data)
                let secret: String = jsonSQLite[0].encrypted ?
                            globalData.secret : ""
                let inMode: String = jsonSQLite[0].encrypted ?
                            "secret" : "no-encryption"
                var dbName: String = jsonSQLite[0].database
                dbName.append("SQLite.db")
                do {
                    mDb = try DatabaseHelper(
                        databaseName: dbName,
                        encrypted: jsonSQLite[0].encrypted,
                        mode: inMode, secret: secret, newsecret: "")
                } catch let error {
                    var msg: String = "ImportFromJson command failed :"
                    msg.append(" \(error.localizedDescription)")
                    retHandler.rChanges(call: call,
                                        ret: ["changes": -1],
                                        message: msg)
                }
                if mDb != nil && !(mDb?.isOpen ?? true) {
                    var msg: String = "ImportFromJson command "
                    msg.append("failed : Database \(dbName)")
                    msg.append(" not opened")
                    retHandler.rChanges(call: call,
                                        ret: ["changes": -1],
                                        message: msg)
                } else {
                    do {
                        if let res: [String: Int] =
                                try (mDb?.importFromJson(
                                        jsonSQLite: jsonSQLite[0])) {
                            var msg: String = "ImportFromJson command "
                            msg.append("failed : import JsonObject not")
                            msg.append(" successful")
                            if res["changes"] == -1 {
                                retHandler.rChanges(
                                            call: call,
                                            ret: ["changes": -1],
                                            message: msg )
                            } else {
                                retHandler.rChanges(call: call,
                                                    ret: res)
                            }
                        }
                    } catch DatabaseHelperError.importFromJson(
                                            let message) {
                        var msg: String = "ImportFromJson command "
                        msg.append("failed : \(message)")
                        retHandler.rChanges(
                            call: call,
                            ret: ["changes": -1], message: msg)
                    } catch DatabaseHelperError.tableNotExists(
                                            let message) {
                        retHandler.rChanges(
                            call: call, ret: ["changes": -1],
                            message: message)
                    }
                }
            } catch let error {
                var msg: String = "ImportFromJson command failed : "
                msg.append("Stringify Json Object not Valid ")
                msg.append("\(error.localizedDescription)")
                retHandler.rChanges(
                    call: call, ret: ["changes": -1], message: msg)
            }
        } else {
            var msg: String = "ImportFromJson command failed : "
            msg.append("Stringify Json Object not Valid ")
            retHandler.rChanges(call: call, ret: ["changes": -1],
                                message: msg)
        }
    }
// swiftlint:enable function_body_length

    // MARK: - ExportToJson

    @objc func exportToJson(_ call: CAPPluginCall) {
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
        if mDb != nil {
            do {
                if let res: [String: Any] = try
                                mDb?.exportToJson(expMode: expMode) {
                    if res.count == 5 {
                       retHandler.rJsonSQLite(call: call, ret: res)
                    } else {
                        var msg: String = "ExportToJson command failed"
                        msg.append(" : return Object is not a ")
                        msg.append("JsonSQLite  Object")
                        retHandler.rJsonSQLite(call: call, ret: [:],
                                               message: msg)
                    }
                } else {
                    retHandler.rJsonSQLite(
                            call: call, ret: [:],
                            message: "ExportToJson command failed ")
                }
            } catch let error {
                retHandler.rJsonSQLite(
                    call: call, ret: [:],
                    message: "ExportToJson command failed : \(error)")
            }

        } else {
            var msg: String = "ExportToJson command failed : "
            msg.append("No database connection ")
            retHandler.rJsonSQLite(call: call, ret: [:],
                                   message: msg)
        }
    }

    // MARK: - CreateSyncTable

    @objc func createSyncTable(_ call: CAPPluginCall) {
        if mDb != nil {
            do {
                if let res: Int = try (mDb?.createSyncTable()) {
                    if res == -1 {
                        retHandler.rChanges(
                            call: call, ret: ["changes": -1],
                            message: "createSyncTable command failed")
                    } else {
                        retHandler.rChanges(
                            call: call, ret: ["changes": res])
                    }
                } else {
                    retHandler.rChanges(
                        call: call, ret: ["changes": -1],
                        message: "createSyncTable command failed")
                }
            } catch DatabaseHelperError.createSyncTable(let message) {
                var msg: String = "createSyncTable command failed : "
                msg.append("\(message)")
                retHandler.rChanges(call: call, ret: ["changes": -1],
                                    message: msg)
            } catch let error {
                var msg: String = "createSyncTable command failed : "
                msg.append("\(error)")
                retHandler.rChanges(call: call, ret: ["changes": -1],
                                    message: msg)
            }
        } else {
            var msg: String = "createSyncTable command failed : "
            msg.append("No database connection")
            retHandler.rChanges(call: call, ret: ["changes": -1],
                                message: msg)
        }
    }

    // MARK: - SetSyncDate

    @objc func setSyncDate(_ call: CAPPluginCall) {
        let syncDate: String = call.getString("syncdate") ?? ""
        var msg: String = "setSyncDate command failed : "
        if syncDate.count == 0 {
            msg.append("Must provide a sync date")
            retHandler.rResult(call: call, ret: false, message: msg)
            return
        }
        if mDb != nil {
            do {
                if let res: Bool = try (mDb?.setSyncDate(
                                                syncDate: syncDate)) {
                    if res {
                        retHandler.rResult(call: call, ret: true)
                    } else {
                       retHandler.rResult(
                            call: call, ret: false, message: msg)
                    }
                } else {
                    retHandler.rResult(
                            call: call, ret: false, message: msg)
                }
            } catch DatabaseHelperError.createSyncDate(let message) {
                msg.append("\(message)")
                retHandler.rResult(call: call, ret: false, message: msg)
            } catch let error {
                msg.append("\(error)")
                retHandler.rResult(call: call, ret: false, message: msg)
           }
        } else {
            msg.append("No database connection")
            retHandler.rResult(call: call, ret: false, message: msg)
        }
    }

    // MARK: addUpgradeStatement

    @objc func addUpgradeStatement(_ call: CAPPluginCall) {
        let dbName: String = call.getString("database") ?? ""
        var msg: String = "addUpgradeStatement command failed: "
        if dbName.count == 0 {
            msg.append("Must provide a database name")
            retHandler.rResult(call: call, ret: false, message: msg)
            return
        }
        let upgrade: [[String: Any]] = call.getArray("upgrade",
                                            ([String: Any]).self) ?? []
        if upgrade.count == 0 {
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
        versionUpgrades = ["\(dbName)SQLite.db": upgVersionDict]
        retHandler.rResult(call: call, ret: true)

    }

}
// swiftlint:enable type_body_length
// swiftlint:enable file_length
