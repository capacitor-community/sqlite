package com.getcapacitor.community.database.sqlite.SQLite;

import static android.database.Cursor.FIELD_TYPE_BLOB;
import static android.database.Cursor.FIELD_TYPE_FLOAT;
import static android.database.Cursor.FIELD_TYPE_INTEGER;
import static android.database.Cursor.FIELD_TYPE_NULL;
import static android.database.Cursor.FIELD_TYPE_STRING;

import android.content.Context;
import android.content.SharedPreferences;
import android.text.TextUtils;
import android.util.Log;
import androidx.sqlite.db.SimpleSQLiteQuery;
import androidx.sqlite.db.SupportSQLiteDatabase;
import androidx.sqlite.db.SupportSQLiteStatement;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.community.database.sqlite.SQLite.GlobalSQLite;
import com.getcapacitor.community.database.sqlite.SQLite.ImportExportJson.ExportToJson;
import com.getcapacitor.community.database.sqlite.SQLite.ImportExportJson.ImportFromJson;
import com.getcapacitor.community.database.sqlite.SQLite.ImportExportJson.JsonSQLite;
import com.getcapacitor.community.database.sqlite.SQLite.ImportExportJson.UtilsJson;
import com.getcapacitor.community.database.sqlite.SQLite.UtilsSQLCipher;
import com.getcapacitor.community.database.sqlite.SQLite.UtilsSQLite;
import java.io.File;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.Dictionary;
import java.util.Hashtable;
import java.util.Iterator;
import net.sqlcipher.Cursor;
import net.sqlcipher.database.SQLiteDatabase;
import net.sqlcipher.database.SQLiteException;
import org.json.JSONArray;
import org.json.JSONObject;

public class Database {

    private static final String TAG = Database.class.getName();
    private Boolean _isOpen = false;
    private String _dbName;
    private Context _context;
    private String _mode;
    private String _secret;
    private Boolean _encrypted;
    private SharedPreferences _sharedPreferences;
    private File _file;
    private int _version;
    private GlobalSQLite _globVar;
    private SupportSQLiteDatabase _db = null;
    private UtilsSQLite _uSqlite;
    private UtilsSQLCipher _uCipher;
    private UtilsFile _uFile;
    private UtilsJson _uJson;
    private UtilsUpgrade _uUpg;
    private UtilsSecret _uSecret;
    private Dictionary<Integer, JSONObject> _vUpgObject = new Hashtable<>();
    private ImportFromJson fromJson = new ImportFromJson();
    private ExportToJson toJson = new ExportToJson();
    private Boolean ncDB = false;

    public Database(
        Context context,
        String dbName,
        Boolean encrypted,
        String mode,
        int version,
        Dictionary<Integer, JSONObject> vUpgObject,
        SharedPreferences sharedPreferences
    ) {
        this._context = context;
        this._dbName = dbName;
        this._mode = mode;
        this._encrypted = encrypted;
        this._version = version;
        this._vUpgObject = vUpgObject;
        this._sharedPreferences = sharedPreferences;
        if (dbName.contains("/") && dbName.endsWith("SQLite.db")) {
            this.ncDB = true;
            this._file = new File(dbName);
        } else {
            this._file = this._context.getDatabasePath(dbName);
        }
        this._globVar = new GlobalSQLite();
        this._uSqlite = new UtilsSQLite();
        this._uCipher = new UtilsSQLCipher();
        this._uFile = new UtilsFile();
        this._uJson = new UtilsJson();
        this._uUpg = new UtilsUpgrade();
        this._uSecret = new UtilsSecret(context, sharedPreferences);
        InitializeSQLCipher();
        if (!this._file.getParentFile().exists()) {
            this._file.getParentFile().mkdirs();
        }
        Log.v(TAG, "&&& file path " + this._file.getAbsolutePath());
    }

    /**
     * InitializeSQLCipher Method
     * Initialize the SQLCipher Libraries
     */
    private void InitializeSQLCipher() {
        SQLiteDatabase.loadLibs(_context);
    }

    public SupportSQLiteDatabase getDb() {
        return _db;
    }

    /**
     * isOpen Method
     * @return database status
     */
    public Boolean isOpen() {
        return _isOpen;
    }

    /**
     * isNCDB Method
     * @return non-conformed database status
     */
    public Boolean isNCDB() {
        return ncDB;
    }

    /**
     * GetUrl method
     * @return database url
     */
    public String getUrl() {
        String url = "file://";
        return url + this._file.getAbsolutePath();
    }

    /**
     * Open method
     * @return open status
     */
    public void open() throws Exception {
        int curVersion;

        String password = _encrypted && (_mode.equals("secret") || _mode.equals("encryption")) ? _uSecret.getPassphrase() : "";
        if (_mode.equals("encryption")) {
            try {
                _uCipher.encrypt(_context, _file, SQLiteDatabase.getBytes(password.toCharArray()));
            } catch (Exception e) {
                String msg = "Failed in encryption " + e.getMessage();
                Log.v(TAG, msg);
                throw new Exception(msg);
            }
        }
        try {
            if (!isNCDB()) {
                _db = SQLiteDatabase.openOrCreateDatabase(_file, password, null);
            } else {
                _db = SQLiteDatabase.openDatabase(String.valueOf(_file), "", null, SQLiteDatabase.OPEN_READONLY);
            }
            if (_db != null) {
                if (_db.isOpen()) {
                    // set the Foreign Key Pragma ON
                    try {
                        _db.setForeignKeyConstraintsEnabled(true);
                    } catch (IllegalStateException e) {
                        String msg = "Failed in setForeignKeyConstraintsEnabled " + e.getMessage();
                        Log.v(TAG, msg);
                        close();
                        _db = null;
                        throw new Exception(msg);
                    }
                    if (!isNCDB()) {
                        try {
                            curVersion = _db.getVersion();
                            if (curVersion == 0) {
                                _db.setVersion(1);
                                curVersion = _db.getVersion();
                            }
                        } catch (IllegalStateException e) {
                            String msg = "Failed in get/setVersion " + e.getMessage();
                            Log.v(TAG, msg);
                            close();
                            _db = null;
                            throw new Exception(msg);
                        } catch (SQLiteException e) {
                            String msg = "Failed in setVersion " + e.getMessage();
                            Log.v(TAG, msg);
                            close();
                            _db = null;
                            throw new Exception(msg);
                        }
                        if (_version > curVersion) {
                            if (_vUpgObject != null && _vUpgObject.size() > 0) {
                                try {
                                    _uUpg.onUpgrade(this, _context, _dbName, _vUpgObject, curVersion, _version);
                                    boolean ret = _uFile.deleteBackupDB(_context, _dbName);
                                    if (!ret) {
                                        String msg = "Failed in deleteBackupDB backup-\" + _dbName";
                                        Log.v(TAG, msg);
                                        close();
                                        _db = null;
                                        throw new Exception(msg);
                                    }
                                } catch (Exception e) {
                                    // restore DB
                                    boolean ret = _uFile.restoreDatabase(_context, _dbName);
                                    String msg = e.getMessage();
                                    if (!ret) msg += "Failed in restoreDatabase " + _dbName;
                                    Log.v(TAG, msg);
                                    close();
                                    _db = null;
                                    throw new Exception(msg);
                                }
                            } else {
                                try {
                                    _db.setVersion(_version);
                                } catch (Exception e) {
                                    String msg = e.getMessage() + "Failed in setting version " + _version;
                                    close();
                                    _db = null;
                                    throw new Exception(msg);
                                }
                            }
                        }
                        _isOpen = true;
                        return;
                    }
                } else {
                    _isOpen = false;
                    _db = null;
                    throw new Exception("Database not opened");
                }
            } else {
                _isOpen = false;
                _db = null;
                throw new Exception("No database returned");
            }
        } catch (Exception e) {
            String msg = "Error in creating the database" + e.getMessage();
            _isOpen = false;
            _db = null;
            throw new Exception(msg);
        }
    }

    /**
     * Close Method
     * @return close status
     */

    public void close() throws Exception {
        if (_db.isOpen()) {
            try {
                _db.close();
                _isOpen = false;
                return;
            } catch (Exception e) {
                String msg = "Failed in database close" + e.getMessage();
                Log.v(TAG, msg);
                throw new Exception(msg);
            }
        } else {
            throw new Exception("Database not opened");
        }
    }

    public Integer getVersion() throws Exception {
        if (_db.isOpen()) {
            try {
                Integer curVersion = _db.getVersion();
                return curVersion;
            } catch (Exception e) {
                String msg = "Failed in database getVersion" + e.getMessage();
                Log.v(TAG, msg);
                throw new Exception(msg);
            }
        } else {
            throw new Exception("Database not opened");
        }
    }

    /**
     * GetDBState Method
     * @return the detected state of the database
     */
    /*    public UtilsSQLCipher.State getDBState() {
        return _uCipher.getDatabaseState(_file, _globVar);
    }
*/
    /**
     * IsDBExists Method
     * @return the existence of the database on folder
     */
    public boolean isDBExists() {
        if (_file.exists()) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Execute Method
     * Execute an Array of SQL Statements
     * @param statements Array of Strings
     * @return
     */
    public JSObject execute(String[] statements, Boolean... others) throws Exception {
        Boolean transaction = others.length == 1 ? others[0] : true;
        JSObject retObj = new JSObject();
        Integer changes = Integer.valueOf(-1);
        try {
            if (_db != null && _db.isOpen()) {
                Integer initChanges = _uSqlite.dbChanges(_db);
                if (transaction) _db.beginTransaction();
                for (String cmd : statements) {
                    if (!cmd.endsWith(";")) cmd += ";";
                    _db.execSQL(cmd);
                }
                changes = _uSqlite.dbChanges(_db) - initChanges;
                if (changes != -1) {
                    if (transaction) _db.setTransactionSuccessful();
                    retObj.put("changes", changes);
                }
                return retObj;
            } else {
                throw new Exception("Database not opened");
            }
        } catch (Exception e) {
            throw new Exception(e.getMessage());
        } finally {
            if (_db != null && transaction && _db.inTransaction()) _db.endTransaction();
        }
    }

    /**
     * ExecuteSet Method
     * Execute a Set of SQL Statements
     * @param set JSArray of statements
     * @return
     */
    public JSObject executeSet(JSArray set, Boolean... others) throws Exception {
        Boolean transaction = others.length == 1 ? others[0] : true;
        JSObject retObj = new JSObject();
        Long lastId = Long.valueOf(-1);
        Integer changes = Integer.valueOf(-1);
        try {
            if (_db != null && _db.isOpen()) {
                Integer initChanges = _uSqlite.dbChanges(_db);
                if (transaction) _db.beginTransaction();
                for (int i = 0; i < set.length(); i++) {
                    JSONObject row = set.getJSONObject(i);
                    String statement = row.getString("statement");
                    JSONArray valuesJson = row.getJSONArray("values");
                    ArrayList<Object> values = new ArrayList<>();
                    for (int j = 0; j < valuesJson.length(); j++) {
                        values.add(valuesJson.get(j));
                    }
                    Boolean isArray = values.size() > 0 ? _uSqlite.parse(values.get(0)) : false;
                    if (isArray) {
                        for (int j = 0; j < values.size(); j++) {
                            JSONArray valsJson = (JSONArray) values.get(j);
                            ArrayList<Object> vals = new ArrayList<>();
                            for (int k = 0; k < valsJson.length(); k++) {
                                vals.add(valsJson.get(k));
                            }
                            lastId = prepareSQL(statement, vals);
                            if (lastId == -1) break;
                        }
                    } else {
                        lastId = prepareSQL(statement, values);
                    }
                    if (lastId == -1) break;
                }
                if (lastId != -1) {
                    if (transaction) _db.setTransactionSuccessful();
                    changes = _uSqlite.dbChanges(_db) - initChanges;
                    retObj.put("changes", changes);
                    retObj.put("lastId", lastId);
                    return retObj;
                } else {
                    throw new Exception("lastId equals -1");
                }
            } else {
                throw new Exception("Database not opened");
            }
        } catch (Exception e) {
            throw new Exception(e.getMessage());
        } finally {
            if (_db != null && transaction && _db.inTransaction()) _db.endTransaction();
        }
    }

    /**
     * InTransaction Method
     * Check if a transaction is still running
     * @return
     */
    public boolean inTransaction() {
        return _db.inTransaction();
    }

    /**
     * RunSQL Method
     * @param statement a raw SQL statement
     * @param values Array of Strings to bind to the statement
     * @return
     */
    public JSObject runSQL(String statement, ArrayList<Object> values, Boolean... others) throws Exception {
        Boolean transaction = others.length == 1 ? others[0] : true;
        JSObject retObj = new JSObject();
        long lastId = Long.valueOf(-1);
        int changes = Integer.valueOf(-1);
        try {
            if (_db != null && _db.isOpen() && statement.length() > 0) {
                Integer initChanges = _uSqlite.dbChanges(_db);
                if (transaction) _db.beginTransaction();
                lastId = prepareSQL(statement, values);
                if (lastId != -1 && transaction) _db.setTransactionSuccessful();
                changes = _uSqlite.dbChanges(_db) - initChanges;
                retObj.put("changes", changes);
                retObj.put("lastId", lastId);
                return retObj;
            } else {
                throw new Exception("Database not opened");
            }
        } catch (Exception e) {
            throw new Exception(e.getMessage());
        } finally {
            if (_db != null && transaction && _db.inTransaction()) _db.endTransaction();
        }
    }

    /**
     * PrepareSQL Method
     * @param statement
     * @param values
     * @return
     */
    public long prepareSQL(String statement, ArrayList<Object> values) throws Exception {
        String stmtType = statement.replaceAll("\n", "").trim().substring(0, 6).toUpperCase();
        SupportSQLiteStatement stmt = null;
        try {
            stmt = _db.compileStatement(statement);
            if (values != null && values.size() > 0) {
                Object[] valObj = new Object[values.size()];
                for (int i = 0; i < values.size(); i++) {
                    if (values.get(i) == null) {
                        valObj[i] = null;
                        //                    } else if (values.get(i).equals("NULL")) {
                        //                        valObj[i] = null;
                    } else if (JSONObject.NULL == values.get(i)) {
                        valObj[i] = null;
                    } else {
                        valObj[i] = values.get(i);
                    }
                }
                SimpleSQLiteQuery.bind(stmt, valObj);
            }
            if (stmtType.equals("INSERT")) {
                return stmt.executeInsert();
            } else {
                return Long.valueOf(stmt.executeUpdateDelete());
            }
        } catch (IllegalStateException e) {
            throw new Exception(e.getMessage());
        } catch (IllegalArgumentException e) {
            throw new Exception(e.getMessage());
        } catch (Exception e) {
            throw new Exception(e.getMessage());
        } finally {
            if (stmt != null) {
                stmt.close();
            }
        }
    }

    /**
     * SelectSQL Method
     * Query a raw sql statement with or without binding values
     * @param statement
     * @param values
     * @return
     */
    public JSArray selectSQL(String statement, ArrayList<Object> values) throws Exception {
        JSArray retArray = new JSArray();
        Cursor c = null;
        if (_db == null) {
            return retArray;
        }
        try {
            c = (Cursor) _db.query(statement, values.toArray(new Object[0]));
            while (c.moveToNext()) {
                JSObject row = new JSObject();
                for (int i = 0; i < c.getColumnCount(); i++) {
                    String colName = c.getColumnName(i);
                    int type = c.getType(i);
                    switch (type) {
                        case FIELD_TYPE_STRING:
                            row.put(colName, c.getString(c.getColumnIndex(colName)));
                            break;
                        case FIELD_TYPE_INTEGER:
                            row.put(colName, c.getLong(c.getColumnIndex(colName)));
                            break;
                        case FIELD_TYPE_FLOAT:
                            row.put(colName, c.getDouble(c.getColumnIndex(colName)));
                            break;
                        case FIELD_TYPE_BLOB:
                            row.put(colName, c.getBlob(c.getColumnIndex(colName)));
                            break;
                        case FIELD_TYPE_NULL:
                            row.put(colName, JSONObject.NULL);
                            break;
                        default:
                            break;
                    }
                }
                retArray.put(row);
            }
            return retArray;
        } catch (Exception e) {
            throw new Exception("in selectSQL cursor " + e.getMessage());
        } finally {
            if (c != null) c.close();
        }
    }

    /**
     * DeleteDB Method
     * Delete the database file
     * @param dbName
     * @return
     */
    public void deleteDB(String dbName) throws Exception {
        try {
            // open the database
            if (_file.exists() && !_isOpen) {
                open();
            }
            // close the db
            if (_isOpen) {
                close();
            }
            // delete the database
            if (_file.exists()) {
                Boolean ret = _uFile.deleteDatabase(_context, dbName);
                if (ret) {
                    _isOpen = false;
                } else {
                    throw new Exception("Failed in deleteDB ");
                }
            }
            return;
        } catch (Exception e) {
            throw new Exception("Failed in deleteDB " + e.getMessage());
        }
    }

    /**
     * CreateSyncTable Method
     * create the synchronization table
     * @return
     */
    public JSObject createSyncTable() throws Exception {
        // Open the database for writing
        JSObject retObj = new JSObject();
        // check if the table has already been created
        boolean isExists = _uJson.isTableExists(this, "sync_table");
        if (!isExists) {
            Date date = new Date();
            long syncTime = date.getTime() / 1000L;
            String[] statements = {
                "CREATE TABLE IF NOT EXISTS sync_table (" + "id INTEGER PRIMARY KEY NOT NULL," + "sync_date INTEGER);",
                "INSERT INTO sync_table (sync_date) VALUES ('" + syncTime + "');"
            };
            try {
                retObj = execute(statements);
                return retObj;
            } catch (Exception e) {
                throw new Exception(e.getMessage());
            }
        } else {
            retObj.put("changes", Integer.valueOf(0));
            return retObj;
        }
    }

    /**
     * SetSyncDate Method
     * Set the synchronization date
     * @param syncDate
     * @return
     */
    public void setSyncDate(String syncDate) throws Exception {
        JSObject retObj = new JSObject();
        try {
            SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSZ");
            Date date = formatter.parse(syncDate.replaceAll("Z$", "+0000"));
            long syncTime = date.getTime() / 1000L;
            String[] statements = { "UPDATE sync_table SET sync_date = " + syncTime + " WHERE id = 1;" };
            retObj = execute(statements);
            if (retObj.getInteger("changes") != Integer.valueOf(-1)) {
                return;
            } else {
                throw new Exception("changes < 0");
            }
        } catch (Exception e) {
            throw new Exception(e.getMessage());
        }
    }

    public Long getSyncDate() throws Exception {
        long syncDate = 0;
        try {
            syncDate = toJson.getSyncDate(this);
            return syncDate;
        } catch (Exception e) {
            throw new Exception(e.getMessage());
        }
    }

    /**
     * Import from Json object
     * @param jsonSQL
     * @return
     */
    public JSObject importFromJson(JsonSQLite jsonSQL) throws Exception {
        JSObject retObj = new JSObject();
        int changes = Integer.valueOf(0);
        try {
            if (jsonSQL.getTables().size() > 0) {
                // create the database schema
                changes = fromJson.createDatabaseSchema(this, jsonSQL);
                if (changes != -1) {
                    changes += fromJson.createDatabaseData(this, jsonSQL);
                }
            }
            if (jsonSQL.getViews().size() > 0) {
                changes += fromJson.createViews(this, jsonSQL.getViews());
            }
            retObj.put("changes", changes);
            return retObj;
        } catch (Exception e) {
            throw new Exception(e.getMessage());
        }
    }

    /**
     * Export to JSON Object
     * @param mode
     * @return
     */
    public JSObject exportToJson(String mode) {
        JsonSQLite inJson = new JsonSQLite();
        JSObject retObj = new JSObject();
        inJson.setDatabase(_dbName.substring(0, _dbName.length() - 9));
        inJson.setVersion(_version);
        inJson.setEncrypted(_encrypted);
        inJson.setMode(mode);
        try {
            JsonSQLite retJson = toJson.createExportObject(this, inJson);
            //        retJson.print();
            ArrayList<String> keys = retJson.getKeys();
            if (keys.contains("tables")) {
                if (retJson.getTables().size() > 0) {
                    retObj.put("database", retJson.getDatabase());
                    retObj.put("version", retJson.getVersion());
                    retObj.put("encrypted", retJson.getEncrypted());
                    retObj.put("mode", retJson.getMode());
                    retObj.put("tables", retJson.getTablesAsJSObject());
                    if (keys.contains("views") && retJson.getViews().size() > 0) {
                        retObj.put("views", retJson.getViewsAsJSObject());
                    }
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error: exportToJson " + e.getMessage());
        } finally {
            return retObj;
        }
    }
}
