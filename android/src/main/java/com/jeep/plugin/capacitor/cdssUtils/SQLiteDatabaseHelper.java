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
import android.util.Log;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;

import java.io.IOException;
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
        SQLiteDatabase.loadLibs(context);
        SQLiteDatabase database;
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
           } catch (Exception e) {
               Log.d(TAG, "InitializeSQLCipher: Error while encrypting the database");
               database = null;
           } finally {
               databaseFile = context.getDatabasePath(dbName);
               database = SQLiteDatabase.openOrCreateDatabase(databaseFile, secret, null);
               encrypted = true;
               isOpen = true;
           }
           Log.d(TAG, "InitializeSQLCipher isOpen: " + isOpen );
        }
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
    public int execSQL(String[] statements) {
        // Open the database for writing
        SQLiteDatabase db = getWritableDatabase(secret);

        try {
            for (String cmd : statements ) {
                db.execSQL(cmd+";");
            }
        } catch (Exception e) {
            Log.d(TAG, "Error: execSQL failed: ",e);
            return Integer.valueOf(-1);
        } finally {
            return dbChanges();
        }

    }
    // run one statement with or without values
    public int runSQL(String statement, ArrayList values) {
        // Open the database for writing
        SQLiteDatabase db = getWritableDatabase(secret);
        try {
            if(values != null && !values.isEmpty()) {
                // with value
                Object[] bindings = new Object[values.size()];
                for (int i = 0 ; i < values.size() ; i++) {
                    bindings[i] = values.get(i);

                }
                db.execSQL(statement,bindings);
            } else {
                // without values
                db.execSQL(statement);
            }
        } catch (Exception e) {
            Log.d(TAG, "Error: runSQL failed: ",e);
            return Integer.valueOf(-1);
        } finally {
            return dbChanges();
        }

    }
    public JSArray querySQL(String statement, ArrayList<String> values) {
        JSArray  retArray = new JSArray();
        // Open the database for reading
        SQLiteDatabase db = getReadableDatabase(secret);
        Cursor c ;
        try {
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
                try {
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
                } catch (Exception e) {
                    Log.d(TAG, "Error: Error while creating the resulting cursor");
                    c.close();
                    return new JSArray();

                } finally {
                    if (c != null && !c.isClosed()) {
                        c.close();
                    }
                }
            } else {
                if (c != null && !c.isClosed()) {
                    c.close();
                }
            }
        } catch (Exception e) {
            Log.d(TAG, "Error: querySQL failed: ",e);
            return new JSArray();

        } finally {
            return retArray;
        }
    }
    public boolean closeDB(String databaseName) {
        boolean ret = false;
        Log.d(TAG, "closeDB: databaseName " + databaseName);

        File databaseFile = context.getDatabasePath(databaseName);
        try {
            SQLiteDatabase database = SQLiteDatabase.openOrCreateDatabase(databaseFile, secret,
                    null);
            database.close();
        } catch (Exception e) {
            Log.d(TAG, "Error: closeDB failed: ",e);
            return false;
        } finally {
            isOpen = false;
            ret = true;
            Log.d(TAG, "closeDB: successful isOpen " + String.valueOf(isOpen));
            return ret;
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

    private boolean dropAllTables(SQLiteDatabase db) {
        boolean ret = false;
        List<String> tables = new ArrayList<String>();
        Cursor cursor = db.rawQuery("SELECT * FROM sqlite_master WHERE type='table';", null);
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
            return false;
        } finally {
            ret = true;
        }
        return ret;
    }

    private int dbChanges() {
        String SELECT_CHANGE = "SELECT changes()";
        SQLiteDatabase db = getReadableDatabase(secret);
        Cursor cursor = db.rawQuery(SELECT_CHANGE, null);
        return cursor.getCount();
    }
    
}
