package com.getcapacitor.community.database.sqlite.SQLite;

import android.content.Context;
import android.content.res.AssetManager;
import android.util.Log;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.channels.FileChannel;
import java.util.ArrayList;
import java.util.List;

public class UtilsFile {

    private static final String TAG = UtilsFile.class.getName();

    public Boolean isFileExists(Context context, String dbName) {
        File file = context.getDatabasePath(dbName);
        return file.exists();
    }

    public String[] getListOfFiles(Context context) {
        return context.databaseList();
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

    public Boolean deleteFile(String filePath, String dbName) {
        File file = new File(filePath, dbName);
        return file.delete();
    }

    public boolean copyFromAssetsToDatabase(Context context) {
        AssetManager assetManager = context.getAssets();
        String assetsDatabasePath = "public/assets/databases";
        try {
            String[] filelist = assetManager.list(assetsDatabasePath);
            if (filelist.length == 0) {
                // dir does not exist or is not a directory
                Log.e(TAG, "Error: public/assets/databases does not exist");
                return false;
            } else {
                for (int i = 0; i < filelist.length; i++) {
                    // Get filename of file or directory
                    String fileName = filelist[i];
                    boolean isDB = isLast(fileName, ".db");
                    if (!isDB) continue;
                    String toFileName = fileName;
                    boolean isSQLite = isLast(fileName, "SQLite.db");
                    if (!isSQLite) {
                        toFileName = fileName.substring(0, fileName.length() - 3) + "SQLite.db";
                    }
                    String fromPathName = assetsDatabasePath + "/" + fileName;
                    String toPathName = context.getDatabasePath(toFileName).getAbsolutePath();
                    boolean isCopy = copyDatabaseFromAssets(assetManager, fromPathName, toPathName);
                    if (!isCopy) {
                        return false;
                    }
                }
                return true;
            }
        } catch (IOException e) {
            Log.e(TAG, "Error: in isDirExists " + e);
            return false;
        }
    }

    public boolean copyDatabaseFromAssets(AssetManager asm, String inPath, String outPath) {
        try {
            byte[] buffer = new byte[1024];
            int length;
            InputStream sInput = asm.open(inPath);
            OutputStream sOutput = new FileOutputStream(outPath);
            while ((length = sInput.read(buffer)) > 0) {
                sOutput.write(buffer, 0, length);
            }
            sOutput.close();
            sOutput.flush();
            sInput.close();
            return true;
        } catch (IOException e) {
            Log.e(TAG, "Error: in copyDatabaseFromAssets " + e);
            return false;
        }
    }

    public boolean isLast(String filename, String ext) {
        int nExt = ext.length();
        if (filename.length() <= nExt) return false;
        String last = filename.substring(filename.length() - nExt);
        if (!last.equals(ext)) return false;
        return true;
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

    public Boolean copyFromNames(Context context, String fromPath, String fromName, String toPath, String toName) {
        File fromFile = new File(fromPath, fromName);
        fromFile.setReadable(true, false);
        File toFile = context.getDatabasePath(toName);
        try {
            if (!toFile.exists()) {
                toFile.createNewFile();
                //                toFile.setReadable(true, false);

            }
            copyFileFromFile(fromFile, toFile);
            return true;
        } catch (Exception e) {
            Log.e(TAG, "Error: in copyFile " + e);
            return false;
        }
    }

    public String getFileExtension(String name) {
        if (name.lastIndexOf(".") != -1 && name.lastIndexOf(".") != 0) return name.substring(name.lastIndexOf(".") + 1); else return "";
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
