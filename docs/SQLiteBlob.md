<p align="center"><br><img src="https://user-images.githubusercontent.com/236501/85893648-1c92e880-b7a8-11ea-926d-95355b8175c7.png" width="128" height="128" /></p>
<h2 align="center">SQLite Blob DOCUMENTATION</h2>
<p align="center"><strong><code>@capacitor-community/sqlite</code></strong></p>
<p align="center">
  Capacitor community plugin for Native and Electron SQLite Databases. For <strong>Native</strong> and <strong>Electron</strong> platforms, databases could be encrypted with SQLCipher</p>

## Prerequisite

```bash
npm i --save buffer
```

## Read a SQLite Blob

### Image Blob

```js
...
import { Buffer } from 'buffer';

...

  private async readImage(db: SQLiteDBConnection, query: string, imageId: number) {
    const retQuery = await db.query(query, [imageId]);
    if(retQuery.values.length !==1 ) {
      return Promise.reject(new Error("Blob Image query failed"));
    }
    if(retQuery.values[0].blob.length <= 0) {
      return Promise.reject(new Error("Blob Image query blob length <= 0"));
    }
    const arr = new Uint8Array(retQuery.values[0].blob )
    var myBlob = new Blob( [ arr ], { type: retQuery.values[0].type } );
    const imageUrl: string = URL.createObjectURL( myBlob );
    return imageUrl;
  }

...
    const query = `SELECT name, type, blob FROM blobs WHERE id = ? ;`;
    const imageUrl: string = await this.readImage(db, query, imageId);
    const imageEL: HTMLImageElement = document.querySelector('#image');
    imageEL.src = imageUrl;
...

```
### Text Blob

```js
...
import { Buffer } from 'buffer';
...
    const query = `SELECT name, type, blob FROM blobs WHERE id = ? ;`;
    let retQuery: any = await db.query(query,[textId]);
    if(retQuery.values.length !==1 ) {
      return Promise.reject(new Error("Blob text query failed"));
    }
    if(retQuery.values[0].type !== "text") {
      return Promise.reject(new Error("Blob text query not return the right type"));
    }
    const retText = (Buffer.from(retQuery.values[0].blob)).toString();
    const myText = retText;
...
```

### Base64 Image Blob

```js
...
import { Buffer } from 'buffer';

...

  private async readImage(db: SQLiteDBConnection, query: string, imageId: number) {
    const retQuery = await db.query(query, [imageId]);
    if(retQuery.values.length !==1 ) {
      return Promise.reject(new Error("Blob Image query failed"));
    }
    if(retQuery.values[0].blob.length <= 0) {
      return Promise.reject(new Error("Blob Image query blob length <= 0"));
    }
    const arr = new Uint8Array(retQuery.values[0].blob )
    var myBlob = new Blob( [ arr ], { type: retQuery.values[0].type } );
    const imageUrl: string = URL.createObjectURL( myBlob );
    return imageUrl;
  }

...
    const query = `SELECT name, type, blob FROM blobs WHERE id = ? ;`;
    imageUrl = await this.readImage(db, query, imageId);
    const imageEL: HTMLImageElement = document.querySelector('#image');
    imageEL.src = imageUrl;

```

## Write a SQLite Blob

### Image Blob

```js
...
import { Buffer } from 'buffer';
...
  private async writeImage(db: SQLiteDBConnection, stmt: string, imagePath: string, name: string, type: string) {
    const blob = await(await fetch(imagePath)).blob();
    const imageBuffer = Buffer.from(new Uint8Array(await blob.arrayBuffer()));
    const imgValues = [name,type, imageBuffer];
    const ret = await db.run(stmt, imgValues);
    if(ret.changes.changes !== 1) {
      return Promise.reject(new Error('WriteImage failed'))
    }
    return ret.changes.lastId;
  }
...

  const imagePath = "YOUR_IMAGE_PATH/YOUR_IMAGE_NAME.png";
  const stmt = "INSERT INTO blobs (name, type, blob) VALUES( ?,?,?);";
  let imageId = await this.writeImage(db, stmt, imagePath, "Image1", "png");
...
```

### Text Blob

```js
...
import { Buffer } from 'buffer';
...
    const textBuffer = Buffer.from('Hello, World!');
    const stmt = "INSERT INTO blobs (name, type, blob) VALUES( ?,?,?);";
    const values = ["test blob text", "text", textBuffer];
    let ret: any = await db.run(stmt, values);
    let textId = ret.changes.lastId;
...
```

### Base64 Image Blob

```js
import { Buffer } from 'buffer';
...
  private async writeImage(db: SQLiteDBConnection, stmt: string, imagePath: string, name: string, type: string) {
    const blob = await(await fetch(imagePath)).blob();
    const imageBuffer = Buffer.from(new Uint8Array(await blob.arrayBuffer()));
    const imgValues = [name,type, imageBuffer];
    const ret = await db.run(stmt, imgValues);
    if(ret.changes.changes !== 1) {
      return Promise.reject(new Error('WriteImage failed'))
    }
    return ret.changes.lastId;
  }
...

  const imgBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAU1QTFRFNjtAQEVK////bG9zSk9T/v7+/f39/f3+9vf3O0BETlJWNzxB/Pz8d3t+TFFVzM3O1NXX7u/vUldbRElNs7W3v8HCmZyeRkpPW19j8vLy7u7vvsDC9PT1cHR3Oj9Eo6WnxsjJR0tQOD1Bj5KVgYSHTVFWtri50dLUtLa4YmZqOT5D8vPzRUpOkZOWc3Z64uPjr7Gzuru95+jpX2NnaGxwPkNHp6mrioyPlZeadXh8Q0hNPEBFyszNh4qNc3d6eHx/OD1Cw8XGXGBkfoGEra+xxcbIgoaJu72/m52ggoWIZ2tu8/P0wcLE+vr7kZSXgIOGP0NIvr/BvL6/QUZKP0RJkpWYpKaoqKqtVVldmJqdl5qcZWhstbe5bHB0bnJ1UVVZwsTF5ubnT1RYcHN3oaSm3N3e3NzdQkdLnJ+h9fX1TlNX+Pj47/DwwsPFVFhcEpC44wAAAShJREFUeNq8k0VvxDAQhZOXDS52mRnKzLRlZmZm+v/HxmnUOlFaSz3su4xm/BkGzLn4P+XimOJZyw0FKufelfbfAe89dMmBBdUZ8G1eCJMba69Al+AABOOm/7j0DDGXtQP9bXjYN2tWGQfyA1Yg1kSu95x9GKHiIOBXLcAwUD1JJSBVfUbwGGi2AIvoneK4bCblSS8b0RwwRAPbCHx52kH60K1b9zQUjQKiULbMDbulEjGha/RQQFDE0/ezW8kR3C3kOJXmFcSyrcQR7FDAi55nuGABZkT5hqpk3xughDN7FOHHHd0LLU9qtV7r7uhsuRwt6pEJJFVLN4V5CT+SErpXt81DbHautkpBeHeaqNDRqUA0Uo5GkgXGyI3xDZ/q/wJMsb7/pwADAGqZHDyWkHd1AAAAAElFTkSuQmCC"
  ;
  const stmt = "INSERT INTO blobs (name, type, blob) VALUES( ?,?,?);";
  const imageId = await this.writeImage(db, stmt, imgBase64, "feather", "base64");
  ...
```