/**
 * Tier 2 persistence: whole-database images in IndexedDB.
 *
 * This is jeep-sqlite's durability model, reimplemented on the one engine: the database lives in
 * `:memory:` and the bytes rest in IndexedDB, written at the flush points the plugin already
 * documents (close, closeConnection, saveToStore). The image format is plain SQLite, byte for
 * byte the same thing tier 1 stores in the pool, which is what lets a database move between the
 * tiers and what the M3 jeep migration will rely on.
 *
 * Raw IndexedDB on purpose: localforage is not a dependency and will not become one.
 */
import { IMAGE_STORE_NAME, IMAGE_STORE_VERSION, META_STORE_NAME, imageStoreDbName } from '../protocol';

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed'));
  });
}

/**
 * Wait for the transaction, not just the request. A write request fires `success` well before its
 * transaction commits, and the commit can still fail (quota, eviction, a force-closed connection),
 * so resolving on the request alone reports durable data that was never written.
 */
function committed(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'));
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'));
  });
}

export class ImageStore {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private name: string;

  constructor(poolName: string) {
    this.name = imageStoreDbName(poolName);
  }

  private open(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      const name = this.name;
      this.dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(name, IMAGE_STORE_VERSION);
        req.onupgradeneeded = () => {
          for (const store of [IMAGE_STORE_NAME, META_STORE_NAME]) {
            if (!req.result.objectStoreNames.contains(store)) req.result.createObjectStore(store);
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error ?? new Error('Could not open the image store'));
      });
    }
    return this.dbPromise;
  }

  private async tx(mode: IDBTransactionMode, store: string = IMAGE_STORE_NAME): Promise<IDBObjectStore> {
    const db = await this.open();
    return db.transaction(store, mode).objectStore(store);
  }

  /** A write, waited on all the way to the commit. */
  private async write(store: string, body: (target: IDBObjectStore) => IDBRequest): Promise<void> {
    const target = await this.tx('readwrite', store);
    const done = committed(target.transaction);
    await request(body(target));
    await done;
  }

  async get(storage: string): Promise<Uint8Array | null> {
    const store = await this.tx('readonly');
    const value = await request<any>(store.get(storage));
    if (!value) return null;
    if (value instanceof Uint8Array) return value;
    if (value instanceof ArrayBuffer) return new Uint8Array(value);
    return null;
  }

  async put(storage: string, image: Uint8Array): Promise<void> {
    await this.write(IMAGE_STORE_NAME, (store) => store.put(image, storage));
  }

  async delete(storage: string): Promise<void> {
    await this.write(IMAGE_STORE_NAME, (store) => store.delete(storage));
  }

  async has(storage: string): Promise<boolean> {
    const store = await this.tx('readonly');
    const count = await request<number>(store.count(storage));
    return count > 0;
  }

  async keys(): Promise<string[]> {
    const store = await this.tx('readonly');
    const keys = await request<IDBValidKey[]>(store.getAllKeys());
    return keys.map((k) => String(k));
  }

  /** Bookkeeping that is not a database image. Kept out of the image store so it cannot be listed. */
  async getMeta<T>(key: string): Promise<T | null> {
    const store = await this.tx('readonly', META_STORE_NAME);
    const value = await request<any>(store.get(key));
    return value === undefined ? null : (value as T);
  }

  async setMeta(key: string, value: unknown): Promise<void> {
    await this.write(META_STORE_NAME, (store) => store.put(value, key));
  }
}

/**
 * Load an image into an open `:memory:` database.
 *
 * FREEONCLOSE hands the buffer's lifetime to sqlite (it was allocated with sqlite's allocator by
 * allocFromTypedArray), and RESIZEABLE is what allows writes that grow the database past the
 * size of the image it was restored from.
 */
export function deserializeInto(sqlite3: any, db: any, image: Uint8Array): void {
  const capi = sqlite3.capi;
  const pData = sqlite3.wasm.allocFromTypedArray(image);
  const rc = capi.sqlite3_deserialize(
    db.pointer,
    'main',
    pData,
    image.byteLength,
    image.byteLength,
    capi.SQLITE_DESERIALIZE_FREEONCLOSE | capi.SQLITE_DESERIALIZE_RESIZEABLE,
  );
  db.checkRc(rc);
}
