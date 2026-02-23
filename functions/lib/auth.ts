// ColdCopy Agent Mode — Auth Library
// Uses Web Crypto API only (Cloudflare Workers compatible)

export interface JWTPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}

export interface AuthUser {
  id: string;
  email: string;
}

// --- Helpers ---

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuf(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

function base64urlEncode(data: Uint8Array | ArrayBuffer): string {
  const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function textToBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}

// --- Public API ---

export function generateId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return bufToHex(bytes.buffer);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    textToBytes(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  return bufToHex(salt.buffer) + ':' + bufToHex(derivedBits);
}

export async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;

  const salt = hexToBuf(saltHex);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    textToBytes(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  const computed = new Uint8Array(derivedBits);
  const expected = hexToBuf(hashHex);

  return timingSafeEqual(computed, expected);
}

export async function createJWT(
  payload: { sub: string; email: string },
  secret: string
): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);

  const fullPayload: JWTPayload = {
    sub: payload.sub,
    email: payload.email,
    iat: now,
    exp: now + 7 * 24 * 60 * 60, // 7 days
  };

  const headerB64 = base64urlEncode(textToBytes(JSON.stringify(header)));
  const payloadB64 = base64urlEncode(textToBytes(JSON.stringify(fullPayload)));
  const signingInput = headerB64 + '.' + payloadB64;

  const key = await crypto.subtle.importKey(
    'raw',
    textToBytes(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    textToBytes(signingInput)
  );

  return signingInput + '.' + base64urlEncode(signature);
}

export async function verifyJWT(
  token: string,
  secret: string
): Promise<JWTPayload | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, signatureB64] = parts;
  const signingInput = headerB64 + '.' + payloadB64;

  try {
    const key = await crypto.subtle.importKey(
      'raw',
      textToBytes(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signature = base64urlDecode(signatureB64);
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      signature,
      textToBytes(signingInput)
    );

    if (!valid) return null;

    const payload: JWTPayload = JSON.parse(
      new TextDecoder().decode(base64urlDecode(payloadB64))
    );

    // Check expiry
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) return null;

    return payload;
  } catch {
    return null;
  }
}

export async function getAuthUser(
  request: Request,
  env: { AGENT_JWT_SECRET: string }
): Promise<AuthUser | null> {
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader
    .split(';')
    .find((c) => c.trim().startsWith('coldcopy_agent='));

  if (!match) return null;

  const token = match.split('=').slice(1).join('=').trim();
  if (!token) return null;

  const payload = await verifyJWT(token, env.AGENT_JWT_SECRET);
  if (!payload) return null;

  return { id: payload.sub, email: payload.email };
}

export function setAuthCookie(response: Response, token: string): Response {
  const newResponse = new Response(response.body, response);
  newResponse.headers.append(
    'Set-Cookie',
    `coldcopy_agent=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`
  );
  return newResponse;
}

export function clearAuthCookie(response: Response): Response {
  const newResponse = new Response(response.body, response);
  newResponse.headers.append(
    'Set-Cookie',
    `coldcopy_agent=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`
  );
  return newResponse;
}
