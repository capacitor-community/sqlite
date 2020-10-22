package com.getcapacitor.community.database.sqlite.cdssUtils.ImportExportJson;

import android.util.Log;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.community.database.sqlite.cdssUtils.SQLiteDatabaseHelper;
import com.getcapacitor.community.database.sqlite.cdssUtils.UtilsDrop;
import com.getcapacitor.community.database.sqlite.cdssUtils.UtilsSQLite;
import java.util.ArrayList;
import net.sqlcipher.database.SQLiteDatabase;
import org.json.JSONException;

public class ImportFromJson {
    private static final String TAG = ImportFromJson.class.getName();
    private UtilsJson uJson = new UtilsJson();
    private UtilsDrop uDrop = new UtilsDrop();
    private UtilsSQLite uSqlite = new UtilsSQLite();

    /**
     * Create the database schema for import from Json
     * @param dbHelper
     * @param jsonSQL
     * @return
     */
    public Integer createDatabaseSchema(SQLiteDatabaseHelper dbHelper, JsonSQLite jsonSQL, String secret) {
        int changes = Integer.valueOf(-1);
        boolean success = true;
        Integer version = jsonSQL.getVersion();
        // create the PRAGMAS
        ArrayList<String> pragmas = new ArrayList<String>();
        pragmas.add("PRAGMA foreign_keys = ON;");

        JSObject result1 = dbHelper.execSQL(pragmas.toArray(new String[pragmas.size()]));
        changes = result1.getInteger("changes");
        if (changes == -1) return changes;
        if (jsonSQL.getMode().equals("full")) {
            pragmas = new ArrayList<String>();
            pragmas.add("PRAGMA user_version = " + version + ";");
            result1 = dbHelper.execSQL(pragmas.toArray(new String[pragmas.size()]));
            changes = result1.getInteger("changes");
            if (changes == -1) return changes;
            try {
                uDrop.dropAll(dbHelper, secret);
            } catch (Exception e) {
                e.printStackTrace();
                changes = -1;
                return changes;
            }
        }

        // create the database schema
        ArrayList<String> statements = new ArrayList<String>();
        statements.add("BEGIN TRANSACTION;");

        for (int i = 0; i < jsonSQL.getTables().size(); i++) {
            if (jsonSQL.getTables().get(i).getSchema().size() > 0) {
                String stmt = new StringBuilder("CREATE TABLE IF NOT EXISTS ")
                    .append(jsonSQL.getTables().get(i).getName())
                    .append(" (")
                    .toString();
                for (int j = 0; j < jsonSQL.getTables().get(i).getSchema().size(); j++) {
                    if (j == jsonSQL.getTables().get(i).getSchema().size() - 1) {
                        if (jsonSQL.getTables().get(i).getSchema().get(j).getColumn() != null) {
                            stmt =
                                new StringBuilder(stmt)
                                    .append(jsonSQL.getTables().get(i).getSchema().get(j).getColumn())
                                    .append(" ")
                                    .append(jsonSQL.getTables().get(i).getSchema().get(j).getValue())
                                    .toString();
                        } else if (jsonSQL.getTables().get(i).getSchema().get(j).getForeignkey() != null) {
                            stmt =
                                new StringBuilder(stmt)
                                    .append("FOREIGN KEY (")
                                    .append(jsonSQL.getTables().get(i).getSchema().get(j).getForeignkey())
                                    .append(") ")
                                    .append(jsonSQL.getTables().get(i).getSchema().get(j).getValue())
                                    .toString();
                        }
                    } else {
                        if (jsonSQL.getTables().get(i).getSchema().get(j).getColumn() != null) {
                            stmt =
                                new StringBuilder(stmt)
                                    .append(jsonSQL.getTables().get(i).getSchema().get(j).getColumn())
                                    .append(" ")
                                    .append(jsonSQL.getTables().get(i).getSchema().get(j).getValue())
                                    .append(",")
                                    .toString();
                        } else if (jsonSQL.getTables().get(i).getSchema().get(j).getForeignkey() != null) {
                            stmt =
                                new StringBuilder(stmt)
                                    .append("FOREIGN KEY (")
                                    .append(jsonSQL.getTables().get(i).getSchema().get(j).getForeignkey())
                                    .append(") ")
                                    .append(jsonSQL.getTables().get(i).getSchema().get(j).getValue())
                                    .append(",")
                                    .toString();
                        }
                    }
                }
                stmt = new StringBuilder(stmt).append(");").toString();
                statements.add(stmt);
            }
            // create trigger last_modified associated with the table
            String stmtTrigger = new StringBuilder("CREATE TRIGGER IF NOT EXISTS ")
                .append(jsonSQL.getTables().get(i).getName())
                .append("_trigger_last_modified")
                .append(" AFTER UPDATE ON ")
                .append(jsonSQL.getTables().get(i).getName())
                .append(" FOR EACH ROW ")
                .append("WHEN NEW.last_modified <= " + "OLD.last_modified BEGIN ")
                .append("UPDATE ")
                .append(jsonSQL.getTables().get(i).getName())
                .append(" SET last_modified = (strftime('%s','now')) ")
                .append("WHERE id=OLD.id; ")
                .append("END;")
                .toString();
            statements.add(stmtTrigger);

            if (jsonSQL.getTables().get(i).getIndexes().size() > 0) {
                for (int j = 0; j < jsonSQL.getTables().get(i).getIndexes().size(); j++) {
                    String stmt = new StringBuilder("CREATE INDEX IF NOT EXISTS ")
                        .append(jsonSQL.getTables().get(i).getIndexes().get(j).getName())
                        .append(" ON ")
                        .append(jsonSQL.getTables().get(i).getName())
                        .append(" (")
                        .append(jsonSQL.getTables().get(i).getIndexes().get(j).getColumn())
                        .append(");")
                        .toString();
                    statements.add(stmt);
                }
            }
        }

        if (statements.size() > 1) {
            statements.add("COMMIT TRANSACTION;");
            JSObject result = dbHelper.execSQL(statements.toArray(new String[statements.size()]));
            changes = result.getInteger("changes");
            if (changes == -1) {
                success = false;
            }
        } else {
            changes = Integer.valueOf(0);
        }
        if (!success) {
            changes = Integer.valueOf(-1);
        }
        return changes;
    }

    /**
     * Create the database table data for import from Json
     * @param jsonSQL
     * @return
     */
    public Integer createTableData(SQLiteDatabaseHelper dbHelper, JsonSQLite jsonSQL, String secret) {
        boolean success = true;
        int changes = Integer.valueOf(-1);
        SQLiteDatabase db = null;
        boolean isValue = false;

        // create the table's data
        ArrayList<String> statements = new ArrayList<String>();
        //        statements.add("BEGIN TRANSACTION;");
        try {
            db = dbHelper.getConnection(false, secret);
            db.beginTransaction();

            for (int i = 0; i < jsonSQL.getTables().size(); i++) {
                if (jsonSQL.getTables().get(i).getValues().size() > 0) {
                    // Check if table exists
                    boolean isTable = uJson.isTableExists(dbHelper, db, jsonSQL.getTables().get(i).getName());
                    if (!isTable) {
                        Log.d(TAG, "importFromJson: Table " + jsonSQL.getTables().get(i).getName() + "does not exist");
                        success = false;
                        break;
                    }
                    // Get the Column's Name and Type
                    try {
                        JSObject tableNamesTypes = uJson.getTableColumnNamesTypes(dbHelper, db, jsonSQL.getTables().get(i).getName());
                        if (tableNamesTypes.length() == 0) {
                            success = false;
                            break;
                        }
                        ArrayList<String> tableColumnNames = (ArrayList<String>) tableNamesTypes.get("names");
                        ArrayList<String> tableColumnTypes = (ArrayList<String>) tableNamesTypes.get("types");
                        isValue = true;
                        // Loop on Table's Values
                        for (int j = 0; j < jsonSQL.getTables().get(i).getValues().size(); j++) {
                            // Check the row number of columns
                            ArrayList<Object> row = jsonSQL.getTables().get(i).getValues().get(j);

                            if (tableColumnNames.size() != row.size()) {
                                Log.d(
                                    TAG,
                                    "importFromJson: Table " +
                                    jsonSQL.getTables().get(i).getName() +
                                    " values row " +
                                    j +
                                    " not correct length"
                                );
                                success = false;
                                break;
                            }

                            // Check the column's type before proceeding
                            boolean retTypes = uJson.checkColumnTypes(tableColumnTypes, row);
                            if (!retTypes) {
                                Log.d(
                                    TAG,
                                    "importFromJson: Table " +
                                    jsonSQL.getTables().get(i).getName() +
                                    " values row " +
                                    j +
                                    " not correct types"
                                );
                                success = false;
                                break;
                            }
                            boolean retIdExists = uJson.isIdExists(
                                dbHelper,
                                db,
                                jsonSQL.getTables().get(i).getName(),
                                tableColumnNames.get(0),
                                row.get(0)
                            );
                            String stmt = "";
                            // Create INSERT or UPDATE Statements
                            if (jsonSQL.getMode().equals("full") || (jsonSQL.getMode().equals("partial") && !retIdExists)) {
                                // Insert
                                String namesString = uJson.convertToString(tableColumnNames, ',');
                                String questionMarkString = uJson.createQuestionMarkString(tableColumnNames.size());
                                StringBuilder strB = new StringBuilder();
                                stmt =
                                    new StringBuilder("INSERT INTO ")
                                        .append(jsonSQL.getTables().get(i).getName())
                                        .append("(")
                                        .append(namesString)
                                        .append(")")
                                        .append(" VALUES (")
                                        .append(questionMarkString)
                                        .append(");")
                                        .toString();
                            } else {
                                // Update
                                String setString = uJson.setNameForUpdate(tableColumnNames);
                                if (setString.length() == 0) {
                                    String message = new StringBuilder("importFromJson: Table ")
                                        .append(jsonSQL.getTables().get(i).getName())
                                        .append(" values row ")
                                        .append(j)
                                        .append(" not set to String")
                                        .toString();
                                    success = false;
                                    break;
                                }
                                stmt =
                                    new StringBuilder("UPDATE ")
                                        .append(jsonSQL.getTables().get(i).getName())
                                        .append(" SET ")
                                        .append(setString)
                                        .append(" WHERE ")
                                        .append(tableColumnNames.get(0))
                                        .append(" = ")
                                        .append(row.get(0))
                                        .append(";")
                                        .toString();
                            }
                            JSArray jsRow = uJson.convertToJSArray(row);
                            long lastId = dbHelper.prepareSQL(db, stmt, jsRow);
                            if (lastId == -1) {
                                Log.d(TAG, "createTableData: +" + "Errorin INSERT/UPDATE");
                                success = false;
                                break;
                            }
                        }
                    } catch (JSONException e) {
                        Log.d(TAG, "get Table Values: Error ", e);
                        success = false;
                        break;
                    }
                }
            }
            if (success && isValue) db.setTransactionSuccessful();
        } catch (Exception e) {} finally {
            if (db != null) {
                db.endTransaction();
                if (success && isValue) changes = uSqlite.dbChanges(db);
                if (!isValue) changes = Integer.valueOf(0);
                db.close();
            }
        }

        return changes;
    }
}
