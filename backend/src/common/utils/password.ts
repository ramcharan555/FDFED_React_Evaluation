import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
export function hashPassword(value: string) { const salt = randomBytes(16).toString('hex'); return `scrypt$${salt}$${scryptSync(value, salt, 64).toString('hex')}`; }
export function verifyPassword(value: string, stored: string) {
  if (!stored.startsWith('scrypt$')) return value === stored;
  const [, salt, digest] = stored.split('$');
  if (!salt || !digest) return false;
  const expected = Buffer.from(digest, 'hex'), actual = scryptSync(value, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
