import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../src/services/password.service';

describe('password.service — hashPassword & verifyPassword', () => {
  it('hashes a password with salt format <salt>:<hex>', () => {
    const hash = hashPassword('mySecurePassword123');
    expect(hash).toContain(':');
    const [salt, keyHex] = hash.split(':');
    expect(salt.length).toBe(32); // 16 bytes in hex
    expect(keyHex.length).toBe(128); // 64 bytes in hex
  });

  it('generates different hashes for the same password due to unique salt', () => {
    const hash1 = hashPassword('samePassword');
    const hash2 = hashPassword('samePassword');
    expect(hash1).not.toEqual(hash2);
  });

  it('correctly verifies a valid password against its hash', () => {
    const password = 'SuperSecretPassword!';
    const hash = hashPassword(password);
    expect(verifyPassword(password, hash)).toBe(true);
  });

  it('rejects an incorrect password', () => {
    const hash = hashPassword('CorrectPassword');
    expect(verifyPassword('WrongPassword', hash)).toBe(false);
  });

  it('safely returns false for malformed or empty hash strings', () => {
    expect(verifyPassword('password', '')).toBe(false);
    expect(verifyPassword('password', 'not-a-valid-hash')).toBe(false);
    expect(verifyPassword('password', 'salt-only:')).toBe(false);
  });
});
