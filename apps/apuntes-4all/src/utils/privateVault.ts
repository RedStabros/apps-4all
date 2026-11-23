import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";

const MASTER_KEY_ALIAS = "4all_apuntes_private_master_key_v1";
const ENC_PREFIX = "ENC_V1:";

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return out;
}

function utf8ToBytes(str: string): Uint8Array {
  const encoded = encodeURIComponent(str);
  const bytes: number[] = [];
  for (let i = 0; i < encoded.length; i++) {
    if (encoded[i] === "%") {
      bytes.push(parseInt(encoded.substr(i + 1, 2), 16));
      i += 2;
    } else {
      bytes.push(encoded.charCodeAt(i));
    }
  }
  return new Uint8Array(bytes);
}

function bytesToUtf8(bytes: Uint8Array): string {
  let encoded = "";
  for (let i = 0; i < bytes.length; i++) {
    encoded += "%" + bytes[i].toString(16).padStart(2, "0");
  }
  return decodeURIComponent(encoded);
}

/**
 * Retrieves or generates a hardware-backed 256-bit master key stored in
 * Android Keystore / iOS Keychain via expo-secure-store.
 */
async function getMasterKeyHex(): Promise<string> {
  let keyHex = await SecureStore.getItemAsync(MASTER_KEY_ALIAS);
  if (!keyHex) {
    const raw = Crypto.getRandomBytes(32);
    keyHex = bytesToHex(raw);
    await SecureStore.setItemAsync(MASTER_KEY_ALIAS, keyHex);
  }
  return keyHex;
}

/**
 * Generates a deterministic SHA-256 counter-mode keystream for arbitrary payload lengths
 * (avoids Android SecureStore 2KB per-key limit while keeping key in hardware Keystore).
 */
async function deriveKeystream(
  keyHex: string,
  nonceHex: string,
  length: number,
): Promise<Uint8Array> {
  const stream = new Uint8Array(length);
  let offset = 0;
  let counter = 0;
  while (offset < length) {
    const blockHex = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${keyHex}:${nonceHex}:${counter}`,
    );
    const blockBytes = hexToBytes(blockHex);
    const take = Math.min(blockBytes.length, length - offset);
    stream.set(blockBytes.subarray(0, take), offset);
    offset += take;
    counter++;
  }
  return stream;
}

export function isEncryptedPayload(value: string): boolean {
  return typeof value === "string" && value.startsWith(ENC_PREFIX);
}

export async function encryptPrivateText(plaintext: string): Promise<string> {
  if (!plaintext) return "";
  if (isEncryptedPayload(plaintext)) return plaintext;
  const keyHex = await getMasterKeyHex();
  const nonceHex = bytesToHex(Crypto.getRandomBytes(16));
  const plainBytes = utf8ToBytes(plaintext);
  const keystream = await deriveKeystream(keyHex, nonceHex, plainBytes.length);
  const cipherBytes = new Uint8Array(plainBytes.length);
  for (let i = 0; i < plainBytes.length; i++) {
    cipherBytes[i] = plainBytes[i] ^ keystream[i];
  }
  return `${ENC_PREFIX}${nonceHex}:${bytesToHex(cipherBytes)}`;
}

export async function decryptPrivateText(payload: string): Promise<string> {
  if (!payload || !isEncryptedPayload(payload)) return payload || "";
  try {
    const body = payload.slice(ENC_PREFIX.length);
    const sep = body.indexOf(":");
    if (sep === -1) return payload;
    const nonceHex = body.slice(0, sep);
    const cipherHex = body.slice(sep + 1);
    const keyHex = await getMasterKeyHex();
    const cipherBytes = hexToBytes(cipherHex);
    const keystream = await deriveKeystream(keyHex, nonceHex, cipherBytes.length);
    const plainBytes = new Uint8Array(cipherBytes.length);
    for (let i = 0; i < cipherBytes.length; i++) {
      plainBytes[i] = cipherBytes[i] ^ keystream[i];
    }
    return bytesToUtf8(plainBytes);
  } catch {
    return "";
  }
}

