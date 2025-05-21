package com.getcapacitor.community.database.sqlite.SQLite;

import android.content.Context;
import android.content.SharedPreferences;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import net.zetetic.database.sqlcipher.SQLiteDatabase;
import net.zetetic.database.sqlcipher.SQLiteStatement;

public class UtilsSQLCipher {

    private static final String TAG = UtilsSQLCipher.class.getName();

    /**
     * The detected state of the database, based on whether we can
     * open it without a passphrase, with the passphrase 'secret'.
     */
    public enum State {
        DOES_NOT_EXIST,
        UNENCRYPTED,
        ENCRYPTED_SECRET,
        ENCRYPTED_GLOBAL_SECRET,
        UNKNOWN
    }

    /**
     * Determine whether or not this database appears to be encrypted,
     * based on whether we can open it without a passphrase or with
     * the passphrase 'secret'.
     *
     * @param dbPath a File pointing to the database
     * @param sharedPreferences an instance of SharedPreferences
     * @param globVar an instance of GlobalSQLite
     * @return the detected state of the database
     */
    public State getDatabaseState(Context ctxt, File dbPath, SharedPreferences sharedPreferences, GlobalSQLite globVar) {
        System.loadLibrary("sqlcipher");
        if (dbPath.exists()) {
            SQLiteDatabase db = null;

            try {
                db = SQLiteDatabase.openDatabase(dbPath.getAbsolutePath(), "", null, SQLiteDatabase.OPEN_READONLY, null);

                db.getVersion();

                return (State.UNENCRYPTED);
            } catch (Exception e) {
                try {
                    String passphrase = sharedPreferences.getString("secret", "");
                    if (passphrase.length() > 0) {
                        db = SQLiteDatabase.openDatabase(dbPath.getAbsolutePath(), passphrase, null, SQLiteDatabase.OPEN_READONLY, null);
                        db.getVersion();
                        return (State.ENCRYPTED_SECRET);
                    } else {
                        return (State.UNKNOWN);
                    }
                } catch (Exception e1) {
                    try {
                        if (globVar.secret.length() > 0) {
                            db = SQLiteDatabase.openDatabase(
                                dbPath.getAbsolutePath(),
                                globVar.secret,
                                null,
                                SQLiteDatabase.OPEN_READONLY,
                                null
                            );
                            db.getVersion();
                            return (State.ENCRYPTED_GLOBAL_SECRET);
                        } else {
                            return (State.UNKNOWN);
                        }
                    } catch (Exception e2) {
                        return (State.UNKNOWN);
                    }
                }
            } finally {
                if (db != null) {
                    db.close();
                }
            }
        }

        return (State.DOES_NOT_EXIST);
    }

    /**
     * Replaces this database with a version encrypted with the supplied
     * passphrase, deleting the original.
     * Do not call this while the database is open.
     *
     * The passphrase is untouched in this call.
     *
     * @param ctxt a Context
     * @param originalFile a File pointing to the database
     * @param passphrase the passphrase from the user
     * @throws IOException
     */
    public void encrypt(Context ctxt, File originalFile, byte[] passphrase) throws IOException {
        System.loadLibrary("sqlcipher");

        if (originalFile.exists()) {
            File newFile = File.createTempFile("sqlcipherutils", "tmp", ctxt.getCacheDir());
            SQLiteDatabase db = SQLiteDatabase.openDatabase(originalFile.getAbsolutePath(), "", null, SQLiteDatabase.OPEN_READWRITE, null);
            int version = db.getVersion();

            db.close();

            db = SQLiteDatabase.openDatabase(newFile.getAbsolutePath(), passphrase, null, SQLiteDatabase.OPEN_READWRITE, null, null);
            StringBuilder sql = new StringBuilder();
            sql.append("ATTACH DATABASE ? AS plaintext KEY ");
            sql.append("'';");
            final SQLiteStatement st = db.compileStatement(sql.toString());

            st.bindString(1, originalFile.getAbsolutePath());
            st.execute();

            StringBuilder sql1 = new StringBuilder();
            sql1.append("SELECT sqlcipher_export('main', 'plaintext');");
            db.rawExecSQL(sql1.toString());
            StringBuilder sql2 = new StringBuilder();
            sql2.append("DETACH DATABASE plaintext;");
            db.rawExecSQL(sql2.toString());

            db.setVersion(version);
            st.close();
            db.close();

            boolean delFile = originalFile.delete();
            if (!delFile) {
                throw new FileNotFoundException(originalFile.getAbsolutePath() + " not deleted");
            }
            boolean renFile = newFile.renameTo(originalFile);
            if (!renFile) {
                throw new FileNotFoundException(originalFile.getAbsolutePath() + " not renamed");
            }
        } else {
            throw new FileNotFoundException(originalFile.getAbsolutePath() + " not found");
        }
    }

    public void decrypt(Context ctxt, File originalFile, byte[] passphrase) throws IOException {
        System.loadLibrary("sqlcipher");

        if (originalFile.exists()) {
            // Create a temporary file for the decrypted database in the cache directory
            File decryptedFile = File.createTempFile("sqlcipherutils", "tmp", ctxt.getCacheDir());

            // Open the decrypted database
            SQLiteDatabase decryptedDb = SQLiteDatabase.openDatabase(
                decryptedFile.getAbsolutePath(),
                "",
                null,
                SQLiteDatabase.OPEN_READWRITE,
                null
            );

            // Open the encrypted database with the provided passphrase
            SQLiteDatabase encryptedDb = SQLiteDatabase.openDatabase(
                originalFile.getAbsolutePath(),
                new String(passphrase),
                null,
                SQLiteDatabase.OPEN_READWRITE,
                null
            );

            int version = encryptedDb.getVersion();
            decryptedDb.setVersion(version);

            decryptedDb.close();

            // Attach the encrypted database to itself using an empty key
            StringBuilder attachSql = new StringBuilder();
            attachSql.append("ATTACH DATABASE ? AS plaintext KEY '';");
            final SQLiteStatement attachStatement = encryptedDb.compileStatement(attachSql.toString());

            attachStatement.bindString(1, decryptedFile.getAbsolutePath());
            attachStatement.execute();

            // Export data from the encrypted database to the plaintext database
            StringBuilder exportSql = new StringBuilder();
            exportSql.append("SELECT sqlcipher_export('plaintext');");
            encryptedDb.rawExecSQL(exportSql.toString());

            // Detach the plaintext database
            StringBuilder detachSql = new StringBuilder();
            detachSql.append("DETACH DATABASE plaintext;");
            encryptedDb.rawExecSQL(detachSql.toString());

            attachStatement.close();
            encryptedDb.close();

            boolean delFile = originalFile.delete();
            if (!delFile) {
                throw new FileNotFoundException(originalFile.getAbsolutePath() + " not deleted");
            }
            boolean renFile = decryptedFile.renameTo(originalFile);
            if (!renFile) {
                throw new FileNotFoundException(originalFile.getAbsolutePath() + " not renamed");
            }
        } else {
            throw new FileNotFoundException(originalFile.getAbsolutePath() + " not found");
        }
    }

    public void changePassword(Context ctxt, File file, String password, String nwpassword) throws Exception {
        System.loadLibrary("sqlcipher");

        if (file.exists()) {
            SQLiteDatabase db = SQLiteDatabase.openDatabase(file.getAbsolutePath(), password, null, SQLiteDatabase.OPEN_READWRITE, null);

            if (!db.isOpen()) {
                throw new Exception("database " + file.getAbsolutePath() + " open failed");
            }
            db.changePassword(nwpassword);
            db.close();
        } else {
            throw new FileNotFoundException(file.getAbsolutePath() + " not found");
        }
    }
}
