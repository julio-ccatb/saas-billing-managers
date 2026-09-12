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
 * Formats a license key for display (e.g. lic_live_...9f2a)
 */
export function maskLicenseKey(key: string): string {
  if (!key || key.length < 16) return key;
  return `${key.slice(0, 12)}...${key.slice(-6)}`;
}
