package com.getcapacitor.community.database.sqlite.SQLite;

import static android.database.Cursor.FIELD_TYPE_BLOB;
import static android.database.Cursor.FIELD_TYPE_FLOAT;
import static android.database.Cursor.FIELD_TYPE_INTEGER;
import static android.database.Cursor.FIELD_TYPE_NULL;
import static android.database.Cursor.FIELD_TYPE_STRING;
import static com.getcapacitor.community.database.sqlite.SQLite.UtilsDelete.findReferencesAndUpdate;
import static com.getcapacitor.community.database.sqlite.SQLite.UtilsSQLStatement.extractColumnNames;
import static com.getcapacitor.community.database.sqlite.SQLite.UtilsSQLStatement.extractTableName;
import static com.getcapacitor.community.database.sqlite.SQLite.UtilsSQLStatement.extractWhereClause;

import android.content.Context;
import android.content.SharedPreferences;
import android.database.DatabaseUtils;
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
import com.getcapacitor.community.database.sqlite.SQLite.ImportExportJson.UtilsEncryption;
import com.getcapacitor.community.database.sqlite.SQLite.ImportExportJson.UtilsJson;
import java.io.File;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.Dictionary;
import java.util.List;
import java.util.Objects;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import net.zetetic.database.sqlcipher.SQLiteCursor;
import net.zetetic.database.sqlcipher.SQLiteDatabase;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class Database {

    private static final String TAG = Database.class.getName();
    private Boolean _isOpen = false;
    private final String _dbName;
    private final Context _context;
    private final String _mode;
    private final Boolean _encrypted;
    private final Boolean _isEncryption;
    private final Boolean _readOnly;
    private final File _file;
    private final int _version;
    private SupportSQLiteDatabase _db = null;
    private final UtilsSQLite _uSqlite;
    private final UtilsSQLCipher _uCipher;
    private final UtilsFile _uFile;
    private final UtilsJson _uJson;
    private final UtilsUpgrade _uUpg;
    private final UtilsDrop _uDrop;
    private final UtilsSecret _uSecret;
    private final Dictionary<Integer, JSONObject> _vUpgObject;
    private final ImportFromJson fromJson = new ImportFromJson();
    private final ExportToJson toJson = new ExportToJson();
    private Boolean ncDB = false;
    private boolean isAvailableTransaction = false;

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
        this._readOnly = readonly;
        if (dbName.contains("/") && dbName.endsWith("SQLite.db")) {
            this.ncDB = true;
            this._file = new File(dbName);
        } else {
            this._file = this._context.getDatabasePath(dbName);
        }
        this._uSqlite = new UtilsSQLite();
        this._uCipher = new UtilsSQLCipher();
        this._uFile = new UtilsFile();
        this._uJson = new UtilsJson();
        this._uUpg = new UtilsUpgrade();
        this._uDrop = new UtilsDrop();
        this._uSecret = isEncryption ? new UtilsSecret(context, sharedPreferences) : null;
        InitializeSQLCipher();
        if (!Objects.requireNonNull(this._file.getParentFile()).exists()) {
            boolean dirCreated = this._file.getParentFile().mkdirs();
            if (!dirCreated) {
                System.out.println("Failed to create parent directories.");
            }
        }
        Log.v(TAG, "&&& file path " + this._file.getAbsolutePath());
    }

    /**
     * InitializeSQLCipher Method
     * Initialize the SQLCipher Libraries
     */
    private void InitializeSQLCipher() {
        System.loadLibrary("sqlcipher");
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
     * IsAvailTrans method
     *
     * @return database transaction is active
     */
    public boolean isAvailTrans() {
        return _db.inTransaction();
    }

    /**
     * BeginTransaction method
     *
     * @return begin a database transaction
     */
    public Integer beginTransaction() throws Exception {
        if (_db.isOpen()) {
            try {
                if (isAvailTrans()) {
                    throw new Exception("Already in transaction");
                }
                _db.beginTransaction();
                return 0;
            } catch (Exception e) {
                String msg = "Failed in beginTransaction" + e.getMessage();
                Log.v(TAG, msg);
                throw new Exception(msg);
            }
        } else {
            throw new Exception("Database not opened");
        }
    }

    /**
     * CommitTransaction method
     *
     * @return commit a database transaction
     */
    public Integer commitTransaction() throws Exception {
        if (_db.isOpen()) {
            try {
                if (!isAvailTrans()) {
                    throw new Exception("No transaction active");
                }
                _db.setTransactionSuccessful();
                return 0;
            } catch (Exception e) {
                String msg = "Failed in commitTransaction" + e.getMessage();
                Log.v(TAG, msg);
                throw new Exception(msg);
            } finally {
                _db.endTransaction();
            }
        } else {
            throw new Exception("Database not opened");
        }
    }

    /**
     * Rollback Transaction method
     *
     * @return rollback a database transaction
     */
    public Integer rollbackTransaction() throws Exception {
        if (_db.isOpen()) {
            try {
                if (isAvailTrans()) {
                    _db.endTransaction();
                }
                return 0;
            } catch (Exception e) {
                String msg = "Failed in rollbackTransaction" + e.getMessage();
                Log.v(TAG, msg);
                throw new Exception(msg);
            }
        } else {
            throw new Exception("Database not opened");
        }
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
        if (_encrypted && (_mode.equals("secret") || _mode.equals("encryption") || _mode.equals("decryption"))) {
            if (!_uSecret.isPassphrase()) {
                throw new Exception("No Passphrase stored");
            }
            password = _uSecret.getPassphrase();
        }
        if (_mode.equals("encryption")) {
            if (_isEncryption) {
                try {
                    _uCipher.encrypt(_context, _file, password.getBytes(StandardCharsets.UTF_8));
                } catch (Exception e) {
                    String msg = "Failed in encryption " + e.getMessage();
                    Log.v(TAG, msg);
                    throw new Exception(msg);
                }
            } else {
                throw new Exception("No Encryption set in capacitor.config");
            }
        }
        if (_mode.equals("decryption")) {
            if (_isEncryption) {
                try {
                    _uCipher.decrypt(_context, _file, password.getBytes());
                    password = "";
                } catch (Exception e) {
                    String msg = "Failed in decryption " + e.getMessage();
                    Log.v(TAG, msg);
                    throw new Exception(msg);
                }
            } else {
                throw new Exception("No Encryption set in capacitor.config");
            }
        }
        try {
            if (!isNCDB() && !this._readOnly) {
                _db = SQLiteDatabase.openOrCreateDatabase(_file, password, null, null);
            } else {
                _db = SQLiteDatabase.openDatabase(String.valueOf(_file), password, null, SQLiteDatabase.OPEN_READONLY, null);
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
                if (transaction) beginTransaction();
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
                    if (transaction) commitTransaction();
                    retObj.put("changes", changes);
                }
                return retObj;
            } else {
                throw new Exception("Database not opened");
            }
        } catch (Exception e) {
            throw new Exception(e.getMessage());
        } finally {
            if (_db != null && transaction && _db.inTransaction()) rollbackTransaction();
        }
    }

    /**
     * ExecuteSet Method
     * Execute a Set of SQL Statements
     *
     * @param set JSArray of statements
     * @return
     */
    public JSObject executeSet(JSArray set, Boolean transaction, String returnMode) throws Exception {
        JSObject retObj = new JSObject();
        Long lastId = (long) -1;
        Integer changes = -1;
        JSObject response = new JSObject();
        try {
            if (_db != null && _db.isOpen()) {
                int initChanges = _uSqlite.dbChanges(_db);
                if (transaction) beginTransaction();
                for (int i = 0; i < set.length(); i++) {
                    JSONObject row = set.getJSONObject(i);
                    JSObject respSet = new JSObject();
                    String statement = row.getString("statement");
                    JSONArray valuesJson = row.getJSONArray("values");
                    // optimize executeSet
                    Boolean isArray = valuesJson.length() > 0 ? _uSqlite.parse(valuesJson.get(0)) : false;
                    if (isArray) {
                        respSet = multipleRowsStatement(statement, valuesJson, returnMode);
                    } else {
                        respSet = oneRowStatement(statement, valuesJson, returnMode);
                    }
                    lastId = respSet.getLong("lastId");
                    if (lastId.equals(-1L)) break;
                    response = addToResponse(response, respSet);
                }
                if (lastId.equals(-1L)) {
                    throw new Exception("lastId equals -1");
                } else {
                    if (transaction) commitTransaction();
                    changes = _uSqlite.dbChanges(_db) - initChanges;
                    retObj.put("changes", changes);
                    retObj.put("lastId", lastId);
                    retObj.put("values", response.getJSONArray("values"));
                    return retObj;
                }
            } else {
                throw new Exception("Database not opened");
            }
        } catch (Exception e) {
            throw new Exception(e.getMessage());
        } finally {
            if (_db != null && transaction && _db.inTransaction()) rollbackTransaction();
        }
    }

    public JSObject multipleRowsStatement(String statement, JSONArray valuesJson, String returnMode) throws Exception {
        StringBuilder sqlBuilder = new StringBuilder();
        try {
            for (int j = 0; j < valuesJson.length(); j++) {
                JSONArray innerArray = valuesJson.getJSONArray(j);
                StringBuilder innerSqlBuilder = new StringBuilder();
                for (int k = 0; k < innerArray.length(); k++) {
                    Object innerElement = innerArray.get(k);
                    String elementValue = "";

                    if (innerElement instanceof String) {
                        elementValue = DatabaseUtils.sqlEscapeString((String) innerElement);
                    } else {
                        elementValue = String.valueOf(innerElement);
                    }
                    innerSqlBuilder.append(elementValue);

                    if (k < innerArray.length() - 1) {
                        innerSqlBuilder.append(",");
                    }
                }

                sqlBuilder.append("(").append(innerSqlBuilder.toString()).append(")");

                if (j < valuesJson.length() - 1) {
                    sqlBuilder.append(",");
                }
            }
            String finalSql = replacePlaceholders(statement, sqlBuilder.toString());

            JSObject respSet = prepareSQL(finalSql, new ArrayList<>(), false, returnMode);
            return respSet;
        } catch (Exception e) {
            throw new Exception(e.getMessage());
        }
    }

    public String replacePlaceholders(String stmt, String sqlBuilder) {
        // Extract question mark placeholders from the input statement
        String extractedValues = extractQuestionMarkValues(stmt);

        // Check if any placeholders were found
        if (extractedValues == null) {
            return stmt; // Return the original statement if no placeholders are found
        }
        // Regex to match the VALUES clause with varying number of placeholders
        String regex = "(?i)VALUES\\s*\\((\\s*\\?\\s*(?:,\\s*\\?\\s*)*)\\)";

        // Create a pattern and matcher
        Pattern pattern = Pattern.compile(regex);
        Matcher matcher = pattern.matcher(stmt);

        // Check if the pattern matches and perform the replacement
        if (matcher.find()) {
            // Perform the replacement without causing an IndexOutOfBoundsException
            String formattedStmt = matcher.replaceAll("VALUES " + Matcher.quoteReplacement(sqlBuilder));
            return formattedStmt;
        } else {
            throw new IllegalArgumentException("The statement does not contain a valid VALUES clause with placeholders.");
        }
    }

    public String extractQuestionMarkValues(String input) {
        Pattern pattern = Pattern.compile("(?i)VALUES \\((\\?(?:,\\s*\\?\\s*)*)\\)");
        Matcher matcher = pattern.matcher(input);

        if (matcher.find()) {
            String extractedSubstring = matcher.group(1);
            return "(" + extractedSubstring.replaceAll("\\s*,\\s*", ",") + ")";
        } else {
            return null;
        }
    }

    public JSObject oneRowStatement(String statement, JSONArray valuesJson, String returnMode) throws Exception {
        ArrayList<Object> values = new ArrayList<>();
        for (int j = 0; j < valuesJson.length(); j++) {
            values.add(valuesJson.get(j));
        }
        try {
            JSObject respSet = prepareSQL(statement, values, false, returnMode);
            return respSet;
        } catch (Exception e) {
            throw new Exception(e.getMessage());
        }
    }

    public JSObject addToResponse(JSObject response, JSObject respSet) throws JSONException {
        JSObject retResp = response;
        long lastId = respSet.getLong("lastId");
        JSONArray respVals = respSet.getJSONArray("values");
        if (retResp.keys().hasNext()) {
            JSONArray retVals = respSet.getJSONArray("values");
            respVals = response.getJSONArray("values");
            mergeJSONArrays(respVals, retVals);
        }
        retResp.put("lastId", lastId);
        retResp.put("values", respVals);
        return retResp;
    }

    public static void mergeJSONArrays(JSONArray target, JSONArray source) throws JSONException {
        for (int i = 0; i < source.length(); i++) {
            Object element = source.get(i);
            target.put(element);
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
    public JSObject runSQL(String statement, ArrayList<Object> values, Boolean transaction, String returnMode) throws Exception {
        JSObject retObj = new JSObject();
        long lastId = (long) -1;
        int changes = -1;
        try {
            if (_db != null && _db.isOpen() && statement.length() > 0) {
                int initChanges = _uSqlite.dbChanges(_db);
                if (transaction) beginTransaction();
                JSObject response = prepareSQL(statement, values, false, returnMode);
                lastId = response.getLong("lastId");
                if (lastId != -1 && transaction) commitTransaction();
                changes = _uSqlite.dbChanges(_db) - initChanges;
                retObj.put("changes", changes);
                retObj.put("lastId", lastId);
                retObj.put("values", response.getJSONArray("values"));
                return retObj;
            } else {
                throw new Exception("Database not opened");
            }
        } catch (Exception e) {
            throw new Exception(e.getMessage());
        } finally {
            if (_db != null && transaction && _db.inTransaction()) rollbackTransaction();
        }
    }

    /**
     * PrepareSQL Method
     *
     * @param statement SQL statement
     * @param values SQL Values if any
     * @param fromJson is the statement from importFromJson
     * @param returnMode return mode to handle RETURNING
     * @return JSObject
     * @throws Exception message
     */
    public JSObject prepareSQL(String statement, ArrayList<Object> values, Boolean fromJson, String returnMode) throws Exception {
        String stmtType = statement.trim().split("\\s+")[0].toUpperCase();
        SupportSQLiteStatement stmt = null;
        String sqlStmt = statement;
        String retMode;
        JSArray retValues = new JSArray();
        JSObject retObject = new JSObject();
        String colNames = "";
        long initLastId = (long) -1;
        /*        if (Build.VERSION.SDK_INT > Build.VERSION_CODES.TIRAMISU) {
          retMode = returnMode;
          throw new Exception(retMode +"Not implemented for above TIRAMISU");
        } else {

 */
        retMode = returnMode;
        if (!retMode.equals("no")) {
            retMode = "wA" + retMode;
        }
        //       }
        if (retMode.equals("no") || retMode.substring(0, Math.min(retMode.length(), 2)).equals("wA")) {
            // get the statement and the returning column names
            try {
                JSObject stmtObj = getStmtAndRetColNames(sqlStmt, retMode);
                sqlStmt = stmtObj.getString("stmt", sqlStmt);
                colNames = stmtObj.getString("names", "");
            } catch (JSONException e) {
                throw new Exception(e.getMessage());
            }
        }
        try {
            if (!fromJson && stmtType.equals("DELETE")) {
                sqlStmt = deleteSQL(this, sqlStmt, values);
            }
            if (sqlStmt != null) {
                stmt = _db.compileStatement(sqlStmt);
            } else {
                throw new Exception("sqlStmt is null");
            }
            if (values != null && values.size() > 0) {
                //               retMode = "no";
                Object[] valObj = new Object[values.size()];
                for (int i = 0; i < values.size(); i++) {
                    if (values.get(i) == null) {
                        valObj[i] = null;
                    } else if (JSONObject.NULL == values.get(i)) {
                        valObj[i] = null;
                    } else {
                        valObj[i] = values.get(i);
                    }
                }
                SimpleSQLiteQuery.bind(stmt, valObj);
            }
            initLastId = _uSqlite.dbLastId(_db);
            if (stmtType.equals("INSERT")) {
                stmt.executeInsert();
            } else {
                if (retMode.startsWith("wA") && colNames.length() > 0 && stmtType.equals("DELETE")) {
                    retValues = getUpdDelReturnedValues(this, sqlStmt, colNames);
                }
                stmt.executeUpdateDelete();
            }
            Long lastId = _uSqlite.dbLastId(_db);
            if (retMode.startsWith("wA") && colNames.length() > 0) {
                if (stmtType.equals("INSERT")) {
                    String tableName = extractTableName(sqlStmt);
                    if (tableName != null) {
                        retValues = getInsertReturnedValues(this, colNames, tableName, initLastId, lastId, retMode);
                    }
                } else if (stmtType.equals("UPDATE")) {
                    retValues = getUpdDelReturnedValues(this, sqlStmt, colNames);
                }
            }
            /*
          if (Build.VERSION.SDK_INT > Build.VERSION_CODES.TIRAMISU) {

            if (retMode.startsWith("one") || retMode.startsWith("all")) {
              throw new Exception("returnMode : " + retMode + "Not implemented for above TIRAMISU");
            }
          }
           */
            retObject.put("lastId", lastId);
            retObject.put("values", retValues);
            return retObject;
        } catch (Exception e) {
            throw new Exception(e.getMessage());
        } finally {
            if (stmt != null) {
                stmt.close();
            }
        }
    }

    private JSObject getStmtAndRetColNames(String sqlStmt, String retMode) throws JSONException {
        JSObject retObj = new JSObject();
        JSObject retIsReturning = isReturning(sqlStmt);
        Boolean isReturning = retIsReturning.getBoolean("isReturning");
        String stmt = retIsReturning.getString("stmt");
        String suffix = retIsReturning.getString("names");
        retObj.put("stmt", stmt);
        retObj.put("names", "");

        if (isReturning && retMode.startsWith("wA")) {
            String lowercaseSuffix = suffix != null ? suffix.toLowerCase() : "";
            int returningIndex = lowercaseSuffix.indexOf("returning");
            if (returningIndex != -1) {
                String substring = suffix.substring(returningIndex + "returning".length());
                String names = substring.trim();
                retObj.put("names", getNames(names));
            }
        }
        return retObj;
    }

    private String getNames(String input) {
        int indexSemicolon = input.indexOf(";");
        int indexDoubleDash = input.indexOf("--");
        int indexCommentStart = input.indexOf("/*");

        // Find the minimum index among them
        int minIndex = input.length();
        if (indexSemicolon != -1) {
            minIndex = Math.min(minIndex, indexSemicolon);
        }
        if (indexDoubleDash != -1) {
            minIndex = Math.min(minIndex, indexDoubleDash);
        }
        if (indexCommentStart != -1) {
            minIndex = Math.min(minIndex, indexCommentStart);
        }
        return input.substring(0, minIndex).trim();
    }

    private JSObject isReturning(String sqlStmt) {
        JSObject retObj = new JSObject();

        String stmt = sqlStmt.trim();
        if (stmt.endsWith(";")) {
            // Remove the suffix
            stmt = stmt.substring(0, stmt.length() - 1).trim();
        }
        retObj.put("isReturning", false);
        retObj.put("stmt", sqlStmt);
        retObj.put("names", "");
        String stmtType = sqlStmt.trim().split("\\s+")[0].toUpperCase();

        switch (stmtType) {
            case "INSERT":
                int valuesIndex = stmt.toUpperCase().indexOf("VALUES");
                if (valuesIndex != -1) {
                    int closingParenthesisIndex = -1;

                    for (int i = stmt.length() - 1; i >= valuesIndex; i--) {
                        if (stmt.charAt(i) == ')') {
                            closingParenthesisIndex = i;
                            break;
                        }
                    }
                    if (closingParenthesisIndex != -1) {
                        String stmtString = stmt.substring(0, closingParenthesisIndex + 1).trim() + ";";
                        String resultString = stmt.substring(closingParenthesisIndex + 1).trim();
                        if (resultString.length() > 0 && !resultString.endsWith(";")) {
                            resultString += ";";
                        }
                        if (resultString.toLowerCase().contains("returning")) {
                            retObj.put("isReturning", true);
                            retObj.put("stmt", stmtString);
                            retObj.put("names", resultString);
                        }
                    }
                }
                return retObj;
            case "DELETE":
            case "UPDATE":
                String[] words = stmt.split("\\s+");
                List<String> wordsBeforeReturning = new ArrayList<>();
                List<String> returningString = new ArrayList<>();

                boolean isReturningOutsideMessage = false;
                for (String word : words) {
                    if (word.toLowerCase().equals("returning")) {
                        isReturningOutsideMessage = true;
                        // Include "RETURNING" and the words after it in returningString
                        returningString.add(word);
                        returningString.addAll(wordsAfter(word, words));
                        break;
                    }
                    wordsBeforeReturning.add(word);
                }

                if (isReturningOutsideMessage) {
                    String joinedWords = String.join(" ", wordsBeforeReturning) + ";";
                    String joinedReturningString = String.join(" ", returningString);
                    if (joinedReturningString.length() > 0 && !joinedReturningString.endsWith(";")) {
                        joinedReturningString += ";";
                    }
                    retObj.put("isReturning", true);
                    retObj.put("stmt", joinedWords);
                    retObj.put("names", joinedReturningString);
                    return retObj;
                } else {
                    return retObj;
                }
            default:
                return retObj;
        }
    }

    private List<String> wordsAfter(String word, String[] words) {
        List<String> mWords = Arrays.asList(words);
        int index = mWords.indexOf(word);
        if (index == -1) {
            return new ArrayList<>();
        }
        List<String> retWords = new ArrayList<>(mWords.subList(index + 1, mWords.size()));
        return retWords;
    }

    private JSArray getInsertReturnedValues(Database mDB, String colNames, String tableName, Long iLastId, Long lastId, String rMode)
        throws Exception {
        JSArray retVals = new JSArray();
        if (iLastId < 0 || colNames.length() == 0) return retVals;
        Long sLastId = iLastId + 1;
        StringBuilder sbQuery = new StringBuilder("SELECT ").append(colNames).append(" FROM ");

        sbQuery.append(tableName).append(" WHERE ").append("rowid ");
        if (rMode.equals("wAone")) {
            sbQuery.append("= ").append(sLastId);
        }
        if (rMode.equals("wAall")) {
            sbQuery.append("BETWEEN ").append(sLastId).append(" AND ").append(lastId);
        }
        sbQuery.append(";");
        retVals = mDB.selectSQL(sbQuery.toString(), new ArrayList<>());

        return retVals;
    }

    private JSArray getUpdDelReturnedValues(Database mDB, String stmt, String colNames) throws Exception {
        JSArray retVals = new JSArray();
        String tableName = extractTableName(stmt);
        String whereClause = extractWhereClause(stmt);
        if (whereClause != null && tableName != null) {
            StringBuilder sbQuery = new StringBuilder("SELECT ").append(colNames).append(" FROM ");
            sbQuery.append(tableName).append(" WHERE ").append(whereClause).append(";");
            retVals = mDB.selectSQL(sbQuery.toString(), new ArrayList<>());
        }
        return retVals;
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
        String msg = "DeleteSQL";

        try {
            boolean isLast = this._uJson.isLastModified(mDB);
            boolean isDel = this._uJson.isSqlDeleted(mDB);

            if (!isLast || !isDel) {
                return sqlStmt;
            }

            // Replace DELETE by UPDATE
            // set sql_deleted to 1
            String whereClause = extractWhereClause(sqlStmt);

            if (whereClause == null) {
                throw new Exception("deleteSQL: cannot find a WHERE clause");
            }

            String tableName = extractTableName(sqlStmt);

            if (tableName == null) {
                throw new Exception("deleteSQL: cannot find a WHERE clause");
            }
            String[] colNames = extractColumnNames(whereClause).toArray(new String[0]);

            if (colNames.length == 0) {
                throw new Exception("deleteSQL: Did not find column names in the WHERE Statement");
            }
            String setStmt = "sql_deleted = 1";

            // Find REFERENCES if any and update the sql_deleted column
            boolean hasToUpdate = findReferencesAndUpdate(mDB, tableName, whereClause, colNames, values);

            if (hasToUpdate) {
                String whereStmt = whereClause.endsWith(";") ? whereClause.substring(0, whereClause.length() - 1) : whereClause;

                sqlStmt = "UPDATE " + tableName + " SET " + setStmt + " WHERE " + whereStmt + " AND sql_deleted = 0;";
            } else {
                sqlStmt = "";
            }

            return sqlStmt;
        } catch (Exception err) {
            String errmsg = err.getMessage() != null ? err.getMessage() : err.toString();
            throw new Exception(msg + " " + errmsg);
        }
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
        SQLiteCursor c = null;
        if (_db == null) {
            return retArray;
        }
        try {
            c = (SQLiteCursor) _db.query(statement, values.toArray(new Object[0]));
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
            boolean isLastModified = this._uJson.isLastModified(this);
            boolean isSqlDeleted = this._uJson.isSqlDeleted(this);
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
    public JSObject exportToJson(String mode, Boolean isEncrypted) throws Exception {
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
            } else {
                if (inJson.getMode().equals("partial")) {
                    throw new Exception("No sync_table available");
                }
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
            if (this._encrypted && this._isEncryption && isEncrypted) {
                retObj.put("encrypted", true);
                retObj.put("overwrite", true);
                String base64Str = UtilsEncryption.encryptJSONObject(this._context, retObj);
                retObj = new JSObject();
                retObj.put("expData", base64Str);
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
