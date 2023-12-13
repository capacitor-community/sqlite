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
import org.json.JSONObject;

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
                mDb.beginTransaction();
                // Create a Schema Statement
                ArrayList<String> statements = createSchemaStatement(jsonSQL);
                if (statements.size() > 0) {
                    Integer initChanges = _uSqlite.dbChanges(db);
                    for (String cmd : statements) {
                        db.execSQL(cmd);
                    }
                    changes = _uSqlite.dbChanges(db) - initChanges;
                    if (changes >= 0) {
                        mDb.commitTransaction();
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
            if (db != null && db.inTransaction()) mDb.rollbackTransaction();
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
                .append("WHEN NEW.last_modified <= " + "OLD.last_modified BEGIN ")
                .append("UPDATE ")
                .append(tableName)
                .append(" SET last_modified = (strftime('%s','now')) ")
                .append("WHERE id=NEW.id; ")
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
                mDb.beginTransaction();
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
                        mDb.commitTransaction();
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
            if (db != null && db.inTransaction()) mDb.rollbackTransaction();
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
            ArrayList<String> tColNames;
            if (tableNamesTypes.has("names")) {
                tColNames = _uJson.getColumnNames(tableNamesTypes.get("names"));
            } else {
                throw new Exception("GetValues: Table " + tableName + " no names");
            }
            // New process flow
            JSONObject retObjStrs = generateInsertAndDeletedStrings(tColNames,values);
            // Create the statement for INSERT
            String namesString = _uJson.convertToString(tColNames, ',');
            if(retObjStrs.has("insert")) {
              String stmtInsert =
                new StringBuilder("INSERT OR REPLACE INTO ")
                  .append(tableName)
                  .append("(")
                  .append(namesString)
                  .append(") ")
                  .append(retObjStrs.get("insert"))
                  .append(";")
                  .toString();
              JSObject retObj = mDb.prepareSQL(stmtInsert, new ArrayList<>(), true,
                "no");
              long lastId = retObj.getLong("lastId");
              if (lastId < 0) {
                throw new Exception("CreateTableData: INSERT lastId < 0");
              }
            }
            if(retObjStrs.has("delete")) {
              String stmtDelete =
                new StringBuilder("DELETE FROM ")
                  .append(tableName)
                  .append(" WHERE ")
                  .append(tColNames.get(0))
                  .append(" ")
                  .append(retObjStrs.get("delete"))
                  .append(";")
                  .toString();
              JSObject retObj = mDb.prepareSQL(stmtDelete, new ArrayList<>(), true,
                "no");
              long lastId = retObj.getLong("lastId");
              if (lastId < 0) {
                throw new Exception("CreateTableData: INSERT lastId < 0");
              }
            }


        } catch (JSONException e) {
            throw new Exception("CreateTableData: " + e.getMessage());
        } catch (Exception e) {
            throw new Exception("CreateTableData: " + e.getMessage());
        }
    }

    /**
     * GenerateInsertAndDeletedStrings
     * @param tColNames
     * @param values
     * @return
     * @throws JSONException
     */
    private JSONObject generateInsertAndDeletedStrings(ArrayList<String> tColNames,
                                              ArrayList<ArrayList<Object>> values)
                                                            throws JSONException {
      JSONObject retObj = new JSONObject();
      StringBuilder insertValues = new StringBuilder();
      StringBuilder deletedIds = new StringBuilder();

      for (ArrayList<Object> rowIndex : values) {
        int colIndex = tColNames.indexOf("sql_deleted");

        // Check if the column "sql_deleted" is 0
        if (colIndex == -1 || (int) rowIndex.get(colIndex) == 0) {

          if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N) {
            String formattedRow = null;
            formattedRow = String.join(", ", rowIndex.stream().map(item -> {
              if (item instanceof String) {
                StringBuilder formattedValue = new StringBuilder();
                formattedValue.append('"').append(item).append('"');
                return formattedValue.toString();
              } else {
                return item.toString();
              }
            }).toArray(String[]::new));
            insertValues.append("(").append(formattedRow).append("), ");
          } else {
            StringBuilder formattedRow = new StringBuilder();
            for (int i = 0; i < rowIndex.size(); i++) {
              if (i > 0) {
                formattedRow.append(", ");
              }
              Object item = rowIndex.get(i);
              if (item instanceof String) {
                formattedRow.append('"').append(item).append('"');
              } else {
                formattedRow.append(item);
              }
            }
            insertValues.append("(").append(formattedRow).append("), ");
          }
        } else if ((int) rowIndex.get(colIndex) == 1) {
          deletedIds.append(rowIndex.get(0)).append(", ");
        }
      }

      // Remove the trailing comma and space from insertValues and deletedIds
      if (insertValues.length() > 0) {
        insertValues.setLength(insertValues.length() - 2); // Remove trailing comma and space
        insertValues.insert(0, "VALUES ");
      }
      if (deletedIds.length() > 0) {
        deletedIds.setLength(deletedIds.length() - 2); // Remove trailing comma and space
        deletedIds.insert(0, "IN (");
        deletedIds.append(")");
      }
      if (insertValues.length() > 0) {
        retObj.put("insert", insertValues.toString());
      }
      if (deletedIds.length() > 0) {
        retObj.put("delete", deletedIds.toString());
      }
      return retObj;
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
                mDb.beginTransaction();
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
                    mDb.commitTransaction();
                }
            } else {
                throw new Exception("CreateViews: Database not opened");
            }
        } catch (Exception e) {
            throw new Exception("CreateViews: " + e.getMessage());
        } finally {
            if (db != null && db.inTransaction()) mDb.rollbackTransaction();
        }
        return changes;
    }
}
