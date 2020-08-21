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

    // MARK: - Echo

    @objc func echo(_ call: CAPPluginCall) {
        let value = call.getString("value") ?? ""
        call.success([
            "value": value
        ])
    }

    // MARK: - Open

    @objc func open(_ call: CAPPluginCall) {
        let dbName: String = call.getString("database") ?? ""
        if dbName.count == 0 {
            retHandler.rResult(call: call, ret: false, message: "Open command failed: Must provide a database name")
            return
        }
        let encrypted = call.getBool("encrypted") ?? false
        var inMode: String = ""
        var secretKey: String = ""
        var newsecretKey: String = ""
        var dbVersion: Int = call.getInt("version", 1) ?? 1;
        if encrypted {
            inMode = call.getString("mode") ?? "no-encryption"
            if inMode != "no-encryption" && inMode != "encryption" && inMode != "secret"
                && inMode != "newsecret" && inMode != "wrongsecret" {
                retHandler.rResult(call: call, ret: false,
                    message: "Open command failed: Error inMode must be in ['encryption','secret','newsecret']")
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
           mDb = try DatabaseHelper(databaseName: "\(dbName)SQLite.db", encrypted: encrypted,
                mode: inMode, secret: secretKey, newsecret: newsecretKey, databaseVersion: dbVersion)
        } catch let error {
            retHandler.rResult(call: call, ret: false, message: "Open command failed: \(error)")
        }
        if mDb != nil && !(mDb?.isOpen ?? true) {
            retHandler.rResult(call: call, ret: false,
                message: "Open command failed: Database \(dbName)SQLite.db not opened")
        } else {
            call.success([ "result": true ])
        }
    }

    // MARK: - Close

    @objc func close(_ call: CAPPluginCall) {
        let dbName: String = call.getString("database") ?? ""
        if dbName.count == 0 {
            retHandler.rResult(call: call, ret: false, message: "Close command failed: Must provide a database name")
            return
        }
        if mDb != nil {
            do {
                let res: Bool = try (mDb?.close(databaseName: "\(dbName)SQLite.db")) ?? false
                call.success([ "result": res ])
            } catch DatabaseHelperError.dbConnection(let message) {
                retHandler.rResult(call: call, ret: false, message: "Close command failed: \(message)")
            } catch DatabaseHelperError.close(let message) {
                retHandler.rResult(call: call, ret: false, message: "Close command failed: \(message)")
            } catch let error {
                retHandler.rResult(call: call, ret: false, message: "Close command failed: \(error)")
            }
        } else {
           retHandler.rResult(call: call, ret: false, message: "Close command failed: No database connection")
        }
    }

    // MARK: - Execute

    @objc func execute(_ call: CAPPluginCall) {
        let statements: String = call.getString("statements") ?? ""
        if statements.count == 0 {
            retHandler.rChanges(call: call, ret: ["changes": -1],
                message: "Execute command failed : Must provide raw SQL statements")
            return
        }
        if mDb != nil {
            do {
                let res: Int = try (mDb?.execSQL(sql: statements)) ?? -1
                retHandler.rChanges(call: call, ret: ["changes": res])
            } catch DatabaseHelperError.dbConnection(let message) {
                retHandler.rChanges(call: call, ret: ["changes": -1], message: "Execute command failed : \(message)")
                return
            } catch DatabaseHelperError.execSql(let message) {
                retHandler.rChanges(call: call, ret: ["changes": -1], message: "Execute command failed : \(message)")
                return
            } catch let error {
                retHandler.rChanges(call: call, ret: ["changes": -1], message: "Execute command failed : \(error)")
                return
            }

        } else {
            retHandler.rChanges(call: call, ret: ["changes": -1],
                message: "Execute command failed : No database connection")
        }
    }

    // MARK: - ExecuteSet

    @objc func executeSet(_ call: CAPPluginCall) {
        let set: [[String: Any]] = call.getArray("set", ([String: Any]).self) ?? []
        if set.count == 0 {
            retHandler.rChanges(call: call, ret: ["changes": -1],
                message: "ExecuteSet command failed : Must provide a set of SQL statements")
            return
        }
        if mDb != nil {
            if set.count == 0 {
                retHandler.rChanges(call: call, ret: ["changes": -1],
                    message: "ExecuteSet command failed : Must provide a non-empty set of SQL statements")
            }
            for dict in set {
//                let row: NSMutableDictionary = dict as! NSMutableDictionary
//                let keys: [String] = row.allKeys as! [String]
                let keys = dict.keys
                if !(keys.contains("statement")) || !(keys.contains("values")) {
                    retHandler.rChanges(call: call, ret: ["changes": -1],
                        message: "ExecuteSet command failed : Must provide a set as Array of {statement,values}")
                }
            }
            do {
                if let res: Int = try (mDb?.execSet(set: set)) {
                    retHandler.rChanges(call: call, ret: ["changes": res])
                }
            } catch DatabaseHelperError.dbConnection(let message) {
                retHandler.rChanges(call: call, ret: ["changes": -1], message: "Execute command failed : \(message)")
            } catch DatabaseHelperError.execSql(let message) {
                retHandler.rChanges(call: call, ret: ["changes": -1], message: "Execute command failed : \(message)")
            } catch let error {
                retHandler.rChanges(call: call, ret: ["changes": -1], message: "Execute command failed : \(error)")
            }

        } else {
            retHandler.rChanges(call: call, ret: ["changes": -1],
                message: "ExecuteSet command failed : No database connection")
        }
    }

    // MARK: - Run

    @objc func run(_ call: CAPPluginCall) {
        let statement: String = call.getString("statement") ?? ""
        if statement.count == 0 {
            retHandler.rChanges(call: call, ret: ["changes": -1],
                message: "Run command failed : Must provide a SQL statement")
            return
        }
        let values: [Any] = call.getArray("values", (Any).self) ?? [-9999999]
        if values.count == 1 && values[0] as? Int == -9999999 {
            retHandler.rChanges(call: call, ret: ["changes": -1],
                message: "Run command failed : Values should be an Array of values")
            return
        }
        if mDb != nil {
            do {
                var val: [Any] = []
                if values.count > 0 {
                    for value in values {
                        if let obj = value as? String {
                            let str: String = "\(String(describing: obj))"
                            val.append(str)
                        } else if let obj = value as? Int {
                            val.append(obj)
                        } else if let obj = value as? Float {
                            val.append(obj)
                        } else {
                            retHandler.rChanges(call: call, ret: ["changes": -1],
                                message: "Run command failed : Not a SQL type")
                        }
                    }
                }
                if let res = try (mDb?.runSQL(sql: statement, values: val)) {
                    retHandler.rChanges(call: call, ret: res)
                }
            } catch DatabaseHelperError.dbConnection(let message) {
                retHandler.rChanges(call: call, ret: ["changes": -1], message: "Run command failed : \(message)")
            } catch DatabaseHelperError.runSql(let message) {
                retHandler.rChanges(call: call, ret: ["changes": -1], message: "Run command failed : \(message)")
            } catch let error {
                retHandler.rChanges(call: call, ret: ["changes": -1], message: "Run command failed : \(error)")
            }
        } else {
            retHandler.rChanges(call: call, ret: ["changes": -1],
                message: "Run command failed : No database connection")
        }
    }

    // MARK: - Query

    @objc func query(_ call: CAPPluginCall) {
        let statement: String = call.getString("statement") ?? ""
        if statement.count == 0 {
            retHandler.rValues(call: call, ret: [], message: "Query command failed : Must provide a query statement")
            return
        }
        let values: [String] = call.getArray("values", (String).self) ?? ["NULL"]
        if values.count == 1 && values[0] == "NULL" {
            retHandler.rValues(call: call, ret: [],
                message: "Query command failed : Values should be an Array of string")
            return
        }
        if mDb != nil {
//            let res: [[String: Any]]
            do {
/*                if values.count > 0 {
                    res = try (mDb?.selectSQL(sql: statement, values: values))!
                } else {
                    res = try (mDb?.selectSQL(sql: statement, values: []))!
                }
 */
                if let res: [[String: Any]] = try (mDb?.selectSQL(sql: statement, values: values)) {
                    retHandler.rValues(call: call, ret: res)
                } else {
                    retHandler.rValues(call: call, ret: [], message: "Query command failed : Error in selectSQL")
                }
            } catch DatabaseHelperError.dbConnection(let message) {
                retHandler.rValues(call: call, ret: [], message: "Query command failed : \(message)")
            } catch DatabaseHelperError.selectSql(let message) {
                retHandler.rValues(call: call, ret: [], message: "Query command failed : \(message)")
            } catch let error {
                retHandler.rValues(call: call, ret: [], message: "Query command failed : \(error)")
            }
        } else {
            retHandler.rValues(call: call, ret: [], message: "Query command failed : No database connection")
        }
    }

    // MARK: - isDBExists

    @objc func isDBExists(_ call: CAPPluginCall) {
        let dbName: String = call.getString("database") ?? ""
        if dbName.count == 0 {
            retHandler.rResult(call: call, ret: false,
                message: "idDBExists command failed: Must provide a database name")
            return
        }
        do {
            let filePath: String = try UtilsSQLite.getFilePath(fileName: "\(dbName)SQLite.db")
            let res: Bool = UtilsSQLite.isFileExist(filePath: filePath)
            if res {
                retHandler.rResult(call: call, ret: true)
            } else {
                retHandler.rResult(call: call, ret: false, message: "Database \(dbName)SQLite.db does not exist")
            }
        } catch UtilsSQLiteError.filePathFailed {
            retHandler.rResult(call: call, ret: false, message: "isDBExists command failed : file path failed")
        } catch let error {
            retHandler.rResult(call: call, ret: false, message: "isDBExists command failed : \(error)")
        }
    }
    // MARK: - DeleteDatabase

    @objc func deleteDatabase(_ call: CAPPluginCall) {
        let dbName: String = call.getString("database") ?? ""
        if dbName.count == 0 {
            retHandler.rResult(call: call, ret: false,
                message: "DeleteDatabase command failed: Must provide a database name")
            return
        }
        if mDb != nil {
            do {
                if let res: Bool = try (mDb?.deleteDB(databaseName: "\(dbName)SQLite.db")) {
                    retHandler.rResult(call: call, ret: res)
                } else {
                    retHandler.rResult(call: call, ret: false,
                        message: "DeleteDatabase command failed: Database \(dbName)SQLite.db does not exist")
                }
            } catch DatabaseHelperError.deleteDB(let message) {
                retHandler.rResult(call: call, ret: false, message: "DeleteDatabase command failed: \(message)")
            } catch let error {
                retHandler.rResult(call: call, ret: false, message: "DeleteDatabase command failed: \(error)")
            }
        } else {
                retHandler.rResult(call: call, ret: false,
                    message: "DeleteDatabase command failed: The database is not opened")
        }
    }

    // MARK: - IsJsonValid

    @objc func isJsonValid(_ call: CAPPluginCall) {
        let parsingData: String = call.getString("jsonstring") ?? ""
        if parsingData.count == 0 {
            retHandler.rResult(call: call, ret: false,
                message: "IsJsonValid command failed : Must provide a Stringify Json Object")
            return
        }
        if let data = ("["+parsingData+"]").data(using: .utf8) {
            do {
                _ = try JSONDecoder().decode([JsonSQLite].self, from: data)
                retHandler.rResult(call: call, ret: true)
            } catch let error {
               retHandler.rResult(call: call, ret: false,
                message: "IsJsonValid command failed : Stringify Json Object not Valid " + error.localizedDescription)
            }
        } else {
            retHandler.rResult(call: call, ret: false,
                message: "IsJsonValid command failed : Stringify Json Object not Valid ")
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
                let jsonSQLite = try JSONDecoder().decode([JsonSQLite].self, from: data)
                let secret: String = jsonSQLite[0].encrypted ? globalData.secret : ""
                let inMode: String = jsonSQLite[0].encrypted ? "secret" : "no-encryption"
                var dbVersion: Int = call.getInt("version", 1) ?? 1
                do {
                   mDb = try DatabaseHelper(databaseName: jsonSQLite[0].database + "SQLite.db",
                                            encrypted: jsonSQLite[0].encrypted, mode: inMode, secret: secret,
                                            newsecret: "", databaseVersion: dbVersion)
                } catch let error {
                    retHandler.rChanges(call: call, ret: ["changes": -1],
                        message: "ImportFromJson command failed : " + error.localizedDescription)
                }
                if mDb != nil && !(mDb?.isOpen ?? true) {
                    let message: String = "ImportFromJson command failed : Database " +
                    "\(jsonSQLite[0].database)SQLite.db not opened"
                    retHandler.rChanges(call: call, ret: ["changes": -1], message: message)
                } else {
                    do {
                        if let res: [String: Int] = try (mDb?.importFromJson(jsonSQLite: jsonSQLite[0])) {
                            if res["changes"] == -1 {
                                retHandler.rChanges(call: call, ret: ["changes": -1],
                                    message: "ImportFromJson command failed : import JsonObject not successful")
                            } else {
                                retHandler.rChanges(call: call, ret: res)
                            }
                        }
                    } catch DatabaseHelperError.importFromJson(let message) {
                        retHandler.rChanges(call: call, ret: ["changes": -1],
                            message: "ImportFromJson command failed : \(message)")
                    } catch DatabaseHelperError.tableNotExists(let message) {
                        retHandler.rChanges(call: call, ret: ["changes": -1], message: message)
                    }
                }
            } catch let error {
                let message: String = "ImportFromJson command failed : Stringify Json Object not Valid "
                    + error.localizedDescription
                retHandler.rChanges(call: call, ret: ["changes": -1], message: message)
            }
        } else {
            retHandler.rChanges(call: call, ret: ["changes": -1],
                message: "ImportFromJson command failed : Stringify Json Object not Valid ")
        }
    }
// swiftlint:enable function_body_length

    // MARK: - ExportToJson

    @objc func exportToJson(_ call: CAPPluginCall) {
        let expMode: String = call.getString("jsonexportmode") ?? ""
        if expMode.count == 0 {
            retHandler.rJsonSQLite(call: call, ret: [:],
                message: "ExportToJson command failed : Must provide an export mode")
            return
        }
        if expMode != "full" && expMode != "partial" {
            retHandler.rJsonSQLite(call: call, ret: [:],
                message: "ExportToJson command failed : Json export mode should be 'full' or 'partial'")
            return
        }
        if mDb != nil {
            do {
                if let res: [String: Any] = try (mDb?.exportToJson(expMode: expMode)) {
                    if res.count == 4 {
                       retHandler.rJsonSQLite(call: call, ret: res)
                    } else {
                        retHandler.rJsonSQLite(call: call, ret: [:],
                            message: "ExportToJson command failed :return Obj is not a JsonSQLite Obj")
                    }
                } else {
                    retHandler.rJsonSQLite(call: call, ret: [:], message: "ExportToJson command failed ")
                }
            } catch let error {
                retHandler.rJsonSQLite(call: call, ret: [:], message: "ExportToJson command failed : \(error)")
            }

        } else {
            retHandler.rJsonSQLite(call: call, ret: [:],
                message: "ExportToJson command failed: No database connection ")
        }
    }

    // MARK: - CreateSyncTable

    @objc func createSyncTable(_ call: CAPPluginCall) {
        if mDb != nil {
            do {
                if let res: Int = try (mDb?.createSyncTable()) {
                    if res == -1 {
                        retHandler.rChanges(call: call, ret: ["changes": -1], message: "createSyncTable command failed")
                    } else {
                        retHandler.rChanges(call: call, ret: ["changes": res])
                    }
                } else {
                    retHandler.rChanges(call: call, ret: ["changes": -1], message: "createSyncTable command failed")
                }
            } catch DatabaseHelperError.createSyncTable(let message) {
                retHandler.rChanges(call: call, ret: ["changes": -1],
                    message: "createSyncTable command failed : \(message)")
            } catch let error {
                retHandler.rChanges(call: call, ret: ["changes": -1],
                    message: "createSyncTable command failed: \(error)")
            }
        } else {
            retHandler.rChanges(call: call, ret: ["changes": -1],
                message: "createSyncTable command failed: No database connection ")
        }
    }

    // MARK: - SetSyncDate

    @objc func setSyncDate(_ call: CAPPluginCall) {
        let syncDate: String = call.getString("syncdate") ?? ""
        if syncDate.count == 0 {
            retHandler.rResult(call: call, ret: false, message: "setSyncDate command failed: Must provide a sync date")
            return
        }
        if mDb != nil {
            do {
                if let res: Bool = try (mDb?.setSyncDate(syncDate: syncDate)) {
                    if res {
                        retHandler.rResult(call: call, ret: true)
                    } else {
                       retHandler.rResult(call: call, ret: false, message: "setSyncDate command failed")
                    }
                } else {
                    retHandler.rResult(call: call, ret: false, message: "setSyncDate command failed")
                }
            } catch DatabaseHelperError.createSyncDate(let message) {
                retHandler.rResult(call: call, ret: false, message: "setSyncDate command failed: \(message)")
            } catch let error {
                retHandler.rResult(call: call, ret: false, message: "setSyncDate command failed: \(error)")
           }
        } else {
            retHandler.rChanges(call: call, ret: ["changes": -1],
                message: "setSyncDate command failed: No database connection ")
        }
    }
}
// swiftlint:enable type_body_length
// swiftlint:enable file_length
