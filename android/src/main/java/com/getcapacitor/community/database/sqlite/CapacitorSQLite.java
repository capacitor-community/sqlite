package com.getcapacitor.community.database.sqlite;

import android.Manifest;
import android.content.Context;
import android.util.Log;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.NativePlugin;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.community.database.sqlite.SQLite.Database;
import com.getcapacitor.community.database.sqlite.SQLite.ImportExportJson.JsonSQLite;
import com.getcapacitor.community.database.sqlite.SQLite.ImportExportJson.UtilsJson;
import com.getcapacitor.community.database.sqlite.SQLite.UtilsFile;
import com.getcapacitor.community.database.sqlite.SQLite.UtilsMigrate;
import com.getcapacitor.community.database.sqlite.SQLite.UtilsSQLite;
import java.io.File;
import java.util.ArrayList;
import java.util.Dictionary;
import java.util.Hashtable;
import org.json.JSONArray;
import org.json.JSONObject;

@NativePlugin
public class CapacitorSQLite extends Plugin {

    private static final String TAG = "CapacitorSQLite";
    private Context context;
    private Dictionary<String, Database> dbDict = new Hashtable<>();
    private UtilsSQLite uSqlite = new UtilsSQLite();
    private UtilsFile uFile = new UtilsFile();
    private UtilsJson uJson = new UtilsJson();
    private UtilsMigrate uMigrate = new UtilsMigrate();
    private Dictionary<String, Dictionary<Integer, JSONObject>> versionUpgrades = new Hashtable<>();

    /**
     * Load Method
     * Load the plugin
     */
    public void load() {
        // Get singleton instance of database
        context = getContext();
    }

    /**
     * Echo Method
     * test the plugin
     * @param call
     */
    @PluginMethod
    public void echo(PluginCall call) {
        String value = call.getString("value");

        JSObject ret = new JSObject();
        ret.put("value", value);
        call.success(ret);
        return;
    }

    /**
     * CreateConnection Method
     * Create a connection to a database
     * @param call
     */
    @PluginMethod
    public void createConnection(PluginCall call) {
        String dbName = null;
        int dbVersion = Integer.valueOf(-1);
        String secret = null;
        String newsecret = null;
        String inMode = null;
        JSObject ret = new JSObject();
        dbName = call.getString("database");
        if (dbName == null) {
            String msg = "createConnection command failed: Must " + "provide a database";
            msg += " name";
            retResult(call, false, msg);
            return;
        }
        dbVersion = call.getInt("version", 1);
        boolean encrypted = call.getBoolean("encrypted", false);
        if (encrypted) {
            inMode = call.getString("mode", "no-encryption");
            if (
                !inMode.equals("no-encryption") &&
                !inMode.equals("encryption") &&
                !inMode.equals("secret") &&
                !inMode.equals("newsecret") &&
                !inMode.equals("wrongsecret")
            ) {
                String msg = "createConnection command failed: ";
                msg += "Error inMode must ";
                msg += "be in ['encryption','secret','newsecret']";
                retResult(call, false, msg);
                return;
            }
        } else {
            inMode = "no-encryption";
            secret = "";
        }
        Dictionary<Integer, JSONObject> upgDict = versionUpgrades.get(dbName);
        Database db = new Database(context, dbName + "SQLite.db", encrypted, inMode, dbVersion, upgDict);
        dbDict.put(dbName, db);

        if (db != null) {
            retResult(call, true, null);
            return;
        } else {
            String msg = "createConnection command failed";
            retResult(call, false, msg);
            return;
        }
    }

    /**
     * Open Method
     * Open a database
     * @param call
     */
    @PluginMethod
    public void open(PluginCall call) {
        if (!call.getData().has("database")) {
            retResult(call, false, "Must provide a database name");
            return;
        }
        String dbName = call.getString("database");

        Database db = dbDict.get(dbName);
        if (db != null) {
            boolean ret = db.open();
            if (!ret) {
                retResult(call, false, "database " + dbName + " not opened");
                return;
            } else {
                retResult(call, true, null);
                return;
            }
        } else {
            retResult(call, false, "No available connection for database " + dbName);
            return;
        }
    }

    /**
     * Close Method
     * Close a Database
     * @param call
     */
    @PluginMethod
    public void close(PluginCall call) {
        if (!call.getData().has("database")) {
            retResult(call, false, "Must provide a database name");
            return;
        }
        String dbName = call.getString("database");

        Database db = dbDict.get(dbName);
        if (db != null) {
            if (db.isOpen()) {
                if (!db.inTransaction()) {
                    boolean ret = db.close();
                    if (!ret) {
                        retResult(call, false, "database " + dbName + " failed to close");
                        return;
                    } else {
                        retResult(call, true, null);
                        return;
                    }
                } else {
                    retResult(call, false, "database " + dbName + " failed to close still in " + " transaction");
                    return;
                }
            } else {
                retResult(call, false, "database " + dbName + " not opened");
                return;
            }
        } else {
            retResult(call, false, "No available connection for database " + dbName);
            return;
        }
    }

    /**
     * CloseConnection Method
     * Close the connection to a database
     * @param call
     */
    @PluginMethod
    public void closeConnection(PluginCall call) {
        if (!call.getData().has("database")) {
            retResult(call, false, "Must provide a database name");
            return;
        }
        String dbName = call.getString("database");

        Database db = dbDict.get(dbName);
        if (db != null) {
            if (db.isOpen()) {
                Boolean ret = db.close();
                if (!ret) {
                    retResult(call, false, "database " + dbName + " failed to close");
                    return;
                }
            }
            dbDict.remove(dbName);
            retResult(call, true, null);
            return;
        } else {
            retResult(call, false, "No available connection for database " + dbName);
            return;
        }
    }

    /**
     * IsDatabase Method
     * Check if the database file exists
     * @param call
     */
    @PluginMethod
    public void isDatabase(PluginCall call) {
        if (!call.getData().has("database")) {
            retResult(call, false, "Must provide a database name");
            return;
        }
        String dbName = call.getString("database");
        boolean res = uFile.isFileExists(context, dbName + "SQLite.db");
        if (res) {
            retResult(call, true, null);
            return;
        } else {
            retResult(call, false, "isDatabase:" + dbName + "does not exist");
            return;
        }
    }

    /**
     * IsTableExists Method
     * Check if a table exists in a database
     * @param call
     */
    @PluginMethod
    public void isTableExists(PluginCall call) {
        if (!call.getData().has("database")) {
            retResult(call, false, "Must provide a database name");
            return;
        }
        String dbName = call.getString("database");
        if (!call.getData().has("table")) {
            retResult(call, false, "Must provide a table name");
            return;
        }
        String tableName = call.getString("table");

        Database db = dbDict.get(dbName);
        if (db != null) {
            boolean res = uJson.isTableExists(db, tableName);
            if (res) {
                retResult(call, true, null);
                return;
            } else {
                retResult(call, false, "Table " + tableName + "does not exist");
                return;
            }
        } else {
            retResult(call, false, "No available connection for database " + dbName);
            return;
        }
    }

    /**
     * GetDatabaseList Method
     * Return the list of databases
     */
    @PluginMethod
    public void getDatabaseList(PluginCall call) {
        String[] listFiles = uFile.getListOfFiles(context);
        JSArray retArray = new JSArray();
        for (String file : listFiles) {
            retArray.put(file);
        }
        retValues(call, retArray, null);
        return;
    }

    /**
     * AddSQLiteSuffix Method
     * Add SQLITE suffix to a list of databases
     */
    @PluginMethod
    public void addSQLiteSuffix(PluginCall call) {
        String folderPath;
        if (!call.getData().has("folderPath")) {
            folderPath = "default";
        } else {
            folderPath = call.getString("folderPath");
        }
        try {
            uMigrate.addSQLiteSuffix(context, folderPath);
            retResult(call, true, null);
        } catch (Exception e) {
            retResult(call, false, e.getMessage());
        }
    }

    /**
     * DeleteOldDatabases Method
     * Delete Old Cordova plugin databases
     */
    @PluginMethod
    public void deleteOldDatabases(PluginCall call) {
        String folderPath;
        if (!call.getData().has("folderPath")) {
            folderPath = "default";
        } else {
            folderPath = call.getString("folderPath");
        }
        try {
            uMigrate.deleteOldDatabases(context, folderPath);
            retResult(call, true, null);
        } catch (Exception e) {
            retResult(call, false, e.getMessage());
        }
    }

    /**
     * Execute Method
     * Execute SQL statements provided in a String
     * @param call
     */
    @PluginMethod
    public void execute(PluginCall call) {
        JSObject retRes = new JSObject();
        retRes.put("changes", Integer.valueOf(-1));
        if (!call.getData().has("database")) {
            String msg = "Execute command failed : ";
            msg += "Must provide a database name";
            retChanges(call, retRes, msg);
            return;
        }
        String dbName = call.getString("database");
        if (!call.getData().has("statements")) {
            String msg = "Execute command failed : ";
            msg += "Must provide raw SQL statements";
            retChanges(call, retRes, msg);
            return;
        }
        String statements = call.getString("statements");
        Database db = dbDict.get(dbName);
        if (db != null) {
            if (db.isOpen()) {
                // convert string in string[]
                String[] sqlCmdArray = uSqlite.getStatementsArray(statements);
                JSObject res = db.execute(sqlCmdArray);
                if (res.getInteger("changes") == Integer.valueOf(-1)) {
                    retChanges(call, retRes, res.getString("message"));
                    return;
                } else {
                    retChanges(call, res, null);
                    return;
                }
            } else {
                String msg = "Execute command failed : database ";
                msg += dbName + " not opened";
                retChanges(call, retRes, msg);
                return;
            }
        } else {
            String msg = "Execute command failed : No available ";
            msg += "connection for database " + dbName;
            retChanges(call, retRes, msg);
            return;
        }
    }

    /**
     * ExecuteSet Method
     * Execute a Set of raw sql statement
     * @param call
     * @throws Exception
     */
    @PluginMethod
    public void executeSet(PluginCall call) throws Exception {
        JSObject retRes = new JSObject();
        retRes.put("changes", Integer.valueOf(-1));
        if (!call.getData().has("database")) {
            String msg = "Run command failed : ";
            msg += "Must provide a database name";
            retChanges(call, retRes, msg);
            return;
        }
        String dbName = call.getString("database");
        if (!call.getData().has("set")) {
            String msg = "ExecuteSet command failed : ";
            msg += "Must provide a set of SQL statements";
            retChanges(call, retRes, msg);
            return;
        }
        JSArray set = call.getArray("set");
        if (set.length() == 0) {
            String msg = "ExecuteSet command failed : ";
            msg += "Must provide a non-empty set of SQL statements";
            retChanges(call, retRes, msg);
            return;
        }
        for (int i = 0; i < set.length(); i++) {
            JSONArray keys = set.getJSONObject(i).names();
            for (int j = 0; j < keys.length(); ++j) {
                String key = keys.getString(j);
                if (!(key.equals("statement")) && !(key.equals("values"))) {
                    String msg = "ExecuteSet command failed : ";
                    msg += "Must provide a set as Array of {statement,";
                    msg += "values}";
                    retChanges(call, retRes, msg);
                    return;
                }
            }
        }
        Database db = dbDict.get(dbName);
        if (db != null) {
            if (db.isOpen()) {
                JSObject res = db.executeSet(set);
                if (res.getInteger("changes") == Integer.valueOf(-1)) {
                    retChanges(call, retRes, res.getString("message"));
                    return;
                } else {
                    retChanges(call, res, null);
                    return;
                }
            } else {
                String msg = "Execute command failed : database ";
                msg += dbName + " not opened";
                retChanges(call, retRes, msg);
                return;
            }
        } else {
            String msg = "Execute command failed : No available ";
            msg += "connection for database " + dbName;
            retChanges(call, retRes, msg);
            return;
        }
    }

    /**
     * Run method
     * Execute a raw sql statement
     * @param call
     */
    @PluginMethod
    public void run(PluginCall call) {
        JSObject retRes = new JSObject();
        retRes.put("changes", Integer.valueOf(-1));
        if (!call.getData().has("database")) {
            String msg = "Run command failed : ";
            msg += "Must provide a database name";
            retChanges(call, retRes, msg);
            return;
        }
        String dbName = call.getString("database");
        if (!call.getData().has("statement")) {
            String msg = "Run command failed : ";
            msg += "Must provide a SQL statement";
            retChanges(call, retRes, msg);
            return;
        }
        String statement = call.getString("statement");
        if (!call.getData().has("values")) {
            String msg = "Run command failed : ";
            msg += "Must provide an Array of values";
            retChanges(call, retRes, msg);
            return;
        }
        JSArray values = call.getArray("values");
        JSObject res;
        Database db = dbDict.get(dbName);
        if (db != null) {
            if (db.isOpen()) {
                if (values.length() > 0) {
                    try {
                        ArrayList<Object> arrValues = uSqlite.objectJSArrayToArrayList(values);
                        res = db.runSQL(statement, arrValues);
                    } catch (Exception e) {
                        String msg = "Run command failed : could not ";
                        msg += dbName + "convert JSArray";
                        retChanges(call, retRes, msg);
                        return;
                    }
                } else {
                    res = db.runSQL(statement, null);
                }
                if (res.getInteger("changes") == Integer.valueOf(-1)) {
                    retChanges(call, retRes, res.getString("message"));
                    return;
                } else {
                    retChanges(call, res, null);
                    return;
                }
            } else {
                String msg = "Run command failed : database ";
                msg += dbName + " not opened";
                retChanges(call, retRes, msg);
                return;
            }
        } else {
            String msg = "Run command failed : No available ";
            msg += "connection for database " + dbName;
            retChanges(call, retRes, msg);
            return;
        }
    }

    /**
     * Query Method
     * Execute an sql query
     * @param call
     */
    @PluginMethod
    public void query(PluginCall call) {
        if (!call.getData().has("database")) {
            String msg = "Query command failed : ";
            msg += "Must provide a database name";
            retValues(call, new JSArray(), msg);
            return;
        }
        String dbName = call.getString("database");
        if (!call.getData().has("statement")) {
            String msg = "Query command failed : ";
            msg += "Must provide a SQL statement";
            retValues(call, new JSArray(), msg);
            return;
        }
        String statement = call.getString("statement");
        if (!call.getData().has("values")) {
            String msg = "Query command failed : ";
            msg += "Must provide an Array of Strings";
            retValues(call, new JSArray(), msg);
            return;
        }
        JSArray values = call.getArray("values");

        JSArray res;
        Database db = dbDict.get(dbName);
        if (db != null) {
            if (db.isOpen()) {
                if (values.length() > 0) {
                    try {
                        ArrayList<String> arrValues = uSqlite.stringJSArrayToArrayList(values);
                        res = db.selectSQL(statement, arrValues);
                    } catch (Exception e) {
                        String msg = "Query command failed : could ";
                        msg += dbName + "not convert JSArray";
                        retValues(call, new JSArray(), msg);
                        return;
                    }
                } else {
                    res = db.selectSQL(statement, new ArrayList<String>());
                }
                retValues(call, res, null);
                return;
            } else {
                String msg = "Query command failed : database ";
                msg += dbName + " not opened";
                retValues(call, new JSArray(), msg);
                return;
            }
        } else {
            String msg = "Query command failed : No available ";
            msg += "connection for database " + dbName;
            retValues(call, new JSArray(), msg);
            return;
        }
    }

    /**
     * IsDBExists Method
     * check if the database exists on the database folder
     * @param call
     */
    @PluginMethod
    public void isDBExists(PluginCall call) {
        if (!call.getData().has("database")) {
            String msg = "isDBExists command failed : ";
            msg += "Must provide a database name";
            retResult(call, false, msg);
            return;
        }
        String dbName = call.getString("database");
        Database db = dbDict.get(dbName);
        if (db != null) {
            File databaseFile = context.getDatabasePath(dbName + "SQLite.db");
            if (databaseFile.exists()) {
                retResult(call, true, null);
                return;
            } else {
                retResult(call, false, null);
                return;
            }
        } else {
            String msg = "isDBExists command failed : No available ";
            msg += "connection for database " + dbName;
            retResult(call, false, msg);
            return;
        }
    }

    /**
     * DeleteDatabase Method
     * delete a database from the database folder
     * @param call
     */
    @PluginMethod
    public void deleteDatabase(PluginCall call) {
        if (!call.getData().has("database")) {
            String msg = "deleteDatabase command failed : ";
            msg += "Must provide a database name";
            retResult(call, false, msg);
            return;
        }
        String dbName = call.getString("database");
        Database db = dbDict.get(dbName);
        if (db != null) {
            boolean res = db.deleteDB(dbName + "SQLite.db");
            if (res) {
                retResult(call, true, null);
                return;
            } else {
                retResult(call, false, "deleteDatabase command failed");
                return;
            }
        } else {
            String msg = "deleteDatabase command failed : ";
            msg += " No available connection for database " + dbName;
            retResult(call, false, msg);
            return;
        }
    }

    /**
     * CreateSyncTable Method
     * Create the synchronization table
     * @param call
     */
    @PluginMethod
    public void createSyncTable(PluginCall call) {
        JSObject retRes = new JSObject();
        if (!call.getData().has("database")) {
            String msg = "createSyncTable command failed : ";
            msg += "Must provide a database name";
            retRes.put("changes", Integer.valueOf(-1));
            retChanges(call, retRes, msg);
            return;
        }
        String dbName = call.getString("database");
        Database db = dbDict.get(dbName);
        if (db != null) {
            retRes.put("changes", Integer.valueOf(-1));
            JSObject res = db.createSyncTable();
            if (res.getInteger("changes") == Integer.valueOf(-1)) {
                String msg = "createSyncTable command failed";
                retChanges(call, retRes, msg);
                return;
            } else {
                retChanges(call, res, null);
                return;
            }
        } else {
            String msg = "createSyncTable command failed : ";
            msg += " No available connection for database " + dbName;
            retResult(call, false, msg);
            return;
        }
    }

    /**
     * SetSyncDate Method
     * set the synchronization date
     * @param call
     */
    @PluginMethod
    public void setSyncDate(PluginCall call) {
        if (!call.getData().has("database")) {
            String msg = "setSyncDate command failed : ";
            msg += "Must provide a database name";
            retResult(call, false, msg);
            return;
        }
        String dbName = call.getString("database");
        if (!call.getData().has("syncdate")) {
            String msg = "setSyncDate command failed : ";
            msg += "Must provide a sync date";
            retResult(call, false, msg);
            return;
        }

        String syncDate = call.getString("syncdate");
        Database db = dbDict.get(dbName);
        if (db != null) {
            boolean res = db.setSyncDate(syncDate);
            if (!res) {
                String msg = "SetSyncDate command failed";
                retResult(call, false, msg);
                return;
            } else {
                retResult(call, true, null);
                return;
            }
        } else {
            String msg = "SetSyncDate command failed : ";
            msg += " No available connection for database " + dbName;
            retResult(call, false, msg);
            return;
        }
    }

    /**
     * GetSyncDate Method
     * Get the synchronization date
     * @param call
     */
    @PluginMethod
    public void getSyncDate(PluginCall call) {
        JSObject retRes = new JSObject();
        if (!call.getData().has("database")) {
            String msg = "createSyncTable command failed : ";
            msg += "Must provide a database name";
            retRes.put("changes", Integer.valueOf(-1));
            retSyncDate(call, new Long(0), msg);
            return;
        }
        String dbName = call.getString("database");
        Database db = dbDict.get(dbName);
        if (db != null) {
            long syncDate = db.getSyncDate();
            if (syncDate > 0) {
                retSyncDate(call, syncDate, null);
            } else {
                String msg = "GetSyncDate command failed";
                retSyncDate(call, new Long(0), msg);
            }
        } else {
            String msg = "getSyncDate command failed : ";
            msg += " No available connection for database " + dbName;
            retSyncDate(call, new Long(0), msg);
            return;
        }
    }

    /**
     * AddUpgradeStatement Method
     * Define an upgrade object when updating to a new version
     * @param call
     */
    @PluginMethod
    public void addUpgradeStatement(PluginCall call) {
        if (!call.getData().has("database")) {
            String msg = "addUpgradeStatement command failed : ";
            msg += "Must provide a database name";
            retResult(call, false, msg);
            return;
        }
        String dbName = call.getString("database");
        if (!call.getData().has("upgrade")) {
            String msg = "addUpgradeStatement command failed : ";
            msg += "Must provide an array with upgrade statement";
            retResult(call, false, msg);
            return;
        }
        JSArray upgrade = call.getArray("upgrade");
        Dictionary<Integer, JSONObject> upgDict = new Hashtable<>();

        JSONObject upgObj = null;
        try {
            upgObj = (JSONObject) upgrade.get(0);
        } catch (Exception e) {
            String msg = "addUpgradeStatement command failed : ";
            msg += "Must provide an upgrade statement";
            retResult(call, false, msg);
            return;
        }

        if (upgObj == null || !upgObj.has("fromVersion") || !upgObj.has("toVersion") || !upgObj.has("statement")) {
            String msg = "addUpgradeStatement command failed : ";
            msg += "Must provide an upgrade statement";
            msg += "{fromVersion,toVersion,statement}";
            retResult(call, false, msg);
            return;
        }
        try {
            int fromVersion = upgObj.getInt("fromVersion");
            upgDict.put(fromVersion, upgObj);
            versionUpgrades.put(dbName, upgDict);
            retResult(call, true, null);
            return;
        } catch (Exception e) {
            String msg = "addUpgradeStatement command failed : ";
            msg += "Must provide fromVersion as Integer";
            retResult(call, false, msg);
            return;
        }
    }

    /**
     * IsJsonValid
     * Check the validity of a given Json object
     * @param call
     */
    @PluginMethod
    public void isJsonValid(PluginCall call) {
        if (!call.getData().has("jsonstring")) {
            String msg = "isJsonValid command failed : ";
            msg += "Must provide a Stringify Json Object";
            retResult(call, false, msg);
            return;
        }
        String parsingData = call.getString("jsonstring");

        try {
            JSObject jsonObject = new JSObject(parsingData);
            JsonSQLite jsonSQL = new JsonSQLite();
            Boolean isValid = jsonSQL.isJsonSQLite(jsonObject);
            if (!isValid) {
                String msg = "isJsonValid command failed : ";
                msg += "Stringify Json Object not Valid";
                retResult(call, false, msg);
                return;
            } else {
                retResult(call, true, null);
                return;
            }
        } catch (Exception e) {
            String msg = "isJsonValid command failed : ";
            msg += e.getMessage();
            retResult(call, false, msg);
            return;
        }
    }

    /**
     * ImportFromJson Method
     * Import from a given Json object
     * @param call
     */
    @PluginMethod
    public void importFromJson(PluginCall call) {
        JSObject retRes = new JSObject();
        retRes.put("changes", Integer.valueOf(-1));
        if (!call.getData().has("jsonstring")) {
            String msg = "importFromJson command failed : ";
            msg += "Must provide a Stringify Json Object";
            retChanges(call, retRes, msg);
            return;
        }
        String parsingData = call.getString("jsonstring");
        try {
            JSObject jsonObject = new JSObject(parsingData);
            JsonSQLite jsonSQL = new JsonSQLite();
            Boolean isValid = jsonSQL.isJsonSQLite(jsonObject);
            if (!isValid) {
                String msg = "importFromJson command failed : ";
                msg += "Stringify Json Object not Valid";
                retChanges(call, retRes, msg);
                return;
            }
            String dbName = new StringBuilder(jsonSQL.getDatabase()).append("SQLite.db").toString();
            int dbVersion = jsonSQL.getVersion();
            //            jsonSQL.print();
            Boolean encrypted = jsonSQL.getEncrypted();
            String secret = null;
            String inMode = "no-encryption";
            if (encrypted) {
                inMode = "secret";
            }
            Database db = new Database(context, dbName, encrypted, inMode, dbVersion, new Hashtable<Integer, JSONObject>());
            db.open();
            if (!db.isOpen()) {
                String msg = "importFromJson command failed : ";
                msg += dbName + "SQLite.db not opened";
                retChanges(call, retRes, msg);
                return;
            } else {
                JSObject res = db.importFromJson(jsonSQL);
                db.close();
                if (res.getInteger("changes") == Integer.valueOf(-1)) {
                    String msg = "importFromJson command failed : ";
                    msg += "import JsonObject not successful";
                    retChanges(call, retRes, msg);
                    return;
                } else {
                    retChanges(call, res, null);
                    return;
                }
            }
        } catch (Exception e) {
            String msg = "importFromJson command failed : ";
            msg += e.getMessage();
            retChanges(call, retRes, msg);
            return;
        }
    }

    /**
     * ExportToJson Method
     * Export the database to Json Object
     * @param call
     */
    @PluginMethod
    public void exportToJson(PluginCall call) {
        JSObject retObj = new JSObject();
        JsonSQLite retJson = new JsonSQLite();
        if (!call.getData().has("database")) {
            String msg = "exportToJson command failed : ";
            msg += "Must provide a database name";
            retJSObject(call, retObj, msg);
            return;
        }
        String dbName = call.getString("database");
        if (!call.getData().has("jsonexportmode")) {
            String msg = "exportToJson command failed : ";
            msg += "Must provide an export mode";
            retJSObject(call, retObj, msg);
            return;
        }
        String expMode = call.getString("jsonexportmode");

        if (!expMode.equals("full") && !expMode.equals("partial")) {
            String msg = "exportToJson command failed : ";
            msg += "Json export mode should be 'full' or 'partial'";
            retJSObject(call, retObj, msg);
            return;
        }
        Database db = dbDict.get(dbName);
        if (db != null) {
            JSObject ret = db.exportToJson(expMode);

            if (ret.length() == 5) {
                retJSObject(call, ret, null);
                return;
            } else {
                String msg = "exportToJson command failed : ";
                msg += "return Obj is not a JsonSQLite Obj";
                retJSObject(call, retObj, msg);
                return;
            }
        } else {
            String msg = "ExportToJson command failed : ";
            msg += " No available connection for database " + dbName;
            retJSObject(call, retObj, msg);
            return;
        }
    }

    /**
     * CopyFromAssets
     * copy all databases from public/assets/databases to application folder
     * @param call
     */
    @PluginMethod
    public void copyFromAssets(PluginCall call) {
        String msg = "copyFromAssets command failed : ";
        try {
            Boolean ret = uFile.copyFromAssetsToDatabase(context);
            if (ret) {
                retResult(call, true, null);
                return;
            } else {
                retResult(call, false, msg);
            }
        } catch (Exception e) {
            msg += e.getMessage();
            retResult(call, false, msg);
            return;
        }
    }

    /**
     * RetResult Method
     * Create and return the capSQLiteResult object
     * @param call
     * @param res
     * @param message
     */
    private void retResult(PluginCall call, Boolean res, String message) {
        JSObject ret = new JSObject();
        ret.put("result", res);
        if (message != null) {
            ret.put("message", message);
            Log.v(TAG, "*** ERROR " + message);
        }
        call.resolve(ret);
    }

    /**
     * RetChanges Method
     * Create and return the capSQLiteChanges object
     * @param call
     * @param res
     * @param message
     */
    private void retChanges(PluginCall call, JSObject res, String message) {
        JSObject ret = new JSObject();
        ret.put("changes", res);
        if (message != null) {
            ret.put("message", message);
            Log.v(TAG, "*** ERROR " + message);
        }
        call.resolve(ret);
    }

    /**
     * RetValues Method
     * Create and return the capSQLiteValues object
     * @param call
     * @param res
     * @param message
     */
    private void retValues(PluginCall call, JSArray res, String message) {
        JSObject ret = new JSObject();
        ret.put("values", res);
        if (message != null) {
            ret.put("message", message);
            Log.v(TAG, "*** ERROR " + message);
        }
        call.resolve(ret);
    }

    /**
     * RetSyncDate Method
     * Create and return the capSQLiteSyncDate object
     * @param call
     * @param res
     * @param message
     */
    private void retSyncDate(PluginCall call, Long res, String message) {
        JSObject ret = new JSObject();
        ret.put("syncDate", res);
        if (message != null) {
            ret.put("message", message);
            Log.v(TAG, "*** ERROR " + message);
        }
        call.resolve(ret);
    }

    /**
     * RetJSObject Method
     * Create and return the capSQLiteJson object
     * @param call
     * @param res
     * @param message
     */
    private void retJSObject(PluginCall call, JSObject res, String message) {
        JSObject ret = new JSObject();
        ret.put("export", res);
        if (message != null) {
            ret.put("message", message);
            Log.v(TAG, "*** ERROR " + message);
        }
        call.resolve(ret);
    }
}
