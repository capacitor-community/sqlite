package com.getcapacitor.community.database.sqlite.SQLite;

import android.util.Log;
import com.getcapacitor.JSObject;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Dictionary;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONObject;

public class UtilsUpgrade {

    private static final String TAG = UtilsUpgrade.class.getName();

    /**
     * OnUpgrade Method
     * Database version upgrade flow process
     *
     * @param db
     * @param upgDict
     * @param curVersion
     * @param targetVersion
     * @throws Exception
     */
    public void onUpgrade(Database db, Dictionary<Integer, JSONObject> upgDict, Integer curVersion, Integer targetVersion)
        throws Exception {
        Log.i(TAG, "UtilsUpgrade.onUpgrade: from " + curVersion + " to " + targetVersion);

        List<Integer> sortedKeys = Collections.list(upgDict.keys());
        Collections.sort(sortedKeys);

        for (Integer versionKey : sortedKeys) {
            if (versionKey > curVersion && versionKey <= targetVersion) {
                Log.i(TAG, "- UtilsUpgrade.onUpgrade toVersion: " + versionKey);
                JSONObject upgrade = upgDict.get(versionKey);

                JSONArray statementsJson = upgrade.has("statements") ? upgrade.getJSONArray("statements") : new JSONArray();

                List<String> statements = new ArrayList<String>();

                for (int i = 0; i < statementsJson.length(); i++) {
                    statements.add(statementsJson.getString(i));
                }

                if (statements.size() == 0) {
                    String msg = "Error: onUpgrade statement not given";
                    throw new Exception(msg);
                }

                try {
                    executeStatementsProcess(db, statements.toArray(new String[0]));

                    db.getDb().setVersion(versionKey);
                } catch (Exception e) {
                    String msg = "Error: onUpgrade executeStatementProcess";
                    msg += " failed " + e;
                    throw new Exception(msg);
                }
            }
        }
    }

    /**
     * ExecuteStatementsProcess Method
     * Execute Statement Flow Process
     *
     * @param db
     * @param statements
     * @throws Exception
     */
    private void executeStatementsProcess(Database db, String[] statements) throws Exception {
        db.getDb().beginTransaction();
        try {
            db.execute(statements);

            db.getDb().setTransactionSuccessful();
        } catch (Exception e) {
            throw new Exception("Error: executeStatementsProcess " + " failed " + e);
        } finally {
            db.getDb().endTransaction();
        }
    }
}
