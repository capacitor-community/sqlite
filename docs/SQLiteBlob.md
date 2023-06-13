<p align="center"><br><img src="https://user-images.githubusercontent.com/236501/85893648-1c92e880-b7a8-11ea-926d-95355b8175c7.png" width="128" height="128" /></p>
<h2 align="center">SQLite Blob DOCUMENTATION</h2>
<p align="center"><strong><code>@capacitor-community/sqlite</code></strong></p>
<p align="center">
  Capacitor community plugin for Native and Electron SQLite Databases. For <strong>Native</strong> and <strong>Electron</strong> platforms, databases could be encrypted with SQLCipher</p>

## Read a SQLite Blob

### Image Blob

```js
...
    const stmt = `SELECT id, name, img FROM testblob;`;
    const ret: DBSQLiteValues = await db.query(stmt, []);
    const arr = new Uint8Array(ret.values[0].img )
    var myBlob = new Blob( [ arr ], { type: this.getMime(arr) } );
    var imageUrl = URL.createObjectURL( myBlob );
    const imagEL: HTMLImageElement = document.querySelector('#image');
    imagEL.src = imageUrl;

...

  private getMime = (arr: Uint8Array): string => {
    let mime = "";
    if (arr.length > 4) {
      if (arr[0] == 0x89 && arr[1] == 0x50 && arr[2] == 0x4E && arr[3] == 0x47)
        mime = 'image/png';
      else if (arr[0] == 0xff && arr[1] == 0xd8)
        mime = 'image/jpeg';
      else if (arr[0] == 0x47 && arr[1] == 0x49 && arr[2] == 0x46)
        mime = 'image/gif';
      else if (arr[0] == 0x25 && arr[1] == 0x50 && arr[2] == 0x44 && arr[3] == 0x46)
        mime = 'application/pdf';
        if (arr[0] == 0x50 && arr[1] == 0x4B && arr[2] == 0x03 && arr[3] == 0x04)
        mime = 'application/zip';
      else {
        mime = 'text/plain';
      }
    }
    return mime;
  }
...
```
### Text Blob

```js
...
    const stmt = `SELECT id, name, blobtext FROM teach;`;
    const bufText = Buffer.from(ret.values[0].blobtext);
    const myText = bufText.toString();
    console.log(`&&& myText: ${myText}`);
...
```

## Write a SQLite Blob

### Image Blob

```js
...
    const imagePath = "YOUR_IMAGE_PATH/favicon.png";
    const blob = await(await fetch(imagePath)).blob();
    const imageBuffer = Buffer.from(new Uint8Array(await blob.arrayBuffer()));
    const imgValues = [1,"test image", imageBuffer];
    ret = await db.run(stmt, imgValues);
    console.log(`&&& res: ${JSON.stringify(ret)}`);
...
```

### Text Blob

```js
...
    const textBuffer = Buffer.from('Hello, World!');
    const stmt = "INSERT INTO teach (id, name, blobtext)VALUES( ?,?,?);";
    const values = [1,"test text", textBuffer];
    let ret: any = await db.run(stmt, values);
    console.log(`&&& res: ${JSON.stringify(ret)}`);

```