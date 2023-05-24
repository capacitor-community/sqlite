package com.getcapacitor.community.database.sqlite.SQLite;

import static com.getcapacitor.community.database.sqlite.SQLite.UtilsSQLCipher.State.DOES_NOT_EXIST;
import static com.getcapacitor.community.database.sqlite.SQLite.UtilsSQLCipher.State.ENCRYPTED_GLOBAL_SECRET;
import static com.getcapacitor.community.database.sqlite.SQLite.UtilsSQLCipher.State.ENCRYPTED_SECRET;
import static com.getcapacitor.community.database.sqlite.SQLite.UtilsSQLCipher.State.UNKNOWN;

import android.content.Context;
import android.content.SharedPreferences;
import android.text.TextUtils;
import java.io.File;
import net.sqlcipher.database.SQLiteDatabase;

public class UtilsSecret {

    private static final String TAG = UtilsFile.class.getName();
    private UtilsFile uFile = new UtilsFile();
    private GlobalSQLite globVar = new GlobalSQLite();
    private UtilsSQLCipher uCipher = new UtilsSQLCipher();

    private SharedPreferences sharedPreferences;
    private Context context;

    public UtilsSecret(Context context, SharedPreferences sharedPreferences) {
        this.context = context;
        this.sharedPreferences = sharedPreferences;
    }

    /**
     * SetEncryptionSecret
     * @param passphrase
     * @throws Exception
     */
    public void setEncryptionSecret(String passphrase) throws Exception {
        try {
            if (TextUtils.isEmpty(passphrase)) {
                String msg = "passphrase must not be empty";
                throw new Exception(msg);
            }
            // test if Encryption secret is already set
            String savedPassPhrase = getPassphrase();
            if (savedPassPhrase != null && savedPassPhrase.length() > 0) {
                throw new Exception("a passphrase has already been set ");
            }
            // Store encrypted passphrase in sharedPreferences
            setPassphrase(passphrase);

            // Get the list of databases
            String[] dbList = uFile.getListOfFiles(context);
            if (dbList.length > 0) {
                for (String dbName : dbList) {
                    File file = context.getDatabasePath(dbName);

                    UtilsSQLCipher.State state = uCipher.getDatabaseState(context, file, sharedPreferences, globVar);
                    // change password if encrypted with globVar.secret
                    if (state == ENCRYPTED_GLOBAL_SECRET) {
                        uCipher.changePassword(context, file, globVar.secret, passphrase);
                    } else if (state == DOES_NOT_EXIST || state == UNKNOWN) {
                        String msg = "State for: " + dbName + " not correct";
                        throw new Exception(msg);
                    }
                }
            }
        } catch (Exception e) {
            throw new Exception(e.getMessage());
        }
    }

    /**
     * ChangeEncryptionSecret
     * @param passphrase
     * @param oldPassphrase
     * @throws Exception
     */
    public void changeEncryptionSecret(String passphrase, String oldPassphrase) throws Exception {
        try {
            if (TextUtils.isEmpty(passphrase) || TextUtils.isEmpty(oldPassphrase)) {
                String msg = "Passphrase and/or oldpassphrase must not be empty";
                throw new Exception(msg);
            }
            // check the oldPassphrase
            String secret = getPassphrase();
            if (secret == null || secret.length() == 0) {
                String msg = "Encryption secret has not been set";
                throw new Exception(msg);
            } else if (!secret.equals(oldPassphrase)) {
                String msg = "Oldpassphrase is wrong secret";
                throw new Exception(msg);
            } else {
                // Get the list of databases
                String[] dbList = uFile.getListOfFiles(context);
                if (dbList.length > 0) {
                    for (String dbName : dbList) {
                        File file = context.getDatabasePath(dbName);

                        UtilsSQLCipher.State state = uCipher.getDatabaseState(context, file, sharedPreferences, globVar);
                        // change password if encrypted with oldPassphrase
                        if (state == ENCRYPTED_SECRET) {
                            uCipher.changePassword(context, file, oldPassphrase, passphrase);
                        } else if (state == DOES_NOT_EXIST || state == ENCRYPTED_GLOBAL_SECRET || state == UNKNOWN) {
                            String msg = "State for: " + dbName + " not correct";
                            throw new Exception(msg);
                        }
                    }
                }
                // Store the new encrypted passphrase in sharedPreferences
                setPassphrase(passphrase);
            }
        } catch (Exception e) {
            throw new Exception(e.getMessage());
        }
    }

    /**
     * ClearEncryptionSecret
     * @throws Exception
     */
    public void clearEncryptionSecret() throws Exception {
        try {
            // test if Encryption secret is already set
            String savedPassPhrase = getPassphrase();
            if (savedPassPhrase != null && savedPassPhrase.length() > 0) {
                // Clear encrypted passphrase in sharedPreferences
                clearPassphrase();
            }
        } catch (Exception e) {
            throw new Exception(e.getMessage());
        }
    }

    /**
     * CheckEncryptionSecret
     * @param passphrase
     * @throws Exception
     */
    public Boolean checkEncryptionSecret(String passphrase) throws Exception {
        Boolean ret = false;
        try {
            if (TextUtils.isEmpty(passphrase)) {
                String msg = "passphrase must not be empty";
                throw new Exception(msg);
            }
            // test if Encryption secret is already set
            String savedPassPhrase = getPassphrase();
            if (savedPassPhrase.isEmpty()) {
                throw new Exception("no passphrase stored  in sharedPreferences");
            }

            if (savedPassPhrase.equals(passphrase)) {
                ret = true;
            }
            return ret;
        } catch (Exception e) {
            throw new Exception(e.getMessage());
        }
    }

    public void setPassphrase(String passphrase) {
        sharedPreferences.edit().putString("secret", passphrase).apply();
    }

    public String getPassphrase() {
        String passphrase = sharedPreferences.getString("secret", "");
        return passphrase;
    }

    public void clearPassphrase() {
        sharedPreferences.edit().remove("secret").commit();
    }

    public Boolean isPassphrase() {
        if (!getPassphrase().isEmpty()) {
            return true;
        }
        return false;
    }
}
