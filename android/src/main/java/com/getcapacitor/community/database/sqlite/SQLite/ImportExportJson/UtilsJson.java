package com.getcapacitor.community.database.sqlite.SQLite.ImportExportJson;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.community.database.sqlite.SQLite.Database;
import java.sql.Blob;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import org.json.JSONException;
import org.json.JSONObject;

public class UtilsJson {

    private JsonColumn uJCol = new JsonColumn();
    private JsonIndex uJIdx = new JsonIndex();
    private JsonTrigger uJTrg = new JsonTrigger();
    private JsonView uJView = new JsonView();

    /**
     * Check if a table exists
     * @param db
     * @param tableName
     * @return
     */
    public boolean isTableExists(Database db, String tableName) throws Exception {
        boolean ret = false;
        String query = new StringBuilder("SELECT name FROM " + "sqlite_master WHERE type='table' AND name='")
            .append(tableName)
            .append("';")
            .toString();
        try {
            JSArray resQuery = db.selectSQL(query, new ArrayList<Object>());
            if (resQuery.length() > 0) ret = true;
            return ret;
        } catch (Exception e) {
            throw new Exception("isTableExists: " + e.getMessage());
        }
    }

    /**
     * Check if a view exists
     * @param db
     * @param viewName
     * @return
     */
    public boolean isViewExists(Database db, String viewName) throws Exception {
        boolean ret = false;
        String query = new StringBuilder("SELECT name FROM " + "sqlite_master WHERE type='view' AND name='")
            .append(viewName)
            .append("';")
            .toString();
        try {
            JSArray resQuery = db.selectSQL(query, new ArrayList<Object>());
            if (resQuery.length() > 0) ret = true;
            return ret;
        } catch (Exception e) {
            throw new Exception("isViewExists: " + e.getMessage());
        }
    }

    /**
     * Check if the Id already exsists
     * @param mDb
     * @param tableName
     * @param firstColumnName
     * @param key
     * @return
     */
    public boolean isIdExists(Database mDb, String tableName, String firstColumnName, Object key) throws Exception {
        boolean ret = false;
        StringBuilder sbQuery = new StringBuilder("SELECT ")
            .append(firstColumnName)
            .append(" FROM ")
            .append(tableName)
            .append(" WHERE ")
            .append(firstColumnName);

        // fix #160 by peakcool
        if (key instanceof String) {
            sbQuery.append(" = '").append(key).append("';");
        } else {
            sbQuery.append(" = ").append(key).append(";");
        }
        String query = sbQuery.toString();
        try {
            JSArray resQuery = mDb.selectSQL(query, new ArrayList<Object>());
            if (resQuery.length() == 1) ret = true;
            return ret;
        } catch (Exception e) {
            throw new Exception("isIdExists: " + e.getMessage());
        }
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
        } else if (value == null) {
            ret = true;
        } else {
            if (type.equals("NULL") && value instanceof JSONObject) ret = true;
            if (type.equals("TEXT") && value instanceof String) ret = true;
            if (type.equals("INTEGER") && value instanceof Integer) ret = true;
            if (type.equals("INTEGER") && value instanceof Long) ret = true;
            if (type.equals("REAL") && (value instanceof Double || value instanceof Integer)) ret = true;
            if (type.equals("BLOB") && value instanceof Blob) ret = true;
        }
        return ret;
    }

    /**
     * Get Field's type and name for a given table
     * @param mDb
     * @param tableName
     * @return
     * @throws JSONException
     */
    public JSObject getTableColumnNamesTypes(Database mDb, String tableName) throws Exception {
        JSObject ret = new JSObject();
        ArrayList<String> names = new ArrayList<String>();
        ArrayList<String> types = new ArrayList<String>();
        String query = new StringBuilder("PRAGMA table_info(").append(tableName).append(");").toString();
        try {
            JSArray resQuery = mDb.selectSQL(query, new ArrayList<Object>());
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
        } catch (JSONException e) {
            throw new Exception("GetTableColumnNamesTypes: " + e.getMessage());
        } catch (Exception e) {
            throw new Exception("GetTableColumnNamesTypes: " + e.getMessage());
        }
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

    /**
     * Check Row validity
     * @param mDb
     * @param tColNames
     * @param tColTypes
     * @param row
     * @param j
     * @param tableName
     * @throws Exception
     */
    public void checkRowValidity(
        Database mDb,
        ArrayList<String> tColNames,
        ArrayList<String> tColTypes,
        ArrayList<Object> row,
        int j,
        String tableName
    ) throws Exception {
        if (tColNames.size() != row.size() || row.size() == 0 || tColNames.size() == 0) {
            throw new Exception("checkRowValidity: Table" + tableName + " values row " + j + " not correct length");
        }
        // Check the column's type before proceeding
        boolean retTypes = checkColumnTypes(tColTypes, row);
        if (!retTypes) {
            throw new Exception("checkRowValidity: Table" + tableName + " values row " + j + " not correct types");
        }
        return;
    }

    /**
     * Check Schema Validity
     * @param schema
     * @throws Exception
     */
    public void checkSchemaValidity(ArrayList<JsonColumn> schema) throws Exception {
        for (int i = 0; i < schema.size(); i++) {
            JSONObject jsSch = new JSONObject();
            ArrayList<String> keys = schema.get(i).getKeys();
            if (keys.contains("column")) {
                jsSch.put("column", schema.get(i).getColumn());
            }
            if (keys.contains("value")) {
                jsSch.put("value", schema.get(i).getValue());
            }
            if (keys.contains("foreignkey")) {
                jsSch.put("foreignkey", schema.get(i).getForeignkey());
            }
            if (keys.contains("constraint")) {
                jsSch.put("constraint", schema.get(i).getConstraint());
            }
            boolean isValid = uJCol.isSchema(jsSch);
            if (!isValid) {
                throw new Exception("checkSchemaValidity: schema[" + i + "] not valid");
            }
        }
        return;
    }

    /**
     * Check Indexes Validity
     * @param indexes
     * @throws Exception
     */
    public void checkIndexesValidity(ArrayList<JsonIndex> indexes) throws Exception {
        for (int i = 0; i < indexes.size(); i++) {
            JSONObject jsIdx = new JSONObject();
            ArrayList<String> keys = indexes.get(i).getKeys();
            if (keys.contains("value")) {
                jsIdx.put("value", indexes.get(i).getValue());
            }
            if (keys.contains("name")) {
                jsIdx.put("name", indexes.get(i).getName());
            }
            if (keys.contains("mode")) {
                String mode = indexes.get(i).getMode();
                if (mode.length() > 0 && mode.equals("UNIQUE")) {
                    jsIdx.put("mode", mode);
                }
            }
            boolean isValid = uJIdx.isIndexes(jsIdx);
            if (!isValid) {
                throw new Exception("checkIndexesValidity: indexes[" + i + "] not valid");
            }
        }
        return;
    }

    /**
     * Check Triggers Validity
     * @param triggers
     * @throws Exception
     */
    public void checkTriggersValidity(ArrayList<JsonTrigger> triggers) throws Exception {
        for (int i = 0; i < triggers.size(); i++) {
            JSONObject jsTrg = new JSONObject();
            ArrayList<String> keys = triggers.get(i).getKeys();
            if (keys.contains("name")) {
                jsTrg.put("name", triggers.get(i).getName());
            }
            if (keys.contains("timeevent")) {
                jsTrg.put("timeevent", triggers.get(i).getTimeevent());
            }
            if (keys.contains("condition")) {
                jsTrg.put("condition", triggers.get(i).getCondition());
            }
            if (keys.contains("logic")) {
                jsTrg.put("logic", triggers.get(i).getLogic());
            }
            boolean isValid = uJTrg.isTrigger(jsTrg);
            if (!isValid) {
                throw new Exception("checkTriggersValidity: triggers[" + i + "] not valid");
            }
        }
        return;
    }

    /**
     * Check Views Validity
     * @param views
     * @throws Exception
     */
    public void checkViewsValidity(ArrayList<JsonView> views) throws Exception {
        for (int i = 0; i < views.size(); i++) {
            JSONObject jsView = new JSONObject();
            ArrayList<String> keys = views.get(i).getKeys();
            if (keys.contains("value")) {
                jsView.put("value", views.get(i).getValue());
            }
            if (keys.contains("name")) {
                jsView.put("name", views.get(i).getName());
            }
            boolean isValid = uJView.isView(jsView);
            if (!isValid) {
                throw new Exception("checkViewsValidity: views[" + i + "] not valid");
            }
        }
        return;
    }
}
