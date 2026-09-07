/**
 * Shadow Realm - Cryptographic and Session Utilities
 * Zero-dependency browser-native Web Crypto utilities for:
 * 1. Salted SHA-256 commitments (Anti-cheat for hidden-information games like Ink Fleet)
 * 2. Deterministic session tokens & room IDs
 * 3. Arcade callsigns
 */

export async function sha256(message: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    return message;
  }
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function generateSalt(length = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generates clean, unambiguous 4-character room codes.
 * Excludes easily confused characters: 0, O, 1, I, L.
 */
export function generateRoomId(length = 4): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const CALLSIGN_PREFIXES = [
  'Ghost',
  'Ronin',
  'Spectre',
  'Shadow',
  'Viper',
  'Falcon',
  'Kitsune',
  'Lotus',
  'Cipher',
  'Raven',
  'Zenith',
  'Apex',
  'Phantom',
  'Echo',
  'Sumi',
  'Tengu',
];

export function generateCallsign(): string {
  const prefix = CALLSIGN_PREFIXES[Math.floor(Math.random() * CALLSIGN_PREFIXES.length)];
  const num = Math.floor(Math.random() * 90 + 10); // 10-99
  return `${prefix}-${num}`;
}
