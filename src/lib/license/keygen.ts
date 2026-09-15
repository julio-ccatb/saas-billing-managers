import crypto from "crypto";

/**
 * Generates a cryptographically secure, high-entropy API key for license verification.
 * Format: lic_live_[64 hex characters]
 */
export function generateLicenseKey(): string {
  const randomHex = crypto.randomBytes(32).toString("hex");
  return `lic_live_${randomHex}`;
}

/**
 * Generates a SHA-256 hash of the raw license key for secure storage.
 */
export function hashLicenseKey(rawKey: string): string {
  return crypto.createHash("sha256").update(rawKey).digest("hex");
}

/**
 * Generates a masked prefix (e.g. lic_live_...9f2a) for DB storage and UI display.
 */
export function generateKeyPrefix(key: string): string {
  if (!key || key.length < 16) return key;
  return `${key.slice(0, 12)}...${key.slice(-6)}`;
}
