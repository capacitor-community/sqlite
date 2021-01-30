package com.getcapacitor.community.database.sqlite.SQLite.ImportExportJson;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.community.database.sqlite.SQLite.Database;
import com.getcapacitor.community.database.sqlite.SQLite.UtilsSQLite;
import java.util.ArrayList;
import java.util.List;
import org.json.JSONException;

public class ExportToJson {

    private static final String TAG = ImportFromJson.class.getName();
    private UtilsJson uJson = new UtilsJson();
    private UtilsSQLite uSqlite = new UtilsSQLite();

    /**
     * Create Export Json Object from Database (Schema, Data)
     * @param db
     * @param sqlObj
     * @return
     */
    public JsonSQLite createExportObject(Database db, JsonSQLite sqlObj) throws Exception {
        JsonSQLite retObj = new JsonSQLite();

        String stmt = "SELECT name,sql FROM sqlite_master WHERE ";
        stmt += "type = 'table' AND name NOT LIKE 'sqlite_%' AND ";
        stmt += "name NOT LIKE 'android_%' AND ";
        stmt += "name NOT LIKE 'sync_table';";
        ArrayList<JsonTable> tables = new ArrayList<>();
        try {
            JSArray resTables = db.selectSQL(stmt, new ArrayList<String>());
            if (resTables.length() == 0) {
                throw new Exception("Error: createExportObject " + "table's names failed");
            } else {
                switch (sqlObj.getMode()) {
                    case "partial":
                        tables = getTablesPartial(db, resTables);
                        break;
                    case "full":
                        tables = getTablesFull(db, resTables);
                        break;
                    default:
                        throw new Exception("Error: createExportObject " + "expMode " + sqlObj.getMode() + " not defined");
                }
            }
        } catch (Exception e) {
            throw new Exception("Error: createExportObject " + e.getMessage());
        } finally {
            if (tables.size() > 0) {
                retObj.setDatabase(sqlObj.getDatabase());
                retObj.setVersion(sqlObj.getVersion());
                retObj.setEncrypted(sqlObj.getEncrypted());
                retObj.setMode(sqlObj.getMode());
                retObj.setTables(tables);
            }
            return retObj;
        }
    }

    /**
     * get Tables when Mode is Full
     * @param mDb
     * @param resTables
     * @return
     * @throws Exception
     */
    private ArrayList<JsonTable> getTablesFull(Database mDb, JSArray resTables) throws Exception {
        ArrayList<JsonTable> tables = new ArrayList<>();
        try {
            // Loop through tables
            List<JSObject> lTables = resTables.toList();
            for (int i = 0; i < lTables.size(); i++) {
                String tableName;
                String sqlStmt;
                if (lTables.get(i).has("name")) {
                    tableName = lTables.get(i).getString("name");
                } else {
                    throw new Exception("getTablesFull: no name");
                }
                if (lTables.get(i).has("sql")) {
                    sqlStmt = lTables.get(i).getString("sql");
                } else {
                    throw new Exception("getTablesFull: no sql");
                }
                JsonTable table = new JsonTable();
                // create Table's Schema
                ArrayList<JsonColumn> schema = getSchema(sqlStmt);
                if (schema.size() == 0) {
                    throw new Exception("Error: getTablesFull no Schema returned");
                }
                // check schema validity
                uJson.checkSchemaValidity(schema);

                // create Table's indexes if any
                ArrayList<JsonIndex> indexes = getIndexes(mDb, tableName);
                if (indexes.size() > 0) {
                    // check indexes validity
                    uJson.checkIndexesValidity(indexes);
                }
                // create Table's Data
                String query = "SELECT * FROM " + tableName + ";";
                ArrayList<ArrayList<Object>> values = getValues(mDb, query, tableName);

                table.setName(tableName);
                if (schema.size() != 0) {
                    table.setSchema(schema);
                } else {
                    throw new Exception("Error: getTablesFull must contain schema");
                }
                if (indexes.size() != 0) {
                    table.setIndexes(indexes);
                }
                if (values.size() != 0) {
                    table.setValues(values);
                }
                if (table.getKeys().size() <= 1) {
                    throw new Exception("Error: getTablesFull " + "table " + tableName + " is not a jsonTable");
                }
                tables.add(table);
            }
        } catch (Exception e) {
            throw new Exception("Error: getTablesFull " + e.getMessage());
        } finally {
            return tables;
        }
    }

    /**
     * Modify ',' by '§' for Embedded Parentheses
     * @param sqlStmt
     * @return
     */
    private String modEmbeddedParentheses(String sqlStmt) {
        String stmt = sqlStmt;
        int openPar = sqlStmt.indexOf("(");
        if (openPar != -1) {
            int closePar = sqlStmt.lastIndexOf(")");
            String tStmt = sqlStmt.substring(openPar + 1, closePar);
            String mStmt = tStmt.replaceAll(",", "§");
            stmt = sqlStmt.replace(tStmt, mStmt);
        }
        return stmt;
    }

    /**
     * Get Schema
     * @param sqlStmt
     * @return
     */
    private ArrayList<JsonColumn> getSchema(String sqlStmt) {
        ArrayList<JsonColumn> schema = new ArrayList<>();
        // get the sqlStmt between the parenthesis sqlStmt
        sqlStmt = sqlStmt.substring(sqlStmt.indexOf("(") + 1, sqlStmt.lastIndexOf(")"));
        // check if there is other parenthesis and replace the ',' by '§'
        sqlStmt = modEmbeddedParentheses(sqlStmt);
        String[] sch = sqlStmt.split(",");
        // for each element of the array split the
        // first word as key
        for (int j = 0; j < sch.length; j++) {
            String[] row = sch[j].trim().split(" ", 2);
            JsonColumn jsonRow = new JsonColumn();
            if (row[0].toUpperCase().equals("FOREIGN")) {
                Integer oPar = sch[j].indexOf("(");
                Integer cPar = sch[j].indexOf(")");
                row[0] = sch[j].substring(oPar + 1, cPar);
                row[1] = sch[j].substring(cPar + 2);
                jsonRow.setForeignkey(row[0]);
            } else if (row[0].toUpperCase().equals("CONSTRAINT")) {
                String[] tRow = row[1].trim().split(" ", 2);
                row[0] = tRow[0];
                jsonRow.setConstraint(row[0]);
                row[1] = tRow[1];
            } else {
                jsonRow.setColumn(row[0]);
            }
            jsonRow.setValue(row[1].replaceAll("§", ","));
            schema.add(jsonRow);
        }
        return schema;
    }

    /**
     * Get Indexes
     * @param mDb
     * @param tableName
     * @return
     * @throws Exception
     */
    private ArrayList<JsonIndex> getIndexes(Database mDb, String tableName) throws Exception {
        String msg = "Error: getIndexes ";
        ArrayList<JsonIndex> indexes = new ArrayList<>();
        String stmt = "SELECT name,tbl_name,sql FROM ";
        stmt += "sqlite_master WHERE ";
        stmt += "type = 'index' AND tbl_name = '" + tableName;
        stmt += "' AND sql NOTNULL;";
        try {
            JSArray retIndexes = mDb.selectSQL(stmt, new ArrayList<String>());
            List<JSObject> lIndexes = retIndexes.toList();
            if (lIndexes.size() > 0) {
                for (int j = 0; j < lIndexes.size(); j++) {
                    JsonIndex jsonRow = new JsonIndex();
                    if (lIndexes.get(j).getString("tbl_name").equals(tableName)) {
                        jsonRow.setName(lIndexes.get(j).getString("name"));
                        String sql = lIndexes.get(j).getString("sql");
                        if (sql.contains("UNIQUE")) {
                            jsonRow.setMode("UNIQUE");
                        }
                        Integer oPar = sql.lastIndexOf("(");
                        Integer cPar = sql.lastIndexOf(")");
                        jsonRow.setValue(sql.substring(oPar + 1, cPar));
                        indexes.add(jsonRow);
                    } else {
                        throw new Exception(msg + "table name doesn't match");
                    }
                }
            }
        } catch (JSONException e) {
            throw new Exception(msg + e.getMessage());
        } finally {
            return indexes;
        }
    }

    /**
     * Get Tables Values
     * @param mDb
     * @param query
     * @param tableName
     * @return
     * @throws Exception
     */
    private ArrayList<ArrayList<Object>> getValues(Database mDb, String query, String tableName) throws Exception {
        ArrayList<ArrayList<Object>> values = new ArrayList<>();
        try {
            JSObject tableNamesTypes = uJson.getTableColumnNamesTypes(mDb, tableName);
            ArrayList<String> rowNames = new ArrayList<>();
            ArrayList<String> rowTypes = new ArrayList<>();
            if (tableNamesTypes.has("names")) {
                rowNames = (ArrayList<String>) tableNamesTypes.get("names");
            } else {
                throw new Exception("Error: getValues Table " + tableName + " no names");
            }
            if (tableNamesTypes.has("types")) {
                rowTypes = (ArrayList<String>) tableNamesTypes.get("types");
            } else {
                throw new Exception("Error: getValues Table " + tableName + " no types");
            }
            JSArray retValues = mDb.selectSQL(query, new ArrayList<String>());
            List<JSObject> lValues = retValues.toList();
            if (lValues.size() > 0) {
                for (int j = 0; j < lValues.size(); j++) {
                    ArrayList<Object> row = new ArrayList<>();
                    for (int k = 0; k < rowNames.size(); k++) {
                        String nType = rowTypes.get(k);
                        String nName = rowNames.get(k);
                        if (nType.equals("INTEGER")) {
                            if (lValues.get(j).has(nName)) {
                                Object obj = lValues.get(j).get(nName);
                                if (obj instanceof Long) {
                                    row.add(lValues.get(j).getLong(nName));
                                }
                                if (obj instanceof String) {
                                    row.add(lValues.get(j).getString(nName));
                                }
                            } else {
                                row.add("NULL");
                            }
                        } else if (nType.equals("REAL")) {
                            if (lValues.get(j).has(nName)) {
                                Object obj = lValues.get(j).get(nName);
                                if (obj instanceof Double) {
                                    row.add(lValues.get(j).getDouble(nName));
                                }
                                if (obj instanceof String) {
                                    row.add(lValues.get(j).getString(nName));
                                }
                            } else {
                                row.add("NULL");
                            }
                        } else {
                            if (lValues.get(j).has(nName)) {
                                row.add(lValues.get(j).getString(nName));
                            } else {
                                row.add("NULL");
                            }
                        }
                    }
                    values.add(row);
                }
            }
        } catch (Exception e) {
            throw new Exception("Error: getValues " + e.getMessage());
        } finally {
            return values;
        }
    }

    /**
     * Get Tables when Mode is Partial
     * @param mDb
     * @param resTables
     * @return
     * @throws Exception
     */
    private ArrayList<JsonTable> getTablesPartial(Database mDb, JSArray resTables) throws Exception {
        ArrayList<JsonTable> tables = new ArrayList<>();
        long syncDate = 0;
        JSObject modTables = new JSObject();
        ArrayList<String> modTablesKeys = new ArrayList<>();

        try {
            // Get the syncDate and the Modified Tables
            JSObject partialModeData = getPartialModeData(mDb, resTables);
            if (partialModeData.has("syncDate")) {
                syncDate = partialModeData.getLong("syncDate");
            } else {
                throw new Exception("getTablesPartial: no syncDate");
            }
            if (partialModeData.has("modTables")) {
                modTables = partialModeData.getJSObject("modTables");
            } else {
                throw new Exception("getTablesPartial: no modTables");
            }
            modTablesKeys = uJson.getJSObjectKeys(modTables);

            // Loop trough tables
            List<JSObject> lTables = resTables.toList();
            for (int i = 0; i < lTables.size(); i++) {
                String tableName;
                String sqlStmt;
                if (lTables.get(i).has("name")) {
                    tableName = lTables.get(i).getString("name");
                } else {
                    throw new Exception("getTablesPartial: no name");
                }
                if (lTables.get(i).has("sql")) {
                    sqlStmt = lTables.get(i).getString("sql");
                } else {
                    throw new Exception("getTablesPartial: no sql");
                }
                if (modTablesKeys.size() == 0 || modTablesKeys.indexOf(tableName) == -1 || modTables.getString(tableName).equals("No")) {
                    continue;
                }
                JsonTable table = new JsonTable();
                table.setName(tableName);
                ArrayList<JsonColumn> schema = new ArrayList<>();
                ArrayList<JsonIndex> indexes = new ArrayList<>();
                if (modTables.getString(tableName).equals("Create")) {
                    // create Table's Schema
                    schema = getSchema(sqlStmt);
                    if (schema.size() > 0) {
                        // check schema validity
                        uJson.checkSchemaValidity(schema);
                    }

                    // create Table's indexes if any
                    indexes = getIndexes(mDb, tableName);

                    if (indexes.size() > 0) {
                        // check indexes validity
                        uJson.checkIndexesValidity(indexes);
                    }
                }
                // create Table's Data
                String query;
                if (modTables.getString(tableName).equals("Create")) {
                    query = "SELECT * FROM " + tableName + ";";
                } else {
                    query = "SELECT * FROM " + tableName + " WHERE last_modified > " + syncDate + ";";
                }
                ArrayList<ArrayList<Object>> values = getValues(mDb, query, tableName);

                // check the table object validity
                table.setName(tableName);
                if (schema.size() != 0) {
                    table.setSchema(schema);
                }
                if (indexes.size() != 0) {
                    table.setIndexes(indexes);
                }
                if (values.size() != 0) {
                    table.setValues(values);
                }
                if (table.getKeys().size() <= 1) {
                    throw new Exception("Error: getTablesPartial " + "table " + tableName + " is not a jsonTable");
                }
                tables.add(table);
            }
        } catch (Exception e) {
            throw new Exception("Error: getTablesPartial " + e.getMessage());
        } finally {
            return tables;
        }
    }

    /**
     * Get Tables Data when Mode is Partial
     * @param mDb
     * @param resTables
     * @return
     * @throws Exception
     */
    private JSObject getPartialModeData(Database mDb, JSArray resTables) throws Exception {
        JSObject retData = new JSObject();
        Long syncDate;
        JSObject modTables = new JSObject();

        try {
            // get the sync date if expMode = "partial"
            syncDate = getSyncDate(mDb);
            if (syncDate == -1) {
                throw new Exception("Error: getPartialModeData " + "did not find a sync_date");
            }
            // get the tables which have been updated
            // since last synchronization
            modTables = getTablesModified(mDb, resTables, syncDate);
            retData.put("syncDate", syncDate);
            retData.put("modTables", modTables);
        } catch (Exception e) {
            throw new Exception("Error: getPartialModeData " + e.getMessage());
        } finally {
            return retData;
        }
    }

    /**
     * Get Synchronization Date
     * @param mDb
     * @return
     * @throws Exception
     */
    public Long getSyncDate(Database mDb) throws Exception {
        long ret = -1;
        String stmt = "SELECT sync_date FROM sync_table;";
        JSArray retQuery = new JSArray();
        try {
            retQuery = mDb.selectSQL(stmt, new ArrayList<String>());
            List<JSObject> lQuery = retQuery.toList();
            if (lQuery.size() == 1) {
                long syncDate = lQuery.get(0).getLong("sync_date");
                if (syncDate > 0) ret = syncDate;
            }
        } catch (Exception e) {
            throw new Exception("Error: getSyncDate " + e.getMessage());
        } finally {
            return ret;
        }
    }

    /**
     * Get the tables which have been modified since last sync
     * @param mDb
     * @param resTables
     * @param syncDate
     * @return
     * @throws Exception
     */
    private JSObject getTablesModified(Database mDb, JSArray resTables, Long syncDate) throws Exception {
        JSObject retObj = new JSObject();
        try {
            List<JSObject> lTables = resTables.toList();
            for (int i = 0; i < lTables.size(); i++) {
                String mode;
                String tableName;
                if (lTables.get(i).has("name")) {
                    tableName = lTables.get(i).getString("name");
                } else {
                    throw new Exception("getTablesModified: no name");
                }
                String stmt = "SELECT count(*) AS count FROM " + tableName + ";";
                JSArray retQuery = mDb.selectSQL(stmt, new ArrayList<String>());
                List<JSObject> lQuery = retQuery.toList();
                if (lQuery.size() != 1) break;
                long totalCount = lQuery.get(0).getLong("count");
                // get total count of modified since last sync
                stmt = "SELECT count(*) AS count FROM " + tableName + " WHERE last_modified > " + syncDate + ";";
                retQuery = mDb.selectSQL(stmt, new ArrayList<String>());
                lQuery = retQuery.toList();
                if (lQuery.size() != 1) break;
                long totalModCnt = lQuery.get(0).getLong("count");
                if (totalModCnt == 0) {
                    mode = "No";
                } else if (totalCount == totalModCnt) {
                    mode = "Create";
                } else {
                    mode = "Modified";
                }
                retObj.put(tableName, mode);
            }
        } catch (Exception e) {
            throw new Exception("Error: getTablesModified " + e.getMessage());
        } finally {
            return retObj;
        }
    }
}
