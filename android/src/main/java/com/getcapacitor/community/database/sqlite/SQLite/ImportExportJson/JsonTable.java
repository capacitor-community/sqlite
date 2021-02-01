package com.getcapacitor.community.database.sqlite.SQLite.ImportExportJson;

import android.util.Log;
import com.getcapacitor.JSObject;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class JsonTable {

    private static final String TAG = "JsonTable";
    private static final List<String> keyTableLevel = new ArrayList<String>(
        Arrays.asList("name", "schema", "indexes", "triggers", "values")
    );

    private String name = "";
    private ArrayList<JsonColumn> schema = new ArrayList<JsonColumn>();
    private ArrayList<JsonIndex> indexes = new ArrayList<JsonIndex>();
    private ArrayList<JsonTrigger> triggers = new ArrayList<>();
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

    public ArrayList<JsonTrigger> getTriggers() {
        return triggers;
    }

    public ArrayList<ArrayList<Object>> getValues() {
        return values;
    }

    // Setter
    public void setName(String newName) {
        this.name = newName;
    }

    public void setSchema(ArrayList<JsonColumn> newSchema) {
        this.schema = newSchema;
    }

    public void setIndexes(ArrayList<JsonIndex> newIndexes) {
        this.indexes = newIndexes;
    }

    public void setTriggers(ArrayList<JsonTrigger> newTriggers) {
        this.triggers = newTriggers;
    }

    public void setValues(ArrayList<ArrayList<Object>> newValues) {
        this.values = newValues;
    }

    public ArrayList<String> getKeys() {
        ArrayList<String> retArray = new ArrayList<String>();
        if (getName().length() > 0) retArray.add("names");
        if (getSchema().size() > 0) retArray.add("schema");
        if (getIndexes().size() > 0) retArray.add("indexes");
        if (getTriggers().size() > 0) retArray.add("triggers");
        if (getValues().size() > 0) retArray.add("values");
        return retArray;
    }

    public boolean isTable(JSONObject jsObj) {
        if (jsObj == null || jsObj.length() == 0) return false;
        int nbColumn = 0;
        Iterator<String> keys = jsObj.keys();
        while (keys.hasNext()) {
            String key = keys.next();
            if (!keyTableLevel.contains(key)) return false;
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
                    if (!(value instanceof JSONArray) && !(value instanceof ArrayList)) {
                        return false;
                    } else {
                        schema = new ArrayList<JsonColumn>();
                        JSONArray arr = jsObj.getJSONArray(key);
                        nbColumn = 0;
                        for (int i = 0; i < arr.length(); i++) {
                            JsonColumn sch = new JsonColumn();
                            boolean retSchema = sch.isSchema(arr.getJSONObject(i));
                            if (sch.getColumn() != null) nbColumn++;
                            if (!retSchema) return false;
                            schema.add(sch);
                        }
                    }
                }
                if (key.equals("indexes")) {
                    if (!(value instanceof JSONArray) && !(value instanceof ArrayList)) {
                        return false;
                    } else {
                        indexes = new ArrayList<JsonIndex>();
                        JSONArray arr = jsObj.getJSONArray(key);
                        for (int i = 0; i < arr.length(); i++) {
                            JsonIndex idx = new JsonIndex();
                            boolean retIndex = idx.isIndexes(arr.getJSONObject(i));
                            if (!retIndex) return false;
                            indexes.add(idx);
                        }
                    }
                }
                if (key.equals("triggers")) {
                    if (!(value instanceof JSONArray) && !(value instanceof ArrayList)) {
                        return false;
                    } else {
                        triggers = new ArrayList<JsonTrigger>();
                        JSONArray arr = jsObj.getJSONArray(key);
                        for (int i = 0; i < arr.length(); i++) {
                            JsonTrigger trg = new JsonTrigger();
                            boolean retTrigger = trg.isTrigger(arr.getJSONObject(i));
                            if (!retTrigger) return false;
                            triggers.add(trg);
                        }
                    }
                }
                if (key.equals("values")) {
                    if (!(value instanceof JSONArray) && !(value instanceof ArrayList)) {
                        return false;
                    } else {
                        values = new ArrayList<ArrayList<Object>>();
                        JSONArray arr = jsObj.getJSONArray(key);
                        for (int i = 0; i < arr.length(); i++) {
                            JSONArray row = arr.getJSONArray(i);
                            ArrayList<Object> arrRow = new ArrayList<Object>();
                            for (int j = 0; j < row.length(); j++) {
                                if (nbColumn > 0 && row.length() != nbColumn) return false;
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
        for (JsonColumn sch : this.getSchema()) {
            sch.print();
        }
        Log.d(TAG, "number of Indexes: " + this.getIndexes().size());
        for (JsonIndex idx : this.getIndexes()) {
            idx.print();
        }
        Log.d(TAG, "number of Triggers: " + this.getTriggers().size());
        for (JsonTrigger trg : this.getTriggers()) {
            trg.print();
        }
        Log.d(TAG, "number of Values: " + this.getValues().size());
        for (ArrayList<Object> row : this.getValues()) {
            Log.d(TAG, "row: " + row);
        }
    }

    public JSObject getTableAsJSObject() {
        JSObject retObj = new JSObject();
        retObj.put("name", getName());
        JSONArray JSSchema = new JSONArray();
        if (this.schema.size() > 0) {
            for (JsonColumn sch : this.schema) {
                JSSchema.put(sch.getColumnAsJSObject());
            }
            retObj.put("schema", JSSchema);
        }
        JSONArray JSIndexes = new JSONArray();
        if (this.indexes.size() > 0) {
            for (JsonIndex idx : this.indexes) {
                JSIndexes.put(idx.getIndexAsJSObject());
            }
            retObj.put("indexes", JSIndexes);
        }
        JSONArray JSTriggers = new JSONArray();
        if (this.triggers.size() > 0) {
            for (JsonTrigger trg : this.triggers) {
                JSTriggers.put(trg.getTriggerAsJSObject());
            }
            retObj.put("triggers", JSTriggers);
        }
        JSONArray JSValues = new JSONArray();
        if (this.values.size() > 0) {
            for (ArrayList<Object> row : this.values) {
                JSONArray JSRow = new JSONArray();
                for (Object val : row) {
                    if (val instanceof String) {
                        JSRow.put(val.toString());
                    } else {
                        JSRow.put(val);
                    }
                }
                JSValues.put(JSRow);
            }
            retObj.put("values", JSValues);
        }

        return retObj;
    }
}
