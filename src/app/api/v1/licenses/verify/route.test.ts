import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import crypto from "crypto";
import { cleanDomain, isDomainAllowed } from "~/features/licenses/server/domainValidation";
import { GET, POST } from "./route";
import { db } from "~/server/db";

// Mock the database
vi.mock("~/server/db", () => ({
  db: {
    license: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("Domain Validation & License Verification Route", () => {
  describe("cleanDomain", () => {
    it("should return null for null, undefined, or empty string", () => {
      expect(cleanDomain(null)).toBeNull();
      expect(cleanDomain(undefined)).toBeNull();
      expect(cleanDomain("")).toBeNull();
      expect(cleanDomain("   ")).toBeNull();
    });

    it("should extract hostname and strip www prefix", () => {
      expect(cleanDomain("https://www.example.com/path")).toBe("example.com");
      expect(cleanDomain("http://www.client.app:3000/api")).toBe("client.app");
      expect(cleanDomain("www.sub.example.com")).toBe("sub.example.com");
      expect(cleanDomain("client.app")).toBe("client.app");
    });

    it("should lowercase domains", () => {
      expect(cleanDomain("HTTPS://APP.CLIENT.COM")).toBe("app.client.com");
      expect(cleanDomain("MyDomain.Com")).toBe("mydomain.com");
    });
  });

  describe("isDomainAllowed", () => {
    it("should allow any incoming domain if allowedConfiguredDomain is not set", () => {
      expect(isDomainAllowed("client.com", null)).toBe(true);
      expect(isDomainAllowed("client.com", "")).toBe(true);
      expect(isDomainAllowed("client.com", undefined)).toBe(true);
      expect(isDomainAllowed(null, null)).toBe(true);
    });

    it("should reject if allowedDomain is configured but incoming domain is missing", () => {
      expect(isDomainAllowed(null, "client.com")).toBe(false);
      expect(isDomainAllowed("", "client.com")).toBe(false);
      expect(isDomainAllowed(undefined, "client.com")).toBe(false);
    });

    it("should allow exact domain match", () => {
      expect(isDomainAllowed("client.com", "client.com")).toBe(true);
      expect(isDomainAllowed("https://client.com:8080", "client.com")).toBe(true);
      expect(isDomainAllowed("app.client.com", "app.client.com")).toBe(true);
      expect(isDomainAllowed("www.client.com", "client.com")).toBe(true);
    });

    it("should allow legitimate subdomains of the allowed domain", () => {
      expect(isDomainAllowed("app.client.com", "client.com")).toBe(true);
      expect(isDomainAllowed("api.v1.client.com", "client.com")).toBe(true);
      expect(isDomainAllowed("staging.app.client.com", "app.client.com")).toBe(true);
    });

    it("should prevent suffix collision spoofing (evilclient.com should NOT match client.com)", () => {
      expect(isDomainAllowed("evilclient.com", "client.com")).toBe(false);
      expect(isDomainAllowed("notclient.com", "client.com")).toBe(false);
      expect(isDomainAllowed("attackerclient.com", "client.com")).toBe(false);
      expect(isDomainAllowed("client.com.attacker.com", "client.com")).toBe(false);
    });

    it("should reject unrelated domains", () => {
      expect(isDomainAllowed("google.com", "client.com")).toBe(false);
      expect(isDomainAllowed("otherapp.com", "client.com")).toBe(false);
    });

    it("should reject parent domain if only a specific subdomain is allowed", () => {
      expect(isDomainAllowed("client.com", "app.client.com")).toBe(false);
    });
  });

  describe("HTTP Route Handlers (GET and POST)", () => {
    const rawKey = "lic_live_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const hashedKey = crypto.createHash("sha256").update(rawKey).digest("hex");

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("should reject missing license key with 400", async () => {
      const req = new NextRequest("http://localhost:3000/api/v1/licenses/verify");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.active).toBe(false);
      expect(data.error).toContain("License key is required");
    });

    it("should return 401 when key is invalid or not found", async () => {
      vi.mocked(db.license.findUnique).mockResolvedValue(null);

      const req = new NextRequest("http://localhost:3000/api/v1/licenses/verify", {
        headers: {
          authorization: `Bearer ${rawKey}`,
        },
      });
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.active).toBe(false);
      expect(data.status).toBe("REVOKED");
    });

    it("should return 401 if license is REVOKED", async () => {
      vi.mocked(db.license.findUnique).mockResolvedValue({
        id: "lic-1",
        name: "Test App",
        status: "REVOKED",
        allowedDomain: null,
        companyId: "comp-1",
        userId: "user-1",
        customerId: null,
        keyHash: hashedKey,
        keyPrefix: "lic_live_123...",
        suspensionNotice: null,
        leaseTtlMinutes: 60,
        gracePeriodHours: 3,
        lastCheckedAt: null,
        lastCheckedIp: null,
        checkCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        customer: null,
      } as any);

      const req = new NextRequest("http://localhost:3000/api/v1/licenses/verify", {
        headers: {
          "x-api-key": rawKey,
        },
      });
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.active).toBe(false);
      expect(data.status).toBe("REVOKED");
    });

    it("should return 403 DOMAIN_MISMATCH when origin domain does not match allowedDomain", async () => {
      vi.mocked(db.license.findUnique).mockResolvedValue({
        id: "lic-1",
        name: "Test App",
        status: "ACTIVE",
        allowedDomain: "clientapp.com",
        companyId: "comp-1",
        userId: "user-1",
        customerId: null,
        keyHash: hashedKey,
        keyPrefix: "lic_live_123...",
        suspensionNotice: null,
        leaseTtlMinutes: 60,
        gracePeriodHours: 3,
        lastCheckedAt: null,
        lastCheckedIp: null,
        checkCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        customer: null,
      } as any);

      const req = new NextRequest("http://localhost:3000/api/v1/licenses/verify", {
        headers: {
          authorization: `Bearer ${rawKey}`,
          "x-origin-domain": "evilclientapp.com",
        },
      });
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.active).toBe(false);
      expect(data.status).toBe("DOMAIN_MISMATCH");
      expect(data.reason).toContain("does not match authorized domain 'clientapp.com'");
    });

    it("should return 403 DOMAIN_MISMATCH when allowedDomain is configured but caller provides no domain", async () => {
      vi.mocked(db.license.findUnique).mockResolvedValue({
        id: "lic-1",
        name: "Test App",
        status: "ACTIVE",
        allowedDomain: "clientapp.com",
        companyId: "comp-1",
        userId: "user-1",
        customerId: null,
        keyHash: hashedKey,
        keyPrefix: "lic_live_123...",
        suspensionNotice: null,
        leaseTtlMinutes: 60,
        gracePeriodHours: 3,
        lastCheckedAt: null,
        lastCheckedIp: null,
        checkCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        customer: null,
      } as any);

      const req = new NextRequest("http://localhost:3000/api/v1/licenses/verify", {
        headers: {
          authorization: `Bearer ${rawKey}`,
        },
      });
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.active).toBe(false);
      expect(data.status).toBe("DOMAIN_MISMATCH");
      expect(data.reason).toContain("Origin domain is required");
    });

    it("should succeed with active: true when origin matches configured allowedDomain (GET with x-origin-domain)", async () => {
      vi.mocked(db.license.findUnique).mockResolvedValue({
        id: "lic-1",
        name: "Client Production App",
        status: "ACTIVE",
        allowedDomain: "clientapp.com",
        companyId: "comp-1",
        userId: "user-1",
        customerId: "cust-1",
        keyHash: hashedKey,
        keyPrefix: "lic_live_123...",
        suspensionNotice: null,
        leaseTtlMinutes: 60,
        gracePeriodHours: 3,
        lastCheckedAt: null,
        lastCheckedIp: null,
        checkCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        customer: {
          name: "Acme Corp",
          email: "billing@acme.com",
        },
      } as any);
      vi.mocked(db.license.update).mockResolvedValue({} as any);

      const req = new NextRequest("http://localhost:3000/api/v1/licenses/verify", {
        headers: {
          authorization: `Bearer ${rawKey}`,
          "x-origin-domain": "https://dashboard.clientapp.com",
        },
      });
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.active).toBe(true);
      expect(data.status).toBe("ACTIVE");
      expect(data.serviceName).toBe("Client Production App");
      expect(data.customerName).toBe("Acme Corp");
      expect(data.leaseExpiresAt).toBeDefined();

      // Check DB telemetry update was called
      expect(db.license.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "lic-1" },
          data: expect.objectContaining({
            checkCount: { increment: 1 },
          }),
        })
      );
    });

    it("should succeed with active: true when called via POST with body originDomain", async () => {
      vi.mocked(db.license.findUnique).mockResolvedValue({
        id: "lic-1",
        name: "Client Mobile Backend",
        status: "ACTIVE",
        allowedDomain: "api.clientapp.com",
        companyId: "comp-1",
        userId: "user-1",
        customerId: null,
        keyHash: hashedKey,
        keyPrefix: "lic_live_123...",
        suspensionNotice: null,
        leaseTtlMinutes: 120,
        gracePeriodHours: 6,
        lastCheckedAt: null,
        lastCheckedIp: null,
        checkCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        customer: null,
      } as any);
      vi.mocked(db.license.update).mockResolvedValue({} as any);

      const req = new NextRequest("http://localhost:3000/api/v1/licenses/verify", {
        method: "POST",
        body: JSON.stringify({
          key: rawKey,
          originDomain: "api.clientapp.com",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.active).toBe(true);
      expect(data.status).toBe("ACTIVE");
      expect(data.nextCheckInSeconds).toBe(120 * 60);
    });

    it("should return SUSPENDED with 200 and active: false when license is SUSPENDED", async () => {
      vi.mocked(db.license.findUnique).mockResolvedValue({
        id: "lic-1",
        name: "Client SaaS",
        status: "SUSPENDED",
        allowedDomain: "client.com",
        companyId: "comp-1",
        userId: "user-1",
        customerId: null,
        keyHash: hashedKey,
        keyPrefix: "lic_live_123...",
        suspensionNotice: "Account suspended due to overdue invoice #INV-001.",
        leaseTtlMinutes: 60,
        gracePeriodHours: 3,
        lastCheckedAt: null,
        lastCheckedIp: null,
        checkCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        customer: null,
      } as any);
      vi.mocked(db.license.update).mockResolvedValue({} as any);

      const req = new NextRequest("http://localhost:3000/api/v1/licenses/verify?originDomain=client.com", {
        headers: {
          authorization: `Bearer ${rawKey}`,
        },
      });
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.active).toBe(false);
      expect(data.status).toBe("SUSPENDED");
      expect(data.reason).toBe("Account suspended due to overdue invoice #INV-001.");
    });
  });
});
