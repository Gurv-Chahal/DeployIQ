import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
    const hex = process.env.GITHUB_TOKEN_ENCRYPTION_KEY;
    if (!hex || hex.length !== 64) {
        throw new Error(
            "GITHUB_TOKEN_ENCRYPTION_KEY must be a 64-character hex string (32 bytes). " +
            "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
        );
    }
    return Buffer.from(hex, "hex");
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a base64 string containing: IV + ciphertext + auth tag
 */
export function encrypt(plaintext: string): string {
    const key = getKey();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);

    const encrypted = Buffer.concat([
        cipher.update(plaintext, "utf8"),
        cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    // Pack: IV (12) + encrypted + authTag (16)
    const packed = Buffer.concat([iv, encrypted, authTag]);
    return packed.toString("base64");
}

/**
 * Decrypts a base64 string produced by encrypt().
 */
export function decrypt(packed: string): string {
    const key = getKey();
    const buf = Buffer.from(packed, "base64");

    const iv = buf.subarray(0, IV_LENGTH);
    const authTag = buf.subarray(buf.length - AUTH_TAG_LENGTH);
    const ciphertext = buf.subarray(IV_LENGTH, buf.length - AUTH_TAG_LENGTH);

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
    ]);

    return decrypted.toString("utf8");
}
