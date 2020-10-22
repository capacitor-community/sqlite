package com.getcapacitor.community.database.sqlite.cdssUtils;

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
            Log.v(TAG, "Error: in copyFile " + e);
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
