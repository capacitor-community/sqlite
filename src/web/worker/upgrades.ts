/**
 * Version upgrade execution, ported from `electron/src/electron-utils/utilsUpgrade.ts`
 * (MIT, this repo) with the same contract: run every registered upgrade whose `toVersion` sits
 * above the database's current `user_version` and at or below the requested version, in
 * ascending order, each inside its own transaction with foreign keys disabled.
 *
 * The electron version takes a file-level backup around the whole ladder and restores it on
 * failure. There is no file copy on tier 1 (the pool owns the file) and no meaningful one on
 * tier 2 either, so the web port takes an in-memory image of the database instead and restores
 * from that, which gives the same all-or-nothing guarantee without touching the VFS.
 */
import { prefixed } from '../errors';
import type { SerializedUpgrade } from '../protocol';

import type { Connection } from './engine';

export interface UpgradeOutcome {
  upgraded: boolean;
  fromVersion: number;
  toVersion: number;
  changes: number;
}

export function sortUpgrades(upgrades: SerializedUpgrade[]): SerializedUpgrade[] {
  return [...upgrades].sort((a, b) => a.toVersion - b.toVersion);
}

/**
 * @param restore called with a pre-upgrade image when the ladder fails partway, so the caller
 *   can put the database back exactly as it was. Omitted for read-only opens.
 */
export function runUpgrades(
  conn: Connection,
  upgrades: SerializedUpgrade[],
  targetVersion: number,
  restore?: (image: Uint8Array) => void,
): UpgradeOutcome {
  const fromVersion = conn.userVersion();
  const pending = sortUpgrades(upgrades).filter((u) => u.toVersion > fromVersion && u.toVersion <= targetVersion);
  if (pending.length === 0) {
    return { upgraded: false, fromVersion, toVersion: fromVersion, changes: 0 };
  }

  for (const upgrade of pending) {
    if (!upgrade.statements || upgrade.statements.length === 0) {
      throw new Error(`onUpgrade: statements not given for version ${upgrade.toVersion}`);
    }
  }

  const backup = restore ? conn.serialize() : undefined;
  let changes = 0;
  let reached = fromVersion;

  try {
    for (const upgrade of pending) {
      conn.setForeignKeyConstraintsEnabled(false);
      try {
        changes += conn.withOptionalTransaction(true, () => {
          let stepChanges = 0;
          for (const statement of upgrade.statements) {
            stepChanges += conn.executeBatch(statement).changes;
          }
          return stepChanges;
        });
        conn.setUserVersion(upgrade.toVersion);
        reached = upgrade.toVersion;
      } finally {
        conn.setForeignKeyConstraintsEnabled(true);
      }
    }
  } catch (err) {
    if (backup && restore) restore(backup);
    throw prefixed('onUpgrade', err);
  }

  return { upgraded: true, fromVersion, toVersion: reached, changes };
}
