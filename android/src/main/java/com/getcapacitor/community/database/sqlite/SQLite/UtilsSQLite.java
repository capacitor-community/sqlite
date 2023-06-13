package com.getcapacitor.community.database.sqlite.SQLite;

import android.util.Log;
import androidx.sqlite.db.SupportSQLiteDatabase;
import com.getcapacitor.JSArray;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import net.sqlcipher.Cursor;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

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
                if (idx > -1) {
                    line = line.substring(0, idx);
                }
                if (line.length() > 0) {
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
        List<String> listArray = Arrays.asList(sqlCmdArray);
        listArray = trimArray(listArray);
        listArray = concatRemoveEnd(listArray);
        Object[] objectList = listArray.toArray();
        String[] retArray = Arrays.copyOf(objectList, objectList.length, String[].class);

        //        String[] retArray =  listArray.toArray(new String[listArray.size()]);
        return retArray;
    }

    private List<String> concatRemoveEnd(List<String> listArray) {
        List<String> lArray = new ArrayList<String>(listArray);
        if (lArray.contains("END")) {
            int idx = lArray.indexOf("END");
            lArray.set(idx - 1, lArray.get(idx - 1) + "; END");
            Object o = lArray.remove(idx);
            return concatRemoveEnd(lArray);
        } else {
            return lArray;
        }
    }

    private List<String> trimArray(List<String> listArray) {
        List<String> trimmedStrings = new ArrayList<String>();
        for (String s : listArray) {
            trimmedStrings.add(s.trim());
        }
        return trimmedStrings;
    }

    public ArrayList<Object> objectJSArrayToArrayList(JSArray jsArray) throws JSONException {
        ArrayList<Object> list = new ArrayList<Object>();
        for (int i = 0; i < jsArray.length(); i++) {
            if (jsArray.isNull(i)) {
                list.add(null);
            } else {
                Object obj = jsArray.get(i);
                if (obj.getClass() == JSONObject.class) {
                    if (((JSONObject) obj).getString("type").equals("Buffer")) {
                        byte[] bArr = JSONArrayToByteArray(((JSONObject) obj).getJSONArray("data"));
                        list.add(bArr);
                    } else {
                        throw new JSONException("Object not implemented");
                    }
                } else {
                    list.add(obj);
                }
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

    public byte[] JSONArrayToByteArray(JSONArray arr) throws JSONException {
        byte[] bArr = new byte[arr.length()];
        for (int i = 0; i < arr.length(); i++) {
            bArr[i] = (byte) (((int) arr.get(i)) & 0xFF);
        }
        return bArr;
    }

    public Boolean parse(Object mVar) {
        boolean ret = false;
        if (mVar instanceof JSONArray) {
            ret = true;
        }
        return ret;
    }

    public int ByteToInt(byte BVal) {
        String comb;
        int out = 0;
        comb = BVal + "";
        out = Integer.parseInt(comb);
        // Get Unsigned Int
        if (out < 0) {
            out += 256;
        }
        return out;
    }

    public JSArray ByteArrayToJSArray(byte[] BArr) {
        JSArray arr = new JSArray();

        for (int i = 0; i < BArr.length; i++) {
            arr.put(ByteToInt(BArr[i]));
        }
        return arr;
    }
}
