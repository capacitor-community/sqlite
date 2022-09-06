package com.getcapacitor.community.database.sqlite.SQLite;

import android.content.Context;
import com.getcapacitor.community.database.sqlite.SQLite.UtilsFile;
import java.io.File;
import java.util.ArrayList;

public class UtilsMigrate {

    private static final String TAG = UtilsMigrate.class.getName();
    private UtilsFile uFile = new UtilsFile();

    public String[] getMigratableList(Context context, String folderPath) throws Exception {
        String pathDB = new File(context.getFilesDir().getParentFile(), "databases").getAbsolutePath();
        File dirDB = new File(pathDB);
        if (!dirDB.isDirectory()) {
            dirDB.mkdir();
        }
        String pathFiles = this.getFolder(context, folderPath);
        // check if the path exists
        File dir = new File(pathFiles);
        if (!dir.exists()) {
            throw new Exception("Folder " + dir + " does not exist");
        }
        String[] listFiles = dir.list();
        return listFiles;
    }

    public void addSQLiteSuffix(Context context, String folderPath, ArrayList<String> dbList) throws Exception {
        String pathDB = new File(context.getFilesDir().getParentFile(), "databases").getAbsolutePath();
        File dirDB = new File(pathDB);
        if (!dirDB.isDirectory()) {
            dirDB.mkdir();
        }
        String pathFiles = this.getFolder(context, folderPath);
        // check if the path exists
        File dir = new File(pathFiles);
        if (!dir.exists()) {
            throw new Exception("Folder " + dir + " does not exist");
        }
        String[] listFiles = dir.list();
        if (!pathDB.equals(pathFiles) && listFiles.length == 0) {
            throw new Exception("Folder " + dir + " no database files");
        }
        for (String file : listFiles) {
            if (!file.contains("SQLite.db")) {
                String fromFile = file;
                String toFile = "";
                if (dbList.size() > 0) {
                    if (dbList.contains(file)) {
                        if (uFile.getFileExtension((file)).equals("db")) {
                            toFile = file.replace(".db", "SQLite.db");
                        } else {
                            toFile = file.concat("SQLite.db");
                        }
                    }
                } else {
                    if (uFile.getFileExtension((file)).equals("db")) {
                        toFile = file.replace(".db", "SQLite.db");
                    }
                }
                if (toFile.length() > 0) {
                    boolean ret = uFile.copyFromNames(context, pathFiles, fromFile, pathDB, toFile);
                    if (!ret) {
                        String msg = "Failed in copy " + fromFile + " to " + file;
                        throw new Exception(msg);
                    }
                }
            }
        }
        return;
    }

    public String getFolder(Context context, String folderPath) throws Exception {
        String pathFiles = context.getFilesDir().getAbsolutePath();
        String pathDB = new File(context.getFilesDir().getParentFile(), "databases").getAbsolutePath();
        if (folderPath.equals("default")) {
            pathFiles = pathDB;
        } else if (folderPath.equalsIgnoreCase("cache")) {
            pathFiles = context.getCacheDir().getAbsolutePath();
        } else {
            String[] arr = folderPath.split("/", 2);
            if (arr.length == 2) {
                if (arr[0].equals("files")) {
                    pathFiles = pathFiles.concat("/").concat(arr[1]);
                } else if (arr[0].equals("databases")) {
                    pathFiles = pathDB.concat("/").concat(arr[1]);
                } else {
                    throw new Exception("Folder " + folderPath + " not allowed");
                }
            }
        }
        return pathFiles;
    }

    public void deleteOldDatabases(Context context, String folderPath, ArrayList<String> dbList) throws Exception {
        String pathFiles = this.getFolder(context, folderPath);
        // check if the path exists
        File dir = new File(pathFiles);
        if (!dir.exists()) {
            throw new Exception("Folder " + dir + " does not exist");
        }
        String[] listFiles = dir.list();
        for (String file : listFiles) {
            String delFile = "";
            if (!file.contains("SQLite.db")) {
                if (dbList.size() > 0) {
                    if (dbList.contains(file)) {
                        delFile = file;
                    }
                } else {
                    if (uFile.getFileExtension((file)).equals("db")) {
                        delFile = file;
                    }
                }
                if (delFile.length() > 0) {
                    boolean ret = uFile.deleteFile(pathFiles, delFile);
                    if (!ret) {
                        String msg = "Failed in delete " + delFile;
                        throw new Exception(msg);
                    }
                }
            }
        }
        return;
    }

    public void moveDatabasesAndAddSuffix(Context context, String folderPath, ArrayList<String> dbList) throws Exception {
        String pathDB = new File(context.getFilesDir().getParentFile(), "databases").getAbsolutePath();
        File dirDB = new File(pathDB);
        if (!dirDB.isDirectory()) {
            dirDB.mkdir();
        }
        String pathFiles = this.getFolder(context, folderPath);
        // check if the path exists
        File dir = new File(pathFiles);
        if (!dir.exists()) {
            throw new Exception("Folder " + dir + " does not exist");
        }
        String[] listFiles = dir.list();
        if (!pathDB.equals(pathFiles) && listFiles.length == 0) {
            throw new Exception("Folder " + dir + " no database files");
        }
        for (String file : listFiles) {
            if (file.contains("SQLite.db")) {
                continue;
            }
            String fromFile = file;
            String toFile = "";
            if (dbList.size() > 0) {
                if (dbList.contains(file)) {
                    if (uFile.getFileExtension((file)).equals("db")) {
                        toFile = file.replace(".db", "SQLite.db");
                    } else {
                        toFile = file.concat("SQLite.db");
                    }
                }
            } else {
                if (uFile.getFileExtension((file)).equals("db")) {
                    toFile = file.replace(".db", "SQLite.db");
                }
            }
            if (toFile.length() > 0) {
                boolean ret = new File(pathFiles, fromFile).renameTo(new File(pathDB, toFile));
                if (!ret) {
                    String msg = "Failed in move " + fromFile + " to " + file;
                    throw new Exception(msg);
                }
            }
        }
    }
}
