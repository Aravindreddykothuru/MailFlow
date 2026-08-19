import crypto from 'crypto';

// ─── Password Service ─────────────────────────────────────────────────────────
// Uses Node.js crypto.scrypt with cryptographically secure random salt.
// Format stored: `<salt>:<derivedKeyHex>`

const KEY_LEN = 64;

/**
 * Hashes a plaintext password using scrypt and a unique 16-byte random salt.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, KEY_LEN);
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Verifies a plaintext password against a stored `<salt>:<derivedKeyHex>` string.
 * Uses timingSafeEqual to prevent timing attacks.
 */
export function verifyPassword(password: string, combinedHash: string): boolean {
  try {
    const [salt, keyHex] = combinedHash.split(':');
    if (!salt || !keyHex) return false;

    const keyBuffer = Buffer.from(keyHex, 'hex');
    const derivedKey = crypto.scryptSync(password, salt, keyBuffer.length);

    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}
