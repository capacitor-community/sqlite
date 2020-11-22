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
import com.getcapacitor.community.database.sqlite.SQLite.UtilsSQLite;
import java.util.ArrayList;
import java.util.Dictionary;
import java.util.Hashtable;
import org.json.JSONArray;

@NativePlugin(
    permissions = { Manifest.permission.WRITE_EXTERNAL_STORAGE, Manifest.permission.READ_EXTERNAL_STORAGE },
    requestCodes = { CapacitorSQLite.REQUEST_SQLITE_PERMISSION }
)
public class CapacitorSQLite extends Plugin {
    static final int REQUEST_SQLITE_PERMISSION = 9538;
    private static final String TAG = "CapacitorSQLite";
    private Context context;
    private boolean isPermissionGranted = false;
    private Dictionary<String, Database> dbDict = new Hashtable<>();
    private UtilsSQLite uSqlite = new UtilsSQLite();

    /**
     * Load Method
     * Load the plugin
     */
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
        Log.v(TAG, "*** in createConnection " + isPermissionGranted + " ***");
        if (!isPermissionGranted) {
            retResult(call, false, "createConnection command failed: Permissions " + "not granted");
            return;
        }
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
        //1234567890123456789012345678901234567890123456789012345678901234567890

        Database db = new Database(context, dbName + "SQLite.db", encrypted, inMode, dbVersion);
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
                    } else {
                        retResult(call, true, null);
                    }
                    return;
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
                } else {
                    retChanges(call, res, null);
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
                } else {
                    retChanges(call, res, null);
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
                if (res.length() > 0) {
                    retValues(call, res, null);
                } else {
                    retValues(call, res, "Query command failed");
                }
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
     * RequestPermissions Method
     * Request Read and Write permissions
     * @param call
     */
    @PluginMethod
    public void requestPermissions(PluginCall call) {
        pluginRequestPermissions(
            new String[] { Manifest.permission.WRITE_EXTERNAL_STORAGE, Manifest.permission.READ_EXTERNAL_STORAGE },
            REQUEST_SQLITE_PERMISSION
        );
    }

    /**
     * HandleRequestPermissionsResult Method
     *
     * @param requestCode
     * @param permissions
     * @param grantResults
     */
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

            JSObject data = new JSObject();
            if (permissionsGranted) {
                isPermissionGranted = true;
                notifyPermissionsRequest(isPermissionGranted);
            } else {
                isPermissionGranted = false;
                notifyPermissionsRequest(isPermissionGranted);
            }
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

    /**
     * NotifyPermissionsRequest Method
     * Create and Send the notification to
     * the 'permissionGranted' listener
     * @param isPermissionGranted
     */
    protected void notifyPermissionsRequest(boolean isPermissionGranted) {
        final JSObject data = new JSObject();
        if (isPermissionGranted) {
            data.put("permissionGranted", Integer.valueOf(1));
        } else {
            data.put("permissionGranted", Integer.valueOf(0));
        }
        bridge
            .getActivity()
            .runOnUiThread(
                new Runnable() {

                    @Override
                    public void run() {
                        notifyListeners("androidPermissionsRequest", data);
                    }
                }
            );
    }
}
