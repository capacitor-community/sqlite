package com.getcapacitor.community.database.sqlite;

import android.content.Context;
import android.util.Log;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.community.database.sqlite.SQLite.SqliteConfig;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Dictionary;
import java.util.Hashtable;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

@CapacitorPlugin(name = "CapacitorSQLite")
public class CapacitorSQLitePlugin extends Plugin {

    private static final String TAG = CapacitorSQLitePlugin.class.getName();
    private SqliteConfig config;
    private CapacitorSQLite implementation;
    private final Dictionary<String, Dictionary<Integer, JSONObject>> versionUpgrades = new Hashtable<>();
    private final RetHandler rHandler = new RetHandler();
    private String passphrase = null;
    private String oldpassphrase = null;
    private String loadMessage = "";
    private final ArrayList<String> modeList = new ArrayList<>(
        Arrays.asList("no-encryption", "encryption", "secret", "decryption", "wrongsecret")
    );

    /**
     * Load Method
     * Load the context
     */
    public void load() {
        Context context = getContext();
        try {
            config = getSqliteConfig();
            AddObserversToNotificationCenter();
            implementation = new CapacitorSQLite(context, config);
        } catch (Exception e) {
            implementation = null;
            loadMessage = "CapacitorSQLitePlugin: " + e.getMessage();
            Log.e(TAG, loadMessage);
        }
    }

    /**
     * Echo Method
     * test the plugin
     *
     * @param call PluginCall
     */
    @PluginMethod
    public void echo(PluginCall call) {
        String value = call.getString("value");
        if (implementation != null) {
            try {
                JSObject ret = new JSObject();
                ret.put("value", implementation.echo(value));
                call.resolve(ret);
            } catch (Exception e) {
                call.reject(e.getMessage());
            }
        } else {
            call.reject(loadMessage);
        }
    }

    /**
     * IsSecretStored
     * Check if a secret has been stored
     *
     * @param call PluginCall
     */
    @PluginMethod
    public void isSecretStored(PluginCall call) {
        if (implementation != null) {
            try {
                Boolean res = implementation.isSecretStored();
                rHandler.retResult(call, res, null);
            } catch (Exception e) {
                String msg = "IsSecretStored: " + e.getMessage();
                rHandler.retResult(call, null, msg);
            }
        } else {
            rHandler.retResult(call, null, loadMessage);
        }
    }

    /**
     * SetEncryptionSecret
     * set a passphrase secret for a database
     *
     * @param call PluginCall
     */
    @PluginMethod
    public void setEncryptionSecret(PluginCall call) {
        String passphrase;
        if (!call.getData().has("passphrase")) {
            String msg = "SetEncryptionSecret: Must provide a passphrase";
            rHandler.retResult(call, null, msg);
            return;
        }
        passphrase = call.getString("passphrase");
        if (implementation != null) {
            try {
                implementation.setEncryptionSecret(passphrase);
                rHandler.retResult(call, null, null);
            } catch (Exception e) {
                String msg = "SetEncryptionSecret: " + e.getMessage();
                rHandler.retResult(call, null, msg);
            }
        } else {
            rHandler.retResult(call, null, loadMessage);
        }
    }

    /**
     * ChangeEncryptionSecret
     * change a passphrase secret for a database
     * with a new passphrase
     *
     * @param call PluginCall
     */
    @PluginMethod
    public void changeEncryptionSecret(PluginCall call) {
        if (!call.getData().has("passphrase")) {
            String msg = "SetEncryptionSecret: Must provide a passphrase";
            rHandler.retResult(call, null, msg);
            return;
        }
        passphrase = call.getString("passphrase");

        if (!call.getData().has("oldpassphrase")) {
            String msg = "SetEncryptionSecret: Must provide a oldpassphrase";
            rHandler.retResult(call, null, msg);
            return;
        }
        oldpassphrase = call.getString("oldpassphrase");
        if (implementation != null) {
            getActivity()
                .runOnUiThread(() -> {
                    try {
                        implementation.changeEncryptionSecret(call, passphrase, oldpassphrase);
                        rHandler.retResult(call, null, null);
                    } catch (Exception e) {
                        String msg = "ChangeEncryptionSecret: " + e.getMessage();
                        rHandler.retResult(call, null, msg);
                    }
                });
        } else {
            rHandler.retResult(call, null, loadMessage);
        }
    }

    /**
     * ClearEncryptionSecret
     * clear the passphrase secret for a database
     *
     * @param call PluginCall
     */
    @PluginMethod
    public void clearEncryptionSecret(PluginCall call) {
        if (implementation != null) {
            try {
                implementation.clearEncryptionSecret();
                rHandler.retResult(call, null, null);
            } catch (Exception e) {
                String msg = "ClearEncryptionSecret: " + e.getMessage();
                rHandler.retResult(call, null, msg);
            }
        } else {
            rHandler.retResult(call, null, loadMessage);
        }
    }

    /**
     * checkEncryptionSecret
     * check a passphrase secret against the stored passphrase
     *
     * @param call PluginCall
     */
    @PluginMethod
    public void checkEncryptionSecret(PluginCall call) {
        String passphrase;
        if (!call.getData().has("passphrase")) {
            String msg = "checkEncryptionSecret: Must provide a passphrase";
            rHandler.retResult(call, null, msg);
            return;
        }
        passphrase = call.getString("passphrase");
        if (implementation != null) {
            try {
                Boolean res = implementation.checkEncryptionSecret(passphrase);
                rHandler.retResult(call, res, null);
            } catch (Exception e) {
                String msg = "CheckEncryptionSecret: " + e.getMessage();
                rHandler.retResult(call, null, msg);
            }
        } else {
            rHandler.retResult(call, null, loadMessage);
        }
    }

    @PluginMethod
    public void getNCDatabasePath(PluginCall call) {
        String folderPath;
        String dbName;
        if (!call.getData().has("path")) {
            String msg = "getNCDatabasePath: Must provide a folder path";
            rHandler.retPath(call, null, msg);
            return;
        }
        folderPath = call.getString("path");
        if (!call.getData().has("database")) {
            String msg = "getNCDatabasePath: Must provide a database name";
            rHandler.retPath(call, null, msg);
            return;
        }
        dbName = call.getString("database");
        if (implementation != null) {
            try {
                String databasePath = implementation.getNCDatabasePath(folderPath, dbName);
                rHandler.retPath(call, databasePath, null);
            } catch (Exception e) {
                String msg = "getNCDatabasePath: " + e.getMessage();
                rHandler.retResult(call, null, msg);
            }
        } else {
            rHandler.retResult(call, null, loadMessage);
        }
    }

    /**
     * CreateNCConnection Method
     * Create a non-conformed connection to a database
     *
     * @param call PluginCall
     */
    @PluginMethod
    public void createNCConnection(PluginCall call) {
        String dbPath;
        int dbVersion;
        if (!call.getData().has("databasePath")) {
            String msg = "CreateNCConnection: Must provide a database path";
            rHandler.retResult(call, null, msg);
            return;
        }
        if (implementation != null) {
            try {
                dbPath = call.getString("databasePath");
                dbVersion = call.getInt("version", 1);
                implementation.createNCConnection(dbPath, dbVersion);
                rHandler.retResult(call, null, null);
            } catch (Exception e) {
                String msg = "CreateNCConnection: " + e.getMessage();
                rHandler.retResult(call, null, msg);
            }
        } else {
            rHandler.retResult(call, null, loadMessage);
        }
    }

    /**
     * CreateConnection Method
     * Create a connection to a database
     *
     * @param call PluginCall
     */
    @PluginMethod
    public void createConnection(PluginCall call) {
        String dbName;
        int dbVersion;
        String inMode;
        if (!call.getData().has("database")) {
            String msg = "CreateConnection: Must provide a database name";
            rHandler.retResult(call, null, msg);
            return;
        }
        dbName = call.getString("database");
        dbVersion = call.getInt("version", 1);

        Boolean encrypted = call.getBoolean("encrypted", false);
        if (encrypted) {
            inMode = call.getString("mode", "no-encryption");
            if (!modeList.contains(inMode)) {
                String msg = "CreateConnection: inMode must ";
                msg += "be in ['encryption','secret', 'decryption'] ";
                rHandler.retResult(call, null, msg);
                return;
            }
        } else {
            inMode = "no-encryption";
        }
        boolean readOnly = call.getBoolean("readonly", false);
        Dictionary<Integer, JSONObject> upgDict = versionUpgrades.get(dbName);
        if (implementation != null) {
            try {
                implementation.createConnection(dbName, encrypted, inMode, dbVersion, upgDict, readOnly);
                rHandler.retResult(call, null, null);
            } catch (Exception e) {
                String msg = "CreateConnection: " + e.getMessage();
                rHandler.retResult(call, null, msg);
            }
        } else {
            rHandler.retResult(call, null, loadMessage);
        }
    }

    /**
     * Open Method
     * Open a database
     *
     * @param call PluginCall
     */
    @PluginMethod
    public void open(PluginCall call) {
        if (!call.getData().has("database")) {
            String msg = "Open: Must provide a database name";
            rHandler.retResult(call, null, msg);
            return;
        }
        String dbName = call.getString("database");
        Boolean readOnly = call.getBoolean("readonly", false);
        if (implementation != null) {
            try {
                implementation.open(dbName, readOnly);
                rHandler.retResult(call, null, null);
            } catch (Exception e) {
                String msg = "Open: " + e.getMessage();
                rHandler.retResult(call, null, msg);
            }
        } else {
            rHandler.retResult(call, null, loadMessage);
        }
    }

    /**
     * Close Method
     * Close a Database
     *
     * @param call PluginCall
     */
    @PluginMethod
    public void close(PluginCall call) {
        if (!call.getData().has("database")) {
            String msg = "Close: Must provide a database name";
            rHandler.retResult(call, null, msg);
            return;
        }
        String dbName = call.getString("database");
        Boolean readOnly = call.getBoolean("readonly", false);
        if (implementation != null) {
            try {
                implementation.close(dbName, readOnly);
                rHandler.retResult(call, null, null);
            } catch (Exception e) {
                String msg = "Close: " + e.getMessage();
                rHandler.retResult(call, null, msg);
            }
        } else {
            rHandler.retResult(call, null, loadMessage);
        }
    }

    /**
     * BeginTransaction Method
     * Begin a Database Transaction
     *
     * @param call PluginCall
     */
    @PluginMethod
    public void beginTransaction(PluginCall call) {
        JSObject retRes = new JSObject();
        retRes.put("changes", Integer.valueOf(-1));
        if (!call.getData().has("database")) {
            String msg = "BeginTransaction: Must provide a database name";
            rHandler.retChanges(call, retRes, msg);
            return;
        }
        String dbName = call.getString("database");

        if (implementation != null) {
            try {
                JSObject res = implementation.beginTransaction(dbName);
                rHandler.retChanges(call, res, null);
            } catch (Exception e) {
                String msg = "BeginTransaction: " + e.getMessage();
                rHandler.retChanges(call, retRes, msg);
            }
        } else {
            rHandler.retChanges(call, retRes, loadMessage);
        }
    }

    /**
     * CommitTransaction Method
     * Commit a Database Transaction
     *
     * @param call PluginCall
     */
    @PluginMethod
    public void commitTransaction(PluginCall call) {
        JSObject retRes = new JSObject();
        retRes.put("changes", Integer.valueOf(-1));
        if (!call.getData().has("database")) {
            String msg = "CommitTransaction: Must provide a database name";
            rHandler.retChanges(call, retRes, msg);
            return;
        }
        String dbName = call.getString("database");

        if (implementation != null) {
            try {
                JSObject res = implementation.commitTransaction(dbName);
                rHandler.retChanges(call, res, null);
            } catch (Exception e) {
                String msg = "CommitTransaction: " + e.getMessage();
                rHandler.retChanges(call, retRes, msg);
            }
        } else {
            rHandler.retChanges(call, retRes, loadMessage);
        }
    }

    /**
     * RollbackTransaction Method
     * Rollbact a Database Transaction
     *
     * @param call PluginCall
     */
    @PluginMethod
    public void rollbackTransaction(PluginCall call) {
        JSObject retRes = new JSObject();
        retRes.put("changes", Integer.valueOf(-1));
        if (!call.getData().has("database")) {
            String msg = "RollbackTransaction: Must provide a database name";
            rHandler.retChanges(call, retRes, msg);
            return;
        }
        String dbName = call.getString("database");

        if (implementation != null) {
            try {
                JSObject res = implementation.rollbackTransaction(dbName);
                rHandler.retChanges(call, res, null);
            } catch (Exception e) {
                String msg = "RollbackTransaction: " + e.getMessage();
                rHandler.retChanges(call, retRes, msg);
            }
        } else {
            rHandler.retChanges(call, retRes, loadMessage);
        }
    }

    /**
     * IsTransactionActive Method
     * Check if a Database Transaction is Active
     *
     * @param call PluginCall
     */
    @PluginMethod
    public void isTransactionActive(PluginCall call) {
        if (!call.getData().has("database")) {
            rHandler.retResult(call, null, "Must provide a database name");
            return;
        }
        String dbName = call.getString("database");
        if (implementation != null) {
            try {
                Boolean res = implementation.isTransactionActive(dbName);
                rHandler.retResult(call, res, null);
            } catch (Exception e) {
                String msg = "IsTransactionActive: " + e.getMessage();
                rHandler.retResult(call, null, msg);
            }
        } else {
            rHandler.retResult(call, null, loadMessage);
        }
    }

    /**
     * GetUrl Method
     * Get a database Url
     *
     * @param call PluginCall
     */
    @PluginMethod
    public void getUrl(PluginCall call) {
        if (!call.getData().has("database")) {
            String msg = "GetUrl: Must provide a database name";
            rHandler.retUrl(call, null, msg);
            return;
        }
        String dbName = call.getString("database");
        Boolean readOnly = call.getBoolean("readonly", false);
        if (implementation != null) {
            try {
                String res = implementation.getUrl(dbName, readOnly);
                rHandler.retUrl(call, res, null);
            } catch (Exception e) {
                String msg = "GetUrl: " + e.getMessage();
                rHandler.retUrl(call, null, msg);
            }
        } else {
            rHandler.retUrl(call, null, loadMessage);
        }
    }

    /**
     * GetVersion Method
     * Get a database Version
     *
     * @param call PluginCall
     */
    @PluginMethod
    public void getVersion(PluginCall call) {
        if (!call.getData().has("database")) {
            String msg = "GetVersion: Must provide a database name";
            rHandler.retVersion(call, null, msg);
            return;
        }
        String dbName = call.getString("database");
        Boolean readOnly = call.getBoolean("readonly", false);
        if (implementation != null) {
            try {
                Integer res = implementation.getVersion(dbName, readOnly);
                rHandler.retVersion(call, res, null);
            } catch (Exception e) {
                String msg = "GetVersion: " + e.getMessage();
                rHandler.retVersion(call, null, msg);
            }
        } else {
            rHandler.retVersion(call, null, loadMessage);
        }
    }

    /**
     * CloseNCConnection Method
     * Close a non-conformed database connection
     *
     * @param call PluginCall
     */
    @PluginMethod
    public void closeNCConnection(PluginCall call) {
        if (!call.getData().has("databasePath")) {
            String msg = "CloseNCConnection: Must provide a database path";
            rHandler.retResult(call, null, msg);
            return;
        }
        String dbPath = call.getString("databasePath");
        if (implementation != null) {
            try {
                implementation.closeNCConnection(dbPath);
                rHandler.retResult(call, null, null);
            } catch (Exception e) {
                String msg = "CloseNCConnection: " + e.getMessage();
                rHandler.retResult(call, null, msg);
            }
        } else {
            rHandler.retResult(call, null, loadMessage);
        }
    }

    /**
     * CloseConnection Method
     * Close the connection to a database
     *
     * @param call PluginCall
     */
    @PluginMethod
    public void closeConnection(PluginCall call) {
        if (!call.getData().has("database")) {
            String msg = "CloseConnection: Must provide a database name";
            rHandler.retResult(call, null, msg);
            return;
        }
        String dbName = call.getString("database");
        Boolean readOnly = call.getBoolean("readonly", false);
        if (implementation != null) {
            try {
                implementation.closeConnection(dbName, readOnly);
                rHandler.retResult(call, null, null);
            } catch (Exception e) {
                String msg = "CloseConnection: " + e.getMessage();
                rHandler.retResult(call, null, msg);
            }
        } else {
            rHandler.retResult(call, null, loadMessage);
        }
    }

    /**
     * CheckConnectionsConsistency Method
     * Check the connections consistency JS <=> Native
     *
     * @param call PluginCall
     */
    @PluginMethod
    public void checkConnectionsConsistency(PluginCall call) {
        if (!call.getData().has("dbNames")) {
            String msg = "CheckConnectionsConsistency: Must provide a " + "connection Array";
            rHandler.retResult(call, null, msg);
            return;
        }
        JSArray dbNames = call.getArray("dbNames");
        if (!call.getData().has("openModes")) {
            String msg = "CheckConnectionsConsistency: Must provide a " + "openModes Array";
            rHandler.retResult(call, null, msg);
            return;
        }
        JSArray openModes = call.getArray("openModes");
        if (dbNames == null || openModes == null) {
            String msg = "CheckConnectionsConsistency: No dbNames or openModes given";
            rHandler.retResult(call, null, msg);
            return;
        }
        if (implementation != null) {
            try {
                Boolean res = implementation.checkConnectionsConsistency(dbNames, openModes);
                rHandler.retResult(call, res, null);
            } catch (Exception e) {
                String msg = "CheckConnectionsConsistency: " + e.getMessage();
                rHandler.retResult(call, null, msg);
            }
        } else {
            rHandler.retResult(call, null, loadMessage);
        }
    }

    /**
     * IsDatabase Method
     * Check if the database file exists
     *
     * @param call PluginCall
     */
    @PluginMethod
    public void isDatabase(PluginCall call) {
        if (!call.getData().has("database")) {
            rHandler.retResult(call, null, "Must provide a database name");
            return;
        }
        String dbName = call.getString("database");
        if (implementation != null) {
            try {
                Boolean res = implementation.isDatabase(dbName);
                rHandler.retResult(call, res, null);
            } catch (Exception e) {
                String msg = "isDatabase: " + e.getMessage();
                rHandler.retResult(call, null, msg);
            }
        } else {
            rHandler.retResult(call, null, loadMessage);
        }
    }

    /**
     * IsDatabaseEncrypted Method
     * Check if the database is encrypted
     *
     * @param call PluginCall
     */
    @PluginMethod
    public void isDatabaseEncrypted(PluginCall call) {
        if (!call.getData().has("database")) {
            rHandler.retResult(call, null, "Must provide a database name");
            return;
        }
        String dbName = call.getString("database");
        if (implementation != null) {
            try {
                Boolean res = implementation.isDatabaseEncrypted(dbName);
                rHandler.retResult(call, res, null);
            } catch (Exception e) {
                String msg = "isDatabaseEncrypted: " + e.getMessage();
                rHandler.retResult(call, null, msg);
            }
        } else {
            rHandler.retResult(call, null, loadMessage);
        }
    }

    /**
     * isInConfigEncryption
     * Check if encryption is definrd in capacitor.config
     *
     * @param call PluginCall
     */
    @PluginMethod
    public void isInConfigEncryption(PluginCall call) {
        Boolean res = this.config.getIsEncryption();
        rHandler.retResult(call, res, null);
    }

    /**
     * isInConfigBiometricAuth
     * Check if biometric auth is definrd in capacitor.config
     *
     * @param call PluginCall
     */
    @PluginMethod
    public void isInConfigBiometricAuth(PluginCall call) {
        Boolean res = this.config.getBiometricAuth();
        rHandler.retResult(call, res, null);
    }

    /**
     * IsNCDatabase Method
     * Check if the database file exists
     *
     * @param call PluginCall
     */
    @PluginMethod
    public void isNCDatabase(PluginCall call) {
        if (!call.getData().has("databasePath")) {
            rHandler.retResult(call, null, "Must provide a database path");
            return;
        }
        String dbPath = call.getString("databasePath");
        if (implementation != null) {
            try {
                Boolean res = implementation.isNCDatabase(dbPath);
                rHandler.retResult(call, res, null);
            } catch (Exception e) {
                String msg = "isNCDatabase: " + e.getMessage();
                rHandler.retResult(call, null, msg);
            }
        } else {
            rHandler.retResult(call, null, loadMessage);
        }
    }

    /**
     * IsTableExists Method
     * Check if a table exists in a database
     *
     * @param call PluginCall
     */
    @PluginMethod
    public void isTableExists(PluginCall call) {
        if (!call.getData().has("database")) {
            rHandler.retResult(call, null, "Must provide a database name");
            return;
        }
        String dbName = call.getString("database");
        if (!call.getData().has("table")) {
            rHandler.retResult(call, null, "Must provide a table name");
            return;
        }
        String tableName = call.getString("table");
        Boolean readOnly = call.getBoolean("readonly", false);
        if (implementation != null) {
            try {
                Boolean res = implementation.isTableExists(dbName, tableName, readOnly);
                rHandler.retResult(call, res, null);
            } catch (Exception e) {
                String msg = "isTableExists: " + e.getMessage();
                rHandler.retResult(call, null, msg);
            }
        } else {
            rHandler.retResult(call, null, loadMessage);
        }
    }

    /**
     * GetDatabaseList Method
     * Return the list of databases
     */
    @PluginMethod
    public void getDatabaseList(PluginCall call) {
        if (implementation != null) {
            try {
                JSArray res = implementation.getDatabaseList();
                rHandler.retValues(call, res, null);
            } catch (Exception e) {
                String msg = "getDatabaseList: " + e.getMessage();
                rHandler.retValues(call, new JSArray(), msg);
            }
        } else {
            rHandler.retValues(call, new JSArray(), loadMessage);
        }
    }

    /**
     * GetMigratableDbList Method
     * Return the list of migratable databases
     */
    @PluginMethod
    public void getMigratableDbList(PluginCall call) {
        String folderPath;
        if (!call.getData().has("folderPath")) {
            folderPath = "default";
        } else {
            folderPath = call.getString("folderPath");
        }
        if (implementation != null) {
            try {
                JSArray res = implementation.getMigratableDbList(folderPath);
                rHandler.retValues(call, res, null);
            } catch (Exception e) {
                String msg = "getMigratableDbList: " + e.getMessage();
                rHandler.retValues(call, new JSArray(), msg);
            }
        } else {
            rHandler.retValues(call, new JSArray(), loadMessage);
        }
    }

    /**
     * AddSQLiteSuffix Method
     * Add SQLITE suffix to a list of databases
     */
    @PluginMethod
    public void addSQLiteSuffix(PluginCall call) {
        String folderPath;
        JSArray dbList;
        if (!call.getData().has("folderPath")) {
            folderPath = "default";
        } else {
            folderPath = call.getString("folderPath");
        }
        if (!call.getData().has("dbNameList")) {
            dbList = null;
        } else {
            dbList = call.getArray("dbNameList");
        }
        if (dbList == null) {
            String msg = "AddSQLiteSuffix: dbNameList not given or empty";
            rHandler.retResult(call, null, msg);
            return;
        }
        if (implementation != null) {
            try {
                implementation.addSQLiteSuffix(folderPath, dbList);
                rHandler.retResult(call, null, null);
            } catch (Exception e) {
                String msg = "addSQLiteSuffix: " + e.getMessage();
                rHandler.retResult(call, null, msg);
            }
        } else {
            rHandler.retResult(call, null, loadMessage);
        }
    }

    /**
     * DeleteOldDatabases Method
     * Delete Old Cordova plugin databases
     */
    @PluginMethod
    public void deleteOldDatabases(PluginCall call) {
        String folderPath;
        JSArray dbList;
        if (!call.getData().has("folderPath")) {
            folderPath = "default";
        } else {
            folderPath = call.getString("folderPath");
        }
        if (!call.getData().has("dbNameList")) {
            dbList = null;
        } else {
            dbList = call.getArray("dbNameList");
        }
        if (dbList == null) {
            String msg = "deleteOldDatabases: dbNameList not given or empty";
            rHandler.retResult(call, null, msg);
            return;
        }
        if (implementation != null) {
            try {
                implementation.deleteOldDatabases(folderPath, dbList);
                rHandler.retResult(call, null, null);
            } catch (Exception e) {
                String msg = "deleteOldDatabases: " + e.getMessage();
                rHandler.retResult(call, null, msg);
            }
        } else {
            rHandler.retResult(call, null, loadMessage);
        }
    }

    /**
     * DeleteOldDatabases Method
     * Delete Old Cordova plugin databases
     */
    @PluginMethod
    public void moveDatabasesAndAddSuffix(PluginCall call) {
        String folderPath;
        JSArray dbList;
        if (!call.getData().has("folderPath")) {
            folderPath = "default";
        } else {
            folderPath = call.getString("folderPath");
        }
        if (!call.getData().has("dbNameList")) {
            dbList = null;
        } else {
            dbList = call.getArray("dbNameList");
        }
        if (dbList == null) {
            String msg = "moveDatabasesAndAddSuffix: dbNameList not given or empty";
            rHandler.retResult(call, null, msg);
            return;
        }
        if (implementation != null) {
            try {
                implementation.moveDatabasesAndAddSuffix(folderPath, dbList);
                rHandler.retResult(call, null, null);
            } catch (Exception e) {
                String msg = "moveDatabasesAndAddSuffix: " + e.getMessage();
                rHandler.retResult(call, null, msg);
            }
        } else {
            rHandler.retResult(call, null, loadMessage);
        }
    }

    /**
     * Execute Method
     * Execute SQL statements provided in a String
     *
     * @param call PluginCall
     */
    @PluginMethod
    public void execute(PluginCall call) {
        JSObject retRes = new JSObject();
        retRes.put("changes", Integer.valueOf(-1));
        if (!call.getData().has("database")) {
            String msg = "Execute: Must provide a database name";
            rHandler.retChanges(call, retRes, msg);
            return;
        }
        String dbName = call.getString("database");
        if (!call.getData().has("statements")) {
            String msg = "Execute: Must provide raw SQL statements";
            rHandler.retChanges(call, retRes, msg);
            return;
        }
        String statements = call.getString("statements");
        Boolean transaction = call.getBoolean("transaction", true);
        Boolean readOnly = call.getBoolean("readonly", false);

        if (implementation != null) {
            try {
                JSObject res = implementation.execute(dbName, statements, transaction, readOnly);
                rHandler.retChanges(call, res, null);
            } catch (Exception e) {
                String msg = "Execute: " + e.getMessage();
                rHandler.retChanges(call, retRes, msg);
            }
        } else {
            rHandler.retChanges(call, retRes, loadMessage);
        }
    }

    /**
     * ExecuteSet Method
     * Execute a Set of raw sql statement
     *
     * @param call PluginCall
     * @throws Exception message
     */
    @PluginMethod
    public void executeSet(PluginCall call) throws Exception {
        JSObject retRes = new JSObject();
        retRes.put("changes", Integer.valueOf(-1));
        if (!call.getData().has("database")) {
            String msg = "ExecuteSet: Must provide a database name";
            rHandler.retChanges(call, retRes, msg);
            return;
        }
        String dbName = call.getString("database");
        if (!call.getData().has("set")) {
            String msg = "ExecuteSet: Must provide a set of SQL statements";
            rHandler.retChanges(call, retRes, msg);
            return;
        }
        JSArray set = call.getArray("set");
        if (set == null) {
            String msg = "ExecuteSet: Must provide a set of SQL statements";
            rHandler.retChanges(call, retRes, msg);
            return;
        }
        if (set.length() == 0) {
            String msg = "ExecuteSet: Must provide a non-empty set of SQL statements";
            rHandler.retChanges(call, retRes, msg);
            return;
        }
        for (int i = 0; i < set.length(); i++) {
            JSONArray keys = set.getJSONObject(i).names();
            for (int j = 0; j < keys.length(); ++j) {
                String key = keys.getString(j);
                if (!(key.equals("statement")) && !(key.equals("values"))) {
                    String msg = "ExecuteSet: Must provide a set as Array of {statement,";
                    msg += "values}";
                    rHandler.retChanges(call, retRes, msg);
                    return;
                }
            }
        }
        Boolean transaction = call.getBoolean("transaction", true);
        Boolean readOnly = call.getBoolean("readonly", false);
        String returnMode = call.getString("returnMode", "no");
        if (implementation != null) {
            try {
                JSObject res = implementation.executeSet(dbName, set, transaction, readOnly, returnMode);
                rHandler.retChanges(call, res, null);
            } catch (Exception e) {
                String msg = "ExecuteSet: " + e.getMessage();
                rHandler.retChanges(call, retRes, msg);
            }
        } else {
            rHandler.retChanges(call, retRes, loadMessage);
        }
    }

    /**
     * Run method
     * Execute a raw sql statement
     *
     * @param call PluginCall
     */
    @PluginMethod
    public void run(PluginCall call) {
        JSObject retRes = new JSObject();
        retRes.put("changes", Integer.valueOf(-1));
        if (!call.getData().has("database")) {
            String msg = "Run: Must provide a database name";
            rHandler.retChanges(call, retRes, msg);
            return;
        }
        String dbName = call.getString("database");
        if (!call.getData().has("statement")) {
            String msg = "Run: Must provide a SQL statement";
            rHandler.retChanges(call, retRes, msg);
            return;
        }
        String statement = call.getString("statement");
        if (!call.getData().has("values")) {
            String msg = "Run: Must provide an Array of values";
            rHandler.retChanges(call, retRes, msg);
            return;
        }
        JSArray values = call.getArray("values");
        if (values == null) {
            String msg = "Run: Must provide an Array of values";
            rHandler.retChanges(call, retRes, msg);
            return;
        }
        Boolean transaction = call.getBoolean("transaction", true);
        Boolean readOnly = call.getBoolean("readonly", false);
        String returnMode = call.getString("returnMode", "no");
        if (implementation != null) {
            try {
                JSObject res = implementation.run(dbName, statement, values, transaction, readOnly, returnMode);
                rHandler.retChanges(call, res, null);
            } catch (Exception e) {
                String msg = "Run: " + e.getMessage();
                rHandler.retChanges(call, retRes, msg);
            }
        } else {
            rHandler.retChanges(call, retRes, loadMessage);
        }
    }

    /**
     * Query Method
     * Execute an sql query
     *
     * @param call PluginCall
     */
    @PluginMethod
    public void query(PluginCall call) {
        if (!call.getData().has("database")) {
            String msg = "Query: Must provide a database name";
            rHandler.retValues(call, new JSArray(), msg);
            return;
        }
        String dbName = call.getString("database");
        if (!call.getData().has("statement")) {
            String msg = "Query: Must provide a SQL statement";
            rHandler.retValues(call, new JSArray(), msg);
            return;
        }
        String statement = call.getString("statement");
        if (!call.getData().has("values")) {
            String msg = "Query: Must provide an Array of Strings";
            rHandler.retValues(call, new JSArray(), msg);
            return;
        }
        JSArray values = call.getArray("values");
        if (values == null) {
            String msg = "Query: Must provide an Array of values";
            rHandler.retValues(call, new JSArray(), msg);
            return;
        }
        Boolean readOnly = call.getBoolean("readonly", false);
        if (implementation != null) {
            try {
                JSArray res = implementation.query(dbName, statement, values, readOnly);
                rHandler.retValues(call, res, null);
            } catch (Exception e) {
                String msg = "Query: " + e.getMessage();
                rHandler.retValues(call, new JSArray(), msg);
            }
        } else {
            rHandler.retValues(call, new JSArray(), loadMessage);
        }
    }

    @PluginMethod
    public void getTableList(PluginCall call) {
        if (!call.getData().has("database")) {
            String msg = "getTableList: Must provide a database name";
            rHandler.retValues(call, new JSArray(), msg);
            return;
        }
        String dbName = call.getString("database");
        Boolean readOnly = call.getBoolean("readonly", false);
        if (implementation != null) {
            try {
                JSArray res = implementation.getTableList(dbName, readOnly);
                rHandler.retValues(call, res, null);
            } catch (Exception e) {
                String msg = "GetTableList: " + e.getMessage();
                rHandler.retValues(call, new JSArray(), msg);
            }
        } else {
            rHandler.retValues(call, new JSArray(), loadMessage);
        }
    }

    /**
     * IsDBExists Method
     * check if the database exists on the database folder
     *
     * @param call PluginCall
     */
    @PluginMethod
    public void isDBExists(PluginCall call) {
        if (!call.getData().has("database")) {
            String msg = "isDBExists: Must provide a database name";
            rHandler.retResult(call, false, msg);
            return;
        }
        String dbName = call.getString("database");
        Boolean readOnly = call.getBoolean("readonly", false);

        if (implementation != null) {
            try {
                Boolean res = implementation.isDBExists(dbName, readOnly);
                rHandler.retResult(call, res, null);
            } catch (Exception e) {
                String msg = "isDBExists: " + e.getMessage();
                rHandler.retResult(call, false, msg);
            }
        } else {
            rHandler.retResult(call, null, loadMessage);
        }
    }

    /**
     * IsDBOpen Method
     * check if the database is opened
     *
     * @param call PluginCall
     */
    @PluginMethod
    public void isDBOpen(PluginCall call) {
        if (!call.getData().has("database")) {
            String msg = "isDBOpen: Must provide a database name";
            rHandler.retResult(call, false, msg);
            return;
        }
        String dbName = call.getString("database");
        Boolean readOnly = call.getBoolean("readonly", false);
        if (implementation != null) {
            try {
                Boolean res = implementation.isDBOpen(dbName, readOnly);
                rHandler.retResult(call, res, null);
            } catch (Exception e) {
                String msg = "isDBOpen: " + e.getMessage();
                rHandler.retResult(call, false, msg);
            }
        } else {
            rHandler.retResult(call, null, loadMessage);
        }
    }

    /**
     * DeleteDatabase Method
     * delete a database from the database folder
     *
     * @param call PluginCall
     */
    @PluginMethod
    public void deleteDatabase(PluginCall call) {
        if (!call.getData().has("database")) {
            String msg = "deleteDatabase: Must provide a database name";
            rHandler.retResult(call, null, msg);
            return;
        }
        String dbName = call.getString("database");
        Boolean readOnly = call.getBoolean("readonly", false);
        if (implementation != null) {
            try {
                implementation.deleteDatabase(dbName, readOnly);
                rHandler.retResult(call, null, null);
            } catch (Exception e) {
                String msg = "deleteDatabase: " + e.getMessage();
                rHandler.retResult(call, null, msg);
            }
        } else {
            rHandler.retResult(call, null, loadMessage);
        }
    }

    /**
     * CreateSyncTable Method
     * Create the synchronization table
     *
     * @param call PluginCall
     */
    @PluginMethod
    public void createSyncTable(PluginCall call) {
        JSObject retRes = new JSObject();
        retRes.put("changes", Integer.valueOf(-1));
        if (!call.getData().has("database")) {
            String msg = "CreateSyncTable: Must provide a database name";
            rHandler.retChanges(call, retRes, msg);
            return;
        }
        String dbName = call.getString("database");
        Boolean readOnly = call.getBoolean("readonly", false);
        if (implementation != null) {
            try {
                JSObject res = implementation.createSyncTable(dbName, readOnly);
                rHandler.retChanges(call, res, null);
            } catch (Exception e) {
                String msg = "CreateSyncTable: " + e.getMessage();
                rHandler.retChanges(call, retRes, msg);
            }
        } else {
            rHandler.retChanges(call, retRes, loadMessage);
        }
    }

    /**
     * SetSyncDate Method
     * set the synchronization date
     *
     * @param call PluginCall
     */
    @PluginMethod
    public void setSyncDate(PluginCall call) {
        if (!call.getData().has("database")) {
            String msg = "SetSyncDate: Must provide a database name";
            rHandler.retResult(call, null, msg);
            return;
        }
        String dbName = call.getString("database");

        if (!call.getData().has("syncdate")) {
            String msg = "SetSyncDate : Must provide a sync date";
            rHandler.retResult(call, null, msg);
            return;
        }
        String syncDate = call.getString("syncdate");
        Boolean readOnly = call.getBoolean("readonly", false);
        if (implementation != null) {
            try {
                implementation.setSyncDate(dbName, syncDate, readOnly);
                rHandler.retResult(call, null, null);
            } catch (Exception e) {
                String msg = "SetSyncDate: " + e.getMessage();
                rHandler.retResult(call, null, msg);
            }
        } else {
            rHandler.retResult(call, null, loadMessage);
        }
    }

    /**
     * GetSyncDate Method
     * Get the synchronization date
     *
     * @param call PluginCall
     */
    @PluginMethod
    public void getSyncDate(PluginCall call) {
        JSObject retRes = new JSObject();
        if (!call.getData().has("database")) {
            String msg = "GetSyncDate : Must provide a database name";
            retRes.put("changes", Integer.valueOf(-1));
            rHandler.retSyncDate(call, 0L, msg);
            return;
        }
        String dbName = call.getString("database");
        Boolean readOnly = call.getBoolean("readonly", false);
        if (implementation != null) {
            try {
                long syncDate = implementation.getSyncDate(dbName, readOnly);
                rHandler.retSyncDate(call, syncDate, null);
            } catch (Exception e) {
                String msg = "GetSyncDate: " + e.getMessage();
                rHandler.retSyncDate(call, 0L, msg);
            }
        } else {
            rHandler.retSyncDate(call, 0L, loadMessage);
        }
    }

    /**
     * AddUpgradeStatement Method
     * Define an upgrade object when updating to a new version
     *
     * @param call PluginCall
     */
    @PluginMethod
    public void addUpgradeStatement(PluginCall call) {
        if (!call.getData().has("database")) {
            String msg = "AddUpgradeStatement: Must provide a database name";
            rHandler.retResult(call, null, msg);
            return;
        }
        String dbName = call.getString("database");
        if (!call.getData().has("upgrade")) {
            String msg = "AddUpgradeStatement: Must provide an array with upgrade statement";
            rHandler.retResult(call, null, msg);
            return;
        }
        JSArray upgrade = call.getArray("upgrade");
        if (upgrade == null) {
            String msg = "AddUpgradeStatement: Must provide an array with upgrade statement";
            rHandler.retResult(call, null, msg);
            return;
        }

        if (implementation != null) {
            try {
                Dictionary<Integer, JSONObject> upgDict = implementation.addUpgradeStatement(upgrade);

                if (versionUpgrades.get(dbName) != null) {
                    List<Integer> keys = Collections.list(upgDict.keys());
                    for (Integer versionKey : keys) {
                        JSONObject upgObj = upgDict.get(versionKey);

                        versionUpgrades.get(dbName).put(versionKey, upgObj);
                    }
                } else {
                    versionUpgrades.put(dbName, upgDict);
                }

                rHandler.retResult(call, null, null);
            } catch (Exception e) {
                String msg = "AddUpgradeStatement: " + e.getMessage();
                rHandler.retResult(call, null, msg);
            }
        } else {
            rHandler.retResult(call, null, loadMessage);
        }
    }

    /**
     * IsJsonValid
     * Check the validity of a given Json object
     *
     * @param call PluginCall
     */
    @PluginMethod
    public void isJsonValid(PluginCall call) {
        if (!call.getData().has("jsonstring")) {
            String msg = "IsJsonValid: Must provide a Stringify Json Object";
            rHandler.retResult(call, false, msg);
            return;
        }
        String parsingData = call.getString("jsonstring");
        if (implementation != null) {
            try {
                Boolean res = implementation.isJsonValid(parsingData);
                rHandler.retResult(call, res, null);
            } catch (Exception e) {
                String msg = "IsJsonValid: " + e.getMessage();
                rHandler.retResult(call, false, msg);
            }
        } else {
            rHandler.retResult(call, null, loadMessage);
        }
    }

    /**
     * ImportFromJson Method
     * Import from a given Json object
     *
     * @param call PluginCall
     */
    @PluginMethod
    public void importFromJson(PluginCall call) {
        JSObject retRes = new JSObject();
        retRes.put("changes", Integer.valueOf(-1));
        if (!call.getData().has("jsonstring")) {
            String msg = "ImportFromJson: Must provide a Stringify Json Object";
            rHandler.retChanges(call, retRes, msg);
            return;
        }
        String parsingData = call.getString("jsonstring");
        if (implementation != null) {
            try {
                JSObject res = implementation.importFromJson(parsingData);
                rHandler.retChanges(call, res, null);
            } catch (Exception e) {
                String msg = "ImportFromJson: " + e.getMessage();
                rHandler.retChanges(call, retRes, msg);
            }
        } else {
            rHandler.retChanges(call, retRes, loadMessage);
        }
    }

    /**
     * ExportToJson Method
     * Export the database to Json Object
     *
     * @param call PluginCall
     */
    @PluginMethod
    public void exportToJson(PluginCall call) {
        JSObject retObj = new JSObject();
        if (!call.getData().has("database")) {
            String msg = "ExportToJson: Must provide a database name";
            rHandler.retJSObject(call, retObj, msg);
            return;
        }
        String dbName = call.getString("database");
        if (!call.getData().has("jsonexportmode")) {
            String msg = "ExportToJson: Must provide an export mode";
            rHandler.retJSObject(call, retObj, msg);
            return;
        }
        String expMode = call.getString("jsonexportmode");

        if (!expMode.equals("full") && !expMode.equals("partial")) {
            String msg = "ExportToJson: Json export mode should be 'full' or 'partial'";
            rHandler.retJSObject(call, retObj, msg);
            return;
        }
        Boolean readOnly = call.getBoolean("readonly", false);
        Boolean encrypted = call.getBoolean("encrypted", false);

        if (implementation != null) {
            try {
                JSObject res = implementation.exportToJson(dbName, expMode, readOnly, encrypted);
                rHandler.retJSObject(call, res, null);
            } catch (Exception e) {
                String msg = "ExportToJson: " + e.getMessage();
                rHandler.retJSObject(call, retObj, msg);
            }
        } else {
            rHandler.retJSObject(call, retObj, loadMessage);
        }
    }

    @PluginMethod
    public void deleteExportedRows(PluginCall call) {
        if (!call.getData().has("database")) {
            String msg = "DeleteExportedRows: Must provide a database name";
            rHandler.retResult(call, null, msg);
            return;
        }
        String dbName = call.getString("database");
        Boolean readOnly = call.getBoolean("readonly", false);
        if (implementation != null) {
            try {
                implementation.deleteExportedRows(dbName, readOnly);
                rHandler.retResult(call, null, null);
            } catch (Exception e) {
                String msg = "DeleteExportedRows: " + e.getMessage();
                rHandler.retResult(call, null, msg);
            }
        } else {
            rHandler.retResult(call, null, loadMessage);
        }
    }

    /**
     * CopyFromAssets
     * copy all databases from public/assets/databases to application folder
     *
     * @param call PluginCall
     */
    @PluginMethod
    public void copyFromAssets(PluginCall call) {
        Boolean overwrite = call.getData().has("overwrite") ? call.getBoolean("overwrite") : true;

        if (implementation != null) {
            try {
                implementation.copyFromAssets(overwrite);
                rHandler.retResult(call, null, null);
            } catch (Exception e) {
                String msg = "CopyFromAssets: " + e.getMessage();
                rHandler.retResult(call, null, msg);
            }
        } else {
            rHandler.retResult(call, null, loadMessage);
        }
    }

    /**
     * GetFromHTTPRequest
     * get a database or a zipped database from HTTP Request
     *
     * @param call PluginCall
     */
    @PluginMethod
    public void getFromHTTPRequest(PluginCall call) {
        if (!call.getData().has("url")) {
            String msg = "GetFromHTTPRequest: Must provide a database url";
            rHandler.retResult(call, null, msg);
            return;
        }
        String url = call.getString("url");
        if (implementation != null) {
            Runnable setHTTPRunnable = () -> {
                android.os.Process.setThreadPriority(android.os.Process.THREAD_PRIORITY_BACKGROUND);
                try {
                    implementation.getFromHTTPRequest(url);
                    getActivity().runOnUiThread(() -> rHandler.retResult(call, null, null));
                } catch (Exception e) {
                    getActivity()
                        .runOnUiThread(() -> {
                            String msg = "GetFromHTTPRequest: " + e.getMessage();
                            rHandler.retResult(call, null, msg);
                        });
                }
            };
            Thread myHttpThread = new Thread(setHTTPRunnable);
            myHttpThread.start();
            while (myHttpThread.isAlive());
            System.out.println("Thread Exiting!");
        } else {
            rHandler.retResult(call, null, loadMessage);
        }
    }

    private void AddObserversToNotificationCenter() {
        NotificationCenter.defaultCenter()
            .addMethodForNotification(
                "importJsonProgress",
                new MyRunnable() {
                    @Override
                    public void run() {
                        JSObject data = new JSObject();
                        data.put("progress", this.getInfo().get("progress"));
                        notifyListeners("sqliteImportProgressEvent", data);
                    }
                }
            );
        NotificationCenter.defaultCenter()
            .addMethodForNotification(
                "exportJsonProgress",
                new MyRunnable() {
                    @Override
                    public void run() {
                        JSObject data = new JSObject();
                        data.put("progress", this.getInfo().get("progress"));
                        notifyListeners("sqliteExportProgressEvent", data);
                    }
                }
            );
        NotificationCenter.defaultCenter()
            .addMethodForNotification(
                "biometricResults",
                new MyRunnable() {
                    @Override
                    public void run() {
                        JSObject data = new JSObject();
                        data.put("result", this.getInfo().get("result"));
                        data.put("message", this.getInfo().get("message"));
                        notifyListeners("sqliteBiometricEvent", data);
                    }
                }
            );
    }

    private SqliteConfig getSqliteConfig() throws JSONException {
        SqliteConfig config = new SqliteConfig();
        JSONObject pConfig = getConfig().getConfigJSON();
        boolean isEncryption = pConfig.has("androidIsEncryption") ? pConfig.getBoolean("androidIsEncryption") : config.getIsEncryption();
        config.setIsEncryption(isEncryption);
        JSONObject androidBiometric = pConfig.has("androidBiometric") ? pConfig.getJSONObject("androidBiometric") : null;
        if (androidBiometric != null) {
            boolean biometricAuth = androidBiometric.has("biometricAuth") && isEncryption
                ? androidBiometric.getBoolean("biometricAuth")
                : config.getBiometricAuth();
            config.setBiometricAuth(biometricAuth);
            String biometricTitle = androidBiometric.has("biometricTitle")
                ? androidBiometric.getString("biometricTitle")
                : config.getBiometricTitle();
            config.setBiometricTitle(biometricTitle);
            String biometricSubTitle = androidBiometric.has("biometricSubTitle")
                ? androidBiometric.getString("biometricSubTitle")
                : config.getBiometricSubTitle();
            config.setBiometricSubTitle(biometricSubTitle);
        }
        return config;
    }
}
