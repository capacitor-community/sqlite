package com.getcapacitor.community.database.sqlite.SQLite.ImportExportJson;

import android.util.Log;
import com.getcapacitor.JSObject;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;
import java.util.List;
import org.json.JSONException;
import org.json.JSONObject;

public class JsonColumn {

    private static final String TAG = "JsonColumn";
    private static final List<String> keySchemaLevel = new ArrayList<String>(Arrays.asList("column", "value", "foreignkey", "constraint"));
    private String column = null;
    private String value = null;
    private String foreignkey = null;
    private String constraint = null;

    // Getter
    public String getColumn() {
        return column;
    }

    public String getValue() {
        return value;
    }

    public String getForeignkey() {
        return foreignkey;
    }

    public String getConstraint() {
        return constraint;
    }

    // Setter
    public void setColumn(String newColumn) {
        this.column = newColumn;
    }

    public void setValue(String newValue) {
        this.value = newValue;
    }

    public void setForeignkey(String newForeignkey) {
        this.foreignkey = newForeignkey;
    }

    public void setConstraint(String newConstraint) {
        this.constraint = newConstraint;
    }

    public ArrayList<String> getKeys() {
        ArrayList<String> retArray = new ArrayList<String>();
        if (getColumn() != null && getColumn().length() > 0) retArray.add("column");
        if (getValue() != null && getValue().length() > 0) retArray.add("value");
        if (getForeignkey() != null && getForeignkey().length() > 0) retArray.add("foreignkey");
        if (getConstraint() != null && getConstraint().length() > 0) retArray.add("constraint");
        return retArray;
    }

    public boolean isSchema(JSONObject jsObj) {
        if (jsObj == null || jsObj.length() == 0) return false;
        Iterator<String> keys = jsObj.keys();
        while (keys.hasNext()) {
            String key = keys.next();
            if (!keySchemaLevel.contains(key)) return false;
            try {
                Object val = jsObj.get(key);

                if (key.equals("column")) {
                    if (!(val instanceof String)) {
                        return false;
                    } else {
                        column = (String) val;
                    }
                }
                if (key.equals("value")) {
                    if (!(val instanceof String)) {
                        return false;
                    } else {
                        value = (String) val;
                    }
                }
                if (key.equals("foreignkey")) {
                    if (!(val instanceof String)) {
                        return false;
                    } else {
                        foreignkey = (String) val;
                    }
                }
                if (key.equals("constraint")) {
                    if (!(val instanceof String)) {
                        return false;
                    } else {
                        constraint = (String) val;
                    }
                }
            } catch (JSONException e) {
                e.printStackTrace();
                return false;
            }
        }
        return true;
    }

    public void print() {
        String row = "";
        if (this.getColumn() != null) row = "column: " + this.getColumn();
        if (this.getForeignkey() != null) row += " foreignkey: " + this.getForeignkey();
        if (this.getConstraint() != null) row += " constraint: " + this.getConstraint();
        Log.d(TAG, row + " value: " + this.getValue());
    }

    public JSObject getColumnAsJSObject() {
        JSObject retObj = new JSObject();
        if (this.column != null) retObj.put("column", this.column);
        retObj.put("value", this.value);
        if (this.foreignkey != null) retObj.put("foreignkey", this.foreignkey);
        if (this.constraint != null) retObj.put("constraint", this.constraint);
        return retObj;
    }
}
