package com.getcapacitor.community.database.sqlite.SQLite;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class UtilsSQLStatement {

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

    public static String extractWhereClause(String statement) {
        Pattern pattern = Pattern.compile("WHERE(.+?)(?:ORDER\\s+BY|LIMIT|$)", Pattern.CASE_INSENSITIVE);
        Matcher match = pattern.matcher(statement);
        if (match.find() && match.groupCount() > 0) {
            String whereClause = match.group(1).trim();
            return whereClause;
        }
        return null;
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
