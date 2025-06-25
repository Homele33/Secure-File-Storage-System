import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits

// Get encryption key from environment or generate one
function getEncryptionKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }
  if (keyHex.length !== KEY_LENGTH * 2) {
    throw new Error(`ENCRYPTION_KEY must be ${KEY_LENGTH * 2} hex characters`);
  }
  return Buffer.from(keyHex, 'hex');
}

export interface EncryptionResult {
  encrypted: Buffer;
  iv: Buffer;
  authTag: Buffer;
}

export class EncryptionService {
  private static key = getEncryptionKey();

  static encrypt(buffer: Buffer): EncryptionResult {
    try {
      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipher(ALGORITHM, this.key);
      cipher.setAAD(Buffer.from('file-encryption-v1', 'utf8'));
      
      const encrypted = Buffer.concat([
        cipher.update(buffer),
        cipher.final()
      ]);
      
      const authTag = cipher.getAuthTag();
      
      return { encrypted, iv, authTag };
    } catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static decrypt(encrypted: Buffer, iv: Buffer, authTag: Buffer): Buffer {
    try {
      const decipher = crypto.createDecipher(ALGORITHM, this.key);
      decipher.setAAD(Buffer.from('file-encryption-v1', 'utf8'));
      decipher.setAuthTag(authTag);
      
      return Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static generateHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  static generateSecureFilename(): string {
    const timestamp = Date.now().toString();
    const random = crypto.randomBytes(16).toString('hex');
    return `${timestamp}-${random}`;
  }
}