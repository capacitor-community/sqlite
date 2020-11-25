<p align="center"><br><img src="https://user-images.githubusercontent.com/236501/85893648-1c92e880-b7a8-11ea-926d-95355b8175c7.png" width="128" height="128" /></p>
<h2 align="center">API CONNECTION DOCUMENTATION</h2>
<p align="center"><strong><code>@capacitor-community/sqlite</code></strong></p>
<p align="center">
  SQLite Connection Wrapper</p>

## Methods Index

<docgen-index>

- [`echo(...)`](#echo)
- [`addUpgradeStatement(...)`](#addupgradestatement)
- [`createConnection(...)`](#createconnection)
- [`closeConnection(...)`](#closeconnection)
- [Interfaces](#interfaces)

</docgen-index>

## API Connection Wrapper

<docgen-api class="custom-css">
<!--Update the source file JSDoc comments and rerun docgen to update the docs below-->

SQLiteConnection Interface

### echo(...)

```typescript
echo(value: string) => Promise<capEchoResult>
```

Echo a value

| Param       | Type                |
| ----------- | ------------------- |
| **`value`** | <code>string</code> |

**Returns:** <code>Promise&lt;<a href="#capechoresult">capEchoResult</a>&gt;</code>

**Since:** 2.9.0 refactor

---

### addUpgradeStatement(...)

```typescript
addUpgradeStatement(database: string, fromVersion: number, toVersion: number, statement: string, set?: capSQLiteSet[] | undefined) => Promise<capSQLiteResult>
```

Add the upgrade Statement for database version upgrading

| Param             | Type                        |
| ----------------- | --------------------------- |
| **`database`**    | <code>string</code>         |
| **`fromVersion`** | <code>number</code>         |
| **`toVersion`**   | <code>number</code>         |
| **`statement`**   | <code>string</code>         |
| **`set`**         | <code>capSQLiteSet[]</code> |

**Returns:** <code>Promise&lt;<a href="#capsqliteresult">capSQLiteResult</a>&gt;</code>

**Since:** 2.4.9 refactor

---

### createConnection(...)

```typescript
createConnection(database: string, encrypted: boolean, mode: string, version: number) => Promise<SQLiteDBConnection | null>
```

Create a connection to a database

| Param           | Type                 |
| --------------- | -------------------- |
| **`database`**  | <code>string</code>  |
| **`encrypted`** | <code>boolean</code> |
| **`mode`**      | <code>string</code>  |
| **`version`**   | <code>number</code>  |

**Returns:** <code>Promise&lt;SQLiteDBConnection | null&gt;</code>

**Since:** 2.9.0 refactor

---

### closeConnection(...)

```typescript
closeConnection(database: string) => Promise<capSQLiteResult>
```

Close a database connection

| Param          | Type                |
| -------------- | ------------------- |
| **`database`** | <code>string</code> |

**Returns:** <code>Promise&lt;<a href="#capsqliteresult">capSQLiteResult</a>&gt;</code>

**Since:** 2.9.0 refactor

---

### Interfaces

#### capEchoResult

| Prop        | Type                | Description     |
| ----------- | ------------------- | --------------- |
| **`value`** | <code>string</code> | String returned |

#### capSQLiteResult

| Prop          | Type                 | Description                                   |
| ------------- | -------------------- | --------------------------------------------- |
| **`result`**  | <code>boolean</code> | result set to true when successful else false |
| **`message`** | <code>string</code>  | a returned message                            |

#### capSQLiteSet

| Prop            | Type                | Description                      |
| --------------- | ------------------- | -------------------------------- |
| **`statement`** | <code>string</code> | A statement                      |
| **`values`**    | <code>any[]</code>  | the data values list as an Array |

</docgen-api>
