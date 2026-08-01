/**
 * Tier selection: single-owner lock first, then the VFS install, then a CLASSIFIED fallback.
 *
 * The classification is the whole point. A second browsing context that installs the pool while
 * the first still holds the sync access handles gets a `NoModificationAllowedError`, which looks
 * exactly like "this platform has no OPFS" unless you inspect it. Treating it as a fallback
 * would hand the app an empty `:memory:` database on top of its real data, and the next flush
 * would write that empty image over the stored one. So a busy pool fails loudly and only genuine
 * capability gaps reach tier 2.
 */
import { MULTI_TAB_LOCKED, SQLiteWebError, messageOf } from '../errors';
import type { Tier, WorkerInitArgs } from '../protocol';
import { ownerLockName } from '../protocol';

export interface TierSelection {
  tier: Tier;
  poolUtil: any | null;
  fallbackReason?: string;
}

/**
 * Take the owner lock and never release it: the held callback returns a promise that never
 * settles, so the lock lives exactly as long as this worker. Resolves false when another
 * context already owns it.
 */
export function acquireOwnerLock(poolName: string): Promise<boolean> {
  const locks = (navigator as any).locks;
  if (!locks || typeof locks.request !== 'function') {
    // No Web Locks means no way to gate. Proceed; the VFS install is still the backstop,
    // and its busy-pool rejection is classified below rather than silently downgraded.
    return Promise.resolve(true);
  }
  return new Promise<boolean>((resolve, reject) => {
    locks
      .request(ownerLockName(poolName), { ifAvailable: true }, (lock: unknown) => {
        if (!lock) {
          resolve(false);
          return undefined;
        }
        resolve(true);
        return new Promise<never>(() => {
          /* held until this worker is terminated */
        });
      })
      .catch(reject);
  });
}

/** A rejection that means "someone else owns the pool", not "this platform cannot do OPFS". */
function isPoolBusy(err: unknown): boolean {
  const name = (err as any)?.name;
  if (name === 'NoModificationAllowedError' || name === 'InvalidStateError') return true;
  return /access handles cannot be created|no modification allowed/i.test(messageOf(err));
}

/** The only three rejections that legitimately mean tier 2. */
function isCapabilityGap(err: unknown): boolean {
  const message = messageOf(err);
  if (/missing required opfs apis/i.test(message)) return true;
  if (/too old for opfs-sahpool/i.test(message)) return true;
  return (err as any)?.name === 'SecurityError';
}

function opfsApisPresent(): boolean {
  const g = globalThis as any;
  return !!(
    g.FileSystemHandle &&
    g.FileSystemDirectoryHandle &&
    typeof g.FileSystemFileHandle?.prototype?.createSyncAccessHandle === 'function' &&
    navigator?.storage?.getDirectory
  );
}

export async function selectTier(sqlite3: any, args: WorkerInitArgs): Promise<TierSelection> {
  if (args.forceTier2) {
    return { tier: 2, poolUtil: null, fallbackReason: 'forced by configuration' };
  }

  const owned = await acquireOwnerLock(args.poolName);
  if (!owned) throw new SQLiteWebError(MULTI_TAB_LOCKED, { name: 'SQLiteWebLockedError', code: 'LOCKED' });

  if (typeof sqlite3.installOpfsSAHPoolVfs !== 'function') {
    return { tier: 2, poolUtil: null, fallbackReason: 'installOpfsSAHPoolVfs is unavailable in this build' };
  }
  if (!opfsApisPresent()) {
    return { tier: 2, poolUtil: null, fallbackReason: 'Missing required OPFS APIs.' };
  }

  try {
    if (args.simulateInstallError) {
      // Test hook: exercise the classifier without needing a second browsing context. The value
      // is used as both the DOMException name and the message, so either arm can be driven.
      const fake: any = new Error(args.simulateInstallError);
      fake.name = args.simulateInstallError;
      throw fake;
    }
    const poolUtil = await sqlite3.installOpfsSAHPoolVfs({
      directory: args.directory,
      name: args.poolName,
    });
    return { tier: 1, poolUtil };
  } catch (err) {
    if (isPoolBusy(err)) {
      throw new SQLiteWebError(MULTI_TAB_LOCKED, { name: 'SQLiteWebLockedError', code: 'LOCKED', cause: err });
    }
    if (isCapabilityGap(err)) {
      return { tier: 2, poolUtil: null, fallbackReason: messageOf(err) };
    }
    // Unrecognised: do not guess. Silently degrading here is what loses user data.
    throw new SQLiteWebError(`Could not initialise the opfs-sahpool VFS: ${messageOf(err)}`, {
      name: (err as any)?.name,
      cause: err,
    });
  }
}
