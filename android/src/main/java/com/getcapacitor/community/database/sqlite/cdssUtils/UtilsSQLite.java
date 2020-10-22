package com.getcapacitor.community.database.sqlite.cdssUtils;

import android.database.Cursor;
import android.util.Log;
import com.getcapacitor.community.database.sqlite.cdssUtils.ImportExportJson.ImportFromJson;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import net.sqlcipher.database.SQLiteDatabase;

public class UtilsSQLite {
    private static final String TAG = UtilsSQLite.class.getName();

    /**
     * Return the total number of changes in the DB from the last command
     * @param db
     * @return
     */
    public int dbChanges(SQLiteDatabase db) {
        String SELECT_CHANGE = "SELECT total_changes()";
        Boolean success = true;
        int ret = Integer.valueOf(-1);
        try {
            Cursor cursor = db.rawQuery(SELECT_CHANGE, null);
            if (cursor != null) {
                if (cursor.moveToFirst()) {
                    ret = Integer.parseInt(cursor.getString(0));
                }
            }
            cursor.close();
        } catch (Exception e) {
            Log.d(TAG, "Error: dbChanges failed: ", e);
        } finally {
            return ret;
        }
    }

    public String[] getStatementsArray(String statements) {
        statements.replace("end;", "END;");
        // split for each statement
        String[] sqlCmdArray = statements.split(";\n");
        // deal with trigger if any
        sqlCmdArray = dealWithTriggers(sqlCmdArray);
        // split for a single statement on multilines
        for (int i = 0; i < sqlCmdArray.length; i++) {
            String[] array = sqlCmdArray[i].split("\n");
            StringBuilder builder = new StringBuilder();
            for (String s : array) {
                builder.append(" ").append(s.trim());
            }
            sqlCmdArray[i] = builder.toString();
        }
        if (sqlCmdArray[sqlCmdArray.length - 1].trim().length() == 0) {
            sqlCmdArray = Arrays.copyOf(sqlCmdArray, sqlCmdArray.length - 1);
        }
        return sqlCmdArray;
    }

    private String[] dealWithTriggers(String[] sqlCmdArray) {
        List listArray = Arrays.asList(sqlCmdArray);
        listArray = trimArray(listArray);
        listArray = concatRemoveEnd(listArray);
        String[] retArray = (String[]) listArray.toArray(new String[0]);
        return retArray;
    }

    private List concatRemoveEnd(List listArray) {
        List lArray = new ArrayList(listArray);
        if (lArray.contains("END")) {
            int idx = lArray.indexOf("END");
            lArray.set(idx - 1, lArray.get(idx - 1) + "; END");
            Object o = lArray.remove(idx);
            return concatRemoveEnd(lArray);
        } else {
            return lArray;
        }
    }

    private List trimArray(List listArray) {
        for (int i = 0; i < listArray.size(); i++) {
            listArray.set(i, listArray.get(i).toString().trim());
        }
        return listArray;
    }
}
