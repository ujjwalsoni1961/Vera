/**
 * Session auth for the Vera operator console.
 *
 * Demo deployment: a single Takapulpetti Oy operator account, validated
 * server-side and carried in a signed HttpOnly cookie. Uses Web Crypto only
 * so the same code runs in the Edge middleware and Node route handlers.
 */

export const SESSION_COOKIE = "vera_session";
export const SESSION_MAX_AGE_S = 60 * 60 * 24 * 30; // 30 days

const AUTH_SECRET =
  process.env.AUTH_SECRET ?? "vera-tkp-3589366-2-demo-secret";

/** Operator accounts for this workspace (env-overridable). */
const ACCOUNTS: Record<string, string> = {
  [process.env.VERA_LOGIN_EMAIL ?? "valle@outlook.com"]:
    process.env.VERA_LOGIN_PASSWORD ?? "Admin123!",
};

export function checkCredentials(email: string, password: string): boolean {
  const expected = ACCOUNTS[email.trim().toLowerCase()];
  return typeof expected === "string" && timingSafeEqualStr(expected, password);
}

function timingSafeEqualStr(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  if (ab.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i];
  return diff === 0;
}

function b64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): Uint8Array | null {
  try {
    const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
    const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}

async function hmac(payload: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(AUTH_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  return new Uint8Array(sig);
}

/** Create a signed session token: b64url(email|exp).b64url(sig) */
export async function createSessionToken(email: string): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_S;
  const payload = `${email.trim().toLowerCase()}|${exp}`;
  const sig = await hmac(payload);
  return `${b64url(new TextEncoder().encode(payload))}.${b64url(sig)}`;
}

/** Verify a session token. Returns the email if valid, otherwise null. */
export async function verifySessionToken(
  token: string | undefined,
): Promise<string | null> {
  if (!token) return null;
  const [p64, s64] = token.split(".");
  if (!p64 || !s64) return null;
  const payloadBytes = b64urlDecode(p64);
  const sigBytes = b64urlDecode(s64);
  if (!payloadBytes || !sigBytes) return null;
  const payload = new TextDecoder().decode(payloadBytes);
  const expected = await hmac(payload);
  if (expected.length !== sigBytes.length) return null;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected[i] ^ sigBytes[i];
  if (diff !== 0) return null;
  const [email, expStr] = payload.split("|");
  const exp = Number(expStr);
  if (!email || !Number.isFinite(exp) || exp < Date.now() / 1000) return null;
  return email;
}
