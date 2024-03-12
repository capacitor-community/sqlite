<p align="center"><br><img src="https://user-images.githubusercontent.com/236501/85893648-1c92e880-b7a8-11ea-926d-95355b8175c7.png" width="128" height="128" /></p>
<h2 align="center">SQLite Transaction DOCUMENTATION</h2>
<p align="center"><strong><code>@capacitor-community/sqlite</code></strong></p>
<p align="center">
  Capacitor community plugin for Native and Electron SQLite Databases. For <strong>Native</strong> and <strong>Electron</strong> platforms, databases could be encrypted with SQLCipher</p>


## SQLite Transaction

### By Default

  The three SQLite methods <strong>(execute, executeSet, and run)</strong> in the `@capacitor-community/sqlite` plugin are inherently transactional.
  On the Web platform, the in-memory database is saved in the store after the execution of each method if you enable the autosave property of the jeep-sqlite web component.

  This approach is suitable and secure when the methods are executed from a UI component. However, it can be notably slow when dealing with a batch of commands.

  Code example: 

  ```ts
  const testTransactionDefault = async (db: SQLiteDBConnection) => {
    setLog(prevLog => prevLog + '### Start Transaction Default ###\n');

    if (db !== null) {
      // Delete all data if any
      await db.execute('DELETE FROM DemoTable');

      // run command
      let insertQuery = 'INSERT INTO DemoTable (name, score) VALUES (?, ?);';
      let bindValues = ["Sue", 102];
      let ret = await db.run(insertQuery, bindValues);
      console.log(`>>> run ret 1: ${JSON.stringify(ret)}`)
      // execute command
      const statements = `
        INSERT INTO DemoTable (name, score) VALUES ('Andrew',415);
        INSERT INTO DemoTable (name, score) VALUES ('Josh',310);
        INSERT INTO DemoTable (name, score) VALUES ('Billy',253);
      `;
      ret = await db.execute(statements);
      console.log(`>>> execute ret 1: ${JSON.stringify(ret)}`)

      // executeSet command
      ret = await db.executeSet(setScores);
      console.log(`>>> executeSet 1 ret: ${JSON.stringify(ret)}`)

      let selectQuery = "SELECT * /* all columns */ FROM Demotable;";
      const retQuery = await db.query(selectQuery);
      console.log(`>>> query All retQuery: ${JSON.stringify(retQuery)}`)

    }     
    setLog(prevLog => prevLog + '### End Test Transaction Default ###\n');

  }
  ```

### For Batch of Commands

  Since the release of version 5.0.7 of the @capacitor-community/sqlite plugin, several new methods have been introduced to aid developers in efficiently managing the transactional flow process:

  - beginTransaction
  - commitTransaction
  - rollbackTransaction
  - isTransactionActive

  Now the transactional process flow will resemble the following:

  ```ts
  const testTransactionManage = async (db: SQLiteDBConnection) => {
    setLog(prevLog => prevLog + '### Start Transaction Manage ###\n');
    if (db !== null) {
      await db.beginTransaction();
      const isTransAct = await db.isTransactionActive();
      if(!isTransAct) {
        throw new Error('db Transaction not Active');
      }
      try {
        // run command
        let insertQuery = 'INSERT INTO DemoTable (name, score) VALUES (?, ?);';
        let bindValues = ["Betty", 152];
        let ret = await db.run(insertQuery, bindValues, false);
        console.log(`>>> run ret 2: ${JSON.stringify(ret)}`)
        // execute command
        const statements = `
          INSERT INTO DemoTable (name, score) VALUES ('Aimie',115);
          INSERT INTO DemoTable (name, score) VALUES ('Test1',330);
          INSERT INTO DemoTable (name, score) VALUES ('George',223);
        `;
        ret = await db.execute(statements,false);
        console.log(`>>> execute ret 2: ${JSON.stringify(ret)}`)

        // executeSet command
        ret = await db.executeSet(setScores1,false);
        console.log(`>>> executeSet 2 ret: ${JSON.stringify(ret)}`)


        // Commit Transaction
        await db.commitTransaction()
        if (platform === 'web') {
          await sqliteServ.saveToStore(dbName);
        }
        setLog(prevLog => prevLog + '### Commit Test Transaction Manage ###\n');
      } catch (err) {
        console.log(`in catch : ${err}`)
        // Rollback Transaction
        await db.rollbackTransaction()
        setLog(prevLog => prevLog + '### RollBack Test Transaction Manage ###\n');

      } finally {
        let selectQuery = "SELECT * /* all columns */ FROM Demotable;";
        const retQuery = await db.query(selectQuery);
        console.log(`>>> query All retQuery2: ${JSON.stringify(retQuery)}`)
        setLog(prevLog => prevLog + '### End Test Transaction Manage ###\n');
      }
    }
  }
  ```

### Using executeTransaction method

 This method has been updated to utilize the new techniques outlined in the `For Batch of Commands` chapter. It accepts a collection of tasks of type `capTask` as its input parameter.

  ```ts
  const testExecuteTransaction = async (db: SQLiteDBConnection) => {
    setLog(prevLog => prevLog + '### Start Execute Transaction ###\n');
    if (db !== null) {
      const txn: any[] = [];
      // Create the task set
      txn.push({statement:'DELETE FROM DemoTable;'});
      const stmt = 'INSERT INTO DemoTable (name, score) VALUES (?, ?);';
      for (let i=0; i<100; i++ ) {
        const values = [`test${i}`, getRandomNumber(1, 1000)];
        txn.push({statement: stmt, values: values});
      }
      txn.push({statement: "DELETE FROM DemoTable WHERE name='test50';"});
      txn.push({statement:"UPDATE DemoTable SET score = ? WHERE name = ?",
      values:[152,"test10"]});
      try {
        // execute the transaction for that task set
        const ret = await db.executeTransaction(txn);
        console.log(`testExecuteTransaction ret: ${JSON.stringify(ret)}`);
        setLog(prevLog => prevLog + '### Test ExecuteTransaction successfull###\n');

      } catch(err:any) {
        const msg = err.message ? err.message : err;
        console.log(`testExecuteTransaction msg: ${msg}`)
        setLog(prevLog => prevLog + `### Test ExecuteTransaction failed : ${msg} ###\n`);

      } finally {
        let selectQuery = "SELECT * /* all columns */ FROM Demotable;";
        const retQuery = await db.query(selectQuery);
        console.log(`>>> query All retQuery3: ${JSON.stringify(retQuery)}`)
        setLog(prevLog => prevLog + '### End Test ExecuteTransaction ###\n');
      }

    }   
  }
  ```


