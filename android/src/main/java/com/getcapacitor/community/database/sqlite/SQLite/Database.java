package com.getcapacitor.community.database.sqlite.SQLite;

import static android.database.Cursor.FIELD_TYPE_BLOB;
import static android.database.Cursor.FIELD_TYPE_FLOAT;
import static android.database.Cursor.FIELD_TYPE_INTEGER;
import static android.database.Cursor.FIELD_TYPE_NULL;
import static android.database.Cursor.FIELD_TYPE_STRING;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;
import androidx.sqlite.db.SimpleSQLiteQuery;
import androidx.sqlite.db.SupportSQLiteDatabase;
import androidx.sqlite.db.SupportSQLiteStatement;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.community.database.sqlite.SQLite.ImportExportJson.ExportToJson;
import com.getcapacitor.community.database.sqlite.SQLite.ImportExportJson.ImportFromJson;
import com.getcapacitor.community.database.sqlite.SQLite.ImportExportJson.JsonSQLite;
import com.getcapacitor.community.database.sqlite.SQLite.ImportExportJson.UtilsJson;
import java.io.File;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.Collections;
import java.util.Date;
import java.util.Dictionary;
import java.util.Hashtable;
import java.util.List;
import net.sqlcipher.Cursor;
import net.sqlcipher.database.SQLiteDatabase;
import net.sqlcipher.database.SQLiteException;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class Database {

    private static final String TAG = Database.class.getName();
    private Boolean _isOpen = false;
    private final String _dbName;
    private final Context _context;
    private final String _mode;
    private String _secret;
    private final Boolean _encrypted;
    private final Boolean _isEncryption;
    private final SharedPreferences _sharedPreferences;
    private final Boolean _readOnly;
    private final File _file;
    private final int _version;
    private final GlobalSQLite _globVar;
    private SupportSQLiteDatabase _db = null;
    private final UtilsSQLite _uSqlite;
    private final UtilsSQLCipher _uCipher;
    private final UtilsFile _uFile;
    private final UtilsJson _uJson;
    private final UtilsUpgrade _uUpg;
    private final UtilsDrop _uDrop;
    private final UtilsSecret _uSecret;
    private Dictionary<Integer, JSONObject> _vUpgObject = new Hashtable<>();
    private final ImportFromJson fromJson = new ImportFromJson();
    private final ExportToJson toJson = new ExportToJson();
    private Boolean ncDB = false;

    public Database(
        Context context,
        String dbName,
        Boolean encrypted,
        String mode,
        int version,
        Boolean isEncryption,
        Dictionary<Integer, JSONObject> vUpgObject,
        SharedPreferences sharedPreferences,
        Boolean readonly
    ) {
        this._context = context;
        this._dbName = dbName;
        this._mode = mode;
        this._encrypted = encrypted;
        this._isEncryption = isEncryption;
        this._version = version;
        this._vUpgObject = vUpgObject;
        this._sharedPreferences = sharedPreferences;
        this._readOnly = readonly;
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
        this._uDrop = new UtilsDrop();
        this._uSecret = isEncryption ? new UtilsSecret(context, sharedPreferences) : null;
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
     *
     * @return database status
     */
    public Boolean isOpen() {
        return _isOpen;
    }

    /**
     * isNCDB Method
     *
     * @return non-conformed database status
     */
    public Boolean isNCDB() {
        return ncDB;
    }

    /**
     * GetUrl method
     *
     * @return database url
     */
    public String getUrl() {
        String url = "file://";
        return url + this._file.getAbsolutePath();
    }

    /**
     * Open method
     *
     * @return open status
     */
    public void open() throws Exception {
        int curVersion;

        String password = "";
        if (_encrypted && (_mode.equals("secret") || _mode.equals("encryption"))) {
            if (!_uSecret.isPassphrase()) {
                throw new Exception("No Passphrase stored");
            }
            password = _uSecret.getPassphrase();
        }
        if (_mode.equals("encryption")) {
            if (_isEncryption) {
                try {
                    _uCipher.encrypt(_context, _file, SQLiteDatabase.getBytes(password.toCharArray()));
                } catch (Exception e) {
                    String msg = "Failed in encryption " + e.getMessage();
                    Log.v(TAG, msg);
                    throw new Exception(msg);
                }
            } else {
                throw new Exception("No Encryption set in capacitor.config");
            }
        }
        try {
            if (!isNCDB() && !this._readOnly) {
                _db = SQLiteDatabase.openOrCreateDatabase(_file, password, null);
            } else {
                _db = SQLiteDatabase.openDatabase(String.valueOf(_file), password, null, SQLiteDatabase.OPEN_READONLY);
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
                    if (isNCDB() || this._readOnly) {
                        _isOpen = true;
                        return;
                    }
                    try {
                        curVersion = _db.getVersion(); // default 0
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
                    if (_version > curVersion && _vUpgObject != null && _vUpgObject.size() > 0) {
                        //                           if (_vUpgObject != null && _vUpgObject.size() > 0) {
                        try {
                            this._uFile.copyFile(_context, _dbName, "backup-" + _dbName);

                            _uUpg.onUpgrade(this, _vUpgObject, curVersion, _version);

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
                    }
                    _isOpen = true;
                    return;
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
     *
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
     * IsDBExists Method
     *
     * @return the existence of the database on folder
     */
    public boolean isDBExists() {
        return _file.exists();
    }

    /**
     * Execute Method
     * Execute an Array of SQL Statements
     *
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
                    String nCmd = cmd;
                    String trimCmd = nCmd.trim().substring(0, Math.min(nCmd.trim().length(), 11)).toUpperCase();
                    if (trimCmd.equals("DELETE FROM") && nCmd.toLowerCase().contains("WHERE".toLowerCase())) {
                        String whereStmt = nCmd.trim();
                        nCmd = deleteSQL(this, whereStmt, new ArrayList<Object>());
                    }
                    _db.execSQL(nCmd);
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
     *
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
                            lastId = prepareSQL(statement, vals, false);
                            if (lastId == -1) break;
                        }
                    } else {
                        lastId = prepareSQL(statement, values, false);
                    }
                    if (lastId == -1) break;
                }
                changes = _uSqlite.dbChanges(_db) - initChanges;
                if (changes >= 0) {
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
     *
     * @return
     */
    public boolean inTransaction() {
        return _db.inTransaction();
    }

    /**
     * RunSQL Method
     *
     * @param statement a raw SQL statement
     * @param values    Array of Strings to bind to the statement
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
                lastId = prepareSQL(statement, values, false);
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
     *
     * @param statement
     * @param values
     * @return
     */
    public long prepareSQL(String statement, ArrayList<Object> values, Boolean fromJson) throws Exception {
        String stmtType = statement.replaceAll("\n", "").trim().substring(0, 6).toUpperCase();
        SupportSQLiteStatement stmt = null;
        String sqlStmt = statement;
        try {
            if (!fromJson && stmtType.equals("DELETE")) {
                sqlStmt = deleteSQL(this, statement, values);
            }
            stmt = _db.compileStatement(sqlStmt);
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
                stmt.executeInsert();
            } else {
                stmt.executeUpdateDelete();
            }
            return _uSqlite.dbLastId(_db);
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
     * DeleteSQL method
     *
     * @param mDB
     * @param statement
     * @param values
     * @return
     * @throws Exception
     */
    public String deleteSQL(Database mDB, String statement, ArrayList<Object> values) throws Exception {
        String sqlStmt = statement;
        try {
            Boolean isLast = _uJson.isLastModified(mDB);
            Boolean isDel = _uJson.isSqlDeleted(mDB);
            if (isLast && isDel) {
                // Replace DELETE by UPDATE and set sql_deleted to 1
                Integer wIdx = statement.toUpperCase().indexOf("WHERE");
                String preStmt = statement.substring(0, wIdx - 1);
                String clauseStmt = statement.substring(wIdx);
                String tableName = preStmt.substring(("DELETE FROM").length()).trim();
                sqlStmt = "UPDATE " + tableName + " SET sql_deleted = 1 " + clauseStmt;
                // Find REFERENCES if any and update the sql_deleted column
                findReferencesAndUpdate(mDB, tableName, clauseStmt, values);
            }
            return sqlStmt;
        } catch (Exception e) {
            throw new Exception(e.getMessage());
        }
    }

    /**
     * FindReferencesAndUpdate method
     *
     * @param mDB
     * @param tableName
     * @param whereStmt
     * @param values
     * @throws Exception
     */
    public void findReferencesAndUpdate(Database mDB, String tableName, String whereStmt, ArrayList<Object> values) throws Exception {
        try {
            ArrayList<String> references = getReferences(mDB, tableName);
            if (references.size() == 0) {
                return;
            }
            String tableNameWithRefs = references.get(references.size() - 1);
            references.remove(references.size() - 1);
            for (String refe : references) {
                // get the tableName of the reference
                String refTable = getReferenceTableName(refe);
                if (refTable.length() <= 0) {
                    continue;
                }
                // get the withRefsNames
                String[] withRefsNames = getWithRefsColumnName(refe);
                if (withRefsNames.length <= 0) {
                    continue;
                }
                // get the columnNames
                String[] colNames = getReferencedColumnName(refe);
                if (colNames.length <= 0) {
                    continue;
                }
                // update the where clause
                String uWhereStmt = updateWhere(whereStmt, withRefsNames, colNames);

                if (uWhereStmt.length() <= 0) {
                    continue;
                }
                String updTableName = tableNameWithRefs;
                String[] updColNames = colNames;
                if (tableNameWithRefs.equals(tableName)) {
                    updTableName = refTable;
                    updColNames = withRefsNames;
                }
                //update sql_deleted for this reference
                String stmt = "UPDATE " + updTableName + " SET sql_deleted = 1 " + uWhereStmt;
                ArrayList<Object> selValues = new ArrayList<Object>();
                if (values != null && values.size() > 0) {
                    String[] arrVal = whereStmt.split("\\?");
                    if (arrVal[arrVal.length - 1].equals(";")) {
                        Arrays.copyOf(arrVal, arrVal.length - 1);
                    }
                    for (int j = 0; j < arrVal.length; j++) {
                        for (String updVal : updColNames) {
                            int idxVal = arrVal[j].indexOf(updVal);
                            if (idxVal > -1) {
                                selValues.add(values.get(j));
                            }
                        }
                    }
                }

                long lastId = prepareSQL(stmt, selValues, false);
                if (lastId == -1) {
                    String msg = "UPDATE sql_deleted failed for references " + "table: " + refTable + ";";
                    throw new Exception(msg);
                }
            }
            return;
        } catch (JSONException e) {
            throw new Exception(e.getMessage());
        } catch (Exception e) {
            throw new Exception(e.getMessage());
        }
    }

    /**
     * GetReferenceTableName method
     *
     * @param refValue
     * @return
     */
    public String getReferenceTableName(String refValue) {
        String tableName = "";
        if (refValue.length() > 0) {
            String[] arr = refValue.split("(?i)REFERENCES", -1);
            if (arr.length == 2) {
                int oPar = arr[1].indexOf("(");

                tableName = arr[1].substring(0, oPar).trim();
            }
        }
        return tableName;
    }

    /**
     * GetWithRefsColumnName
     *
     * @param refValue
     * @return
     */
    public String[] getWithRefsColumnName(String refValue) {
        String[] colNames = new String[0];
        if (refValue.length() > 0) {
            String[] arr = refValue.split("(?i)REFERENCES", -1);
            if (arr.length == 2) {
                int oPar = arr[0].indexOf("(");
                int cPar = arr[0].indexOf(")");
                String colStr = arr[0].substring(oPar + 1, cPar).trim();
                colNames = colStr.split(",");
            }
        }
        return colNames;
    }

    /**
     * GetReferencedColumnName method
     *
     * @param refValue
     * @return
     */
    public String[] getReferencedColumnName(String refValue) {
        String[] colNames = new String[0];
        if (refValue.length() > 0) {
            String[] arr = refValue.split("(?i)REFERENCES", -1);
            if (arr.length == 2) {
                int oPar = arr[1].indexOf("(");
                int cPar = arr[1].indexOf(")");
                String colStr = arr[1].substring(oPar + 1, cPar).trim();
                colNames = colStr.split(",");
            }
        }
        return colNames;
    }

    /**
     * UpdateWhere method
     *
     * @param whStmt
     * @param withRefsNames
     * @param colNames
     * @return
     */
    public String updateWhere(String whStmt, String[] withRefsNames, String[] colNames) {
        String whereStmt = "";
        if (whStmt.length() > 0) {
            Integer index = whStmt.toLowerCase().indexOf("WHERE".toLowerCase());
            String stmt = whStmt.substring(index + 6);
            if (withRefsNames.length == colNames.length) {
                for (int i = 0; i < withRefsNames.length; i++) {
                    String colType = "withRefsNames";
                    int idx = stmt.indexOf(withRefsNames[i]);
                    if (idx == -1) {
                        idx = stmt.indexOf(colNames[i]);
                        colType = "colNames";
                    }
                    if (idx > -1) {
                        String valStr = "";
                        int fEqual = stmt.indexOf("=", idx);
                        if (fEqual > -1) {
                            int iAnd = stmt.indexOf("AND", fEqual);
                            int ilAnd = stmt.indexOf("and", fEqual);
                            if (iAnd > -1) {
                                valStr = (stmt.substring(fEqual + 1, iAnd - 1)).trim();
                            } else if (ilAnd > -1) {
                                valStr = (stmt.substring(fEqual + 1, ilAnd - 1)).trim();
                            } else {
                                valStr = (stmt.substring(fEqual + 1)).trim();
                            }
                            if (i > 0) {
                                whereStmt += " AND ";
                            }
                            if (colType.equals("withRefsNames")) {
                                whereStmt += colNames[i] + " = " + valStr;
                            } else {
                                whereStmt += withRefsNames[i] + " = " + valStr;
                            }
                        }
                    }
                }
                whereStmt = "WHERE " + whereStmt;
            }
        }
        return whereStmt;
    }

    /**
     * GetReferences method
     *
     * @param mDB
     * @param tableName
     * @return
     * @throws Exception
     */
    public ArrayList<String> getReferences(Database mDB, String tableName) throws Exception {
        String sqlStmt =
            "SELECT sql FROM sqlite_master " +
            "WHERE sql LIKE('%FOREIGN KEY%') AND sql LIKE('%REFERENCES%') AND " +
            "sql LIKE('%" +
            tableName +
            "%') AND sql LIKE('%ON DELETE%');";

        try {
            JSArray references = mDB.selectSQL(sqlStmt, new ArrayList<Object>());
            ArrayList<String> retRefs = new ArrayList<String>();
            if (references.length() > 0) {
                retRefs = getRefs(references.getJSONObject(0).getString("sql"));
            }
            return retRefs;
        } catch (Exception e) {
            throw new Exception(e.getMessage());
        }
    }

    /**
     * GetRefs
     *
     * @param str
     * @return
     * @throws Exception
     */
    private ArrayList<String> getRefs(String str) throws Exception {
        ArrayList<String> retRefs = new ArrayList<String>();
        String[] arrFor = str.split("(?i)FOREIGN KEY", -1);
        // Loop through Foreign Keys
        for (int i = 1; i < arrFor.length; i++) {
            retRefs.add((arrFor[i].split("(?i)ON DELETE", -1))[0].trim());
        }
        // find table name with references
        if (str.substring(0, 12).toLowerCase().equals("CREATE TABLE".toLowerCase())) {
            int oPar = str.indexOf("(");
            String tableName = str.substring(13, oPar).trim();
            retRefs.add(tableName);
        }

        return retRefs;
    }

    /**
     * SelectSQL Method
     * Query a raw sql statement with or without binding values
     *
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
                    int index = c.getColumnIndex(colName);
                    int type = c.getType(i);
                    switch (type) {
                        case FIELD_TYPE_STRING:
                            row.put(colName, c.getString(index));
                            break;
                        case FIELD_TYPE_INTEGER:
                            row.put(colName, c.getLong(index));
                            break;
                        case FIELD_TYPE_FLOAT:
                            row.put(colName, c.getDouble(index));
                            break;
                        case FIELD_TYPE_BLOB:
                            byte[] blobVal = c.getBlob(index);
                            JSArray arr = this._uSqlite.ByteArrayToJSArray(blobVal);
                            row.put(colName, arr);
                            /*                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                                row.put(colName, Base64.getEncoder().encodeToString(c.getBlob(index)));
                            } else {
                                row.put(colName, JSONObject.NULL);
                            }
*/
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
     * GetTableNames Method
     * Returned a JSArray of table's name
     *
     * @return
     * @throws Exception
     */
    public JSArray getTableNames() throws Exception {
        JSArray retArray = new JSArray();
        try {
            List<String> tableList = this._uDrop.getTablesNames(this);
            for (int i = 0; i < tableList.size(); i++) {
                retArray.put(tableList.get(i));
            }
            return retArray;
        } catch (Exception e) {
            throw new Exception("in getTableNames " + e.getMessage());
        }
    }

    /**
     * DeleteDB Method
     * Delete the database file
     *
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
     *
     * @return
     */
    public JSObject createSyncTable() throws Exception {
        // Open the database for writing
        JSObject retObj = new JSObject();
        // check if the table has already been created
        boolean isExists = _uJson.isTableExists(this, "sync_table");
        if (!isExists) {
            boolean isLastModified = _uJson.isLastModified(this);
            boolean isSqlDeleted = _uJson.isSqlDeleted(this);
            if (isLastModified && isSqlDeleted) {
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
                throw new Exception("No last_modified/sql_deleted columns in tables");
            }
        } else {
            retObj.put("changes", Integer.valueOf(0));
            return retObj;
        }
    }

    /**
     * GetSyncDate method
     * get the synchronization date
     *
     * @return
     * @throws Exception
     */
    public Long getSyncDate() throws Exception {
        long syncDate = 0;
        try {
            boolean isSyncTable = _uJson.isTableExists(this, "sync_table");
            if (!isSyncTable) {
                throw new Exception("No sync_table available");
            }
            syncDate = toJson.getSyncDate(this);
            return syncDate;
        } catch (Exception e) {
            throw new Exception(e.getMessage());
        }
    }

    /**
     * SetSyncDate Method
     * Set the synchronization date
     *
     * @param syncDate
     * @return
     */
    public void setSyncDate(String syncDate) throws Exception {
        JSObject retObj = new JSObject();
        try {
            boolean isSyncTable = _uJson.isTableExists(this, "sync_table");
            if (!isSyncTable) {
                throw new Exception("No sync_table available");
            }
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

    /**
     * Import from Json object
     *
     * @param jsonSQL
     * @return
     */
    public JSObject importFromJson(JsonSQLite jsonSQL) throws Exception {
        JSObject retObj = new JSObject();
        int changes = Integer.valueOf(0);
        try {
            // set Foreign Keys OFF
            _db.setForeignKeyConstraintsEnabled(false);

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
            // set Foreign Keys ON
            _db.setForeignKeyConstraintsEnabled(true);

            retObj.put("changes", changes);
            return retObj;
        } catch (Exception e) {
            throw new Exception(e.getMessage());
        }
    }

    /**
     * Export to JSON Object
     *
     * @param mode
     * @return
     */
    public JSObject exportToJson(String mode) throws Exception {
        JsonSQLite inJson = new JsonSQLite();
        JSObject retObj = new JSObject();
        inJson.setDatabase(_dbName.substring(0, _dbName.length() - 9));
        inJson.setVersion(_version);
        inJson.setEncrypted(_encrypted);
        inJson.setMode(mode);
        try {
            boolean isSyncTable = _uJson.isTableExists(this, "sync_table");
            if (isSyncTable) {
                // set the last export date
                Date date = new Date();
                long syncTime = date.getTime() / 1000L;
                toJson.setLastExportDate(this, syncTime);
            }
            // launch the export process
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
            return retObj;
        } catch (Exception e) {
            Log.e(TAG, "Error: exportToJson " + e.getMessage());
            throw new Exception(e.getMessage());
        } finally {}
    }

    /**
     * Delete exported rows
     *
     * @throws Exception
     */
    public void deleteExportedRows() throws Exception {
        try {
            toJson.delExportedRows(this);
            return;
        } catch (Exception e) {
            Log.e(TAG, "Error: exportToJson " + e.getMessage());
            throw new Exception(e.getMessage());
        }
    }
}
