package com.getcapacitor.community.database.sqlite.SQLite.ImportExportJson;

import android.util.Log;
import androidx.sqlite.db.SupportSQLiteDatabase;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.community.database.sqlite.SQLite.Database;
import com.getcapacitor.community.database.sqlite.SQLite.UtilsDrop;
import com.getcapacitor.community.database.sqlite.SQLite.UtilsSQLite;
import java.util.ArrayList;
import org.json.JSONException;

public class ImportFromJson {

    private static final String TAG = ImportFromJson.class.getName();
    private UtilsJson _uJson = new UtilsJson();
    private UtilsDrop _uDrop = new UtilsDrop();
    private UtilsSQLite _uSqlite = new UtilsSQLite();

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

        // Set Foreign Key On
        try {
            db.getDb().setForeignKeyConstraintsEnabled(true);
        } catch (IllegalStateException e) {
            String msg = "Error: createDatabaseSchema ";
            msg += "setForeignKeyConstraintsEnabled failed ";
            msg += e.getMessage();
            throw new Exception(msg);
        }
        if (jsonSQL.getMode().equals("full")) {
            try {
                _uDrop.dropAll(db);
            } catch (Exception e) {
                String msg = "Error: createDatabaseSchema ";
                msg += "dropAll failed ";
                msg += e.getMessage();
                throw new Exception(msg);
            }
        }
        try {
            changes = createSchema(db, jsonSQL);
        } catch (Exception e) {
            String msg = "Error: createDatabaseSchema ";
            msg += "createSchema failed ";
            msg += e.getMessage();
            throw new Exception(msg);
        } finally {
            return changes;
        }
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
                    Log.v(TAG, "createSchema Changes " + changes);
                    if (changes >= 0) {
                        db.setTransactionSuccessful();
                    }
                }
            } else {
                throw new Exception("Database not opened");
            }
        } catch (IllegalStateException e) {
            throw e;
        } catch (android.database.SQLException e) {
            throw e;
        } catch (Exception e) {
            throw e;
        } finally {
            if (db != null && db.inTransaction()) db.endTransaction();
            return changes;
        }
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
                    ArrayList<String> stmt = createTableSchema(mSchema, tableName, mode);
                    statements.addAll(stmt);
                }
            }
            if (jsonSQL.getTables().get(i).getIndexes().size() > 0) {
                ArrayList<JsonIndex> mIndexes = jsonSQL.getTables().get(i).getIndexes();
                // create table indexes
                if (mIndexes.size() > 0) {
                    ArrayList<String> stmt = createTableIndexes(mIndexes, tableName, mode);
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
     * @param mode
     * @return
     */
    private ArrayList<String> createTableSchema(ArrayList<JsonColumn> mSchema, String tableName, String mode) {
        ArrayList<String> statements = new ArrayList<>();
        String stmt = new StringBuilder("CREATE TABLE IF NOT EXISTS ").append(tableName).append(" (").toString();
        for (int j = 0; j < mSchema.size(); j++) {
            if (j == mSchema.size() - 1) {
                if (mSchema.get(j).getColumn() != null) {
                    stmt =
                        new StringBuilder(stmt).append(mSchema.get(j).getColumn()).append(" ").append(mSchema.get(j).getValue()).toString();
                } else if (mSchema.get(j).getForeignkey() != null) {
                    stmt =
                        new StringBuilder(stmt)
                            .append("FOREIGN KEY (")
                            .append(mSchema.get(j).getForeignkey())
                            .append(") ")
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
                } else if (mSchema.get(j).getForeignkey() != null) {
                    stmt =
                        new StringBuilder(stmt)
                            .append("FOREIGN KEY (")
                            .append(mSchema.get(j).getForeignkey())
                            .append(") ")
                            .append(mSchema.get(j).getValue())
                            .append(",")
                            .toString();
                }
            }
        }
        stmt = new StringBuilder(stmt).append(");").toString();
        statements.add(stmt);
        // create trigger last_modified associated with the table
        String stmtTrigger = new StringBuilder("CREATE TRIGGER IF NOT EXISTS ")
            .append(tableName)
            .append("_trigger_last_modified")
            .append(" AFTER UPDATE ON ")
            .append(tableName)
            .append(" FOR EACH ROW ")
            .append("WHEN NEW.last_modified <= " + "OLD.last_modified BEGIN ")
            .append("UPDATE ")
            .append(tableName)
            .append(" SET last_modified = (strftime('%s','now')) ")
            .append("WHERE id=OLD.id; ")
            .append("END;")
            .toString();
        statements.add(stmtTrigger);
        return statements;
    }

    /**
     * Create table indexes from Json object
     * @param mIndexes
     * @param tableName
     * @param mode
     * @return
     */
    private ArrayList<String> createTableIndexes(ArrayList<JsonIndex> mIndexes, String tableName, String mode) {
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
                        } catch (Exception e) {
                            throw new Exception(e);
                        }
                    }
                }
                if (!isValues) {
                    changes = 0;
                } else {
                    changes = _uSqlite.dbChanges(db) - initChanges;
                    Log.v(TAG, "createDatabaseData Changes " + changes);
                    if (changes >= 0) {
                        db.setTransactionSuccessful();
                    }
                }
            } else {
                throw new Exception("Database not opened");
            }
        } catch (IllegalStateException e) {
            throw e;
        } catch (android.database.SQLException e) {
            throw e;
        } catch (Exception e) {
            throw e;
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
                throw new Exception("createTableData: " + "no column names & types returned");
            }
            ArrayList<String> tColNames = (ArrayList<String>) tableNamesTypes.get("names");
            ArrayList<String> tColTypes = (ArrayList<String>) tableNamesTypes.get("types");

            // Loop on Table's Values
            for (int j = 0; j < values.size(); j++) {
                // Check the row number of columns
                ArrayList<Object> row = values.get(j);
                // Check row validity
                _uJson.checkRowValidity(mDb, tColNames, tColTypes, row, j, tableName);
                // Create INSERT or UPDATE Statements
                String stmt = createRowStatement(mDb, tColNames, tColTypes, row, j, tableName, mode);
                // load the values
                long lastId = mDb.prepareSQL(stmt, row);
                if (lastId < 0) {
                    throw new Exception("createTableData: lastId < 0");
                }
            }
            return;
        } catch (JSONException e) {
            throw new Exception("createTableData: " + e.getMessage());
        } catch (Exception e) {
            throw new Exception("createTableData: " + e.getMessage());
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
        String msg = "createRowStatement: ";
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
                throw new Exception(msg + j + "questionMarkString " + "is empty");
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
            // Update
            String setString = _uJson.setNameForUpdate(tColNames);
            if (setString.length() == 0) {
                throw new Exception(msg + j + "setString " + "is empty");
            }
            stmt =
                new StringBuilder("UPDATE ")
                    .append(tableName)
                    .append(" SET ")
                    .append(setString)
                    .append(" WHERE ")
                    .append(tColNames.get(0))
                    .append(" = ")
                    .append(row.get(0))
                    .append(";")
                    .toString();
        }
        return stmt;
    }
}
