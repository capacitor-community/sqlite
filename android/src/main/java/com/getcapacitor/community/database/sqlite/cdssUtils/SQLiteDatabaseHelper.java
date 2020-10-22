//
//  SQLiteDatabaseHelper.java
//  Plugin
//
//  Created by  Quéau Jean Pierre on 01/21/2020.
//
package com.getcapacitor.community.database.sqlite.cdssUtils;

import static android.database.Cursor.FIELD_TYPE_BLOB;
import static android.database.Cursor.FIELD_TYPE_FLOAT;
import static android.database.Cursor.FIELD_TYPE_INTEGER;
import static android.database.Cursor.FIELD_TYPE_NULL;
import static android.database.Cursor.FIELD_TYPE_STRING;

import android.content.Context;
import android.database.Cursor;
import android.util.Log;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.community.database.sqlite.cdssUtils.ImportExportJson.ExportToJson;
import com.getcapacitor.community.database.sqlite.cdssUtils.ImportExportJson.ImportFromJson;
import com.getcapacitor.community.database.sqlite.cdssUtils.ImportExportJson.JsonSQLite;
import com.getcapacitor.community.database.sqlite.cdssUtils.ImportExportJson.UtilsJson;
import java.io.File;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.Dictionary;
import java.util.List;
import net.sqlcipher.database.SQLiteDatabase;
import net.sqlcipher.database.SQLiteOpenHelper;
import net.sqlcipher.database.SQLiteStatement;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class SQLiteDatabaseHelper extends SQLiteOpenHelper {
    public Boolean isOpen = false;
    private static final String TAG = SQLiteDatabaseHelper.class.getName();
    private static Context context;

    private String dbName;
    private Boolean encrypted;
    private String mode;
    private String secret;
    private final String newsecret;
    private final int dbVersion;
    private Dictionary<String, Dictionary<Integer, JSONObject>> versionUpgrades;
    private Binding binding = new Binding();
    private UtilsJson uJson = new UtilsJson();
    private UtilsSQLite uSqlite = new UtilsSQLite();
    private UtilsFile uFile = new UtilsFile();
    private UtilsConnection uConn = new UtilsConnection();
    private ImportFromJson fromJson = new ImportFromJson();
    private ExportToJson toJson = new ExportToJson();

    /**
     * SQLite Database Helper
     * @param _context
     * @param _dbName
     * @param _encrypted
     * @param _mode
     * @param _secret
     * @param _newsecret
     * @param _vNumber
     * @param _versionUpgrades
     */
    public SQLiteDatabaseHelper(
        Context _context,
        String _dbName,
        Boolean _encrypted,
        String _mode,
        String _secret,
        String _newsecret,
        int _vNumber,
        Dictionary<String, Dictionary<Integer, JSONObject>> _versionUpgrades
    ) {
        super(_context, _dbName, null, _vNumber);
        dbName = _dbName;
        dbVersion = _vNumber;
        encrypted = _encrypted;
        secret = _secret;
        newsecret = _newsecret;
        mode = _mode;
        context = _context;
        versionUpgrades = _versionUpgrades;

        InitializeSQLCipher();
    }

    /**
     * Initialize SQLCipher
     */
    private void InitializeSQLCipher() {
        Log.d(TAG, " in InitializeSQLCipher: ");

        SQLiteDatabase.loadLibs(context);
        File tempFile;

        String message = uConn.createConnection(this, context, dbName, encrypted, mode, secret, newsecret, dbVersion, versionUpgrades);

        isOpen = message.length() == 0 || message.equals("swap newsecret") || message.equals("success encryption") ? true : false;

        if (message.length() > 0) {
            if (message.contains("connection:")) {
                Log.v(TAG, "InitializeSQLCipher: Wrong Secret");
            } else if (message.contains("wrong secret")) {
                Log.v(TAG, "InitializeSQLCipher: Wrong Secret");
            } else if (message.contains("swap newsecret")) {
                secret = newsecret;
            } else if (message.contains("success encryption")) {
                encrypted = true;
            } else {
                Log.v(TAG, message);
            }
        }

        Log.d(TAG, "InitializeSQLCipher isOpen: " + isOpen);
    }

    @Override
    public void onCreate(SQLiteDatabase db) {
        Log.d(TAG, "onCreate: name: database created");
    }

    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        if (oldVersion != newVersion) {
            Log.d(TAG, "onUpgrade: name: database upgraded");
        }
    }

    /**
     * get connection to the db
     */
    public SQLiteDatabase getConnection(Boolean readOnly, String secret) throws Exception {
        SQLiteDatabase db = null;
        if (readOnly) {
            db = getReadableDatabase(secret);
        } else {
            db = getWritableDatabase(secret);
        }
        try {
            String cmd = "PRAGMA foreign_keys = ON;";
            db.execSQL(cmd);
            return db;
        } catch (Exception e) {
            Log.d(TAG, "Error: getConnection PRAGMA FOREIGN KEY" + " failed: ", e);
            throw new Exception("getConnection PRAGMA FOREIGN KEY" + " failed");
        }
    }

    /**
     * execute sql raw statements after opening the db
     * @param statements
     * @return
     */
    public JSObject execSQL(String[] statements) {
        // Open the database for writing
        //        Log.d(TAG, "*** in execSQL: ");
        JSObject retObj = new JSObject();
        SQLiteDatabase db = null;
        try {
            db = getConnection(false, secret);
            retObj = execute(db, statements);
            return retObj;
        } catch (Exception e) {
            Log.d(TAG, "Error: execSQL failed: ", e);
            retObj.put("changes", Integer.valueOf(-1));
            retObj.put("message", "Error: execSQL failed: " + e);
            return retObj;
        } finally {
            if (db != null) db.close();
        }
    }

    /**
     * execute a set
     * @param set
     * @return
     */
    public JSObject execSet(JSArray set) throws Exception {
        JSObject retObj = new JSObject();
        // Open the database for writing
        SQLiteDatabase db = null;
        long lastId = Long.valueOf(-1);
        int changes = 0;
        if (set.length() > 0) {
            try {
                db = getConnection(false, secret);
                db.beginTransaction();

                retObj = this.executeSet(db, set);
                if (retObj.getInt("lastId") > 0) {
                    db.setTransactionSuccessful();
                    return retObj;
                } else {
                    Log.d(TAG, "Error: ExecSet failed: ");
                    retObj.put("changes", Integer.valueOf(-1));
                    retObj.put("message", "Error: ExecSet " + "executeSet failed: ");
                }
            } catch (Exception e) {
                Log.d(TAG, "Error: ExecSet failed: ", e);
                retObj.put("changes", Integer.valueOf(-1));
                retObj.put("message", "Error: ExecSet failed: " + e);
                return retObj;
            } finally {
                if (retObj.getInt("changes") > 0) {
                    db.endTransaction();
                }
                if (db != null) db.close();
            }
            retObj.put("changes", Integer.valueOf(-1));
            retObj.put("message", "Error: ExecSet wrong statement");
            return retObj;
        } else {
            retObj.put("changes", Integer.valueOf(-1));
            retObj.put("message", "Error: ExecSet no Set given");
            return retObj;
        }
    }

    /**
     * execute a set after opening the database
     * @param db
     * @param set
     * @return
     */
    public JSObject executeSet(SQLiteDatabase db, JSArray set) throws Exception {
        long lastId = Long.valueOf(-1);
        int changes = 0;
        JSObject retObj = new JSObject();
        for (int i = 0; i < set.length(); i++) {
            JSONObject row = set.getJSONObject(i);
            String statement = row.getString("statement");
            JSONArray valuesJson = row.getJSONArray("values");
            JSArray values = new JSArray();
            for (int j = 0; j < valuesJson.length(); j++) {
                values.put(valuesJson.get(j));
            }
            lastId = prepareSQL(db, statement, values);
            if (lastId == -1) {
                Log.v(TAG, "*** breaking lastId -1");
                break;
            } else {
                changes += 1;
            }
        }
        if (lastId != -1) {
            retObj.put("changes", uSqlite.dbChanges(db));
            retObj.put("lastId", lastId);
        } else {
            retObj.put("changes", Integer.valueOf(-1));
            retObj.put("lastId", lastId);
        }
        return retObj;
    }

    /**
     * execute sql raw statements after opening the db
     * @param db
     * @param statements
     * @return
     * @throws Exception
     */
    public JSObject execute(SQLiteDatabase db, String[] statements) throws Exception {
        JSObject retObj = new JSObject();
        try {
            for (String cmd : statements) {
                if (!cmd.endsWith(";")) cmd += ";";
                db.execSQL(cmd);
            }
            retObj.put("changes", uSqlite.dbChanges(db));
            return retObj;
        } catch (Exception e) {
            throw new Exception("Execute failed");
        }
    }

    /**
     * Run one statement with or without values after opening the db
     * @param statement
     * @param values
     * @return
     */
    public JSObject runSQL(String statement, JSArray values) {
        JSObject retObj = new JSObject();
        // Open the database for writing
        SQLiteDatabase db = null;
        long lastId = Long.valueOf(-1);
        if (statement.length() > 6) {
            try {
                db = getConnection(false, secret);
                db.beginTransaction();
                lastId = prepareSQL(db, statement, values);
                if (lastId != -1) db.setTransactionSuccessful();
                retObj.put("changes", uSqlite.dbChanges(db));
                retObj.put("lastId", lastId);
                return retObj;
            } catch (Exception e) {
                Log.d(TAG, "Error: runSQL failed: ", e);
                retObj.put("changes", Integer.valueOf(-1));
                retObj.put("message", "Error: runSQL failed: " + e);
                return retObj;
            } finally {
                db.endTransaction();
                if (db != null) db.close();
            }
        } else {
            retObj.put("changes", Integer.valueOf(-1));
            retObj.put("message", "Error: runSQL statement not given");
            return retObj;
        }
    }

    /**
     * Run one statement with or without values
     * @param db
     * @param statement
     * @param values
     * @return
     */
    public long prepareSQL(SQLiteDatabase db, String statement, JSArray values) {
        boolean success = true;
        String stmtType = "";
        long lastId = Long.valueOf(-1);
        stmtType = statement.substring(0, 6).toUpperCase();
        SQLiteStatement stmt = db.compileStatement(statement);
        if (values != null && values.length() > 0) {
            // bind the values if any
            stmt.clearBindings();
            try {
                binding.bindValues(stmt, values);
            } catch (JSONException e) {
                Log.d(TAG, "Error: prepareSQL failed: " + e.getMessage());
                success = false;
            }
        }
        if (success) {
            if (stmtType.equals("INSERT")) {
                lastId = stmt.executeInsert();
            } else {
                lastId = Long.valueOf(stmt.executeUpdateDelete());
            }
        }
        stmt.close();
        return lastId;
    }

    /**
     * Query a statement after opening the db
     * @param statement
     * @param values
     * @return
     */
    public JSArray querySQL(String statement, ArrayList<String> values) {
        JSArray retArray = new JSArray();
        // Open the database for reading
        SQLiteDatabase db = null;
        Boolean success = true;
        try {
            db = getConnection(true, secret);
            retArray = selectSQL(db, statement, values);
            if (retArray.length() > 0) {
                return retArray;
            } else {
                return new JSArray();
            }
        } catch (Exception e) {
            Log.d(TAG, "Error: querySQL failed: ", e);
            return new JSArray();
        } finally {
            if (db != null) db.close();
        }
    }

    /**
     * Query a statement
     * @param db
     * @param statement
     * @param values
     * @return
     */
    public JSArray selectSQL(SQLiteDatabase db, String statement, ArrayList<String> values) {
        JSArray retArray = new JSArray();
        Cursor c = null;
        if (values != null && !values.isEmpty()) {
            // with values
            String[] bindings = new String[values.size()];
            for (int i = 0; i < values.size(); i++) {
                bindings[i] = values.get(i);
            }
            c = db.rawQuery(statement, bindings);
        } else {
            // without values
            c = db.rawQuery(statement, null);
        }
        if (c.getCount() > 0) {
            if (c.moveToFirst()) {
                do {
                    JSObject row = new JSObject();

                    for (int i = 0; i < c.getColumnCount(); i++) {
                        int type = c.getType(i);
                        switch (type) {
                            case FIELD_TYPE_STRING:
                                row.put(c.getColumnName(i), c.getString(c.getColumnIndex(c.getColumnName(i))));
                                break;
                            case FIELD_TYPE_INTEGER:
                                row.put(c.getColumnName(i), c.getLong(c.getColumnIndex(c.getColumnName(i))));
                                break;
                            case FIELD_TYPE_FLOAT:
                                row.put(c.getColumnName(i), c.getFloat(c.getColumnIndex(c.getColumnName(i))));
                                break;
                            case FIELD_TYPE_BLOB:
                                row.put(c.getColumnName(i), c.getBlob(c.getColumnIndex(c.getColumnName(i))));
                                break;
                            case FIELD_TYPE_NULL:
                                break;
                            default:
                                break;
                        }
                    }
                    retArray.put(row);
                } while (c.moveToNext());
            }
        }
        if (c != null && !c.isClosed()) {
            c.close();
        }
        return retArray;
    }

    /**
     * Close the database
     * @param databaseName
     * @return
     */
    public boolean closeDB(String databaseName) {
        boolean success = true;
        Log.d(TAG, "closeDB: databaseName " + databaseName);
        SQLiteDatabase database = null;
        File databaseFile = context.getDatabasePath(databaseName);
        try {
            database = SQLiteDatabase.openOrCreateDatabase(databaseFile, secret, null);
            database.close();
            isOpen = false;
            return true;
        } catch (Exception e) {
            Log.d(TAG, "Error: closeDB failed: ", e);
            return false;
        }
    }

    /**
     * Delete the database
     * @param databaseName
     * @return
     */
    public boolean deleteDB(String databaseName) {
        Log.d(TAG, "deleteDB: databaseName " + databaseName);

        context.deleteDatabase(databaseName);
        context.deleteFile(databaseName);

        File databaseFile = context.getDatabasePath(databaseName);
        if (databaseFile.exists()) {
            return false;
        } else {
            isOpen = false;
            return true;
        }
    }

    public void restoreDB(String databaseName) throws Exception {
        // check if the backup file exists
        boolean isBackup = this.uFile.isFileExists(context, "backup-" + databaseName);
        if (isBackup) {
            // check if database exists
            boolean isDB = this.uFile.isFileExists(context, databaseName);
            if (isDB) {
                boolean retD = this.uFile.deleteFile(context, databaseName);
                if (!retD) {
                    String msg = "Error: restoreDB: delete file ";
                    msg += databaseName;
                    throw new Exception(msg);
                } else {
                    boolean retC = this.uFile.copyFile(context, "backup-" + databaseName, databaseName);
                    if (!retC) {
                        String msg = "Error: restoreDB: copyItem";
                        msg += " failed";
                        throw new Exception(msg);
                    }
                }
            }
        } else {
            String msg = "Error: restoreDB: backup-" + databaseName;
            msg += " does not exist";
            throw new Exception(msg);
        }
    }

    /**
     * Import from Json object
     * @param jsonSQL
     * @return
     * @throws JSONException
     */
    public JSObject importFromJson(JsonSQLite jsonSQL) {
        Log.d(TAG, "importFromJson:  ");
        JSObject retObj = new JSObject();
        int changes = Integer.valueOf(-1);
        // create the database schema
        changes = fromJson.createDatabaseSchema(this, jsonSQL, secret);
        if (changes != -1) {
            changes = fromJson.createTableData(this, jsonSQL, secret);
        }
        retObj.put("changes", changes);
        return retObj;
    }

    /**
     * Export to JSON Object
     * @param mode
     * @return
     */
    public JSObject exportToJson(String mode) {
        JsonSQLite inJson = new JsonSQLite();
        JSObject retObj = new JSObject();
        inJson.setDatabase(dbName.substring(0, dbName.length() - 9));
        inJson.setVersion(dbVersion);
        inJson.setEncrypted(encrypted);
        inJson.setMode(mode);
        JsonSQLite retJson = toJson.createJsonTables(this, inJson, secret);
        //        retJson.print();
        ArrayList<String> keys = retJson.getKeys();
        if (keys.contains("tables")) {
            retObj.put("database", retJson.getDatabase());
            retObj.put("encrypted", retJson.getEncrypted());
            retObj.put("mode", retJson.getMode());
            retObj.put("tables", retJson.getTablesAsJSObject());
        }
        return retObj;
    }

    /**
     * Create the synchronization table
     * @return
     */
    public JSObject createSyncTable() {
        // Open the database for writing
        JSObject retObj = new JSObject();
        SQLiteDatabase db = null;
        try {
            db = getConnection(false, secret);
            // check if the table has already been created
            boolean isExists = uJson.isTableExists(this, db, "sync_table");
            if (!isExists) {
                Date date = new Date();
                long syncTime = date.getTime() / 1000L;
                String[] statements = {
                    "BEGIN TRANSACTION;",
                    "CREATE TABLE IF NOT EXISTS sync_table (" + "id INTEGER PRIMARY KEY NOT NULL," + "sync_date INTEGER);",
                    "INSERT INTO sync_table (sync_date) VALUES ('" + syncTime + "');",
                    "COMMIT TRANSACTION;"
                };
                retObj = execute(db, statements);
            }
        } catch (Exception e) {
            Log.d(TAG, "Error: createSyncTable failed: ", e);
        } finally {
            if (db != null) db.close();
            return retObj;
        }
    }

    /**
     * Set the synchronization date
     * @param syncDate
     * @return
     */
    public boolean setSyncDate(String syncDate) {
        boolean ret = false;
        SQLiteDatabase db = null;
        JSObject retObj = new JSObject();

        try {
            db = getConnection(false, secret);
            SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSZ");
            Date date = formatter.parse(syncDate.replaceAll("Z$", "+0000"));
            long syncTime = date.getTime() / 1000L;
            String[] statements = { "UPDATE sync_table SET sync_date = " + syncTime + " WHERE id = 1;" };
            retObj = execute(db, statements);
        } catch (Exception e) {
            Log.d(TAG, "Error: setSyncDate failed: ", e);
        } finally {
            if (db != null) db.close();
            if (retObj.getInteger("changes") != Integer.valueOf(-1)) ret = true;
            return ret;
        }
    }
}
