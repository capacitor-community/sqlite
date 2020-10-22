package com.getcapacitor.community.database.sqlite.cdssUtils;

import android.content.Context;
import android.util.Log;
import com.getcapacitor.JSObject;
import java.io.File;
import java.util.Dictionary;
import java.util.Enumeration;
import java.util.List;
import net.sqlcipher.database.SQLiteDatabase;
import org.json.JSONObject;

public class UtilsConnection {
    private static final String TAG = UtilsConnection.class.getName();
    private UtilsEncryption uEncrypt = new UtilsEncryption();
    private UtilsFile uFile = new UtilsFile();
    private UtilsUpgrade uUpgrade = new UtilsUpgrade();

    /**
     * Create Connection
     *
     * @param dbHelper
     * @param context
     * @param dbName
     * @param encrypted
     * @param mode
     * @param secret
     * @param newsecret
     * @param dbVersion
     * @param versionUpgrades
     * @return
     */
    public String createConnection(
        SQLiteDatabaseHelper dbHelper,
        Context context,
        String dbName,
        Boolean encrypted,
        String mode,
        String secret,
        String newsecret,
        Integer dbVersion,
        Dictionary<String, Dictionary<Integer, JSONObject>> versionUpgrades
    ) {
        String message = "";
        if (!encrypted && mode.equals("no-encryption")) {
            message = this.createConnectionNoEncryption(dbHelper, context, dbName, dbVersion, versionUpgrades);
        } else if (encrypted && mode.equals("secret") && secret.length() > 0) {
            message = this.createConnectionEncryptedWithSecret(dbHelper, context, dbName, dbVersion, versionUpgrades, secret, newsecret);
        } else if (encrypted && mode.equals("newsecret") && secret.length() > 0 && newsecret.length() > 0) {
            message = this.createConnectionEncryptedWithNewSecret(dbHelper, context, dbName, secret, newsecret);
        } else if (encrypted && mode.equals("encryption") && secret.length() > 0) {
            message = this.makeEncryption(context, dbName, secret);
        }
        return message;
    }

    /**
     * Create Connection No Encryption
     *
     * @param dbHelper
     * @param context
     * @param dbName
     * @param dbVersion
     * @param versionUpgrades
     * @return
     */
    public String createConnectionNoEncryption(
        SQLiteDatabaseHelper dbHelper,
        Context context,
        String dbName,
        Integer dbVersion,
        Dictionary<String, Dictionary<Integer, JSONObject>> versionUpgrades
    ) {
        String message = "";
        File databaseFile;
        SQLiteDatabase database = null;

        databaseFile = context.getDatabasePath(dbName);
        try {
            database = SQLiteDatabase.openOrCreateDatabase(databaseFile, "", null);
            message = this.checkVersion(dbHelper, context, database, dbName, dbVersion, versionUpgrades);
        } catch (Exception e) {
            message = "InitializeSQLCipher: Error Database connection ";
            message += "failed no-encryption " + e;
        } finally {
            if (database != null) database.close();
        }
        return message;
    }

    /**
     * Create Connection Encrypted With Secret
     *
     * @param dbHelper
     * @param context
     * @param dbName
     * @param dbVersion
     * @param versionUpgrades
     * @param secret
     * @param newsecret
     * @return
     */
    public String createConnectionEncryptedWithSecret(
        SQLiteDatabaseHelper dbHelper,
        Context context,
        String dbName,
        Integer dbVersion,
        Dictionary<String, Dictionary<Integer, JSONObject>> versionUpgrades,
        String secret,
        String newsecret
    ) {
        String message = "";
        File databaseFile;
        SQLiteDatabase database = null;
        databaseFile = context.getDatabasePath(dbName);
        try {
            database = SQLiteDatabase.openOrCreateDatabase(databaseFile, secret, null);
        } catch (Exception e) {
            // test if you can open it with the new secret in
            // case of multiple runs
            try {
                database = SQLiteDatabase.openOrCreateDatabase(databaseFile, newsecret, null);
                message = "swap newsecret";
            } catch (Exception e1) {
                message = "InitializeSQLCipher: Error Database ";
                message += "connection failed wrong secret " + e1;
            }
        } finally {
            if (database != null) database.close();
        }

        return message;
    }

    /**
     * Create Connection Encrypted With New Secret
     *
     * @param dbHelper
     * @param context
     * @param dbName
     * @param secret
     * @param newsecret
     * @return
     */
    public String createConnectionEncryptedWithNewSecret(
        SQLiteDatabaseHelper dbHelper,
        Context context,
        String dbName,
        String secret,
        String newsecret
    ) {
        String message = "";
        File databaseFile;
        SQLiteDatabase database = null;
        databaseFile = context.getDatabasePath(dbName);
        try {
            database = SQLiteDatabase.openOrCreateDatabase(databaseFile, secret, null);
            // Change database secret to newsecret
            database.changePassword(newsecret);
            message = "swap newsecret";
        } catch (Exception e) {
            message = "InitializeSQLCipher: Error Database connection ";
            message += "failed wrong secret" + e;
        } finally {
            if (database != null) database.close();
        }

        return message;
    }

    /**
     * Make Encryption
     *
     * @param context
     * @param dbName
     * @param secret
     * @return
     */
    public String makeEncryption(Context context, String dbName, String secret) {
        String message = "";
        File databaseFile;
        SQLiteDatabase database = null;
        try {
            uEncrypt.encryptDataBase(context, dbName, secret);
            databaseFile = context.getDatabasePath(dbName);
            database = SQLiteDatabase.openOrCreateDatabase(databaseFile, secret, null);
            message = "success encryption";
        } catch (Exception e) {
            message = "InitializeSQLCipher: Error Encryption " + e;
        } finally {
            if (database != null) database.close();
        }

        return message;
    }

    /**
     * Check Database Version
     *
     * @param dbHelper
     * @param context
     * @param database
     * @param dbName
     * @param dbVersion
     * @param versionUpgrades
     * @return
     */
    private String checkVersion(
        SQLiteDatabaseHelper dbHelper,
        Context context,
        SQLiteDatabase database,
        String dbName,
        Integer dbVersion,
        Dictionary<String, Dictionary<Integer, JSONObject>> versionUpgrades
    ) {
        String message = "";
        try {
            // check version and backup the database
            int curVersion = this.checkVersionAndBackup(dbHelper, context, database, dbName, dbVersion, versionUpgrades);
            if (curVersion > 0 && curVersion != dbVersion) {
                // version not ok -> upgrade
                uUpgrade.onUpgrade(dbHelper, context, database, dbName, versionUpgrades, curVersion, dbVersion);
            }
        } catch (Exception e) {
            try {
                // failed -> restore the database
                dbHelper.restoreDB(dbName);
                message = "CheckVersion: Error Database upgrade ";
                message += "version failed " + e;
            } catch (Exception e1) {
                message = "CheckVersion: Error Database upgrade ";
                message += "version failed in restoring the database ";
                message += e1;
            }
        }
        // Delete the backup file
        String backName = "backup-" + dbName;
        boolean isExist = uFile.isFileExists(context, backName);
        if (isExist) {
            boolean retD = uFile.deleteFile(context, backName);
            if (!retD) {
                message = "CheckVersion: Error Database upgrade version ";
                message += "delete backup failed";
            }
        }
        return message;
    }

    /**
     * Check Version and Backup the Database
     *
     * @param dbHelper
     * @param context
     * @param database
     * @param dbName
     * @param dbVersion
     * @param versionUpgrades
     * @return
     * @throws Exception
     */
    private Integer checkVersionAndBackup(
        SQLiteDatabaseHelper dbHelper,
        Context context,
        SQLiteDatabase database,
        String dbName,
        Integer dbVersion,
        Dictionary<String, Dictionary<Integer, JSONObject>> versionUpgrades
    )
        throws Exception {
        int curVersion = -1;
        try {
            curVersion = uUpgrade.getDatabaseVersion(dbHelper, database);
            if (curVersion <= 0) {
                int changes = uUpgrade.updateDatabaseVersion(dbHelper, database, 1);
                if (changes != -1) {
                    curVersion = uUpgrade.getDatabaseVersion(dbHelper, database);
                }
            }
            if (curVersion > 0 && curVersion != dbVersion) {
                if (dbVersion < curVersion) {
                    String msg = "Error: checkVersion Database";
                    msg += " version " + dbVersion + " lower than ";
                    msg += "current version " + curVersion;
                    throw new Exception(msg);
                }

                List<String> lKeys = uUpgrade.getVersionUpgradeKeys(versionUpgrades);
                Dictionary<Integer, JSONObject> dbVUValues = null;
                if (lKeys.contains(dbName)) {
                    dbVUValues = versionUpgrades.get(dbName);
                } else {
                    String msg = "Error: checkVersion No upgrade ";
                    msg += "statement for database " + dbName;
                    throw new Exception(msg);
                }
                List<Integer> luKeys = uUpgrade.getUpgradeDictKeys(dbVUValues);
                if (luKeys.size() > 0 && luKeys.contains(curVersion)) {
                    JSONObject upgrade = dbVUValues.get(curVersion);
                    List<String> keys = uUpgrade.getUpgradeKeys(upgrade);
                    if (keys.size() > 0) {
                        // backup the current database version
                        boolean retB = uFile.copyFile(context, dbName, "backup-" + dbName);
                        if (!retB) {
                            String msg = "Error: checkVersion copyFile ";
                            msg += "backup-" + dbName + " failed";
                            throw new Exception(msg);
                        }
                    } else {
                        String msg = "Error: checkVersion No upgrade ";
                        msg += "statement for database " + dbName;
                        msg += " and version " + curVersion;
                        throw new Exception(msg);
                    }
                } else {
                    String msg = "Error: checkVersion No upgrade ";
                    msg += "statement for database " + dbName;
                    msg += " and version " + curVersion;
                    throw new Exception(msg);
                }
            }
            return curVersion;
        } catch (Exception e) {
            String msg = "Error: checkVersionAndBackup failed " + e;
            throw new Exception(msg);
        }
    }
}
