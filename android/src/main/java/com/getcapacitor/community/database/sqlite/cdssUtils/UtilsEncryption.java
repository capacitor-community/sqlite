package com.getcapacitor.community.database.sqlite.cdssUtils;

import android.content.Context;
import java.io.File;
import java.io.IOException;
import net.sqlcipher.database.SQLiteDatabase;

public class UtilsEncryption {
    private static final String TAG = UtilsEncryption.class.getName();

    /**
     * Encrypt the database
     *
     * @param context
     * @param dbName
     * @param passphrase
     * @throws IOException
     */
    public void encryptDataBase(Context context, String dbName, String passphrase) throws IOException {
        File originalFile = context.getDatabasePath(dbName);

        File newFile = File.createTempFile("sqlcipherutils", "tmp", context.getCacheDir());
        SQLiteDatabase existing_db = SQLiteDatabase.openOrCreateDatabase(originalFile, null, null);
        existing_db.rawExecSQL("ATTACH DATABASE '" + newFile.getPath() + "' AS encrypted KEY '" + passphrase + "';");
        existing_db.rawExecSQL("SELECT sqlcipher_export('encrypted');");
        existing_db.rawExecSQL("DETACH DATABASE encrypted;");
        // close the database
        existing_db.close();
        // delete the original database
        originalFile.delete();
        // rename the encrypted database
        newFile.renameTo(originalFile);
    }
}
