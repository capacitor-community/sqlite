package com.getcapacitor.community.database.sqlite;

import android.content.Context;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.community.database.sqlite.SQLite.Database;
import com.getcapacitor.community.database.sqlite.SQLite.ImportExportJson.JsonSQLite;
import com.getcapacitor.community.database.sqlite.SQLite.ImportExportJson.UtilsJson;
import com.getcapacitor.community.database.sqlite.SQLite.UtilsFile;
import com.getcapacitor.community.database.sqlite.SQLite.UtilsMigrate;
import com.getcapacitor.community.database.sqlite.SQLite.UtilsSQLite;
import java.io.File;
import java.util.ArrayList;
import java.util.Dictionary;
import java.util.Hashtable;
import org.json.JSONException;
import org.json.JSONObject;

public class CapacitorSQLite {

    private Context context;
    private Dictionary<String, Database> dbDict = new Hashtable<>();
    private UtilsSQLite uSqlite = new UtilsSQLite();
    private UtilsFile uFile = new UtilsFile();
    private UtilsJson uJson = new UtilsJson();
    private UtilsMigrate uMigrate = new UtilsMigrate();

    public CapacitorSQLite(Context context) {
        this.context = context;
    }

    /**
     * Echo
     * @param value
     * @return
     */
    public String echo(String value) {
        return value;
    }

    /**
     * CreateConnection
     * @param dbName
     * @param encrypted
     * @param mode
     * @param version
     * @param vUpgObject
     * @throws Exception
     */
    public void createConnection(String dbName, boolean encrypted, String mode, int version, Dictionary<Integer, JSONObject> vUpgObject)
        throws Exception {
        // check if connection already exists
        Database conn = dbDict.get(dbName);
        if (conn != null) {
            String msg = "Connection " + dbName + " already exists";
            throw new Exception(msg);
        }
        try {
            Database db = new Database(context, dbName + "SQLite.db", encrypted, mode, version, vUpgObject);
            if (db != null) {
                dbDict.put(dbName, db);
                return;
            } else {
                String msg = "db is null";
                throw new Exception(msg);
            }
        } catch (Exception e) {
            throw new Exception(e.getMessage());
        }
    }

    /**
     * Open
     * @param dbName
     * @throws Exception
     */
    public void open(String dbName) throws Exception {
        Database db = dbDict.get(dbName);
        if (db != null) {
            try {
                db.open();
                return;
            } catch (Exception e) {
                throw new Exception(e.getMessage());
            }
        } else {
            String msg = "No available connection for database " + dbName;
            throw new Exception(msg);
        }
    }

    /**
     * Close
     * @param dbName
     * @throws Exception
     */
    public void close(String dbName) throws Exception {
        Database db = dbDict.get(dbName);
        if (db != null) {
            if (db.isOpen()) {
                if (!db.inTransaction()) {
                    try {
                        db.close();
                        return;
                    } catch (Exception e) {
                        throw new Exception(e.getMessage());
                    }
                } else {
                    String msg = "database " + dbName + " failed to close still in transaction";
                    throw new Exception(msg);
                }
            } else {
                String msg = "database " + dbName + " not opened";
                throw new Exception(msg);
            }
        } else {
            String msg = "No available connection for database " + dbName;
            throw new Exception(msg);
        }
    }

    /**
     * CloseConnection
     * @param dbName
     * @throws Exception
     */
    public void closeConnection(String dbName) throws Exception {
        Database db = dbDict.get(dbName);
        if (db != null) {
            if (db.isOpen()) {
                try {
                    close(dbName);
                } catch (Exception e) {
                    throw new Exception(e.getMessage());
                }
            }
            dbDict.remove(dbName);
            return;
        } else {
            String msg = "No available connection for database " + dbName;
            throw new Exception(msg);
        }
    }

    /**
     * IsDatabase
     * @param dbName
     * @return Boolean
     * @throws Exception
     */
    public Boolean isDatabase(String dbName) {
        return uFile.isFileExists(context, dbName + "SQLite.db");
    }

    /**
     * IsTableExists
     * @param dbName
     * @param tableName
     * @throws Exception
     */
    public Boolean isTableExists(String dbName, String tableName) throws Exception {
        Database db = dbDict.get(dbName);
        if (db != null) {
            boolean res = uJson.isTableExists(db, tableName);
            return res;
        } else {
            String msg = "No available connection for database " + dbName;
            throw new Exception(msg);
        }
    }

    /**
     *
     * @return JSArray
     * @throws Exception
     */
    public JSArray getDatabaseList() throws Exception {
        String[] listFiles = uFile.getListOfFiles(context);
        JSArray retArray = new JSArray();
        for (String file : listFiles) {
            retArray.put(file);
        }
        if (retArray.length() > 0) {
            return retArray;
        } else {
            String msg = "No databases available ";
            throw new Exception(msg);
        }
    }

    /**
     * AddSQLiteSuffix
     * @param folderPath
     * @throws Exception
     */
    public void addSQLiteSuffix(String folderPath) throws Exception {
        try {
            uMigrate.addSQLiteSuffix(context, folderPath);
            return;
        } catch (Exception e) {
            throw new Exception(e.getMessage());
        }
    }

    /**
     *
     * @param folderPath
     * @throws Exception
     */
    public void deleteOldDatabases(String folderPath) throws Exception {
        try {
            uMigrate.deleteOldDatabases(context, folderPath);
            return;
        } catch (Exception e) {
            throw new Exception(e.getMessage());
        }
    }

    /**
     * Execute
     * @param dbName
     * @param statements
     * @return
     * @throws Exception
     */
    public JSObject execute(String dbName, String statements) throws Exception {
        Database db = dbDict.get(dbName);
        if (db != null) {
            if (db.isOpen()) {
                // convert string in string[]
                String[] sqlCmdArray = uSqlite.getStatementsArray(statements);
                try {
                    JSObject res = db.execute(sqlCmdArray);
                    return res;
                } catch (Exception e) {
                    throw new Exception(e.getMessage());
                }
            } else {
                String msg = "database " + dbName + " not opened";
                throw new Exception(msg);
            }
        } else {
            String msg = "No available connection for database " + dbName;
            throw new Exception(msg);
        }
    }

    /**
     * ExecuteSet
     * @param dbName
     * @param set
     * @return
     * @throws Exception
     */
    public JSObject executeSet(String dbName, JSArray set) throws Exception {
        Database db = dbDict.get(dbName);
        if (db != null) {
            if (db.isOpen()) {
                try {
                    JSObject res = db.executeSet(set);
                    return res;
                } catch (Exception e) {
                    throw new Exception(e.getMessage());
                }
            } else {
                String msg = "database " + dbName + " not opened";
                throw new Exception(msg);
            }
        } else {
            String msg = "No available connection for database " + dbName;
            throw new Exception(msg);
        }
    }

    /**
     * Run
     * @param dbName
     * @param statement
     * @param values
     * @return
     * @throws Exception
     */
    public JSObject run(String dbName, String statement, JSArray values) throws Exception {
        JSObject res;
        Database db = dbDict.get(dbName);
        if (db != null) {
            if (db.isOpen()) {
                if (values.length() > 0) {
                    try {
                        ArrayList<Object> arrValues = uSqlite.objectJSArrayToArrayList(values);
                        res = db.runSQL(statement, arrValues);
                        return res;
                    } catch (JSONException e) {
                        throw new Exception(e.getMessage());
                    } catch (Exception e) {
                        throw new Exception(e.getMessage());
                    }
                } else {
                    try {
                        res = db.runSQL(statement, null);
                        return res;
                    } catch (Exception e) {
                        throw new Exception(e.getMessage());
                    }
                }
            } else {
                String msg = "database " + dbName + " not opened";
                throw new Exception(msg);
            }
        } else {
            String msg = "No available connection for database " + dbName;
            throw new Exception(msg);
        }
    }

    /**
     * Query
     * @param dbName
     * @param statement
     * @param values
     * @return
     * @throws Exception
     */
    public JSArray query(String dbName, String statement, JSArray values) throws Exception {
        JSArray res;
        Database db = dbDict.get(dbName);
        if (db != null) {
            if (db.isOpen()) {
                if (values.length() > 0) {
                    try {
                        ArrayList<String> arrValues = uSqlite.stringJSArrayToArrayList(values);
                        res = db.selectSQL(statement, arrValues);
                        return res;
                    } catch (JSONException e) {
                        throw new Exception(e.getMessage());
                    } catch (Exception e) {
                        throw new Exception(e.getMessage());
                    }
                } else {
                    try {
                        res = db.selectSQL(statement, new ArrayList<String>());
                        return res;
                    } catch (Exception e) {
                        throw new Exception(e.getMessage());
                    }
                }
            } else {
                String msg = "database " + dbName + " not opened";
                throw new Exception(msg);
            }
        } else {
            String msg = "No available connection for database " + dbName;
            throw new Exception(msg);
        }
    }

    public Boolean isDBExists(String dbName) throws Exception {
        Database db = dbDict.get(dbName);
        if (db != null) {
            File databaseFile = context.getDatabasePath(dbName + "SQLite.db");
            if (databaseFile.exists()) {
                return true;
            } else {
                return false;
            }
        } else {
            String msg = "No available connection for database " + dbName;
            throw new Exception(msg);
        }
    }

    public Boolean isDBOpen(String dbName) throws Exception {
        Database db = dbDict.get(dbName);
        if (db != null) {
            Boolean isOpen = db.isOpen();
            if (isOpen) {
                return true;
            } else {
                return false;
            }
        } else {
            String msg = "No available connection for database " + dbName;
            throw new Exception(msg);
        }
    }

    public void deleteDatabase(String dbName) throws Exception {
        Database db = dbDict.get(dbName);
        if (db != null) {
            try {
                db.deleteDB(dbName + "SQLite.db");
                return;
            } catch (Exception e) {
                throw new Exception(e.getMessage());
            }
        } else {
            String msg = "No available connection for database " + dbName;
            throw new Exception(msg);
        }
    }

    public JSObject createSyncTable(String dbName) throws Exception {
        Database db = dbDict.get(dbName);
        if (db != null) {
            try {
                JSObject res = db.createSyncTable();
                return res;
            } catch (Exception e) {
                throw new Exception(e.getMessage());
            }
        } else {
            String msg = "No available connection for database " + dbName;
            throw new Exception(msg);
        }
    }

    public void setSyncDate(String dbName, String syncDate) throws Exception {
        Database db = dbDict.get(dbName);
        if (db != null) {
            try {
                db.setSyncDate(syncDate);
                return;
            } catch (Exception e) {
                throw new Exception(e.getMessage());
            }
        } else {
            String msg = "No available connection for database " + dbName;
            throw new Exception(msg);
        }
    }

    public Long getSyncDate(String dbName) throws Exception {
        Database db = dbDict.get(dbName);
        if (db != null) {
            try {
                long syncDate = db.getSyncDate();
                return syncDate;
            } catch (Exception e) {
                throw new Exception(e.getMessage());
            }
        } else {
            String msg = "No available connection for database " + dbName;
            throw new Exception(msg);
        }
    }

    public Dictionary<Integer, JSONObject> addUpgradeStatement(JSArray upgrade) throws Exception {
        Dictionary<Integer, JSONObject> upgDict = new Hashtable<>();

        JSONObject upgObj = null;
        try {
            upgObj = (JSONObject) upgrade.get(0);
        } catch (Exception e) {
            String msg = "Must provide an upgrade statement " + e.getMessage();
            throw new Exception(msg);
        }

        if (upgObj == null || !upgObj.has("fromVersion") || !upgObj.has("toVersion") || !upgObj.has("statement")) {
            String msg = "Must provide an upgrade statement";
            msg += " {fromVersion,toVersion,statement}";
            throw new Exception(msg);
        }
        try {
            int fromVersion = upgObj.getInt("fromVersion");
            upgDict.put(fromVersion, upgObj);
            return upgDict;
        } catch (Exception e) {
            String msg = "Must provide fromVersion as Integer" + e.getMessage();
            throw new Exception(msg);
        }
    }

    public Boolean isJsonValid(String parsingData) throws Exception {
        try {
            JSObject jsonObject = new JSObject(parsingData);
            JsonSQLite jsonSQL = new JsonSQLite();
            Boolean isValid = jsonSQL.isJsonSQLite(jsonObject);
            return isValid;
        } catch (Exception e) {
            throw new Exception(e.getMessage());
        }
    }

    public JSObject importFromJson(String parsingData) throws Exception {
        try {
            JSObject jsonObject = new JSObject(parsingData);
            JsonSQLite jsonSQL = new JsonSQLite();
            Boolean isValid = jsonSQL.isJsonSQLite(jsonObject);
            if (!isValid) {
                String msg = "Stringify Json Object not Valid";
                throw new Exception(msg);
            }
            String dbName = new StringBuilder(jsonSQL.getDatabase()).append("SQLite.db").toString();
            int dbVersion = jsonSQL.getVersion();
            //            jsonSQL.print();
            Boolean encrypted = jsonSQL.getEncrypted();
            String inMode = "no-encryption";
            if (encrypted) {
                inMode = "secret";
            }
            Database db = new Database(context, dbName, encrypted, inMode, dbVersion, new Hashtable<>());
            db.open();
            if (!db.isOpen()) {
                String msg = dbName + "SQLite.db not opened";
                throw new Exception(msg);
            } else {
                JSObject res = db.importFromJson(jsonSQL);
                db.close();
                if (res.getInteger("changes") == Integer.valueOf(-1)) {
                    String msg = "importFromJson: import JsonObject not successful";
                    throw new Exception(msg);
                } else {
                    return res;
                }
            }
        } catch (Exception e) {
            String msg = "importFromJson : " + e.getMessage();
            throw new Exception(msg);
        }
    }

    public JSObject exportToJson(String dbName, String expMode) throws Exception {
        Database db = dbDict.get(dbName);
        if (db != null) {
            try {
                JSObject ret = db.exportToJson(expMode);

                if (ret.length() == 5) {
                    return ret;
                } else {
                    String msg = "ExportToJson: return Obj is not a JsonSQLite Obj";
                    throw new Exception(msg);
                }
            } catch (Exception e) {
                String msg = "ExportToJson " + e.getMessage();
                throw new Exception(msg);
            }
        } else {
            String msg = "No available connection for database " + dbName;
            throw new Exception(msg);
        }
    }

    public void copyFromAssets() throws Exception {
        String msg = "copy failed : ";
        try {
            Boolean ret = uFile.copyFromAssetsToDatabase(context);
            if (ret) {
                return;
            } else {
                throw new Exception(msg);
            }
        } catch (Exception e) {
            msg += e.getMessage();
            throw new Exception(msg);
        }
    }
}
