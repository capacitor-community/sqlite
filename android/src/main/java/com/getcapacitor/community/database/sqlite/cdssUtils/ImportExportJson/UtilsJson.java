package com.getcapacitor.community.database.sqlite.cdssUtils.ImportExportJson;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.community.database.sqlite.cdssUtils.SQLiteDatabaseHelper;
import java.sql.Blob;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import net.sqlcipher.database.SQLiteDatabase;
import org.json.JSONException;
import org.json.JSONObject;

public class UtilsJson {

    /**
     * Check if the Id already exsists
     * @param dbHelper
     * @param db
     * @param tableName
     * @param firstColumnName
     * @param key
     * @return
     */
    public boolean isIdExists(SQLiteDatabaseHelper dbHelper, SQLiteDatabase db, String tableName, String firstColumnName, Object key) {
        boolean ret = false;
        String query = new StringBuilder("SELECT ")
            .append(firstColumnName)
            .append(" FROM ")
            .append(tableName)
            .append(" WHERE ")
            .append(firstColumnName)
            .append(" = ")
            .append(key)
            .append(";")
            .toString();
        JSArray resQuery = dbHelper.selectSQL(db, query, new ArrayList<String>());
        if (resQuery.length() == 1) ret = true;
        return ret;
    }

    /**
     * Check if a table exists
     * @param dbHelper
     * @param db
     * @param tableName
     * @return
     */
    public boolean isTableExists(SQLiteDatabaseHelper dbHelper, SQLiteDatabase db, String tableName) {
        boolean ret = false;
        String query = new StringBuilder("SELECT name FROM " + "sqlite_master WHERE type='table' AND name='")
            .append(tableName)
            .append("';")
            .toString();
        JSArray resQuery = dbHelper.selectSQL(db, query, new ArrayList<String>());
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

    /**
     * Convert ArrayList to JSArray
     * @param row
     * @return
     */
    public JSArray convertToJSArray(ArrayList<Object> row) {
        JSArray jsArray = new JSArray();
        for (int i = 0; i < row.size(); i++) {
            jsArray.put(row.get(i));
        }
        return jsArray;
    }

    /**
     * Create the ? string for a given values length
     * @param length
     * @return
     */
    public String createQuestionMarkString(Integer length) {
        String retString = "";
        StringBuilder strB = new StringBuilder();
        for (int i = 0; i < length; i++) {
            strB.append("?,");
        }
        strB.deleteCharAt(strB.length() - 1);
        retString = strB.toString();
        return retString;
    }

    /**
     * Create the Name string from a given Names array
     * @param names
     * @return
     */
    public String setNameForUpdate(ArrayList<String> names) {
        String retString = "";
        StringBuilder strB = new StringBuilder();
        for (int i = 0; i < names.size(); i++) {
            strB.append("(" + names.get(i) + ") = ? ,");
        }
        strB.deleteCharAt(strB.length() - 1);
        retString = strB.toString();
        return retString;
    }

    /**
     * Check the values type from fields type
     * @param types
     * @param values
     * @return
     */
    public boolean checkColumnTypes(ArrayList<String> types, ArrayList<Object> values) {
        boolean isType = true;
        for (int i = 0; i < values.size(); i++) {
            isType = this.isType(types.get(i), values.get(i));
            if (!isType) break;
        }
        return isType;
    }

    /**
     * Check if the the value type is the same than the field type
     * @param type
     * @param value
     * @return
     */
    private boolean isType(String type, Object value) {
        boolean ret = false;
        String val = String.valueOf(value).toUpperCase();
        if (val.equals("NULL")) {
            ret = true;
        } else if (val.contains("BASE64")) {
            ret = true;
        } else {
            if (type.equals("NULL") && value instanceof JSONObject) ret = true;
            if (type.equals("TEXT") && value instanceof String) ret = true;
            if (type.equals("INTEGER") && value instanceof Integer) ret = true;
            if (type.equals("INTEGER") && value instanceof Long) ret = true;
            if (type.equals("REAL") && value instanceof Float) ret = true;
            if (type.equals("BLOB") && value instanceof Blob) ret = true;
        }
        return ret;
    }

    /**
     * Get Field's type and name for a given table
     * @param dbHelper
     * @param db
     * @param tableName
     * @return
     * @throws JSONException
     */
    public JSObject getTableColumnNamesTypes(SQLiteDatabaseHelper dbHelper, SQLiteDatabase db, String tableName) throws JSONException {
        JSObject ret = new JSObject();
        ArrayList<String> names = new ArrayList<String>();
        ArrayList<String> types = new ArrayList<String>();
        String query = new StringBuilder("PRAGMA table_info(").append(tableName).append(");").toString();
        JSArray resQuery = dbHelper.selectSQL(db, query, new ArrayList<String>());
        List<JSObject> lQuery = resQuery.toList();
        if (lQuery.size() > 0) {
            for (JSObject obj : lQuery) {
                names.add(obj.getString("name"));
                types.add(obj.getString("type"));
            }
            ret.put("names", names);
            ret.put("types", types);
        }
        return ret;
    }

    /**
     * Get JSObject keys
     * @param jsonObject
     * @return
     */
    public ArrayList<String> getJSObjectKeys(JSObject jsonObject) {
        // one level JSObject keys
        ArrayList<String> retArray = new ArrayList<>();
        Iterator<String> keys = jsonObject.keys();
        while (keys.hasNext()) {
            String key = keys.next();
            retArray.add(key);
        }
        return retArray;
    }
}
