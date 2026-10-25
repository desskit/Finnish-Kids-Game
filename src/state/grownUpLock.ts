// The grown-ups' password: set once, then asked for at the door of the
// grown-up area. Only a salted SHA-256 hash is kept (in the saved settings), so
// the password itself is never stored. Not real security — the saved data
// lives on this device — but a door a child can't open by doing a sum.

/** What the settings keep: a random salt and the hash of salt + password. */
export interface GrownUpLock {
  salt: string;
  hash: string;
}

/** The shortest password accepted. */
export const MIN_PASSWORD_LENGTH = 4;

const hex = (bytes: ArrayBuffer | Uint8Array) =>
  [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');

async function digest(salt: string, password: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  // SHA-256 needs a secure page (https or localhost). Opened over plain http
  // (a phone on the home network), fall back to a simple hash instead of failing.
  if (!globalThis.crypto?.subtle) return `fnv:${fnv(data)}`;
  return hex(await crypto.subtle.digest('SHA-256', data));
}

/** FNV-1a, run four ways: a plain fallback hash (not cryptographic). */
function fnv(data: Uint8Array): string {
  return [0x811c9dc5, 0x01000193, 0x9e3779b9, 0x85ebca6b]
    .map((seed) => {
      let h = seed >>> 0;
      for (const b of data) h = Math.imul(h ^ b, 0x01000193) >>> 0;
      return h.toString(16).padStart(8, '0');
    })
    .join('');
}

/** Random salt bytes (getRandomValues works on any page; Math.random only if it's missing). */
function randomBytes(n: number): Uint8Array {
  const out = new Uint8Array(n);
  if (globalThis.crypto?.getRandomValues) return globalThis.crypto.getRandomValues(out);
  for (let i = 0; i < n; i++) out[i] = Math.floor(Math.random() * 256);
  return out;
}

/** A new lock for this password. */
export async function makeLock(password: string): Promise<GrownUpLock> {
  const salt = hex(randomBytes(16));
  return { salt, hash: await digest(salt, password) };
}

/** Does this password open the lock? */
export async function opensLock(lock: GrownUpLock, password: string): Promise<boolean> {
  return (await digest(lock.salt, password)) === lock.hash;
}

/** Why a new password can't be used, or null if it can. */
export function passwordProblem(password: string, again: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  if (password !== again) return "The two passwords don't match.";
  return null;
}
