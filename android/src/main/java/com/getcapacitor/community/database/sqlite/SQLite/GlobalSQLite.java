package com.getcapacitor.community.database.sqlite.SQLite;

public class GlobalSQLite {

    /**
     * !!! This is now deprecated in favor of a more secure storage !!!
     *
     * @since 3.0.0-beta.13
     *
     * You must follow the following process flow
     *
     * - use setEncryptionSecret method with a passphrase
     *     - to store the passphrase in Encrypted SharedPreferences
     *     - to change the password of all encrypted database to the store passphrase
     *
     * - use changeEncryptionSecret method with a passphrase and the old passphrase
     *     - to store the new passphrase in Encrypted SharedPreferences
     *     - to change the password of all encrypted database to the store passphrase
     *
     * Do not use for the passphrase the secret / newsecret parameter values
     *
     * When you will do a next build
     *
     * - set the secret parameter value to ""
     * - remove the newsecret parameter
     *
     */

    public String secret = "sqlite secret";
    public String newsecret = "sqlite new secret";
}
