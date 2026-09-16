import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock DB
const mockDb = vi.hoisted(() => ({
  companyMember: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
  },
  customer: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
  },
  passwordResetToken: {
    findUnique: vi.fn(),
    create: vi.fn(),
    deleteMany: vi.fn(),
    delete: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
  },
}));

vi.mock("~/server/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: "operator-1", email: "admin@enterprise.com", name: "Operator Admin" },
  }),
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: { GET: vi.fn(), POST: vi.fn() },
}));

vi.mock("~/server/db", () => ({
  db: mockDb,
}));

vi.mock("~/server/services/emailService", () => ({
  sendPortalInvitationEmail: vi.fn().mockResolvedValue({ success: true, messageId: "mock-portal-id" }),
  sendPasswordResetEmail: vi.fn().mockResolvedValue({ success: true, messageId: "mock-reset-id" }),
  sendInvoiceEmail: vi.fn().mockResolvedValue({ success: true, messageId: "mock-invoice-id" }),
}));

vi.mock("~/features/audit/server/auditService", () => ({
  recordAuditLog: vi.fn().mockResolvedValue({ id: "audit-1" }),
}));

import { customerRouter } from "./router";
import { sendPortalInvitationEmail } from "~/server/services/emailService";
import { recordAuditLog } from "~/features/audit/server/auditService";

describe("customerRouter Portal Access Procedures", () => {
  const company = {
    id: "company-1",
    name: "Enterprise Solutions Ltd",
    currency: "USD",
  };

  const caller = customerRouter.createCaller({
    db: mockDb as any,
    session: {
      user: { id: "operator-1", email: "admin@enterprise.com", name: "Operator Admin" },
      expires: "2099-01-01",
    } as any,
    headers: new Headers({ host: "app.example.com" }),
    company: company as any,
    companyId: company.id,
    membership: { role: "OWNER" } as any,
  } as any);

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.companyMember.findFirst.mockResolvedValue({
      id: "mem-1",
      companyId: "company-1",
      userId: "operator-1",
      role: "OWNER",
      company,
    });
    mockDb.companyMember.findUnique.mockResolvedValue({
      id: "mem-1",
      companyId: "company-1",
      userId: "operator-1",
      role: "OWNER",
      company,
    });
  });

  describe("setPortalAccess", () => {
    it("should enable portal access without a password, create client user, and dispatch invitation email", async () => {
      mockDb.customer.findUnique.mockResolvedValueOnce({
        id: "customer-100",
        companyId: "company-1",
        name: "Acme Corp",
        email: "billing@acme.com",
        clientUserId: null,
        clientUser: null,
        portalEnabled: false,
      });

      mockDb.user.findUnique.mockResolvedValueOnce(null); // No existing user
      mockDb.user.create.mockResolvedValueOnce({
        id: "user-new-1",
        email: "billing@acme.com",
        name: "Acme Corp",
        userRole: "CLIENT",
      });

      mockDb.customer.update.mockResolvedValueOnce({
        id: "customer-100",
        name: "Acme Corp",
        email: "billing@acme.com",
        portalEnabled: true,
        clientUserId: "user-new-1",
        clientUser: { id: "user-new-1", email: "billing@acme.com", name: "Acme Corp" },
      });

      const res = await caller.setPortalAccess({
        customerId: "customer-100",
        email: "billing@acme.com",
        portalEnabled: true,
        sendInviteEmail: true,
      });

      expect(res.portalEnabled).toBe(true);
      expect(res.inviteEmailSent).toBe(true);
      expect(mockDb.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: "billing@acme.com",
            userRole: "CLIENT",
            passwordHash: null,
          }),
        })
      );

      // Verify token creation
      expect(mockDb.passwordResetToken.deleteMany).toHaveBeenCalledWith({
        where: { email: "billing@acme.com" },
      });
      expect(mockDb.passwordResetToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: "billing@acme.com",
            token: expect.any(String),
          }),
        })
      );

      // Verify invitation email dispatched
      expect(sendPortalInvitationEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientEmail: "billing@acme.com",
          recipientName: "Acme Corp",
          companyName: "Enterprise Solutions Ltd",
          setupUrl: expect.stringContaining("/auth/reset-password?token="),
        })
      );

      // Verify Audit Log
      expect(recordAuditLog).toHaveBeenCalledWith(
        mockDb,
        expect.objectContaining({
          action: "BILLING_OVERRIDE",
          entityType: "CUSTOMER",
          entityId: "customer-100",
        })
      );
    });

    it("should allow disabling portal access without sending an invitation email", async () => {
      mockDb.customer.findUnique.mockResolvedValueOnce({
        id: "customer-100",
        companyId: "company-1",
        name: "Acme Corp",
        email: "billing@acme.com",
        clientUserId: "user-1",
        clientUser: { id: "user-1", email: "billing@acme.com", name: "Acme Corp" },
        portalEnabled: true,
      });

      mockDb.customer.update.mockResolvedValueOnce({
        id: "customer-100",
        name: "Acme Corp",
        email: "billing@acme.com",
        portalEnabled: false,
        clientUserId: "user-1",
        clientUser: { id: "user-1", email: "billing@acme.com", name: "Acme Corp" },
      });

      const res = await caller.setPortalAccess({
        customerId: "customer-100",
        email: "billing@acme.com",
        portalEnabled: false,
        sendInviteEmail: false,
      });

      expect(res.portalEnabled).toBe(false);
      expect(res.inviteEmailSent).toBe(false);
      expect(sendPortalInvitationEmail).not.toHaveBeenCalled();
      expect(mockDb.passwordResetToken.create).not.toHaveBeenCalled();
    });
  });

  describe("resendPortalInvitation", () => {
    it("should reject if client portal is not currently enabled", async () => {
      mockDb.customer.findUnique.mockResolvedValueOnce({
        id: "customer-200",
        companyId: "company-1",
        name: "Beta LLC",
        email: "finance@beta.com",
        portalEnabled: false,
        clientUser: null,
      });

      await expect(
        caller.resendPortalInvitation({ customerId: "customer-200" })
      ).rejects.toThrow("Client portal access must be enabled");
    });

    it("should generate a fresh token and dispatch invitation email when portal is active", async () => {
      mockDb.customer.findUnique.mockResolvedValueOnce({
        id: "customer-200",
        companyId: "company-1",
        name: "Beta LLC",
        email: "finance@beta.com",
        clientUserId: "user-beta",
        portalEnabled: true,
        clientUser: { id: "user-beta", email: "finance@beta.com", name: "Beta LLC" },
      });

      const res = await caller.resendPortalInvitation({ customerId: "customer-200" });

      expect(res.success).toBe(true);
      expect(res.message).toContain("finance@beta.com");
      expect(mockDb.passwordResetToken.deleteMany).toHaveBeenCalledWith({
        where: { email: "finance@beta.com" },
      });
      expect(mockDb.passwordResetToken.create).toHaveBeenCalled();
      expect(sendPortalInvitationEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientEmail: "finance@beta.com",
          recipientName: "Beta LLC",
        })
      );
    });
  });
});
