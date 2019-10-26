package com.jeep.plugin.capacitor.sqlite;

import android.content.Context;
import android.util.Log;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.NativePlugin;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;

import com.jeep.plugin.capacitor.sqlite.DatabaseHelper;

import org.json.JSONException;

import java.util.ArrayList;
import java.util.List;

@NativePlugin()
public class CapacitorSQLite extends Plugin {
    private DatabaseHelper mDb;
    private Context context;

    public void load() {
        // Get singleton instance of database
        context = getContext();
    }

    @PluginMethod()
    public void echo(PluginCall call) {
        String value = call.getString("value");

        JSObject ret = new JSObject();
        ret.put("value", value);
        call.success(ret);
    }
    @PluginMethod()
    public void open(PluginCall call) {
        String name = call.getString("name");
        if (name == null) {
            call.reject("Must provide a database name");
            return;
        }
        mDb = DatabaseHelper.getInstance(context,name+".db",1);

        call.resolve();
    }
    @PluginMethod()
    public void execute(PluginCall call) {
        String statements = call.getString("statements");
        if (statements == null) {
            call.reject("Must provide raw SQL statements");
            return;
        }
        String[] sqlCmdArray = statements.split("\n");
        StringBuilder builder = new StringBuilder();
        for(String s : sqlCmdArray) {
            builder.append(s.trim());
        }
        String str = builder.toString();
        sqlCmdArray = str.split(";");
        if(sqlCmdArray[sqlCmdArray.length-1] == "") {
            sqlCmdArray = Arrays.copyOf(sqlCmdArray, sqlCmdArray.length-1);
        }
        int res = mDb.execSQL(sqlCmdArray);
        JSObject ret = new JSObject();
        ret.put("result",res);
        call.resolve(ret);
    }
    @PluginMethod()
    public void run(PluginCall call) {
        String statement = call.getString("statement");
        if (statement == null) {
            call.reject("Must provide a SQL statement");
            return;
        }
        JSArray values = call.getArray("values");
        if(values == null) {
            call.reject("Must provide an Array of values");
            return;
        }
        int res;
        if(values.length() > 0) {
            ArrayList vals = new ArrayList<>();
            for (int i = 0; i < values.length(); i++) {
               vals.add(values.get(i));
             }
            res = mDb.runSQL(statement,vals);
        } else {
            res = mDb.runSQL(statement,null);
        }
        JSObject ret = new JSObject();
        ret.put("result",res);
        call.resolve(ret);
    }
    @PluginMethod()
    public void query(PluginCall call) throws JSONException {
        String statement = call.getString("statement");
        if (statement == null) {
            call.reject("Must provide a query statement");
            return;
        }
        JSArray values = call.getArray("values");
        if(values == null) {
            call.reject("Must provide an Array of values");
            return;
        }
        JSArray res;
        if(values.length() > 0) {
            ArrayList vals = new ArrayList<String>();
            for (int i = 0; i < values.length(); i++) {
                vals.add(values.getString(i));
            }
            res = mDb.querySQL(statement, vals);
        } else {
            res = mDb.querySQL(statement,new ArrayList<String>());
        }
        JSObject ret = new JSObject();
        ret.put("result",res);
        call.resolve(ret);
    }
    @PluginMethod()
    public void deleteDatabase(PluginCall call) {
        String name = call.getString("name");
        if (name == null) {
            call.reject("Must provide a database name");
            return;
        }
        mDb.deleteDB(name);
        call.resolve();
    }

}
