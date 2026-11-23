import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";

const MASTER_KEY_ALIAS = "4all_seguridad_master_key_v1";

// Compact 128-word curated list (zero external packages, ultra-lightweight)
const PASSPHRASE_WORDS = [
  "sol", "luna", "mar", "rio", "nube", "roca", "fuego", "viento",
  "tigre", "puma", "lobo", "oso", "aguila", "halcon", "zorro", "ciervo",
  "cedro", "pino", "roble", "palma", "bosque", "valle", "cumbre", "isla",
  "puente", "torre", "faro", "puerto", "barco", "vela", "ancla", "brujula",
  "estrella", "cometa", "orbita", "aurora", "trueno", "rayo", "lluvia", "nieve",
  "cristal", "ambar", "jade", "rubi", "perla", "acero", "cobre", "plata",
  "musica", "ritmo", "piano", "flauta", "cuerda", "verso", "libro", "pluma",
  "cafe", "cacao", "miel", "trigo", "olivo", "limon", "mango", "cereza",
  "norte", "sur", "este", "oeste", "alba", "ocaso", "tarde", "noche",
  "clave", "escudo", "llave", "sello", "pulso", "rayo", "eco", "onda",
  "atlas", "delta", "omega", "sigma", "vector", "prisma", "foco", "lente",
  "coral", "duna", "glaciar", "volcan", "laguna", "cascada", "sendero", "prado",
  "arena", "brisa", "clima", "tiempo", "ciclo", "etapa", "meta", "rumbo",
  "taller", "forja", "molino", "telar", "canto", "danza", "trazo", "lienzo",
  "bambu", "loto", "menta", "salvia", "canela", "clavo", "vainilla", "romero",
  "cielo", "tierra", "agua", "aire", "vida", "fuerza", "calma", "paz",
];

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

export function generateMemorablePassphrase(
  wordCount = 4,
  includeNumber = true,
  separator = "-",
): string {
  const bytes = Crypto.getRandomBytes((wordCount + 1) * 4);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const chosen: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    const idx = view.getUint32(i * 4, false) % PASSPHRASE_WORDS.length;
    chosen.push(PASSPHRASE_WORDS[idx]);
  }
  if (includeNumber) {
    const num = (view.getUint32(wordCount * 4, false) % 900) + 100;
    chosen.push(String(num));
  }
  return chosen.join(separator);
}

async function getDeviceMasterKey(): Promise<string> {
  let keyHex = await SecureStore.getItemAsync(MASTER_KEY_ALIAS);
  if (!keyHex) {
    keyHex = bytesToHex(Crypto.getRandomBytes(32));
    await SecureStore.setItemAsync(MASTER_KEY_ALIAS, keyHex);
  }
  return keyHex;
}

async function deriveKeystream(
  secretHex: string,
  nonceHex: string,
  length: number,
): Promise<Uint8Array> {
  const stream = new Uint8Array(length);
  let offset = 0;
  let counter = 0;
  while (offset < length) {
    const blockHex = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${secretHex}:${nonceHex}:${counter}`,
    );
    const blockBytes = hexToBytes(blockHex);
    const take = Math.min(blockBytes.length, length - offset);
    stream.set(blockBytes.subarray(0, take), offset);
    offset += take;
    counter++;
  }
  return stream;
}

export async function encryptWithKey(
  plaintext: string,
  secretHex: string,
): Promise<{ nonce: string; ciphertext: string; mac: string }> {
  const nonce = bytesToHex(Crypto.getRandomBytes(16));
  const plainBytes = utf8ToBytes(plaintext);
  const keystream = await deriveKeystream(secretHex, nonce, plainBytes.length);
  const cipherBytes = new Uint8Array(plainBytes.length);
  for (let i = 0; i < plainBytes.length; i++) {
    cipherBytes[i] = plainBytes[i] ^ keystream[i];
  }
  const ciphertext = bytesToHex(cipherBytes);
  const mac = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${secretHex}:MAC:${nonce}:${ciphertext}`,
  );
  return { nonce, ciphertext, mac };
}

export async function decryptWithKey(
  payload: { nonce: string; ciphertext: string; mac: string },
  secretHex: string,
): Promise<string | null> {
  const expectedMac = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${secretHex}:MAC:${payload.nonce}:${payload.ciphertext}`,
  );
  if (expectedMac !== payload.mac) return null;
  const cipherBytes = hexToBytes(payload.ciphertext);
  const keystream = await deriveKeystream(
    secretHex,
    payload.nonce,
    cipherBytes.length,
  );
  const plainBytes = new Uint8Array(cipherBytes.length);
  for (let i = 0; i < cipherBytes.length; i++) {
    plainBytes[i] = cipherBytes[i] ^ keystream[i];
  }
  return bytesToUtf8(plainBytes);
}

export async function encryptDeviceVault(jsonStr: string): Promise<string> {
  const keyHex = await getDeviceMasterKey();
  const enc = await encryptWithKey(jsonStr, keyHex);
  return JSON.stringify({ v: 1, ...enc });
}

export async function decryptDeviceVault(raw: string): Promise<string | null> {
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.v === 1 && parsed.nonce && parsed.ciphertext && parsed.mac) {
      const keyHex = await getDeviceMasterKey();
      return await decryptWithKey(parsed, keyHex);
    }
    return null;
  } catch {
    return null;
  }
}

async function stretchPassword(
  password: string,
  saltHex: string,
): Promise<string> {
  // Lightweight key stretching (200 rounds SHA-256 — fast on low-end devices)
  let hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${saltHex}:${password}`,
  );
  for (let i = 0; i < 200; i++) {
    hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${hash}:${saltHex}:${i}`,
    );
  }
  return hash;
}

export async function encryptBackupVault(
  jsonStr: string,
  backupPassword: string,
): Promise<string> {
  const salt = bytesToHex(Crypto.getRandomBytes(16));
  const derivedKey = await stretchPassword(backupPassword, salt);
  const enc = await encryptWithKey(jsonStr, derivedKey);
  return JSON.stringify(
    {
      app: "seguridad-4all",
      encrypted: true,
      v: 1,
      salt,
      ...enc,
    },
    null,
    2,
  );
}

export async function decryptBackupVault(
  fileContent: string,
  backupPassword: string,
): Promise<string | null> {
  try {
    const parsed = JSON.parse(fileContent);
    if (
      parsed?.app !== "seguridad-4all" ||
      !parsed?.encrypted ||
      !parsed?.salt ||
      !parsed?.nonce ||
      !parsed?.ciphertext ||
      !parsed?.mac
    ) {
      return null;
    }
    const derivedKey = await stretchPassword(backupPassword, parsed.salt);
    return await decryptWithKey(parsed, derivedKey);
  } catch {
    return null;
  }
}

