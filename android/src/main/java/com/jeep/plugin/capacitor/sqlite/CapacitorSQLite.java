package com.jeep.plugin.capacitor.sqlite;

import com.getcapacitor.JSObject;
import com.getcapacitor.NativePlugin;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;

@NativePlugin()
public class CapacitorSQLite extends Plugin {

    @PluginMethod()
    public void echo(PluginCall call) {
        String value = call.getString("value");

        JSObject ret = new JSObject();
        ret.put("value", value);
        call.success(ret);
    }
    public void open(PluginCall call) {
        String name = call.getString("name");
        if (name == null) {
            call.reject("Must provide a database name");
            return;
        }
        call.reject("Not yet implemented");
    }
    public void execute(PluginCall call) {
        String statements = call.getString("statements");
        if (statements == null) {
            call.reject("Must provide raw SQL statements");
            return;
        }
        call.reject("Not yet implemented");
    }
    public void run(PluginCall call) {
        String statement = call.getString("statement");
        if (statement == null) {
            call.reject("Must provide a SQL statement");
            return;
        }
        call.reject("Not yet implemented");
    }
    public void query(PluginCall call) {
        String statement = call.getString("statement");
        if (statement == null) {
            call.reject("Must provide a query statement");
            return;
        }
        call.reject("Not yet implemented");
    }
    public void deleteDatabase(PluginCall call) {
        String name = call.getString("name");
        if (name == null) {
            call.reject("Must provide a database name");
            return;
        }
        call.reject("Not yet implemented");
    }

}
