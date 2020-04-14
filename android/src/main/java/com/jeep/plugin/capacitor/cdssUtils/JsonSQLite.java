package com.jeep.plugin.capacitor.cdssUtils;

import android.util.Log;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Iterator;
import java.util.List;

public class JsonSQLite {
    private static final String TAG = "JsonSQLite";

    private String database;
    private Boolean encrypted;
    private String mode;
    private ArrayList<JsonTable> tables;

    private static final List<String> keyFirstLevel = new ArrayList<String>(
            Arrays.asList("database","encrypted","mode","tables"));

    // Getter
    public String getDatabase() {
        return database;
    }
    public Boolean getEncrypted() {
        return encrypted;
    }
    public String getMode() {
        return mode;
    }
    public ArrayList<JsonTable> getTables() {
        return tables;
    }



    public boolean isJsonSQLite(JSObject jsObj) {
        if(jsObj == null || jsObj.length() == 0) return false;
        Iterator<String> keys = jsObj.keys();
        while(keys.hasNext()) {
            String key = keys.next();
            if(!keyFirstLevel.contains(key)) return false;
            try {

                Object value = jsObj.get(key);

                if (key.equals("database")) {
                    if (!(value instanceof String)) {
                        return false;
                    } else {
                        database = (String) value;
                    }
                }
                if( key.equals("encrypted")) {
                    if(!(value instanceof Boolean)) {
                        return false;
                    } else {
                        encrypted = jsObj.getBool(key);
                    }
                }
                if (key.equals("mode")) {
                    if(!(value instanceof String)) {
                        return false;
                    } else {
                        mode = jsObj.getString(key);
                    }
                }
                if (key.equals("tables")) {
                    if(!(value instanceof JSONArray)) {
                        return false;
                    } else {
                        JSONArray arr = jsObj.getJSONArray(key);
                        tables = new ArrayList<JsonTable>();
                        for (int i = 0; i< arr.length() ;i++) {
                            JsonTable table = new JsonTable();
                            boolean retTable = table.isTable(arr.getJSONObject(i));
                            if(!retTable) return false;
                            tables.add(table);
                        }
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
        Log.d(TAG, "database: " + this.getDatabase());
        Log.d(TAG, "encrypted: " + this.getEncrypted());
        Log.d(TAG, "mode: " + this.getMode());
        Log.d(TAG, "number of Tables: " + this.getTables().size());
        for(JsonTable table : this.getTables()) {
            table.print();
        }
    }
}
