//
//  SQLiteDatabaseHelper.java
//  Plugin
//
//  Created by  Quéau Jean Pierre on 01/21/2020.
//
package com.jeep.plugin.capacitor.cdssUtils;

import android.content.Context;
import android.database.Cursor;
import net.sqlcipher.database.SQLiteDatabase;
import net.sqlcipher.database.SQLiteOpenHelper;
import net.sqlcipher.database.SQLiteStatement;
import android.util.Log;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.sql.Blob;
import java.util.ArrayList;
import java.util.List;
import java.io.File;


import static android.database.Cursor.FIELD_TYPE_BLOB;
import static android.database.Cursor.FIELD_TYPE_FLOAT;
import static android.database.Cursor.FIELD_TYPE_INTEGER;
import static android.database.Cursor.FIELD_TYPE_NULL;
import static android.database.Cursor.FIELD_TYPE_STRING;

public class SQLiteDatabaseHelper extends SQLiteOpenHelper {
    public Boolean isOpen = false;
    private static final String TAG = "SQLiteDatabaseHelper";
    private static Context context;

    private String dbName;
    private Boolean encrypted;
    private String mode;
    private String secret;
    private final String newsecret;
    private final int dbVersion;

    public SQLiteDatabaseHelper(Context _context, String _dbName,
        Boolean _encrypted, String _mode, String _secret,
        String _newsecret, int _vNumber) {
        super(_context, _dbName, null, _vNumber);
        dbName = _dbName;
        dbVersion = _vNumber;
        encrypted = _encrypted;
        secret = _secret;
        newsecret = _newsecret;
        mode = _mode;
        context = _context;

        InitializeSQLCipher();
    }
    private void InitializeSQLCipher() {
        Log.d(TAG, " in InitializeSQLCipher: ");

        SQLiteDatabase.loadLibs(context);
        SQLiteDatabase database = null;
        File databaseFile;
        File tempFile;

        if(!encrypted && mode.equals("no-encryption")) {

            databaseFile = context.getDatabasePath(dbName);
            try {
                database = SQLiteDatabase.openOrCreateDatabase(databaseFile, "", null);
                isOpen = true;
            } catch (Exception e) {
                database = null;
            }
        } else if (encrypted && mode.equals("secret") && secret.length() > 0) {
            databaseFile = context.getDatabasePath(dbName);
            try {
                database = SQLiteDatabase.openOrCreateDatabase(databaseFile, secret, null);
                isOpen = true;
            } catch (Exception e) {
                Log.d(TAG, "InitializeSQLCipher: Wrong Secret " );
                database = null;
            }
        } else if(encrypted && mode.equals("newsecret") && secret.length() > 0
                && newsecret.length() > 0) {

            databaseFile = context.getDatabasePath(dbName);
            try {
                database = SQLiteDatabase.openOrCreateDatabase(databaseFile, secret, null);
                // Change database secret to newsecret
                database.changePassword(newsecret);
                secret = newsecret;
                isOpen = true;
            } catch (Exception e) {
                Log.d(TAG, "InitializeSQLCipher: " + e );
                database = null;
            }

        } else if (encrypted && mode.equals("encryption") && secret.length() > 0) {

            try {
                encryptDataBase(secret);
                databaseFile = context.getDatabasePath(dbName);
                database = SQLiteDatabase.openOrCreateDatabase(databaseFile, secret, null);
                encrypted = true;
                isOpen = true;
            } catch (Exception e) {
                Log.d(TAG, "InitializeSQLCipher: Error while encrypting the database");
                database = null;
           }
        }
        Log.d(TAG, "InitializeSQLCipher isOpen: " + isOpen );
        if(database != null) database.close();

    }
    private void encryptDataBase(String passphrase) throws IOException {

        File originalFile = context.getDatabasePath(dbName);

        File newFile = File.createTempFile("sqlcipherutils", "tmp", context.getCacheDir());
        SQLiteDatabase existing_db = SQLiteDatabase.openOrCreateDatabase(originalFile,
                null, null);
        existing_db.rawExecSQL("ATTACH DATABASE '" + newFile.getPath() + "' AS encrypted KEY '" + passphrase + "';");
        existing_db.rawExecSQL("SELECT sqlcipher_export('encrypted');");
        existing_db.rawExecSQL("DETACH DATABASE encrypted;");
        // close the database
        existing_db.close();
        // delete the original database
        originalFile.delete();
        // rename the encrypted database
        newFile.renameTo(originalFile);
    }

    
    @Override
    public void onCreate(SQLiteDatabase db) {
        Log.d(TAG, "onCreate: name: database created");
    }

    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        if (oldVersion != newVersion) {
            dropAllTables(db);
            onCreate(db);
        }
    }
    // execute sql raw statements
    public JSObject execSQL(String[] statements) {
        // Open the database for writing
        Log.d(TAG, "*** in execSQL: ");
        JSObject retObj = new JSObject();
        SQLiteDatabase db = null;        
        boolean success = true;
        try {
            db = getWritableDatabase(secret);
            for (String cmd : statements ) {
                if (!cmd.endsWith(";")) cmd += ";";
                db.execSQL(cmd);
            }
        } catch (Exception e) {
            Log.d(TAG, "Error: execSQL failed: ",e);
            success = false;            
        } finally {
            if(!success) {
                retObj.put("changes",Integer.valueOf(-1));
            } else {
                retObj.put("changes",dbChanges(db));
            }
            if(db != null) db.close();
            return retObj;
        }

    }
    // run one statement with or without values
    public JSObject runSQL(String statement, JSArray values) {
        JSObject retObj = new JSObject();
        // Open the database for writing
        SQLiteDatabase db = null;        
        boolean success = true;
        long lastId = Long.valueOf(-1);
        if(statement.length() > 6) {
            try {
                db = getWritableDatabase(secret);
                db.beginTransaction();
                lastId = prepareSQL(db, statement, values );
                if (lastId != -1) db.setTransactionSuccessful();
            } catch (Exception e) {
                Log.d(TAG, "Error: runSQL failed: ",e);
                success = false;
            } finally {
                db.endTransaction();
                if(!success) {
                    retObj.put("changes",Integer.valueOf(-1));
                } else {
                    retObj.put("changes",dbChanges(db));
                    retObj.put("lastId",lastId);
                }
                if(db != null) db.close();
            }
        } else {
            retObj.put("changes",Integer.valueOf(-1));
        }
        return retObj;
    }

    private long prepareSQL(SQLiteDatabase db,String statement, JSArray values ) {
        boolean success = true;
        String stmtType = "";
        long lastId = Long.valueOf(-1);
        stmtType = statement.substring(0,6).toUpperCase();
        SQLiteStatement stmt = db.compileStatement(statement);
        if(values != null && values.length() > 0) {
            // bind the values if any
            stmt.clearBindings();
            try {
                bindValues(stmt,values);
            } catch (JSONException e) {
                Log.d(TAG, "Error: prepareSQL failed: "+ e.getMessage());
                success = false;
            }
        }
        if(success) {
            if (stmtType.equals("INSERT")) {
                lastId = stmt.executeInsert();
            } else {
                lastId = Long.valueOf(stmt.executeUpdateDelete());
            }
        }
        return lastId;
    }
    public JSArray querySQL(String statement, ArrayList<String> values) {
        JSArray  retArray = new JSArray();
        // Open the database for reading
        SQLiteDatabase db = null;
        Boolean success = true;
        try {
            db = getReadableDatabase(secret);
            retArray = selectSQL(db,statement,values);
            if(retArray.length() == 0) success = false;
        } catch (Exception e) {
            Log.d(TAG, "Error: querySQL failed: ",e);
            success = false;
        } finally {
            if(db != null) db.close();
            if(!success) {
                return new JSArray();
            } else {
                return retArray;
            }
         }
    }
    private JSArray selectSQL(SQLiteDatabase db, String statement, ArrayList<String> values) {
        JSArray  retArray = new JSArray();
        Cursor c = null;
        if(values != null && !values.isEmpty()) {
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
        if(c.getCount() > 0) {
            if (c.moveToFirst()) {
                do {

                    JSObject row = new JSObject();

                    for (int i = 0; i< c.getColumnCount(); i++) {
                        int type = c.getType(i);
                        switch (type ) {
                            case FIELD_TYPE_STRING :
                                row.put(c.getColumnName(i),c.getString(c.getColumnIndex(c.getColumnName(i))));
                                break;
                            case FIELD_TYPE_INTEGER :
                                row.put(c.getColumnName(i),c.getLong(c.getColumnIndex(c.getColumnName(i))));
                                break;
                            case FIELD_TYPE_FLOAT :
                                row.put(c.getColumnName(i),c.getFloat(c.getColumnIndex(c.getColumnName(i))));
                                break;
                            case FIELD_TYPE_BLOB :
                                row.put(c.getColumnName(i),c.getBlob(c.getColumnIndex(c.getColumnName(i))));
                                break;
                            case FIELD_TYPE_NULL :
                                break;
                            default :
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
    public boolean closeDB(String databaseName) {
        boolean success = true;
        Log.d(TAG, "closeDB: databaseName " + databaseName);
        SQLiteDatabase database = null;
        File databaseFile = context.getDatabasePath(databaseName);
        try {
            database = SQLiteDatabase.openOrCreateDatabase(databaseFile, secret,
                    null);           
            database.close();
        } catch (Exception e) {
            Log.d(TAG, "Error: closeDB failed: ",e);
            success = false;
        } finally {
            if(!success) {
                return false;
            } else {
                isOpen = false;
                return true;
            }
        }
    }
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
    public JSObject importFromJson(JsonSQLite jsonSQL) throws JSONException {
        Log.d(TAG, "importFromJson:  ");
        JSObject retObj = new JSObject();
        int changes = Integer.valueOf(-1);
        // create the database schema
        changes = createDatabaseSchema(jsonSQL);
        if (changes != -1) {
            changes = createTableData(jsonSQL);
        }
        retObj.put("changes", changes);
        return retObj;
    }
    private Integer createDatabaseSchema(JsonSQLite jsonSQL) {
        int changes = Integer.valueOf(-1);
        // create the database schema
        ArrayList<String> statements = new ArrayList<String>();
        statements.add("BEGIN TRANSACTION;");

        for (int i = 0; i < jsonSQL.getTables().size(); i++) {

            if (jsonSQL.getTables().get(i).getSchema().size() > 0) {

                if (jsonSQL.getMode().equals("full")) {
                    String stmt = new StringBuilder("DROP TABLE IF EXISTS ")
                            .append(jsonSQL.getTables().get(i).getName())
                            .append(";").toString();
                    statements.add(stmt);
                }
                String stmt = new StringBuilder("CREATE TABLE IF NOT EXISTS ")
                        .append(jsonSQL.getTables().get(i).getName())
                        .append(" (").toString();
                for (int j = 0; j < jsonSQL.getTables().get(i).getSchema().size(); j++) {
                    if (j == jsonSQL.getTables().get(i).getSchema().size() - 1) {
                        stmt = new StringBuilder(stmt).append(jsonSQL.getTables().get(i)
                                .getSchema().get(j).getColumn())
                                .append(" ").append(jsonSQL.getTables().get(i)
                                        .getSchema().get(j).getValue()).toString();
                    } else {
                        stmt = new StringBuilder(stmt).append(jsonSQL.getTables().get(i)
                                .getSchema().get(j).getColumn())
                                .append(" ").append(jsonSQL.getTables().get(i)
                                        .getSchema().get(j).getValue()).append(",").toString();
                    }
                }
                stmt = new StringBuilder(stmt).append(");").toString();
                statements.add(stmt);
            }
            if (jsonSQL.getTables().get(i).getIndexes().size() > 0) {
                for (int j = 0; j < jsonSQL.getTables().get(i).getIndexes().size(); j++) {
                    String stmt = new StringBuilder("CREATE INDEX IF NOT EXISTS ")
                            .append(jsonSQL.getTables().get(i).getIndexes().get(j).getName())
                            .append(" ON ").append(jsonSQL.getTables().get(i).getName())
                            .append(" (").append(jsonSQL.getTables().get(i).getIndexes()
                                    .get(j).getColumn()).append(");").toString();
                    statements.add(stmt);
                }
            }

        }

        if (statements.size() > 1) {
            statements.add("PRAGMA user_version = 1;");
            statements.add("COMMIT TRANSACTION;");

            JSObject result = this.execSQL(statements.toArray(new String[statements.size()]));
            changes = result.getInteger("changes");
        }
        return changes;
    }
    private Integer createTableData(JsonSQLite jsonSQL) {
        boolean success = true;
        int changes = Integer.valueOf(-1);
        SQLiteDatabase db = null;

        // create the table's data
        ArrayList<String> statements = new ArrayList<String>();
        statements.add("BEGIN TRANSACTION;");
        try {
            db = getWritableDatabase(secret);
            db.beginTransaction();

            for( int i = 0; i< jsonSQL.getTables().size(); i++) {
                if(jsonSQL.getTables().get(i).getValues().size() > 0) {
                    // Check if table exists
                    boolean isTable = this.isTable(db, jsonSQL.getTables().get(i).getName());
                    if(!isTable) {
                        Log.d(TAG, "importFromJson: Table " +
                                jsonSQL.getTables().get(i).getName() +
                                "does not exist");
                        success = false;
                        break;
                    }
                    // Get the Column's Name and Type
                    try {
                        JSObject tableNamesTypes = this.getTableColumnNamesTypes(db,
                                jsonSQL.getTables().get(i).getName());
                        if(tableNamesTypes.length() == 0) {
                            success = false;
                            break;
                        }
                        ArrayList<String> tableColumnNames =
                                (ArrayList<String>)tableNamesTypes.get("names");
                        ArrayList<String> tableColumnTypes =
                                (ArrayList<String>)tableNamesTypes.get("types");

                        // Loop on Table's Values
                        for(int j = 0; j< jsonSQL.getTables().get(i).getValues().size(); j++) {
                            // Check the row number of columns
                            ArrayList<Object> row = jsonSQL.getTables().get(i).getValues().get(j);

                            if(tableColumnNames.size() != row.size()) {
                                Log.d(TAG, "importFromJson: Table " +
                                        jsonSQL.getTables().get(i).getName() +
                                        " values row " + j + " not correct length");
                                success = false;
                                break;
                            }

                            // Check the column's type before proceeding
                            boolean retTypes = this.checkColumnTypes(tableColumnTypes, row);
                            if(!retTypes) {
                                Log.d(TAG, "importFromJson: Table " +
                                        jsonSQL.getTables().get(i).getName() +
                                        " values row " + j + " not correct types");
                                success = false;
                                break;
                            }
                            boolean retIdExists = this.isIdExists(db,
                                    jsonSQL.getTables().get(i).getName(),
                                    tableColumnNames.get(0),row.get(0));
                            String stmt = "";
                            // Create INSERT or UPDATE Statements
                            if(jsonSQL.getMode().equals("full") ||
                                    (jsonSQL.getMode().equals("partial") && !retIdExists)) {
                                // Insert
                                String namesString = this.convertToString(tableColumnNames,
                                        ',');
                                String questionMarkString = this.createQuestionMarkString(
                                        tableColumnNames.size());
                                StringBuilder strB = new StringBuilder();

                                stmt = new StringBuilder("INSERT INTO ")
                                    .append(jsonSQL.getTables().get(i).getName())
                                    .append("(").append(namesString).append(")")
                                    .append(" VALUES (").append(questionMarkString)
                                    .append(");").toString();

                            } else {
                                // Update
                                String setString  = this.setNameForUpdate(tableColumnNames);
                                if(setString.length() == 0) {
                                    String message = new StringBuilder("importFromJson: Table ")
                                        .append(jsonSQL.getTables().get(i).getName())
                                        .append(" values row ").append(j)
                                        .append(" not set to String").toString();
                                    success = false;
                                    break;
                                }
                                stmt = new StringBuilder("UPDATE ")
                                        .append(jsonSQL.getTables().get(i).getName())
                                        .append(" SET ").append(setString).append(" WHERE ")
                                        .append(tableColumnNames.get(0)).append(" = ")
                                        .append(row.get(0)).append(";").toString();
                            }
                            JSArray jsRow = this.convertToJSArray(row);
                            long lastId = this.prepareSQL(db,stmt,jsRow);
                            if(lastId == -1) {
                                Log.d(TAG, "createTableData: Error in INSERT/UPDATE");
                                success = false;
                                break;
                            }
                         }
                    }
                    catch (JSONException e) {
                        Log.d(TAG, "get Table Values: Error ", e);
                        success = false;
                        break;
                    }
                } else {
                    success = false;
                }
            }
            if(success) db.setTransactionSuccessful();

        } catch (Exception e){

        } finally {
            db.endTransaction();
            if(success) changes = dbChanges(db);
            if(db != null) db.close();
        }

        return changes;
    }
    private void bindValues(SQLiteStatement stmt, JSArray values) throws JSONException {
        for (int i = 0 ; i < values.length() ; i++) {
            if (values.get(i) instanceof Float || values.get(i) instanceof Double) {
                stmt.bindDouble(i + 1, values.getDouble(i));
            } else if (values.get(i) instanceof Number) {
                stmt.bindLong(i + 1, values.getLong(i));
            } else if (values.isNull(i)) {
                stmt.bindNull(i + 1);
            } else {
                String str = values.getString(i);
                if (str.toUpperCase().equals("NULL")) {
                    stmt.bindNull(i + 1);
                } else {
                    stmt.bindString(i + 1, str);
                }
            }
        }
    }
    private JSArray convertToJSArray(ArrayList<Object> row) {
        JSArray jsArray = new JSArray();
        for (int i = 0; i < row.size(); i++) {
            jsArray.put(row.get(i));
        }
        return jsArray;
    }
    private boolean isTable(SQLiteDatabase db,String tableName) {
        boolean ret = false;
        String query =
            new StringBuilder("SELECT name FROM sqlite_master WHERE type='table' AND name='")
                .append(tableName).append("';").toString();
        JSArray resQuery = this.selectSQL(db, query, new ArrayList<String>());
        if(resQuery.length() > 0) ret = true;
        return ret;
    }
    private JSObject getTableColumnNamesTypes(SQLiteDatabase db, String tableName) throws JSONException {
        JSObject ret = new JSObject();
        ArrayList<String> names = new ArrayList<String>();
        ArrayList<String> types = new ArrayList<String>();
        String query =
                new StringBuilder("PRAGMA table_info(").append(tableName)
                .append(");").toString();
        JSArray resQuery = this.selectSQL(db, query, new ArrayList<String>());
        List<JSObject> lQuery = resQuery.toList();
        if(resQuery.length() > 0) {
            for(JSObject obj : lQuery) {
                names.add(obj.getString("name"));
                types.add(obj.getString("type"));
            }
            ret.put("names",names);
            ret.put("types",types);
        }
        return ret;
    }
    private boolean checkColumnTypes(ArrayList<String> types,ArrayList<Object> values) {
        boolean isType = true;
        for(int i =0; i < values.size(); i++) {
            isType = this.isType(types.get(i), values.get(i));
            if (!isType) break;
        }
        return isType;
    }
    private boolean isType(String type, Object value) {
        boolean ret = false;
        String val = String.valueOf(value).toUpperCase();
        if(val.equals("NULL")) {
            ret = true;
        } else if( val.contains("BASE64")) {
            ret = true;
        } else {
            if (type.equals("NULL") && value instanceof JSONObject) ret = true;
            if (type.equals("TEXT") && value instanceof String) ret = true;
            if (type.equals("INTEGER") && value instanceof Integer) ret = true;
            if (type.equals("REAL") && value instanceof Float) ret = true;
            if (type.equals("BLOB") && value instanceof Blob) ret = true;
        }
        return ret;
    }
    private boolean isIdExists(SQLiteDatabase db, String tableName,String firstColumnName,Object key) {
        boolean ret = false;
        String query = new StringBuilder("SELECT ").append(firstColumnName).append(" FROM ")
            .append(tableName).append(" WHERE ").append(firstColumnName).append(" = ")
            .append(key).append(";").toString();
        JSArray resQuery = this.selectSQL(db, query, new ArrayList<String>());
        if (resQuery.length() == 1) ret = true;
        return ret;
    }

    private String createQuestionMarkString(Integer length) {
        String retString = "";
        StringBuilder strB = new StringBuilder();
        for(int i =0; i < length; i++) {
            strB.append("?,");
        }
        strB.deleteCharAt(strB.length() - 1);
        retString = strB.toString();
        return retString;
    }
    private String setNameForUpdate(ArrayList<String> names ) {
        String retString = "";
        StringBuilder strB = new StringBuilder();
        for(int i =0; i < names.size(); i++) {
            strB.append("("+ names.get(i) + ") = ? ,");
        }
        strB.deleteCharAt(strB.length() - 1);
        retString = strB.toString();
        return retString;
    }

    private boolean dropAllTables(SQLiteDatabase db) {
        boolean ret = true;
        List<String> tables = new ArrayList<String>();
        Cursor cursor = null;
        cursor = db.rawQuery("SELECT * FROM sqlite_master WHERE type='table';", null);
        cursor.moveToFirst();
        while (!cursor.isAfterLast()) {
            String tableName = cursor.getString(1);
            if (!tableName.equals("android_metadata") &&
                    !tableName.equals("sqlite_sequence"))
                tables.add(tableName);
            cursor.moveToNext();
        }
        cursor.close();
        try {
            for(String tableName:tables) {
                db.execSQL("DROP TABLE IF EXISTS " + tableName);
            }
        } catch (Exception e) {
            Log.d(TAG, "Error: dropAllTables failed: ",e);
            ret = false;
        } finally {
            return ret;
        }
    }

    private int dbChanges(SQLiteDatabase db) {
        String SELECT_CHANGE = "SELECT total_changes()";
        Boolean success = true;
        int ret = Integer.valueOf(-1);
        try {
            Cursor cursor = db.rawQuery(SELECT_CHANGE, null);
            if(cursor != null) {
                if (cursor.moveToFirst()) {
                    ret = Integer.parseInt(cursor.getString(0));
                }

            }
            cursor.close();
        }
        catch (Exception e) {
            Log.d(TAG, "Error: dbChanges failed: ",e);
        }
        finally {
            return ret;
        }

    }
    private String convertToString(ArrayList<String> arr,char sep) {
        StringBuilder builder = new StringBuilder();
        // Append all Integers in StringBuilder to the StringBuilder.
        for (String str : arr) {
            builder.append(str);
            builder.append(sep);
        }
        // Remove last delimiter with setLength.

        builder.setLength(builder.length() - 1);
        return builder.toString();
    }


}
