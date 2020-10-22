package com.getcapacitor.community.database.sqlite.cdssUtils.ImportExportJson;

import android.util.Log;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONException;

public class JsonSQLite {
    private static final String TAG = "JsonSQLite";

    private String database = "";
    private Integer version = 1;
    private Boolean encrypted = null;
    private String mode = "";
    private ArrayList<JsonTable> tables = new ArrayList<JsonTable>();

    private static final List<String> keyFirstLevel = new ArrayList<String>(
        Arrays.asList("database", "version", "encrypted", "mode", "tables")
    );

    // Getter
    public String getDatabase() {
        return database;
    }

    public Integer getVersion() {
        return version;
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

    public void setVersion(Integer newVersion) {
        this.version = newVersion;
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
        if (getVersion() != null) retArray.add("version");
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

                if (key.equals("database")) {
                    if (!(value instanceof String)) {
                        return false;
                    } else {
                        database = (String) value;
                    }
                }
                if (key.equals("version")) {
                    if (!(value instanceof Integer)) {
                        return false;
                    } else {
                        version = (Integer) value;
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
                        String msg = "value: not instance of JSONArray 1";
                        Log.d(TAG, msg);

                        return false;
                    } else {
                        if (value instanceof JSONArray) {
                            JSONArray arrJS = jsObj.getJSONArray(key);
                            tables = new ArrayList<>();

                            for (int i = 0; i < arrJS.length(); i++) {
                                JsonTable table = new JsonTable();
                                boolean retTable = table.isTable(arrJS.getJSONObject(i));

                                if (!retTable) return false;
                                tables.add(table);
                            }
                        } else {
                            String msg = "value: not instance of ";
                            msg += "JSONArray 2";
                            Log.d(TAG, msg);
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
        Log.d(TAG, "version: " + this.getVersion());
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
