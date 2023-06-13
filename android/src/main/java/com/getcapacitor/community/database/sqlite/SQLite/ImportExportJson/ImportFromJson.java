package com.getcapacitor.community.database.sqlite.SQLite.ImportExportJson;

import android.util.Log;
import androidx.sqlite.db.SupportSQLiteDatabase;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.community.database.sqlite.NotificationCenter;
import com.getcapacitor.community.database.sqlite.SQLite.Database;
import com.getcapacitor.community.database.sqlite.SQLite.UtilsDrop;
import com.getcapacitor.community.database.sqlite.SQLite.UtilsSQLite;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import org.json.JSONException;

public class ImportFromJson {

    private static final String TAG = ImportFromJson.class.getName();
    private UtilsJson _uJson = new UtilsJson();
    private UtilsDrop _uDrop = new UtilsDrop();
    private UtilsSQLite _uSqlite = new UtilsSQLite();

    /**
     * Notify progress import event
     * @param msg
     */
    public void notifyImportProgressEvent(String msg) {
        Map<String, Object> info = new HashMap<String, Object>() {
            {
                put("progress", "Import: " + msg);
            }
        };
        NotificationCenter.defaultCenter().postNotification("importJsonProgress", info);
    }

    /**
     * Create the database schema for import from Json
     * @param db
     * @param jsonSQL
     * @return
     */
    public Integer createDatabaseSchema(Database db, JsonSQLite jsonSQL) throws Exception {
        int changes = Integer.valueOf(-1);
        Integer version = jsonSQL.getVersion();

        // -> update database version
        db.getDb().setVersion(version);

        if (jsonSQL.getMode().equals("full")) {
            try {
                _uDrop.dropAll(db);
            } catch (Exception e) {
                String msg = "CreateDatabaseSchema: " + e.getMessage();
                throw new Exception(msg);
            }
        }
        try {
            changes = createSchema(db, jsonSQL);
            notifyImportProgressEvent("Schema creation completed changes: " + changes);
            return changes;
        } catch (Exception e) {
            String msg = "CreateDatabaseSchema: " + e.getMessage();
            throw new Exception(msg);
        } finally {}
    }

    /**
     * Create from the Json Object the database schema
     * @param mDb
     * @param jsonSQL
     * @return
     * @throws Exception
     */
    private Integer createSchema(Database mDb, JsonSQLite jsonSQL) throws Exception {
        int changes = Integer.valueOf(-1);
        SupportSQLiteDatabase db = mDb.getDb();
        try {
            if (mDb != null && mDb.isOpen() && jsonSQL != null) {
                db.beginTransaction();
                // Create a Schema Statement
                ArrayList<String> statements = createSchemaStatement(jsonSQL);
                if (statements.size() > 0) {
                    Integer initChanges = _uSqlite.dbChanges(db);
                    for (String cmd : statements) {
                        db.execSQL(cmd);
                    }
                    changes = _uSqlite.dbChanges(db) - initChanges;
                    if (changes >= 0) {
                        db.setTransactionSuccessful();
                    }
                } else {
                    if (jsonSQL.getMode().equals("partial")) {
                        changes = Integer.valueOf(0);
                    }
                }
            } else {
                throw new Exception("CreateSchema: Database not opened");
            }
        } catch (IllegalStateException e) {
            throw new Exception("CreateSchema: " + e.getMessage());
        } catch (android.database.SQLException e) {
            throw new Exception("CreateSchema: " + e.getMessage());
        } catch (Exception e) {
            throw new Exception("CreateSchema: " + e.getMessage());
        } finally {
            if (db != null && db.inTransaction()) db.endTransaction();
        }
        return changes;
    }

    /**
     * Create Schema Statements
     * @param jsonSQL
     * @return
     * @throws Exception
     */
    private ArrayList<String> createSchemaStatement(JsonSQLite jsonSQL) {
        ArrayList<String> statements = new ArrayList<>();
        String mode = jsonSQL.getMode();
        // Loop through Tables
        for (int i = 0; i < jsonSQL.getTables().size(); i++) {
            String tableName = jsonSQL.getTables().get(i).getName();
            if (jsonSQL.getTables().get(i).getSchema().size() > 0) {
                ArrayList<JsonColumn> mSchema = jsonSQL.getTables().get(i).getSchema();
                // create table schema
                if (mSchema.size() > 0) {
                    ArrayList<String> stmt = createTableSchema(mSchema, tableName);
                    statements.addAll(stmt);
                }
            }
            if (jsonSQL.getTables().get(i).getIndexes().size() > 0) {
                ArrayList<JsonIndex> mIndexes = jsonSQL.getTables().get(i).getIndexes();
                // create table indexes
                if (mIndexes.size() > 0) {
                    ArrayList<String> stmt = createTableIndexes(mIndexes, tableName);
                    statements.addAll(stmt);
                }
            }
            if (jsonSQL.getTables().get(i).getTriggers().size() > 0) {
                ArrayList<JsonTrigger> mTriggers = jsonSQL.getTables().get(i).getTriggers();
                // create table triggers
                if (mTriggers.size() > 0) {
                    ArrayList<String> stmt = createTableTriggers(mTriggers, tableName);
                    statements.addAll(stmt);
                }
            }
        }
        return statements;
    }

    /**
     * Create table schema from Json object
     * @param mSchema
     * @param tableName
     * @return
     */
    private ArrayList<String> createTableSchema(ArrayList<JsonColumn> mSchema, String tableName) {
        ArrayList<String> statements = new ArrayList<>();
        String stmt = new StringBuilder("CREATE TABLE IF NOT EXISTS ").append(tableName).append(" (").toString();
        Boolean isLastModified = false;
        Boolean isSqlDeleted = false;
        for (int j = 0; j < mSchema.size(); j++) {
            if (j == mSchema.size() - 1) {
                if (mSchema.get(j).getColumn() != null) {
                    stmt =
                        new StringBuilder(stmt).append(mSchema.get(j).getColumn()).append(" ").append(mSchema.get(j).getValue()).toString();
                    if (mSchema.get(j).getColumn().equals("last_modified")) {
                        isLastModified = true;
                    }
                    if (mSchema.get(j).getColumn().equals("sql_deleted")) {
                        isSqlDeleted = true;
                    }
                } else if (mSchema.get(j).getForeignkey() != null) {
                    stmt =
                        new StringBuilder(stmt)
                            .append("FOREIGN KEY (")
                            .append(mSchema.get(j).getForeignkey())
                            .append(") ")
                            .append(mSchema.get(j).getValue())
                            .toString();
                } else if (mSchema.get(j).getConstraint() != null) {
                    stmt =
                        new StringBuilder(stmt)
                            .append("CONSTRAINT ")
                            .append(mSchema.get(j).getConstraint())
                            .append(" ")
                            .append(mSchema.get(j).getValue())
                            .toString();
                }
            } else {
                if (mSchema.get(j).getColumn() != null) {
                    stmt =
                        new StringBuilder(stmt)
                            .append(mSchema.get(j).getColumn())
                            .append(" ")
                            .append(mSchema.get(j).getValue())
                            .append(",")
                            .toString();
                    if (mSchema.get(j).getColumn().equals("last_modified")) {
                        isLastModified = true;
                    }
                    if (mSchema.get(j).getColumn().equals("sql_deleted")) {
                        isSqlDeleted = true;
                    }
                } else if (mSchema.get(j).getForeignkey() != null) {
                    stmt =
                        new StringBuilder(stmt)
                            .append("FOREIGN KEY (")
                            .append(mSchema.get(j).getForeignkey())
                            .append(") ")
                            .append(mSchema.get(j).getValue())
                            .append(",")
                            .toString();
                } else if (mSchema.get(j).getConstraint() != null) {
                    stmt =
                        new StringBuilder(stmt)
                            .append("CONSTRAINT ")
                            .append(mSchema.get(j).getConstraint())
                            .append(" ")
                            .append(mSchema.get(j).getValue())
                            .append(",")
                            .toString();
                }
            }
        }
        stmt = new StringBuilder(stmt).append(");").toString();
        statements.add(stmt);
        if (isLastModified && isSqlDeleted) {
            // create trigger last_modified associated with the table
            String stmtTrigger = new StringBuilder("CREATE TRIGGER IF NOT EXISTS ")
                .append(tableName)
                .append("_trigger_last_modified")
                .append(" AFTER UPDATE ON ")
                .append(tableName)
                .append(" FOR EACH ROW ")
                .append("WHEN NEW.last_modified < " + "OLD.last_modified BEGIN ")
                .append("UPDATE ")
                .append(tableName)
                .append(" SET last_modified = (strftime('%s','now')) ")
                .append("WHERE id=OLD.id; ")
                .append("END;")
                .toString();
            statements.add(stmtTrigger);
        }
        return statements;
    }

    /**
     * Create table indexes from Json object
     * @param mIndexes
     * @param tableName
     * @return
     */
    private ArrayList<String> createTableIndexes(ArrayList<JsonIndex> mIndexes, String tableName) {
        ArrayList<String> statements = new ArrayList<>();
        for (int j = 0; j < mIndexes.size(); j++) {
            String mMode = mIndexes.get(j).getMode();
            String mUnique = mMode.length() > 0 ? mMode + " " : "";
            String stmt = new StringBuilder("CREATE ")
                .append(mUnique)
                .append("INDEX IF NOT EXISTS ")
                .append(mIndexes.get(j).getName())
                .append(" ON ")
                .append(tableName)
                .append(" (")
                .append(mIndexes.get(j).getValue())
                .append(");")
                .toString();
            statements.add(stmt);
        }
        return statements;
    }

    /**
     * Create table triggers from Json object
     * @param mTriggers
     * @param tableName
     * @return
     */
    private ArrayList<String> createTableTriggers(ArrayList<JsonTrigger> mTriggers, String tableName) {
        ArrayList<String> statements = new ArrayList<>();
        for (int j = 0; j < mTriggers.size(); j++) {
            String timeEvent = mTriggers.get(j).getTimeevent();
            if (timeEvent.toUpperCase().endsWith(" ON")) {
                timeEvent = timeEvent.substring(0, timeEvent.length() - 3);
            }

            StringBuilder sBuilder = new StringBuilder("CREATE TRIGGER IF NOT EXISTS ")
                .append(mTriggers.get(j).getName())
                .append(" ")
                .append(timeEvent)
                .append(" ON ")
                .append(tableName)
                .append(" ");
            if (mTriggers.get(j).getCondition() != null) {
                sBuilder.append(mTriggers.get(j).getCondition()).append(" ");
            }
            sBuilder.append(mTriggers.get(j).getLogic());
            String stmt = sBuilder.toString();
            statements.add(stmt);
        }
        return statements;
    }

    /**
     * Create the database tables data for import from Json
     * @param mDb
     * @param jsonSQL
     * @return
     */
    public Integer createDatabaseData(Database mDb, JsonSQLite jsonSQL) throws Exception {
        boolean isValues = false;
        int changes = Integer.valueOf(-1);
        int initChanges = Integer.valueOf(-1);
        SupportSQLiteDatabase db = mDb.getDb();
        try {
            if (mDb != null && mDb.isOpen() && jsonSQL != null) {
                initChanges = _uSqlite.dbChanges(db);
                db.beginTransaction();
                for (int i = 0; i < jsonSQL.getTables().size(); i++) {
                    if (jsonSQL.getTables().get(i).getValues().size() > 0) {
                        isValues = true;
                        try {
                            createTableData(
                                mDb,
                                jsonSQL.getMode(),
                                jsonSQL.getTables().get(i).getValues(),
                                jsonSQL.getTables().get(i).getName()
                            );
                            String msg = "Table ".concat(jsonSQL.getTables().get(i).getName()).concat(" data creation completed");
                            msg += " " + (i + 1) + "/" + jsonSQL.getTables().size() + " ...";
                            notifyImportProgressEvent(msg);
                        } catch (Exception e) {
                            throw new Exception("CreateDatabaseData: " + e.getMessage());
                        }
                    }
                }
                if (!isValues) {
                    changes = 0;
                } else {
                    changes = _uSqlite.dbChanges(db) - initChanges;
                    if (changes >= 0) {
                        db.setTransactionSuccessful();
                        notifyImportProgressEvent("Tables data creation completed changes: " + changes);
                    }
                }
            } else {
                throw new Exception("CreateDatabaseData: Database not opened");
            }
        } catch (IllegalStateException e) {
            throw new Exception("CreateDatabaseData: " + e.getMessage());
        } catch (android.database.SQLException e) {
            throw new Exception("CreateDatabaseData: " + e.getMessage());
        } catch (Exception e) {
            throw new Exception("CreateDatabaseData: " + e.getMessage());
        } finally {
            if (db != null && db.inTransaction()) db.endTransaction();
        }
        return changes;
    }

    /**
     * Create table data from the Json Object
     * @param mDb
     * @param mode
     * @param values
     * @param tableName
     * @throws Exception
     */
    private void createTableData(Database mDb, String mode, ArrayList<ArrayList<Object>> values, String tableName) throws Exception {
        // Check if table exists
        boolean isTable = _uJson.isTableExists(mDb, tableName);
        if (!isTable) {
            throw new Exception("createTableData: Table " + tableName + "does not exist");
        }
        // Get the Column's Name and Type
        try {
            JSObject tableNamesTypes = _uJson.getTableColumnNamesTypes(mDb, tableName);
            if (tableNamesTypes.length() == 0) {
                throw new Exception("CreateTableData: no column names & types returned");
            }
            ArrayList<String> tColNames = new ArrayList<>();
            ArrayList<String> tColTypes = new ArrayList<>();
            if (tableNamesTypes.has("names")) {
                tColNames = _uJson.getColumnNames(tableNamesTypes.get("names"));
            } else {
                throw new Exception("GetValues: Table " + tableName + " no names");
            }
            if (tableNamesTypes.has("types")) {
                tColTypes = _uJson.getColumnNames(tableNamesTypes.get("types"));
            } else {
                throw new Exception("GetValues: Table " + tableName + " no types");
            }

            // Loop on Table's Values
            for (int j = 0; j < values.size(); j++) {
                // Check the row number of columns
                ArrayList<Object> row = values.get(j);
                // Check row validity remove to accept RDBMS types
                //                _uJson.checkRowValidity(mDb, tColNames, tColTypes, row, j, tableName);
                // Create INSERT or UPDATE Statements
                Boolean isRun = true;
                String stmt = createRowStatement(mDb, tColNames, tColTypes, row, j, tableName, mode);
                isRun = checkUpdate(mDb, stmt, row, tableName, tColNames, tColTypes);
                if (isRun) {
                    // load the values
                    if (stmt.substring(0, 6).toUpperCase().equals("DELETE")) {
                        row = new ArrayList<>();
                    }
                    long lastId = mDb.prepareSQL(stmt, row, true);
                    if (lastId < 0) {
                        throw new Exception("CreateTableData: lastId < 0");
                    }
                }
            }
            return;
        } catch (JSONException e) {
            throw new Exception("CreateTableData: " + e.getMessage());
        } catch (Exception e) {
            throw new Exception("CreateTableData: " + e.getMessage());
        }
    }

    /**
     * Check when UPDATE if the values are updated
     * @param mDb
     * @param stmt
     * @param values
     * @param tableName
     * @param tColNames
     * @param tColTypes
     * @return
     * @throws Exception
     */
    private Boolean checkUpdate(
        Database mDb,
        String stmt,
        ArrayList<Object> values,
        String tableName,
        ArrayList<String> tColNames,
        ArrayList<String> tColTypes
    ) throws Exception {
        Boolean isRun = true;
        if (stmt.substring(0, 6).equals("UPDATE")) {
            StringBuilder sbQuery = new StringBuilder("SELECT * FROM ").append(tableName).append(" WHERE ").append(tColNames.get(0));

            if (values.get(0) instanceof String) {
                sbQuery.append(" = '").append(values.get(0)).append("';");
            } else {
                sbQuery.append(" = ").append(values.get(0)).append(";");
            }
            String query = sbQuery.toString();

            try {
                ArrayList<ArrayList<Object>> resValues = _uJson.getValues(mDb, query, tableName);
                if (resValues.size() > 0) {
                    isRun = checkValues(values, resValues.get(0));
                } else {
                    throw new Exception("CheckUpdate: CheckUpdate statement returns nothing");
                }
            } catch (Exception e) {
                throw new Exception("CheckUpdate: " + e.getMessage());
            }
        }
        return isRun;
    }

    /**
     * Check Values
     * @param values
     * @param nValues
     * @return
     * @throws Exception
     */
    private Boolean checkValues(ArrayList<Object> values, ArrayList<Object> nValues) throws Exception {
        if (values.size() > 0 && nValues.size() > 0 && values.size() == nValues.size()) {
            for (int i = 0; i < values.size(); i++) {
                if (nValues.get(i) instanceof String) {
                    if (!values.get(i).equals(nValues.get(i))) {
                        return true;
                    }
                } else if (nValues.get(i) instanceof Long && values.get(i) instanceof Integer) {
                    //            int iVal = (Integer) values.get(i);
                    long lVal = (Integer) values.get(i);
                    //            long nlVal = (Long) nValues.get(i);
                    if (lVal != (Long) nValues.get(i)) {
                        return true;
                    }
                } else if (nValues.get(i) instanceof Double && values.get(i) instanceof Integer) {
                    double dVal = (Integer) values.get(i);
                    if (dVal != (Double) nValues.get(i)) {
                        return true;
                    }
                } else {
                    if (values.get(i) != nValues.get(i)) {
                        return true;
                    }
                }
            }
            return false;
        } else {
            throw new Exception("CheckValues: Both arrays not the same length");
        }
    }

    /**
     * Create the Row Statement to load the data
     * @param mDb
     * @param tColNames
     * @param tColTypes
     * @param row
     * @param j
     * @param tableName
     * @param mode
     * @return
     */
    private String createRowStatement(
        Database mDb,
        ArrayList<String> tColNames,
        ArrayList<String> tColTypes,
        ArrayList<Object> row,
        int j,
        String tableName,
        String mode
    ) throws Exception {
        String msg = "CreateRowStatement: ";
        msg += "Table" + tableName + " values row";
        if (tColNames.size() != row.size() || row.size() == 0 || tColNames.size() == 0) {
            throw new Exception(msg + j + " not correct length");
        }

        boolean retIsIdExists = _uJson.isIdExists(mDb, tableName, tColNames.get(0), row.get(0));
        String stmt = "";
        // Create INSERT or UPDATE Statements
        if (mode.equals("full") || (mode.equals("partial") && !retIsIdExists)) {
            // Insert
            String namesString = _uJson.convertToString(tColNames, ',');
            String questionMarkString = _uJson.createQuestionMarkString(tColNames.size());
            if (questionMarkString.length() == 0) {
                throw new Exception(msg + j + "questionMarkString is empty");
            }
            stmt =
                new StringBuilder("INSERT INTO ")
                    .append(tableName)
                    .append("(")
                    .append(namesString)
                    .append(")")
                    .append(" VALUES (")
                    .append(questionMarkString)
                    .append(");")
                    .toString();
        } else {
            Boolean isUpdate = true;
            Integer idxDelete = tColNames.indexOf("sql_deleted");
            if (idxDelete >= 0) {
                if (row.get(idxDelete).equals(1)) {
                    // Delete
                    isUpdate = false;
                    Object key = tColNames.get(0);
                    StringBuilder sbQuery = new StringBuilder("DELETE FROM ")
                        .append(tableName)
                        .append(" WHERE ")
                        .append(tColNames.get(0))
                        .append(" = ");

                    if (key instanceof Integer) sbQuery.append(row.get(0)).append(";");
                    if (key instanceof String) sbQuery.append("'").append(row.get(0)).append("';");
                    stmt = sbQuery.toString();
                }
            }
            if (isUpdate) {
                // Update
                String setString = _uJson.setNameForUpdate(tColNames);
                if (setString.length() == 0) {
                    throw new Exception(msg + j + "setString is empty");
                }
                Object key = tColNames.get(0);
                StringBuilder sbQuery = new StringBuilder("UPDATE ")
                    .append(tableName)
                    .append(" SET ")
                    .append(setString)
                    .append(" WHERE ")
                    .append(tColNames.get(0))
                    .append(" = ");

                if (key instanceof Integer) sbQuery.append(row.get(0)).append(";");
                if (key instanceof String) sbQuery.append("'").append(row.get(0)).append("';");
                stmt = sbQuery.toString();
            }
        }
        return stmt;
    }

    /**
     * Create from the Json Object the database views
     * @param mDb
     * @param views
     * @return
     * @throws Exception
     */
    public Integer createViews(Database mDb, ArrayList<JsonView> views) throws Exception {
        int changes = Integer.valueOf(0);
        SupportSQLiteDatabase db = mDb.getDb();
        try {
            if (mDb != null && mDb.isOpen() && views.size() > 0) {
                db.beginTransaction();
                // Create Views
                Integer initChanges = _uSqlite.dbChanges(db);
                for (JsonView view : views) {
                    if (view.getName().length() > 0 && view.getValue().length() > 0) {
                        StringBuilder sBuilder = new StringBuilder("CREATE VIEW IF NOT EXISTS ")
                            .append(view.getName())
                            .append(" AS ")
                            .append(view.getValue())
                            .append(" ;");
                        String stmt = sBuilder.toString();
                        db.execSQL(stmt);
                    } else {
                        throw new Exception("CreateViews: no name and value");
                    }
                }
                changes = _uSqlite.dbChanges(db) - initChanges;
                if (changes >= 0) {
                    db.setTransactionSuccessful();
                }
            } else {
                throw new Exception("CreateViews: Database not opened");
            }
        } catch (Exception e) {
            throw new Exception("CreateViews: " + e.getMessage());
        } finally {
            if (db != null && db.inTransaction()) db.endTransaction();
        }
        return changes;
    }
}
