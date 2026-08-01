/**
 * copyFromAssets and getFromHTTPRequest.
 *
 * Behaviour ported from jeep-sqlite (MIT) and `electron/src/electron-utils/utilsFile.ts`
 * (MIT, this repo): the asset copy reads `assets/databases/databases.json` as a manifest and
 * pulls each listed file, where a `.zip` entry is an archive of databases rather than a
 * database.
 *
 * Streaming. A plain database download is fed to `importDb`'s async-callback form one network
 * chunk at a time, so a multi-hundred-megabyte bundle costs one chunk of memory rather than its
 * own size (M0 item 2 measured 1.10 MiB against 65.02 MiB for the whole-buffer path). No
 * MessagePort is involved because producer and consumer are both inside this worker; the pull
 * protocol in PLAN 3.1/A5 exists for the additive API in section 8.1, where the main thread owns
 * the source.
 *
 * Zip is the exception and is materialised: the archive has to be in memory to be inflated. That
 * is a property of the container, not of our path, and it is the reason `.zip` assets should be
 * kept modest. Recorded in section 13.
 */
import { unzipSync } from 'fflate';

import { prefixed } from '../errors';

import { poolPath, reserveCapacity, storageName } from './paths';

export interface AssetTarget {
  /** tier 1 pool, or null on tier 2 where images land in IndexedDB instead. */
  poolUtil: any | null;
  /** Adopt a whole image (tier 2, and the zip path on either tier). */
  adopt: (storage: string, bytes: Uint8Array) => Promise<void>;
  exists: (storage: string) => Promise<boolean>;
}

const DB_SUFFIXES = ['.db', '.sqlite', '.sqlite3'];

function isDatabaseName(name: string): boolean {
  const lower = name.toLowerCase();
  return DB_SUFFIXES.some((suffix) => lower.endsWith(suffix));
}

/** `foo.db` / `fooSQLite.db` -> the plugin's storage name `fooSQLite.db`. */
export function assetStorageName(fileName: string): string {
  let base = fileName;
  for (const suffix of DB_SUFFIXES) {
    if (base.toLowerCase().endsWith(suffix)) {
      base = base.slice(0, -suffix.length);
      break;
    }
  }
  return storageName(base);
}

/**
 * Stream a response body straight into the pool. Falls back to buffering only when the response
 * has no readable stream, which is the case for some polyfilled fetch implementations.
 */
async function streamIntoPool(target: AssetTarget, storage: string, response: Response): Promise<number> {
  if (!response.body) {
    const bytes = new Uint8Array(await response.arrayBuffer());
    await target.adopt(storage, bytes);
    return bytes.byteLength;
  }
  await reserveCapacity(target.poolUtil, 2);
  const reader = response.body.getReader();
  let written = 0;
  await target.poolUtil.importDb(poolPath(storage), async () => {
    const { done, value } = await reader.read();
    if (done || !value) return undefined;
    written += value.byteLength;
    return value;
  });
  return written;
}

async function fetchOk(url: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`request for ${url} failed with status ${response.status}`);
  return response;
}

/** One database file from a URL into storage, streamed when the tier allows it. */
export async function importFromUrl(
  target: AssetTarget,
  storage: string,
  url: string,
  overwrite: boolean,
): Promise<boolean> {
  if (!overwrite && (await target.exists(storage))) return false;
  const response = await fetchOk(url);
  if (target.poolUtil) {
    await streamIntoPool(target, storage, response);
  } else {
    // Tier 2 stores a whole image anyway, so streaming would buy nothing here.
    await target.adopt(storage, new Uint8Array(await response.arrayBuffer()));
  }
  return true;
}

function looksLikeSqlite(bytes: Uint8Array): boolean {
  const header = 'SQLite format 3';
  if (bytes.byteLength < header.length) return false;
  for (let i = 0; i < header.length; i++) if (bytes[i] !== header.charCodeAt(i)) return false;
  return true;
}

/** Every database inside a zip archive, keyed by its storage name. */
export function databasesFromZip(archive: Uint8Array): { storage: string; bytes: Uint8Array }[] {
  const entries = unzipSync(archive);
  const out: { storage: string; bytes: Uint8Array }[] = [];
  for (const [name, bytes] of Object.entries(entries)) {
    const leaf = name.split('/').pop() ?? name;
    if (leaf.length === 0 || leaf.startsWith('.')) continue;
    if (!isDatabaseName(leaf) && !looksLikeSqlite(bytes)) continue;
    out.push({ storage: assetStorageName(leaf), bytes });
  }
  return out;
}

export interface CopyFromAssetsResult {
  copied: string[];
  skipped: string[];
}

/**
 * @param base the directory holding `databases.json`, normally `assets/databases/` relative to
 *   the app's base URL.
 */
export async function copyFromAssets(
  target: AssetTarget,
  base: string,
  overwrite: boolean,
): Promise<CopyFromAssetsResult> {
  const manifestUrl = new URL('databases.json', base).href;
  let manifest: any;
  try {
    manifest = await (await fetchOk(manifestUrl)).json();
  } catch (err) {
    throw prefixed('CopyFromAssets', err);
  }
  const files: string[] = Array.isArray(manifest) ? manifest : (manifest?.databaseList ?? []);
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error('CopyFromAssets: databases.json does not list any database');
  }

  const copied: string[] = [];
  const skipped: string[] = [];
  for (const file of files) {
    const url = new URL(file, base).href;
    if (file.toLowerCase().endsWith('.zip')) {
      const archive = new Uint8Array(await (await fetchOk(url)).arrayBuffer());
      for (const entry of databasesFromZip(archive)) {
        if (!overwrite && (await target.exists(entry.storage))) {
          skipped.push(entry.storage);
          continue;
        }
        await target.adopt(entry.storage, entry.bytes);
        copied.push(entry.storage);
      }
      continue;
    }
    const storage = assetStorageName(file);
    if (await importFromUrl(target, storage, url, overwrite)) copied.push(storage);
    else skipped.push(storage);
  }
  return { copied, skipped };
}

/** getFromHTTPRequest: one database at a URL, streamed into storage. */
export async function getFromHTTPRequest(target: AssetTarget, url: string, overwrite: boolean): Promise<string> {
  const leaf = new URL(url, 'http://localhost/').pathname.split('/').pop() ?? 'downloaded.db';
  if (leaf.toLowerCase().endsWith('.zip')) {
    const archive = new Uint8Array(await (await fetchOk(url)).arrayBuffer());
    const entries = databasesFromZip(archive);
    if (entries.length === 0) throw new Error('GetFromHTTPRequest: the archive contains no database');
    for (const entry of entries) {
      if (!overwrite && (await target.exists(entry.storage))) continue;
      await target.adopt(entry.storage, entry.bytes);
    }
    return entries[0].storage;
  }
  const storage = assetStorageName(leaf);
  await importFromUrl(target, storage, url, overwrite);
  return storage;
}
