const crypto = require('crypto');

// ============================================================
// TOKEN CRYPTO
// Purpose: AES-256-GCM encrypt/decrypt for Google OAuth tokens stored at rest
// Key: GOOGLE_TOKEN_ENCRYPTION_KEY env var — 64 hex chars (32 bytes)
//      Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
// If key is not set: no-op (tokens stored as plaintext — acceptable in local dev)
// If stored value has no 'enc:' prefix: treated as legacy plaintext — decrypted as-is
// ============================================================

const ALGO = 'aes-256-gcm';

function getKey() {
    const k = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;
    if (!k) return null;
    return Buffer.from(k, 'hex');
}

/**
 * Encrypt a plaintext string.
 * Returns 'enc:<ivHex>:<tagHex>:<ciphertextHex>' or the original value if no key is set.
 */
function encrypt(plaintext) {
    const key = getKey();
    if (!key || !plaintext) return plaintext;
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGO, key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `enc:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypt an encrypted token string.
 * Returns plaintext, or the original value if no key is set or if the value is not encrypted.
 */
function decrypt(ciphertext) {
    if (!ciphertext) return null;
    if (!ciphertext.startsWith('enc:')) return ciphertext; // legacy plaintext — pass through
    const key = getKey();
    if (!key) return ciphertext;
    const [ivHex, tagHex, encHex] = ciphertext.slice(4).split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const enc = Buffer.from(encHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}

module.exports = { encrypt, decrypt };
