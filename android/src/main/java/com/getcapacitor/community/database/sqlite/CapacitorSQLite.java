package com.getcapacitor.community.database.sqlite;

import static com.getcapacitor.community.database.sqlite.SQLite.UtilsSQLCipher.State.ENCRYPTED_GLOBAL_SECRET;
import static com.getcapacitor.community.database.sqlite.SQLite.UtilsSQLCipher.State.ENCRYPTED_SECRET;
import static com.getcapacitor.community.database.sqlite.SQLite.UtilsSQLCipher.State.UNENCRYPTED;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;
import android.widget.Toast;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.security.crypto.EncryptedSharedPreferences;
import androidx.security.crypto.MasterKey;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PluginCall;
import com.getcapacitor.community.database.sqlite.SQLite.BiometricListener;
import com.getcapacitor.community.database.sqlite.SQLite.Database;
import com.getcapacitor.community.database.sqlite.SQLite.GlobalSQLite;
import com.getcapacitor.community.database.sqlite.SQLite.ImportExportJson.JsonSQLite;
import com.getcapacitor.community.database.sqlite.SQLite.ImportExportJson.UtilsJson;
import com.getcapacitor.community.database.sqlite.SQLite.SqliteConfig;
import com.getcapacitor.community.database.sqlite.SQLite.UtilsBiometric;
import com.getcapacitor.community.database.sqlite.SQLite.UtilsDownloadFromHTTP;
import com.getcapacitor.community.database.sqlite.SQLite.UtilsFile;
import com.getcapacitor.community.database.sqlite.SQLite.UtilsMigrate;
import com.getcapacitor.community.database.sqlite.SQLite.UtilsNCDatabase;
import com.getcapacitor.community.database.sqlite.SQLite.UtilsSQLCipher;
import com.getcapacitor.community.database.sqlite.SQLite.UtilsSQLite;
import com.getcapacitor.community.database.sqlite.SQLite.UtilsSecret;
import java.io.File;
import java.nio.ByteBuffer;
import java.security.KeyStore;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Dictionary;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Hashtable;
import java.util.Map;
import java.util.Set;
import org.json.JSONException;
import org.json.JSONObject;

public class CapacitorSQLite {

    private static final String TAG = CapacitorSQLite.class.getName();
    private final Context context;
    private final Dictionary<String, Database> dbDict = new Hashtable<>();
    private final UtilsSQLite uSqlite = new UtilsSQLite();
    private final UtilsFile uFile = new UtilsFile();
    private final UtilsJson uJson = new UtilsJson();
    private final UtilsMigrate uMigrate = new UtilsMigrate();
    private final UtilsNCDatabase uNCDatabase = new UtilsNCDatabase();
    private final UtilsDownloadFromHTTP uHTTP = new UtilsDownloadFromHTTP();
    private final GlobalSQLite globVar = new GlobalSQLite();
    private final UtilsSQLCipher uCipher = new UtilsSQLCipher();
    private UtilsSecret uSecret;
    private SharedPreferences sharedPreferences = null;
    private MasterKey masterKeyAlias;
    private BiometricManager biometricManager;
    private final SqliteConfig config;
    private Boolean isEncryption = true;
    private Boolean biometricAuth = false;
    private final String biometricTitle;
    private final String biometricSubTitle;
    private final int VALIDITY_DURATION = 5;
    private final RetHandler rHandler = new RetHandler();

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
     *
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
     *
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
     *
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

    /**
     * CheckEncryptionSecret
     *
     * @param passphrase
     * @throws Exception
     */
    public Boolean checkEncryptionSecret(String passphrase) throws Exception {
        if (isEncryption) {
            try {
                // close all connections
                closeAllConnections();
                // set encryption secret
                Boolean res = uSecret.checkEncryptionSecret(passphrase);
                return res;
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
     *
     * @param dbName
     * @param encrypted
     * @param mode
     * @param version
     * @param vUpgObject
     * @throws Exception
     */
    public void createConnection(
        String dbName,
        boolean encrypted,
        String mode,
        int version,
        Dictionary<Integer, JSONObject> vUpgObject,
        Boolean readonly
    ) throws Exception {
        dbName = getDatabaseName(dbName);
        String connName = readonly ? "RO_" + dbName : "RW_" + dbName;
        // check if connection already exists
        Database conn = dbDict.get(connName);
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
                sharedPreferences,
                readonly
            );
            if (db != null) {
                dbDict.put(connName, db);
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
     *
     * @param dbPath
     * @param version
     * @throws Exception
     */
    public void createNCConnection(String dbPath, int version) throws Exception {
        // check if connection already exists
        String connName = "RO_" + dbPath;
        Database conn = dbDict.get(connName);
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
                sharedPreferences,
                true
            );
            if (db != null) {
                dbDict.put(connName, db);
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
     *
     * @param dbName
     * @throws Exception
     */
    public void open(String dbName, Boolean readonly) throws Exception {
        dbName = getDatabaseName(dbName);
        String connName = readonly ? "RO_" + dbName : "RW_" + dbName;
        Database db = dbDict.get(connName);
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
     *
     * @param dbName
     * @throws Exception
     */
    public void close(String dbName, Boolean readonly) throws Exception {
        dbName = getDatabaseName(dbName);
        String connName = readonly ? "RO_" + dbName : "RW_" + dbName;
        Database db = dbDict.get(connName);
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
     *
     * @param dbName
     * @return String
     * @throws Exception
     */
    public String getUrl(String dbName, Boolean readonly) throws Exception {
        dbName = getDatabaseName(dbName);
        String connName = readonly ? "RO_" + dbName : "RW_" + dbName;
        Database db = dbDict.get(connName);
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
     *
     * @param dbName
     * @return Integer
     * @throws Exception
     */
    public Integer getVersion(String dbName, Boolean readonly) throws Exception {
        dbName = getDatabaseName(dbName);
        String connName = readonly ? "RO_" + dbName : "RW_" + dbName;
        Database db = dbDict.get(connName);
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
     *
     * @param dbPath
     * @throws Exception
     */
    public void closeNCConnection(String dbPath) throws Exception {
        String connName = "RO_" + dbPath;
        Database db = dbDict.get(connName);
        if (db != null) {
            if (db.isOpen()) {
                try {
                    db.close();
                } catch (Exception e) {
                    throw new Exception(e.getMessage());
                }
            }
            dbDict.remove(connName);
            return;
        } else {
            String msg = "No available connection for database " + dbPath;
            throw new Exception(msg);
        }
    }

    /**
     * CloseConnection
     *
     * @param dbName
     * @throws Exception
     */
    public void closeConnection(String dbName, Boolean readonly) throws Exception {
        dbName = getDatabaseName(dbName);
        String connName = readonly ? "RO_" + dbName : "RW_" + dbName;
        Database db = dbDict.get(connName);
        if (db != null) {
            if (db.isOpen()) {
                try {
                    db.close();
                } catch (Exception e) {
                    throw new Exception(e.getMessage());
                }
            }
            dbDict.remove(connName);
            return;
        } else {
            String msg = "No available connection for database " + dbName;
            throw new Exception(msg);
        }
    }

    public void getFromHTTPRequest(String url) throws Exception {
        try {
            uHTTP.download(context, url);
        } catch (Exception e) {
            throw new Exception(e.getMessage());
        }
    }

    public Boolean checkConnectionsConsistency(JSArray dbNames, JSArray openModes) throws Exception {
        Set<String> keys = new HashSet<String>(Collections.list(dbDict.keys()));
        String msg = "All Native Connections released";
        JSArray nameDBs = new JSArray();
        for (Integer i = 0; i < dbNames.length(); i++) {
            String name = openModes.getString(i) + "_" + dbNames.getString(i);
            nameDBs.put(name);
        }
        Set<String> conns = new HashSet<String>(uSqlite.stringJSArrayToArrayList(nameDBs));
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
     *
     * @param dbName
     * @return Boolean
     * @throws Exception
     */
    public Boolean isDatabase(String dbName) {
        dbName = getDatabaseName(dbName);
        return uFile.isFileExists(context, dbName + "SQLite.db");
    }

    /**
     * IsDatabaseEncrypted
     *
     * @param dbName
     * @return Boolean
     * @throws Exception
     */
    public Boolean isDatabaseEncrypted(String dbName) throws Exception {
        dbName = getDatabaseName(dbName);
        File file = context.getDatabasePath(dbName + "SQLite.db");
        if (uFile.isFileExists(context, dbName + "SQLite.db")) {
            UtilsSQLCipher.State state = uCipher.getDatabaseState(context, file, sharedPreferences, globVar);
            if (state == ENCRYPTED_GLOBAL_SECRET || state == ENCRYPTED_SECRET) {
                return true;
            }
            if (state == UNENCRYPTED) {
                return false;
            }
            throw new Exception("Database unknown");
        } else {
            throw new Exception("Database does not exist");
        }
    }

    /**
     * IsNCDatabase
     *
     * @param dbPath
     * @return Boolean
     * @throws Exception
     */
    public Boolean isNCDatabase(String dbPath) {
        return uFile.isPathExists(dbPath);
    }

    /**
     * IsTableExists
     *
     * @param dbName
     * @param tableName
     * @throws Exception
     */
    public Boolean isTableExists(String dbName, String tableName, Boolean readonly) throws Exception {
        dbName = getDatabaseName(dbName);
        String connName = readonly ? "RO_" + dbName : "RW_" + dbName;
        Database db = dbDict.get(connName);
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
     * GetMigratableDbList
     *
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
     *
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
     *
     * @param dbName
     * @param statements
     * @return
     * @throws Exception
     */
    public JSObject execute(String dbName, String statements, Boolean transaction, Boolean readonly) throws Exception {
        dbName = getDatabaseName(dbName);
        String connName = "RW_" + dbName;
        Database db = dbDict.get(connName);
        if (db != null) {
            if (readonly) {
                throw new Exception("not allowed in read-only mode");
            }
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
     *
     * @param dbName
     * @param set
     * @return
     * @throws Exception
     */
    public JSObject executeSet(String dbName, JSArray set, Boolean transaction, Boolean readonly) throws Exception {
        dbName = getDatabaseName(dbName);
        String connName = "RW_" + dbName;
        Database db = dbDict.get(connName);
        if (db != null) {
            if (readonly) {
                throw new Exception("not allowed in read-only mode");
            }
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
     *
     * @param dbName
     * @param statement
     * @param values
     * @return
     * @throws Exception
     */
    public JSObject run(String dbName, String statement, JSArray values, Boolean transaction, Boolean readonly) throws Exception {
        JSObject res;
        dbName = getDatabaseName(dbName);
        String connName = "RW_" + dbName;
        Database db = dbDict.get(connName);
        if (db != null) {
            if (readonly) {
                throw new Exception("not allowed in read-only mode");
            }
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
     *
     * @param dbName
     * @param statement
     * @param values
     * @return
     * @throws Exception
     */
    public JSArray query(String dbName, String statement, JSArray values, Boolean readonly) throws Exception {
        JSArray res;
        dbName = getDatabaseName(dbName);
        String connName = readonly ? "RO_" + dbName : "RW_" + dbName;
        Database db = dbDict.get(connName);
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

    public JSArray getTableList(String dbName, Boolean readonly) throws Exception {
        JSArray res;
        String connName = readonly ? "RO_" + dbName : "RW_" + dbName;
        Database db = dbDict.get(connName);
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

    public Boolean isDBExists(String dbName, Boolean readonly) throws Exception {
        dbName = getDatabaseName(dbName);
        String connName = readonly ? "RO_" + dbName : "RW_" + dbName;
        Database db = dbDict.get(connName);
        if (db != null) {
            File databaseFile = context.getDatabasePath(dbName + "SQLite.db");
            return databaseFile.exists();
        } else {
            String msg = "No available connection for database " + dbName;
            throw new Exception(msg);
        }
    }

    public Boolean isDBOpen(String dbName, Boolean readonly) throws Exception {
        dbName = getDatabaseName(dbName);
        String connName = readonly ? "RO_" + dbName : "RW_" + dbName;
        Database db = dbDict.get(connName);
        if (db != null) {
            Boolean isOpen = db.isOpen();
            return isOpen;
        } else {
            String msg = "No available connection for database " + dbName;
            throw new Exception(msg);
        }
    }

    public void deleteDatabase(String dbName, Boolean readonly) throws Exception {
        dbName = getDatabaseName(dbName);
        String connName = "RW_" + dbName;
        Database db = dbDict.get(connName);
        if (db != null) {
            if (readonly) {
                throw new Exception("not allowed in read-only mode");
            }
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

    public JSObject createSyncTable(String dbName, Boolean readonly) throws Exception {
        dbName = getDatabaseName(dbName);
        String connName = "RW_" + dbName;
        Database db = dbDict.get(connName);
        if (db != null) {
            if (readonly) {
                throw new Exception("not allowed in read-only mode");
            }
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

    public void setSyncDate(String dbName, String syncDate, Boolean readonly) throws Exception {
        dbName = getDatabaseName(dbName);
        String connName = "RW_" + dbName;
        Database db = dbDict.get(connName);
        if (db != null) {
            if (readonly) {
                throw new Exception("not allowed in read-only mode");
            }
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

    public Long getSyncDate(String dbName, Boolean readonly) throws Exception {
        dbName = getDatabaseName(dbName);
        String connName = readonly ? "RO_" + dbName : "RW_" + dbName;
        Database db = dbDict.get(connName);
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

        for (int i = 0; i < upgrade.length(); i++) {
            JSONObject upgObj = null;
            try {
                upgObj = (JSONObject) upgrade.get(i);
                if (upgObj == null || !upgObj.has("toVersion") || !upgObj.has("statements")) {
                    String msg = "Must provide an upgrade statement";
                    msg += " {toVersion,statement}";
                    throw new Exception(msg);
                }
            } catch (Exception e) {
                String msg = "Must provide an upgrade statement " + e.getMessage();
                throw new Exception(msg);
            }
            try {
                int toVersion = upgObj.getInt("toVersion");
                upgDict.put(toVersion, upgObj);
            } catch (Exception e) {
                String msg = "Must provide toVersion as Integer" + e.getMessage();
                throw new Exception(msg);
            }
        }
        return upgDict;
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
            Database db = new Database(
                context,
                dbName,
                encrypted,
                inMode,
                dbVersion,
                isEncryption,
                new Hashtable<>(),
                sharedPreferences,
                false
            );
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

    public JSObject exportToJson(String dbName, String expMode, Boolean readonly) throws Exception {
        dbName = getDatabaseName(dbName);
        String connName = readonly ? "RO_" + dbName : "RW_" + dbName;
        Database db = dbDict.get(connName);
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

    public void deleteExportedRows(String dbName, Boolean readonly) throws Exception {
        dbName = getDatabaseName(dbName);
        String connName = "RW_" + dbName;
        Database db = dbDict.get(connName);
        if (db != null) {
            if (readonly) {
                throw new Exception("not allowed in read-only mode");
            }
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
                String dbName = connections.nextElement();
                Boolean readonly = false;
                if (dbName.substring(0, 3).equals("RO_")) {
                    readonly = true;
                }
                dbName = dbName.substring(3);
                closeConnection(dbName, readonly);
            }
        } catch (Exception e) {
            String msg = "close all connections " + e.getMessage();
            throw new Exception(msg);
        }
    }
}
