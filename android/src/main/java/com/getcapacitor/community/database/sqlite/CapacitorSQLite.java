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
import com.getcapacitor.community.database.sqlite.cdssUtils.JsonSQLite;
import com.getcapacitor.community.database.sqlite.cdssUtils.SQLiteDatabaseHelper;
import java.io.File;
import java.util.ArrayList;
import java.util.Arrays;
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
            retResult(call, false, "Open command failed: Must provide a database name");
            return;
        }
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
                retResult(call, false, "Open command failed: Error inMode must be in ['encryption','secret','newsecret']");
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
        mDb = new SQLiteDatabaseHelper(context, dbName + "SQLite.db", encrypted, inMode, secret, newsecret, 1);
        if (!mDb.isOpen) {
            retResult(call, false, "Open command failed: Database " + dbName + "SQLite.db not opened");
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
            retResult(call, false, "Close command failed: Must provide a database name");
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
            retChanges(call, retRes, "Execute command failed : Must provide raw SQL statements");
            call.reject("Must provide raw SQL statements");
            return;
        }
        statements.replace("end;", "END;");
        // split for each statement
        String[] sqlCmdArray = statements.split(";\n");
        // deal with trigger if any
        sqlCmdArray = dealWithTriggers(sqlCmdArray);
        // split for a single statement on multilines
        for (int i = 0; i < sqlCmdArray.length; i++) {
            String[] array = sqlCmdArray[i].split("\n");
            StringBuilder builder = new StringBuilder();
            for (String s : array) {
                builder.append(" ").append(s.trim());
            }
            sqlCmdArray[i] = builder.toString();
        }
        if (sqlCmdArray[sqlCmdArray.length - 1].trim().length() == 0) {
            sqlCmdArray = Arrays.copyOf(sqlCmdArray, sqlCmdArray.length - 1);
        }
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
            retChanges(call, retRes, "ExecuteSet command failed: Must provide a set of SQL statements");
            return;
        }
        if (set.length() == 0) {
            retChanges(call, retRes, "ExecuteSet command failed: Must provide a non-empty set of SQL statements");
            return;
        }
        for (int i = 0; i < set.length(); i++) {
            JSONArray keys = set.getJSONObject(i).names();
            for (int j = 0; j < keys.length(); ++j) {
                String key = keys.getString(j);
                if (!(key.equals("statement")) && !(key.equals("values"))) {
                    retChanges(call, retRes, "ExecuteSet command failed: Must provide a set as Array of {statement,values}");
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
            retChanges(call, retRes, "Run command failed: Must provide a SQL statement");
            return;
        }
        JSArray values = call.getArray("values");
        if (values == null) {
            retChanges(call, retRes, "Run command failed: Must provide an Array of values");
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
            retValues(call, new JSArray(), "Must provide a query statement");
            return;
        }
        JSArray values = call.getArray("values");
        if (values == null) {
            retValues(call, new JSArray(), "Must provide an Array of strings");
            return;
        }
        JSArray res;
        if (values.length() > 0) {
            ArrayList<String> vals = new ArrayList<String>();
            for (int i = 0; i < values.length(); i++) {
                if (values.get(i) instanceof String) {
                    vals.add(values.getString(i));
                } else {
                    retValues(call, new JSArray(), "Must provide an Array of strings");
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
            retResult(call, false, "isDBExists command failed: Must provide a database name");
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
            retResult(call, false, "DeleteDatabase command failed: Must provide a database name");
            return;
        }

        if (mDb != null) {
            boolean res = mDb.deleteDB(dbName + "SQLite.db");
            retResult(call, true, null);
        } else {
            retResult(call, false, "DeleteDatabase command failed: The database is not opened");
            return;
        }
    }

    @PluginMethod
    public void isJsonValid(PluginCall call) {
        String parsingData = null;
        parsingData = call.getString("jsonstring");
        if (parsingData == null) {
            retResult(call, false, "isJsonValid command failed: Must provide a Stringify Json Object");
            return;
        }

        try {
            JSObject jsonObject = new JSObject(parsingData);
            JsonSQLite jsonSQL = new JsonSQLite();
            Boolean isValid = jsonSQL.isJsonSQLite(jsonObject);
            if (!isValid) {
                retResult(call, false, "isJsonValid command failed: Stringify Json Object not Valid");
                return;
            } else {
                retResult(call, true, null);
            }
        } catch (Exception e) {
            retResult(call, false, "isJsonValid command failed: " + e.getMessage());
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
            retChanges(call, retRes, "importFromJson command failed: Must provide a Stringify Json Object");
            return;
        }
        try {
            JSObject jsonObject = new JSObject(parsingData);
            JsonSQLite jsonSQL = new JsonSQLite();
            Boolean isValid = jsonSQL.isJsonSQLite(jsonObject);
            if (!isValid) {
                retChanges(call, retRes, "importFromJson command failed: Stringify Json Object not Valid");
                return;
            }
            String dbName = new StringBuilder(jsonSQL.getDatabase()).append("SQLite.db").toString();
            //            jsonSQL.print();
            Boolean encrypted = jsonSQL.getEncrypted();
            String secret = null;
            String inMode = "no-encryption";
            if (encrypted) {
                inMode = "secret";
                secret = globalData.secret;
            }
            mDb = new SQLiteDatabaseHelper(context, dbName, encrypted, inMode, secret, null, 1);

            if (!mDb.isOpen) {
                retChanges(call, retRes, "importFromJson command failed: Database " + dbName + "SQLite.db not opened");
            } else {
                JSObject res = mDb.importFromJson(jsonSQL);
                if (res.getInteger("changes") == Integer.valueOf(-1)) {
                    retChanges(call, retRes, "importFromJson command failed: " + "import JsonObject not successful");
                } else {
                    retChanges(call, res, null);
                }
            }
        } catch (Exception e) {
            retChanges(call, retRes, "importFromJson command failed: " + e.getMessage());
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
            retJSObject(call, retObj, "exportToJson: Must provide an export mode");
            return;
        }
        if (!expMode.equals("full") && !expMode.equals("partial")) {
            retJSObject(call, retObj, "exportToJson: Json export mode should be 'full' or 'partial'");
            return;
        }
        JSObject ret = mDb.exportToJson(expMode);

        if (ret.length() == 4) {
            retJSObject(call, ret, null);
            return;
        } else {
            retJSObject(call, retObj, "exportToJson: return Obj is not a JsonSQLite Obj");
            return;
        }
    }

    @PluginMethod
    public void createSyncTable(PluginCall call) {
        JSObject retRes = new JSObject();
        retRes.put("changes", Integer.valueOf(-1));
        JSObject res = mDb.createSyncTable();
        if (res.getInteger("changes") == Integer.valueOf(-1)) {
            retChanges(call, retRes, "createSyncTable command failed");
        } else {
            retChanges(call, res, null);
        }
    }

    @PluginMethod
    public void setSyncDate(PluginCall call) {
        String syncDate = null;
        syncDate = call.getString("syncdate");
        if (syncDate == null) {
            retResult(call, false, "SetSyncDate command failed: Must provide a sync date");
            return;
        }
        boolean res = mDb.setSyncDate(syncDate);
        if (!res) {
            retResult(call, false, "setSyncDate command failed");
        } else {
            retResult(call, true, null);
        }
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

    private String[] dealWithTriggers(String[] sqlCmdArray) {
        List listArray = Arrays.asList(sqlCmdArray);
        listArray = trimArray(listArray);
        listArray = concatRemoveEnd(listArray);
        String[] retArray = (String[]) listArray.toArray(new String[0]);
        return retArray;
    }

    private List concatRemoveEnd(List listArray) {
        List lArray = new ArrayList(listArray);
        if (lArray.contains("END")) {
            int idx = lArray.indexOf("END");
            lArray.set(idx - 1, lArray.get(idx - 1) + "; END");
            Object o = lArray.remove(idx);
            return concatRemoveEnd(lArray);
        } else {
            return lArray;
        }
    }

    private List trimArray(List listArray) {
        for (int i = 0; i < listArray.size(); i++) {
            listArray.set(i, listArray.get(i).toString().trim());
        }
        return listArray;
    }
}
