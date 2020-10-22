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
import com.getcapacitor.community.database.sqlite.cdssUtils.GlobalSQLite;
import com.getcapacitor.community.database.sqlite.cdssUtils.ImportExportJson.JsonSQLite;
import com.getcapacitor.community.database.sqlite.cdssUtils.SQLiteDatabaseHelper;
import com.getcapacitor.community.database.sqlite.cdssUtils.UtilsSQLite;
import com.getcapacitor.util.HostMask;
import java.io.File;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Dictionary;
import java.util.Hashtable;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

@NativePlugin(
    permissions = { Manifest.permission.WRITE_EXTERNAL_STORAGE, Manifest.permission.READ_EXTERNAL_STORAGE },
    requestCodes = { CapacitorSQLite.REQUEST_SQLITE_PERMISSION },
    permissionRequestCode = CapacitorSQLite.REQUEST_SQLITE_PERMISSION
)
public class CapacitorSQLite extends Plugin {
    static final int REQUEST_SQLITE_PERMISSION = 9538;
    private static final String TAG = "CapacitorSQLite";

    private SQLiteDatabaseHelper mDb;
    private GlobalSQLite globalData = new GlobalSQLite();
    private boolean isPermissionGranted = false;

    private Context context;
    private UtilsSQLite uSqlite = new UtilsSQLite();

    private Dictionary<String, Dictionary<Integer, JSONObject>> versionUpgrades = new Hashtable<>();

    public void load() {
        Log.v(TAG, "*** in load " + isPermissionGranted + " ***");
        if (hasRequiredPermissions()) {
            isPermissionGranted = true;
        } else {
            isPermissionGranted = false;
        }

        // Get singleton instance of database
        context = getContext();
    }

    @PluginMethod
    public void echo(PluginCall call) {
        String value = call.getString("value");

        JSObject ret = new JSObject();
        ret.put("value", value);
        call.success(ret);
    }

    @PluginMethod
    public void open(PluginCall call) {
        String dbName = null;
        int dbVersion = Integer.valueOf(-1);
        String secret = null;
        String newsecret = null;
        String inMode = null;
        JSObject ret = new JSObject();
        Log.v(TAG, "*** in open " + isPermissionGranted + " ***");
        if (!isPermissionGranted) {
            retResult(call, false, "Open command failed: Permissions not granted");
            return;
        }
        dbName = call.getString("database");
        if (dbName == null) {
            String msg = "Open command failed: Must provide a database";
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
                String msg = "Open command failed: Error inMode must ";
                msg += "be in ['encryption','secret','newsecret']";
                retResult(call, false, msg);
            }
            if (inMode.equals("encryption") || inMode.equals("secret")) {
                secret = globalData.secret;
                // this is only done for testing multiples runs
                newsecret = globalData.newsecret;
            } else if (inMode.equals("newsecret")) {
                secret = globalData.secret;
                newsecret = globalData.newsecret;
            } else if (inMode.equals("wrongsecret")) {
                // for test purpose only
                secret = "wrongsecret";
                inMode = "secret";
            } else {
                secret = "";
                newsecret = "";
            }
        } else {
            inMode = "no-encryption";
            secret = "";
        }
        mDb = new SQLiteDatabaseHelper(context, dbName + "SQLite.db", encrypted, inMode, secret, newsecret, dbVersion, versionUpgrades);
        if (!mDb.isOpen) {
            String msg = "Open command failed: Database ";
            msg += dbName + "SQLite.db not opened";
            retResult(call, false, msg);
        } else {
            retResult(call, true, null);
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void close(PluginCall call) {
        String dbName = null;
        JSObject ret = new JSObject();

        dbName = call.getString("database");
        if (dbName == null) {
            String msg = "Close command failed: ";
            msg += "Must provide a database name";
            retResult(call, false, msg);
            return;
        }
        boolean res = mDb.closeDB(dbName + "SQLite.db");
        mDb = null;
        if (res) {
            retResult(call, true, null);
        } else {
            retResult(call, false, "Close command failed");
        }
    }

    @PluginMethod
    public void execute(PluginCall call) {
        JSObject retRes = new JSObject();
        retRes.put("changes", Integer.valueOf(-1));
        String statements = call.getString("statements");
        if (statements == null) {
            String msg = "Execute command failed : ";
            msg += "Must provide raw SQL statements";
            retChanges(call, retRes, msg);
            return;
        }
        // convert string in string[]
        String[] sqlCmdArray = uSqlite.getStatementsArray(statements);
        JSObject res = mDb.execSQL(sqlCmdArray);
        if (res.getInteger("changes") == Integer.valueOf(-1)) {
            retChanges(call, retRes, res.getString("message"));
        } else {
            retChanges(call, res, null);
        }
    }

    @PluginMethod
    public void executeSet(PluginCall call) throws Exception {
        JSObject retRes = new JSObject();
        retRes.put("changes", Integer.valueOf(-1));
        JSArray set = call.getArray("set");
        if (set == null) {
            String msg = "ExecuteSet command failed : ";
            msg += "Must provide a set of SQL statements";
            retChanges(call, retRes, msg);
            return;
        }
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
        JSObject res = mDb.execSet(set);
        if (res.getInteger("changes") == Integer.valueOf(-1)) {
            retChanges(call, retRes, res.getString("message"));
        } else {
            retChanges(call, res, null);
        }
    }

    @PluginMethod
    public void run(PluginCall call) throws JSONException {
        JSObject retRes = new JSObject();
        retRes.put("changes", Integer.valueOf(-1));
        String statement = call.getString("statement");
        if (statement == null) {
            String msg = "Run command failed : ";
            msg += "Must provide a SQL statement";
            retChanges(call, retRes, msg);
            return;
        }
        JSArray values = call.getArray("values");
        if (values == null) {
            String msg = "Run command failed : ";
            msg += "Must provide an Array of values";
            retChanges(call, retRes, msg);
            return;
        }
        JSObject res;
        if (values.length() > 0) {
            res = mDb.runSQL(statement, values);
        } else {
            res = mDb.runSQL(statement, null);
        }
        if (res.getInteger("changes") == Integer.valueOf(-1)) {
            retChanges(call, retRes, res.getString("message"));
        } else {
            retChanges(call, res, null);
        }
    }

    @PluginMethod
    public void query(PluginCall call) throws JSONException {
        String statement = call.getString("statement");
        if (statement == null) {
            String msg = "Query command failed : ";
            msg += "Must provide a query statement";
            retValues(call, new JSArray(), msg);
            return;
        }
        JSArray values = call.getArray("values");
        if (values == null) {
            String msg = "Query command failed : ";
            msg += "Must provide an Array of strings";
            retValues(call, new JSArray(), msg);
            return;
        }
        JSArray res;
        if (values.length() > 0) {
            ArrayList<String> vals = new ArrayList<String>();
            for (int i = 0; i < values.length(); i++) {
                if (values.get(i) instanceof String) {
                    vals.add(values.getString(i));
                } else {
                    String msg = "Query command failed : ";
                    msg += "Must provide an Array of strings";
                    retValues(call, new JSArray(), msg);
                    return;
                }
            }
            res = mDb.querySQL(statement, vals);
        } else {
            res = mDb.querySQL(statement, new ArrayList<String>());
        }

        if (res.length() > 0) {
            retValues(call, res, null);
        } else {
            retValues(call, res, "Query command failed");
        }
    }

    @PluginMethod
    public void isDBExists(PluginCall call) {
        String dbName = null;
        dbName = call.getString("database");
        if (dbName == null) {
            String msg = "isDBExists command failed : ";
            msg += "Must provide a database name";
            retResult(call, false, msg);
            return;
        }
        File databaseFile = context.getDatabasePath(dbName + "SQLite.db");
        if (databaseFile.exists()) {
            retResult(call, true, null);
        } else {
            retResult(call, false, null);
        }
    }

    @PluginMethod
    public void deleteDatabase(PluginCall call) {
        String dbName = null;
        dbName = call.getString("database");
        if (dbName == null) {
            String msg = "DeleteDatabase command failed : ";
            msg += "Must provide a database name";
            retResult(call, false, msg);
            return;
        }

        if (mDb != null) {
            boolean res = mDb.deleteDB(dbName + "SQLite.db");
            retResult(call, true, null);
        } else {
            String msg = "DeleteDatabase command failed : ";
            msg += "The database is not opened";
            retResult(call, false, msg);
            return;
        }
    }

    @PluginMethod
    public void isJsonValid(PluginCall call) {
        String parsingData = null;
        parsingData = call.getString("jsonstring");
        if (parsingData == null) {
            String msg = "isJsonValid command failed : ";
            msg += "Must provide a Stringify Json Object";
            retResult(call, false, msg);
            return;
        }

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
            }
        } catch (Exception e) {
            String msg = "isJsonValid command failed : ";
            msg += e.getMessage();
            retResult(call, false, msg);
            return;
        }
    }

    @PluginMethod
    public void importFromJson(PluginCall call) {
        String parsingData = null;
        parsingData = call.getString("jsonstring");
        JSObject retRes = new JSObject();
        retRes.put("changes", Integer.valueOf(-1));
        if (parsingData == null) {
            String msg = "importFromJson command failed : ";
            msg += "Must provide a Stringify Json Object";
            retChanges(call, retRes, msg);
            return;
        }
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
                secret = globalData.secret;
            }
            mDb = new SQLiteDatabaseHelper(context, dbName, encrypted, inMode, secret, null, dbVersion, versionUpgrades);

            if (!mDb.isOpen) {
                String msg = "importFromJson command failed : ";
                msg += dbName + "SQLite.db not opened";
                retChanges(call, retRes, msg);
            } else {
                JSObject res = mDb.importFromJson(jsonSQL);
                if (res.getInteger("changes") == Integer.valueOf(-1)) {
                    String msg = "importFromJson command failed : ";
                    msg += "import JsonObject not successful";
                    retChanges(call, retRes, msg);
                } else {
                    retChanges(call, res, null);
                }
            }
        } catch (Exception e) {
            String msg = "importFromJson command failed : ";
            msg += e.getMessage();
            retChanges(call, retRes, msg);
            return;
        }
    }

    @PluginMethod
    public void exportToJson(PluginCall call) {
        String expMode = null;
        JSObject retObj = new JSObject();
        JsonSQLite retJson = new JsonSQLite();
        expMode = call.getString("jsonexportmode");
        if (expMode == null) {
            String msg = "exportToJson command failed : ";
            msg += "Must provide an export mode";
            retJSObject(call, retObj, msg);
            return;
        }
        if (!expMode.equals("full") && !expMode.equals("partial")) {
            String msg = "exportToJson command failed : ";
            msg += "Json export mode should be 'full' or 'partial'";
            retJSObject(call, retObj, msg);
            return;
        }
        JSObject ret = mDb.exportToJson(expMode);

        if (ret.length() == 4) {
            retJSObject(call, ret, null);
            return;
        } else {
            String msg = "exportToJson command failed : ";
            msg += "return Obj is not a JsonSQLite Obj";
            retJSObject(call, retObj, msg);
            return;
        }
    }

    @PluginMethod
    public void createSyncTable(PluginCall call) {
        JSObject retRes = new JSObject();
        retRes.put("changes", Integer.valueOf(-1));
        JSObject res = mDb.createSyncTable();
        if (res.getInteger("changes") == Integer.valueOf(-1)) {
            String msg = "createSyncTable command failed";
            retChanges(call, retRes, msg);
        } else {
            retChanges(call, res, null);
        }
    }

    @PluginMethod
    public void setSyncDate(PluginCall call) {
        String syncDate = null;
        syncDate = call.getString("syncdate");
        if (syncDate == null) {
            String msg = "SetSyncDate command failed : ";
            msg += "Must provide a sync date";
            retResult(call, false, msg);
            return;
        }
        boolean res = mDb.setSyncDate(syncDate);
        if (!res) {
            String msg = "SetSyncDate command failed";
            retResult(call, false, msg);
        } else {
            retResult(call, true, null);
        }
    }

    @PluginMethod
    public void addUpgradeStatement(PluginCall call) throws JSONException {
        String dbName = null;
        dbName = call.getString("database");
        if (dbName == null) {
            String msg = "addUpgradeStatement command failed: ";
            msg += "Must provide a database name";
            retResult(call, false, msg);
            return;
        }
        JSArray upgrade = call.getArray("upgrade");
        if (upgrade == null || upgrade.length() == 0) {
            String msg = "addUpgradeStatement command failed : ";
            msg += "Must provide an upgrade statement";
            retResult(call, false, msg);
            return;
        }
        Dictionary<Integer, JSONObject> upgDict = new Hashtable<>();

        JSONObject upgObj = (JSONObject) upgrade.get(0);

        if (!upgObj.has("fromVersion") || !upgObj.has("toVersion") || !upgObj.has("toVersion")) {
            String msg = "addUpgradeStatement command failed : ";
            msg += "Must provide an upgrade statement";
            msg += "{fromVersion,toVersion,statement}";
            retResult(call, false, msg);
            return;
        }
        int fromVersion = Integer.valueOf(-1);
        fromVersion = upgObj.getInt("fromVersion");
        if (fromVersion == -1) {
            String msg = "addUpgradeStatement command failed : ";
            msg += "Must provide fromVersion as Integer";
            retResult(call, false, msg);
        }
        upgDict.put(fromVersion, upgObj);
        versionUpgrades.put(dbName + "SQLite.db", upgDict);
        retResult(call, true, null);
    }

    @Override
    protected void handleRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.handleRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQUEST_SQLITE_PERMISSION) {
            boolean permissionsGranted = true;
            for (int grantResult : grantResults) {
                if (grantResult != 0) {
                    permissionsGranted = false;
                }
            }

            PluginCall savedCall = getSavedCall();
            if (permissionsGranted) {
                isPermissionGranted = true;
                savedCall.resolve();
            } else {
                isPermissionGranted = false;
                savedCall.reject("permission failed");
            }
            this.freeSavedCall();
        }
    }

    private void retResult(PluginCall call, Boolean res, String message) {
        JSObject ret = new JSObject();
        ret.put("result", res);
        if (message != null) {
            ret.put("message", message);
            Log.v(TAG, "*** ERROR " + message);
        }
        call.resolve(ret);
    }

    private void retChanges(PluginCall call, JSObject res, String message) {
        JSObject ret = new JSObject();
        ret.put("changes", res);
        if (message != null) {
            ret.put("message", message);
            Log.v(TAG, "*** ERROR " + message);
        }
        call.resolve(ret);
    }

    private void retValues(PluginCall call, JSArray res, String message) {
        JSObject ret = new JSObject();
        ret.put("values", res);
        if (message != null) {
            ret.put("message", message);
            Log.v(TAG, "*** ERROR " + message);
        }
        call.resolve(ret);
    }

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
