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
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

public class UtilsFile {

    private static final String TAG = UtilsFile.class.getName();

    public Boolean isFileExists(Context context, String dbName) {
        File file = context.getDatabasePath(dbName);
        return file.exists();
    }

    public Boolean isPathExists(String filePath) {
        File file = new File(filePath);
        if (file.exists()) {
            return true;
        } else {
            return false;
        }
    }

    public String[] getListOfFiles(Context context) {
        String[] files = context.databaseList();
        List<String> dbs = new ArrayList<>();
        for (String file : files) {
            if (file.endsWith("SQLite.db")) {
                dbs.add(file);
            }
        }
        String[] retArray = dbs.toArray(new String[0]);
        return retArray;
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

    public void copyFromAssetsToDatabase(Context context, Boolean overwrite) throws Exception {
        AssetManager assetManager = context.getAssets();
        String assetsDatabasePath = "public/assets/databases";
        try {
            // check if databases directory exists else create it
            String pathDB = new File(context.getFilesDir().getParentFile(), "databases").getAbsolutePath();
            File dirDB = new File(pathDB);
            if (!dirDB.isDirectory()) {
                dirDB.mkdir();
            }

            // look into the public/assets/databases to get databases to copy
            String[] filelist = assetManager.list(assetsDatabasePath);
            if (filelist.length == 0) {
                // dir does not exist or is not a directory
                throw new Exception("Folder public/assets/databases does not exist or is empty");
            } else {
                for (int i = 0; i < filelist.length; i++) {
                    // Get filename of file or directory
                    String fileName = filelist[i];
                    if (isLast(fileName, ".db")) {
                        String toFileName = addSQLiteSuffix(fileName);
                        boolean isExist = isFileExists(context, toFileName);
                        if (!isExist || overwrite) {
                            if (overwrite && isExist) {
                                deleteDatabase(context, toFileName);
                            }
                            String fromPathName = assetsDatabasePath + "/" + fileName;
                            String toPathName = context.getDatabasePath(toFileName).getAbsolutePath();
                            copyDatabaseFromAssets(assetManager, fromPathName, toPathName);
                        }
                    }
                    if (isLast(fileName, ".zip")) {
                        // unzip file and extract databases
                        String zipPathName = assetsDatabasePath + "/" + fileName;
                        unzipCopyDatabase(context, assetManager, zipPathName, assetsDatabasePath, overwrite);
                    }
                }
                return;
            }
        } catch (IOException e) {
            throw new Exception("in copyFromAssetsToDatabase " + e.getLocalizedMessage());
        }
    }

    public void unzipCopyDatabase(Context context, AssetManager asm, String zipPath, String assetsDatabasePath, Boolean overwrite)
        throws IOException {
        InputStream is;
        byte[] buffer = new byte[1024];
        try {
            is = asm.open(zipPath);
            ZipInputStream zis = new ZipInputStream(is);

            ZipEntry ze = zis.getNextEntry();
            while (ze != null) {
                String fileName = ze.getName();
                if (isLast(fileName, ".db")) {
                    String toFileName = addSQLiteSuffix(fileName);
                    boolean isExist = isFileExists(context, toFileName);
                    if (!isExist || overwrite) {
                        if (overwrite && isExist) {
                            deleteDatabase(context, toFileName);
                        }
                        String toPathName = context.getDatabasePath(toFileName).getAbsolutePath();
                        File newFile = new File(toPathName);
                        System.out.println("Unzipping to " + newFile.getAbsolutePath());
                        FileOutputStream fos = new FileOutputStream(newFile);
                        int len;
                        while ((len = zis.read(buffer)) > 0) {
                            fos.write(buffer, 0, len);
                        }
                        fos.close();
                    }
                    //close this ZipEntry
                    zis.closeEntry();
                    ze = zis.getNextEntry();
                }
            }
            //close last ZipEntry
            zis.closeEntry();
            zis.close();
            is.close();
        } catch (IOException e) {
            throw new IOException("in unzipCopyDatabase " + e.getLocalizedMessage());
        }
    }

    public String addSQLiteSuffix(String fileName) {
        String toFileName = fileName;
        boolean isSQLite = isLast(fileName, "SQLite.db");
        if (!isSQLite) {
            toFileName = fileName.substring(0, fileName.length() - 3) + "SQLite.db";
        }
        return toFileName;
    }

    public void copyDatabaseFromAssets(AssetManager asm, String inPath, String outPath) throws IOException {
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
            return;
        } catch (IOException e) {
            throw new IOException("in copyDatabaseFromAssets " + e.getLocalizedMessage());
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
