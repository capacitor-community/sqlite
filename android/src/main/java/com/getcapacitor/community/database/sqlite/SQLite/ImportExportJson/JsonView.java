package com.getcapacitor.community.database.sqlite.SQLite.ImportExportJson;

import android.util.Log;
import com.getcapacitor.JSObject;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;
import java.util.List;
import org.json.JSONException;
import org.json.JSONObject;

public class JsonView {

    private static final String TAG = "JsonView";
    private static final List<String> keyViewsLevel = new ArrayList<String>(Arrays.asList("name", "value"));
    private String name = "";
    private String value = "";

    // Getter
    public String getName() {
        return name;
    }

    public String getValue() {
        return value;
    }

    // Setter
    public void setName(String newName) {
        this.name = newName;
    }

    public void setValue(String newValue) {
        this.value = newValue;
    }

    public ArrayList<String> getKeys() {
        ArrayList<String> retArray = new ArrayList<String>();
        if (getName().length() > 0) retArray.add("name");
        if (getValue().length() > 0) retArray.add("value");
        return retArray;
    }

    public boolean isView(JSONObject jsObj) {
        if (jsObj == null || jsObj.length() == 0) return false;
        Iterator<String> keys = jsObj.keys();
        while (keys.hasNext()) {
            String key = keys.next();
            if (!keyViewsLevel.contains(key)) return false;
            try {
                Object objValue = jsObj.get(key);
                if (key.equals("name")) {
                    if (!(objValue instanceof String)) {
                        return false;
                    } else {
                        name = (String) objValue;
                    }
                }
                if (key.equals("value")) {
                    if (!(objValue instanceof String)) {
                        return false;
                    } else {
                        value = (String) objValue;
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
        String toPrint = "name: " + this.getName() + " value: " + this.getValue();
        Log.d(TAG, toPrint);
    }

    public JSObject getViewAsJSObject() {
        JSObject retObj = new JSObject();
        retObj.put("name", this.name);
        retObj.put("value", this.value);
        return retObj;
    }
}
