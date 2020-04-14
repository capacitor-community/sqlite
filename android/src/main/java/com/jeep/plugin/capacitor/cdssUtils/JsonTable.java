package com.jeep.plugin.capacitor.cdssUtils;

import android.util.Log;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;
import java.util.List;

public class JsonTable {
    private static final String TAG = "JsonTable";
    private static final List<String> keyTableLevel = new ArrayList<String>(
            Arrays.asList("name","schema","indexes","values"));

    private String name;
    private ArrayList<JsonColumn> schema = new ArrayList<JsonColumn>();
    private ArrayList<JsonIndex> indexes = new ArrayList<JsonIndex>();
    private ArrayList<ArrayList<Object>> values = new ArrayList<ArrayList<Object>>();
    // Getter
    public String getName() {
        return name;
    }
    public ArrayList<JsonColumn> getSchema() {
        return schema;
    }
    public ArrayList<JsonIndex> getIndexes() {
        return indexes;
    }
    public ArrayList<ArrayList<Object>> getValues() {
        return values;
    }



    public boolean isTable(JSONObject jsObj) {
        if(jsObj == null || jsObj.length() == 0) return false;
        int nbColumn = 0;
        Iterator<String> keys = jsObj.keys();
        while(keys.hasNext()) {
            String key = keys.next();
            if(!keyTableLevel.contains(key)) return false;
            try {

                Object value = jsObj.get(key);
                if (key.equals("name")) {
                    if (!(value instanceof String)) {
                        return false;
                    } else {
                        name = (String) value;
                    }
                }
                if (key.equals("schema")) {
                    if(!(value instanceof JSONArray)) {
                        return false;
                    } else {
                        schema = new ArrayList<JsonColumn>();
                        JSONArray arr = jsObj.getJSONArray(key);
                        nbColumn = arr.length();
                        for (int i = 0; i< arr.length() ;i++) {
                            JsonColumn sch = new JsonColumn();
                            boolean retSchema = sch.isSchema(arr.getJSONObject(i));
                            if(!retSchema) return false;
                            schema.add(sch);
                        }
                    }
                }
                if (key.equals("indexes")) {
                    if(!(value instanceof JSONArray)) {
                        return false;
                    } else {
                        indexes = new ArrayList<JsonIndex>();
                        JSONArray arr = jsObj.getJSONArray(key);
                        for (int i = 0; i< arr.length() ;i++) {
                            JsonIndex idx = new JsonIndex();
                            boolean retIndex = idx.isIndexes(arr.getJSONObject(i));
                            if(!retIndex) return false;
                            indexes.add(idx);
                        }
                    }
                }
                if (key.equals("values")) {
                    if(!(value instanceof JSONArray)) {
                        return false;
                    } else {
                        values = new ArrayList<ArrayList<Object>>();
                        JSONArray arr = jsObj.getJSONArray(key);
                        for (int i = 0; i< arr.length() ;i++) {
                            JSONArray row= arr.getJSONArray(i);
                            ArrayList<Object> arrRow = new ArrayList<Object>();
                            for (int j = 0; j< row.length() ;j++) {
                                if(nbColumn > 0 && row.length() != nbColumn) return false;
                                arrRow.add(row.get(j));
                            }
                            values.add(arrRow);
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
        Log.d(TAG, "name: " + this.getName());
        Log.d(TAG, "number of Schema: " + this.getSchema().size());
        for(JsonColumn sch : this.getSchema()) {
            sch.print();
        }
        Log.d(TAG, "number of Indexes: " + this.getIndexes().size());
        for(JsonIndex idx : this.getIndexes()) {
            idx.print();
        }
        Log.d(TAG, "number of Values: " + this.getValues().size());
        for(ArrayList<Object> row : this.getValues()) {
            Log.d(TAG, "row: " + row);
        }

    }
}
