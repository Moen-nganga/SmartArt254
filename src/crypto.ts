export interface Identity {
  privateKey: CryptoKey;
  publicKey: string;
}

export interface Recipient {
  userId: number;
  publicKey: string;
}

export interface WrappedKey {
  iv: string;
  key: string;
}

export interface EncryptedPayload {
  senderKey: string;
  iv: string;
  ciphertext: string;
  wrapped: Record<string, WrappedKey>;
}

export interface IncomingMessage {
  senderKey: string;
  iv: string;
  ciphertext: string;
  wrapped: WrappedKey | null;
}

const DB_NAME = "smartart254-chat";
const STORE = "identities";
const curve = { name: "ECDH", namedCurve: "P-256" } as const;
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const pending = new Map<number, Promise<Identity>>();
const sharedCache = new WeakMap<CryptoKey, Map<string, Promise<CryptoKey>>>();

function toB64(data: ArrayBuffer | Uint8Array) {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  let out = "";
  bytes.forEach((b) => {
    out += String.fromCharCode(b);
  });
  return btoa(out);
}

function fromB64(value: string) {
  return Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readPair(userId: number): Promise<CryptoKeyPair | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE).objectStore(STORE).get(userId);
    request.onsuccess = () => resolve((request.result as CryptoKeyPair | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });
}

async function writePair(userId: number, pair: CryptoKeyPair) {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(pair, userId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadIdentity(userId: number): Promise<Identity> {
  let pair = await readPair(userId);
  if (!pair) {
    pair = await crypto.subtle.generateKey(curve, false, ["deriveBits"]);
    await writePair(userId, pair);
  }
  const raw = await crypto.subtle.exportKey("raw", pair.publicKey);
  return { privateKey: pair.privateKey, publicKey: toB64(raw) };
}

export function ensureIdentity(userId: number): Promise<Identity> {
  let existing = pending.get(userId);
  if (!existing) {
    existing = loadIdentity(userId).catch((error) => {
      pending.delete(userId);
      throw error;
    });
    pending.set(userId, existing);
  }
  return existing;
}

async function deriveShared(privateKey: CryptoKey, peerPublic: string) {
  const peer = await crypto.subtle.importKey("raw", fromB64(peerPublic), curve, false, []);
  const bits = await crypto.subtle.deriveBits({ name: "ECDH", public: peer }, privateKey, 256);
  const material = await crypto.subtle.importKey("raw", bits, "HKDF", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new Uint8Array(32),
      info: encoder.encode("smartart254-chat-v1"),
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

function sharedKey(privateKey: CryptoKey, peerPublic: string) {
  let perKey = sharedCache.get(privateKey);
  if (!perKey) {
    perKey = new Map();
    sharedCache.set(privateKey, perKey);
  }
  const cache = perKey;
  let found = cache.get(peerPublic);
  if (!found) {
    found = deriveShared(privateKey, peerPublic);
    cache.set(peerPublic, found);
    found.catch(() => cache.delete(peerPublic));
  }
  return found;
}

export async function encryptMessage(
  identity: Identity,
  text: string,
  recipients: Recipient[],
): Promise<EncryptedPayload> {
  const messageKey = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, messageKey, encoder.encode(text));
  const rawKey = await crypto.subtle.exportKey("raw", messageKey);

  const entries = await Promise.all(
    recipients.map(async (recipient) => {
      const wrapKey = await sharedKey(identity.privateKey, recipient.publicKey);
      const wrapIv = crypto.getRandomValues(new Uint8Array(12));
      const sealed = await crypto.subtle.encrypt({ name: "AES-GCM", iv: wrapIv }, wrapKey, rawKey);
      return [String(recipient.userId), { iv: toB64(wrapIv), key: toB64(sealed) }] as const;
    }),
  );
  const wrapped: Record<string, WrappedKey> = Object.fromEntries(entries);

  return {
    senderKey: identity.publicKey,
    iv: toB64(iv),
    ciphertext: toB64(ciphertext),
    wrapped,
  };
}

export async function decryptMessage(identity: Identity, message: IncomingMessage): Promise<string | null> {
  if (!message.wrapped) return null;
  try {
    const wrapKey = await sharedKey(identity.privateKey, message.senderKey);
    const rawKey = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromB64(message.wrapped.iv) },
      wrapKey,
      fromB64(message.wrapped.key),
    );
    const messageKey = await crypto.subtle.importKey("raw", rawKey, "AES-GCM", false, ["decrypt"]);
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromB64(message.iv) },
      messageKey,
      fromB64(message.ciphertext),
    );
    return decoder.decode(plain);
  } catch {
    return null;
  }
}