package com.getcapacitor.community.database.sqlite;

import android.content.Context;
import android.content.SharedPreferences;
import android.text.TextUtils;
import android.util.Log;
import android.widget.Toast;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.security.crypto.EncryptedSharedPreferences;
import androidx.security.crypto.MasterKey;
import androidx.security.crypto.MasterKeys;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PluginCall;
import com.getcapacitor.community.database.sqlite.SQLite.BiometricListener;
import com.getcapacitor.community.database.sqlite.SQLite.Database;
import com.getcapacitor.community.database.sqlite.SQLite.ImportExportJson.JsonSQLite;
import com.getcapacitor.community.database.sqlite.SQLite.ImportExportJson.UtilsJson;
import com.getcapacitor.community.database.sqlite.SQLite.SqliteConfig;
import com.getcapacitor.community.database.sqlite.SQLite.UtilsBiometric;
import com.getcapacitor.community.database.sqlite.SQLite.UtilsFile;
import com.getcapacitor.community.database.sqlite.SQLite.UtilsMigrate;
import com.getcapacitor.community.database.sqlite.SQLite.UtilsNCDatabase;
import com.getcapacitor.community.database.sqlite.SQLite.UtilsSQLite;
import com.getcapacitor.community.database.sqlite.SQLite.UtilsSecret;
import java.io.File;
import java.io.IOException;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.KeyStore;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Dictionary;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Hashtable;
import java.util.Map;
import java.util.Set;
import javax.crypto.BadPaddingException;
import javax.crypto.IllegalBlockSizeException;
import org.json.JSONException;
import org.json.JSONObject;

public class CapacitorSQLite {

    private static final String TAG = CapacitorSQLite.class.getName();
    private Context context;
    private Dictionary<String, Database> dbDict = new Hashtable<>();
    private UtilsSQLite uSqlite = new UtilsSQLite();
    private UtilsFile uFile = new UtilsFile();
    private UtilsJson uJson = new UtilsJson();
    private UtilsMigrate uMigrate = new UtilsMigrate();
    private UtilsNCDatabase uNCDatabase = new UtilsNCDatabase();
    private UtilsSecret uSecret;
    private SharedPreferences sharedPreferences = null;
    private MasterKey masterKeyAlias;
    private BiometricManager biometricManager;
    private SqliteConfig config;
    private Boolean isEncryption = true;
    private Boolean biometricAuth = false;
    private String biometricTitle;
    private String biometricSubTitle;
    private int VALIDITY_DURATION = 5;
    private RetHandler rHandler = new RetHandler();
    private PluginCall call;

    public CapacitorSQLite(Context context, SqliteConfig config) throws Exception {
        this.context = context;
        this.call = call;
        this.config = config;
        this.isEncryption = this.config.getIsEncryption();
        this.biometricAuth = this.config.getBiometricAuth();
        this.biometricTitle = this.config.getBiometricTitle();
        this.biometricSubTitle = this.config.getBiometricSubTitle();
        try {
            if (isEncryption) {
                // create or retrieve masterkey from Android keystore
                // it will be used to encrypt the passphrase for a database

                if (biometricAuth) {
                    biometricManager = BiometricManager.from(this.context);
                    BiometricListener listener = new BiometricListener() {
                        @Override
                        public void onSuccess(BiometricPrompt.AuthenticationResult result) {
                            try {
                                KeyStore ks = KeyStore.getInstance("AndroidKeyStore");
                                ks.load(null);
                                Enumeration<String> aliases = ks.aliases();
                                if (aliases.hasMoreElements()) {
                                    masterKeyAlias =
                                        new MasterKey.Builder(context)
                                            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                                            .setUserAuthenticationRequired(true, VALIDITY_DURATION)
                                            .build();
                                } else {
                                    masterKeyAlias = new MasterKey.Builder(context).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build();
                                }
                                setSharedPreferences();
                                notifyBiometricEvent(true, null);
                                return;
                            } catch (Exception e) {
                                String input = e.getMessage();
                                Log.e("MY_APP_TAG", input);
                                //                            Toast.makeText(context, input, Toast.LENGTH_LONG).show();
                                notifyBiometricEvent(false, input);
                            }
                        }

                        @Override
                        public void onFailed() {
                            String input = "Error in authenticating biometric";
                            Log.e("MY_APP_TAG", input);
                            //                        Toast.makeText(context, input, Toast.LENGTH_LONG).show();
                            notifyBiometricEvent(false, input);
                        }
                    };
                    UtilsBiometric uBiom = new UtilsBiometric(context, biometricManager, listener);
                    if (uBiom.checkBiometricIsAvailable()) {
                        uBiom.showBiometricDialog(this.biometricTitle, this.biometricSubTitle);
                    } else {
                        masterKeyAlias = new MasterKey.Builder(context).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build();
                        setSharedPreferences();
                    }
                } else {
                    masterKeyAlias = new MasterKey.Builder(context).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build();
                    setSharedPreferences();
                }
            }
        } catch (Exception e) {
            throw new Exception(e.getMessage());
        }
    }

    private void notifyBiometricEvent(Boolean ret, String msg) {
        Map<String, Object> info = new HashMap<String, Object>() {
            {
                put("result", ret);
                put("message", msg);
            }
        };
        Log.v(TAG, "$$$$$ in notifyBiometricEvent " + info);
        NotificationCenter.defaultCenter().postNotification("biometricResults", info);
    }

    private void setSharedPreferences() throws Exception {
        try {
            // get instance of the EncryptedSharedPreferences class
            this.sharedPreferences =
                EncryptedSharedPreferences.create(
                    context,
                    "sqlite_encrypted_shared_prefs",
                    masterKeyAlias,
                    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
                );
            this.uSecret = new UtilsSecret(this.context, this.sharedPreferences);
        } catch (Exception e) {
            throw new Exception(e.getMessage());
        }
    }

    /**
     * Echo
     * @param value
     * @return
     */
    public String echo(String value) {
        return value;
    }

    public Boolean isSecretStored() throws Exception {
        Boolean ret = false;
        if (isEncryption) {
            try {
                String secret = uSecret.getPassphrase();
                if (secret.length() > 0) ret = true;
                return ret;
            } catch (Exception e) {
                throw new Exception(e.getMessage());
            }
        } else {
            throw new Exception("No Encryption set in capacitor.config");
        }
    }

    /**
     * SetEncryptionSecret
     * @param passphrase
     * @throws Exception
     */
    public void setEncryptionSecret(String passphrase) throws Exception {
        if (isEncryption) {
            try {
                // close all connections
                closeAllConnections();
                // set encryption secret
                uSecret.setEncryptionSecret(passphrase);
            } catch (Exception e) {
                throw new Exception(e.getMessage());
            }
        } else {
            throw new Exception("No Encryption set in capacitor.config");
        }
    }

    /**
     * ChangeEncryptionSecret
     * @param passphrase
     * @param oldPassphrase
     * @throws Exception
     */
    public void changeEncryptionSecret(PluginCall call, String passphrase, String oldPassphrase) throws Exception {
        this.call = call;
        if (isEncryption) {
            try {
                // close all connections
                closeAllConnections();
                if (biometricAuth) {
                    BiometricListener listener = new BiometricListener() {
                        @Override
                        public void onSuccess(BiometricPrompt.AuthenticationResult result) {
                            try {
                                // change encryption secret
                                uSecret.changeEncryptionSecret(passphrase, oldPassphrase);
                                rHandler.retResult(call, null, null);
                                return;
                            } catch (Exception e) {
                                String input = e.getMessage();
                                Log.e("MY_APP_TAG", input);
                                Toast.makeText(context, input, Toast.LENGTH_LONG).show();
                                rHandler.retResult(call, null, e.getMessage());
                            }
                        }

                        @Override
                        public void onFailed() {
                            String input = "Error in authenticating biometric";
                            Log.e("MY_APP_TAG", input);
                            Toast.makeText(context, input, Toast.LENGTH_LONG).show();
                            rHandler.retResult(call, null, input);
                        }
                    };

                    UtilsBiometric uBiom = new UtilsBiometric(context, biometricManager, listener);
                    if (uBiom.checkBiometricIsAvailable()) {
                        uBiom.showBiometricDialog(biometricTitle, biometricSubTitle);
                    } else {
                        throw new Exception("Biometric features are currently unavailable.");
                    }
                } else {
                    // change encryption secret
                    uSecret.changeEncryptionSecret(passphrase, oldPassphrase);
                }
            } catch (Exception e) {
                throw new Exception(e.getMessage());
            }
        } else {
            throw new Exception("No Encryption set in capacitor.config");
        }
    }

    /**
     * ClearEncryptionSecret
     * @throws Exception
     */
    public void clearEncryptionSecret() throws Exception {
        if (isEncryption) {
            try {
                // close all connections
                closeAllConnections();
                // set encryption secret
                uSecret.clearEncryptionSecret();
            } catch (Exception e) {
                throw new Exception(e.getMessage());
            }
        } else {
            throw new Exception("No Encryption set in capacitor.config");
        }
    }

    public String getNCDatabasePath(String folderPath, String database) throws Exception {
        try {
            String databasePath = uNCDatabase.getNCDatabasePath(context, folderPath, database);
            return databasePath;
        } catch (Exception e) {
            throw new Exception(e.getMessage());
        }
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
        dbName = getDatabaseName(dbName);
        // check if connection already exists
        Database conn = dbDict.get(dbName);
        if (conn != null) {
            String msg = "Connection " + dbName + " already exists";
            throw new Exception(msg);
        }
        if (encrypted && !isEncryption) {
            throw new Exception("Database cannot be encrypted as 'No Encryption' set in capacitor.config");
        }
        try {
            Database db = new Database(
                context,
                dbName + "SQLite.db",
                encrypted,
                mode,
                version,
                isEncryption,
                vUpgObject,
                sharedPreferences
            );
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
     * CreateNCConnection
     * @param dbPath
     * @param version
     * @throws Exception
     */
    public void createNCConnection(String dbPath, int version) throws Exception {
        // check if connection already exists
        Database conn = dbDict.get(dbPath);
        if (conn != null) {
            String msg = "Connection " + dbPath + " already exists";
            throw new Exception(msg);
        }
        try {
            Boolean isDBPathExists = uFile.isPathExists(dbPath);
            if (!isDBPathExists) {
                String msg = "Database " + dbPath + " does not exist";
                throw new Exception(msg);
            }
            Database db = new Database(
                context,
                dbPath,
                false,
                "no-encryption",
                version,
                isEncryption,
                new Hashtable<>(),
                sharedPreferences
            );
            if (db != null) {
                dbDict.put(dbPath, db);
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
        dbName = getDatabaseName(dbName);
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
        dbName = getDatabaseName(dbName);
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
     * GetUrl
     * @param dbName
     * @throws Exception
     * @return String
     */
    public String getUrl(String dbName) throws Exception {
        dbName = getDatabaseName(dbName);
        Database db = dbDict.get(dbName);
        if (db != null) {
            try {
                String url = db.getUrl();
                return url;
            } catch (Exception e) {
                throw new Exception(e.getMessage());
            }
        } else {
            String msg = "No available connection for database " + dbName;
            throw new Exception(msg);
        }
    }

    /**
     * GetVersion
     * @param dbName
     * @throws Exception
     * @return Integer
     */
    public Integer getVersion(String dbName) throws Exception {
        dbName = getDatabaseName(dbName);
        Database db = dbDict.get(dbName);
        if (db != null) {
            try {
                Integer version = db.getVersion();
                return version;
            } catch (Exception e) {
                throw new Exception(e.getMessage());
            }
        } else {
            String msg = "No available connection for database " + dbName;
            throw new Exception(msg);
        }
    }

    /**
     * CloseNCConnection
     * @param dbPath
     * @throws Exception
     */
    public void closeNCConnection(String dbPath) throws Exception {
        Database db = dbDict.get(dbPath);
        if (db != null) {
            if (db.isOpen()) {
                try {
                    close(dbPath);
                } catch (Exception e) {
                    throw new Exception(e.getMessage());
                }
            }
            dbDict.remove(dbPath);
            return;
        } else {
            String msg = "No available connection for database " + dbPath;
            throw new Exception(msg);
        }
    }

    /**
     * CloseConnection
     * @param dbName
     * @throws Exception
     */
    public void closeConnection(String dbName) throws Exception {
        dbName = getDatabaseName(dbName);
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

    public Boolean checkConnectionsConsistency(JSArray dbNames) throws Exception {
        Set<String> keys = new HashSet<String>(Collections.list(dbDict.keys()));
        String msg = "All Native Connections released";
        Set<String> conns = new HashSet<String>(uSqlite.stringJSArrayToArrayList(dbNames));
        try {
            if (conns.size() == 0) {
                closeAllConnections();
                return false;
            }
            if (keys.size() < conns.size()) {
                // not solvable inconsistency
                closeAllConnections();
                return false;
            }
            if (keys.size() > conns.size()) {
                for (String key : keys) {
                    if (!conns.contains(key)) {
                        dbDict.remove(key);
                    }
                }
            }
            keys = new HashSet<String>(Collections.list(dbDict.keys()));
            if (keys.size() == conns.size()) {
                Set<String> symmetricDiff = new HashSet<String>(keys);
                symmetricDiff.addAll(conns);
                Set<String> tmp = new HashSet<String>(keys);
                tmp.retainAll(conns);
                symmetricDiff.removeAll(tmp);
                if (symmetricDiff.size() == 0) {
                    return true;
                } else {
                    // not solvable inconsistency
                    closeAllConnections();
                    return false;
                }
            } else {
                closeAllConnections();
                return false;
            }
        } catch (Exception e) {
            throw new Exception(e.getMessage());
        }
    }

    /**
     * IsDatabase
     * @param dbName
     * @return Boolean
     * @throws Exception
     */
    public Boolean isDatabase(String dbName) {
        dbName = getDatabaseName(dbName);
        return uFile.isFileExists(context, dbName + "SQLite.db");
    }

    /**
     * IsNCDatabase
     * @param dbPath
     * @return Boolean
     * @throws Exception
     */
    public Boolean isNCDatabase(String dbPath) {
        return uFile.isPathExists(dbPath);
    }

    /**
     * IsTableExists
     * @param dbName
     * @param tableName
     * @throws Exception
     */
    public Boolean isTableExists(String dbName, String tableName) throws Exception {
        dbName = getDatabaseName(dbName);
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
     * GetDatabaseList
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
     * GetMigratableDbList
     * @return JSArray
     * @throws Exception
     */
    public JSArray getMigratableDbList(String folderPath) throws Exception {
        String[] listFiles = uMigrate.getMigratableList(context, folderPath);
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
    public void addSQLiteSuffix(String folderPath, JSArray dbList) throws Exception {
        try {
            ArrayList<String> mDbList = uSqlite.stringJSArrayToArrayList(dbList);
            uMigrate.addSQLiteSuffix(context, folderPath, mDbList);
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
    public void deleteOldDatabases(String folderPath, JSArray dbList) throws Exception {
        try {
            ArrayList<String> mDbList = uSqlite.stringJSArrayToArrayList(dbList);
            uMigrate.deleteOldDatabases(context, folderPath, mDbList);
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
    public void moveDatabasesAndAddSuffix(String folderPath, JSArray dbList) throws Exception {
        try {
            ArrayList<String> mDbList = uSqlite.stringJSArrayToArrayList(dbList);
            uMigrate.moveDatabasesAndAddSuffix(context, folderPath, mDbList);
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
    public JSObject execute(String dbName, String statements, Boolean transaction) throws Exception {
        dbName = getDatabaseName(dbName);
        Database db = dbDict.get(dbName);
        if (db != null) {
            if (!db.isNCDB() && db.isOpen()) {
                // convert string in string[]
                String[] sqlCmdArray = uSqlite.getStatementsArray(statements);
                try {
                    JSObject res = db.execute(sqlCmdArray, transaction);
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
    public JSObject executeSet(String dbName, JSArray set, Boolean transaction) throws Exception {
        dbName = getDatabaseName(dbName);
        Database db = dbDict.get(dbName);
        if (db != null) {
            if (!db.isNCDB() && db.isOpen()) {
                try {
                    JSObject res = db.executeSet(set, transaction);
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
    public JSObject run(String dbName, String statement, JSArray values, Boolean transaction) throws Exception {
        JSObject res;
        dbName = getDatabaseName(dbName);
        Database db = dbDict.get(dbName);
        if (db != null) {
            if (!db.isNCDB() && db.isOpen()) {
                if (values.length() > 0) {
                    try {
                        ArrayList<Object> arrValues = uSqlite.objectJSArrayToArrayList(values);
                        res = db.runSQL(statement, arrValues, transaction);
                        return res;
                    } catch (JSONException e) {
                        throw new Exception(e.getMessage());
                    } catch (Exception e) {
                        throw new Exception(e.getMessage());
                    }
                } else {
                    try {
                        res = db.runSQL(statement, null, transaction);
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
        dbName = getDatabaseName(dbName);
        Database db = dbDict.get(dbName);
        if (db != null) {
            if (db.isOpen()) {
                if (values.length() > 0) {
                    try {
                        ArrayList<Object> arrValues = uSqlite.objectJSArrayToArrayList(values);
                        res = db.selectSQL(statement, arrValues);
                        return res;
                    } catch (JSONException e) {
                        throw new Exception(e.getMessage());
                    } catch (Exception e) {
                        throw new Exception(e.getMessage());
                    }
                } else {
                    try {
                        res = db.selectSQL(statement, new ArrayList<Object>());
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

    public JSArray getTableList(String dbName) throws Exception {
        JSArray res;
        dbName = getDatabaseName(dbName);
        Database db = dbDict.get(dbName);
        if (db != null) {
            if (db.isOpen()) {
                res = db.getTableNames();
                return res;
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
        dbName = getDatabaseName(dbName);
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
        dbName = getDatabaseName(dbName);
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
        dbName = getDatabaseName(dbName);
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
        dbName = getDatabaseName(dbName);
        Database db = dbDict.get(dbName);
        if (db != null) {
            try {
                if (!db.isOpen()) {
                    String msg = "CreateSyncTable: db not opened";
                    throw new Exception(msg);
                }
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
        dbName = getDatabaseName(dbName);
        Database db = dbDict.get(dbName);
        if (db != null) {
            try {
                if (!db.isOpen()) {
                    String msg = "SetSyncDate: db not opened";
                    throw new Exception(msg);
                }
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
        dbName = getDatabaseName(dbName);
        Database db = dbDict.get(dbName);
        if (db != null) {
            try {
                if (!db.isOpen()) {
                    String msg = "GetSyncDate: db not opened";
                    throw new Exception(msg);
                }
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
            Boolean isValid = jsonSQL.isJsonSQLite(jsonObject, isEncryption);
            return isValid;
        } catch (Exception e) {
            throw new Exception(e.getMessage());
        }
    }

    public JSObject importFromJson(String parsingData) throws Exception {
        try {
            JSObject jsonObject = new JSObject(parsingData);
            JsonSQLite jsonSQL = new JsonSQLite();
            Boolean isValid = jsonSQL.isJsonSQLite(jsonObject, isEncryption);
            if (!isValid) {
                String msg = "Stringify Json Object not Valid";
                throw new Exception(msg);
            }
            String dbName = getDatabaseName(jsonSQL.getDatabase());
            dbName = new StringBuilder(dbName).append("SQLite.db").toString();
            Integer dbVersion = jsonSQL.getVersion();
            String mode = jsonSQL.getMode();
            Boolean overwrite = jsonSQL.getOverwrite();
            //            jsonSQL.print();
            Boolean encrypted = jsonSQL.getEncrypted();
            String inMode = "no-encryption";
            if (encrypted) {
                inMode = "secret";
            }
            Database db = new Database(context, dbName, encrypted, inMode, dbVersion, isEncryption, new Hashtable<>(), sharedPreferences);
            if (overwrite && mode.equals("full")) {
                Boolean isExists = this.uFile.isFileExists(context, dbName);
                if (isExists) {
                    this.uFile.deleteFile(context, dbName);
                }
            }
            db.open();
            if (!db.isOpen()) {
                String msg = dbName + "SQLite.db not opened";
                throw new Exception(msg);
            } else {
                // check if the database as some tables
                JSArray tableList = db.getTableNames();
                if (mode.equals("full") && tableList.length() > 0) {
                    Integer curVersion = db.getVersion();
                    if (dbVersion < curVersion) {
                        String msg = "ImportFromJson: Cannot import a ";
                        msg += "version lower than" + curVersion;
                        throw new Exception(msg);
                    }
                    if (curVersion == dbVersion) {
                        JSObject result = new JSObject();
                        result.put("changes", Integer.valueOf(0));
                        return result;
                    }
                }
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
        dbName = getDatabaseName(dbName);
        Database db = dbDict.get(dbName);
        if (db != null) {
            try {
                if (!db.isOpen()) {
                    String msg = "ExportToJson: db not opened";
                    throw new Exception(msg);
                }
                JSObject ret = db.exportToJson(expMode);
                if (ret.length() == 0) {
                    String msg = "ExportToJson: : return Object is empty " + "No data to synchronize";
                    throw new Exception(msg);
                } else if (ret.length() == 5 || ret.length() == 6 || ret.length() == 7) {
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

    public void deleteExportedRows(String dbName) throws Exception {
        dbName = getDatabaseName(dbName);
        Database db = dbDict.get(dbName);
        if (db != null) {
            try {
                if (!db.isOpen()) {
                    String msg = "deleteExportedRows: db not opened";
                    throw new Exception(msg);
                }
                db.deleteExportedRows();
                return;
            } catch (Exception e) {
                String msg = "DeleteExportedRows " + e.getMessage();
                throw new Exception(msg);
            }
        } else {
            String msg = "No available connection for database " + dbName;
            throw new Exception(msg);
        }
    }

    public void copyFromAssets(Boolean overwrite) throws Exception {
        String msg = "copy failed : ";
        try {
            uFile.copyFromAssetsToDatabase(context, overwrite);
            return;
        } catch (Exception e) {
            msg += e.getMessage();
            throw new Exception(msg);
        }
    }

    private String getDatabaseName(String dbName) {
        String retName = dbName;
        if (!retName.contains("/")) {
            if (retName.endsWith(".db")) {
                retName = retName.substring(0, retName.length() - 3);
            }
        }
        return retName;
    }

    private void closeAllConnections() throws Exception {
        // close all connections
        try {
            Enumeration<String> connections = dbDict.keys();
            while (connections.hasMoreElements()) {
                String dbName = (String) connections.nextElement();
                closeConnection(dbName);
            }
        } catch (Exception e) {
            String msg = "close all connections " + e.getMessage();
            throw new Exception(msg);
        }
    }
}
