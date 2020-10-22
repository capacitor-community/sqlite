package com.getcapacitor.community.database.sqlite.cdssUtils;

import android.content.Context;
import android.util.Log;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.community.database.sqlite.cdssUtils.ImportExportJson.UtilsJson;
import java.util.ArrayList;
import java.util.Date;
import java.util.Dictionary;
import java.util.Enumeration;
import java.util.Hashtable;
import java.util.Iterator;
import java.util.List;
import net.sqlcipher.database.SQLiteDatabase;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class UtilsUpgrade {
    private static final String TAG = UtilsUpgrade.class.getName();
    private UtilsFile uFile = new UtilsFile();
    private UtilsJson uJson = new UtilsJson();
    private UtilsDrop uDrop = new UtilsDrop();
    private UtilsSQLite uSqlite = new UtilsSQLite();
    private Dictionary<String, List<String>> alterTables = new Hashtable<>();
    private Dictionary<String, List<String>> commonColumns = new Hashtable<>();

    /**
     * onUpgrade
     *
     * @param dbHelper
     * @param context
     * @param db
     * @param dbName
     * @param curVersion
     * @param targetVersion
     * @throws Exception
     */
    public void onUpgrade(
        SQLiteDatabaseHelper dbHelper,
        Context context,
        SQLiteDatabase db,
        String dbName,
        Dictionary<String, Dictionary<Integer, JSONObject>> versionUpgrades,
        Integer curVersion,
        Integer targetVersion
    )
        throws Exception {
        Dictionary<Integer, JSONObject> dbVUValues = versionUpgrades.get(dbName);
        JSONObject upgrade = dbVUValues.get(curVersion);
        int toVersion = upgrade.has("toVersion") ? upgrade.getInt("toVersion") : -1;
        if (toVersion == -1) {
            String msg = "Error: onUpgrade toVersion not given";
            throw new Exception(msg);
        }

        String statement = upgrade.has("statement") ? upgrade.getString("statement") : "";
        if (statement.length() <= 0) {
            String msg = "Error: onUpgrade statement not given";
            throw new Exception(msg);
        }
        JSONArray set = upgrade.has("set") ? upgrade.getJSONArray("set") : new JSONArray();

        if (targetVersion < toVersion) {
            String msg = "Error: version mistmatch Upgrade ";
            msg += "Statement would upgrade to version " + toVersion;
            msg += " , but target version is " + targetVersion;
            msg += " for database " + dbName + " and version ";
            msg += curVersion;
            throw new Exception(msg);
        }
        // Set pragma FOREIGN KEY OFF
        try {
            String cmd = "PRAGMA foreign_keys = OFF;";
            db.execSQL(cmd);
        } catch (Exception e) {
            throw new Exception("Error: onUpgrade PRAGMA FOREIGN KEY" + " failed " + e);
        }

        // Here we assume all the tables schema are given in
        // the upgrade statement
        if (statement.length() > 0) {
            try {
                this.executeStatementProcess(dbHelper, db, statement);
            } catch (Exception e) {
                String msg = "Error: onUpgrade executeStatementProcess";
                msg += " failed " + e;
                throw new Exception(msg);
            }
        }
        // here we assume that the Set contains only
        //  - the data for new tables as INSERT statements
        //  - the data for new columns in existing tables
        //    as UPDATE statements
        if (set.length() > 0) {
            try {
                this.executeSetProcess(dbHelper, db, set, toVersion);
            } catch (Exception e) {
                String msg = "Error: onUpgrade executeSetProcess";
                msg += " failed " + e;
                throw new Exception(msg);
            }
        }
        // Set pragma FOREIGN KEY ON
        try {
            String cmd = "PRAGMA foreign_keys = ON;";
            db.execSQL(cmd);
        } catch (Exception e) {
            throw new Exception("Error: onUpgrade PRAGMA FOREIGN KEY" + " failed " + e);
        }
    }

    /**
     * Execute Statement Process
     *
     * @param dbHelper
     * @param db
     * @param statement
     * @throws Exception
     */
    private void executeStatementProcess(SQLiteDatabaseHelper dbHelper, SQLiteDatabase db, String statement) throws Exception {
        int changes = Integer.valueOf(-1);
        try {
            // -> backup all existing tables  "tableName" in
            //    "temp_tableName"
            this.backupTables(dbHelper, db);

            // -> Drop all Indexes
            uDrop.dropIndexes(db);

            // -> Drop all Triggers
            uDrop.dropTriggers(db);

            // -> Create new tables from upgrade.statement

            String[] sqlCmdArray = uSqlite.getStatementsArray(statement);

            JSObject retObj = dbHelper.execute(db, sqlCmdArray);
            changes = retObj.getInteger("changes");
            if (changes < Integer.valueOf(0)) {
                throw new Exception("create new tables failed");
            }

            // -> Create the list of table's common fields
            this.findCommonColumns(dbHelper, db);

            // -> Update the new table's data from old table's data
            this.updateNewTablesData(dbHelper, db);

            // -> Drop _temp_tables
            uDrop.dropTempTables(dbHelper, db, this.alterTables);

            // -> Do some cleanup
            this.alterTables = new Hashtable<>();
            this.commonColumns = new Hashtable<>();
        } catch (Exception e) {
            throw new Exception("Error: executeStatementProcess " + " failed " + e);
        }
    }

    /**
     * Find Common Columns
     *
     * @param dbHelper
     * @param db
     * @throws Exception
     */
    private void findCommonColumns(SQLiteDatabaseHelper dbHelper, SQLiteDatabase db) throws Exception {
        List<String> columnNames = new ArrayList<>();
        try {
            List<String> tables = uDrop.getTablesNames(db);
            for (String table : tables) {
                columnNames = this.getColumnNames(dbHelper, db, table);
                List<String> arr = this.alterTables.get(table);
                if (arr != null && arr.size() > 0) {
                    List<String> comCols = this.arrayIntersection(arr, columnNames);
                    this.commonColumns.put(table, comCols);
                }
            }
        } catch (Exception e) {
            throw new Exception("findCommonColumns failed " + e);
        }
    }

    /**
     * Two Arrays Intersection
     *
     * @param array1
     * @param array2
     * @return
     */
    private List<String> arrayIntersection(List<String> array1, List<String> array2) {
        List<String> intList = new ArrayList<>();
        for (String col : array1) {
            if (array2.contains(col)) {
                intList.add(col);
            }
        }
        return intList;
    }

    /**
     * Update the New Table's Data from Old Table's Data
     *
     * @param dbHelper
     * @param db
     * @throws Exception
     */
    private void updateNewTablesData(SQLiteDatabaseHelper dbHelper, SQLiteDatabase db) throws Exception {
        int changes = Integer.valueOf(-1);
        try {
            // start a transaction
            db.beginTransaction();
            List<String> statements = new ArrayList<>();
            List<String> keys = uDrop.getDictStringKeys(this.commonColumns);
            for (String key : keys) {
                List<String> values = this.commonColumns.get(key);
                if (values.size() > 0) {
                    String columns = uJson.convertToString((ArrayList<String>) values, ',');

                    String stmt = "INSERT INTO " + key + " ";
                    stmt += "(" + columns + ") SELECT ";
                    stmt += columns + " FROM _temp_" + key + ";";
                    statements.add(stmt);
                }
            }
            if (statements.size() > 0) {
                JSObject retObj = dbHelper.execute(db, statements.toArray(new String[0]));
                changes = retObj.getInteger("changes");
                if (changes < Integer.valueOf(0)) {
                    throw new Exception("updateNewTablesData failed");
                }
            }
            if (changes != -1) db.setTransactionSuccessful();
        } catch (Exception e) {
            throw new Exception("updateNewTablesData failed " + e);
        } finally {
            if (changes != -1) {
                // commit the transaction if successful
                db.endTransaction();
            }
        }
    }

    private void executeSetProcess(SQLiteDatabaseHelper dbHelper, SQLiteDatabase db, JSONArray set, int toVersion) throws Exception {
        try {
            // -> load new data
            JSArray jsSet = convertJSONArrayToJSArray(set);
            JSObject retObj = dbHelper.executeSet(db, jsSet);
            if (retObj.getInt("lastId") < 0) {
                throw new Exception("load new data failed");
            }
            // -> update database version
            int changes = this.updateDatabaseVersion(dbHelper, db, toVersion);
            if (changes < 0) {
                throw new Exception("update database version failed");
            }
            // -> update syncDate if any
            Boolean isExists = uJson.isTableExists(dbHelper, db, "sync_table");
            if (isExists) {
                Date date = new Date();
                long syncTime = date.getTime() / 1000L;
                String stmt = "UPDATE sync_table SET ";
                stmt += "sync_date = " + syncTime;
                stmt += " WHERE id = 1;";
                Log.v(TAG, "*** New SyncDate " + syncTime);
                try {
                    db.execSQL(stmt);
                } catch (Exception e) {
                    throw new Exception("update sync date failed");
                }
            }
        } catch (Exception e) {
            throw new Exception("Error: executeSetProcess failed " + e);
        }
    }

    /**
     * Convert a JSONArray to a JSArray
     *
     * @param array
     * @return
     * @throws JSONException
     */
    private JSArray convertJSONArrayToJSArray(JSONArray array) throws JSONException {
        JSArray rArr = new JSArray();
        for (int i = 0; i < array.length(); i++) {
            rArr.put(array.get(i));
        }
        return rArr;
    }

    /**
     * Backup Tables
     *
     * @param dbHelper
     * @param db
     * @throws Exception
     */
    private void backupTables(SQLiteDatabaseHelper dbHelper, SQLiteDatabase db) throws Exception {
        try {
            List<String> tables = uDrop.getTablesNames(db);
            for (String table : tables) {
                this.backupTable(dbHelper, db, table);
            }
        } catch (Exception e) {
            throw new Exception("Error: backupTables failed " + e);
        }
    }

    /**
     * Backup a Table
     *
     * @param dbHelper
     * @param db
     * @param table
     * @throws Exception
     */
    private void backupTable(SQLiteDatabaseHelper dbHelper, SQLiteDatabase db, String table) throws Exception {
        int changes = Integer.valueOf(-1);
        try {
            // start a transaction
            db.beginTransaction();
            // get the column's name
            List<String> colNames = getColumnNames(dbHelper, db, table);
            this.alterTables.put(table, colNames);
            // prefix the table with _temp_
            String stmt = "ALTER TABLE " + table + " RENAME ";
            stmt += "TO _temp_" + table + ";";
            long lastId = dbHelper.prepareSQL(db, stmt, new JSArray());
            if (lastId != -1) {
                // set the transaction to be successful
                db.setTransactionSuccessful();
                changes = 0;
            }
        } catch (Exception e) {
            throw new Exception("Error: backupTable failed " + e);
        } finally {
            if (changes != -1) {
                // commit the transaction if successful
                db.endTransaction();
            }
        }
    }

    /**
     * Get Column Names for a Given Table
     *
     * @param dbHelper
     * @param db
     * @param table
     * @return
     * @throws Exception
     */
    private List<String> getColumnNames(SQLiteDatabaseHelper dbHelper, SQLiteDatabase db, String table) throws Exception {
        List<String> retNames = new ArrayList<>();
        String query = new StringBuilder("PRAGMA table_info(").append(table).append(");").toString();
        JSArray resQuery = dbHelper.selectSQL(db, query, new ArrayList<String>());
        List<JSObject> lQuery = resQuery.toList();
        if (lQuery.size() > 0) {
            for (JSObject obj : lQuery) {
                retNames.add(obj.getString("name"));
            }
        }
        return retNames;
    }

    /**
     *  Get the Database Version
     *
     * @param dbHelper
     * @param db
     * @return
     * @throws JSONException
     */
    public Integer getDatabaseVersion(SQLiteDatabaseHelper dbHelper, SQLiteDatabase db) throws JSONException {
        int version = -1;
        String pragma = "PRAGMA user_version;";
        JSArray retVersion = dbHelper.selectSQL(db, pragma, new ArrayList<String>());
        List<JSObject> lVersions = retVersion.toList();

        if (lVersions.size() > 0) {
            version = lVersions.get(0).getInt("user_version");
        }
        return version;
    }

    /**
     * Update the Database Version
     *
     * @param dbHelper
     * @param db
     * @param newVersion
     * @return
     * @throws Exception
     */
    public Integer updateDatabaseVersion(SQLiteDatabaseHelper dbHelper, SQLiteDatabase db, int newVersion) throws Exception {
        int changes = -1;
        ArrayList<String> pragmas = new ArrayList<String>();
        pragmas.add("PRAGMA user_version = " + newVersion + ";");

        JSObject result1 = dbHelper.execute(db, pragmas.toArray(new String[pragmas.size()]));
        changes = result1.getInteger("changes");
        return changes;
    }

    /**
     * getVersionUpgradeKeys
     *
     * @param versionUpgrades
     * @return
     */
    public List<String> getVersionUpgradeKeys(Dictionary<String, Dictionary<Integer, JSONObject>> versionUpgrades) {
        List<String> lkeys = new ArrayList<>();
        for (Enumeration<String> keys = versionUpgrades.keys(); keys.hasMoreElements();) {
            String keyVal = keys.nextElement();
            lkeys.add(keyVal);
        }
        return lkeys;
    }

    /**
     * getUpgradeDictKeys
     *
     * @param upgrades
     * @return
     */
    public List<Integer> getUpgradeDictKeys(Dictionary<Integer, JSONObject> upgrades) {
        List<Integer> lkeys = new ArrayList<>();
        for (Enumeration<Integer> keys = upgrades.keys(); keys.hasMoreElements();) {
            Integer keyVal = keys.nextElement();
            lkeys.add(keyVal);
        }
        return lkeys;
    }

    /**
     * getUpgradeKeys
     *
     * @param upgrades
     * @return
     */
    public List<String> getUpgradeKeys(JSONObject upgrades) {
        Iterator keys = upgrades.keys();
        List<String> keysList = new ArrayList<String>();
        while (keys.hasNext()) {
            String key = (String) keys.next();
            keysList.add(key);
        }
        return keysList;
    }
}
