package com.getcapacitor.community.database.sqlite.SQLite;

import android.content.Context;
import android.util.Log;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.community.database.sqlite.SQLite.ImportExportJson.UtilsJson;
import java.util.ArrayList;
import java.util.Date;
import java.util.Dictionary;
import java.util.Hashtable;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class UtilsUpgrade {

    private static final String TAG = UtilsUpgrade.class.getName();
    private UtilsFile _uFile = new UtilsFile();
    private UtilsJson _uJson = new UtilsJson();
    private UtilsDrop _uDrop = new UtilsDrop();
    private UtilsSQLite _uSqlite = new UtilsSQLite();
    private Dictionary<String, List<String>> _alterTables = new Hashtable<>();
    private Dictionary<String, List<String>> _commonColumns = new Hashtable<>();

    /**
     * OnUpgrade Method
     * Database version upgrade flow process
     * @param db
     * @param context
     * @param dbName
     * @param upgDict
     * @param curVersion
     * @param targetVersion
     * @throws Exception
     */
    public void onUpgrade(
        Database db,
        Context context,
        String dbName,
        Dictionary<Integer, JSONObject> upgDict,
        Integer curVersion,
        Integer targetVersion
    ) throws Exception {
        JSONObject upgrade = upgDict.get(curVersion);
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
        // Set Foreign Key Off
        try {
            db.getDb().setForeignKeyConstraintsEnabled(false);
        } catch (IllegalStateException e) {
            String msg = "Error: onUpgrade ";
            msg += "setForeignKeyConstraintsEnabled failed " + e;
            throw new Exception(msg);
        }
        // backup the database

        Boolean ret = this._uFile.copyFile(context, dbName, "backup-" + dbName);
        if (!ret) {
            String msg = "Error: onUpgrade ";
            msg += "copy backup file failed ";
            throw new Exception(msg);
        }
        // Here we assume all the tables schema are given in
        // the upgrade statement
        if (statement.length() > 0) {
            try {
                executeStatementProcess(db, statement);
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
                executeSetProcess(db, set, toVersion);
            } catch (Exception e) {
                String msg = "Error: onUpgrade executeSetProcess";
                msg += " failed " + e;
                throw new Exception(msg);
            }
        }
        // Set pragma FOREIGN KEY ON
        try {
            db.getDb().setForeignKeyConstraintsEnabled(true);
        } catch (IllegalStateException e) {
            String msg = "Error: onUpgrade ";
            msg += "setForeignKeyConstraintsEnabled failed " + e;
            throw new Exception(msg);
        }
    }

    /**
     * ExecuteStatementProcess Method
     * Execute Statement Flow Process
     *
     * @param db
     * @param statement
     * @throws Exception
     */
    private void executeStatementProcess(Database db, String statement) throws Exception {
        int changes = Integer.valueOf(-1);
        try {
            // -> backup all existing tables  "tableName" in
            //    "temp_tableName"
            backupTables(db);

            // -> Drop all Indexes
            _uDrop.dropIndexes(db);

            // -> Drop all Triggers
            _uDrop.dropTriggers(db);

            // -> Create new tables from upgrade.statement

            String[] sqlCmdArray = _uSqlite.getStatementsArray(statement);

            JSObject retObj = db.execute(sqlCmdArray);
            changes = retObj.getInteger("changes");
            if (changes < Integer.valueOf(0)) {
                throw new Exception("create new tables failed");
            }

            // -> Create the list of table's common fields
            findCommonColumns(db);

            // -> Update the new table's data from old table's data
            updateNewTablesData(db);

            // -> Drop _temp_tables
            _uDrop.dropTempTables(db, _alterTables);

            // -> Do some cleanup
            _alterTables = new Hashtable<>();
            _commonColumns = new Hashtable<>();
        } catch (Exception e) {
            throw new Exception("Error: executeStatementProcess " + " failed " + e);
        }
    }

    /**
     * BackupTables Method
     * Backup all Tables of a database
     *
     * @param db
     * @throws Exception
     */
    private void backupTables(Database db) throws Exception {
        try {
            List<String> tables = _uDrop.getTablesNames(db);
            for (String table : tables) {
                this.backupTable(db, table);
            }
        } catch (Exception e) {
            throw new Exception("Error: backupTables failed " + e);
        }
    }

    /**
     * BackupTable Method
     * Backup a Table
     *
     * @param db
     * @param table
     * @throws Exception
     */
    private void backupTable(Database db, String table) throws Exception {
        int changes = Integer.valueOf(-1);
        try {
            // get the column's name
            List<String> colNames = getColumnNames(db, table);
            _alterTables.put(table, colNames);
            // prefix the table with _temp_
            String stmt = "ALTER TABLE " + table + " RENAME ";
            stmt += "TO _temp_" + table + ";";
            JSObject ret = db.runSQL(stmt, new ArrayList<>());
            long lastId = ret.getLong("lastId");
            if (lastId == -1) {
                throw new Exception("lastId = -1");
            }
        } catch (Exception e) {
            throw new Exception("Error: backupTable failed " + e);
        }
    }

    /**
     * GetColumnNames Method
     * Get Column Names for a Given Table
     *
     * @param db
     * @param table
     * @return
     * @throws Exception
     */
    private List<String> getColumnNames(Database db, String table) throws Exception {
        List<String> retNames = new ArrayList<>();
        String query = new StringBuilder("PRAGMA table_info(").append(table).append(");").toString();
        JSArray resQuery = db.selectSQL(query, new ArrayList<Object>());
        List<JSObject> lQuery = resQuery.toList();
        if (lQuery.size() > 0) {
            for (JSObject obj : lQuery) {
                retNames.add(obj.getString("name"));
            }
        }
        return retNames;
    }

    /**
     * FindCommonColumns Method
     * Find Common Columns
     *
     * @param db
     * @throws Exception
     */
    private void findCommonColumns(Database db) throws Exception {
        List<String> columnNames = new ArrayList<>();
        try {
            List<String> tables = _uDrop.getTablesNames(db);
            for (String table : tables) {
                columnNames = getColumnNames(db, table);
                List<String> arr = _alterTables.get(table);
                if (arr != null && arr.size() > 0) {
                    List<String> comCols = arrayIntersection(arr, columnNames);
                    _commonColumns.put(table, comCols);
                }
            }
        } catch (Exception e) {
            throw new Exception("findCommonColumns failed " + e);
        }
    }

    /**
     * ArrayIntersection Method
     * Calculate Two Arrays Intersection
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
     * UpdateNewTablesData Method
     * Update the New Table's Data from Old Table's Data
     *
     * @param db
     * @throws Exception
     */
    private void updateNewTablesData(Database db) throws Exception {
        int changes = Integer.valueOf(-1);
        try {
            List<String> statements = new ArrayList<>();
            List<String> keys = _uDrop.getDictStringKeys(_commonColumns);
            for (String key : keys) {
                List<String> values = _commonColumns.get(key);
                if (values.size() > 0) {
                    String columns = _uJson.convertToString((ArrayList<String>) values, ',');

                    String stmt = "INSERT INTO " + key + " ";
                    stmt += "(" + columns + ") SELECT ";
                    stmt += columns + " FROM _temp_" + key + ";";
                    statements.add(stmt);
                }
            }
            if (statements.size() > 0) {
                JSObject retObj = db.execute(statements.toArray(new String[0]));
                changes = retObj.getInteger("changes");
                if (changes < Integer.valueOf(0)) {
                    throw new Exception("updateNewTablesData failed");
                }
            }
        } catch (Exception e) {
            throw new Exception("updateNewTablesData failed " + e);
        }
    }

    /**
     * ExecuteSetProcess Method
     * Execute Set Flow Process
     *
     * @param db
     * @param set
     * @param toVersion
     * @throws Exception
     */
    private void executeSetProcess(Database db, JSONArray set, int toVersion) throws Exception {
        try {
            // -> load new data
            JSArray jsSet = convertJSONArrayToJSArray(set);
            JSObject retObj = db.executeSet(jsSet);
            if (retObj.getInt("lastId") < 0) {
                throw new Exception("load new data failed");
            }
            // -> update database version
            db.getDb().setVersion(toVersion);
            // -> update syncDate if any
            Boolean isExists = _uJson.isTableExists(db, "sync_table");
            if (isExists) {
                Date date = new Date();
                long syncTime = date.getTime() / 1000L;
                String stmt = "UPDATE sync_table SET ";
                stmt += "sync_date = " + syncTime;
                stmt += " WHERE id = 1;";
                try {
                    db.runSQL(stmt, new ArrayList<>());
                } catch (Exception e) {
                    throw new Exception("executeSetProcess failed" + e.getMessage());
                }
            }
        } catch (Exception e) {
            throw new Exception("Error: executeSetProcess failed " + e.getMessage());
        }
    }

    /**
     * ConvertJSONArrayToJSArray Method
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
}
