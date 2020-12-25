package com.getcapacitor.community.database.sqlite.SQLite;

import static android.database.Cursor.FIELD_TYPE_BLOB;
import static android.database.Cursor.FIELD_TYPE_FLOAT;
import static android.database.Cursor.FIELD_TYPE_INTEGER;
import static android.database.Cursor.FIELD_TYPE_NULL;
import static android.database.Cursor.FIELD_TYPE_STRING;

import android.content.Context;
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
import net.sqlcipher.Cursor;
import net.sqlcipher.database.SQLiteDatabase;
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
    private File _file;
    private int _version;
    private GlobalSQLite _globVar;
    private SupportSQLiteDatabase _db = null;
    private UtilsSQLite _uSqlite;
    private UtilsSQLCipher _uCipher;
    private UtilsFile _uFile;
    private UtilsJson _uJson;
    private UtilsUpgrade _uUpg;
    private Dictionary<Integer, JSONObject> _vUpgObject = new Hashtable<>();
    private ImportFromJson fromJson = new ImportFromJson();
    private ExportToJson toJson = new ExportToJson();

    public Database(
        Context context,
        String dbName,
        Boolean encrypted,
        String mode,
        int version,
        Dictionary<Integer, JSONObject> vUpgObject
    ) {
        this._context = context;
        this._dbName = dbName;
        this._mode = mode;
        this._encrypted = encrypted;
        this._version = version;
        this._vUpgObject = vUpgObject;
        this._file = this._context.getDatabasePath(dbName);
        this._globVar = new GlobalSQLite();
        this._uSqlite = new UtilsSQLite();
        this._uCipher = new UtilsSQLCipher();
        this._uFile = new UtilsFile();
        this._uJson = new UtilsJson();
        this._uUpg = new UtilsUpgrade();
        InitializeSQLCipher();
        if (!this._file.getParentFile().exists()) {
            this._file.getParentFile().mkdirs();
        }
        Log.v(TAG, "&&& file path " + this._file.getAbsolutePath());
        // added for successive runs
        //        this._file.delete();

    }

    /**
     * InitializeSQLCipher Method
     * Initialize the SQLCipher Libraries
     */
    private void InitializeSQLCipher() {
        Log.d(TAG, " in InitializeSQLCipher: ");
        SQLiteDatabase.loadLibs(_context);
    }

    public SupportSQLiteDatabase getDb() {
        return _db;
    }

    /**
     * isOpen Method
     * @return database open status
     */
    public Boolean isOpen() {
        return _isOpen;
    }

    /**
     * Open method
     * @return open status
     */
    public boolean open() {
        String password = _encrypted && (_mode.equals("secret") || _mode.equals("encryption")) ? _globVar.secret : "";
        if (_mode.equals("newsecret")) {
            try {
                _uCipher.changePassword(_context, _file, _globVar.secret, _globVar.newsecret);
                password = _globVar.newsecret;
            } catch (Exception e) {
                Log.v(TAG, "Error in open database change password" + e.getMessage());
                return false;
            }
        }
        if (_mode.equals("encryption")) {
            try {
                _uCipher.encrypt(_context, _file, SQLiteDatabase.getBytes(password.toCharArray()));
            } catch (Exception e) {
                Log.v(TAG, "Error in open database encryption " + e.getMessage());
                return false;
            }
        }

        _db = SQLiteDatabase.openOrCreateDatabase(_file, password, null);
        if (_db != null) {
            if (_db.isOpen()) {
                // set the Foreign Key Pragma ON
                try {
                    _db.setForeignKeyConstraintsEnabled(true);
                } catch (IllegalStateException e) {
                    String msg = "Error in open database ";
                    msg += "setForeignKeyConstraintsEnabled failed " + e;
                    Log.v(TAG, msg);
                    close();
                    _db = null;
                    return false;
                }
                int curVersion = _db.getVersion();
                if (curVersion == 0) {
                    _db.setVersion(1);
                    curVersion = _db.getVersion();
                }
                if (_version > curVersion) {
                    try {
                        _uUpg.onUpgrade(this, _context, _dbName, _vUpgObject, curVersion, _version);
                        boolean ret = _uFile.deleteBackupDB(_context, _dbName);
                        if (!ret) {
                            Log.v(TAG, "Error: deleteBackupDB backup-" + _dbName + " failed ");
                            close();
                            _db = null;
                            return false;
                        }
                    } catch (Exception e) {
                        // restore DB
                        boolean ret = _uFile.restoreDatabase(_context, _dbName);
                        String msg = e.getMessage();
                        if (!ret) msg += " restoreDatabase " + _dbName + " failed ";
                        Log.v(TAG, msg);
                        close();
                        _db = null;
                        return false;
                    }
                }
                _isOpen = true;
                return true;
            } else {
                _isOpen = false;
                _db = null;
                return false;
            }
        } else {
            _isOpen = false;
            return false;
        }
    }

    /**
     * Close Method
     * @return close status
     */

    public boolean close() {
        Boolean ret = false;
        if (_db.isOpen()) {
            try {
                _db.close();
                _isOpen = false;
                ret = true;
            } catch (Exception e) {
                Log.v(TAG, "Error Database close failed " + e.getMessage());
            } finally {
                return ret;
            }
        } else {
            return ret;
        }
    }

    /**
     * GetDBState Method
     * @return the detected state of the database
     */
    public UtilsSQLCipher.State getDBState() {
        return _uCipher.getDatabaseState(_file, _globVar);
    }

    /**
     * IsDBExists Method
     * @return the existence of the database on folder
     */
    public boolean isDBExists() {
        Log.v(TAG, "&&& _file.exists() " + _file.exists());

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
    public JSObject execute(String[] statements) {
        JSObject retObj = new JSObject();
        Integer changes = Integer.valueOf(-1);
        try {
            if (_db != null && _db.isOpen()) {
                Integer initChanges = _uSqlite.dbChanges(_db);
                Log.v(TAG, "Execute InitChanges " + initChanges);
                _db.beginTransaction();
                for (String cmd : statements) {
                    if (!cmd.endsWith(";")) cmd += ";";
                    Log.v(TAG, " cmd " + cmd);
                    _db.execSQL(cmd);
                }
                changes = _uSqlite.dbChanges(_db) - initChanges;
                Log.v(TAG, "Execute Changes " + changes);

                if (changes != -1) {
                    _db.setTransactionSuccessful();
                    retObj.put("changes", changes);
                }
            } else {
                throw new Exception("Database not opened");
            }
        } catch (Exception e) {
            retObj.put("changes", changes);
        } finally {
            if (_db != null && _db.inTransaction()) _db.endTransaction();
            return retObj;
        }
    }

    /**
     * ExecuteSet Method
     * Execute a Set of SQL Statements
     * @param set JSArray of statements
     * @return
     */
    public JSObject executeSet(JSArray set) {
        JSObject retObj = new JSObject();
        Long lastId = Long.valueOf(-1);
        Integer changes = Integer.valueOf(-1);
        try {
            if (_db != null && _db.isOpen()) {
                Integer initChanges = _uSqlite.dbChanges(_db);
                Log.v(TAG, "ExecuteSet InitChanges " + initChanges);
                _db.beginTransaction();
                for (int i = 0; i < set.length(); i++) {
                    JSONObject row = set.getJSONObject(i);
                    String statement = row.getString("statement");
                    JSONArray valuesJson = row.getJSONArray("values");
                    ArrayList<Object> values = new ArrayList<>();
                    for (int j = 0; j < valuesJson.length(); j++) {
                        values.add(valuesJson.get(j));
                    }
                    Boolean isArray = _uSqlite.parse(values.get(0));
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
                    _db.setTransactionSuccessful();
                    changes = _uSqlite.dbChanges(_db) - initChanges;
                    Log.v(TAG, "Execute Changes " + changes);
                    retObj.put("changes", changes);
                    retObj.put("lastId", lastId);
                } else {
                    throw new Exception("lastId equals -1");
                }
            } else {
                throw new Exception("Database not opened");
            }
        } catch (Exception e) {
            Log.v(TAG, "Error executeSet: " + e.getLocalizedMessage());
            retObj.put("changes", Integer.valueOf(-1));
            retObj.put("lastId", Long.valueOf(-1));
        } finally {
            if (_db != null && _db.inTransaction()) _db.endTransaction();
            return retObj;
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
    public JSObject runSQL(String statement, ArrayList<Object> values) {
        JSObject retObj = new JSObject();
        long lastId = Long.valueOf(-1);
        try {
            if (_db != null && _db.isOpen() && statement.length() > 0) {
                Integer initChanges = _uSqlite.dbChanges(_db);
                Log.v(TAG, "runSQL InitChanges " + initChanges);
                _db.beginTransaction();
                lastId = prepareSQL(statement, values);
                if (lastId != -1) _db.setTransactionSuccessful();
                Integer changes = _uSqlite.dbChanges(_db) - initChanges;
                Log.v(TAG, "runSQL Changes " + changes);
                retObj.put("changes", changes);
                retObj.put("lastId", lastId);
            } else {
                throw new Exception("Database not opened");
            }
        } catch (Exception e) {
            retObj.put("changes", Integer.valueOf(-1));
            retObj.put("message", "Error: runSQL failed: " + e.getLocalizedMessage());
        } finally {
            if (_db != null && _db.inTransaction()) _db.endTransaction();
            return retObj;
        }
    }

    /**
     * PrepareSQL Method
     * @param statement
     * @param values
     * @return
     */
    public long prepareSQL(String statement, ArrayList<Object> values) {
        String stmtType = statement.substring(0, 6).toUpperCase();

        SupportSQLiteStatement stmt = _db.compileStatement(statement);
        try {
            if (values != null && values.size() > 0) {
                SimpleSQLiteQuery.bind(stmt, values.toArray(new Object[0]));
            }
            if (stmtType.equals("INSERT")) {
                return stmt.executeInsert();
            } else {
                return Long.valueOf(stmt.executeUpdateDelete());
            }
        } finally {
            try {
                stmt.close();
            } catch (Exception e) {
                Log.v(TAG, "Exception attempting to close statement", e);
                return Long.valueOf(-1);
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
    public JSArray selectSQL(String statement, ArrayList<String> values) {
        JSArray retArray = new JSArray();
        Cursor c = null;
        if (_db == null) {
            return retArray;
        }
        try {
            c = (Cursor) _db.query(statement, values.toArray(new String[0]));
            while (c.moveToNext()) {
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
            }
        } catch (Exception e) {
            Log.v(TAG, "Error in selectSQL cursor " + e.getMessage());
        } finally {
            if (c != null) c.close();
            return retArray;
        }
    }

    /**
     * DeleteDB Method
     * Delete the database file
     * @param dbName
     * @return
     */
    public boolean deleteDB(String dbName) {
        // open the database
        boolean ret;
        if (_file.exists() && !_isOpen) {
            ret = open();
            if (!ret) return ret;
        }
        // close the db
        if (_isOpen) {
            ret = close();
            if (!ret) return ret;
        }

        // delete the database
        if (_file.exists()) {
            ret = _uFile.deleteDatabase(_context, dbName);
            if (ret) _isOpen = false;
            return ret;
        }
        return true;
    }

    /**
     * CreateSyncTable Method
     * create the synchronization table
     * @return
     */
    public JSObject createSyncTable() {
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
            retObj = execute(statements);
        } else {
            retObj.put("changes", Integer.valueOf(0));
        }
        return retObj;
    }

    /**
     * SetSyncDate Method
     * Set the synchronization date
     * @param syncDate
     * @return
     */
    public boolean setSyncDate(String syncDate) {
        boolean ret = false;
        JSObject retObj = new JSObject();
        try {
            SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSZ");
            Date date = formatter.parse(syncDate.replaceAll("Z$", "+0000"));
            long syncTime = date.getTime() / 1000L;
            String[] statements = { "UPDATE sync_table SET sync_date = " + syncTime + " WHERE id = 1;" };
            retObj = execute(statements);
            if (retObj.getInteger("changes") != Integer.valueOf(-1)) ret = true;
        } catch (Exception e) {
            Log.e(TAG, "Error: setSyncDate " + e.getMessage());
        } finally {
            return ret;
        }
    }

    public Long getSyncDate() {
        long syncDate = 0;
        try {
            syncDate = toJson.getSyncDate(this);
        } catch (Exception e) {
            Log.e(TAG, "Error: getSyncDate " + e.getMessage());
        } finally {
            return syncDate;
        }
    }

    /**
     * Import from Json object
     * @param jsonSQL
     * @return
     */
    public JSObject importFromJson(JsonSQLite jsonSQL) {
        Log.d(TAG, "importFromJson:  ");
        JSObject retObj = new JSObject();
        int changes = Integer.valueOf(-1);
        try {
            // create the database schema
            changes = fromJson.createDatabaseSchema(this, jsonSQL);
            if (changes != -1) {
                changes = fromJson.createDatabaseData(this, jsonSQL);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error: importFromJson " + e.getMessage());
        } finally {
            retObj.put("changes", changes);
            return retObj;
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
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error: exportToJson " + e.getMessage());
        } finally {
            return retObj;
        }
    }
}
