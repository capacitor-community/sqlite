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
import com.getcapacitor.community.database.sqlite.SQLite.UtilsSQLCipher;
import com.getcapacitor.community.database.sqlite.SQLite.UtilsSQLite;
import java.io.File;
import java.util.ArrayList;
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

    public Database(Context context, String dbName, Boolean encrypted, String mode, int version) {
        this._context = context;
        this._dbName = dbName;
        this._mode = mode;
        this._encrypted = encrypted;
        this._version = version;
        this._file = this._context.getDatabasePath(dbName);
        this._globVar = new GlobalSQLite();
        this._uSqlite = new UtilsSQLite();
        this._uCipher = new UtilsSQLCipher();
        InitializeSQLCipher();
        // added for successive runs
        //        this._file.mkdirs();
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
                    lastId = prepareSQL(statement, values);
                    if (lastId == -1) {
                        Log.v(TAG, "*** breaking lastId -1");
                        break;
                    }
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
        c = (Cursor) _db.query(statement, values.toArray(new String[0]));
        try {
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
            c.close();
        }
        return retArray;
    }
}
