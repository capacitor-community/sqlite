<p align="center"><br><img src="https://user-images.githubusercontent.com/236501/85893648-1c92e880-b7a8-11ea-926d-95355b8175c7.png" width="128" height="128" /></p>
<h2 align="center">API DB CONNECTION DOCUMENTATION</h2>
<p align="center"><strong><code>@capacitor-community/sqlite</code></strong></p>
<p align="center">
  SQLite DB Connection Wrapper</p>

## Methods Index

<docgen-index>

- [`getConnectionDBName()`](#getconnectiondbname)
- [`open()`](#open)
- [`close()`](#close)
- [`execute(...)`](#execute)
- [`query(...)`](#query)
- [`run(...)`](#run)
- [`executeSet(...)`](#executeset)
- [`isExists()`](#isexists)
- [`delete()`](#delete)
- [`createSyncTable()`](#createsynctable)
- [`setSyncDate(...)`](#setsyncdate)
- [Interfaces](#interfaces)

</docgen-index>

## API DB Connection Wrapper

<docgen-api class="custom-css">
<!--Update the source file JSDoc comments and rerun docgen to update the docs below-->

SQLiteDBConnection Interface

### getConnectionDBName()

```typescript
getConnectionDBName() => string
```

Get SQLite DB Connection DB name

**Returns:** <code>string</code>

**Since:** 2.9.0 refactor

---

### open()

```typescript
open() => Promise<capSQLiteResult>
```

Open a SQLite DB Connection

**Returns:** <code>Promise&lt;<a href="#capsqliteresult">capSQLiteResult</a>&gt;</code>

**Since:** 2.9.0 refactor

---

### close()

```typescript
close() => Promise<capSQLiteResult>
```

Close a SQLite DB Connection

**Returns:** <code>Promise&lt;<a href="#capsqliteresult">capSQLiteResult</a>&gt;</code>

**Since:** 2.9.0 refactor

---

### execute(...)

```typescript
execute(statements: string) => Promise<capSQLiteChanges>
```

Execute SQLite DB Connection Statements

| Param            | Type                |
| ---------------- | ------------------- |
| **`statements`** | <code>string</code> |

**Returns:** <code>Promise&lt;<a href="#capsqlitechanges">capSQLiteChanges</a>&gt;</code>

**Since:** 2.9.0 refactor

---

### query(...)

```typescript
query(statement: string, values?: string[] | undefined) => Promise<capSQLiteValues>
```

Execute SQLite DB Connection Query

| Param           | Type                  | Description |
| --------------- | --------------------- | ----------- |
| **`statement`** | <code>string</code>   |             |
| **`values`**    | <code>string[]</code> | (optional)  |

**Returns:** <code>Promise&lt;<a href="#capsqlitevalues">capSQLiteValues</a>&gt;</code>

**Since:** 2.9.0 refactor

---

### run(...)

```typescript
run(statement: string, values?: any[] | undefined) => Promise<capSQLiteChanges>
```

Execute SQLite DB Connection Raw Statement

| Param           | Type                | Description |
| --------------- | ------------------- | ----------- |
| **`statement`** | <code>string</code> |             |
| **`values`**    | <code>any[]</code>  | (optional)  |

**Returns:** <code>Promise&lt;<a href="#capsqlitechanges">capSQLiteChanges</a>&gt;</code>

**Since:** 2.9.0 refactor

---

### executeSet(...)

```typescript
executeSet(set: Array<capSQLiteSet>) => Promise<capSQLiteChanges>
```

Execute SQLite DB Connection Set

| Param     | Type                        |
| --------- | --------------------------- |
| **`set`** | <code>capSQLiteSet[]</code> |

**Returns:** <code>Promise&lt;<a href="#capsqlitechanges">capSQLiteChanges</a>&gt;</code>

**Since:** 2.9.0 refactor

---

### isExists()

```typescript
isExists() => Promise<capSQLiteResult>
```

Check if a SQLite DB Connection exists

**Returns:** <code>Promise&lt;<a href="#capsqliteresult">capSQLiteResult</a>&gt;</code>

**Since:** 2.9.0 refactor

---

### delete()

```typescript
delete() => Promise<capSQLiteResult>
```

Delete a SQLite DB Connection

**Returns:** <code>Promise&lt;<a href="#capsqliteresult">capSQLiteResult</a>&gt;</code>

**Since:** 2.9.0 refactor

---

### createSyncTable()

```typescript
createSyncTable() => Promise<capSQLiteChanges>
```

Create a synchronization table

**Returns:** <code>Promise&lt;<a href="#capsqlitechanges">capSQLiteChanges</a>&gt;</code>

**Since:** 2.4.9 refactor

---

### setSyncDate(...)

```typescript
setSyncDate(syncdate: string) => Promise<capSQLiteResult>
```

Set the synchronization date

| Param          | Type                |
| -------------- | ------------------- |
| **`syncdate`** | <code>string</code> |

**Returns:** <code>Promise&lt;<a href="#capsqliteresult">capSQLiteResult</a>&gt;</code>

**Since:** 2.4.9 refactor

---

### Interfaces

#### capSQLiteResult

| Prop          | Type                 | Description                                   |
| ------------- | -------------------- | --------------------------------------------- |
| **`result`**  | <code>boolean</code> | result set to true when successful else false |
| **`message`** | <code>string</code>  | a returned message                            |

#### capSQLiteChanges

| Prop          | Type                | Description                                          |
| ------------- | ------------------- | ---------------------------------------------------- |
| **`changes`** | <code>any</code>    | the number of changes from an execute or run command |
| **`message`** | <code>string</code> | a returned message                                   |

#### capSQLiteValues

| Prop          | Type                | Description                                           |
| ------------- | ------------------- | ----------------------------------------------------- |
| **`values`**  | <code>any[]</code>  | the data values list as an <a href="#array">Array</a> |
| **`message`** | <code>string</code> | a returned message                                    |

#### Array

| Prop         | Type                | Description                                                                                                     |
| ------------ | ------------------- | --------------------------------------------------------------------------------------------------------------- |
| **`length`** | <code>number</code> | Gets or sets the length of the array. This is a number one higher than the highest element defined in an array. |

| Method             | Signature                                                                                                                     | Description                                                                                                                                                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **toString**       | () =&gt; string                                                                                                               | Returns a string representation of an array.                                                                                                                                                                                                |
| **toLocaleString** | () =&gt; string                                                                                                               | Returns a string representation of an array. The elements are converted to string using their toLocalString methods.                                                                                                                        |
| **pop**            | () =&gt; T \| undefined                                                                                                       | Removes the last element from an array and returns it.                                                                                                                                                                                      |
| **push**           | (...items: T[]) =&gt; number                                                                                                  | Appends new elements to an array, and returns the new length of the array.                                                                                                                                                                  |
| **concat**         | (...items: <a href="#concatarray">ConcatArray</a>&lt;T&gt;[]) =&gt; T[]                                                       | Combines two or more arrays.                                                                                                                                                                                                                |
| **concat**         | (...items: (T \| <a href="#concatarray">ConcatArray</a>&lt;T&gt;)[]) =&gt; T[]                                                | Combines two or more arrays.                                                                                                                                                                                                                |
| **join**           | (separator?: string \| undefined) =&gt; string                                                                                | Adds all the elements of an array separated by the specified separator string.                                                                                                                                                              |
| **reverse**        | () =&gt; T[]                                                                                                                  | Reverses the elements in an <a href="#array">Array</a>.                                                                                                                                                                                     |
| **shift**          | () =&gt; T \| undefined                                                                                                       | Removes the first element from an array and returns it.                                                                                                                                                                                     |
| **slice**          | (start?: number \| undefined, end?: number \| undefined) =&gt; T[]                                                            | Returns a section of an array.                                                                                                                                                                                                              |
| **sort**           | (compareFn?: ((a: T, b: T) =&gt; number) \| undefined) =&gt; this                                                             | Sorts an array.                                                                                                                                                                                                                             |
| **splice**         | (start: number, deleteCount?: number \| undefined) =&gt; T[]                                                                  | Removes elements from an array and, if necessary, inserts new elements in their place, returning the deleted elements.                                                                                                                      |
| **splice**         | (start: number, deleteCount: number, ...items: T[]) =&gt; T[]                                                                 | Removes elements from an array and, if necessary, inserts new elements in their place, returning the deleted elements.                                                                                                                      |
| **unshift**        | (...items: T[]) =&gt; number                                                                                                  | Inserts new elements at the start of an array.                                                                                                                                                                                              |
| **indexOf**        | (searchElement: T, fromIndex?: number \| undefined) =&gt; number                                                              | Returns the index of the first occurrence of a value in an array.                                                                                                                                                                           |
| **lastIndexOf**    | (searchElement: T, fromIndex?: number \| undefined) =&gt; number                                                              | Returns the index of the last occurrence of a specified value in an array.                                                                                                                                                                  |
| **every**          | &lt;S extends T&gt;(predicate: (value: T, index: number, array: T[]) =&gt; value is S, thisArg?: any) =&gt; this is S[]       | Determines whether all the members of an array satisfy the specified test.                                                                                                                                                                  |
| **every**          | (predicate: (value: T, index: number, array: T[]) =&gt; unknown, thisArg?: any) =&gt; boolean                                 | Determines whether all the members of an array satisfy the specified test.                                                                                                                                                                  |
| **some**           | (predicate: (value: T, index: number, array: T[]) =&gt; unknown, thisArg?: any) =&gt; boolean                                 | Determines whether the specified callback function returns true for any element of an array.                                                                                                                                                |
| **forEach**        | (callbackfn: (value: T, index: number, array: T[]) =&gt; void, thisArg?: any) =&gt; void                                      | Performs the specified action for each element in an array.                                                                                                                                                                                 |
| **map**            | &lt;U&gt;(callbackfn: (value: T, index: number, array: T[]) =&gt; U, thisArg?: any) =&gt; U[]                                 | Calls a defined callback function on each element of an array, and returns an array that contains the results.                                                                                                                              |
| **filter**         | &lt;S extends T&gt;(predicate: (value: T, index: number, array: T[]) =&gt; value is S, thisArg?: any) =&gt; S[]               | Returns the elements of an array that meet the condition specified in a callback function.                                                                                                                                                  |
| **filter**         | (predicate: (value: T, index: number, array: T[]) =&gt; unknown, thisArg?: any) =&gt; T[]                                     | Returns the elements of an array that meet the condition specified in a callback function.                                                                                                                                                  |
| **reduce**         | (callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) =&gt; T) =&gt; T                           | Calls the specified callback function for all the elements in an array. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.                      |
| **reduce**         | (callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) =&gt; T, initialValue: T) =&gt; T          |                                                                                                                                                                                                                                             |
| **reduce**         | &lt;U&gt;(callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) =&gt; U, initialValue: U) =&gt; U | Calls the specified callback function for all the elements in an array. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.                      |
| **reduceRight**    | (callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) =&gt; T) =&gt; T                           | Calls the specified callback function for all the elements in an array, in descending order. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function. |
| **reduceRight**    | (callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) =&gt; T, initialValue: T) =&gt; T          |                                                                                                                                                                                                                                             |
| **reduceRight**    | &lt;U&gt;(callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) =&gt; U, initialValue: U) =&gt; U | Calls the specified callback function for all the elements in an array, in descending order. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function. |

#### ConcatArray

| Prop         | Type                |
| ------------ | ------------------- |
| **`length`** | <code>number</code> |

| Method    | Signature                                                          |
| --------- | ------------------------------------------------------------------ |
| **join**  | (separator?: string \| undefined) =&gt; string                     |
| **slice** | (start?: number \| undefined, end?: number \| undefined) =&gt; T[] |

#### capSQLiteSet

| Prop            | Type                | Description                                           |
| --------------- | ------------------- | ----------------------------------------------------- |
| **`statement`** | <code>string</code> | A statement                                           |
| **`values`**    | <code>any[]</code>  | the data values list as an <a href="#array">Array</a> |

</docgen-api>
