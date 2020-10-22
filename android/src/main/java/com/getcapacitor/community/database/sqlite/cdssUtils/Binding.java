package com.getcapacitor.community.database.sqlite.cdssUtils;

import com.getcapacitor.JSArray;
import net.sqlcipher.database.SQLiteStatement;
import org.json.JSONException;

public class Binding {

    /**
     * Bind Values to Statement
     * @param stmt
     * @param values
     * @throws JSONException
     */
    public void bindValues(SQLiteStatement stmt, JSArray values) throws JSONException {
        for (int i = 0; i < values.length(); i++) {
            if (values.get(i) instanceof Float || values.get(i) instanceof Double) {
                stmt.bindDouble(i + 1, values.getDouble(i));
            } else if (values.get(i) instanceof Number) {
                stmt.bindLong(i + 1, values.getLong(i));
            } else if (values.isNull(i)) {
                stmt.bindNull(i + 1);
            } else {
                String str = values.getString(i);
                if (str.toUpperCase().equals("NULL")) {
                    stmt.bindNull(i + 1);
                } else {
                    stmt.bindString(i + 1, str);
                }
            }
        }
    }
}
