package com.getcapacitor.community.database.sqlite.SQLite;

import android.content.Context;
import android.util.Log;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.channels.FileChannel;

public class UtilsFile {
    private static final String TAG = UtilsFile.class.getName();

    public Boolean isFileExists(Context context, String dbName) {
        File file = context.getDatabasePath(dbName);
        return file.exists();
    }

    public Boolean deleteDatabase(Context context, String dbName) {
        context.deleteDatabase(dbName);
        if (isFileExists(context, dbName)) {
            return false;
        } else {
            return true;
        }
    }

    public Boolean deleteFile(Context context, String dbName) {
        File file = context.getDatabasePath(dbName);
        return file.delete();
    }

    public Boolean renameFile(Context context, String dbName, String toDbName) {
        File file = context.getDatabasePath(dbName);
        File toFile = context.getDatabasePath(toDbName);
        return file.renameTo(toFile);
    }

    public Boolean copyFile(Context context, String dbName, String toDbName) {
        File file = context.getDatabasePath(dbName);
        File toFile = context.getDatabasePath(toDbName);

        try {
            if (!toFile.exists()) {
                toFile.createNewFile();
            }
            copyFileFromFile(file, toFile);
            return true;
        } catch (Exception e) {
            Log.e(TAG, "Error: in copyFile " + e);
            return false;
        }
    }

    public Boolean restoreDatabase(Context context, String databaseName) {
        // check if the backup file exists
        boolean isBackup = isFileExists(context, "backup-" + databaseName);
        if (isBackup) {
            // check if database exists
            boolean isDB = isFileExists(context, databaseName);
            if (isDB) {
                boolean retD = deleteFile(context, databaseName);
                if (!retD) {
                    String msg = "Error: restoreDatabase: delete file ";
                    msg += databaseName;
                    Log.e(TAG, msg);
                    return false;
                } else {
                    boolean retC = copyFile(context, "backup-" + databaseName, databaseName);
                    if (!retC) {
                        String msg = "Error: restoreDatabase: copy file ";
                        msg += databaseName;
                        Log.e(TAG, msg);
                        return false;
                    }
                    retD = deleteFile(context, "backup-" + databaseName);
                    if (!retD) {
                        String msg = "Error: restoreDatabase: delete file ";
                        msg += "backup-" + databaseName;
                        Log.e(TAG, msg);
                        return false;
                    }
                    return true;
                }
            } else {
                String msg = "Error: restoreDatabase: database ";
                msg += databaseName + "does not exists";
                Log.e(TAG, msg);
                return false;
            }
        } else {
            String msg = "Error: restoreDB: backup-" + databaseName;
            msg += " does not exist";
            Log.e(TAG, msg);
            return false;
        }
    }

    public Boolean deleteBackupDB(Context context, String databaseName) {
        // check if the backup file exists
        boolean isBackup = isFileExists(context, "backup-" + databaseName);
        if (isBackup) {
            boolean retD = deleteFile(context, "backup-" + databaseName);
            if (!retD) {
                String msg = "Error: deleteBackupDB: delete file ";
                msg += "backup-" + databaseName;
                Log.e(TAG, msg);
                return false;
            }
            return true;
        } else {
            String msg = "Error: deleteBackupDB: backup-" + databaseName;
            msg += " does not exist";
            Log.e(TAG, msg);
            return false;
        }
    }

    private static void copyFileFromFile(File sourceFile, File destFile) throws IOException {
        if (!destFile.getParentFile().exists()) destFile.getParentFile().mkdirs();

        if (!destFile.exists()) {
            destFile.createNewFile();
        }

        FileChannel source = null;
        FileChannel destination = null;

        try {
            source = new FileInputStream(sourceFile).getChannel();
            destination = new FileOutputStream(destFile).getChannel();
            destination.transferFrom(source, 0, source.size());
        } finally {
            if (source != null) {
                source.close();
            }
            if (destination != null) {
                destination.close();
            }
        }
    }
}
