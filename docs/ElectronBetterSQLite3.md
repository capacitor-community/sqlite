<p align="center"><br><img src="https://user-images.githubusercontent.com/236501/85893648-1c92e880-b7a8-11ea-926d-95355b8175c7.png" width="128" height="128" /></p>
<h2 align="center">Electron Better-SQLite3 DOCUMENTATION</h2>
<p align="center"><strong><code>@capacitor-community/sqlite</code></strong></p>
<p align="center">
  Capacitor community plugin for Electron is now (5.0.4) using better-sqlite3 instead of sqlite3 and/or @journeyapps/sqlcipher for SQLite Databases.</p>

## Note to Developers

The move to `better-sqlite3-multiple-ciphers` has been decided to avoid using `@journeyapps/sqlcipher` which is not a maintained package and was causing issues with Mac M1 & M2 machines.

It will give you the ability to encrypt or not your databases.
To encrypt databases you must set the `electronIsEncryption`parameter to `true` in the `capacitor.config.ts` file.

The encryption passphrase is now stored in using the `electron-json-storage` package at the default path on the `userData.json` file as a json object `{"passphrase":YOUR_PASSPHRASE}`.

This has lead to a complete review of the code.
So be patient and report the issues you may have to help stabilizing the code.

## Better-Sqlite3

`better-sqlite3`and `better-sqlite3-multiple-ciphers` follow the SQL-92 standard which is not the case of sqlite3 which was more flexible.
What that means is double quotes `""` are used for an identifier and not a string value. You must use single quote `''` for string value in sql statement.
If you don't do it 
```
INSERT INTO myTable (name,age) VALUES ("James Brown", 30);
```
you will get an error like "no such column James Brown"  or "no such table James Brown". SQLite will interpret "James Brown" as an identifier rather than a string value.
so correct statements are
```
INSERT INTO myTable (name,age) VALUES ('James Brown', 30);
INSERT INTO myTable ("the_name",age) VALUES ('James Brown', 30);
INSERT INTO myTable (name,age) VALUES (?,?);
```
for the last one the values can be:
```
const values = ['James Brown', 30];
const values = ["James Brown", 30];
```
This is valid for any type of statement (INSERT, UPDATE, SELECT, DELETE, ...)

For new application development, please comply to the SQL-92 standard.

To be compatible for old applications, a converter from double quotes to single quote has been put in place. But as converter it is certainly not covering all the cases and it may be time consuming. 

