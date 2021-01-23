package com.getcapacitor.community.database.sqlite;

import android.content.Context;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.community.database.sqlite.SQLite.ImportExportJson.JsonSQLite;
import java.util.Dictionary;
import java.util.Hashtable;
import org.json.JSONArray;
import org.json.JSONObject;

@CapacitorPlugin(name = "CapacitorSQLite")
public class CapacitorSQLitePlugin extends Plugin {

    private Context context;
    private CapacitorSQLite implementation;
    private Dictionary<String, Dictionary<Integer, JSONObject>> versionUpgrades = new Hashtable<>();
    private RetHandler rHandler = new RetHandler();

    /**
     * Load Method
     * Load the context
     */
    public void load() {
        context = getContext();
        implementation = new CapacitorSQLite(context);
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
        ret.put("value", implementation.echo(value));
        call.resolve(ret);
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
        if (!call.getData().has("database")) {
            String msg = "CreateConnection: Must provide a database name";
            rHandler.retResult(call, null, msg);
            return;
        }
        dbName = call.getString("database");
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
                String msg = "CreateConnection: inMode must ";
                msg += "be in ['encryption','secret','newsecret']";
                rHandler.retResult(call, null, msg);
                return;
            }
        } else {
            inMode = "no-encryption";
            secret = "";
        }
        Dictionary<Integer, JSONObject> upgDict = versionUpgrades.get(dbName);
        try {
            implementation.createConnection(dbName, encrypted, inMode, dbVersion, upgDict);
            rHandler.retResult(call, null, null);
            return;
        } catch (Exception e) {
            String msg = "CreateConnection: " + e.getMessage();
            rHandler.retResult(call, null, msg);
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
            String msg = "Open: Must provide a database name";
            rHandler.retResult(call, null, msg);
            return;
        }
        String dbName = call.getString("database");
        try {
            implementation.open(dbName);
            rHandler.retResult(call, null, null);
            return;
        } catch (Exception e) {
            String msg = "Open: " + e.getMessage();
            rHandler.retResult(call, null, msg);
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
            String msg = "Close: Must provide a database name";
            rHandler.retResult(call, null, msg);
            return;
        }
        String dbName = call.getString("database");
        try {
            implementation.close(dbName);
            rHandler.retResult(call, null, null);
            return;
        } catch (Exception e) {
            String msg = "Close: " + e.getMessage();
            rHandler.retResult(call, null, msg);
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
            String msg = "CloseConnection: Must provide a database name";
            rHandler.retResult(call, null, msg);
            return;
        }
        String dbName = call.getString("database");
        try {
            implementation.closeConnection(dbName);
            rHandler.retResult(call, null, null);
            return;
        } catch (Exception e) {
            String msg = "CloseConnection: " + e.getMessage();
            rHandler.retResult(call, null, msg);
            return;
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
            String msg = "Execute: Must provide a database name";
            rHandler.retChanges(call, retRes, msg);
            return;
        }
        String dbName = call.getString("database");
        if (!call.getData().has("statements")) {
            String msg = "Execute: Must provide raw SQL statements";
            rHandler.retChanges(call, retRes, msg);
            return;
        }
        String statements = call.getString("statements");

        try {
            JSObject res = implementation.execute(dbName, statements);
            rHandler.retChanges(call, res, null);
            return;
        } catch (Exception e) {
            String msg = "Execute: " + e.getMessage();
            rHandler.retChanges(call, retRes, msg);
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
            String msg = "ExecuteSet: Must provide a database name";
            rHandler.retChanges(call, retRes, msg);
            return;
        }
        String dbName = call.getString("database");
        if (!call.getData().has("set")) {
            String msg = "ExecuteSet: Must provide a set of SQL statements";
            rHandler.retChanges(call, retRes, msg);
            return;
        }
        JSArray set = call.getArray("set");
        if (set.length() == 0) {
            String msg = "ExecuteSet: Must provide a non-empty set of SQL statements";
            rHandler.retChanges(call, retRes, msg);
            return;
        }
        for (int i = 0; i < set.length(); i++) {
            JSONArray keys = set.getJSONObject(i).names();
            for (int j = 0; j < keys.length(); ++j) {
                String key = keys.getString(j);
                if (!(key.equals("statement")) && !(key.equals("values"))) {
                    String msg = "ExecuteSet: Must provide a set as Array of {statement,";
                    msg += "values}";
                    rHandler.retChanges(call, retRes, msg);
                    return;
                }
            }
        }
        try {
            JSObject res = implementation.executeSet(dbName, set);
            rHandler.retChanges(call, res, null);
            return;
        } catch (Exception e) {
            String msg = "ExecuteSet: " + e.getMessage();
            rHandler.retChanges(call, retRes, msg);
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
            String msg = "Run: Must provide a database name";
            rHandler.retChanges(call, retRes, msg);
            return;
        }
        String dbName = call.getString("database");
        if (!call.getData().has("statement")) {
            String msg = "Run: Must provide a SQL statement";
            rHandler.retChanges(call, retRes, msg);
            return;
        }
        String statement = call.getString("statement");
        if (!call.getData().has("values")) {
            String msg = "Run: Must provide an Array of values";
            rHandler.retChanges(call, retRes, msg);
            return;
        }
        JSArray values = call.getArray("values");

        try {
            JSObject res = implementation.run(dbName, statement, values);
            rHandler.retChanges(call, res, null);
            return;
        } catch (Exception e) {
            String msg = "Run: " + e.getMessage();
            rHandler.retChanges(call, retRes, msg);
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
            String msg = "Run: Must provide a database name";
            rHandler.retValues(call, new JSArray(), msg);
            return;
        }
        String dbName = call.getString("database");
        if (!call.getData().has("statement")) {
            String msg = "Query: Must provide a SQL statement";
            rHandler.retValues(call, new JSArray(), msg);
            return;
        }
        String statement = call.getString("statement");
        if (!call.getData().has("values")) {
            String msg = "Query: Must provide an Array of Strings";
            rHandler.retValues(call, new JSArray(), msg);
            return;
        }
        JSArray values = call.getArray("values");
        try {
            JSArray res = implementation.query(dbName, statement, values);
            rHandler.retValues(call, res, null);
            return;
        } catch (Exception e) {
            String msg = "Query: " + e.getMessage();
            rHandler.retValues(call, new JSArray(), msg);
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
            String msg = "isDBExists: Must provide a database name";
            rHandler.retResult(call, false, msg);
            return;
        }
        String dbName = call.getString("database");

        try {
            Boolean res = implementation.isDBExists(dbName);
            rHandler.retResult(call, res, null);
            return;
        } catch (Exception e) {
            String msg = "isDBExists: " + e.getMessage();
            rHandler.retResult(call, false, msg);
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
            String msg = "deleteDatabase: Must provide a database name";
            rHandler.retResult(call, null, msg);
            return;
        }
        String dbName = call.getString("database");
        try {
            implementation.deleteDatabase(dbName);
            rHandler.retResult(call, null, null);
            return;
        } catch (Exception e) {
            String msg = "deleteDatabase: " + e.getMessage();
            rHandler.retResult(call, null, msg);
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
        retRes.put("changes", Integer.valueOf(-1));
        if (!call.getData().has("database")) {
            String msg = "CreateSyncTable: Must provide a database name";
            rHandler.retChanges(call, retRes, msg);
            return;
        }
        String dbName = call.getString("database");
        try {
            JSObject res = implementation.createSyncTable(dbName);
            rHandler.retChanges(call, res, null);
            return;
        } catch (Exception e) {
            String msg = "CreateSyncTable: " + e.getMessage();
            rHandler.retChanges(call, retRes, msg);
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
            String msg = "SetSyncDate: Must provide a database name";
            rHandler.retResult(call, null, msg);
            return;
        }
        String dbName = call.getString("database");

        if (!call.getData().has("syncdate")) {
            String msg = "SetSyncDate : Must provide a sync date";
            rHandler.retResult(call, null, msg);
            return;
        }
        String syncDate = call.getString("syncdate");
        try {
            implementation.setSyncDate(dbName, syncDate);
            rHandler.retResult(call, null, null);
            return;
        } catch (Exception e) {
            String msg = "SetSyncDate: " + e.getMessage();
            rHandler.retResult(call, null, msg);
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
            String msg = "GetSyncDate : Must provide a database name";
            retRes.put("changes", Integer.valueOf(-1));
            rHandler.retSyncDate(call, new Long(0), msg);
            return;
        }
        String dbName = call.getString("database");
        try {
            long syncDate = implementation.getSyncDate(dbName);
            rHandler.retSyncDate(call, syncDate, null);
            return;
        } catch (Exception e) {
            String msg = "GetSyncDate: " + e.getMessage();
            rHandler.retSyncDate(call, new Long(0), msg);
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
            String msg = "AddUpgradeStatement: Must provide a database name";
            rHandler.retResult(call, null, msg);
            return;
        }
        String dbName = call.getString("database");
        if (!call.getData().has("upgrade")) {
            String msg = "AddUpgradeStatement: Must provide an array with upgrade statement";
            rHandler.retResult(call, null, msg);
            return;
        }
        JSArray upgrade = call.getArray("upgrade");

        try {
            Dictionary<Integer, JSONObject> upgDict = implementation.addUpgradeStatement(upgrade);
            versionUpgrades.put(dbName, upgDict);
            rHandler.retResult(call, null, null);
            return;
        } catch (Exception e) {
            String msg = "AddUpgradeStatement: " + e.getMessage();
            rHandler.retResult(call, null, msg);
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
            String msg = "IsJsonValid: Must provide a Stringify Json Object";
            rHandler.retResult(call, false, msg);
            return;
        }
        String parsingData = call.getString("jsonstring");
        try {
            Boolean res = implementation.isJsonValid(parsingData);
            rHandler.retResult(call, res, null);
            return;
        } catch (Exception e) {
            String msg = "isDBExists: " + e.getMessage();
            rHandler.retResult(call, false, msg);
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
            String msg = "ImportFromJson: Must provide a Stringify Json Object";
            rHandler.retChanges(call, retRes, msg);
            return;
        }
        String parsingData = call.getString("jsonstring");
        try {
            JSObject res = implementation.importFromJson(parsingData);
            rHandler.retChanges(call, res, null);
            return;
        } catch (Exception e) {
            String msg = "ImportFromJson: " + e.getMessage();
            rHandler.retChanges(call, retRes, msg);
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
            String msg = "ExportToJson: Must provide a database name";
            rHandler.retJSObject(call, retObj, msg);
            return;
        }
        String dbName = call.getString("database");
        if (!call.getData().has("jsonexportmode")) {
            String msg = "ExportToJson: Must provide an export mode";
            rHandler.retJSObject(call, retObj, msg);
            return;
        }
        String expMode = call.getString("jsonexportmode");

        if (!expMode.equals("full") && !expMode.equals("partial")) {
            String msg = "ExportToJson: Json export mode should be 'full' or 'partial'";
            rHandler.retJSObject(call, retObj, msg);
            return;
        }

        try {
            JSObject res = implementation.exportToJson(dbName, expMode);
            rHandler.retJSObject(call, res, null);
            return;
        } catch (Exception e) {
            String msg = "ExportToJson: " + e.getMessage();
            rHandler.retJSObject(call, retObj, msg);
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
        try {
            implementation.copyFromAssets();
            rHandler.retResult(call, null, null);
            return;
        } catch (Exception e) {
            String msg = "CopyFromAssets: " + e.getMessage();
            rHandler.retResult(call, null, msg);
            return;
        }
    }
}
