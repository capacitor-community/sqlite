package com.getcapacitor.community.database.sqlite;

import android.util.Log;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PluginCall;

public class RetHandler {

    private static final String TAG = RetHandler.class.getName();

    /**
     * RetResult Method
     * Create and return the capSQLiteResult object
     * @param call
     * @param res
     * @param message
     */
    public void retResult(PluginCall call, Boolean res, String message) {
        JSObject ret = new JSObject();
        if (message != null) {
            ret.put("message", message);
            Log.v(TAG, "*** ERROR " + message);
            call.reject(message);
            return;
        }
        if (res != null) {
            ret.put("result", res);
            call.resolve(ret);
            return;
        } else {
            call.resolve();
        }
    }

    /**
     * RetVersion Method
     * Create and return the capVersionResult object
     * @param call
     * @param res
     * @param message
     */
    public void retVersion(PluginCall call, Integer res, String message) {
        JSObject ret = new JSObject();
        if (message != null) {
            ret.put("message", message);
            Log.v(TAG, "*** ERROR " + message);
            call.reject(message);
            return;
        }
        if (res != null) {
            ret.put("version", res);
            call.resolve(ret);
            return;
        } else {
            call.resolve();
        }
    }

    /**
     * RetChanges Method
     * Create and return the capSQLiteChanges object
     * @param call
     * @param res
     * @param message
     */
    public void retChanges(PluginCall call, JSObject res, String message) {
        JSObject ret = new JSObject();
        if (message != null) {
            ret.put("message", message);
            Log.v(TAG, "*** ERROR " + message);
            call.reject(message);
            return;
        } else {
            ret.put("changes", res);
            call.resolve(ret);
            return;
        }
    }

    /**
     * RetValues Method
     * Create and return the capSQLiteValues object
     * @param call
     * @param res
     * @param message
     */
    public void retValues(PluginCall call, JSArray res, String message) {
        JSObject ret = new JSObject();
        if (message != null) {
            ret.put("message", message);
            Log.v(TAG, "*** ERROR " + message);
            call.reject(message);
            return;
        } else {
            ret.put("values", res);
            call.resolve(ret);
            return;
        }
    }

    /**
     * RetSyncDate Method
     * Create and return the capSQLiteSyncDate object
     * @param call
     * @param res
     * @param message
     */
    public void retSyncDate(PluginCall call, Long res, String message) {
        JSObject ret = new JSObject();
        if (message != null) {
            ret.put("message", message);
            Log.v(TAG, "*** ERROR " + message);
            call.reject(message);
            return;
        } else {
            ret.put("syncDate", res);
            call.resolve(ret);
            return;
        }
    }

    /**
     * RetJSObject Method
     * Create and return the capSQLiteJson object
     * @param call
     * @param res
     * @param message
     */
    public void retJSObject(PluginCall call, JSObject res, String message) {
        JSObject ret = new JSObject();
        if (message != null) {
            ret.put("message", message);
            Log.v(TAG, "*** ERROR " + message);
            call.reject(message);
            return;
        } else {
            ret.put("export", res);
            call.resolve(ret);
            return;
        }
    }

    /**
     * RetPath Method
     * Create and return the capNCDatabasePathResult object
     * @param call
     * @param res
     * @param message
     */
    public void retPath(PluginCall call, String res, String message) {
        JSObject ret = new JSObject();
        if (message != null) {
            ret.put("message", message);
            Log.v(TAG, "*** ERROR " + message);
            call.reject(message);
            return;
        }
        if (res != null) {
            ret.put("path", res);
            call.resolve(ret);
            return;
        } else {
            call.resolve();
        }
    }

    /**
     * RetUrl Method
     * Create and return the capSQLiteUrl object
     * @param call
     * @param res
     * @param message
     */
    public void retUrl(PluginCall call, String res, String message) {
        JSObject ret = new JSObject();
        if (message != null) {
            ret.put("message", message);
            Log.v(TAG, "*** ERROR " + message);
            call.reject(message);
            return;
        }
        if (res != null) {
            ret.put("url", res);
            call.resolve(ret);
            return;
        } else {
            call.resolve();
        }
    }
}
