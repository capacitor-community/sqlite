package com.getcapacitor.community.database.sqlite.SQLite.ImportExportJson;

import android.util.Log;
import com.getcapacitor.JSObject;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import org.json.JSONException;
import org.json.JSONObject;

public class JsonIndex {

    private static final String TAG = "JsonIndex";
    private static final List<String> keyIndexesLevel = new ArrayList<String>(Arrays.asList("name", "value", "mode"));
    private String name = "";
    private String value = "";
    private String mode = "";

    // Getter
    public String getName() {
        return name;
    }

    public String getValue() {
        return value;
    }

    public String getMode() {
        return mode;
    }

    // Setter
    public void setName(String newName) {
        this.name = newName;
    }

    public void setValue(String newValue) {
        this.value = newValue;
    }

    public void setMode(String newMode) {
        if (newMode.equalsIgnoreCase("UNIQUE")) {
            this.mode = newMode.toUpperCase();
        }
    }

    public ArrayList<String> getKeys() {
        ArrayList<String> retArray = new ArrayList<String>();
        if (getName().length() > 0) retArray.add("name");
        if (getValue().length() > 0) retArray.add("value");
        if (getMode().length() > 0 && getMode().equalsIgnoreCase("UNIQUE")) retArray.add("mode");
        return retArray;
    }

    public boolean isIndexes(JSONObject jsObj) {
        if (jsObj == null || jsObj.length() == 0) return false;
        Iterator<String> keys = jsObj.keys();
        while (keys.hasNext()) {
            String key = keys.next();
            if (!keyIndexesLevel.contains(key)) return false;
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
                if (key.equals("mode")) {
                    if (!(objValue instanceof String) || !(((String) objValue).equalsIgnoreCase("UNIQUE"))) {
                        return false;
                    } else {
                        mode = (String) objValue;
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
        if (this.getMode().length() > 0) toPrint += " mode: " + this.getMode();
        Log.d(TAG, toPrint);
    }

    public JSObject getIndexAsJSObject() {
        JSObject retObj = new JSObject();
        retObj.put("name", this.name);
        retObj.put("value", this.value);
        if (this.mode.length() > 0) retObj.put("mode", this.mode);
        return retObj;
    }
}
