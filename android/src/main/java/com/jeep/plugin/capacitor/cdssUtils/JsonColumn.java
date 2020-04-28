package com.jeep.plugin.capacitor.cdssUtils;

import android.util.Log;

import com.getcapacitor.JSObject;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;
import java.util.List;

public class JsonColumn {
    private static final String TAG = "JsonColumn";
    private static final List<String> keySchemaLevel = new ArrayList<String>(
            Arrays.asList("column","value"));
    private String column;
    private String value;
    // Getter
    public String getColumn() {
        return column;
    }
    public String getValue() {
        return value;
    }
    // Setter
    public void setColumn(String newColumn) {
        this.column = newColumn;
    }
    public void setValue(String newValue) {
        this.value = newValue;
    }

    public ArrayList<String> getKeys() {
        ArrayList<String> retArray = new ArrayList<String>();
        if(getColumn().length() > 0) retArray.add("column");
        if(getValue().length() > 0) retArray.add("value");
        return retArray;
    }

    public boolean isSchema(JSONObject jsObj) {
        if(jsObj == null || jsObj.length() == 0) return false;
        Iterator<String> keys = jsObj.keys();
        while(keys.hasNext()) {
            String key = keys.next();
            if(!keySchemaLevel.contains(key)) return false;
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

            } catch (JSONException e) {
                e.printStackTrace();
                return false;
            }
        }
        return true;
    }
    public void print() {
        Log.d(TAG, "column: " + this.getColumn());
        Log.d(TAG, "value: " + this.getValue());
    }

    public JSObject getColumnAsJSObject() {
        JSObject retObj = new JSObject();
        retObj.put("column", this.column);
        retObj.put("value", this.value);
        return retObj;
    }

}
