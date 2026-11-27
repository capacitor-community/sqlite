package com.getcapacitor.community.database.sqlite.SQLite.ImportExportJson;

import static org.junit.Assert.assertEquals;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.junit.Test;

public class ExportToJsonTest {

    private final ExportToJson exportToJson = new ExportToJson();

    @Test
    public void getSchema_keepsCommasInsideNestedParentheses() throws Exception {
        String sql = String.join(
            "\n",
            "CREATE TABLE budgets (",
            "  id INTEGER PRIMARY KEY AUTOINCREMENT,",
            "  isRecurring BOOLEAN NOT NULL DEFAULT 0,",
            "  recurrenceIntervalType TEXT NULL,",
            "  CHECK (isRecurring IN (0, 1)),",
            "  CHECK ( (isRecurring = 1 AND recurrenceIntervalType IS NOT NULL) OR (isRecurring = 0 AND recurrenceIntervalType IS NULL) ),",
            "  CHECK (recurrenceIntervalType IN ('days', 'weeks', 'months', 'years') OR recurrenceIntervalType IS NULL),",
            "  CHECK (endDate IS NULL OR date(endDate) >= date(startDate))",
            ")"
        );

        List<String> expected = Arrays.asList(
            "id: INTEGER PRIMARY KEY AUTOINCREMENT",
            "isRecurring: BOOLEAN NOT NULL DEFAULT 0",
            "recurrenceIntervalType: TEXT NULL",
            "CHECK: (isRecurring IN (0, 1))",
            "CHECK: ( (isRecurring = 1 AND recurrenceIntervalType IS NOT NULL) OR (isRecurring = 0 AND recurrenceIntervalType IS NULL) )",
            "CHECK: (recurrenceIntervalType IN ('days', 'weeks', 'months', 'years') OR recurrenceIntervalType IS NULL)",
            "CHECK: (endDate IS NULL OR date(endDate) >= date(startDate))"
        );

        assertEquals(expected, describe(exportToJson.getSchema(sql)));
    }

    /** Formats each schema entry as "name: value". The name is the column, the constraint or the foreign key. */
    private static List<String> describe(List<JsonColumn> schema) {
        List<String> entries = new ArrayList<>();
        for (JsonColumn entry : schema) {
            String name = entry.getColumn();
            if (name == null) name = entry.getConstraint();
            if (name == null) name = entry.getForeignkey();
            entries.add(name + ": " + entry.getValue());
        }
        return entries;
    }
}
