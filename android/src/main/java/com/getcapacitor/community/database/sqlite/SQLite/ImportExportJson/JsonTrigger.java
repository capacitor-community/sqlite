package com.getcapacitor.community.database.sqlite.SQLite.ImportExportJson;

import android.util.Log;
import com.getcapacitor.JSObject;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;
import java.util.List;
import org.json.JSONException;
import org.json.JSONObject;

public class JsonTrigger {

    private static final String TAG = "JsonTrigger";
    private static final List<String> keyTriggerLevel = new ArrayList<String>(Arrays.asList("name", "timeevent", "condition", "logic"));
    private String name = null;
    private String timeevent = null;
    private String condition = null;
    private String logic = null;

    // Getter
    public String getName() {
        return name;
    }

    public String getTimeevent() {
        return timeevent;
    }

    public String getCondition() {
        return condition;
    }

    public String getLogic() {
        return logic;
    }

    // Setter
    public void setName(String newName) {
        this.name = newName;
    }

    public void setTimeevent(String newTimeevent) {
        this.timeevent = newTimeevent;
    }

    public void setCondition(String newCondition) {
        this.condition = newCondition;
    }

    public void setLogic(String newLogic) {
        this.logic = newLogic;
    }

    public ArrayList<String> getKeys() {
        ArrayList<String> retArray = new ArrayList<String>();
        if (getName() != null && getName().length() > 0) retArray.add("name");
        if (getTimeevent() != null && getTimeevent().length() > 0) retArray.add("timeevent");
        if (getCondition() != null && getCondition().length() > 0) retArray.add("condition");
        if (getLogic() != null && getLogic().length() > 0) retArray.add("logic");
        return retArray;
    }

    public boolean isTrigger(JSONObject jsObj) {
        if (jsObj == null || jsObj.length() == 0) return false;
        Iterator<String> keys = jsObj.keys();
        while (keys.hasNext()) {
            String key = keys.next();
            if (!keyTriggerLevel.contains(key)) return false;
            try {
                Object val = jsObj.get(key);

                if (key.equals("name")) {
                    if (!(val instanceof String)) {
                        return false;
                    } else {
                        name = (String) val;
                    }
                }
                if (key.equals("timeevent")) {
                    if (!(val instanceof String)) {
                        return false;
                    } else {
                        timeevent = (String) val;
                    }
                }
                if (key.equals("condition")) {
                    if (!(val instanceof String)) {
                        return false;
                    } else {
                        condition = (String) val;
                    }
                }
                if (key.equals("logic")) {
                    if (!(val instanceof String)) {
                        return false;
                    } else {
                        logic = (String) val;
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
        row = "name: " + this.getName() + " timeevent: " + this.getTimeevent();
        if (this.getCondition() != null) row += " condition: " + this.getCondition();
        Log.d(TAG, row + " logic: " + this.getLogic());
    }

    public JSObject getTriggerAsJSObject() {
        JSObject retObj = new JSObject();
        retObj.put("name", this.name);
        retObj.put("timeevent", this.timeevent);
        if (this.condition != null) retObj.put("condition", this.condition);
        retObj.put("logic", this.logic);
        return retObj;
    }
}
