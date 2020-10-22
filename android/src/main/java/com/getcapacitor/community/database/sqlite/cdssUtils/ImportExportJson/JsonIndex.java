package com.getcapacitor.community.database.sqlite.cdssUtils.ImportExportJson;

import android.util.Log;
import com.getcapacitor.JSObject;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;
import java.util.List;
import org.json.JSONException;
import org.json.JSONObject;

public class JsonIndex {
    private static final String TAG = "JsonIndex";
    private static final List<String> keyIndexesLevel = new ArrayList<String>(Arrays.asList("name", "column"));
    private String name;
    private String column;

    // Getter
    public String getName() {
        return name;
    }

    public String getColumn() {
        return column;
    }

    // Setter
    public void setName(String newName) {
        this.name = newName;
    }

    public void setColumn(String newColumn) {
        this.column = newColumn;
    }

    public ArrayList<String> getKeys() {
        ArrayList<String> retArray = new ArrayList<String>();
        if (getName().length() > 0) retArray.add("name");
        if (getColumn().length() > 0) retArray.add("column");
        return retArray;
    }

    public boolean isIndexes(JSONObject jsObj) {
        if (jsObj == null || jsObj.length() == 0) return false;
        Iterator<String> keys = jsObj.keys();
        while (keys.hasNext()) {
            String key = keys.next();
            if (!keyIndexesLevel.contains(key)) return false;
            try {
                Object value = jsObj.get(key);
                if (key.equals("name")) {
                    if (!(value instanceof String)) {
                        return false;
                    } else {
                        name = (String) value;
                    }
                }
                if (key.equals("column")) {
                    if (!(value instanceof String)) {
                        return false;
                    } else {
                        column = (String) value;
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
        Log.d(TAG, "name: " + this.getName() + " column: " + this.getColumn());
    }

    public JSObject getIndexAsJSObject() {
        JSObject retObj = new JSObject();
        retObj.put("name", this.name);
        retObj.put("column", this.column);
        return retObj;
    }
}
