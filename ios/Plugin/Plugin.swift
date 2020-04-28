import Foundation
import Capacitor
import SQLCipher

/**
 * Please read the Capacitor iOS Plugin Development Guide
 * here: https://capacitor.ionicframework.com/docs/plugins/ios
 */
@objc(CapacitorSQLite)
public class CapacitorSQLite: CAPPlugin {
    var mDb: DatabaseHelper?
    var globalData: GlobalSQLite = GlobalSQLite()
    
    // MARK: - Echo

    @objc func echo(_ call: CAPPluginCall) {
        let value = call.getString("value") ?? ""
        call.success([
            "value": value
        ])
    }
    
    // MARK: - Open
    
    @objc func open(_ call: CAPPluginCall) {
        guard let dbName = call.options["database"] as? String else {
            retResult(call:call,ret:false,message:"Must provide a database name")
            return
        }
        let encrypted = call.options["encrypted"] as? Bool ?? false
        var inMode: String = ""
        var secretKey:String = ""
        var newsecretKey: String = ""
        if encrypted {
            inMode = call.options["mode"] as? String ?? "no-encryption"
            if inMode != "no-encryption" && inMode != "encryption" && inMode != "secret" && inMode != "newsecret" && inMode != "wrongsecret" {
                retResult(call:call,ret:false,message:"Open command failed: Error inMode must be in ['encryption','secret','newsecret']")
            }
            if inMode == "encryption" || inMode == "secret" {
                secretKey = globalData.secret
                // this is only done for testing multiples runs
                newsecretKey = globalData.newsecret;
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
           mDb = try DatabaseHelper(databaseName:"\(dbName)SQLite.db", encrypted: encrypted, mode: inMode, secret:secretKey,newsecret:newsecretKey)
        } catch let error {
            retResult(call:call,ret:false,message:"Open command failed: \(error)")
        }
        if mDb != nil && !mDb!.isOpen {
            retResult(call:call,ret:false,message:"Open command failed: Database \(dbName)SQLite.db not opened")
        } else {
            retResult(call:call,ret:true)
        }
    }
    
    // MARK: - Close
    
    @objc func close(_ call: CAPPluginCall) {
        guard let dbName = call.options["database"] as? String else {
            retResult(call:call,ret:false,message:"Close command failed: Must provide a database name")
            return
        }
        if(mDb != nil) {
            do {
                let res: Bool? = try (mDb?.close(databaseName:"\(dbName)SQLite.db"))
                retResult(call:call,ret:res!)
            } catch DatabaseHelperError.dbConnection(let message) {
                retResult(call:call,ret:false,message:"Close command failed: \(message)")
            } catch DatabaseHelperError.close(let message){
                retResult(call:call,ret:false,message:"Close command failed: \(message)")
            } catch let error {
                retResult(call:call,ret:false,message:"Close command failed: \(error)")
            }

        } else {
           retResult(call:call,ret:false,message:"Close command failed: No database connection")
        }
    }
    
    // MARK: - Execute
    
        @objc func execute(_ call: CAPPluginCall) {
        guard let statements = call.options["statements"] as? String else {
            retChanges(call:call,ret:["changes":-1],message:"Execute command failed : Must provide raw SQL statements")
            return
        }
        if(mDb != nil) {
            do {
                let res: Int? = try (mDb?.execSQL(sql:statements))
                retChanges(call:call,ret:["changes":res!])
            } catch DatabaseHelperError.dbConnection(let message) {
                retChanges(call:call,ret:["changes":-1],message:"Execute command failed : \(message)")
            } catch DatabaseHelperError.execSql(let message){
                retChanges(call:call,ret:["changes":-1],message:"Execute command failed : \(message)")
            } catch let error {
                retChanges(call:call,ret:["changes":-1],message:"Execute command failed : \(error)")
            }

        } else {
            retChanges(call:call,ret:["changes":-1],message:"Execute command failed : No database connection")
        }
    }
    
    // MARK: - Run
    
    @objc func run(_ call: CAPPluginCall) {
        guard let statement = call.options["statement"] as? String else {
            retChanges(call:call,ret:["changes":-1],message:"Run command failed : Must provide a SQL statement")
            return
        }
        guard let values = call.options["values"] as? Array<Any> else {
            retChanges(call:call,ret:["changes":-1],message:"Run command failed : Values should be an Array of values")
            return
        }
        if(mDb != nil) {
            do {
                var res: [String:Int]?
                if(values.count > 0 ) {
                    var val: Array<Any> = []
                    for value in values {
                        if let obj = value as? String {
                            let str: String = "\(String(describing: obj))"
                            val.append(str)
                        } else if let obj = value as? Int {
                            val.append(obj)
                        } else if let obj = value as? Float {
                            val.append(obj)
                        } else {
                            retChanges(call:call,ret:["changes":-1],message:"Run command failed : Not a SQL type")
                        }
                    }
                     res = try (mDb?.runSQL(sql:statement,values: val))
                } else {
                    res = try (mDb?.runSQL(sql:statement,values: []))
                }
                retChanges(call:call,ret:res!)
            } catch DatabaseHelperError.dbConnection(let message) {
                retChanges(call:call,ret:["changes":-1],message:"Run command failed : \(message)")
            } catch DatabaseHelperError.runSql(let message) {
                retChanges(call:call,ret:["changes":-1],message:"Run command failed : \(message)")
            } catch let error {
                retChanges(call:call,ret:["changes":-1],message:"Run command failed : \(error)")
            }

        } else {
            retChanges(call:call,ret:["changes":-1],message:"Run command failed : No database connection")
        }
    }
    
    // MARK: - Query
    
    @objc func query(_ call: CAPPluginCall) {
        guard let statement = call.options["statement"] as? String else {
            retValues(call:call,ret:[],message:"Query command failed : Must provide a query statement")
            return
        }
        guard let values = call.options["values"] as? Array<String> else {
            retValues(call:call,ret:[],message:"Query command failed : Values should be an Array of string")
            return
        }
        if(mDb != nil) {
            let res:Array<[String: Any]>
            do {
                if(values.count > 0) {
                    res = try (mDb?.selectSQL(sql:statement,values:values))!;
                } else {
                    res = try (mDb?.selectSQL(sql:statement,values:[]))!;
                }
                retValues(call:call,ret:res)
            } catch DatabaseHelperError.dbConnection(let message) {
                retValues(call:call,ret:[],message:"Query command failed : \(message)")
            } catch DatabaseHelperError.selectSql(let message) {
                retValues(call:call,ret:[],message:"Query command failed : \(message)")
            } catch let error {
                retValues(call:call,ret:[],message:"Query command failed : \(error)")
            }

        } else {
            retValues(call:call,ret:[],message:"Query command failed : No database connection")
        }
    }
    
    // MARK: - isDBExists
    
    @objc func isDBExists(_ call: CAPPluginCall) {
        guard let dbName = call.options["database"] as? String else {
            retResult(call:call,ret:false,message:"idDBExists command failed: Must provide a database name")
            return
        }
        do {
            let filePath: String = try UtilsSQLite.getFilePath(fileName: "\(dbName)SQLite.db")
            let res: Bool = UtilsSQLite.isFileExist(filePath: filePath)
            if res {
                retResult(call:call,ret:true)
            } else {
                retResult(call:call,ret:false,message:"Database \(dbName)SQLite.db does not exist")
            }
        } catch UtilsSQLiteError.filePathFailed {
            retResult(call:call,ret:false,message:"isDBExists command failed : file path failed")
        } catch let error {
            retResult(call:call,ret:false,message:"isDBExists command failed : \(error)")
        }
    }
    // MARK: - DeleteDatabase
    
    @objc func deleteDatabase(_ call: CAPPluginCall) {
        guard let dbName = call.options["database"] as? String else {
            retResult(call:call,ret:false,message:"DeleteDatabase command failed: Must provide a database name")
            return
        }
        var res: Bool = false
        if mDb != nil {
            do {
                res = try (mDb?.deleteDB(databaseName:"\(dbName)SQLite.db"))!;
                if res {
                    retResult(call:call,ret:true)
                } else {
                    retResult(call:call,ret:false,message:"DeleteDatabase command failed: Database \(dbName)SQLite.db does not exist")
                }
            } catch DatabaseHelperError.deleteDB(let message) {
                retResult(call:call,ret:false,message:"DeleteDatabase command failed: \(message)")
            } catch let error {
                retResult(call:call,ret:false,message:"DeleteDatabase command failed: \(error)")
            }
        } else {
                retResult(call:call,ret:false,message:"DeleteDatabase command failed: The database is not opened")
        }
    }
    
    // MARK: - IsJsonValid
    
    @objc func isJsonValid(_ call: CAPPluginCall) {
        guard let parsingData = call.options["jsonstring"] as? String else {
            retResult(call:call,ret:false,message:"IsJsonValid command failed : Must provide a Stringify Json Object")
            return
        }
        
        let data = ("["+parsingData+"]").data(using: .utf8)!
        
        do {
            _ = try JSONDecoder().decode([JsonSQLite].self, from: data)
            retResult(call:call,ret:true)
        }  catch let error {
           retResult(call:call,ret:false,message:"IsJsonValid command failed : Stringify Json Object not Valid " + error.localizedDescription)
        }
    }
    // MARK: - ImportFromJson
    
    @objc func importFromJson(_ call: CAPPluginCall) {
        guard let parsingData = call.options["jsonstring"] as? String else {
            retChanges(call:call,ret:["changes":-1],message:"ImportFromJson command failed : Must provide a Stringify Json Object")
            return
        }
        
        let data = ("["+parsingData+"]").data(using: .utf8)!
        
        do {
            let jsonSQLite = try JSONDecoder().decode([JsonSQLite].self, from: data)
//            jsonSQLite[0].show()
            let dbName: String = jsonSQLite[0].database + "SQLite.db"
            let encrypted: Bool = jsonSQLite[0].encrypted
            var secret:String = "";
            var inMode:String = "no-encryption";
            if(encrypted) {
                inMode = "secret";
                secret = globalData.secret;
            }
            do {
               mDb = try DatabaseHelper(databaseName:dbName, encrypted: encrypted, mode: inMode, secret:secret,newsecret:"")
            } catch let error {
                retChanges(call:call,ret:["changes":-1],message:"ImportFromJson command failed : " + error.localizedDescription)
            }
            if !mDb!.isOpen {
                retChanges(call:call,ret:["changes":-1],message:"ImportFromJson command failed : Database \(dbName)SQLite.db not opened")
            } else {
                do {
                    let res: [String:Int] = try (mDb?.importFromJson(jsonSQLite: jsonSQLite[0]))!
                    if(res["changes"] == -1) {
                        retChanges(call:call,ret:["changes":-1],message:"ImportFromJson command failed : import JsonObject not successful")
                    } else {
                        retChanges(call:call,ret:res)
                    }
                } catch DatabaseHelperError.importFromJson(let message) {
                    retChanges(call:call,ret:["changes":-1],message:"ImportFromJson command failed : \(message)")
                } catch DatabaseHelperError.tableNotExists(let message) {
                    retChanges(call:call,ret:["changes":-1],message:message)
                }
            }
        } catch let error {
            retChanges(call:call,ret:["changes":-1],message:"ImportFromJson command failed : Stringify Json Object not Valid " + error.localizedDescription)
        }
    }
    
    // MARK: - ExportToJson
    
    @objc func exportToJson(_ call: CAPPluginCall) {
        guard let expMode = call.options["jsonexportmode"] as? String else {
            retJsonSQLite(call:call,ret:[:] ,message:"ExportToJson command failed : Must provide an export mode")
            return
        }
        if expMode != "full" && expMode != "partial" {
            retJsonSQLite(call:call,ret:[:] ,message:"ExportToJson command failed : Json export mode should be 'full' or 'partial'")
            return
        }
        if(mDb != nil) {
            let res:[String: Any]
            do {
                res = try (mDb?.exportToJson(expMode: expMode))!;
                if(res.count == 4) {
                   retJsonSQLite(call:call,ret:res)
                } else {
                    retJsonSQLite(call:call,ret:[:],message:"ExportToJson command failed :return Obj is not a JsonSQLite Obj")
                }
            } catch let error {
                retJsonSQLite(call:call,ret:[:],message:"ExportToJson command failed : \(error)")
            }

        } else {
            retJsonSQLite(call:call,ret:[:] ,message:"ExportToJson command failed: No database connection ")
        }
    }
    
    // MARK: - CreateSyncTable
    
    @objc func createSyncTable(_ call: CAPPluginCall) {
        if(mDb != nil) {
            do {
                let res: Int = try (mDb?.createSyncTable())!;
                if(res == -1) {
                    retChanges(call:call,ret:["changes":-1],message:"createSyncTable command failed")
                } else {
                    retChanges(call:call,ret:["changes":res])
                }
            } catch DatabaseHelperError.createSyncTable(let message)  {
                retChanges(call:call,ret:["changes":-1],message:"createSyncTable command failed : \(message)")
            } catch let error {
                retChanges(call:call,ret:["changes":-1],message:"createSyncTable command failed: \(error)")
            }

        } else {
            retChanges(call:call,ret:["changes":-1] ,message:"createSyncTable command failed: No database connection ")
        }
    }
    
    // MARK: - SetSyncDate
    
    @objc func setSyncDate(_ call: CAPPluginCall) {
        guard let syncDate = call.options["syncdate"] as? String else {
            retResult(call:call,ret:false,message:"setSyncDate command failed: Must provide a sync date")
            return
        }
        if(mDb != nil) {
            do {
                let res: Bool = try (mDb?.setSyncDate(syncDate:syncDate))!;
                if(res) {
                    retResult(call:call,ret:true)
                } else {
                   retResult(call:call,ret:false,message:"setSyncDate command failed")
                }
                
            } catch DatabaseHelperError.createSyncDate(let message) {
                retResult(call:call,ret:false,message:"setSyncDate command failed: \(message)")
            } catch let error {
                retResult(call:call,ret:false,message:"setSyncDate command failed: \(error)")
           }

        } else {
            retChanges(call:call,ret:["changes":-1] ,message:"setSyncDate command failed: No database connection ")
        }

    }
    // MARK: - RetResult
    
    
    func retResult(call: CAPPluginCall, ret: Bool, message: String? = nil) {
        if(message != nil) {
            call.success([
                "result": ret,
                "message": message!
            ])
        } else {
            call.success([
                "result": ret
            ])
        }
    }
    
    // MARK: - RetChanges
    
    func retChanges(call: CAPPluginCall, ret: [String:Int], message: String? = nil) {
        if(message != nil) {
            call.success([
                "changes": ret,
                "message": message!
            ])
        } else {
            call.success([
                "changes": ret
            ])
        }
    }
    
    // MARK: - RetValues
    
    func retValues(call: CAPPluginCall, ret: Array<[String: Any]>, message: String? = nil) {
        if(message != nil) {
            call.success([
                "values": ret,
                "message": message!
            ])
        } else {
            call.success([
                "values": ret
            ])
        }
    }
    
    // MARK: - RetJsonSQLite
    
    func retJsonSQLite(call: CAPPluginCall, ret: [String: Any], message: String? = nil) {
        if(message != nil) {
            call.success([
                "export": ret,
                "message": message!
            ])
        } else {
            call.success([
                "export": ret
            ])
        }
    }
    
}
