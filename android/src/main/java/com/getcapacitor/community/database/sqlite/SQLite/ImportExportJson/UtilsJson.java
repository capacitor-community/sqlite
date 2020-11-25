package com.getcapacitor.community.database.sqlite.SQLite.ImportExportJson;

import com.getcapacitor.JSArray;
import com.getcapacitor.community.database.sqlite.SQLite.Database;
import java.util.ArrayList;

public class UtilsJson {

    /**
     * Check if a table exists
     * @param db
     * @param tableName
     * @return
     */
    public boolean isTableExists(Database db, String tableName) {
        boolean ret = false;
        String query = new StringBuilder("SELECT name FROM " + "sqlite_master WHERE type='table' AND name='")
            .append(tableName)
            .append("';")
            .toString();
        JSArray resQuery = db.selectSQL(query, new ArrayList<String>());
        if (resQuery.length() > 0) ret = true;
        return ret;
    }

    /**
     * Create a String from a given Array of Strings with
     * a given separator
     * @param arr
     * @param sep
     * @return
     */

    public String convertToString(ArrayList<String> arr, char sep) {
        StringBuilder builder = new StringBuilder();
        // Append all Integers in StringBuilder to the StringBuilder.
        for (String str : arr) {
            builder.append(str);
            builder.append(sep);
        }
        // Remove last delimiter with setLength.
        builder.setLength(builder.length() - 1);
        return builder.toString();
    }
}
