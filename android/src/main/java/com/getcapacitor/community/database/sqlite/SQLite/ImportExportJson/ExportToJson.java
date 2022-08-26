package com.getcapacitor.community.database.sqlite.SQLite.ImportExportJson;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.community.database.sqlite.NotificationCenter;
import com.getcapacitor.community.database.sqlite.SQLite.Database;
import com.getcapacitor.community.database.sqlite.SQLite.UtilsDrop;
import com.getcapacitor.community.database.sqlite.SQLite.UtilsSQLite;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.json.JSONException;
import org.json.JSONObject;

public class ExportToJson {

    private static final String TAG = ImportFromJson.class.getName();
    private UtilsJson uJson = new UtilsJson();
    private UtilsSQLite uSqlite = new UtilsSQLite();
    private UtilsDrop _uDrop = new UtilsDrop();

    /**
     * Notify progress export event
     * @param msg
     */
    public void notifyExportProgressEvent(String msg) {
        String message = "Export: " + msg;
        Map<String, Object> info = new HashMap<String, Object>() {
            {
                put("progress", message);
            }
        };
        NotificationCenter.defaultCenter().postNotification("exportJsonProgress", info);
    }

    /**
     * GetLastExportDate method
     * get the last export date
     *
     * @return
     * @throws Exception
     */
    public Long getLastExportDate(Database mDb) throws Exception {
        long lastExportDate = -1;
        String stmt = "SELECT sync_date FROM sync_table WHERE id = 2;";
        JSArray retQuery = new JSArray();

        try {
            boolean isSyncTable = uJson.isTableExists(mDb, "sync_table");
            if (!isSyncTable) {
                throw new Exception("GetSyncDate: No sync_table available");
            }
            retQuery = mDb.selectSQL(stmt, new ArrayList<Object>());
            List<JSObject> lQuery = retQuery.toList();
            if (lQuery.size() == 1) {
                long syncDate = lQuery.get(0).getLong("sync_date");
                if (syncDate > 0) lastExportDate = syncDate;
            }
        } catch (Exception e) {
            throw new Exception("GetSyncDate: " + e.getMessage());
        } finally {
            return lastExportDate;
        }
    }

    public void setLastExportDate(Database mDb, Long sTime) throws Exception {
        try {
            boolean isSyncTable = uJson.isTableExists(mDb, "sync_table");
            if (!isSyncTable) {
                throw new Exception("SetLastExportDate: No sync_table available");
            }
            String stmt = "";
            Long lastExportDate = getLastExportDate(mDb);
            if (lastExportDate > 0) {
                stmt = "UPDATE sync_table SET sync_date = " + sTime + " WHERE id = 2;";
            } else {
                stmt = "INSERT INTO sync_table (sync_date) VALUES (" + sTime + ");";
            }
            long lastId = mDb.prepareSQL(stmt, new ArrayList<>(), false);
            if (lastId < 0) {
                throw new Exception("SetLastExportDate: lastId < 0");
            }
            return;
        } catch (Exception e) {
            throw new Exception("SetLastExportDate: " + e.getMessage());
        }
    }

    /**
     * Delete Exported Rows
     * @throws Exception
     */
    public void delExportedRows(Database mDb) throws Exception {
        try {
            // check if 'sync_table' exists
            boolean isSyncTable = uJson.isTableExists(mDb, "sync_table");
            if (!isSyncTable) {
                throw new Exception("DelExportedRows: No sync_table available");
            }
            // get the last export date
            long lastExportDate = getLastExportDate(mDb);
            if (lastExportDate < 0) {
                throw new Exception("DelExportedRows: No last exported date available");
            }
            // get the table' name list
            List<String> tables = _uDrop.getTablesNames(mDb);
            if (tables.size() == 0) {
                throw new Exception("DelExportedRows: No table's names returned");
            }
            // Loop through the tables
            for (String table : tables) {
                long lastId = -1;
                // define the delete statement
                String delStmt = "DELETE FROM " + table + " WHERE sql_deleted = 1 " + "AND last_modified < " + lastExportDate + ";";
                lastId = mDb.prepareSQL(delStmt, new ArrayList<>(), true);
                if (lastId < 0) {
                    throw new Exception("SetLastExportDate: lastId < 0");
                }
            }
            return;
        } catch (Exception e) {
            throw new Exception("DelExportedRows: " + e.getMessage());
        }
    }

    /**
     * Create Export Json Object from Database (Schema, Data)
     * @param db
     * @param sqlObj
     * @return
     */
    public JsonSQLite createExportObject(Database db, JsonSQLite sqlObj) throws Exception {
        JsonSQLite retObj = new JsonSQLite();
        ArrayList<JsonView> views = new ArrayList<>();
        ArrayList<JsonTable> tables = new ArrayList<>();
        Boolean isSyncTable = false;
        try {
            // Get Views
            String stmtV = "SELECT name,sql FROM sqlite_master WHERE ";
            stmtV += "type = 'view' AND name NOT LIKE 'sqlite_%';";
            JSArray resViews = db.selectSQL(stmtV, new ArrayList<Object>());
            if (resViews.length() > 0) {
                for (int i = 0; i < resViews.length(); i++) {
                    JSONObject oView = resViews.getJSONObject(i);
                    JsonView v = new JsonView();
                    String val = (String) oView.get("sql");
                    val = val.substring(val.indexOf("AS ") + 3);
                    v.setName((String) oView.get("name"));
                    v.setValue(val);
                    views.add(v);
                }
            }
            // Get Tables
            String stmt = "SELECT name,sql FROM sqlite_master WHERE ";
            stmt += "type = 'table' AND name NOT LIKE 'sqlite_%' AND ";
            stmt += "name NOT LIKE 'android_%' AND ";
            stmt += "name NOT LIKE 'sync_table';";
            JSArray resTables = db.selectSQL(stmt, new ArrayList<Object>());
            if (resTables.length() == 0) {
                throw new Exception("CreateExportObject: table's names failed");
            } else {
                isSyncTable = uJson.isTableExists(db, "sync_table");
                if (!isSyncTable && sqlObj.getMode().equals("partial")) {
                    throw new Exception("No sync_table available");
                }

                switch (sqlObj.getMode()) {
                    case "partial":
                        tables = getTablesPartial(db, resTables);
                        break;
                    case "full":
                        tables = getTablesFull(db, resTables);
                        break;
                    default:
                        throw new Exception("CreateExportObject: expMode " + sqlObj.getMode() + " not defined");
                }
                if (tables.size() > 0) {
                    retObj.setDatabase(sqlObj.getDatabase());
                    retObj.setVersion(sqlObj.getVersion());
                    retObj.setEncrypted(sqlObj.getEncrypted());
                    retObj.setMode(sqlObj.getMode());
                    retObj.setTables(tables);
                    if (views.size() > 0) {
                        retObj.setViews(views);
                    }
                }
                return retObj;
            }
        } catch (Exception e) {
            throw new Exception("CreateExportObject: " + e.getMessage());
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
                    throw new Exception("GetTablesFull: no name");
                }
                if (lTables.get(i).has("sql")) {
                    sqlStmt = lTables.get(i).getString("sql");
                } else {
                    throw new Exception("GetTablesFull: no sql");
                }
                JsonTable table = new JsonTable();
                // create Table's Schema
                ArrayList<JsonColumn> schema = getSchema(sqlStmt);
                if (schema.size() == 0) {
                    throw new Exception("GetTablesFull: no Schema returned");
                }
                // check schema validity
                uJson.checkSchemaValidity(schema);

                // create Table's indexes if any
                ArrayList<JsonIndex> indexes = getIndexes(mDb, tableName);
                if (indexes.size() > 0) {
                    // check indexes validity
                    uJson.checkIndexesValidity(indexes);
                }
                // create Table's triggers if any
                ArrayList<JsonTrigger> triggers = getTriggers(mDb, tableName);
                if (triggers.size() > 0) {
                    // check triggers validity
                    uJson.checkTriggersValidity(triggers);
                }

                // create Table's Data
                String query = "SELECT * FROM " + tableName + ";";
                ArrayList<ArrayList<Object>> values = uJson.getValues(mDb, query, tableName);

                table.setName(tableName);
                if (schema.size() != 0) {
                    table.setSchema(schema);
                } else {
                    throw new Exception("GetTablesFull: must contain schema");
                }
                if (indexes.size() != 0) {
                    table.setIndexes(indexes);
                }
                if (triggers.size() != 0) {
                    table.setTriggers(triggers);
                }
                String msg = "Full: Table ".concat(tableName).concat(" schema export completed");
                msg += " " + (i + 1) + "/" + lTables.size() + " ...";
                notifyExportProgressEvent(msg);
                if (values.size() != 0) {
                    table.setValues(values);
                }
                if (table.getKeys().size() <= 1) {
                    throw new Exception("GetTablesFull: table " + tableName + " is not a jsonTable");
                }
                tables.add(table);
                msg = "Full: Table ".concat(tableName).concat(" data export completed");
                msg += " " + (i + 1) + "/" + lTables.size() + " ...";
                notifyExportProgressEvent(msg);
            }
        } catch (Exception e) {
            throw new Exception("GetTablesFull: " + e.getMessage());
        } finally {
            String msg = "Full: Table's export completed";
            notifyExportProgressEvent(msg);
            return tables;
        }
    }

    /**
     * Modify ',' by '§' for Embedded Parentheses
     * @param sqlStmt
     * @return
     */
    private String modEmbeddedParentheses(String sqlStmt) throws Exception {
        String stmt = sqlStmt;
        List<Integer> oPars = getIndices(stmt, "(");
        List<Integer> cPars = getIndices(stmt, ")");
        if (oPars.size() != cPars.size()) {
            throw new Exception("ModEmbeddedParentheses: Not same number of " + "opening and closing parentheses");
        }
        if (oPars.size() == 0) return stmt;
        String resStmt = stmt.substring(0, oPars.get(0) - 1);
        for (int i = 0; i < oPars.size(); i++) {
            String str;
            if (i < oPars.size() - 1) {
                if (oPars.get(i + 1) < cPars.get(i)) {
                    str = stmt.substring(oPars.get(i) - 1, cPars.get(i + 1));
                    i++;
                } else {
                    str = stmt.substring(oPars.get(i) - 1, cPars.get(i));
                }
            } else {
                str = stmt.substring(oPars.get(i) - 1, cPars.get(i));
            }
            String newS = str.replaceAll(",", "§");
            resStmt += newS;
            if (i < oPars.size() - 1) {
                resStmt += stmt.substring(cPars.get(i), oPars.get(i + 1) - 1);
            }
        }
        resStmt += stmt.substring(cPars.get(cPars.size() - 1), stmt.length());
        return resStmt;
    }

    private List<Integer> getIndices(String textString, String search) {
        List<Integer> indexes = new ArrayList<Integer>();

        int index = 0;
        while (index != -1) {
            index = textString.indexOf(search, index);
            if (index != -1) {
                indexes.add(index);
                index++;
            }
        }
        return indexes;
    }

    /**
     * Get Schema
     * @param sqlStmt
     * @return
     */
    private ArrayList<JsonColumn> getSchema(String sqlStmt) throws Exception {
        String msg = "GetSchema: ";
        ArrayList<JsonColumn> schema = new ArrayList<>();
        // get the sqlStmt between the parenthesis sqlStmt
        sqlStmt = sqlStmt.substring(sqlStmt.indexOf("(") + 1, sqlStmt.lastIndexOf(")"));
        // check if there is other parenthesis and replace the ',' by '§'
        try {
            sqlStmt = modEmbeddedParentheses(sqlStmt);
            String[] sch = sqlStmt.split(",");
            // for each element of the array split the
            // first word as key
            for (int j = 0; j < sch.length; j++) {
                String sc = sch[j].replaceAll("\n", "").trim();
                String[] row = sc.trim().split(" ", 2);
                JsonColumn jsonRow = new JsonColumn();
                Integer oPar;
                Integer cPar;
                switch (row[0].toUpperCase()) {
                    case "FOREIGN":
                        oPar = sc.indexOf("(");
                        cPar = sc.indexOf(")");
                        String fk = sc.substring(oPar + 1, cPar);
                        row[0] = fk.replaceAll("§", ",");
                        row[1] = sc.substring(cPar + 2);
                        jsonRow.setForeignkey(row[0]);
                        break;
                    case "PRIMARY":
                        oPar = sc.indexOf("(");
                        cPar = sc.indexOf(")");
                        String pk = sc.substring(oPar + 1, cPar);
                        row[0] = "CPK_" + pk.replaceAll("§", "_");
                        row[0] = row[0].replaceAll("_ ", "_");
                        row[1] = sc.substring(cPar + 2);
                        jsonRow.setConstraint(row[0]);
                        break;
                    case "CONSTRAINT":
                        String[] tRow = row[1].trim().split(" ", 2);
                        row[0] = tRow[0];
                        jsonRow.setConstraint(row[0]);
                        row[1] = tRow[1];
                        break;
                    default:
                        jsonRow.setColumn(row[0]);
                }
                jsonRow.setValue(row[1].replaceAll("§", ","));
                schema.add(jsonRow);
            }
        } catch (JSONException e) {
            throw new Exception(msg + e.getMessage());
        } finally {
            return schema;
        }
    }

    /**
     * Get Indexes
     * @param mDb
     * @param tableName
     * @return
     * @throws Exception
     */
    private ArrayList<JsonIndex> getIndexes(Database mDb, String tableName) throws Exception {
        String msg = "GetIndexes: ";
        ArrayList<JsonIndex> indexes = new ArrayList<>();
        String stmt = "SELECT name,tbl_name,sql FROM ";
        stmt += "sqlite_master WHERE ";
        stmt += "type = 'index' AND tbl_name = '" + tableName;
        stmt += "' AND sql NOTNULL;";
        try {
            JSArray retIndexes = mDb.selectSQL(stmt, new ArrayList<Object>());
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
     * Get Triggers
     * @param mDb
     * @param tableName
     * @return
     * @throws Exception
     */
    private ArrayList<JsonTrigger> getTriggers(Database mDb, String tableName) throws Exception {
        String msg = "Error: getTriggers ";
        ArrayList<JsonTrigger> triggers = new ArrayList<>();
        String stmt = "SELECT name,tbl_name,sql FROM ";
        stmt += "sqlite_master WHERE ";
        stmt += "type = 'trigger' AND tbl_name = '" + tableName;
        stmt += "' AND sql NOTNULL;";
        try {
            JSArray retTriggers = mDb.selectSQL(stmt, new ArrayList<Object>());
            List<JSObject> lTriggers = retTriggers.toList();
            if (lTriggers.size() > 0) {
                for (int j = 0; j < lTriggers.size(); j++) {
                    JsonTrigger jsonRow = new JsonTrigger();
                    if (lTriggers.get(j).getString("tbl_name").equals(tableName)) {
                        String name = lTriggers.get(j).getString("name");
                        String sql = lTriggers.get(j).getString("sql");
                        String[] sqlArr = sql.split(name);
                        if (sqlArr.length != 2) {
                            throw new Exception(msg + "sql split name does not return 2 values");
                        }
                        if (!sqlArr[1].contains(tableName)) {
                            throw new Exception(msg + "sql split does not contains " + tableName);
                        }
                        String timeEvent = sqlArr[1].split(tableName)[0].trim();
                        sqlArr = sqlArr[1].split(timeEvent + ' ' + tableName);
                        if (sqlArr.length != 2) {
                            throw new Exception(msg + "sql split tableName does not return 2 values");
                        }
                        String condition = "";
                        String logic = "";
                        if (!sqlArr[1].trim().substring(0, 5).toUpperCase().equals("BEGIN")) {
                            sqlArr = sqlArr[1].trim().split("BEGIN");
                            if (sqlArr.length != 2) {
                                throw new Exception(msg + "sql split BEGIN does not return 2 values");
                            }
                            condition = sqlArr[0].trim();
                            logic = "BEGIN" + sqlArr[1];
                        } else {
                            logic = sqlArr[1].trim();
                        }
                        if (timeEvent.toUpperCase().endsWith(" ON")) {
                            timeEvent = timeEvent.substring(0, timeEvent.length() - 3);
                        }
                        jsonRow.setName(name);
                        jsonRow.setTimeevent(timeEvent);
                        jsonRow.setLogic(logic);
                        if (condition.length() > 0) jsonRow.setCondition(condition);
                        triggers.add(jsonRow);
                    } else {
                        throw new Exception(msg + "table name doesn't match");
                    }
                }
            }
        } catch (JSONException e) {
            throw new Exception(msg + e.getMessage());
        } finally {
            return triggers;
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
                throw new Exception("GetTablesPartial: no syncDate");
            }
            if (partialModeData.has("modTables")) {
                modTables = partialModeData.getJSObject("modTables");
            } else {
                throw new Exception("GetTablesPartial: no modTables");
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
                    throw new Exception("GetTablesPartial: no name");
                }
                if (lTables.get(i).has("sql")) {
                    sqlStmt = lTables.get(i).getString("sql");
                } else {
                    throw new Exception("GetTablesPartial: no sql");
                }
                if (modTablesKeys.size() == 0 || modTablesKeys.indexOf(tableName) == -1 || modTables.getString(tableName).equals("No")) {
                    continue;
                }
                JsonTable table = new JsonTable();
                table.setName(tableName);
                ArrayList<JsonColumn> schema = new ArrayList<>();
                ArrayList<JsonIndex> indexes = new ArrayList<>();
                ArrayList<JsonTrigger> triggers = new ArrayList<>();
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
                    // create Table's triggers if any
                    triggers = getTriggers(mDb, tableName);

                    if (triggers.size() > 0) {
                        // check triggers validity
                        uJson.checkTriggersValidity(triggers);
                    }
                }
                // create Table's Data
                String query;
                if (modTables.getString(tableName).equals("Create")) {
                    query = "SELECT * FROM " + tableName + ";";
                } else {
                    query = "SELECT * FROM " + tableName + " WHERE last_modified >= " + syncDate + ";";
                }
                ArrayList<ArrayList<Object>> values = uJson.getValues(mDb, query, tableName);

                // check the table object validity
                table.setName(tableName);
                if (schema.size() != 0) {
                    table.setSchema(schema);
                }
                if (indexes.size() != 0) {
                    table.setIndexes(indexes);
                }
                if (triggers.size() != 0) {
                    table.setTriggers(triggers);
                }
                String msg = "Partial: Table ".concat(tableName).concat(" schema export completed");
                msg += " " + (i + 1) + "/" + lTables.size() + " ...";
                notifyExportProgressEvent(msg);

                if (values.size() != 0) {
                    table.setValues(values);
                }
                if (table.getKeys().size() <= 1) {
                    throw new Exception("GetTablesPartial: table " + tableName + " is not a jsonTable");
                }
                tables.add(table);
                msg = "Partial: Table ".concat(tableName).concat(" data export completed");
                msg += " " + (i + 1) + "/" + lTables.size() + " ...";
                notifyExportProgressEvent(msg);
            }
        } catch (Exception e) {
            throw new Exception("GetTablesPartial: " + e.getMessage());
        } finally {
            String msg = "Partial: Table's export completed";
            notifyExportProgressEvent(msg);
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
                throw new Exception("GetPartialModeData: did not find a sync_date");
            }
            // get the tables which have been updated
            // since last synchronization
            modTables = getTablesModified(mDb, resTables, syncDate);
            retData.put("syncDate", syncDate);
            retData.put("modTables", modTables);
        } catch (Exception e) {
            throw new Exception("GetPartialModeData: " + e.getMessage());
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
        String stmt = "SELECT sync_date FROM sync_table WHERE id = 1;";
        JSArray retQuery = new JSArray();
        try {
            boolean isSyncTable = uJson.isTableExists(mDb, "sync_table");
            if (!isSyncTable) {
                throw new Exception("No sync_table available");
            }
            retQuery = mDb.selectSQL(stmt, new ArrayList<Object>());
            List<JSObject> lQuery = retQuery.toList();
            if (lQuery.size() == 1) {
                long syncDate = lQuery.get(0).getLong("sync_date");
                if (syncDate > 0) ret = syncDate;
            }
        } catch (Exception e) {
            throw new Exception("GetSyncDate: " + e.getMessage());
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
                    throw new Exception("GetTablesModified: no name");
                }
                String stmt = "SELECT count(*) AS count FROM " + tableName + ";";
                JSArray retQuery = mDb.selectSQL(stmt, new ArrayList<Object>());
                List<JSObject> lQuery = retQuery.toList();
                if (lQuery.size() != 1) break;
                long totalCount = lQuery.get(0).getLong("count");
                // get total count of modified since last sync
                stmt = "SELECT count(*) AS count FROM " + tableName + " WHERE last_modified >= " + syncDate + ";";
                retQuery = mDb.selectSQL(stmt, new ArrayList<Object>());
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
            throw new Exception("GetTablesModified: " + e.getMessage());
        } finally {
            return retObj;
        }
    }
}
