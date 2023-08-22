package com.getcapacitor.community.database.sqlite.SQLite;

import static com.getcapacitor.community.database.sqlite.SQLite.UtilsSQLStatement.addPrefixToWhereClause;
import static com.getcapacitor.community.database.sqlite.SQLite.UtilsSQLStatement.extractForeignKeyInfo;
import static com.getcapacitor.community.database.sqlite.SQLite.UtilsSQLStatement.flattenMultilineString;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.json.JSONException;
import org.json.JSONObject;

public class UtilsDelete {

    private final UtilsSQLStatement _statUtil = new UtilsSQLStatement();

    public static class ReferenceResult {

        String tableWithRefs;
        List<String> retRefs;
    }

    public static class ForeignKeyInfo {

        String tableName;
        List<String> forKeys;
        List<String> refKeys;
        String action;

        public ForeignKeyInfo() {
            this.tableName = "";
            this.forKeys = new ArrayList<>();
            this.refKeys = new ArrayList<>();
            this.action = "NO ACTION";
        }

        public ForeignKeyInfo(List<String> forKeys, String tableName, List<String> refKeys, String action) {
            this.tableName = tableName;
            this.forKeys = forKeys;
            this.refKeys = refKeys;
            this.action = action;
        }

        public String getTableName() {
            return tableName;
        }

        public String getAction() {
            return action;
        }

        public List<String> getForKeys() {
            return forKeys;
        }

        public List<String> getRefKeys() {
            return refKeys;
        }
    }

    public static class UpdateResults {

        private String setStmt;
        private String updWhereStmt;

        public UpdateResults() {
            this.setStmt = "";
            this.updWhereStmt = "";
        }

        public UpdateResults(String setStmt, String updWhereStmt) {
            this.setStmt = setStmt;
            this.updWhereStmt = updWhereStmt;
        }

        public String getSetStmt() {
            return setStmt;
        }

        public String getUpdWhereStmt() {
            return updWhereStmt;
        }
    }

    public static boolean findReferencesAndUpdate(
        Database mDB,
        String tableName,
        String whereStmt,
        String[] initColNames,
        ArrayList<Object> values
    ) throws Exception {
        try {
            boolean retBool = true;
            ReferenceResult result = getReferences(mDB, tableName);
            List<String> references = result.retRefs;
            String tableNameWithRefs = result.tableWithRefs;

            if (references.size() <= 0) {
                return retBool;
            }

            if (tableName.equals(tableNameWithRefs)) {
                return retBool;
            }

            for (String ref : references) {
                ForeignKeyInfo foreignKeyInfo = extractForeignKeyInfo(ref);

                String refTable = foreignKeyInfo.tableName;
                if (refTable.isEmpty() || !refTable.equals(tableName)) {
                    continue;
                }

                List<String> withRefsNames = foreignKeyInfo.forKeys;
                List<String> colNames = foreignKeyInfo.refKeys;

                if (colNames.size() != withRefsNames.size()) {
                    throw new Error("findReferencesAndUpdate: mismatch length");
                }

                String action = foreignKeyInfo.action;
                if (action.equals("NO_ACTION")) {
                    continue;
                }

                String updTableName = tableNameWithRefs;
                List<String> updColNames = withRefsNames;

                UpdateResults results = new UpdateResults();

                if (!checkValuesMatch(withRefsNames.toArray(new String[0]), initColNames)) {
                    Map<String, Object> relatedItemsResult = searchForRelatedItems(
                        mDB,
                        updTableName,
                        tableName,
                        whereStmt,
                        withRefsNames.toArray(new String[0]),
                        colNames.toArray(new String[0]),
                        values
                    );

                    if (
                        ((List<String>) relatedItemsResult.get("relatedItems")).size() == 0 &&
                        ((String) relatedItemsResult.get("key")).length() == 0
                    ) {
                        continue;
                    }

                    if (!updTableName.equals(tableName)) {
                        switch (action) {
                            case "RESTRICT":
                                results = upDateWhereForRestrict(relatedItemsResult);
                                break;
                            case "CASCADE":
                                results = upDateWhereForCascade(relatedItemsResult);
                                break;
                            default:
                                results = upDateWhereForDefault(withRefsNames, relatedItemsResult);
                                break;
                        }
                    }
                } else {
                    throw new Error("Not implemented. Please transfer your example to the maintainer");
                }

                if (!results.getSetStmt().isEmpty() && !results.getUpdWhereStmt().isEmpty()) {
                    executeUpdateForDelete(mDB, updTableName, results.getUpdWhereStmt(), results.getSetStmt(), updColNames, values);
                }
            }
            return retBool;
        } catch (Exception error) {
            String msg = error.getMessage() != null ? error.getMessage() : error.toString();
            throw new Exception(msg);
        }
    }

    public static ReferenceResult getReferences(Database mDB, String tableName) throws Exception {
        String sqlStmt =
            "SELECT sql FROM sqlite_master " +
            "WHERE sql LIKE('%FOREIGN KEY%') AND sql LIKE('%REFERENCES%') AND " +
            "sql LIKE('%" +
            tableName +
            "%') AND sql LIKE('%ON DELETE%');";

        try {
            JSArray references = mDB.selectSQL(sqlStmt, new ArrayList<>());
            ReferenceResult referenceResult = new ReferenceResult();
            List<String> retRefs = new ArrayList<>();
            String tableWithRefs = "";

            if (references.length() > 0) {
                Map<String, Object> result = getRefs(references.getJSONObject(0).getString("sql"));
                retRefs = (List<String>) result.get("foreignKeys");
                tableWithRefs = (String) result.get("tableName");
            }

            referenceResult.tableWithRefs = tableWithRefs;
            referenceResult.retRefs = retRefs;

            return referenceResult;
        } catch (Exception e) {
            String error = e.getMessage() != null ? e.getMessage() : e.toString();
            String msg = "getReferences: " + error;
            throw new Exception(msg);
        }
    }

    public static Map<String, Object> getRefs(String sqlStatement) throws Exception {
        Map<String, Object> result = new HashMap<>();
        String tableName = "";
        List<String> foreignKeys = new ArrayList<>();
        String statement = flattenMultilineString(sqlStatement);

        try {
            // Regular expression pattern to match the table name
            String tableNamePattern = "CREATE\\s+TABLE\\s+(\\w+)\\s+\\(";
            Pattern tableNameRegex = Pattern.compile(tableNamePattern);
            Matcher tableNameMatcher = tableNameRegex.matcher(statement);
            if (tableNameMatcher.find()) {
                tableName = tableNameMatcher.group(1);
            }

            // Regular expression pattern to match the FOREIGN KEY constraints
            String foreignKeyPattern =
                "FOREIGN\\s+KEY\\s+\\([^)]+\\)\\s+REFERENCES\\s+(\\w+)\\s*\\([^)]+\\)\\s+ON\\s+DELETE\\s+(CASCADE|RESTRICT|SET\\s+DEFAULT|SET\\s+NULL|NO\\s+ACTION)";
            Pattern foreignKeyRegex = Pattern.compile(foreignKeyPattern);
            Matcher foreignKeyMatcher = foreignKeyRegex.matcher(statement);
            while (foreignKeyMatcher.find()) {
                String foreignKey = foreignKeyMatcher.group(0);
                foreignKeys.add(foreignKey);
            }
        } catch (Exception e) {
            String msg = "getRefs: Error creating regular expression: " + e.toString();
            throw new Exception(msg);
        }

        result.put("tableName", tableName);
        result.put("foreignKeys", foreignKeys);
        return result;
    }

    public static boolean checkValuesMatch(String[] array1, String[] array2) {
        for (String value : array1) {
            boolean found = false;
            for (String item : array2) {
                if (value.equals(item)) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                return false;
            }
        }
        return true;
    }

    public static Map<String, Object> searchForRelatedItems(
        Database mDB,
        String updTableName,
        String tableName,
        String whStmt,
        String[] withRefsNames,
        String[] colNames,
        ArrayList<Object> values
    ) throws Exception {
        List<Object> relatedItems = new ArrayList<>();
        String key = "";
        String[] t1Names = new String[withRefsNames.length];
        String[] t2Names = new String[colNames.length];

        for (int i = 0; i < withRefsNames.length; i++) {
            t1Names[i] = "t1." + withRefsNames[i];
            t2Names[i] = "t2." + colNames[i];
        }

        try {
            // addPrefix to the whereClause and swap colNames with  withRefsNames
            String whereClause = addPrefixToWhereClause(whStmt, colNames, withRefsNames, "t2.");
            // look at the whereclause and change colNames with  withRefsNames
            if (whereClause.endsWith(";")) {
                whereClause = whereClause.substring(0, whereClause.length() - 1);
            }

            StringBuilder resultString = new StringBuilder();
            for (int index = 0; index < t1Names.length; index++) {
                resultString.append(t1Names[index]).append(" = ").append(t2Names[index]);
                if (index < t1Names.length - 1) {
                    resultString.append(" AND ");
                }
            }

            String sql =
                "SELECT t1.rowid FROM " +
                updTableName +
                " t1 " +
                "JOIN " +
                tableName +
                " t2 ON " +
                resultString.toString() +
                " " +
                "WHERE " +
                whereClause +
                " AND t1.sql_deleted = 0;";

            JSArray jsVals = mDB.selectSQL(sql, values);
            if (jsVals.length() > 0) {
                List<Map<String, Object>> mVals = JSArrayToJavaListMap(jsVals);
                key = mVals.get(0).keySet().iterator().next();
                relatedItems.addAll(mVals);
            }
            Map<String, Object> result = new HashMap<>();
            result.put("key", key);
            result.put("relatedItems", relatedItems);
            return result;
        } catch (Exception error) {
            String msg = error.getMessage() != null ? error.getMessage() : error.toString();
            throw new Exception(msg);
        }
    }

    public static List<Map<String, Object>> JSArrayToJavaListMap(JSArray jsArray) throws JSONException {
        List<Map<String, Object>> listMap = new ArrayList<>();

        for (int i = 0; i < jsArray.length(); i++) {
            JSObject jsObject = (JSObject) jsArray.get(i); // Assuming each element is an object
            Map<String, Object> map = new HashMap<>();

            // Extract key-value pairs from the JSObject and put them into the Map
            for (Iterator<String> it = jsObject.keys(); it.hasNext();) {
                String key = it.next();
                map.put(key, jsObject.get(key)); // Convert JSValue to Java object
            }

            listMap.add(map); // Add the map to the list
        }

        return listMap; // Return the List<Map<String, Object>>
    }

    public static UpdateResults upDateWhereForRestrict(Map<String, Object> results) throws Exception {
        try {
            if (((List<?>) results.get("relatedItems")).size() > 0) {
                String msg = "Restrict mode related items exist, please delete them first";
                throw new Exception(msg);
            }
            return new UpdateResults();
        } catch (Exception error) {
            String msg = error.getMessage() != null ? error.getMessage() : "";
            throw new Exception(msg);
        }
    }

    public static UpdateResults upDateWhereForCascade(Map<String, Object> results) throws Exception {
        String setStmt = "";
        String uWhereStmt = "";

        try {
            String key = (String) results.get("key");
            List<Object> cols = new ArrayList<>();
            List<Map<String, Object>> relatedItems = (List<Map<String, Object>>) results.get("relatedItems");

            for (Map<String, Object> relItem : relatedItems) {
                Object mVal = relItem.get(key);
                if (mVal != null) {
                    cols.add(mVal);
                }
            }

            setStmt += "sql_deleted = 1";

            // Create the where statement
            StringBuilder uWhereStmtBuilder = new StringBuilder("WHERE " + key + " IN (");
            for (Object col : cols) {
                uWhereStmtBuilder.append(col).append(",");
            }
            if (uWhereStmtBuilder.toString().endsWith(",")) {
                uWhereStmtBuilder.deleteCharAt(uWhereStmtBuilder.length() - 1);
            }
            uWhereStmtBuilder.append(");");
            uWhereStmt = uWhereStmtBuilder.toString();
        } catch (Exception error) {
            String msg = error.getMessage() != null ? error.getMessage() : "";
            throw new Exception(msg);
        }
        return new UpdateResults(setStmt, uWhereStmt);
    }

    public static UpdateResults upDateWhereForDefault(List<String> withRefsNames, Map<String, Object> results) throws Exception {
        String setStmt = "";
        String uWhereStmt = "";

        try {
            String key = (String) results.get("key");
            List<Object> cols = new ArrayList<>();
            List<Map<String, Object>> relatedItems = (List<Map<String, Object>>) results.get("relatedItems");

            for (Map<String, Object> relItem : relatedItems) {
                Object mVal = relItem.get(key);
                if (mVal != null) {
                    cols.add(mVal);
                }
            }

            // Create the set statement
            for (String name : withRefsNames) {
                setStmt += name + " = NULL, ";
            }
            setStmt += "sql_deleted = 0";

            // Create the where statement
            StringBuilder uWhereStmtBuilder = new StringBuilder("WHERE " + key + " IN (");
            for (Object col : cols) {
                uWhereStmtBuilder.append(col).append(",");
            }
            if (uWhereStmtBuilder.toString().endsWith(",")) {
                uWhereStmtBuilder.deleteCharAt(uWhereStmtBuilder.length() - 1);
            }
            uWhereStmtBuilder.append(");");
            uWhereStmt = uWhereStmtBuilder.toString();
        } catch (Exception error) {
            String msg = error.getMessage() != null ? error.getMessage() : "";
            throw new Exception(msg);
        }

        return new UpdateResults(setStmt, uWhereStmt);
    }

    public static void executeUpdateForDelete(
        Database mDB,
        String tableName,
        String whereStmt,
        String setStmt,
        List<String> colNames,
        ArrayList<Object> values
    ) throws Exception {
        try {
            long lastId = -1;

            // Update sql_deleted for this references
            String stmt = "UPDATE " + tableName + " SET " + setStmt + " " + whereStmt;
            ArrayList<Object> selValues = getSelectedValues(values, whereStmt, colNames);

            JSObject retObj = mDB.prepareSQL(stmt, selValues, false, "no");
            lastId = retObj.getLong("lastId");
            if (lastId == -1) {
                String msg = "UPDATE sql_deleted failed for table: " + tableName;
                throw new Exception(msg);
            }
        } catch (Exception error) {
            String msg = error.getMessage() != null ? error.getMessage() : "";
            throw new Exception(msg);
        }
    }

    public static ArrayList<Object> getSelectedValues(ArrayList<Object> values, String whereStmt, List<String> colNames) {
        ArrayList<Object> selValues = new ArrayList<>(); // Initialize the selected values ArrayList

        if (values.size() > 0) {
            String[] arrVal = whereStmt.split("\\?");
            if (arrVal[arrVal.length - 1].equals(";")) {
                arrVal[arrVal.length - 1] = "";
            }

            for (int jdx = 0; jdx < arrVal.length; jdx++) {
                for (String updVal : colNames) {
                    List<Integer> indices = UtilsSQLStatement.indicesOf(arrVal[jdx], updVal, 0);
                    if (!indices.isEmpty()) {
                        selValues.add(values.get(jdx));
                    }
                }
            }
        }

        return selValues;
    }
}
