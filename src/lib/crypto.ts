import crypto from "crypto";

const algorithm = "aes-256-cbc";
const key = Buffer.from(process.env.ENCRYPTION_KEY!, "hex"); // 32 bytes

if (key.length !== 32) {
  throw new Error(`ENCRYPTION_KEY must be 32 bytes (got ${key.length})`);
}

export function encryptBuffer(buffer: Buffer): {
  encrypted: Buffer;
  iv: string;
} {
  const iv = crypto.randomBytes(16); // 16-byte IV
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return { encrypted, iv: iv.toString("base64") };
}

export function decryptBuffer(encrypted: Buffer, ivBase64: string): Buffer {
  const iv = Buffer.from(ivBase64, "base64");
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}
