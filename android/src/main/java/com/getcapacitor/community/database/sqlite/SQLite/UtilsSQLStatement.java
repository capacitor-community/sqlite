package com.getcapacitor.community.database.sqlite.SQLite;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class UtilsSQLStatement {

    public static class ParsedCtes {

        public List<Cte> ctes = new ArrayList<>();
        public int endIndex;
    }

    public static class Cte {

        public String name;
        public String columnList;
        public String body;
    }

    public static String flattenMultilineString(String input) {
        String[] lines = input.split("\\r?\\n");
        return String.join(" ", lines);
    }

    public static String extractTableName(String statement) {
        Pattern pattern = Pattern.compile("(?:INSERT\\s+INTO|UPDATE|DELETE\\s+FROM)\\s+([^\\s]+)", Pattern.CASE_INSENSITIVE);
        Matcher match = pattern.matcher(statement);
        if (match.find() && match.groupCount() > 0) {
            String tableName = match.group(1);
            return tableName;
        }
        return null;
    }

    /**
     * Extract the rightmost occurrence of the where clause
     * Accounts for ORDER BY / LIMIT when sqlite is compiled with SQLITE_ENABLE_UPDATE_DELETE_LIMIT
     * Assumes the RETURNING clause has already been removed
     * @param statement Input sql statement
     * @return where expression string
     */
    public static String extractWhereClause(String sql) {
        String upper = sql.toUpperCase();

        int whereIndex = upper.lastIndexOf("WHERE");
        if (whereIndex == -1) return null;

        // Part of the statement after "WHERE"
        int start = whereIndex + "WHERE".length();

        // If SQLite is built with the SQLITE_ENABLE_UPDATE_DELETE_LIMIT compile-time option
        // then the syntax of the UPDATE statement is extended with optional ORDER BY and LIMIT clauses
        int orderByIndex = upper.indexOf("ORDER BY", start);
        int limitIndex = upper.indexOf("LIMIT", start);

        // Pick the earliest of the two, ignoring -1
        int end = -1;
        if (orderByIndex != -1 && limitIndex != -1) {
            end = Math.min(orderByIndex, limitIndex);
        } else if (orderByIndex != -1) {
            end = orderByIndex;
        } else if (limitIndex != -1) {
            end = limitIndex;
        }

        // WHERE is the part between WHERE and end of statement or LIMIT/ORDER BY
        return (end == -1) ? sql.substring(start).trim() : sql.substring(start, end).trim();
    }

    public static ParsedCtes parseCtes(String sql) {
        ParsedCtes result = new ParsedCtes();

        int i = 0;
        int len = sql.length();

        // must begin with WITH (case-insensitive)
        String trimmed = sql.trim();
        if (!trimmed.toUpperCase().startsWith("WITH")) {
            result.endIndex = 0;
            return result;
        }

        // start after WITH
        i = trimmed.indexOf("WITH") + 4;

        while (i < len) {
            Cte cte = new Cte();

            // skip whitespace
            while (i < len && Character.isWhitespace(trimmed.charAt(i))) i++;

            // parse CTE name
            int start = i;
            while (i < len && (Character.isLetterOrDigit(trimmed.charAt(i)) || trimmed.charAt(i) == '_')) i++;
            cte.name = trimmed.substring(start, i);

            // skip whitespace
            while (i < len && Character.isWhitespace(trimmed.charAt(i))) i++;

            // optional column list
            if (i < len && trimmed.charAt(i) == '(') {
                int colStart = i;
                i = skipBalanced(trimmed, i);
                cte.columnList = trimmed.substring(colStart, i);
            }

            // skip whitespace
            while (i < len && Character.isWhitespace(trimmed.charAt(i))) i++;

            // must be AS
            if (trimmed.regionMatches(true, i, "AS", 0, 2)) {
                i += 2;
            }

            // skip whitespace
            while (i < len && Character.isWhitespace(trimmed.charAt(i))) i++;

            // parse AS (...) body
            if (i < len && trimmed.charAt(i) == '(') {
                int bodyStart = i;
                i = skipBalanced(trimmed, i);
                cte.body = trimmed.substring(bodyStart, i);
            }

            result.ctes.add(cte);

            // skip whitespace
            while (i < len && Character.isWhitespace(trimmed.charAt(i))) i++;

            // if comma → more CTEs
            if (i < len && trimmed.charAt(i) == ',') {
                i++;
                continue;
            }

            break;
        }

        result.endIndex = i;
        return result;
    }

    private static int skipBalanced(String sql, int i) {
        int depth = 0;
        int len = sql.length();

        do {
            char c = sql.charAt(i);
            if (c == '(') depth++;
            else if (c == ')') depth--;
            i++;
        } while (i < len && depth > 0);

        return i;
    }

    public static String extractStatementType(String sql) {
        if (sql == null) return null;
        String trimmed = sql.trim();

        String first = trimmed.split("\\s+")[0].toUpperCase();
        if (!first.equals("WITH")) {
            return first;
        }

        ParsedCtes parsed = parseCtes(trimmed);

        // Use endIndex to get the first word after all CTEs
        if (parsed.endIndex >= trimmed.length()) return null;

        String rest = trimmed.substring(parsed.endIndex).trim();
        if (rest.isEmpty()) return null;

        return rest.split("\\s+")[0].toUpperCase();
    }

    public static String addPrefixToWhereClause(String whereClause, String[] colNames, String[] refNames, String prefix) {
        String[] columnValuePairs = null;
        String[] logicalOperators = new String[] { "AND", "OR", "NOT" };

        for (String logicalOperator : logicalOperators) {
            if (whereClause.contains(logicalOperator)) {
                columnValuePairs = whereClause.split("\\s*" + logicalOperator + "\\s*");
                break;
            }
        }

        if (columnValuePairs == null) {
            columnValuePairs = new String[] { whereClause };
        }

        List<String> modifiedPairs = new ArrayList<>();

        for (String pair : columnValuePairs) {
            String trimmedPair = pair.trim();

            int operatorIndex = -1;
            String operator = null;
            for (String op : new String[] { "=", "<>", "<", "<=", ">", ">=", "IN", "BETWEEN", "LIKE" }) {
                operatorIndex = trimmedPair.indexOf(op);
                if (operatorIndex != -1) {
                    operator = op;
                    break;
                }
            }

            if (operator == null) {
                modifiedPairs.add(trimmedPair);
                continue;
            }

            String column = trimmedPair.substring(0, operatorIndex).trim();
            String value = trimmedPair.substring(operatorIndex + operator.length()).trim();

            String newColumn = column;
            int index = findIndexOfStringInArray(column, refNames);
            if (index != -1) {
                newColumn = getStringAtIndex(colNames, index);
            }

            String modifiedColumn = prefix + newColumn;
            String modifiedPair = modifiedColumn + " " + operator + " " + value;
            modifiedPairs.add(modifiedPair);
        }

        String logicalOperatorUsed = logicalOperators[0];
        for (String logicalOperator : logicalOperators) {
            if (whereClause.contains(logicalOperator)) {
                logicalOperatorUsed = logicalOperator;
                break;
            }
        }
        String modWhereClause = String.join(" " + logicalOperatorUsed + " ", modifiedPairs);
        return modWhereClause;
    }

    public static int findIndexOfStringInArray(String target, String[] array) {
        for (int i = 0; i < array.length; i++) {
            if (array[i].equals(target)) {
                return i;
            }
        }
        return -1;
    }

    public static String getStringAtIndex(String[] array, int index) {
        if (index >= 0 && index < array.length) {
            return array[index];
        } else {
            return null;
        }
    }

    public static UtilsDelete.ForeignKeyInfo extractForeignKeyInfo(String sqlStatement) throws Exception {
        // Define the regular expression pattern for extracting the FOREIGN KEY clause
        String foreignKeyPattern =
            "\\bFOREIGN\\s+KEY\\s*\\(([^)]+)\\)\\s+REFERENCES\\s+(\\w+)\\s*\\(([^)]+)\\)\\s+(ON\\s+DELETE\\s+(RESTRICT|CASCADE|SET\\s+NULL|SET\\s+DEFAULT|NO\\s+ACTION))?";
        Pattern pattern = Pattern.compile(foreignKeyPattern);
        Matcher matcher = pattern.matcher(sqlStatement);

        if (matcher.find()) {
            String[] forKeys = matcher.group(1).split(",");
            String tableName = matcher.group(2);
            String[] refKeys = matcher.group(3).split(",");
            String action = matcher.group(5) != null ? matcher.group(5) : "NO ACTION";
            List<String> lForKeys = new ArrayList<>(Arrays.asList(forKeys));
            List<String> lRefKeys = new ArrayList<>(Arrays.asList(refKeys));
            return new UtilsDelete.ForeignKeyInfo(lForKeys, tableName, lRefKeys, action);
        } else {
            throw new Exception("extractForeignKeyInfo: No FOREIGN KEY found");
        }
    }

    public static List<String> extractColumnNames(String whereClause) {
        Set<String> keywords = new HashSet<>(Arrays.asList("AND", "OR", "IN", "VALUES", "LIKE", "BETWEEN", "NOT"));

        Pattern pattern = Pattern.compile(
            "\\b[a-zA-Z]\\w*\\b(?=\\s*(?:<=?|>=?|<>?|=|AND|OR|BETWEEN|NOT|IN|LIKE))|" +
            "\\b[a-zA-Z]\\w*\\b\\s+BETWEEN\\s+'[^']+'\\s+AND\\s+'[^']+'|" +
            "\\(([^)]+)\\)\\s+IN\\s+\\(\\s*VALUES\\s*\\("
        );
        Matcher matcher = pattern.matcher(whereClause);
        List<String> columns = new ArrayList<>();

        while (matcher.find()) {
            String columnList = matcher.group(1);
            if (columnList != null) {
                String[] columnNamesArray = columnList.split(",");
                for (String columnName : columnNamesArray) {
                    columns.add(columnName.trim());
                }
            } else {
                String matchedText = matcher.group();
                if (!keywords.contains(matchedText.trim().toUpperCase())) {
                    columns.add(matchedText.trim());
                }
            }
        }

        return columns;
    }

    public static List<Integer> indicesOf(String str, String searchStr, int fromIndex) {
        List<Integer> indices = new ArrayList<>();

        int currentIndex = str.indexOf(searchStr, fromIndex);
        while (currentIndex != -1) {
            indices.add(currentIndex);
            currentIndex = str.indexOf(searchStr, currentIndex + 1);
        }

        return indices;
    }
}
