package com.jeep.plugin.capacitor.sqlite;

import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;
import android.util.Log;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;

import java.util.ArrayList;
import java.util.List;

import static android.database.Cursor.FIELD_TYPE_BLOB;
import static android.database.Cursor.FIELD_TYPE_FLOAT;
import static android.database.Cursor.FIELD_TYPE_INTEGER;
import static android.database.Cursor.FIELD_TYPE_NULL;
import static android.database.Cursor.FIELD_TYPE_STRING;

public class DatabaseHelper extends SQLiteOpenHelper {
    private static final String TAG = "DatabaseHelper";
    private static DatabaseHelper sInstance;
    private static Context sContext;

    public static synchronized DatabaseHelper getInstance(Context context,String databaseName,int versionNumber) {
        // Use the application context, which will ensure that you
        // don't accidentally leak an Activity's context.
        // See this article for more information: http://bit.ly/6LRzfx
        if (sInstance == null) {
            sInstance = new DatabaseHelper(context.getApplicationContext(),databaseName,versionNumber);
        }
        return sInstance;
    }

    /**
     * Constructor should be private to prevent direct instantiation.
     * Make a call to the static method "getInstance()" instead.
     */
    private DatabaseHelper(Context context,String databaseName, int versionNumber) {
        super(context, databaseName, null, versionNumber);
        sContext = context;
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
        SQLiteDatabase db = getWritableDatabase();

        try {
            for (String cmd : statements ) {
                db.execSQL(cmd+";");
            }
        } catch (Exception e) {
            Log.d(TAG, "Error: execSQL failed: ",e);
        } finally {
            return dbChanges();
        }

    }
    // run one statement with or without values
    public int runSQL(String statement, ArrayList values) {
        // Open the database for writing
        SQLiteDatabase db = getWritableDatabase();
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
        } finally {
            return dbChanges();
        }

    }
    public JSArray querySQL(String statement, ArrayList<String> values) {
        JSArray  retArray = new JSArray();
        // Open the database for reading
        SQLiteDatabase db = getReadableDatabase();
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
                    Log.d(TAG, "keysvalues: Error while trying to get all keys/values from storage database");
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
        } finally {
            return retArray;
        }
    }
    public void deleteDB(String databaseName) {
        sContext.deleteDatabase(databaseName);
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
        } finally {
            ret = true;
        }
        return ret;
    }

    private int dbChanges() {
        String SELECT_CHANGE = "SELECT changes()";
        SQLiteDatabase db = getReadableDatabase();
        Cursor cursor = db.rawQuery(SELECT_CHANGE, null);
        return cursor.getCount();
    }

}
