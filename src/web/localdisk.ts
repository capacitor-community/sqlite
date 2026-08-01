/**
 * getFromLocalDiskToStore and saveToLocalDisk.
 *
 * These two live on the main thread rather than in the worker because they are DOM flows: one
 * opens a file picker, the other triggers a download. Behaviour ported from jeep-sqlite (MIT),
 * which does the same two things with the same events.
 *
 * The picker boundary is injectable so the logic either side of it can be tested. Real pickers
 * cannot be driven from an automated browser without a user gesture, so a test supplies the
 * file and the download sink directly and everything else runs unchanged. What remains
 * manual-only is the picker chrome itself; see section 13.
 */

export interface PickedFile {
  name: string;
  bytes: Uint8Array;
}

export interface LocalDiskAdapter {
  /** Ask the user for a database file. Resolves null when the user cancels. */
  pickDatabase: () => Promise<PickedFile | null>;
  /** Hand bytes to the user as a download. */
  saveDatabase: (fileName: string, bytes: Uint8Array) => Promise<void>;
}

/** `<input type="file">` is the only picker that works without a secure-context gesture policy. */
function defaultPickDatabase(): Promise<PickedFile | null> {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('GetFromLocalDiskToStore: no document available to open a file picker'));
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.db,.sqlite,.sqlite3,.zip,application/octet-stream';
    input.style.display = 'none';
    let settled = false;

    const finish = (value: PickedFile | null) => {
      if (settled) return;
      settled = true;
      input.remove();
      resolve(value);
    };

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return finish(null);
      finish({ name: file.name, bytes: new Uint8Array(await file.arrayBuffer()) });
    };
    // A cancelled picker fires no change event in most browsers; window focus is the signal.
    window.addEventListener('focus', () => setTimeout(() => finish(input.files?.[0] ? null : null), 500), {
      once: true,
    });
    document.body.appendChild(input);
    input.click();
  });
}

function defaultSaveDatabase(fileName: string, bytes: Uint8Array): Promise<void> {
  if (typeof document === 'undefined') {
    return Promise.reject(new Error('SaveToLocalDisk: no document available to start a download'));
  }
  // Copy into a fresh buffer: a Uint8Array that came over the worker boundary may be a view
  // onto a larger buffer, and Blob would otherwise capture the whole thing.
  const blob = new Blob([bytes.slice()], { type: 'application/vnd.sqlite3' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Revoking immediately can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return Promise.resolve();
}

export const defaultLocalDiskAdapter: LocalDiskAdapter = {
  pickDatabase: defaultPickDatabase,
  saveDatabase: defaultSaveDatabase,
};

let adapter: LocalDiskAdapter = defaultLocalDiskAdapter;

/**
 * Replace the picker and download boundary. Additive, not part of CapacitorSQLitePlugin; it
 * exists so the surrounding logic is testable and so an app with its own file UI can use it.
 */
export function setSqliteLocalDiskAdapter(next: LocalDiskAdapter | null): void {
  adapter = next ?? defaultLocalDiskAdapter;
}

export function getLocalDiskAdapter(): LocalDiskAdapter {
  return adapter;
}

/** `mydbSQLite.db` or `mydb.db` picked from disk -> the connection name `mydb`. */
export function connectionNameFromFile(fileName: string): string {
  let base = fileName.split(/[\\/]/).pop() ?? fileName;
  for (const suffix of ['.sqlite3', '.sqlite', '.db']) {
    if (base.toLowerCase().endsWith(suffix)) {
      base = base.slice(0, -suffix.length);
      break;
    }
  }
  if (base.endsWith('SQLite')) base = base.slice(0, -'SQLite'.length);
  return base;
}
