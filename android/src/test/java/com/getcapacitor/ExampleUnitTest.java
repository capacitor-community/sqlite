package com.getcapacitor;

import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;

import com.getcapacitor.community.database.sqlite.SQLite.UtilsSQLite;
import org.junit.Test;

/**
 * Example local unit test, which will execute on the development machine (host).
 *
 * @see <a href="http://d.android.com/tools/testing">Testing documentation</a>
 */
public class ExampleUnitTest {

    private final UtilsSQLite uSqlite = new UtilsSQLite();

    @Test
    public void addition_isCorrect() throws Exception {
        assertEquals(4, 2 + 2);
    }

    @Test
    public void getStatementsArray_canHandleComments() throws Exception {
        String[] actualLines = {
            "-- RedefineTables",
            "PRAGMA foreign_keys = OFF;",
            "",
            "-- CreateTable",
            "CREATE TABLE IF NOT EXISTS key_value (key TEXT NOT NULL PRIMARY KEY, VALUE TEXT);"
        };

        String[] expected = {
            "PRAGMA foreign_keys = OFF",
            "CREATE TABLE IF NOT EXISTS key_value (key TEXT NOT NULL PRIMARY KEY, VALUE TEXT);"
        };

        assertArrayEquals(expected, uSqlite.getStatementsArray(String.join("\n", actualLines)));
    }

    @Test
    public void getStatementsArray_canHandleWhitespace() throws Exception {
        String[] actualLines = {
            "-- RedefineTables",
            "",
            "PRAGMA foreign_keys = OFF;",
            "",
            "-- CreateTable",
            "CREATE TABLE",
            "IF NOT EXISTS key_value",
            "--comment in the middle",
            "",
            "(key TEXT NOT NULL PRIMARY KEY, VALUE TEXT);",
            ""
        };

        String[] expected = {
            "PRAGMA foreign_keys = OFF",
            "CREATE TABLE IF NOT EXISTS key_value (key TEXT NOT NULL PRIMARY KEY, VALUE TEXT)"
        };

        assertArrayEquals(expected, uSqlite.getStatementsArray(String.join("\n", actualLines)));
    }
}
