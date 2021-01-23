import Foundation
import Capacitor

@objc(CapacitorSQLitePlugin)
// swiftlint:disable file_length
// swiftlint:disable type_body_length
public class CapacitorSQLitePlugin: CAPPlugin {
    private let implementation = CapacitorSQLite()
    private let modeList: [String] = ["no-encryption", "encryption", "secret", "newsecret", "wrongsecret"]
    private let retHandler: ReturnHandler = ReturnHandler()
    private var versionUpgrades: [String: [Int: [String: Any]]] = [:]

    // MARK: - Echo

    @objc func echo(_ call: CAPPluginCall) {
        let value = call.getString("value") ?? ""
        call.resolve([
            "value": implementation.echo(value)
        ])
    }

    // MARK: - CreateConnection

    @objc func createConnection(_ call: CAPPluginCall) {
        guard let dbName = call.options["database"] as? String else {
            retHandler.rResult(
                call: call,
                message: "CreateConnection: Must provide a database name")
            return
        }
        let version: Int = call.getInt("version") ?? 1
        let encrypted: Bool = call
            .getBool("encrypted") ?? false
        let inMode: String = call
            .getString("mode") ?? "no-encryption"
        if encrypted && !modeList.contains(inMode) {
            var msg: String = "CreateConnection: inMode "
            msg.append("must be in['encryption',")
            msg.append("'secret','newsecret']")
            retHandler.rResult(call: call, message: msg)
            return
        }
        var upgDict: [Int: [String: Any]] = [:]
        if let cUpgDict = versionUpgrades[dbName] {
            upgDict = cUpgDict
        }
        do {
            try implementation.createConnection(dbName,
                                                encrypted: encrypted,
                                                mode: inMode,
                                                version: version,
                                                vUpgDict: upgDict)
            retHandler.rResult(call: call)
            return
        } catch CapacitorSQLiteError.failed(let message) {
            let msg = "CreateConnection: \(message)"
            retHandler.rResult(call: call, message: msg)
            return
        } catch let error {
            retHandler.rResult(
                call: call,
                message: "CreateConnection: \(error.localizedDescription)")
            return
        }
    }

    // MARK: - Open

    @objc func open(_ call: CAPPluginCall) {
        guard let dbName = call.options["database"] as? String else {
            retHandler.rResult(
                call: call,
                message: "Open: Must provide a database name")
            return
        }
        do {
            try implementation.open(dbName)
            retHandler.rResult(call: call)
            return
        } catch CapacitorSQLiteError.failed(let message) {
            let msg = "Open: \(message)"
            retHandler.rResult(call: call, message: msg)
            return
        } catch let error {
            retHandler.rResult(
                call: call,
                message: "Open: \(error.localizedDescription)")
            return
        }
    }

    // MARK: - Close

    @objc func close(_ call: CAPPluginCall) {
        guard let dbName = call.options["database"] as? String else {
            retHandler.rResult(
                call: call,
                message: "Close: Must provide a database name")
            return
        }
        do {
            try implementation.close(dbName)
            retHandler.rResult(call: call)
            return
        } catch CapacitorSQLiteError.failed(let message) {
            let msg = "Close: \(message)"
            retHandler.rResult(call: call, message: msg)
            return
        } catch let error {
            retHandler.rResult(
                call: call,
                message: "Close: \(error.localizedDescription)")
            return
        }
    }

    // MARK: - Close Connection

    @objc func closeConnection(_ call: CAPPluginCall) {
        guard let dbName = call.options["database"] as? String else {
            retHandler.rResult(
                call: call,
                message: "CloseConnection: Must provide a database name")
            return
        }
        do {
            try implementation.closeConnection(dbName)
            retHandler.rResult(call: call)
            return
        } catch CapacitorSQLiteError.failed(let message) {
            let msg = "CloseConnection: \(message)"
            retHandler.rResult(call: call, message: msg)
            return
        } catch let error {
            retHandler.rResult(
                call: call,
                message: "CloseConnection: \(error.localizedDescription)")
            return
        }

    }

    // MARK: - Execute

    @objc func execute(_ call: CAPPluginCall) {

        guard let dbName = call.options["database"] as? String else {
            retHandler.rChanges(
                call: call, ret: ["changes": -1],
                message: "Execute: Must provide a database name")
            return
        }
        let statements: String = call.getString("statements") ?? ""
        if statements.count == 0 {
            let msg: String = "Execute: Must provide raw SQL statements"
            retHandler.rChanges(
                call: call, ret: ["changes": -1],
                message: msg)
            return
        }
        do {
            let res = try implementation.execute(dbName, statements: statements)
            retHandler.rChanges(call: call, ret: res)
            return
        } catch CapacitorSQLiteError.failed(let message) {
            retHandler.rChanges(
                call: call, ret: ["changes": -1],
                message: "Execute: \(message)")
            return
        } catch let error {
            retHandler.rChanges(
                call: call, ret: ["changes": -1],
                message: "Execute: \(error.localizedDescription)")
            return
        }

    }

    // MARK: - ExecuteSet
    // swiftlint:disable function_body_length
    @objc func executeSet(_ call: CAPPluginCall) {
        guard let dbName = call.options["database"] as? String else {
            retHandler.rChanges(
                call: call, ret: ["changes": -1],
                message: "ExecuteSet: Must provide a database name")
            return
        }
        guard let set = call.options["set"] as? [[String: Any]] else {
            var msg: String = "ExecuteSet: "
            msg.append("Must provide a set of SQL statements")
            retHandler.rChanges(
                call: call, ret: ["changes": -1], message: msg)
            return

        }
        if set.count == 0 {
            var msg: String = "ExecuteSet: Must "
            msg.append("provide a non-empty set of SQL statements")
            retHandler.rChanges(call: call, ret: ["changes": -1],
                                message: msg)
            return
        }
        for dict in set {
            let keys = dict.keys
            if !(keys.contains("statement")) ||
                !(keys.contains("values")) {
                var msg: String = "ExecuteSet: "
                msg.append("Must provide a set as Array of ")
                msg.append("{statement,values}")
                retHandler.rChanges(call: call, ret: ["changes": -1],
                                    message: msg)
                return
            }
        }
        do {
            let res = try implementation.executeSet(dbName, set: set)
            retHandler.rChanges(call: call, ret: res)
            return
        } catch CapacitorSQLiteError.failed(let message) {
            retHandler.rChanges(
                call: call, ret: ["changes": -1],
                message: "ExecuteSet: \(message)")
            return
        } catch let error {
            retHandler.rChanges(
                call: call, ret: ["changes": -1],
                message: "ExecuteSet: \(error.localizedDescription)")
            return
        }

    }
    // swiftlint:enable function_body_length

    // MARK: - Run

    @objc func run(_ call: CAPPluginCall) {
        guard let dbName = call.options["database"] as? String else {
            retHandler.rChanges(
                call: call, ret: ["changes": -1],
                message: "Run: Must provide a database name")
            return
        }
        guard let statement = call.options["statement"]
                as? String else {
            let msg: String =
                "Run: Must provide a SQL statement"
            retHandler.rChanges(call: call,
                                ret: ["changes": -1],
                                message: msg)
            return
        }
        guard let values = call.options["values"]
                as? [Any] else {
            retHandler.rChanges(
                call: call, ret: ["changes": -1],
                message: "Run: Must provide an Array of values")
            return
        }
        do {
            let res = try
                implementation.run(dbName,
                                   statement: statement,
                                   values: values)
            retHandler.rChanges(call: call, ret: res)
            return
        } catch CapacitorSQLiteError.failed(let message) {
            retHandler.rChanges(
                call: call, ret: ["changes": -1],
                message: "Run: \(message)")
            return
        } catch let error {
            retHandler.rChanges(
                call: call, ret: ["changes": -1],
                message: "Run: \(error.localizedDescription)")
            return
        }

    }

    // MARK: - Query

    @objc func query(_ call: CAPPluginCall) {
        guard let dbName = call.options["database"]
                as? String else {
            var msg: String = "Query: "
            msg.append("Must provide a database name")
            retHandler.rValues(call: call, ret: [],
                               message: msg)
            return
        }

        guard let statement = call.options["statement"]
                as? String else {
            var msg: String = "Query: "
            msg.append("Must provide a query statement")
            retHandler.rValues(call: call, ret: [],
                               message: msg)
            return
        }
        guard let values = call.options["values"] as? [String] else {
            var msg: String = "Query: "
            msg.append("Must provide an Array of string")
            retHandler.rValues(call: call, ret: [],
                               message: msg)
            return

        }
        do {
            let res = try
                implementation.query(dbName,
                                     statement: statement,
                                     values: values)
            retHandler.rValues(call: call, ret: res)
            return
        } catch CapacitorSQLiteError.failed(let message) {
            retHandler.rValues(
                call: call, ret: [],
                message: "Query: \(message)")
            return
        } catch let error {
            retHandler.rValues(
                call: call, ret: [],
                message: "Query: \(error.localizedDescription)")
            return
        }

    }

    // MARK: - isDBExists

    @objc func isDBExists(_ call: CAPPluginCall) {
        guard let dbName = call.options["database"]
                as? String else {
            retHandler.rResult(
                call: call,
                message: "isDBExists: Must provide a database name")
            return
        }
        do {
            let res = try implementation.isDBExists(dbName)
            var bRes: Bool = false
            if res == 1 {
                bRes = true
            }
            retHandler.rResult(call: call, ret: bRes)
            return
        } catch CapacitorSQLiteError.failed(let message) {
            let msg = "isDBExists: \(message)"
            retHandler.rResult(call: call, message: msg)
            return
        } catch let error {
            retHandler.rResult(
                call: call,
                message: "isDBExists: \(error.localizedDescription)")
            return
        }

    }
    // MARK: - DeleteDatabase

    @objc func deleteDatabase(_ call: CAPPluginCall) {
        guard let dbName = call.options["database"]
                as? String else {
            let msg = "deleteDatabase: Must provide a database name"
            retHandler.rResult(call: call, message: msg)
            return
        }
        do {
            try implementation.deleteDatabase(dbName)
            retHandler.rResult(call: call)
            return
        } catch CapacitorSQLiteError.failed(let message) {
            let msg = "deleteDatabase: \(message)"
            retHandler.rResult(call: call, message: msg)
            return
        } catch let error {
            let msg = "deleteDatabase: \(error.localizedDescription)"
            retHandler.rResult(call: call, message: msg)
            return
        }
    }

    // MARK: - IsJsonValid

    @objc func isJsonValid(_ call: CAPPluginCall) {
        let parsingData: String = call.getString("jsonstring") ?? ""
        if parsingData.count == 0 {
            var msg: String = "IsJsonValid: "
            msg.append("Must provide a Stringify Json Object")
            retHandler.rResult(call: call, message: msg)
            return
        }
        do {
            try implementation.isJsonValid(parsingData)
            retHandler.rResult(call: call, ret: true)
            return
        } catch CapacitorSQLiteError.failed(let message) {
            let msg = "isJsonValid: \(message)"
            retHandler.rResult(call: call, message: msg)
            return
        } catch let error {
            let msg = "isJsonValid: \(error.localizedDescription)"
            retHandler.rResult(call: call, message: msg)
            return
        }
    }

    // MARK: - ImportFromJson

    @objc func importFromJson(_ call: CAPPluginCall) {
        let parsingData: String = call.getString("jsonstring") ?? ""
        if parsingData.count == 0 {
            retHandler.rChanges(call: call, ret: ["changes": -1],
                                message: "ImportFromJson: " +
                                    "Must provide a Stringify Json Object")
            return
        }
        do {
            let res: [String: Int]  = try implementation.importFromJson(parsingData)
            retHandler.rChanges(call: call, ret: ["changes": res])
            return
        } catch CapacitorSQLiteError.failed(let message) {
            retHandler.rChanges(
                call: call, ret: ["changes": -1],
                message: "importFromJson: \(message)")
            return
        } catch let error {
            let msg = "importFromJson: " +
                "\(error.localizedDescription)"
            retHandler.rChanges(
                call: call, ret: ["changes": -1],
                message: msg)
            return
        }

    }

    // MARK: - ExportToJson

    @objc func exportToJson(_ call: CAPPluginCall) {
        guard let dbName = call.options["database"]
                as? String else {
            let msg = "ExportToJson: Must provide a database name"
            retHandler.rJsonSQLite(call: call, ret: [:],
                                   message: msg)
            return
        }
        let expMode: String = call.getString("jsonexportmode") ?? ""
        if expMode.count == 0 {
            var msg: String = "ExportToJson: "
            msg.append("Must provide an export mode")
            retHandler.rJsonSQLite(call: call, ret: [:],
                                   message: msg)
            return
        }
        if expMode != "full" && expMode != "partial" {
            var msg: String = "ExportToJson : Json export "
            msg.append("mode should be 'full' or 'partial'")
            retHandler.rJsonSQLite(call: call, ret: [:],
                                   message: msg)
            return
        }

        do {
            let res: [String: Any] = try implementation
                .exportToJson(dbName, expMode: expMode)
            retHandler.rJsonSQLite(call: call, ret: res)
            return
        } catch CapacitorSQLiteError.failed(let message) {
            let msg = "deleteDatabase: \(message)"
            retHandler.rJsonSQLite(call: call, ret: [:],
                                   message: msg)
            return
        } catch let error {
            let msg = "deleteDatabase: \(error.localizedDescription)"
            retHandler.rJsonSQLite(call: call, ret: [:],
                                   message: msg)
            return
        }

    }

    // MARK: - CreateSyncTable

    @objc func createSyncTable(_ call: CAPPluginCall) {
        guard let dbName = call.options["database"] as? String else {
            retHandler.rChanges(
                call: call, ret: ["changes": -1],
                message: "createSyncTable: " +
                    "Must provide a database name")
            return
        }
        do {
            let res: NSNumber = try implementation
                .createSyncTable(dbName)
            retHandler.rChanges(call: call,
                                ret: ["changes": Int(truncating: res)])
            return
        } catch CapacitorSQLiteError.failed(let message) {
            let msg = "createSyncTable: \(message)"
            retHandler.rChanges(call: call, ret: ["changes": -1],
                                message: msg)
            return
        } catch let error {
            let msg = "createSyncTable: \(error.localizedDescription)"
            retHandler.rChanges(call: call, ret: ["changes": -1],
                                message: msg)
            return
        }

    }

    // MARK: - SetSyncDate

    @objc func setSyncDate(_ call: CAPPluginCall) {
        guard let dbName = call.options["database"]
                as? String else {
            let msg = "setSyncDate: Must provide a database name"
            retHandler.rResult(call: call, message: msg)
            return
        }
        guard let syncDate = call.options["syncdate"] as? String else {
            var msg = "setSyncDate: Must provide a "
            msg.append("synchronization date")
            retHandler.rResult(call: call, message: msg)
            return
        }
        do {
            try implementation.setSyncDate( dbName, syncDate: syncDate)
            retHandler.rResult(call: call)
            return
        } catch CapacitorSQLiteError.failed(let message) {
            let msg = "setSyncDate: \(message)"
            retHandler.rResult(call: call, message: msg)
            return
        } catch let error {
            let msg = "setSyncDate: \(error.localizedDescription)"
            retHandler.rResult(call: call, message: msg)
            return
        }
    }

    // MARK: - GetSyncDate

    @objc func getSyncDate(_ call: CAPPluginCall) {
        var msg: String = "setSyncDate command failed: "
        guard let dbName = call.options["database"]
                as? String else {
            let msg = "getSyncDate: Must provide a database name"
            retHandler.rSyncDate(call: call, ret: 0, message: msg)
            return
        }
        do {
            let res: NSNumber = try implementation.getSyncDate( dbName)
            retHandler.rSyncDate(call: call,
                                 ret: Int64(truncating: res))
            return
        } catch CapacitorSQLiteError.failed(let message) {
            let msg = "getSyncDate: \(message)"
            retHandler.rSyncDate(call: call, ret: 0, message: msg)
            return
        } catch let error {
            let msg = "getSyncDate: \(error.localizedDescription)"
            retHandler.rSyncDate(call: call, ret: 0, message: msg)
            return
        }

    }

    // MARK: addUpgradeStatement

    @objc func addUpgradeStatement(_ call: CAPPluginCall) {
        guard let dbName = call.options["database"]
                as? String else {
            let msg = "deleteDatabase: Must provide a database name"
            retHandler.rResult(call: call, message: msg)
            return
        }
        guard let upgrade = call.options["upgrade"] as?
                [[String: Any]] else {
            let msg = "Must provide an upgrade statement"
            retHandler.rResult(call: call, message: msg)
            return
        }
        do {
            let upgVersionDict: [Int: [String: Any]] = try
                implementation.addUpgradeStatement(dbName,
                                                   upgrade: upgrade)
            versionUpgrades = ["\(dbName)": upgVersionDict]
            retHandler.rResult(call: call)
            return
        } catch CapacitorSQLiteError.failed(let message) {
            let msg = "addUpgradeStatement: \(message)"
            retHandler.rResult(call: call, message: msg)
            return
        } catch let error {
            var  msg = "addUpgradeStatement: "
            msg.append("\(error.localizedDescription)")
            retHandler.rResult(call: call, message: msg)
            return
        }
    }

    // MARK: copyFromAssets

    @objc func copyFromAssets(_ call: CAPPluginCall) {
        do {
            try implementation.copyFromAssets()
            retHandler.rResult(call: call)
            return
        } catch CapacitorSQLiteError.failed(let message) {
            let msg = "copyFromAssets: \(message)"
            retHandler.rResult(call: call, message: msg)
            return
        } catch let error {
            let msg = "copyFromAssets: \(error.localizedDescription)"
            retHandler.rResult(call: call, message: msg)
            return
        }
    }
}
// swiftlint:enable type_body_length
// swiftlint:enable file_length
