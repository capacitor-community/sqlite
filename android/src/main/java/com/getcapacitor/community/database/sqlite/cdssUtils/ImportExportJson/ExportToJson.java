package com.getcapacitor.community.database.sqlite.cdssUtils.ImportExportJson;

import android.util.Log;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.community.database.sqlite.cdssUtils.SQLiteDatabaseHelper;
import com.getcapacitor.community.database.sqlite.cdssUtils.UtilsSQLite;
import java.util.ArrayList;
import java.util.List;
import net.sqlcipher.database.SQLiteDatabase;
import org.json.JSONException;

public class ExportToJson {
    private static final String TAG = ImportFromJson.class.getName();
    private UtilsJson uJson = new UtilsJson();
    private UtilsSQLite uSqlite = new UtilsSQLite();

    /**
     * Create Json Tables for the export to Json
     * @param dbHelper
     * @param sqlObj
     * @param secret
     * @return
     */
    public JsonSQLite createJsonTables(SQLiteDatabaseHelper dbHelper, JsonSQLite sqlObj, String secret) {
        boolean success = true;
        JsonSQLite retObj = new JsonSQLite();
        SQLiteDatabase db = null;
        ArrayList<JsonTable> jsonTables = new ArrayList<>();
        long syncDate = 0;

        try {
            db = dbHelper.getConnection(true, secret);
            String stmt = "SELECT name,sql FROM sqlite_master WHERE ";
            stmt += "type = 'table' AND name NOT LIKE 'sqlite_%' AND ";
            stmt += "name NOT LIKE 'sync_table';";
            JSArray tables = dbHelper.selectSQL(db, stmt, new ArrayList<String>());
            if (tables.length() == 0) {
                throw new Exception("Error get table's names failed");
            }
            JSObject modTables = new JSObject();
            ArrayList<String> modTablesKeys = new ArrayList<>();
            if (sqlObj.getMode().equals("partial")) {
                syncDate = this.getSyncDate(dbHelper, db);
                if (syncDate == -1) {
                    throw new Exception("Error did not find a " + "sync_date");
                }
                modTables = this.getTablesModified(dbHelper, db, tables, syncDate);
                modTablesKeys = uJson.getJSObjectKeys(modTables);
            }
            List<JSObject> lTables = tables.toList();
            for (int i = 0; i < lTables.size(); i++) {
                String tableName = lTables.get(i).getString("name");
                String sqlStmt = lTables.get(i).getString("sql");
                if (
                    sqlObj.getMode().equals("partial") &&
                    (modTablesKeys.size() == 0 || modTablesKeys.indexOf(tableName) == -1 || modTables.getString(tableName).equals("No"))
                ) {
                    continue;
                }
                JsonTable table = new JsonTable();
                boolean isSchema = false;
                boolean isIndexes = false;
                boolean isValues = false;
                table.setName(tableName);
                if (
                    sqlObj.getMode().equals("full") ||
                    (sqlObj.getMode().equals("partial") && modTables.getString(tableName).equals("Create"))
                ) {
                    // create the schema
                    ArrayList<JsonColumn> schema = new ArrayList<JsonColumn>();
                    // get the sqlStmt between the parenthesis sqlStmt
                    sqlStmt = sqlStmt.substring(sqlStmt.indexOf("(") + 1, sqlStmt.lastIndexOf(")"));
                    String[] sch = sqlStmt.split(",");
                    // for each element of the array split the
                    // first word as key
                    for (int j = 0; j < sch.length; j++) {
                        String[] row = sch[j].split(" ", 2);
                        JsonColumn jsonRow = new JsonColumn();
                        if (row[0].toUpperCase().equals("FOREIGN")) {
                            Integer oPar = sch[j].indexOf("(");
                            Integer cPar = sch[j].indexOf(")");
                            row[0] = sch[j].substring(oPar + 1, cPar);
                            row[1] = sch[j].substring(cPar + 2);
                            jsonRow.setForeignkey(row[0]);
                        } else {
                            jsonRow.setColumn(row[0]);
                        }
                        jsonRow.setValue(row[1]);
                        schema.add(jsonRow);
                    }
                    table.setSchema(schema);
                    isSchema = true;

                    // create the indexes
                    stmt = "SELECT name,tbl_name,sql FROM " + "sqlite_master WHERE ";
                    stmt += "type = 'index' AND tbl_name = '" + tableName + "' AND sql NOTNULL;";
                    JSArray retIndexes = dbHelper.selectSQL(db, stmt, new ArrayList<String>());
                    List<JSObject> lIndexes = retIndexes.toList();
                    if (lIndexes.size() > 0) {
                        ArrayList<JsonIndex> indexes = new ArrayList<JsonIndex>();
                        for (int j = 0; j < lIndexes.size(); j++) {
                            JsonIndex jsonRow = new JsonIndex();
                            if (lIndexes.get(j).getString("tbl_name").equals(tableName)) {
                                jsonRow.setName(lIndexes.get(j).getString("name"));
                                String sql = lIndexes.get(j).getString("sql");
                                Integer oPar = sql.lastIndexOf("(");
                                Integer cPar = sql.lastIndexOf(")");
                                jsonRow.setColumn(sql.substring(oPar + 1, cPar));
                                indexes.add(jsonRow);
                            } else {
                                success = false;
                                throw new Exception("createJsonTables:Error indexes " + "table name doesn't match");
                            }
                        }
                        table.setIndexes(indexes);
                        isIndexes = true;
                    }
                }

                JSObject tableNamesTypes = uJson.getTableColumnNamesTypes(dbHelper, db, tableName);
                ArrayList<String> rowNames = (ArrayList<String>) tableNamesTypes.get("names");
                ArrayList<String> rowTypes = (ArrayList<String>) tableNamesTypes.get("types");
                // create the data
                if (
                    sqlObj.getMode().equals("full") ||
                    (sqlObj.getMode().equals("partial") && modTables.getString(tableName).equals("Create"))
                ) {
                    stmt = "SELECT * FROM " + tableName + ";";
                } else {
                    stmt = "SELECT * FROM " + tableName + " WHERE last_modified > " + syncDate + ";";
                }
                JSArray retValues = dbHelper.selectSQL(db, stmt, new ArrayList<String>());
                List<JSObject> lValues = retValues.toList();
                if (lValues.size() > 0) {
                    ArrayList<ArrayList<Object>> values = new ArrayList<>();
                    for (int j = 0; j < lValues.size(); j++) {
                        ArrayList<Object> row = new ArrayList<>();
                        for (int k = 0; k < rowNames.size(); k++) {
                            if (rowTypes.get(k).equals("INTEGER")) {
                                if (lValues.get(j).has(rowNames.get(k))) {
                                    row.add(lValues.get(j).getLong(rowNames.get(k)));
                                } else {
                                    row.add("NULL");
                                }
                            } else if (rowTypes.get(k).equals("REAL")) {
                                if (lValues.get(j).has(rowNames.get(k))) {
                                    row.add(lValues.get(j).getDouble(rowNames.get(k)));
                                } else {
                                    row.add("NULL");
                                }
                            } else {
                                if (lValues.get(j).has(rowNames.get(k))) {
                                    row.add(lValues.get(j).getString(rowNames.get(k)));
                                } else {
                                    row.add("NULL");
                                }
                            }
                        }
                        values.add(row);
                    }
                    table.setValues(values);
                    isValues = true;
                }
                if (table.getKeys().size() < 1 || (!isSchema && !isIndexes && !isValues)) {
                    success = false;
                    throw new Exception("Error table is not a " + "jsonTable");
                }
                jsonTables.add(table);
            }
        } catch (Exception e) {
            success = false;
            Log.d(TAG, "Error: createJsonTables failed: ", e);
        } finally {
            if (db != null) db.close();
            if (success) {
                retObj.setDatabase(sqlObj.getDatabase());
                retObj.setMode(sqlObj.getMode());
                retObj.setEncrypted(sqlObj.getEncrypted());
                retObj.setTables(jsonTables);
            }

            return retObj;
        }
    }

    /**
     * Get the Tables which have been modified since
     * the last synchronization
     * @param dbHelper
     * @param db
     * @param tables
     * @param syncDate
     * @return
     * @throws JSONException
     */
    private JSObject getTablesModified(SQLiteDatabaseHelper dbHelper, SQLiteDatabase db, JSArray tables, long syncDate)
        throws JSONException {
        JSObject retModified = new JSObject();
        if (tables.length() > 0) {
            List<JSObject> lTables = tables.toList();

            for (int i = 0; i < lTables.size(); i++) {
                String mode;
                // get total count of the table
                String tableName = lTables.get(i).getString("name");
                String stmt = "SELECT count(*) FROM " + tableName + ";";
                JSArray retQuery = dbHelper.selectSQL(db, stmt, new ArrayList<String>());
                List<JSObject> lQuery = retQuery.toList();
                if (lQuery.size() != 1) break;
                long totalCount = lQuery.get(0).getLong("count(*)");
                // get total count of modified since last sync
                stmt = "SELECT count(*) FROM " + tableName + " WHERE last_modified > " + syncDate + ";";
                retQuery = dbHelper.selectSQL(db, stmt, new ArrayList<String>());
                lQuery = retQuery.toList();
                if (lQuery.size() != 1) break;
                long totalModifiedCount = lQuery.get(0).getLong("count(*)");
                if (totalModifiedCount == 0) {
                    mode = "No";
                } else if (totalCount == totalModifiedCount) {
                    mode = "Create";
                } else {
                    mode = "Modified";
                }
                retModified.put(tableName, mode);
            }
        }
        return retModified;
    }

    /**
     * Get the current synchronization date from the sync_table
     * @param dbHelper
     * @param db
     * @return
     * @throws JSONException
     */
    public long getSyncDate(SQLiteDatabaseHelper dbHelper, SQLiteDatabase db) throws JSONException {
        long ret = -1;
        String stmt = "SELECT sync_date FROM sync_table;";
        JSArray retQuery = dbHelper.selectSQL(db, stmt, new ArrayList<String>());
        List<JSObject> lQuery = retQuery.toList();
        if (lQuery.size() == 1) {
            long syncDate = lQuery.get(0).getLong("sync_date");
            if (syncDate > 0) ret = syncDate;
        }
        return ret;
    }
}
