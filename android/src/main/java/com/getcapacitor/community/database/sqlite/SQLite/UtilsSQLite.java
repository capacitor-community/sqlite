package com.getcapacitor.community.database.sqlite.SQLite;

import android.util.Log;
import androidx.sqlite.db.SupportSQLiteDatabase;
import com.getcapacitor.JSArray;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import net.sqlcipher.Cursor;
import org.json.JSONArray;
import org.json.JSONException;

public class UtilsSQLite {

    private static final String TAG = UtilsSQLite.class.getName();

    public int dbChanges(SupportSQLiteDatabase db) {
        String SELECT_CHANGE = "SELECT total_changes()";
        Boolean success = true;
        int ret = Integer.valueOf(-1);
        try {
            Cursor cursor = (Cursor) db.query(SELECT_CHANGE, null);
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

    public long dbLastId(SupportSQLiteDatabase db) {
        String SELECT_CHANGE = "SELECT last_insert_rowid()";
        Boolean success = true;
        long ret = Long.valueOf(-1);
        try {
            Cursor cursor = (Cursor) db.query(SELECT_CHANGE, null);
            if (cursor != null) {
                if (cursor.moveToFirst()) {
                    ret = Long.parseLong(cursor.getString(0));
                }
            }
            cursor.close();
        } catch (Exception e) {
            Log.d(TAG, "Error: dbLastId failed: ", e);
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
                String line = s.trim();
                int idx = line.indexOf("--");
                if(idx > -1) {
                    line = line.substring(0, idx);
                }
                if(line.length() > 0) {
                    if (builder.length() > 0) {
                        builder.append(" ");
                    }
                    builder.append(line);
                }

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

    public ArrayList<Object> objectJSArrayToArrayList(JSArray jsArray) throws JSONException {
        ArrayList<Object> list = new ArrayList<Object>();
        for (int i = 0; i < jsArray.length(); i++) {
            if (jsArray.isNull(i)) {
                list.add(null);
            } else {
                list.add(jsArray.get(i));
            }
        }
        return list;
    }

    public ArrayList<String> stringJSArrayToArrayList(JSArray jsArray) throws JSONException {
        ArrayList<String> list = new ArrayList<String>();
        for (int i = 0; i < jsArray.length(); i++) {
            if (jsArray.get(i) instanceof String) {
                list.add(jsArray.getString(i));
            } else {
                list = new ArrayList<String>();
                break;
            }
        }
        return list;
    }

    public Boolean parse(Object mVar) {
        boolean ret = false;
        if (mVar instanceof JSONArray) {
            ret = true;
        }
        return ret;
    }
}
