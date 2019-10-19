import Foundation
import Capacitor

/**
 * Please read the Capacitor iOS Plugin Development Guide
 * here: https://capacitor.ionicframework.com/docs/plugins/ios
 */
@objc(CapacitorSQLite)
public class CapacitorSQLite: CAPPlugin {
    var mDb: DatabaseHelper?
    
    @objc func echo(_ call: CAPPluginCall) {
        let value = call.getString("value") ?? ""
        call.success([
            "value": value
        ])
    }
    @objc func open(_ call: CAPPluginCall) {
        guard let name = call.options["name"] as? String else {
            call.reject("Must provide a database name")
            return
        }
        mDb = DatabaseHelper(databaseName:"\(name).db")
        if(mDb != nil) {
            call.success([
                "result": true
            ])
        } else {
            call.reject("No database connection")
        }
    }
    @objc func execute(_ call: CAPPluginCall) {
        guard let statements = call.options["statements"] as? String else {
            call.reject("Must provide raw SQL statements")
            return
        }
        if(mDb != nil) {
            do {
                let res: Int? = try (mDb?.execSQL(sql:statements))
                call.success([
                    "result": res!
                ])
            } catch DatabaseHelperError.dbConnection(let message) {
                call.reject("\(message)")
            } catch DatabaseHelperError.execSql(let message){
                call.reject("Execute command failed \(message)")
            } catch {
                call.reject("Unexpected error: \(error).")
            }

        } else {
           call.reject("No database connection")
        }
    }
    @objc func run(_ call: CAPPluginCall) {
        guard let statement = call.options["statement"] as? String else {
            call.reject("Must provide a SQL statement")
            return
        }
        guard let values = call.options["values"] as? Array<Array<Any>> else {
            call.reject("Values should be an Array of Array of value")
            return
        }
        if(mDb != nil) {
            do {
                var res: Int?
                if(values.count > 0 ) {
                    var val: Array<Any> = []
                    for value in values {
                        if(value[1] as! String == "TEXT") {
                            let str: String = "\(String(describing: value[0]))"
                            val.append(str)
                        } else if (value[1] as! String == "INTEGER") {
                            val.append(value[0] as! Int)
                        } else if (value[1] as! String == "REAL") {
                            val.append(value[0] as! Double)
                        } else {
                            val.append(value[0])
                        }
                    }
                    res = try (mDb?.runSQL(sql:statement,values: val))
                } else {
                    res = try (mDb?.runSQL(sql:statement,values: []))
                }
                call.success([
                    "result": res!
                ])
            } catch DatabaseHelperError.dbConnection(let message) {
                call.reject("\(message)")
            } catch DatabaseHelperError.runSql(let message) {
                call.reject("run command failed \(message)")
            } catch {
                call.reject("Unexpected error: \(error).")
            }

        } else {
           call.reject("No database connection")
        }
    }
    @objc func query(_ call: CAPPluginCall) {
        guard let statement = call.options["statement"] as? String else {
            call.reject("Must provide a query statement")
            return
        }
        if(mDb != nil) {
            do {
                let res:Array<[String: Any]> = try (mDb?.selectSQL(sql:statement))!;
                call.success([
                    "result": res
                ])
            } catch DatabaseHelperError.dbConnection(let message) {
                call.reject("\(message)")
            } catch DatabaseHelperError.selectSql(let message) {
                    call.reject("query command failed \(message)")
            } catch {
                call.reject("Unexpected error: \(error).")
            }

        } else {
           call.reject("No database connection")
        }

    }
    @objc func deleteDatabaset(_ call: CAPPluginCall) {
        guard let name = call.options["name"] as? String else {
            call.reject("Must provide a database name")
            return
        }
        do {
            try mDb?.deleteDB(databaseName:"\(name).db");
            call.success([
                "result": true
            ])
        } catch DatabaseHelperError.deleteDB(let message) {
            call.reject("\(message)")
        } catch {
            call.reject("Unexpected error: \(error).");
        }

    }
}
