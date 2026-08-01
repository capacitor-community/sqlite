/**
 * Tier promotion: moving databases from the IndexedDB image store into the OPFS pool.
 *
 * The two tiers do not read each other. A browser that lacked OPFS sync access handles stores
 * whole-file images in IndexedDB; when the same browser later gains them, tier selection picks
 * tier 1 and the pool is empty, so `getDatabaseList()` returns nothing while the user's data sits
 * in IndexedDB with no way back. That is not hypothetical: it is the normal upgrade path for
 * exactly the population that runs on tier 2 (Android WebView reaching M132, iOS 16.3 to 16.4).
 *
 * So on every tier 1 init, any image left in the store is adopted into the pool through the same
 * verified path the jeep-sqlite migration uses, and only then removed.
 *
 * Two rules make this safe to run on every boot rather than once:
 *
 * - **The pool wins a name conflict.** A database can only be in the pool because it was written
 *   while on tier 1, which is after the flip, which makes it newer than any image left behind.
 *   The image is NOT deleted in that case: the only way both can exist is a promotion that
 *   failed or was interrupted and an app that then created the name itself, and in that
 *   situation the image may be the copy that matters. It is reported and left alone.
 * - **An image is deleted only after its own adoption has verified.** Anything not yet promoted
 *   is therefore still exactly where tier 2 would look for it, so an interrupted run resumes on
 *   the next boot and a browser that drops back to tier 2 still finds what was not moved.
 */
import { messageOf } from '../errors';
import type { TierPromotionResult } from '../protocol';

import type { AdoptionTarget } from './adoption';
import { looksLikeSQLite } from './adoption';

/** The bit of ImageStore promotion needs. Narrowed so the tests can drive it directly. */
export interface PromotableImages {
  keys(): Promise<string[]>;
  get(storage: string): Promise<Uint8Array | null>;
  delete(storage: string): Promise<void>;
}

export function noPromotion(): TierPromotionResult {
  return { promoted: [], conflicts: [], failed: [] };
}

/**
 * Never throws. A store that cannot be promoted is a reason to warn, not a reason to refuse to
 * boot: the images are still readable by a tier 2 context and nothing has been destroyed.
 */
export async function promoteImages(images: PromotableImages, target: AdoptionTarget): Promise<TierPromotionResult> {
  let keys: string[];
  try {
    keys = await images.keys();
  } catch (err) {
    return { ...noPromotion(), warning: `Could not read the image store: ${messageOf(err)}` };
  }
  if (keys.length === 0) return noPromotion();

  const promoted: string[] = [];
  const conflicts: string[] = [];
  const failed: string[] = [];
  const problems: string[] = [];

  for (const storage of keys) {
    try {
      if (await target.exists(storage)) {
        conflicts.push(storage);
        continue;
      }
      const bytes = await images.get(storage);
      if (!bytes || bytes.byteLength === 0 || !looksLikeSQLite(bytes)) {
        failed.push(storage);
        problems.push(`${storage}: the stored image is not a SQLite database`);
        continue;
      }
      await target.adopt(storage, bytes);
      await target.verify(storage);
      // Only now, with a readable database in the pool, does the original go.
      await images.delete(storage);
      promoted.push(storage);
    } catch (err) {
      failed.push(storage);
      problems.push(`${storage}: ${messageOf(err)}`);
      try {
        await target.discard(storage);
      } catch {
        // The image is still in the store, which is what matters.
      }
    }
  }

  const warnings: string[] = [];
  if (failed.length > 0) {
    warnings.push(
      `${failed.length} database(s) could not be moved out of the IndexedDB fallback store and were ` +
        `left there (${problems.join('; ')}). They will be retried on the next start.`,
    );
  }
  if (conflicts.length > 0) {
    warnings.push(
      `${conflicts.length} database(s) in the IndexedDB fallback store share a name with a database ` +
        `already in this store and were left untouched (${conflicts.join(', ')}). The one in use is ` +
        'the newer of the two; the older copy is still in IndexedDB if you need it.',
    );
  }
  return { promoted, conflicts, failed, ...(warnings.length > 0 ? { warning: warnings.join(' ') } : {}) };
}
