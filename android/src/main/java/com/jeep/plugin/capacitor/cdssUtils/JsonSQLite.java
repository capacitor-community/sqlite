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

    private String database = "";
    private Boolean encrypted = null;
    private String mode = "";
    private ArrayList<JsonTable> tables = new ArrayList<JsonTable>();

    private static final List<String> keyFirstLevel = new ArrayList<String>(
            Arrays.asList("database", "encrypted", "mode", "tables"));

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

    // Setter
    public void setDatabase(String newDatabase) {
        this.database = newDatabase;
    }

    public void setEncrypted(Boolean newEncrypted) {
        this.encrypted = newEncrypted;
    }

    public void setMode(String newMode) {
        this.mode = newMode;
    }

    public void setTables(ArrayList<JsonTable> newTables) {
        this.tables = newTables;
    }

    public ArrayList<String> getKeys() {
        ArrayList<String> retArray = new ArrayList<String>();
        if (getDatabase().length() > 0) retArray.add("database");
        if (getEncrypted() != null) retArray.add("encrypted");
        if (getMode().length() > 0) retArray.add("mode");
        if (getTables().size() > 0) retArray.add("tables");
        return retArray;
    }

    public boolean isJsonSQLite(JSObject jsObj) {
        if (jsObj == null || jsObj.length() == 0) return false;
        Iterator<String> keys = jsObj.keys();
        while (keys.hasNext()) {
            String key = keys.next();
            if (!keyFirstLevel.contains(key)) return false;
            try {

                Object value = jsObj.get(key);
                Log.d(TAG, "value: " +value );


                if (key.equals("database")) {
                    if (!(value instanceof String)) {
                        return false;
                    } else {
                        database = (String) value;
                    }
                }
                if (key.equals("encrypted")) {
                    if (!(value instanceof Boolean)) {
                        return false;
                    } else {
                        encrypted = jsObj.getBool(key);
                    }
                }
                if (key.equals("mode")) {
                    if (!(value instanceof String)) {
                        return false;
                    } else {
                        mode = jsObj.getString(key);
                    }
                }
                if (key.equals("tables")) {
                    if (!(value instanceof JSONArray)) {
                        Log.d(TAG, "value: not instance of JSONArray 1" );

                        return false;
                    } else {
                        if (value instanceof JSONArray) {
                            Log.d(TAG, "value: is instance of JSONArray 1" );
                            JSONArray arrJS = jsObj.getJSONArray(key);
                            tables = new ArrayList<>();
                            Log.d(TAG, "arrJS.length() " + arrJS.length());

                            for (int i = 0; i < arrJS.length(); i++) {
                                JsonTable table = new JsonTable();
                                boolean retTable = table.isTable(arrJS.getJSONObject(i));
                                if (!retTable) return false;
                                tables.add(table);
                            }
                        } else {
                            Log.d(TAG, "value: not instance of JSONArray 2" );

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
        for (JsonTable table : this.getTables()) {
            table.print();
        }
    }

    public JSArray getTablesAsJSObject() {
        JSArray JSTables = new JSArray();
        for (JsonTable table : this.tables) {
            JSTables.put(table.getTableAsJSObject());
        }
        return JSTables;
    }
}
