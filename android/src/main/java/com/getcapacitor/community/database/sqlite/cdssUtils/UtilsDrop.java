package com.getcapacitor.community.database.sqlite.cdssUtils;

import android.database.Cursor;
import android.util.Log;
import com.getcapacitor.JSObject;
import java.util.ArrayList;
import java.util.Dictionary;
import java.util.Enumeration;
import java.util.List;
import net.sqlcipher.database.SQLiteDatabase;

public class UtilsDrop {
    private static final String TAG = UtilsDrop.class.getName();

    /**
     * Get all Table's name
     * @param db
     * @return List<String>
     */

    public List<String> getTablesNames(SQLiteDatabase db) throws Exception {
        List<String> tables = new ArrayList<String>();
        Cursor cursor = null;
        String query = "SELECT name FROM sqlite_master WHERE ";
        query += "type='table' AND name NOT LIKE 'sync_table' ";
        query += "AND name NOT LIKE '_temp_%' ";
        query += "AND name NOT LIKE 'sqlite_%' ";
        query += "AND name NOT LIKE 'android_%';";
        try {
            cursor = db.rawQuery(query, null);
            cursor.moveToFirst();
            while (!cursor.isAfterLast()) {
                String tableName = cursor.getString(0);
                tables.add(tableName);
                cursor.moveToNext();
            }
        } catch (Exception e) {
            throw new Exception("Error getTablesNames failed " + e);
        } finally {
            cursor.close();
            return tables;
        }
    }

    /**
     * Drop all Tables
     * @param db
     */
    public void dropTables(SQLiteDatabase db) throws Exception {
        try {
            List<String> tables = getTablesNames(db);
            for (String tableName : tables) {
                db.execSQL("DROP TABLE IF EXISTS " + tableName);
            }
        } catch (Exception e) {
            String msg = "Error: dropAllTables failed: " + e;
            Log.d(TAG, msg);
            throw new Exception(msg);
        }
    }

    /**
     * get all index's name
     * @param db
     * @return List<String>
     */

    public List<String> getIndexesNames(SQLiteDatabase db) {
        List<String> indexes = new ArrayList<String>();
        Cursor cursor = null;
        String query = "SELECT name FROM sqlite_master WHERE ";
        query += "type='index' AND name NOT LIKE 'sqlite_%';";
        cursor = db.rawQuery(query, null);
        cursor.moveToFirst();
        while (!cursor.isAfterLast()) {
            String indexName = cursor.getString(0);
            indexes.add(indexName);
            cursor.moveToNext();
        }
        cursor.close();
        return indexes;
    }

    /**
     * Drop all Indexes
     * @param db
     */
    public void dropIndexes(SQLiteDatabase db) throws Exception {
        List<String> indexes = getIndexesNames(db);
        try {
            for (String indexName : indexes) {
                db.execSQL("DROP INDEX IF EXISTS " + indexName);
            }
        } catch (Exception e) {
            String msg = "Error: dropAllIndexes failed: " + e;
            Log.d(TAG, msg);
            throw new Exception(msg);
        }
    }

    /**
     * get all trigger's name
     * @param db
     * @return List<String>
     */

    public List<String> getTriggersNames(SQLiteDatabase db) {
        List<String> triggers = new ArrayList<String>();
        Cursor cursor = null;
        String query = "SELECT name FROM sqlite_master WHERE ";
        query += "type='trigger';";
        cursor = db.rawQuery(query, null);
        cursor.moveToFirst();
        while (!cursor.isAfterLast()) {
            String triggerName = cursor.getString(0);
            triggers.add(triggerName);
            cursor.moveToNext();
        }
        cursor.close();
        return triggers;
    }

    /**
     * Drop all Triggers
     * @param db
     */
    public void dropTriggers(SQLiteDatabase db) throws Exception {
        List<String> triggers = getTriggersNames(db);
        try {
            for (String triggerName : triggers) {
                db.execSQL("DROP TRIGGER IF EXISTS " + triggerName);
            }
        } catch (Exception e) {
            String msg = "Error: dropAllTriggers failed: " + e;
            Log.d(TAG, msg);
            throw new Exception(msg);
        }
    }

    /**
     * Drop all
     * @param dbHelper
     */
    public void dropAll(SQLiteDatabaseHelper dbHelper, String secret) throws Exception {
        Boolean success = false;
        SQLiteDatabase db = null;
        try {
            db = dbHelper.getConnection(true, secret);
            db.beginTransaction();
            dropTables(db);
            dropIndexes(db);
            dropTriggers(db);
            db.setTransactionSuccessful();
            success = true;
        } catch (Exception e) {
            String msg = "Error: dropAll failed: " + e;
            Log.d(TAG, msg);
            throw new Exception(msg);
        } finally {
            if (db != null) {
                if (success) db.endTransaction();
                db.close();
            }
        }
    }

    /**
     *  Drop Temporary Tables
     *
     * @param dbHelper
     * @param db
     * @param alterTables
     * @throws Exception
     */
    public void dropTempTables(SQLiteDatabaseHelper dbHelper, SQLiteDatabase db, Dictionary<String, List<String>> alterTables)
        throws Exception {
        int changes = Integer.valueOf(-1);
        try {
            List<String> tables = this.getDictStringKeys(alterTables);
            List<String> statements = new ArrayList<>();
            for (String table : tables) {
                String stmt = "DROP TABLE IF EXISTS _temp_" + table + ";";
                statements.add(stmt);
            }
            if (statements.size() > 0) {
                JSObject retObj = dbHelper.execute(db, statements.toArray(new String[0]));
                changes = retObj.getInteger("changes");
                if (changes < Integer.valueOf(0)) {
                    throw new Exception("dropTempTables failed");
                }
            }
        } catch (Exception e) {
            String msg = "Error: dropTempTables failed: " + e;
            Log.d(TAG, msg);
            throw new Exception(msg);
        }
    }

    /**
     * getDictStringKeys
     *
     * @param dict
     * @return
     */
    public List<String> getDictStringKeys(Dictionary<String, List<String>> dict) {
        List<String> lkeys = new ArrayList<>();
        for (Enumeration<String> keys = dict.keys(); keys.hasMoreElements();) {
            String keyVal = keys.nextElement();
            lkeys.add(keyVal);
        }
        return lkeys;
    }
}
