import { describe, it, expect } from "vitest";
import { generateLicenseKey, hashLicenseKey, generateKeyPrefix } from "./keygen";
import crypto from "crypto";

describe("License Key Utilities", () => {
  describe("generateLicenseKey", () => {
    it("should generate a key with the correct prefix", () => {
      const key = generateLicenseKey();
      expect(key.startsWith("lic_live_")).toBe(true);
    });

    it("should generate a key of expected length", () => {
      const key = generateLicenseKey();
      // 'lic_live_' (9 chars) + 64 hex characters from 32 bytes = 73 characters
      expect(key).toHaveLength(73);
    });

    it("should generate unique keys", () => {
      const key1 = generateLicenseKey();
      const key2 = generateLicenseKey();
      expect(key1).not.toBe(key2);
    });
  });

  describe("hashLicenseKey", () => {
    it("should produce a valid SHA-256 hash for a given key", () => {
      const rawKey = "lic_live_test1234567890abcdef";
      const expectedHash = crypto.createHash("sha256").update(rawKey).digest("hex");
      
      const hash = hashLicenseKey(rawKey);
      
      expect(hash).toBe(expectedHash);
      expect(hash).toHaveLength(64); // SHA-256 hex is 64 chars
    });

    it("should produce identical hashes for identical keys", () => {
      const rawKey = generateLicenseKey();
      expect(hashLicenseKey(rawKey)).toBe(hashLicenseKey(rawKey));
    });

    it("should produce different hashes for different keys", () => {
      const rawKey1 = generateLicenseKey();
      const rawKey2 = generateLicenseKey();
      expect(hashLicenseKey(rawKey1)).not.toBe(hashLicenseKey(rawKey2));
    });
  });

  describe("generateKeyPrefix", () => {
    it("should mask a valid license key correctly", () => {
      const rawKey = "lic_live_1234567890abcdef1234567890abcdef";
      const prefix = generateKeyPrefix(rawKey);
      
      // Expected: First 12 chars ("lic_live_123") + "..." + last 6 chars ("abcdef")
      expect(prefix).toBe("lic_live_123...abcdef");
    });

    it("should return the key unmodified if it is too short", () => {
      const shortKey = "lic_live_short";
      const prefix = generateKeyPrefix(shortKey);
      
      expect(prefix).toBe(shortKey);
    });

    it("should handle undefined or null keys gracefully", () => {
      // @ts-expect-error - testing invalid input
      expect(generateKeyPrefix(null)).toBe(null);
      // @ts-expect-error - testing invalid input
      expect(generateKeyPrefix(undefined)).toBe(undefined);
      expect(generateKeyPrefix("")).toBe("");
    });
  });
});
