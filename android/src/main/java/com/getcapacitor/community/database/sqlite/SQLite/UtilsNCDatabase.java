package com.getcapacitor.community.database.sqlite.SQLite;

import android.content.Context;
import java.io.File;

public class UtilsNCDatabase {

    private static final String TAG = UtilsNCDatabase.class.getName();
    private UtilsMigrate uMigrate = new UtilsMigrate();

    public String getNCDatabasePath(Context context, String folderPath, String database) throws Exception {
        String pathDB = new File(context.getFilesDir().getParentFile(), "databases").getAbsolutePath();
        File dirDB = new File(pathDB);
        if (!dirDB.isDirectory()) {
            dirDB.mkdir();
        }
        String pathFiles = uMigrate.getFolder(context, folderPath);
        // check if the path exists
        File dir = new File(pathFiles);
        if (!dir.exists()) {
            throw new Exception("Folder " + dir + " does not exist");
        }
        String databasePath = pathFiles.concat("/").concat(database);
        return databasePath;
    }
}
