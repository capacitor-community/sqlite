<p align="center"><br><img alt="" src="https://user-images.githubusercontent.com/236501/85893648-1c92e880-b7a8-11ea-926d-95355b8175c7.png" width="128" height="128" /></p>
<h2 align="center">SyntaxScanning for your SQLite code</h2>
<p align="center"><strong><code>@capacitor-community/sqlite</code></strong></p>
<p align="center">
  A workaround for getting Syntax & Errors for your SQLite code <strong>based on your schema definition</strong> when using an IDE similar to IntelliJ ultimate where you have a database tab where you can connect the database and then get syntax highlighting & errors shown right away.</p>

### NOTE:
This was only tested with Intellij Ultimate syntax highlighting that comes when connecting your database schema to the IDE. It might also work with similar syntax tools like the latter.

## Instructions:

In for example H2-database, with a normal database file you can always connect it to the IDE and get syntax highlighting.
This capacitor-community/sqlite plugin however doesn't use a "normal database file" however. 

Instead it uses either the IOS/Android emulator or real phone db-file, or if you are using the web version of this plugin then it is using the sql-wasm.wasm file. 
All of those database files cannot be read from an IDE like IntelliJ and thus it might give you a lot of errors when looking at your SQLite code snippets in typescript saying things like "table not found" etc.

### The solution:

You can still create an SQLite data source in e.g. IntelliJ to help it recognize the schema and provide better code assistance when working with SQL files and code blocks in your project. However, the process is slightly different:

Go to View > Tool Windows > Database to open the Database tool window.
Click the + button and select Data Source > SQLite.
Instead of selecting the schema.sql file in the "File" field, create an empty SQLite database file. You can do this by clicking the "Create" button next to the "File" field and providing a name for the new SQLite database file (e.g., my_database.sqlite). This file will be created in your project directory.
Click "OK" to save the data source.
Now, you should have an SQLite data source in your Database tool window. To create the schema in the new SQLite database file, follow these steps:

Right-click on the SQLite data source you just created in the Database tool window [THE DATABASE SIDEBAR TAB].
Select "Open SQL Console" (such an ICON: [QL]) to open a new SQL console connected to your SQLite data source.
Copy and paste the SQL schema you prepared earlier into the SQL console.
Run the SQL script by clicking the "Execute" button or pressing Ctrl+Enter (Cmd+Enter on macOS).
This will create the schema in your SQLite database file, and IntelliJ should now recognize it and provide better code assistance when working with SQL files and code blocks in your project.

Links:
(note: you have to be in the database tool window and click [QL])
https://www.jetbrains.com/help/idea/working-with-database-consoles.html#create_console

### Important note:
Whenever your schema changes, you will have to change it in the "mock database" now too. It's very easy. But just keep this in mind, cause you might wonder why you get red syntax-errors in your query-code again.

If you have any issues or questions then ask folsze (the author of this documentation page) or maybe first ask GPT-4 since this is who even told @folsze how to use this feature in the first place.
It would be interesting to know whether this also works with other IDEs and if the setup process requires different things for those.