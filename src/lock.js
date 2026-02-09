import { existsSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';

const LOCK_FILE = join(process.cwd(), 'data', 'toto.lock');

export function acquireLock() {
  if (existsSync(LOCK_FILE)) {
    const lockTime = parseInt(readFileSync(LOCK_FILE, 'utf8'));
    if (Date.now() - lockTime < 300000) { // 5 min stale lock protection
      console.log('[Lock] Another instance is running, exiting');
      return false;
    }
  }
  writeFileSync(LOCK_FILE, Date.now().toString());
  return true;
}

export function releaseLock() {
  try {
    if (existsSync(LOCK_FILE)) {
      unlinkSync(LOCK_FILE);
    }
  } catch (e) {}
}

import { readFileSync } from 'fs';
