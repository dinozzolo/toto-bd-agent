import { existsSync, writeFileSync, readFileSync, unlinkSync } from 'fs';
import { join } from 'path';

const PID_FILE = join(process.cwd(), 'data', 'toto.pid');

export function acquireLock() {
  try {
    if (existsSync(PID_FILE)) {
      const pid = parseInt(readFileSync(PID_FILE, 'utf8'));
      try {
        // Check if process is still running
        process.kill(pid, 0);
        console.log(`[Lock] Another instance is running (PID: ${pid}), exiting`);
        return false;
      } catch (e) {
        // Process not running, stale lock
        console.log('[Lock] Stale lock found, removing');
        unlinkSync(PID_FILE);
      }
    }
    
    // Write current PID
    writeFileSync(PID_FILE, process.pid.toString());
    
    // Verify we got the lock
    const written = readFileSync(PID_FILE, 'utf8');
    if (written !== process.pid.toString()) {
      console.log('[Lock] Lock contention, exiting');
      return false;
    }
    
    return true;
  } catch (e) {
    console.error('[Lock] Error:', e.message);
    return false;
  }
}

export function releaseLock() {
  try {
    if (existsSync(PID_FILE)) {
      const pid = readFileSync(PID_FILE, 'utf8');
      if (pid === process.pid.toString()) {
        unlinkSync(PID_FILE);
        console.log('[Lock] Released');
      }
    }
  } catch (e) {}
}
